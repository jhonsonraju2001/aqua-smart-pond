import { useParams, useNavigate } from 'react-router-dom';
import { useSensorData, usePondData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { DeviceControl } from '@/components/DeviceControl';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Loader2,
  ToggleRight,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DeviceControls() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const { devices, isLoading: sensorLoading, toggleDevice, setDeviceAuto } = useSensorData(pondId || '');

  const pond = ponds.find(p => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);

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

  const activeDevices = devices.filter(d => d.isOn).length;
  const autoDevices = devices.filter(d => d.isAuto).length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Device Controls" showBack />
      
      <main className="p-4 max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ToggleRight className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{pond.name}</h2>
              <p className="text-xs text-muted-foreground">
                {devices.length} devices configured
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/pond/${pond.id}/schedules`)}
            className="rounded-xl"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schedules
          </Button>
        </motion.div>

        {/* Status Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-br from-status-safe/10 to-status-safe/5 border border-status-safe/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-status-safe" />
              <span className="text-xs font-medium text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeDevices}</p>
          </div>
          
          <div className="p-4 rounded-2xl bg-gradient-to-br from-device-auto/10 to-device-auto/5 border border-device-auto/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-device-auto" />
              <span className="text-xs font-medium text-muted-foreground">Auto Mode</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{autoDevices}</p>
          </div>
        </motion.div>

        {/* Device List */}
        <div className="space-y-3">
          {devices.map((device, index) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.1 }}
            >
              <DeviceControl
                device={device}
                onToggle={toggleDevice}
                onAutoChange={setDeviceAuto}
              />
            </motion.div>
          ))}
        </div>

        {/* Helper text */}
        <motion.p 
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          Toggle switches to control devices manually or enable auto mode
        </motion.p>
      </main>
    </div>
  );
}
