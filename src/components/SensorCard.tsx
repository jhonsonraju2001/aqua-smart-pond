import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { SensorStatus } from '@/types/aquaculture';
import { Droplets, Thermometer, FlaskConical } from 'lucide-react';

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

  const statusLabels = {
    safe: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
  };

  return (
    <Card
      variant="sensor"
      className={cn(
        'overflow-hidden animate-fade-in',
        statusStyles[status],
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('p-2.5 rounded-xl', statusBgColors[status])}>
            <Icon className={cn('h-6 w-6', statusColors[status])} />
          </div>
          <div
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              statusBgColors[status],
              statusColors[status],
              status !== 'safe' && 'status-pulse'
            )}
          >
            {statusLabels[status]}
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {config.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className={cn('text-4xl font-bold tracking-tight', statusColors[status])}>
              {value.toFixed(type === 'temperature' ? 1 : 2)}
            </span>
            <span className="text-lg text-muted-foreground font-medium">
              {config.unit}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Safe range: {config.min} - {config.max} {config.unit}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
