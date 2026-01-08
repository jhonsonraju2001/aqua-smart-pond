import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, off, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Device } from '@/types/aquaculture';

interface UseFirebaseDevicesReturn {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  firebaseConnected: boolean;
  pendingActionsCount: number;
  toggleDevice: (deviceId: string) => Promise<void>;
  setDeviceAuto: (deviceId: string, isAuto: boolean) => Promise<void>;
}

const CACHE_KEY = 'aqua_devices_cache';
const PENDING_ACTIONS_KEY = 'aqua_pending_device_actions';

interface PendingAction {
  id: string;
  deviceId: string;
  value: 0 | 1;
  timestamp: number;
}

function getCachedDevices(): Device[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function setCachedDevices(devices: Device[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(devices));
  } catch {
    // localStorage might be full
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
    const filtered = pending.filter(a => a.deviceId !== action.deviceId);
    filtered.push(action);
    localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage might be full
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

const deviceConfig: Record<string, { name: string; icon: string; autoCondition?: string }> = {
  motor: { name: 'Water Pump', icon: 'Droplets', autoCondition: 'When water level is low' },
  aerator: { name: 'Aerator', icon: 'Wind', autoCondition: 'When DO < 5.0 mg/L' },
  light: { name: 'Lights', icon: 'Lightbulb', autoCondition: 'Scheduled lighting' },
};

export function useFirebaseDevices(readOnly: boolean = false): UseFirebaseDevicesReturn {
  const [devices, setDevices] = useState<Device[]>(() => getCachedDevices());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [pendingActionsCount, setPendingActionsCount] = useState(() => getPendingActions().length);
  const isOnlineRef = useRef(navigator.onLine);

  // Sync pending actions when coming online
  useEffect(() => {
    const syncPendingActions = async () => {
      if (!database || !navigator.onLine) return;

      const pending = getPendingActions();
      for (const action of pending) {
        try {
          const deviceRef = ref(database, `aquaculture/ponds/pond_001/control/${action.deviceId}`);
          await set(deviceRef, action.value);
          removePendingAction(action.id);
          setPendingActionsCount(getPendingActions().length);
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

    if (navigator.onLine) {
      syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!database) {
      setError('Firebase database not initialized');
      setFirebaseConnected(false);
      setIsLoading(false);
      return;
    }

    const controlRef = ref(database, 'aquaculture/ponds/pond_001/control');

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const deviceList: Device[] = Object.entries(data).map(([key, value]: [string, any]) => {
            const config = deviceConfig[key] || { name: key, icon: 'Wind' };
            // Value can be just 0|1 or an object with state/mode
            const state = typeof value === 'object' ? value.state : value;
            const mode = typeof value === 'object' ? value.mode : 'manual';
            
            return {
              id: key,
              name: config.name,
              type: key,
              isOn: state === 1,
              isAuto: mode === 'auto',
              icon: config.icon,
              autoCondition: config.autoCondition,
            };
          });
          
          setDevices(deviceList);
          setCachedDevices(deviceList);
          setFirebaseConnected(true);
          setError(null);
        } else {
          // Initialize with default devices if no data
          const defaultDevices: Device[] = [
            { id: 'motor', name: 'Water Pump', type: 'motor', isOn: false, isAuto: false, icon: 'Droplets', autoCondition: 'When water level is low' },
            { id: 'aerator', name: 'Aerator', type: 'aerator', isOn: false, isAuto: false, icon: 'Wind', autoCondition: 'When DO < 5.0 mg/L' },
            { id: 'light', name: 'Lights', type: 'light', isOn: false, isAuto: false, icon: 'Lightbulb', autoCondition: 'Scheduled lighting' },
          ];
          setDevices(defaultDevices);
          setFirebaseConnected(true);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing device data:', err);
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
      const cached = getCachedDevices();
      if (cached.length > 0) {
        setDevices(cached);
      }
    };

    onValue(controlRef, handleValue, handleError);

    return () => {
      off(controlRef);
    };
  }, []);

  const toggleDevice = useCallback(async (deviceId: string) => {
    if (readOnly || !database) {
      console.log('Device control is read-only or Firebase not connected');
      return;
    }

    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device) return;

      const newState: 0 | 1 = device.isOn ? 0 : 1;
      
      // Optimistic update
      setDevices(prev => {
        const updated = prev.map(d => 
          d.id === deviceId ? { ...d, isOn: newState === 1 } : d
        );
        setCachedDevices(updated);
        return updated;
      });

      if (!navigator.onLine) {
        addPendingAction({
          id: `${Date.now()}_${deviceId}`,
          deviceId,
          value: newState,
          timestamp: Date.now(),
        });
        setPendingActionsCount(getPendingActions().length);
        console.log(`Queued offline action for device ${deviceId}`);
        return;
      }

      const deviceRef = ref(database, `aquaculture/ponds/pond_001/control/${deviceId}`);
      await set(deviceRef, newState);
    } catch (err) {
      console.error('Error toggling device:', err);
      setError('Failed to toggle device');
    }
  }, [devices, readOnly]);

  const setDeviceAuto = useCallback(async (deviceId: string, isAuto: boolean) => {
    if (readOnly) {
      console.log('Device control is read-only');
      return;
    }

    // Update local state only (auto mode is UI-only for this structure)
    setDevices(prev => {
      const updated = prev.map(d => 
        d.id === deviceId ? { ...d, isAuto } : d
      );
      setCachedDevices(updated);
      return updated;
    });
  }, [readOnly]);

  return { devices, isLoading, error, firebaseConnected, pendingActionsCount, toggleDevice, setDeviceAuto };
}
