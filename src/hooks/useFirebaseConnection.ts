import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, goOffline, goOnline } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface FirebaseConnectionStatus {
  isConnected: boolean;
  lastSyncTime: Date | null;
  retryConnection: () => void;
}

const CACHE_KEY = 'firebase_last_sync';

export function useFirebaseConnection(): FirebaseConnectionStatus {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? new Date(parseInt(cached)) : null;
  });

  const retryConnection = useCallback(() => {
    if (!database) return;
    
    // Force reconnection by going offline then online
    goOffline(database);
    setTimeout(() => {
      goOnline(database);
    }, 500);
  }, []);

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

  return { isConnected, lastSyncTime, retryConnection };
}
