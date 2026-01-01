import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Thermometer, FlaskConical, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSensorAlerts } from '@/hooks/useSensorAlerts';
import { Sparkline } from './sensors/Sparkline';

interface SensorCardProps {
  type: 'ph' | 'do' | 'temperature';
  value: number;
  history?: number[];
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

export function SensorCard({ type, value, history = [], className }: SensorCardProps) {
  const config = sensorConfig[type];
  const status = config.getStatus(value);
  const Icon = config.icon;
  const [prevValue, setPrevValue] = useState(value);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Enable sound/vibration alerts
  useSensorAlerts(status);

  // Track value trend
  useEffect(() => {
    if (value > prevValue) {
      setTrend('up');
    } else if (value < prevValue) {
      setTrend('down');
    } else {
      setTrend('stable');
    }
    setPrevValue(value);
  }, [value, prevValue]);

  const statusStyles = {
    safe: {
      bg: 'bg-status-safe/10',
      border: 'border-status-safe/30',
      text: 'text-status-safe',
      glow: 'shadow-[0_0_20px_hsl(var(--status-safe)/0.15)]',
    },
    warning: {
      bg: 'bg-status-warning/10',
      border: 'border-status-warning/40',
      text: 'text-status-warning',
      glow: 'shadow-[0_0_25px_hsl(var(--status-warning)/0.2)]',
    },
    critical: {
      bg: 'bg-status-critical/10',
      border: 'border-status-critical/50',
      text: 'text-status-critical',
      glow: 'shadow-[0_0_30px_hsl(var(--status-critical)/0.25)]',
    },
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Calculate progress bar position
  const range = config.max - config.min;
  const progress = Math.min(100, Math.max(0, ((value - config.min) / range) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border transition-all duration-300',
          statusStyles[status].border,
          statusStyles[status].glow,
          className
        )}
      >
        {/* Left accent bar */}
        <div className={cn(
          'absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300',
          status === 'safe' && 'bg-status-safe',
          status === 'warning' && 'bg-status-warning',
          status === 'critical' && 'bg-status-critical'
        )} />

        <CardContent className="p-5 pl-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-xl transition-colors duration-300',
                statusStyles[status].bg
              )}>
                <Icon className={cn('h-5 w-5', statusStyles[status].text)} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Safe: {config.min}–{config.max} {config.unit}
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                className={cn(
                  'h-2 w-2 rounded-full',
                  status === 'safe' && 'bg-status-safe',
                  status === 'warning' && 'bg-status-warning',
                  status === 'critical' && 'bg-status-critical'
                )}
                animate={status !== 'safe' ? {
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1],
                } : {}}
                transition={{
                  duration: status === 'critical' ? 0.8 : 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className={cn(
                'text-xs font-medium capitalize',
                statusStyles[status].text
              )}>
                {status}
              </span>
            </div>
          </div>

          {/* Value display */}
          <div className="flex items-end justify-between mb-3">
            <div className="flex items-baseline gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={value}
                  className={cn(
                    'text-4xl font-bold tabular-nums tracking-tight',
                    statusStyles[status].text
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {value.toFixed(config.decimals)}
                </motion.span>
              </AnimatePresence>
              <span className="text-lg text-muted-foreground font-medium">
                {config.unit}
              </span>
            </div>

            {/* Trend indicator */}
            <motion.div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                trend === 'up' && 'bg-status-safe/10 text-status-safe',
                trend === 'down' && 'bg-status-critical/10 text-status-critical',
                trend === 'stable' && 'bg-muted text-muted-foreground'
              )}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={trend}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{trend === 'stable' ? 'Stable' : trend === 'up' ? 'Rising' : 'Falling'}</span>
            </motion.div>
          </div>

          {/* Sparkline */}
          {history.length >= 2 && (
            <div className="mb-3">
              <Sparkline data={history} status={status} height={40} />
            </div>
          )}

          {/* Progress bar */}
          <div className="relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full transition-colors duration-300',
                  status === 'safe' && 'bg-status-safe',
                  status === 'warning' && 'bg-status-warning',
                  status === 'critical' && 'bg-status-critical'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {/* Range markers */}
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/50">
              <span>{config.min}</span>
              <span>{config.max}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
