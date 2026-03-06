import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCameras } from '@/hooks/useCameras';
import { AddCameraDialog } from '@/components/camera/AddCameraDialog';
import { CameraCardMenu } from '@/components/camera/CameraCardMenu';
import { motion } from 'framer-motion';
import {
  Camera,
  Plus,
  Wifi,
  WifiOff,
  Loader2,
  Video,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Camera as CameraType } from '@/types/camera';

export default function CameraDashboard() {
  const navigate = useNavigate();
  const { cameras, isLoading, deleteCamera, refetch, getStreamUrl, getCaptureUrl } = useCameras();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editCamera, setEditCamera] = useState<CameraType | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Cameras" showBack alertCount={0} />

      <main className="p-4 max-w-2xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Cameras</h2>
              <p className="text-sm text-muted-foreground">
                {cameras.length} camera{cameras.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </motion.div>

        {/* Camera Grid */}
        {cameras.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Cameras Added</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Add your ESP32-CAM or IP cameras to monitor your ponds with live video feeds.
                </p>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Camera
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cameras.map((camera, index) => (
              <motion.div
                key={camera.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300 group"
                  onClick={() => navigate(`/cameras/${camera.id}/live`)}
                >
                  {/* Camera Preview */}
                  <div className="relative aspect-video bg-black/95 overflow-hidden">
                    {/* Try to load preview image */}
                    <img
                      src={getCaptureUrl(camera)}
                      alt={camera.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="h-10 w-10 text-white/20" />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1.5 text-xs border-0 backdrop-blur-sm',
                          camera.is_online
                            ? 'bg-status-safe/80 text-white'
                            : 'bg-black/60 text-white/70'
                        )}
                      >
                        {camera.is_online ? (
                          <>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                            </span>
                            Online
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3" />
                            Offline
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Stream Type */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] border-0 bg-black/50 text-white/70 backdrop-blur-sm uppercase tracking-wider"
                      >
                        {camera.stream_type}
                      </Badge>
                    </div>

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="h-0 w-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Camera Info */}
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate text-sm">
                          {camera.name}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {camera.ip_address}:{camera.port}
                        </p>
                      </div>
                      <CameraCardMenu
                        camera={camera}
                        onEdit={() => {
                          setEditCamera(camera);
                          setAddDialogOpen(true);
                        }}
                        onDelete={() => deleteCamera(camera.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Gallery Quick Access */}
        {cameras.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-2 gap-3"
          >
            <Button
              variant="outline"
              className="h-14 gap-2"
              onClick={() => navigate('/cameras/gallery')}
            >
              <Grid3X3 className="h-4 w-4" />
              Snapshot Gallery
            </Button>
            <Button
              variant="outline"
              className="h-14 gap-2"
              onClick={() => navigate('/cameras/recordings')}
            >
              <Video className="h-4 w-4" />
              Recordings
            </Button>
          </motion.div>
        )}
      </main>

      <AddCameraDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setEditCamera(null);
        }}
        editCamera={editCamera}
        onSuccess={() => {
          refetch();
          setAddDialogOpen(false);
          setEditCamera(null);
        }}
      />
    </div>
  );
}
