import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddPondDialog } from '@/components/AddPondDialog';
import { usePondData } from '@/hooks/usePondData';
import { motion } from 'framer-motion';
import { 
  Sliders, 
  Waves, 
  User, 
  Bell, 
  Shield, 
  ChevronRight,
  Trash2,
  MapPin,
  Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const navigate = useNavigate();
  const { ponds, refetch } = usePondData();

  const handleDeletePond = async (pondId: string, pondName: string) => {
    try {
      // Delete associated data first
      await supabase.from('device_schedules').delete().eq('device_id', pondId);
      await supabase.from('devices').delete().eq('pond_id', pondId);
      await supabase.from('alerts').delete().eq('pond_id', pondId);
      await supabase.from('sensor_readings').delete().eq('pond_id', pondId);
      
      // Delete the pond
      const { error } = await supabase.from('ponds').delete().eq('id', pondId);
      
      if (error) throw error;
      
      toast.success(`${pondName} has been removed`);
      refetch();
    } catch (error) {
      console.error('Error deleting pond:', error);
      toast.error('Failed to delete pond');
    }
  };

  const settingItems = [
    {
      icon: Sliders,
      title: 'Threshold Settings',
      description: 'Configure sensor warning and critical levels',
      path: '/settings/thresholds',
    },
    {
      icon: User,
      title: 'Profile',
      description: 'Manage your account information',
      path: '/profile',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure alert preferences',
      path: '/settings/notifications',
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Password and security settings',
      path: '/settings/security',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header alertCount={0} />
      
      <main className="p-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Settings</h2>

          {/* Pond Management Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Your Ponds</h3>
              </div>
              <AddPondDialog onSuccess={() => refetch()} />
            </div>
            
            <div className="space-y-3">
              {ponds.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Waves className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No ponds added yet</p>
                    <AddPondDialog onSuccess={() => refetch()} />
                  </CardContent>
                </Card>
              ) : (
                ponds.map((pond, index) => (
                  <motion.div
                    key={pond.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => navigate(`/pond/${pond.id}`)}
                          >
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Waves className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{pond.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {pond.location || 'No location'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3" />
                                  {pond.ipAddress}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {pond.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the pond and all associated data including sensor readings, devices, schedules, and alerts. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePond(pond.id, pond.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Pond
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* General Settings Section */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4">General Settings</h3>
            <div className="space-y-2">
              {settingItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (ponds.length + index) * 0.05 }}
                >
                <Card 
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
