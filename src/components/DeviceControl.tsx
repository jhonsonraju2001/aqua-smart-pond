import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Device } from '@/types/aquaculture';
import { Wind, Droplets, Lightbulb, Bell, Zap } from 'lucide-react';

const iconMap = {
  Wind: Wind,
  Droplets: Droplets,
  Lightbulb: Lightbulb,
  Bell: Bell,
};

interface DeviceControlProps {
  device: Device;
  onToggle: (deviceId: string) => void;
  onAutoChange: (deviceId: string, isAuto: boolean) => void;
  className?: string;
}

export function DeviceControl({ device, onToggle, onAutoChange, className }: DeviceControlProps) {
  const Icon = iconMap[device.icon as keyof typeof iconMap] || Wind;

  const stateStyles = {
    on: 'device-toggle-on',
    off: 'device-toggle-off',
    auto: 'device-toggle-auto',
  };

  const currentState = device.isAuto ? 'auto' : device.isOn ? 'on' : 'off';

  return (
    <Card variant="device" className={cn('overflow-hidden animate-fade-in', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggle(device.id)}
              className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 touch-button',
                stateStyles[currentState]
              )}
            >
              <Icon className="h-6 w-6 text-primary-foreground" />
            </button>
            <div>
              <p className="font-semibold text-foreground">{device.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                    device.isOn
                      ? 'bg-status-safe/10 text-status-safe'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      device.isOn ? 'bg-status-safe' : 'bg-muted-foreground'
                    )}
                  />
                  {device.isOn ? 'ON' : 'OFF'}
                </span>
                {device.isAuto && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-device-auto/10 text-device-auto">
                    <Zap className="h-3 w-3" />
                    AUTO
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Switch
              checked={device.isOn}
              onCheckedChange={() => onToggle(device.id)}
              className="data-[state=checked]:bg-status-safe"
            />
            {device.autoCondition && (
              <button
                onClick={() => onAutoChange(device.id, !device.isAuto)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  device.isAuto
                    ? 'bg-device-auto/10 text-device-auto'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {device.isAuto ? 'Auto Mode' : 'Manual'}
              </button>
            )}
          </div>
        </div>
        
        {device.autoCondition && device.isAuto && (
          <p className="text-xs text-muted-foreground mt-3 pl-[68px]">
            Triggers: {device.autoCondition}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
