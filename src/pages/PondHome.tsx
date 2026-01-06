import { useParams, useNavigate } from 'react-router-dom';
import { usePondData, useAlerts } from '@/hooks/usePondData';
import { useFirebasePondStatus } from '@/hooks/useFirebasePondStatus';
import { useSensorData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { ActionButton } from '@/components/ActionButton';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Activity, 
  ToggleRight, 
  BarChart3, 
  Bell,
  Wifi,
  WifiOff,
  Loader2,
  Waves
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PondHome() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const { alerts } = useAlerts();

  const pond = ponds.find(p => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);
  const activePondId = pond?.id || pondId || '';
  
  // Use Firebase pond status for realtime online/offline detection
  const { isOnline: firebaseIsOnline, lastSeen, connectionError } = useFirebasePondStatus();
  
  const pondAlerts = alerts.filter(a => a.pondId === activePondId && !a.acknowledged);

  if (pondsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pond) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Pond Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested pond could not be found.</p>
        </div>
      </div>
    );
  }

  // Use Firebase status if available, fallback to pond.status
  const isOnline = connectionError ? pond.status !== 'offline' : firebaseIsOnline;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header 
        title={pond.name}
        showBack={ponds.length > 1}
        alertCount={pondAlerts.length}
      />
      
      <main className="p-4 max-w-lg mx-auto">
        {/* Pond Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="mb-6 overflow-hidden border-none shadow-elevated">
            <CardContent className="p-0">
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white blur-2xl" />
                </div>

                <div className="relative flex items-center gap-4">
                  <motion.div 
                    className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Waves className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{pond.name}</h2>
                    <p className="text-white/70 text-sm font-mono">{pond.ipAddress}</p>
                  </div>

                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    isOnline 
                      ? 'bg-status-safe/20 text-white' 
                      : 'bg-white/10 text-white/70'
                  )}>
                    {isOnline ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-safe opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-safe" />
                        </span>
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3.5 w-3.5" />
                        Offline
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ActionButton
              icon={Activity}
              label="Live Sensors"
              description="Real-time data"
              variant="sensors"
              onClick={() => navigate(`/pond/${activePondId}/sensors`)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ActionButton
              icon={ToggleRight}
              label="Devices"
              description="Control panel"
              variant="devices"
              onClick={() => navigate(`/pond/${activePondId}/devices`)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <ActionButton
              icon={BarChart3}
              label="Reports"
              description="Analytics & trends"
              variant="reports"
              onClick={() => navigate(`/pond/${activePondId}/reports`)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <ActionButton
              icon={Bell}
              label="Alerts"
              description={pondAlerts.length > 0 ? `${pondAlerts.length} active` : 'All clear'}
              variant="alerts"
              badge={pondAlerts.length}
              onClick={() => navigate(`/pond/${activePondId}/alerts`)}
            />
          </motion.div>
        </div>

        {/* Quick tip */}
        <motion.p 
          className="text-center text-xs text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          Tap any button to explore monitoring features
        </motion.p>
      </main>
    </div>
  );
}
