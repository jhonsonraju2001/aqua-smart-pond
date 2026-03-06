import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCameras } from '@/hooks/useCameras';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Video,
  Trash2,
  Download,
  Share2,
  Camera,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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

export default function CameraGallery() {
  const { snapshots, recordings, cameras, isLoading } = useCameras();
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  const getCameraName = (cameraId: string) => {
    return cameras.find(c => c.id === cameraId)?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Gallery" showBack alertCount={0} />

      <main className="p-4 max-w-2xl mx-auto">
        <Tabs defaultValue="snapshots">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="snapshots" className="flex-1 gap-2">
              <ImageIcon className="h-4 w-4" />
              Snapshots ({snapshots.length})
            </TabsTrigger>
            <TabsTrigger value="recordings" className="flex-1 gap-2">
              <Video className="h-4 w-4" />
              Recordings ({recordings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshots">
            {snapshots.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No Snapshots</h3>
                  <p className="text-sm text-muted-foreground">
                    Capture snapshots from the live camera view
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {snapshots.map((snap, index) => (
                  <motion.div
                    key={snap.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="overflow-hidden group cursor-pointer">
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={snap.image_url}
                          alt="Snapshot"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                        {snap.is_motion_triggered && (
                          <Badge className="absolute top-1 left-1 text-[9px] h-5 bg-status-warning/80 border-0 gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Motion
                          </Badge>
                        )}
                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-2">
                        <p className="text-[10px] text-muted-foreground truncate">
                          {getCameraName(snap.camera_id)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(snap.captured_at), 'MMM d, HH:mm')}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recordings">
            {recordings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No Recordings</h3>
                  <p className="text-sm text-muted-foreground">
                    Start recording from the live camera view
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recordings.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-12 w-12 rounded-xl flex items-center justify-center',
                            rec.status === 'recording' ? 'bg-red-500/10' : 'bg-muted'
                          )}>
                            <Video className={cn(
                              'h-5 w-5',
                              rec.status === 'recording' ? 'text-red-500 animate-pulse' : 'text-muted-foreground'
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getCameraName(rec.camera_id)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(rec.started_at), 'MMM d, HH:mm')}
                              {rec.duration_seconds && (
                                <span>• {Math.floor(rec.duration_seconds / 60)}:{(rec.duration_seconds % 60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                            <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                              {rec.recording_type}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            {rec.status === 'completed' && (
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
