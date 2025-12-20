import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Pond } from '@/types/aquaculture';
import { Waves, MapPin, Fish, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PondCardProps {
  pond: Pond;
  onClick: () => void;
  className?: string;
}

export function PondCard({ pond, onClick, className }: PondCardProps) {
  const statusColors = {
    online: 'text-status-safe',
    offline: 'text-muted-foreground',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
  };

  const statusBgColors = {
    online: 'bg-status-safe/10',
    offline: 'bg-muted',
    warning: 'bg-status-warning/10',
    critical: 'bg-status-critical/10',
  };

  const StatusIcon = pond.status === 'offline' ? WifiOff : Wifi;

  return (
    <Card
      variant="pond"
      onClick={onClick}
      className={cn('overflow-hidden animate-fade-in', className)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Waves className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{pond.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {pond.location || 'No location'}
              </div>
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              statusBgColors[pond.status],
              statusColors[pond.status]
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {pond.status.charAt(0).toUpperCase() + pond.status.slice(1)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Fish className="h-4 w-4" />
            <span>{pond.fishType || 'Unknown'}</span>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            {pond.capacity?.toLocaleString() || '—'} fish
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">{pond.ipAddress}</span>
          </div>
          <div className="flex items-center gap-1 text-primary font-medium text-sm">
            View Dashboard
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
