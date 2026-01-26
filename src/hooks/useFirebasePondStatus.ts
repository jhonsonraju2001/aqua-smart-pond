import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface PondStatus {
  isOnline: boolean;
  lastSeen: Date | null;
  connectionError: string | null;
}

// Consider device offline if no heartbeat in last 15 seconds (reduced from 30)
const HEARTBEAT_TIMEOUT_MS = 15000;
// Device is definitely online if seen within 10 seconds
const ONLINE_THRESHOLD_MS = 10000;

export function useFirebasePondStatus(pondId: string = 'pond1'): PondStatus {
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!database) {
      setConnectionError('Firebase database not initialized');
      return;
    }

    // Listen to both lastSeen and status/online
    const lastSeenRef = ref(database, `ponds/${pondId}/lastSeen`);
    const onlineRef = ref(database, `ponds/${pondId}/status/online`);

    let deviceReportedOnline = false;
    let lastSeenTime: Date | null = null;

    const checkOnlineStatus = () => {
      if (deviceReportedOnline) {
        // Device explicitly reported online
        setIsOnline(true);
        return;
      }

      if (lastSeenTime) {
        const now = Date.now();
        const timeSinceLastSeen = now - lastSeenTime.getTime();
        
        // Online if seen within threshold
        if (timeSinceLastSeen < ONLINE_THRESHOLD_MS) {
          setIsOnline(true);
        } else if (timeSinceLastSeen >= HEARTBEAT_TIMEOUT_MS) {
          // Offline only if heartbeat missing > 15 seconds
          setIsOnline(false);
        }
      }
    };

    const handleLastSeen = (snapshot: any) => {
      try {
        const timestamp = snapshot.val();
        if (timestamp) {
          lastSeenTime = new Date(timestamp);
          setLastSeen(lastSeenTime);
          setConnectionError(null);
          checkOnlineStatus();
        } else {
          setLastSeen(null);
          setIsOnline(false);
        }
      } catch (err) {
        console.error('Error parsing status:', err);
        setConnectionError('Failed to parse device status');
      }
    };

    const handleOnlineStatus = (snapshot: any) => {
      deviceReportedOnline = snapshot.val() === true;
      checkOnlineStatus();
    };

    const handleError = (err: Error) => {
      console.error('Firebase status error:', err);
      setConnectionError('Failed to connect to device status');
      setIsOnline(false);
    };

    onValue(lastSeenRef, handleLastSeen, handleError);
    onValue(onlineRef, handleOnlineStatus, handleError);

    // Set up interval to check if device went offline
    const intervalId = setInterval(() => {
      checkOnlineStatus();
    }, 3000); // Check every 3 seconds

    return () => {
      off(lastSeenRef);
      off(onlineRef);
      clearInterval(intervalId);
    };
  }, [pondId]);

  return { isOnline, lastSeen, connectionError };
}
