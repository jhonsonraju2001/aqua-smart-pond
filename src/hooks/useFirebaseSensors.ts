import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface FirebaseSensorData {
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  turbidity?: number;
}

export interface UseFirebaseSensorsResult {
  sensorData: FirebaseSensorData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useFirebaseSensors(pondId: string = 'pond1'): UseFirebaseSensorsResult {
  const [sensorData, setSensorData] = useState<FirebaseSensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!database) {
      setError('Firebase database not initialized');
      setIsLoading(false);
      return;
    }

    const sensorsRef = ref(database, `ponds/${pondId}/sensors`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          setSensorData({
            temperature: data.temperature ?? 0,
            ph: data.ph ?? 0,
            dissolvedOxygen: data.dissolvedOxygen ?? data.do ?? 0,
            turbidity: data.turbidity ?? undefined,
          });
          setLastUpdated(new Date());
          setError(null);
        } else {
          // No data yet, but connection is working
          setSensorData(null);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing sensor data:', err);
        setError('Failed to parse sensor data');
        setIsLoading(false);
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase sensor read error:', err);
      setError('Failed to connect to sensor data');
      setIsLoading(false);
    };

    // Subscribe to realtime updates
    onValue(sensorsRef, handleValue, handleError);

    // Cleanup subscription on unmount
    return () => {
      off(sensorsRef);
    };
  }, [pondId]);

  return { sensorData, isLoading, error, lastUpdated };
}
