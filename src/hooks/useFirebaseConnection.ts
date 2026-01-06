import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface FirebaseConnectionStatus {
  isConnected: boolean;
  lastSyncTime: Date | null;
}

const CACHE_KEY = 'firebase_last_sync';

export function useFirebaseConnection(): FirebaseConnectionStatus {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? new Date(parseInt(cached)) : null;
  });

  useEffect(() => {
    if (!database) {
      setIsConnected(false);
      return;
    }

    // Firebase special path that indicates connection state
    const connectedRef = ref(database, '.info/connected');

    const handleValue = (snapshot: any) => {
      const connected = snapshot.val() === true;
      setIsConnected(connected);
      
      if (connected) {
        const now = new Date();
        setLastSyncTime(now);
        localStorage.setItem(CACHE_KEY, now.getTime().toString());
      }
    };

    onValue(connectedRef, handleValue);

    return () => {
      off(connectedRef);
    };
  }, []);

  return { isConnected, lastSyncTime };
}
