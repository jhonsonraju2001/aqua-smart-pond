import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface FirebaseSensorData {
  temperature: number;
  ph: number;
  do: number;
}

export interface UseFirebaseSensorsResult {
  sensorData: FirebaseSensorData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  firebaseConnected: boolean;
}

const CACHE_KEY = 'aqua_sensors_cache';

function getCachedData(): FirebaseSensorData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedData(data: FirebaseSensorData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function useFirebaseSensors(): UseFirebaseSensorsResult {
  const [sensorData, setSensorData] = useState<FirebaseSensorData | null>(() => getCachedData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const isOnlineRef = useRef(navigator.onLine);

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
      const cached = getCachedData();
      if (cached) {
        setSensorData(cached);
      }
      return;
    }

    const sensorsRef = ref(database, 'aquaculture/sensors');

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const sensors: FirebaseSensorData = {
            temperature: data.temperature ?? 0,
            ph: data.ph ?? 0,
            do: data.do ?? 0,
          };
          
          setSensorData(sensors);
          setCachedData(sensors);
          setLastUpdated(new Date());
          setFirebaseConnected(true);
          setError(null);
        } else {
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
      const cached = getCachedData();
      if (cached) {
        setSensorData(cached);
      }
    };

    onValue(sensorsRef, handleValue, handleError);

    return () => {
      off(sensorsRef);
    };
  }, []);

  return { sensorData, isLoading, error, lastUpdated, firebaseConnected };
}
