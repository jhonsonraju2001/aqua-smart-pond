import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

// Firebase sensor keys - MUST match exactly what ESP32 sends
export interface FirebaseSensorData {
  temperature: number | null;
  ph: number | null;
  dissolvedOxygen: number | null;
  turbidity: number | null;
  waterLevel: number | null;
}

export interface SensorDebugInfo {
  firebasePath: string;
  listenerStatus: 'connecting' | 'active' | 'error' | 'disconnected';
  lastDataReceived: Date | null;
  rawData: any;
  errors: string[];
}

export interface UseFirebaseSensorsResult {
  sensorData: FirebaseSensorData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  firebaseConnected: boolean;
  isStale: boolean;
  debugInfo: SensorDebugInfo;
}

// Sensor data is stale if older than 60 seconds
const STALE_THRESHOLD_MS = 60000;

// Validate sensor reading to filter invalid values
function isValidSensorValue(key: string, value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'number') return false;
  if (isNaN(value)) return false;

  switch (key) {
    case 'temperature':
      // -127 is disconnected DS18B20 sensor
      return value > -100 && value < 100;
    case 'ph':
      return value >= 0 && value <= 14;
    case 'dissolvedOxygen':
      return value >= 0 && value <= 50;
    case 'turbidity':
      return value >= 0 && value <= 5000;
    case 'waterLevel':
      return value >= 0 && value <= 1000;
    default:
      return true;
  }
}

// Parse and validate sensor data from Firebase snapshot
function parseSensorData(data: any): FirebaseSensorData {
  if (!data || typeof data !== 'object') {
    return {
      temperature: null,
      ph: null,
      dissolvedOxygen: null,
      turbidity: null,
      waterLevel: null,
    };
  }

  return {
    temperature: isValidSensorValue('temperature', data.temperature) ? Number(data.temperature) : null,
    ph: isValidSensorValue('ph', data.ph) ? Number(data.ph) : null,
    dissolvedOxygen: isValidSensorValue('dissolvedOxygen', data.dissolvedOxygen) ? Number(data.dissolvedOxygen) : null,
    turbidity: isValidSensorValue('turbidity', data.turbidity) ? Number(data.turbidity) : null,
    waterLevel: isValidSensorValue('waterLevel', data.waterLevel) ? Number(data.waterLevel) : null,
  };
}

export function useFirebaseSensors(pondId: string): UseFirebaseSensorsResult {
  const [sensorData, setSensorData] = useState<FirebaseSensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [debugInfo, setDebugInfo] = useState<SensorDebugInfo>({
    firebasePath: '',
    listenerStatus: 'connecting',
    lastDataReceived: null,
    rawData: null,
    errors: [],
  });

  const lastSeenRef = useRef<number | null>(null);
  const staleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build Firebase path - CRITICAL: must match ESP32 path exactly
  const firebasePath = `ponds/${pondId}/sensors`;

  // Check if data is stale
  const checkStaleness = useCallback(() => {
    if (lastSeenRef.current) {
      const now = Date.now();
      const age = now - lastSeenRef.current;
      setIsStale(age > STALE_THRESHOLD_MS);
    }
  }, []);

  useEffect(() => {
    if (!database) {
      const errorMsg = 'Firebase database not initialized';
      setError(errorMsg);
      setFirebaseConnected(false);
      setIsLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        firebasePath,
        listenerStatus: 'error',
        errors: [...prev.errors.slice(-4), errorMsg],
      }));
      return;
    }

    if (!pondId) {
      const errorMsg = 'No pond ID provided';
      setError(errorMsg);
      setIsLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        firebasePath: 'N/A',
        listenerStatus: 'error',
        errors: [...prev.errors.slice(-4), errorMsg],
      }));
      return;
    }

    console.log(`[Firebase Sensors] Subscribing to: ${firebasePath}`);
    
    setDebugInfo(prev => ({
      ...prev,
      firebasePath,
      listenerStatus: 'connecting',
    }));

    const sensorsRef = ref(database, firebasePath);

    // Real-time listener using onValue
    const handleValue = (snapshot: any) => {
      try {
        const rawData = snapshot.val();
        const now = new Date();
        
        console.log(`[Firebase Sensors] Data received at ${now.toISOString()}:`, rawData);

        setDebugInfo(prev => ({
          ...prev,
          listenerStatus: 'active',
          lastDataReceived: now,
          rawData,
          errors: [],
        }));

        if (rawData) {
          const parsedData = parseSensorData(rawData);
          setSensorData(parsedData);
          setLastUpdated(now);
          lastSeenRef.current = now.getTime();
          setFirebaseConnected(true);
          setError(null);
          setIsStale(false);
        } else {
          // Path exists but no data
          setSensorData(null);
          setFirebaseConnected(true);
          setError(null);
          console.log(`[Firebase Sensors] No data at path: ${firebasePath}`);
        }
        
        setIsLoading(false);
      } catch (err) {
        const errorMsg = `Error parsing sensor data: ${err}`;
        console.error('[Firebase Sensors]', errorMsg);
        setError(errorMsg);
        setFirebaseConnected(false);
        setIsLoading(false);
        setDebugInfo(prev => ({
          ...prev,
          listenerStatus: 'error',
          errors: [...prev.errors.slice(-4), errorMsg],
        }));
      }
    };

    const handleError = (err: Error) => {
      const errorMsg = `Firebase connection error: ${err.message}`;
      console.error('[Firebase Sensors]', errorMsg);
      setError(errorMsg);
      setFirebaseConnected(false);
      setIsLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        listenerStatus: 'error',
        errors: [...prev.errors.slice(-4), errorMsg],
      }));
    };

    // Subscribe to real-time updates
    const unsubscribe = onValue(sensorsRef, handleValue, handleError);

    // Set up staleness check interval
    staleCheckIntervalRef.current = setInterval(checkStaleness, 5000);

    // Cleanup
    return () => {
      console.log(`[Firebase Sensors] Unsubscribing from: ${firebasePath}`);
      unsubscribe();
      setDebugInfo(prev => ({
        ...prev,
        listenerStatus: 'disconnected',
      }));
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current);
      }
    };
  }, [pondId, firebasePath, checkStaleness]);

  // Also listen to lastSeen for staleness detection
  useEffect(() => {
    if (!database || !pondId) return;

    const lastSeenPath = `ponds/${pondId}/status/lastSeen`;
    const lastSeenDbRef = ref(database, lastSeenPath);

    const handleLastSeen = (snapshot: any) => {
      const timestamp = snapshot.val();
      if (timestamp) {
        lastSeenRef.current = timestamp;
        checkStaleness();
      }
    };

    const unsubscribe = onValue(lastSeenDbRef, handleLastSeen, () => {});

    return () => unsubscribe();
  }, [pondId, checkStaleness]);

  return { 
    sensorData, 
    isLoading, 
    error, 
    lastUpdated, 
    firebaseConnected,
    isStale,
    debugInfo,
  };
}
