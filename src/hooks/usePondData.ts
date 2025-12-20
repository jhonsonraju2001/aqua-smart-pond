import { useState, useEffect, useCallback } from 'react';
import { Pond, SensorData, Device, Alert } from '@/types/aquaculture';

// Mock pond data
const mockPonds: Pond[] = [
  {
    id: 'pond-1',
    name: 'Main Pond',
    ipAddress: '192.168.1.101',
    location: 'North Field',
    fishType: 'Tilapia',
    capacity: 5000,
    status: 'online',
    lastUpdated: new Date(),
  },
  {
    id: 'pond-2',
    name: 'Breeding Pond',
    ipAddress: '192.168.1.102',
    location: 'East Wing',
    fishType: 'Catfish',
    capacity: 2000,
    status: 'warning',
    lastUpdated: new Date(),
  },
  {
    id: 'pond-3',
    name: 'Nursery Pond',
    ipAddress: '192.168.1.103',
    location: 'South Area',
    fishType: 'Fingerlings',
    capacity: 1000,
    status: 'online',
    lastUpdated: new Date(),
  },
];

const generateSensorData = (pondId: string): SensorData => {
  // Generate realistic sensor values with some variation
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

export function usePondData(userPondIds: string[]) {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Filter ponds based on user access
    const userPonds = mockPonds.filter(p => userPondIds.includes(p.id));
    setPonds(userPonds);
    setIsLoading(false);
  }, [userPondIds]);

  return { ponds, isLoading };
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
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alert-1',
      pondId: 'pond-2',
      pondName: 'Breeding Pond',
      type: 'do',
      severity: 'warning',
      message: 'Dissolved Oxygen dropped below 5.0 mg/L. Aerator activated automatically.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      acknowledged: false,
    },
    {
      id: 'alert-2',
      pondId: 'pond-1',
      pondName: 'Main Pond',
      type: 'ph',
      severity: 'info',
      message: 'pH level stabilized within safe range.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      acknowledged: true,
    },
    {
      id: 'alert-3',
      pondId: 'pond-2',
      pondName: 'Breeding Pond',
      type: 'temperature',
      severity: 'warning',
      message: 'Water temperature approaching upper limit (30°C).',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      acknowledged: false,
    },
  ]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? { ...a, acknowledged: true }
          : a
      )
    );
  };

  return { alerts, acknowledgeAlert };
}
