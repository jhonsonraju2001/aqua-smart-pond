import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface FirebaseSensorData {
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  turbidity: number;
}

export interface UseFirebaseSensorsResult {
  sensorData: FirebaseSensorData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  firebaseConnected: boolean;
}

const CACHE_KEY_PREFIX = 'aqua_sensors_';

function getCachedData(pondId: string): FirebaseSensorData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${pondId}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedData(pondId: string, data: FirebaseSensorData): void {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${pondId}`, JSON.stringify(data));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function useFirebaseSensors(pondId: string = 'pond1'): UseFirebaseSensorsResult {
  const [sensorData, setSensorData] = useState<FirebaseSensorData | null>(() => getCachedData(pondId));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const isOnlineRef = useRef(navigator.onLine);

  const firebasePondId = pondId.startsWith('pond') 
    ? pondId 
    : `pond${pondId.replace(/[^0-9]/g, '') || '1'}`;

  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

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
      // Use cached data if available
      const cached = getCachedData(firebasePondId);
      if (cached) {
        setSensorData(cached);
      }
      return;
    }

    const sensorsRef = ref(database, `ponds/${firebasePondId}/sensors`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const sensors: FirebaseSensorData = {
            temperature: data.temperature ?? 0,
            ph: data.ph ?? 0,
            dissolvedOxygen: data.dissolvedOxygen ?? 0,
            turbidity: data.turbidity ?? 0,
          };
          
          setSensorData(sensors);
          setCachedData(firebasePondId, sensors);
          setLastUpdated(new Date());
          setFirebaseConnected(true);
          setError(null);
        } else {
          // No data yet, but connection is working
          setSensorData(null);
          setFirebaseConnected(true);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing sensor data:', err);
        setError('Failed to parse sensor data');
        setFirebaseConnected(false);
        setIsLoading(false);
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase sensor read error:', err);
      setError('Failed to connect to sensor data');
      setFirebaseConnected(false);
      setIsLoading(false);
      // Use cached data on error
      const cached = getCachedData(firebasePondId);
      if (cached) {
        setSensorData(cached);
      }
    };

    // Subscribe to realtime updates
    onValue(sensorsRef, handleValue, handleError);

    // Cleanup subscription on unmount
    return () => {
      off(sensorsRef);
    };
  }, [firebasePondId]);

  return { sensorData, isLoading, error, lastUpdated, firebaseConnected };
}
