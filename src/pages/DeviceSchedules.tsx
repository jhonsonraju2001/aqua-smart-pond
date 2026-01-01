import { useParams, useNavigate } from 'react-router-dom';
import { usePondData, useSensorData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Clock,
  Plus,
  Loader2,
  Wind,
  Droplets,
  Lightbulb,
  Bell,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Schedule {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive: boolean;
}

const deviceIcons: Record<string, React.ElementType> = {
  aerator: Wind,
  pump: Droplets,
  lights: Lightbulb,
  buzzer: Bell,
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DeviceSchedules() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const { devices, isLoading: devicesLoading } = useSensorData(pondId || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock schedules - replace with real data
  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: '1',
      deviceId: `${pondId}-aerator`,
      deviceName: 'Aerator',
      deviceType: 'aerator',
      startTime: '06:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      isActive: true,
    },
    {
      id: '2',
      deviceId: `${pondId}-lights`,
      deviceName: 'Lights',
      deviceType: 'lights',
      startTime: '18:00',
      endTime: '22:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isActive: true,
    },
  ]);

  const [newSchedule, setNewSchedule] = useState({
    deviceId: '',
    startTime: '08:00',
    endTime: '18:00',
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
  });

  const pond = ponds.find(p => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);

  if (pondsLoading || devicesLoading) {
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

  const toggleSchedule = (scheduleId: string) => {
    setSchedules(prev =>
      prev.map(s =>
        s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const deleteSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
  };

  const toggleDay = (day: number) => {
    setNewSchedule(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const addSchedule = () => {
    if (!newSchedule.deviceId) return;
    
    const device = devices.find(d => d.id === newSchedule.deviceId);
    if (!device) return;

    const schedule: Schedule = {
      id: Date.now().toString(),
      deviceId: newSchedule.deviceId,
      deviceName: device.name,
      deviceType: device.type,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      daysOfWeek: newSchedule.daysOfWeek,
      isActive: true,
    };

    setSchedules(prev => [...prev, schedule]);
    setIsDialogOpen(false);
    setNewSchedule({
      deviceId: '',
      startTime: '08:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5],
    });
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
    return days.map(d => daysOfWeek[d]).join(', ');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Schedules" showBack />
      
      <main className="p-4 max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{pond.name}</h2>
              <p className="text-xs text-muted-foreground">
                {schedules.length} schedules configured
              </p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Device</Label>
                  <Select
                    value={newSchedule.deviceId}
                    onValueChange={(value) => setNewSchedule(prev => ({ ...prev, deviceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex gap-1">
                    {daysOfWeek.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(index)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-xs font-medium transition-colors',
                          newSchedule.daysOfWeek.includes(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={addSchedule} className="w-full" disabled={!newSchedule.deviceId}>
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Schedule List */}
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No schedules configured</p>
              <p className="text-xs text-muted-foreground/70">Add a schedule to automate device operation</p>
            </motion.div>
          ) : (
            schedules.map((schedule, index) => {
              const Icon = deviceIcons[schedule.deviceType] || Clock;
              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={cn(
                    'transition-all duration-300',
                    !schedule.isActive && 'opacity-60'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center',
                            schedule.isActive ? 'bg-primary/10' : 'bg-muted'
                          )}>
                            <Icon className={cn(
                              'h-5 w-5',
                              schedule.isActive ? 'text-primary' : 'text-muted-foreground'
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{schedule.deviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              {schedule.startTime} – {schedule.endTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={schedule.isActive}
                            onCheckedChange={() => toggleSchedule(schedule.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          {formatDays(schedule.daysOfWeek)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
