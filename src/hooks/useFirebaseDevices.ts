import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Device } from '@/types/aquaculture';

interface FirebaseDeviceData {
  state: 0 | 1;
  mode: 'manual' | 'auto';
  name?: string;
  type?: string;
}

interface UseFirebaseDevicesReturn {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  firebaseConnected: boolean;
  toggleDevice: (deviceId: string) => Promise<void>;
  setDeviceAuto: (deviceId: string, isAuto: boolean) => Promise<void>;
  setDeviceState: (deviceId: string, isOn: boolean) => Promise<void>;
}

const CACHE_KEY_PREFIX = 'aqua_devices_';
const PENDING_ACTIONS_KEY = 'aqua_pending_device_actions';

interface PendingAction {
  id: string;
  pondId: string;
  deviceId: string;
  updates: Partial<FirebaseDeviceData>;
  timestamp: number;
}

function getCachedDevices(pondId: string): Device[] {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${pondId}`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function setCachedDevices(pondId: string, devices: Device[]): void {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${pondId}`, JSON.stringify(devices));
  } catch {
    // localStorage might be full or unavailable
  }
}

function getPendingActions(): PendingAction[] {
  try {
    const pending = localStorage.getItem(PENDING_ACTIONS_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch {
    return [];
  }
}

function addPendingAction(action: PendingAction): void {
  try {
    const pending = getPendingActions();
    // Replace any existing action for the same device
    const filtered = pending.filter(a => !(a.pondId === action.pondId && a.deviceId === action.deviceId));
    filtered.push(action);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage might be full or unavailable
  }
}

function removePendingAction(actionId: string): void {
  try {
    const pending = getPendingActions().filter(a => a.id !== actionId);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pending));
  } catch {
    // Ignore errors
  }
}

export function useFirebaseDevices(pondId: string, readOnly: boolean = false): UseFirebaseDevicesReturn {
  const [devices, setDevices] = useState<Device[]>(() => getCachedDevices(pondId));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const isOnlineRef = useRef(navigator.onLine);

  const firebasePondId = pondId.startsWith('pond') 
    ? pondId 
    : `pond${pondId.replace(/[^0-9]/g, '') || '1'}`;

  // Sync pending actions when coming online
  useEffect(() => {
    const syncPendingActions = async () => {
      if (!database || !navigator.onLine) return;

      const pending = getPendingActions();
      for (const action of pending) {
        try {
          const deviceRef = ref(database, `ponds/${action.pondId}/devices/${action.deviceId}`);
          await update(deviceRef, action.updates);
          removePendingAction(action.id);
          console.log(`Synced pending action for device ${action.deviceId}`);
        } catch (err) {
          console.error('Failed to sync pending action:', err);
        }
      }
    };

    const handleOnline = () => {
      isOnlineRef.current = true;
      syncPendingActions();
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync on mount if online
    if (navigator.onLine) {
      syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to Firebase realtime device data
  useEffect(() => {
    if (!database) {
      console.warn('Firebase database not initialized for devices');
      setFirebaseConnected(false);
      setIsLoading(false);
      // Use cached data
      const cached = getCachedDevices(firebasePondId);
      if (cached.length > 0) {
        setDevices(cached);
      }
      return;
    }

    const devicesRef = ref(database, `ponds/${firebasePondId}/devices`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const devicesList: Device[] = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.name || key.charAt(0).toUpperCase() + key.slice(1),
            type: value.type || key,
            isOn: value.state === 1,
            isAuto: value.mode === 'auto',
            icon: getDeviceIcon(key),
            autoCondition: value.autoCondition,
          }));
          
          setDevices(devicesList);
          setCachedDevices(firebasePondId, devicesList);
          setFirebaseConnected(true);
          setError(null);
        } else {
          setDevices([]);
          setFirebaseConnected(true);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing Firebase device data:', err);
        setError('Failed to parse device data');
        setFirebaseConnected(false);
        setIsLoading(false);
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase device read error:', err);
      setError('Failed to connect to device data');
      setFirebaseConnected(false);
      setIsLoading(false);
      // Use cached data on error
      const cached = getCachedDevices(firebasePondId);
      if (cached.length > 0) {
        setDevices(cached);
      }
    };

    onValue(devicesRef, handleValue, handleError);

    return () => {
      off(devicesRef);
    };
  }, [firebasePondId]);

  // Helper to get device icon based on type
  const getDeviceIcon = (deviceType: string): string => {
    const icons: Record<string, string> = {
      motor: 'Waves',
      aerator: 'Wind',
      light: 'Lightbulb',
      pump: 'Droplets',
      heater: 'Thermometer',
      feeder: 'Fish',
    };
    return icons[deviceType.toLowerCase()] || 'Power';
  };

  // Update device in Firebase with offline support
  const updateDevice = useCallback(async (deviceId: string, updates: Partial<FirebaseDeviceData>) => {
    if (readOnly) {
      console.warn('Device control is read-only');
      return;
    }

    if (!database) {
      console.error('Firebase not initialized');
      return;
    }

    // Optimistically update local state
    setDevices(prev => {
      const updated = prev.map(d => {
        if (d.id === deviceId) {
          return {
            ...d,
            isOn: updates.state !== undefined ? updates.state === 1 : d.isOn,
            isAuto: updates.mode !== undefined ? updates.mode === 'auto' : d.isAuto,
          };
        }
        return d;
      });
      setCachedDevices(firebasePondId, updated);
      return updated;
    });

    try {
      if (!navigator.onLine) {
        // Queue action for later sync
        addPendingAction({
          id: `${Date.now()}_${deviceId}`,
          pondId: firebasePondId,
          deviceId,
          updates,
          timestamp: Date.now(),
        });
        console.log(`Queued offline action for device ${deviceId}`);
        return;
      }

      const deviceRef = ref(database, `ponds/${firebasePondId}/devices/${deviceId}`);
      await update(deviceRef, updates);
      console.log(`Device ${deviceId} updated:`, updates);
    } catch (err) {
      console.error('Error updating device:', err);
      setError('Failed to update device');
      // Revert optimistic update on error
      const cached = getCachedDevices(firebasePondId);
      if (cached.length > 0) {
        setDevices(cached);
      }
    }
  }, [firebasePondId, readOnly]);

  // Toggle device on/off state
  const toggleDevice = useCallback(async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
      console.error('Device not found:', deviceId);
      return;
    }

    await updateDevice(deviceId, { 
      state: device.isOn ? 0 : 1,
      mode: 'manual', // Switch to manual mode when toggling
    });
  }, [devices, updateDevice]);

  // Set device auto mode
  const setDeviceAuto = useCallback(async (deviceId: string, isAuto: boolean) => {
    await updateDevice(deviceId, { 
      mode: isAuto ? 'auto' : 'manual',
    });
  }, [updateDevice]);

  // Set device state directly
  const setDeviceState = useCallback(async (deviceId: string, isOn: boolean) => {
    await updateDevice(deviceId, { 
      state: isOn ? 1 : 0,
    });
  }, [updateDevice]);

  return {
    devices,
    isLoading,
    error,
    firebaseConnected,
    toggleDevice,
    setDeviceAuto,
    setDeviceState,
  };
}
