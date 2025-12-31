import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Thermometer, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SensorCardProps {
  type: 'ph' | 'do' | 'temperature';
  value: number;
  className?: string;
}

const sensorConfig = {
  ph: {
    label: 'pH Level',
    unit: '',
    icon: FlaskConical,
    min: 6.5,
    max: 8.5,
    criticalMin: 6.0,
    criticalMax: 9.0,
    getStatus: (value: number): 'safe' | 'warning' | 'critical' => {
      if (value >= 6.5 && value <= 8.5) return 'safe';
      if (value >= 6.0 && value <= 9.0) return 'warning';
      return 'critical';
    },
  },
  do: {
    label: 'Dissolved Oxygen',
    unit: 'mg/L',
    icon: Droplets,
    min: 5.0,
    max: 14.0,
    criticalMin: 3.0,
    getStatus: (value: number): 'safe' | 'warning' | 'critical' => {
      if (value >= 5.0) return 'safe';
      if (value >= 3.0) return 'warning';
      return 'critical';
    },
  },
  temperature: {
    label: 'Water Temperature',
    unit: '°C',
    icon: Thermometer,
    min: 24,
    max: 32,
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

  // Trigger update animation when value changes
  useEffect(() => {
    if (value !== prevValue) {
      setIsUpdating(true);
      setPrevValue(value);
      const timer = setTimeout(() => setIsUpdating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  const statusStyles = {
    safe: 'sensor-safe',
    warning: 'sensor-warning',
    critical: 'sensor-critical',
  };

  const statusColors = {
    safe: 'text-status-safe',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
  };

  const statusBgColors = {
    safe: 'bg-status-safe/10',
    warning: 'bg-status-warning/10',
    critical: 'bg-status-critical/10',
  };

  const statusGlowColors = {
    safe: 'shadow-[0_0_20px_-5px_hsl(var(--status-safe)/0.5)]',
    warning: 'shadow-[0_0_20px_-5px_hsl(var(--status-warning)/0.5)]',
    critical: 'shadow-[0_0_20px_-5px_hsl(var(--status-critical)/0.5)]',
  };

  const statusLabels = {
    safe: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'overflow-hidden border-2 transition-all duration-500',
          statusStyles[status],
          isUpdating && statusGlowColors[status],
          className
        )}
      >
        <CardContent className="p-5 relative overflow-hidden">
          {/* Animated background pulse */}
          <motion.div
            className={cn(
              'absolute inset-0 opacity-0',
              statusBgColors[status]
            )}
            animate={{
              opacity: isUpdating ? [0, 0.3, 0] : 0,
            }}
            transition={{ duration: 0.6 }}
          />

          {/* Live indicator pulse */}
          <div className="absolute top-4 right-4">
            <span className="relative flex h-3 w-3">
              <span 
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  status === 'safe' && 'bg-status-safe',
                  status === 'warning' && 'bg-status-warning',
                  status === 'critical' && 'bg-status-critical'
                )} 
              />
              <span 
                className={cn(
                  'relative inline-flex rounded-full h-3 w-3',
                  status === 'safe' && 'bg-status-safe',
                  status === 'warning' && 'bg-status-warning',
                  status === 'critical' && 'bg-status-critical'
                )} 
              />
            </span>
          </div>

          <div className="flex items-start justify-between mb-3 relative">
            <motion.div 
              className={cn('p-2.5 rounded-xl', statusBgColors[status])}
              animate={{
                scale: isUpdating ? [1, 1.1, 1] : 1,
                rotate: isUpdating ? [0, -5, 5, 0] : 0,
              }}
              transition={{ duration: 0.4 }}
            >
              <Icon className={cn('h-6 w-6', statusColors[status])} />
            </motion.div>
            <motion.div
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                statusBgColors[status],
                statusColors[status]
              )}
              animate={{
                scale: status !== 'safe' ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: status !== 'safe' ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              {statusLabels[status]}
            </motion.div>
          </div>
          
          <div className="space-y-1 relative">
            <p className="text-sm font-medium text-muted-foreground">
              {config.label}
            </p>
            <div className="flex items-baseline gap-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={value}
                  className={cn('text-4xl font-bold tracking-tight', statusColors[status])}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {value.toFixed(type === 'temperature' ? 1 : 2)}
                </motion.span>
              </AnimatePresence>
              <span className="text-lg text-muted-foreground font-medium">
                {config.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Safe range: {config.min} - {config.max} {config.unit}
            </p>
          </div>

          {/* Shimmer effect on update */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
            animate={{
              translateX: isUpdating ? ['100%', '-100%'] : '-100%',
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
