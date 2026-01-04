import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { Pond, SensorData, Device, Alert } from '@/types/aquaculture';
import { useFirebaseDevices } from './useFirebaseDevices';

// Fallback mock data generator for when Firebase is unavailable
const generateFallbackSensorData = (pondId: string): SensorData => {
  const baseValues = {
    'pond-1': { ph: 7.2, do: 6.5, temp: 28 },
    'pond-2': { ph: 6.8, do: 4.2, temp: 30 },
    'pond-3': { ph: 7.5, do: 7.0, temp: 26 },
  };
  
  const base = baseValues[pondId as keyof typeof baseValues] || { ph: 7.0, do: 5.5, temp: 27 };
  
  return {
    ph: +(base.ph + (Math.random() - 0.5) * 0.4).toFixed(2),
    dissolvedOxygen: +(base.do + (Math.random() - 0.5) * 0.8).toFixed(2),
    temperature: +(base.temp + (Math.random() - 0.5) * 1).toFixed(1),
    timestamp: new Date(),
  };
};

const getDevicesForPond = (pondId: string, sensorData: SensorData): Device[] => {
  const isLowDO = sensorData.dissolvedOxygen < 5.0;
  const isCritical = sensorData.dissolvedOxygen < 3.0 || sensorData.ph < 6.0 || sensorData.ph > 9.0;
  
  return [
    {
      id: `${pondId}-aerator`,
      name: 'Aerator',
      type: 'aerator',
      isOn: isLowDO,
      isAuto: true,
      icon: 'Wind',
      autoCondition: 'DO < 5.0 mg/L',
    },
    {
      id: `${pondId}-pump`,
      name: 'Water Pump',
      type: 'pump',
      isOn: false,
      isAuto: false,
      icon: 'Droplets',
    },
    {
      id: `${pondId}-lights`,
      name: 'Lights',
      type: 'lights',
      isOn: false,
      isAuto: false,
      icon: 'Lightbulb',
    },
    {
      id: `${pondId}-buzzer`,
      name: 'Buzzer',
      type: 'buzzer',
      isOn: isCritical,
      isAuto: true,
      icon: 'Bell',
      autoCondition: 'Critical alerts',
    },
  ];
};

// Heartbeat timeout in milliseconds (60 seconds)
const HEARTBEAT_TIMEOUT_MS = 60000;

export function usePondData() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pondStatuses, setPondStatuses] = useState<Record<string, { isOnline: boolean; lastSeen: Date | null }>>({});

  const fetchPonds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('ponds')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const mappedPonds: Pond[] = (data || []).map(pond => ({
        id: pond.id,
        name: pond.name,
        ipAddress: pond.device_ip,
        location: pond.location || undefined,
        status: pondStatuses[pond.id]?.isOnline ? 'online' : 'offline',
        lastUpdated: pondStatuses[pond.id]?.lastSeen || new Date(pond.updated_at),
      }));

      setPonds(mappedPonds);
    } catch (err) {
      console.error('Error fetching ponds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ponds');
    } finally {
      setIsLoading(false);
    }
  }, [pondStatuses]);

  // Subscribe to Firebase lastSeen for all ponds
  useEffect(() => {
    if (!database) return;

    const pondsRef = ref(database, 'ponds');
    
    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const statuses: Record<string, { isOnline: boolean; lastSeen: Date | null }> = {};
        Object.keys(data).forEach(pondKey => {
          const lastSeenTs = data[pondKey]?.lastSeen;
          if (lastSeenTs) {
            const lastSeenDate = new Date(lastSeenTs);
            const timeSinceLastSeen = Date.now() - lastSeenDate.getTime();
            statuses[pondKey] = {
              isOnline: timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS,
              lastSeen: lastSeenDate,
            };
          }
        });
        setPondStatuses(statuses);
      }
    };

    onValue(pondsRef, handleValue, (err) => {
      console.error('Firebase pond status error:', err);
    });

    return () => {
      off(pondsRef);
    };
  }, []);

  useEffect(() => {
    fetchPonds();
  }, [fetchPonds]);

  // Update pond statuses periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setPondStatuses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(pondId => {
          if (updated[pondId].lastSeen) {
            const timeSinceLastSeen = Date.now() - updated[pondId].lastSeen!.getTime();
            updated[pondId] = {
              ...updated[pondId],
              isOnline: timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS,
            };
          }
        });
        return updated;
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  return { ponds, isLoading, error, refetch: fetchPonds };
}

export function useSensorData(pondId: string, refreshInterval = 5000) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [localDevices, setLocalDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Firebase devices hook for real-time device control
  const { 
    devices: firebaseDevices, 
    isLoading: devicesLoading,
    firebaseConnected: devicesFirebaseConnected,
    toggleDevice: firebaseToggleDevice,
    setDeviceAuto: firebaseSetDeviceAuto,
  } = useFirebaseDevices(pondId);

  // Map pondId to Firebase path (handle both formats)
  const firebasePondId = pondId.startsWith('pond') ? pondId : `pond${pondId.replace(/[^0-9]/g, '') || '1'}`;

  // Subscribe to Firebase realtime sensor data
  useEffect(() => {
    if (!database) {
      console.warn('Firebase database not initialized, using fallback data');
      setFirebaseConnected(false);
      return;
    }

    const sensorsRef = ref(database, `ponds/${firebasePondId}/sensors`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const newSensorData: SensorData = {
            ph: data.ph ?? data.pH ?? 0,
            dissolvedOxygen: data.dissolvedOxygen ?? data.do ?? data.DO ?? 0,
            temperature: data.temperature ?? data.temp ?? 0,
            timestamp: new Date(),
          };
          setSensorData(newSensorData);
          // Only use local devices as fallback if Firebase devices not connected
          if (!devicesFirebaseConnected) {
            setLocalDevices(getDevicesForPond(pondId, newSensorData));
          }
          setLastUpdated(new Date());
          setFirebaseConnected(true);
          setError(null);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing Firebase sensor data:', err);
        setError('Failed to parse sensor data');
        setFirebaseConnected(false);
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase sensor read error:', err);
      setError('Failed to connect to sensor data');
      setFirebaseConnected(false);
      setIsLoading(false);
    };

    onValue(sensorsRef, handleValue, handleError);

    return () => {
      off(sensorsRef);
    };
  }, [pondId, firebasePondId, devicesFirebaseConnected]);

  // Fallback to mock data if Firebase not connected
  useEffect(() => {
    if (firebaseConnected) return;

    const refreshData = () => {
      const newData = generateFallbackSensorData(pondId);
      setSensorData(newData);
      if (!devicesFirebaseConnected) {
        setLocalDevices(getDevicesForPond(pondId, newData));
      }
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [pondId, refreshInterval, firebaseConnected, devicesFirebaseConnected]);

  const refreshData = useCallback(() => {
    // For Firebase, data is realtime so just update timestamp
    if (firebaseConnected) {
      setLastUpdated(new Date());
    } else {
      const newData = generateFallbackSensorData(pondId);
      setSensorData(newData);
      if (!devicesFirebaseConnected) {
        setLocalDevices(getDevicesForPond(pondId, newData));
      }
      setLastUpdated(new Date());
    }
  }, [pondId, firebaseConnected, devicesFirebaseConnected]);

  // Use Firebase devices if connected, otherwise use local fallback
  const devices = devicesFirebaseConnected && firebaseDevices.length > 0 
    ? firebaseDevices 
    : localDevices;

  // Toggle device - use Firebase if connected
  const toggleDevice = useCallback((deviceId: string) => {
    if (devicesFirebaseConnected) {
      firebaseToggleDevice(deviceId);
    } else {
      setLocalDevices(prev => 
        prev.map(d => 
          d.id === deviceId 
            ? { ...d, isOn: !d.isOn, isAuto: false }
            : d
        )
      );
    }
  }, [devicesFirebaseConnected, firebaseToggleDevice]);

  // Set device auto mode - use Firebase if connected
  const setDeviceAuto = useCallback((deviceId: string, isAuto: boolean) => {
    if (devicesFirebaseConnected) {
      firebaseSetDeviceAuto(deviceId, isAuto);
    } else {
      setLocalDevices(prev =>
        prev.map(d =>
          d.id === deviceId
            ? { ...d, isAuto }
            : d
        )
      );
    }
  }, [devicesFirebaseConnected, firebaseSetDeviceAuto]);

  return { 
    sensorData, 
    devices, 
    isLoading: isLoading || devicesLoading, 
    lastUpdated, 
    refreshData, 
    toggleDevice, 
    setDeviceAuto, 
    error, 
    firebaseConnected: firebaseConnected || devicesFirebaseConnected 
  };
}

export function useAlerts(pondIdFilter?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [firebaseAlerts, setFirebaseAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Map pondId to Firebase path
  const firebasePondId = pondIdFilter 
    ? (pondIdFilter.startsWith('pond') ? pondIdFilter : `pond${pondIdFilter.replace(/[^0-9]/g, '') || '1'}`)
    : 'pond1';

  // Subscribe to Firebase realtime alerts
  useEffect(() => {
    if (!database) {
      setFirebaseConnected(false);
      return;
    }

    const alertsRef = ref(database, `ponds/${firebasePondId}/alerts`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const alertsList: Alert[] = Object.entries(data).map(([key, value]: [string, any]) => ({
            id: key,
            pondId: pondIdFilter || firebasePondId,
            pondName: value.pondName || 'Pond 1',
            type: (value.type || 'sensor') as Alert['type'],
            message: value.message || 'Alert triggered',
            severity: (value.severity || 'warning') as Alert['severity'],
            timestamp: new Date(value.timestamp || Date.now()),
            acknowledged: value.acknowledged || false,
          }));
          
          // Sort by timestamp, newest first
          alertsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setFirebaseAlerts(alertsList);
          setFirebaseConnected(true);
        } else {
          setFirebaseAlerts([]);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing Firebase alerts:', err);
        setFirebaseConnected(false);
      }
    };

    const handleError = (err: Error) => {
      console.error('Firebase alerts error:', err);
      setFirebaseConnected(false);
      setIsLoading(false);
    };

    onValue(alertsRef, handleValue, handleError);

    return () => {
      off(alertsRef);
    };
  }, [pondIdFilter, firebasePondId]);

  // Also fetch from Supabase for persistence
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          ponds(name)
        `)
        .eq('is_active', true)
        .order('triggered_at', { ascending: false });

      if (error) throw error;

      const mappedAlerts: Alert[] = (data || []).map(alert => ({
        id: alert.id,
        pondId: alert.pond_id,
        pondName: (alert.ponds as { name: string } | null)?.name || 'Unknown Pond',
        type: alert.type as Alert['type'],
        severity: alert.severity as Alert['severity'],
        message: alert.message,
        timestamp: new Date(alert.triggered_at),
        acknowledged: !alert.is_active,
      }));

      setAlerts(mappedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Combine Firebase and Supabase alerts, preferring Firebase for realtime
  const combinedAlerts = firebaseConnected ? [...firebaseAlerts, ...alerts.filter(a => 
    !firebaseAlerts.some(fa => fa.id === a.id)
  )] : alerts;

  const acknowledgeAlert = async (alertId: string) => {
    // Update Firebase alert if connected
    if (database && firebaseConnected) {
      try {
        const { update } = await import('firebase/database');
        const alertRef = ref(database, `ponds/${firebasePondId}/alerts/${alertId}`);
        await update(alertRef, { acknowledged: true });
      } catch (err) {
        console.error('Error acknowledging Firebase alert:', err);
      }
    }

    // Also update Supabase
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: false, resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId
            ? { ...a, acknowledged: true }
            : a
        )
      );
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  return { alerts: combinedAlerts, isLoading, acknowledgeAlert, refetch: fetchAlerts, firebaseConnected };
}

// Admin hooks for fetching all data
export function useAdminData() {
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    pondCount: number;
    status: string;
  }>>([]);
  const [allPonds, setAllPonds] = useState<Array<{
    id: string;
    name: string;
    ip: string;
    status: string;
    userName: string;
  }>>([]);
  const [systemAlerts, setSystemAlerts] = useState<Array<{
    id: string;
    message: string;
    time: string;
    severity: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all ponds (admin RLS allows this)
      const { data: pondsData, error: pondsError } = await supabase
        .from('ponds')
        .select('*')
        .order('created_at', { ascending: false });

      if (pondsError) throw pondsError;

      // Fetch all profiles (admin RLS allows this)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch all alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*, ponds(name)')
        .order('triggered_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      // Map profiles with roles and pond counts
      const pondsByUser = (pondsData || []).reduce((acc, pond) => {
        acc[pond.user_id] = (acc[pond.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const rolesByUser = (rolesData || []).reduce((acc, role) => {
        acc[role.user_id] = role.role;
        return acc;
      }, {} as Record<string, string>);

      const mappedUsers = (profilesData || []).map(profile => ({
        id: profile.user_id,
        name: profile.full_name || 'Unknown',
        email: profile.user_id, // We don't have email in profiles
        role: rolesByUser[profile.user_id] || 'user',
        pondCount: pondsByUser[profile.user_id] || 0,
        status: 'active',
      }));

      const mappedPonds = (pondsData || []).map(pond => {
        const ownerProfile = (profilesData || []).find(p => p.user_id === pond.user_id);
        return {
          id: pond.id,
          name: pond.name,
          ip: pond.device_ip,
          status: 'online',
          userName: ownerProfile?.full_name || 'Unknown',
        };
      });

      const mappedAlerts = (alertsData || []).map(alert => ({
        id: alert.id,
        message: alert.message,
        time: formatTimeAgo(new Date(alert.triggered_at)),
        severity: alert.severity,
      }));

      setUsers(mappedUsers);
      setAllPonds(mappedPonds);
      setSystemAlerts(mappedAlerts);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return { users, allPonds, systemAlerts, isLoading, error, refetch: fetchAdminData };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}
