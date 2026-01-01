import { useParams, useNavigate } from 'react-router-dom';
import { useSensorData, usePondData } from '@/hooks/usePondData';
import { useSensorHistory } from '@/hooks/useSensorHistory';
import { Header } from '@/components/Header';
import { SensorCard } from '@/components/SensorCard';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  Clock,
  Loader2,
  Activity,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function LiveSensors() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const { sensorData, isLoading: sensorLoading, lastUpdated, refreshData } = useSensorData(pondId || '');
  const { phHistory, doHistory, tempHistory, addReading } = useSensorHistory(pondId || '');

  const pond = ponds.find(p => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);

  // Update history when sensor data changes
  useEffect(() => {
    if (sensorData) {
      addReading({
        ph: sensorData.ph,
        dissolvedOxygen: sensorData.dissolvedOxygen,
        temperature: sensorData.temperature,
      });
    }
  }, [sensorData?.ph, sensorData?.dissolvedOxygen, sensorData?.temperature]);

  if (pondsLoading || sensorLoading) {
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
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Live Sensors" showBack />
      
      <main className="p-4 max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-status-safe to-emerald-600 flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{pond.name}</h2>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/settings/thresholds')}
              className="rounded-xl"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshData}
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Sensor Cards */}
        {sensorData && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <SensorCard 
                type="ph" 
                value={sensorData.ph} 
                history={phHistory}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <SensorCard 
                type="do" 
                value={sensorData.dissolvedOxygen} 
                history={doHistory}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <SensorCard 
                type="temperature" 
                value={sensorData.temperature} 
                history={tempHistory}
              />
            </motion.div>
          </div>
        )}
        
        {/* Auto-refresh indicator */}
        <motion.div 
          className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-safe opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-safe" />
          </span>
          Auto-refreshing every 5 seconds
        </motion.div>
      </main>
    </div>
  );
}
