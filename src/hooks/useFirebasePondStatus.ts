import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface PondStatus {
  isOnline: boolean;
  lastSeen: Date | null;
  connectionError: string | null;
}

// Consider pond offline if no heartbeat in last 60 seconds
const HEARTBEAT_TIMEOUT_MS = 60000;

export function useFirebasePondStatus(pondId: string = 'pond1'): PondStatus {
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!database) {
      setConnectionError('Firebase database not initialized');
      return;
    }

    const lastSeenRef = ref(database, `ponds/${pondId}/lastSeen`);

    const handleValue = (snapshot: any) => {
      try {
        const timestamp = snapshot.val();
        if (timestamp) {
          const lastSeenDate = new Date(timestamp);
          setLastSeen(lastSeenDate);
          
          // Check if pond is online based on heartbeat
          const now = Date.now();
          const timeSinceLastSeen = now - lastSeenDate.getTime();
          setIsOnline(timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS);
          setConnectionError(null);
        } else {
          setLastSeen(null);
          setIsOnline(false);
        }
      } catch (err) {
        console.error('Error parsing lastSeen:', err);
        setConnectionError('Failed to parse pond status');
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase pond status error:', err);
      setConnectionError('Failed to connect to pond status');
      setIsOnline(false);
    };

    onValue(lastSeenRef, handleValue, handleError);

    // Set up interval to check if pond went offline
    const intervalId = setInterval(() => {
      if (lastSeen) {
        const now = Date.now();
        const timeSinceLastSeen = now - lastSeen.getTime();
        setIsOnline(timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      off(lastSeenRef);
      clearInterval(intervalId);
    };
  }, [pondId, lastSeen]);

  return { isOnline, lastSeen, connectionError };
}
