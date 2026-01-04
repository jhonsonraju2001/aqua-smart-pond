import { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Alert } from '@/types/aquaculture';

export interface FirebaseAlert {
  id: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  acknowledged?: boolean;
  pondName?: string;
}

export interface UseFirebaseAlertsResult {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

export function useFirebaseAlerts(pondId: string = 'pond1', pondName: string = 'Pond 1'): UseFirebaseAlertsResult {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!database) {
      setError('Firebase database not initialized');
      setIsLoading(false);
      return;
    }

    const alertsRef = ref(database, `ponds/${pondId}/alerts`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const alertsList: Alert[] = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            pondId: pondId,
            pondName: value.pondName || pondName,
            type: value.type || 'sensor',
            message: value.message || 'Alert triggered',
            severity: value.severity || 'warning',
            timestamp: new Date(value.timestamp || Date.now()),
            acknowledged: value.acknowledged || false,
          }));
          
          // Sort by timestamp, newest first
          alertsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setAlerts(alertsList);
          setError(null);
        } else {
          setAlerts([]);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing alerts data:', err);
        setError('Failed to parse alerts');
        setIsLoading(false);
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase alerts read error:', err);
      setError('Failed to connect to alerts');
      setIsLoading(false);
    };

    onValue(alertsRef, handleValue, handleError);

    return () => {
      off(alertsRef);
    };
  }, [pondId, pondName]);

  const acknowledgeAlert = async (alertId: string) => {
    if (!database) {
      throw new Error('Firebase database not initialized');
    }

    try {
      const alertRef = ref(database, `ponds/${pondId}/alerts/${alertId}`);
      await update(alertRef, { acknowledged: true });
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  };

  return { alerts, isLoading, error, acknowledgeAlert };
}
