import { useFirebaseConnection } from '@/hooks/useFirebaseConnection';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function FirebaseStatus() {
  const { isConnected, lastSyncTime } = useFirebaseConnection();

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${diffHour}h ago`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
            <div className="relative">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-status-optimal" />
              ) : (
                <WifiOff className="h-4 w-4 text-status-critical" />
              )}
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full",
                  isConnected ? "bg-status-optimal animate-pulse" : "bg-status-critical"
                )}
              />
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-status-optimal" : "bg-status-critical"
              )} />
              <span>{isConnected ? 'Connected to Firebase' : 'Disconnected'}</span>
            </div>
            <div className="text-muted-foreground">
              Last sync: {formatLastSync(lastSyncTime)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
