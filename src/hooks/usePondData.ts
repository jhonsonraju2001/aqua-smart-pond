import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { Pond, SensorData, Device, Alert } from '@/types/aquaculture';
import { useFirebaseDevices } from './useFirebaseDevices';
import { useFirebaseSensors } from './useFirebaseSensors';
import { useFirebaseAlerts } from './useFirebaseAlerts';
import { useFirebasePondStatus } from './useFirebasePondStatus';

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

export function useSensorData(pondId: string, readOnly: boolean = false) {
  // Map pondId to Firebase path (handle both formats)
  const firebasePondId = pondId.startsWith('pond') ? pondId : `pond${pondId.replace(/[^0-9]/g, '') || '1'}`;

  // Use Firebase sensor hook
  const { 
    sensorData: firebaseSensorData, 
    isLoading: sensorsLoading, 
    error: sensorsError, 
    lastUpdated,
    firebaseConnected: sensorsConnected,
  } = useFirebaseSensors(firebasePondId);

  // Use Firebase devices hook with readOnly support
  const { 
    devices, 
    isLoading: devicesLoading,
    error: devicesError,
    firebaseConnected: devicesConnected,
    toggleDevice,
    setDeviceAuto,
  } = useFirebaseDevices(firebasePondId, readOnly);

  // Convert Firebase sensor data to app format
  const sensorData: SensorData | null = firebaseSensorData ? {
    ph: firebaseSensorData.ph,
    dissolvedOxygen: firebaseSensorData.dissolvedOxygen,
    temperature: firebaseSensorData.temperature,
    turbidity: firebaseSensorData.turbidity,
    timestamp: lastUpdated || new Date(),
  } : null;

  const refreshData = useCallback(() => {
    // For Firebase, data is realtime - just log refresh request
    console.log('Refresh requested - Firebase provides realtime updates');
  }, []);

  return { 
    sensorData, 
    devices, 
    isLoading: sensorsLoading || devicesLoading, 
    lastUpdated: lastUpdated || new Date(), 
    refreshData, 
    toggleDevice, 
    setDeviceAuto, 
    error: sensorsError || devicesError, 
    firebaseConnected: sensorsConnected || devicesConnected 
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
