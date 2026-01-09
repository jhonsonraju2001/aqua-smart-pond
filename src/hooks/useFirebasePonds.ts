import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export interface FirebasePond {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: Date | null;
  hasSensors: boolean;
  hasDevices: boolean;
}

const CACHE_KEY = 'firebase_ponds_cache';
const ONLINE_THRESHOLD = 30000; // 30 seconds

function loadCache(): FirebasePond[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.map((p: any) => ({
        ...p,
        lastSeen: p.lastSeen ? new Date(p.lastSeen) : null,
      }));
    }
  } catch (e) {
    console.warn('Failed to load ponds cache:', e);
  }
  return [];
}

function saveCache(ponds: FirebasePond[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ponds));
  } catch (e) {
    console.warn('Failed to save ponds cache:', e);
  }
}

export function useFirebasePonds() {
  const [ponds, setPonds] = useState<FirebasePond[]>(loadCache);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  useEffect(() => {
    if (!database) {
      setError('Firebase not initialized');
      setIsLoading(false);
      return;
    }

    const pondsRef = ref(database, 'ponds');

    const unsubscribe = onValue(
      pondsRef,
      (snapshot) => {
        setFirebaseConnected(true);
        setIsLoading(false);
        setError(null);

        if (!snapshot.exists()) {
          // No ponds in Firebase - return default pond1 placeholder
          const defaultPond: FirebasePond = {
            id: 'pond1',
            name: 'Pond 1',
            isOnline: false,
            lastSeen: null,
            hasSensors: false,
            hasDevices: false,
          };
          setPonds([defaultPond]);
          saveCache([defaultPond]);
          return;
        }

        const data = snapshot.val();
        const now = Date.now();
        const discoveredPonds: FirebasePond[] = [];

        Object.keys(data).forEach((pondId) => {
          const pondData = data[pondId];
          const lastSeenTimestamp = pondData?.lastSeen;
          const lastSeen = lastSeenTimestamp ? new Date(lastSeenTimestamp) : null;
          const isOnline = lastSeenTimestamp ? (now - lastSeenTimestamp) < ONLINE_THRESHOLD : false;

          // Generate readable name from pond ID
          const pondNumber = pondId.replace(/[^0-9]/g, '');
          const name = pondNumber ? `Pond ${pondNumber}` : pondId.charAt(0).toUpperCase() + pondId.slice(1);

          discoveredPonds.push({
            id: pondId,
            name,
            isOnline,
            lastSeen,
            hasSensors: !!pondData?.sensors,
            hasDevices: !!pondData?.devices,
          });
        });

        // Sort ponds by ID for consistent ordering
        discoveredPonds.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

        setPonds(discoveredPonds);
        saveCache(discoveredPonds);
      },
      (err) => {
        console.error('Firebase ponds error:', err);
        setError(err.message);
        setFirebaseConnected(false);
        setIsLoading(false);
        
        // Use cached data on error
        const cached = loadCache();
        if (cached.length > 0) {
          setPonds(cached);
        } else {
          // Fallback to default pond1
          setPonds([{
            id: 'pond1',
            name: 'Pond 1',
            isOnline: false,
            lastSeen: null,
            hasSensors: false,
            hasDevices: false,
          }]);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Update online status periodically (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setPonds((currentPonds) => {
        const now = Date.now();
        return currentPonds.map((pond) => ({
          ...pond,
          isOnline: pond.lastSeen ? (now - pond.lastSeen.getTime()) < ONLINE_THRESHOLD : false,
        }));
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getPondById = useCallback((pondId: string): FirebasePond | undefined => {
    return ponds.find((p) => p.id === pondId);
  }, [ponds]);

  return {
    ponds,
    isLoading,
    error,
    firebaseConnected,
    getPondById,
    pondIds: ponds.map((p) => p.id),
  };
}
