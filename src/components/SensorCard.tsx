import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Thermometer, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HeartbeatLine } from './sensors/HeartbeatLine';
import { WaveBackground } from './sensors/WaveBackground';
import { PulseValue } from './sensors/PulseValue';
import { useSensorAlerts } from '@/hooks/useSensorAlerts';

interface SensorCardProps {
  type: 'ph' | 'do' | 'temperature';
  value: number;
  className?: string;
}

const sensorConfig = {
  ph: {
    label: 'pH Level',
    unit: 'pH',
    icon: FlaskConical,
    min: 6.5,
    max: 8.5,
    decimals: 2,
    getStatus: (value: number): 'safe' | 'warning' | 'critical' => {
      if (value >= 6.5 && value <= 8.5) return 'safe';
      if (value >= 6.0 && value <= 9.0) return 'warning';
      return 'critical';
    },
  },
  do: {
    label: 'Dissolved O₂',
    unit: 'mg/L',
    icon: Droplets,
    min: 5.0,
    max: 14.0,
    decimals: 2,
    getStatus: (value: number): 'safe' | 'warning' | 'critical' => {
      if (value >= 5.0) return 'safe';
      if (value >= 3.0) return 'warning';
      return 'critical';
    },
  },
  temperature: {
    label: 'Temperature',
    unit: '°C',
    icon: Thermometer,
    min: 24,
    max: 32,
    decimals: 1,
    getStatus: (value: number): 'safe' | 'warning' | 'critical' => {
      if (value >= 24 && value <= 32) return 'safe';
      if (value >= 20 && value <= 35) return 'warning';
      return 'critical';
    },
  },
};

export function SensorCard({ type, value, className }: SensorCardProps) {
  const config = sensorConfig[type];
  const status = config.getStatus(value);
  const Icon = config.icon;
  const [isUpdating, setIsUpdating] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Enable sound/vibration alerts
  useSensorAlerts(status);

  // Trigger update animation when value changes
  useEffect(() => {
    if (value !== prevValue) {
      setIsUpdating(true);
      setPrevValue(value);
      const timer = setTimeout(() => setIsUpdating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const statusBgColors = {
    safe: 'bg-status-safe/10',
    warning: 'bg-status-warning/10',
    critical: 'bg-status-critical/10',
  };

  const statusBorderColors = {
    safe: 'border-status-safe/30',
    warning: 'border-status-warning/50',
    critical: 'border-status-critical/60',
  };

  const statusGradients = {
    safe: 'from-status-safe/5 via-transparent to-transparent',
    warning: 'from-status-warning/10 via-status-warning/5 to-transparent',
    critical: 'from-status-critical/15 via-status-critical/5 to-transparent',
  };

  const statusLabels = {
    safe: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
  };

  const statusColors = {
    safe: 'text-status-safe',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-2 transition-all duration-500 backdrop-blur-sm',
          statusBorderColors[status],
          status === 'critical' && 'animate-[pulse_1s_ease-in-out_infinite]',
          className
        )}
      >
        {/* Gradient overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br pointer-events-none',
          statusGradients[status]
        )} />

        {/* Wave background */}
        <WaveBackground status={status} />

        <CardContent className="relative p-6 min-h-[180px]">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            {/* Icon with pulse effect */}
            <motion.div 
              className={cn('p-3 rounded-2xl backdrop-blur-sm', statusBgColors[status])}
              animate={status !== 'safe' ? {
                scale: [1, 1.1, 1],
                rotate: [0, -3, 3, 0],
              } : {}}
              transition={{
                duration: status === 'critical' ? 0.5 : 1,
                repeat: status !== 'safe' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <Icon className={cn('h-7 w-7', statusColors[status])} />
            </motion.div>

            {/* Status badge with live indicator */}
            <div className="flex items-center gap-2">
              {/* Live pulse dot */}
              <span className="relative flex h-2.5 w-2.5">
                <motion.span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full opacity-75',
                    status === 'safe' && 'bg-status-safe',
                    status === 'warning' && 'bg-status-warning',
                    status === 'critical' && 'bg-status-critical'
                  )}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
                  transition={{ duration: status === 'critical' ? 0.6 : 1.5, repeat: Infinity }}
                />
                <span className={cn(
                  'relative inline-flex rounded-full h-2.5 w-2.5',
                  status === 'safe' && 'bg-status-safe',
                  status === 'warning' && 'bg-status-warning',
                  status === 'critical' && 'bg-status-critical'
                )} />
              </span>

              <motion.div
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm',
                  statusBgColors[status],
                  statusColors[status]
                )}
                animate={status !== 'safe' ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{
                  duration: status === 'critical' ? 0.5 : 1.2,
                  repeat: status !== 'safe' ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              >
                {statusLabels[status]}
              </motion.div>
            </div>
          </div>
          
          {/* Sensor info */}
          <div className="space-y-3 relative z-10">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {config.label}
            </p>
            
            {/* Value with heartbeat-style animation */}
            <PulseValue 
              value={value}
              decimals={config.decimals}
              unit={config.unit}
              status={status}
            />
            
            {/* Safe range indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <span>Safe: {config.min} – {config.max} {config.unit}</span>
            </div>
          </div>

          {/* Heartbeat line at bottom */}
          <HeartbeatLine status={status} isUpdating={isUpdating} />

          {/* Update shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{
              x: isUpdating ? '100%' : '-100%',
            }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
