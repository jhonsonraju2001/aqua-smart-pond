import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminData } from '@/hooks/usePondData';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Waves, 
  Bell, 
  Activity, 
  Wifi,
  ChevronRight,
  Shield,
  BarChart3,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPanel() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { users, allPonds, systemAlerts, isLoading: dataLoading } = useAdminData();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin (check via isAdmin from context which queries database)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-status-critical/10 mx-auto flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-status-critical" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={() => navigate('/')}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const warningAlerts = systemAlerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Admin Panel" showBack />
      
      <main className="p-4 max-w-4xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card variant="device">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dataLoading ? '-' : users.length}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="device">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-status-safe/10 flex items-center justify-center">
                  <Waves className="h-5 w-5 text-status-safe" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dataLoading ? '-' : allPonds.length}</p>
                  <p className="text-xs text-muted-foreground">Ponds</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="device">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-status-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dataLoading ? '-' : warningAlerts}</p>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card variant="device">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-device-auto/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-device-auto" />
                </div>
                <div>
                  <p className="text-2xl font-bold">99%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="mt-0">
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">All Ponds & Devices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allPonds.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No ponds registered yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allPonds.map(pond => (
                      <div
                        key={pond.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center',
                            pond.status === 'online' ? 'bg-status-safe/10' : 'bg-status-warning/10'
                          )}>
                            <Wifi className={cn(
                              'h-5 w-5',
                              pond.status === 'online' ? 'text-status-safe' : 'text-status-warning'
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{pond.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{pond.ip}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground">Owner: {pond.userName}</p>
                          </div>
                          <Badge variant="secondary">
                            {pond.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">User Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users registered yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.id.substring(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {u.pondCount} ponds
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">System Logs</CardTitle>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : systemAlerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No system logs yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemAlerts.map(log => (
                      <div
                        key={log.id}
                        className={cn(
                          'p-4 rounded-xl border-l-4',
                          log.severity === 'warning' 
                            ? 'border-l-status-warning bg-status-warning/5'
                            : log.severity === 'critical'
                            ? 'border-l-status-critical bg-status-critical/5'
                            : 'border-l-primary bg-primary/5'
                        )}
                      >
                        <p className="text-sm text-foreground">{log.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
