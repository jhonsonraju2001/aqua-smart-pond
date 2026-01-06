import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface PondStatus {
  isOnline: boolean;
  lastSeen: Date | null;
  connectionError: string | null;
}

// Consider device offline if no heartbeat in last 15 seconds
const HEARTBEAT_TIMEOUT_MS = 15000;

export function useFirebasePondStatus(): PondStatus {
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!database) {
      setConnectionError('Firebase database not initialized');
      return;
    }

    const statusRef = ref(database, 'aquaculture/status');

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const timestamp = data.lastSeen;
          if (timestamp) {
            const lastSeenDate = new Date(timestamp);
            setLastSeen(lastSeenDate);
            
            // Check if device is online based on heartbeat
            const now = Date.now();
            const timeSinceLastSeen = now - lastSeenDate.getTime();
            setIsOnline(timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS);
          } else if (data.online !== undefined) {
            // Fallback to online boolean if lastSeen not available
            setIsOnline(data.online === true);
          }
          setConnectionError(null);
        } else {
          setLastSeen(null);
          setIsOnline(false);
        }
      } catch (err) {
        console.error('Error parsing status:', err);
        setConnectionError('Failed to parse device status');
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase status error:', err);
      setConnectionError('Failed to connect to device status');
      setIsOnline(false);
    };

    onValue(statusRef, handleValue, handleError);

    // Set up interval to check if device went offline
    const intervalId = setInterval(() => {
      if (lastSeen) {
        const now = Date.now();
        const timeSinceLastSeen = now - lastSeen.getTime();
        setIsOnline(timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      off(statusRef);
      clearInterval(intervalId);
    };
  }, [lastSeen]);

  return { isOnline, lastSeen, connectionError };
}
