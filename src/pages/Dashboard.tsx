import { useParams, useNavigate } from 'react-router-dom';
import { useSensorData, usePondData, useAlerts } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { SensorCard } from '@/components/SensorCard';
import { DeviceControl } from '@/components/DeviceControl';
import { AlertItem } from '@/components/AlertItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw, 
  Clock, 
  Wifi, 
  Calendar, 
  BarChart3, 
  Bell,
  Loader2,
  WifiOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const { sensorData, devices, isLoading: sensorLoading, lastUpdated, refreshData, toggleDevice, setDeviceAuto } = useSensorData(pondId || '');
  const { alerts, acknowledgeAlert } = useAlerts();

  const pond = ponds.find(p => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);
  const activePondId = pond?.id || pondId || '';
  const pondAlerts = alerts.filter(a => a.pondId === activePondId && !a.acknowledged);
  const allAlerts = alerts.filter(a => a.pondId === activePondId);

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
          <p className="text-muted-foreground mb-4">The requested pond could not be found.</p>
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isOnline = pond.status !== 'offline';

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header 
        title={pond.name}
        showBack={ponds.length > 1}
        alertCount={pondAlerts.length}
      />
      
      <main className="p-4 max-w-2xl mx-auto">
        {/* Connection Status */}
        <div className={cn(
          'flex items-center justify-between p-3 rounded-xl mb-4',
          isOnline ? 'bg-status-safe/10' : 'bg-muted'
        )}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-status-safe" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={cn(
              'text-sm font-medium',
              isOnline ? 'text-status-safe' : 'text-muted-foreground'
            )}>
              {isOnline ? 'Connected' : 'Offline'} • {pond.ipAddress}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        </div>

        {/* Sensor Data */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-foreground">Live Sensors</h2>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {sensorData && (
            <div className="grid gap-3 stagger-children">
              <SensorCard type="ph" value={sensorData.ph} />
              <SensorCard type="do" value={sensorData.dissolvedOxygen} />
              <SensorCard type="temperature" value={sensorData.temperature} />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Auto-refreshing every 5 seconds
          </p>
        </section>

        {/* Device Controls */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-foreground">Device Controls</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/pond/${activePondId}/schedules`)}>
              <Calendar className="h-4 w-4 mr-1" />
              Schedules
            </Button>
          </div>
          
          <div className="space-y-3 stagger-children">
            {devices.map(device => (
              <DeviceControl
                key={device.id}
                device={device}
                onToggle={toggleDevice}
                onAutoChange={setDeviceAuto}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Card 
              variant="device" 
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => navigate(`/pond/${activePondId}/reports`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Reports</p>
                  <p className="text-xs text-muted-foreground">View trends</p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              variant="device" 
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => navigate('/alerts')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-status-warning/10 flex items-center justify-center relative">
                  <Bell className="h-5 w-5 text-status-warning" />
                  {pondAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-status-critical text-[10px] font-bold text-status-critical-foreground flex items-center justify-center">
                      {pondAlerts.length}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Alerts</p>
                  <p className="text-xs text-muted-foreground">{pondAlerts.length} active</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Alerts */}
        {allAlerts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg text-foreground">Recent Alerts</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')}>
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {allAlerts.slice(0, 3).map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
