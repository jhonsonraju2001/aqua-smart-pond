import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pond, SensorData, Device, Alert } from '@/types/aquaculture';

// Generate sensor data - will be replaced with real data later
const generateSensorData = (pondId: string): SensorData => {
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

export function usePondData() {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        status: 'online' as const,
        lastUpdated: new Date(pond.updated_at),
      }));

      setPonds(mappedPonds);
    } catch (err) {
      console.error('Error fetching ponds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch ponds');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPonds();
  }, [fetchPonds]);

  return { ponds, isLoading, error, refetch: fetchPonds };
}

export function useSensorData(pondId: string, refreshInterval = 5000) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refreshData = useCallback(() => {
    const newData = generateSensorData(pondId);
    setSensorData(newData);
    setDevices(getDevicesForPond(pondId, newData));
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [pondId]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const toggleDevice = (deviceId: string) => {
    setDevices(prev => 
      prev.map(d => 
        d.id === deviceId 
          ? { ...d, isOn: !d.isOn, isAuto: false }
          : d
      )
    );
  };

  const setDeviceAuto = (deviceId: string, isAuto: boolean) => {
    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId
          ? { ...d, isAuto }
          : d
      )
    );
  };

  return { sensorData, devices, isLoading, lastUpdated, refreshData, toggleDevice, setDeviceAuto };
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const acknowledgeAlert = async (alertId: string) => {
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

  return { alerts, isLoading, acknowledgeAlert, refetch: fetchAlerts };
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
