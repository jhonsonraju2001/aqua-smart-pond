import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Device } from '@/types/aquaculture';

interface FirebaseDevice {
  name: string;
  type: string;
  isOn: boolean;
  isAuto: boolean;
  icon: string;
  autoCondition?: string;
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

export function useFirebaseDevices(pondId: string): UseFirebaseDevicesReturn {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Map pondId to Firebase path (handle both formats)
  const firebasePondId = pondId.startsWith('pond') 
    ? pondId 
    : `pond${pondId.replace(/[^0-9]/g, '') || '1'}`;

  // Subscribe to Firebase realtime device data
  useEffect(() => {
    if (!database) {
      console.warn('Firebase database not initialized for devices');
      setFirebaseConnected(false);
      setIsLoading(false);
      return;
    }

    const devicesRef = ref(database, `ponds/${firebasePondId}/devices`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const devicesList: Device[] = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            name: value.name || key,
            type: value.type || 'aerator',
            isOn: value.isOn ?? false,
            isAuto: value.isAuto ?? false,
            icon: value.icon || 'Wind',
            autoCondition: value.autoCondition,
          }));
          
          setDevices(devicesList);
          setFirebaseConnected(true);
          setError(null);
        } else {
          // No devices in Firebase, keep empty array
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
    };

    onValue(devicesRef, handleValue, handleError);

    return () => {
      off(devicesRef);
    };
  }, [firebasePondId]);

  // Toggle device on/off state
  const toggleDevice = useCallback(async (deviceId: string) => {
    if (!database) {
      console.error('Firebase not initialized');
      return;
    }

    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device) {
        console.error('Device not found:', deviceId);
        return;
      }

      const deviceRef = ref(database, `ponds/${firebasePondId}/devices/${deviceId}`);
      await update(deviceRef, { 
        isOn: !device.isOn,
        isAuto: false, // Disable auto mode when manually toggling
        lastUpdated: Date.now()
      });
      
      console.log(`Device ${deviceId} toggled to ${!device.isOn}`);
    } catch (err) {
      console.error('Error toggling device:', err);
      setError('Failed to toggle device');
    }
  }, [devices, firebasePondId]);

  // Set device auto mode
  const setDeviceAuto = useCallback(async (deviceId: string, isAuto: boolean) => {
    if (!database) {
      console.error('Firebase not initialized');
      return;
    }

    try {
      const deviceRef = ref(database, `ponds/${firebasePondId}/devices/${deviceId}`);
      await update(deviceRef, { 
        isAuto,
        lastUpdated: Date.now()
      });
      
      console.log(`Device ${deviceId} auto mode set to ${isAuto}`);
    } catch (err) {
      console.error('Error setting device auto mode:', err);
      setError('Failed to set auto mode');
    }
  }, [firebasePondId]);

  // Set device state directly
  const setDeviceState = useCallback(async (deviceId: string, isOn: boolean) => {
    if (!database) {
      console.error('Firebase not initialized');
      return;
    }

    try {
      const deviceRef = ref(database, `ponds/${firebasePondId}/devices/${deviceId}`);
      await update(deviceRef, { 
        isOn,
        lastUpdated: Date.now()
      });
      
      console.log(`Device ${deviceId} state set to ${isOn}`);
    } catch (err) {
      console.error('Error setting device state:', err);
      setError('Failed to set device state');
    }
  }, [firebasePondId]);

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
