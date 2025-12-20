import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Waves, 
  Server, 
  Bell, 
  Activity, 
  Wifi,
  WifiOff,
  ChevronRight,
  Shield,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock admin data
const mockUsers = [
  { id: 'user-1', name: 'John Farmer', email: 'user@aquafarm.com', role: 'user', ponds: 2, status: 'active' },
  { id: 'user-2', name: 'Demo User', email: 'demo@aquafarm.com', role: 'user', ponds: 1, status: 'active' },
  { id: 'admin-1', name: 'Admin User', email: 'admin@aquafarm.com', role: 'admin', ponds: 3, status: 'active' },
];

const mockDevices = [
  { id: 'pond-1', name: 'Main Pond', ip: '192.168.1.101', status: 'online', sensors: 'OK', aerator: true, pump: false },
  { id: 'pond-2', name: 'Breeding Pond', ip: '192.168.1.102', status: 'warning', sensors: 'Low DO', aerator: true, pump: false },
  { id: 'pond-3', name: 'Nursery Pond', ip: '192.168.1.103', status: 'online', sensors: 'OK', aerator: false, pump: false },
];

const mockSystemAlerts = [
  { id: 'sys-1', message: 'Breeding Pond DO dropped below threshold', time: '15 min ago', severity: 'warning' },
  { id: 'sys-2', message: 'New user registered: demo@aquafarm.com', time: '2 hours ago', severity: 'info' },
  { id: 'sys-3', message: 'System backup completed successfully', time: '6 hours ago', severity: 'info' },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  if (user?.role !== 'admin') {
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
                  <p className="text-2xl font-bold">{mockUsers.length}</p>
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
                  <p className="text-2xl font-bold">{mockDevices.length}</p>
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
                  <p className="text-2xl font-bold">1</p>
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
                  <CardTitle className="text-lg">All Devices</CardTitle>
                  <Button variant="outline" size="sm">
                    <Server className="h-4 w-4 mr-1" />
                    Add Device
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDevices.map(device => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center',
                          device.status === 'online' ? 'bg-status-safe/10' : 'bg-status-warning/10'
                        )}>
                          {device.status === 'online' ? (
                            <Wifi className="h-5 w-5 text-status-safe" />
                          ) : (
                            <Wifi className="h-5 w-5 text-status-warning" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{device.ip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <Badge variant={device.sensors === 'OK' ? 'secondary' : 'destructive'}>
                            {device.sensors}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-lg',
                            device.aerator ? 'bg-status-safe/10 text-status-safe' : 'bg-muted text-muted-foreground'
                          )}>
                            Aerator {device.aerator ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-1" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockUsers.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {u.ponds} ponds
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {mockSystemAlerts.map(log => (
                    <div
                      key={log.id}
                      className={cn(
                        'p-4 rounded-xl border-l-4',
                        log.severity === 'warning' 
                          ? 'border-l-status-warning bg-status-warning/5'
                          : 'border-l-primary bg-primary/5'
                      )}
                    >
                      <p className="text-sm text-foreground">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
