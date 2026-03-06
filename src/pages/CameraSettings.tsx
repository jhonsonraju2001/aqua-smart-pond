import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCameras } from '@/hooks/useCameras';
import { isValidCameraIP, isValidCameraURL } from '@/lib/cameraValidation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Camera,
  Wifi,
  Video,
  Volume2,
  Bell,
  Shield,
  Settings,
  Loader2,
  Save,
} from 'lucide-react';

export default function CameraSettings() {
  const { cameraId } = useParams<{ cameraId: string }>();
  const navigate = useNavigate();
  const { cameras, updateCamera, isLoading } = useCameras();
  const camera = cameras.find(c => c.id === cameraId);

  const [form, setForm] = useState({
    name: '',
    ip_address: '',
    port: 81,
    rtsp_url: '',
    stream_quality: 'medium' as 'low' | 'medium' | 'hd',
    resolution: '1280x720',
    frame_rate: 15,
    audio_enabled: false,
    motion_detection_enabled: false,
    motion_sensitivity: 50,
    motion_alerts_enabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (camera) {
      setForm({
        name: camera.name,
        ip_address: camera.ip_address,
        port: camera.port,
        rtsp_url: camera.rtsp_url || '',
        stream_quality: camera.stream_quality as 'low' | 'medium' | 'hd',
        resolution: camera.resolution || '1280x720',
        frame_rate: camera.frame_rate || 15,
        audio_enabled: camera.audio_enabled,
        motion_detection_enabled: camera.motion_detection_enabled,
        motion_sensitivity: camera.motion_sensitivity,
        motion_alerts_enabled: camera.motion_alerts_enabled,
      });
    }
  }, [camera]);

  const handleSave = async () => {
    if (!camera) return;

    const ipValidation = isValidCameraIP(form.ip_address);
    if (!ipValidation.valid) {
      toast.error(ipValidation.error);
      return;
    }
    if (form.rtsp_url) {
      const urlValidation = isValidCameraURL(form.rtsp_url);
      if (!urlValidation.valid) {
        toast.error(urlValidation.error);
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateCamera(camera.id, {
        name: form.name,
        ip_address: form.ip_address,
        port: form.port,
        rtsp_url: form.rtsp_url || null,
        stream_quality: form.stream_quality,
        resolution: form.resolution,
        frame_rate: form.frame_rate,
        audio_enabled: form.audio_enabled,
        motion_detection_enabled: form.motion_detection_enabled,
        motion_sensitivity: form.motion_sensitivity,
        motion_alerts_enabled: form.motion_alerts_enabled,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Camera Not Found</h2>
          <Button onClick={() => navigate('/cameras')}>Back to Cameras</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Camera Settings" showBack alertCount={0} />

      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* General Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Camera Name</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input value={form.ip_address} onChange={(e) => setForm(p => ({ ...p, ip_address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" value={form.port} onChange={(e) => setForm(p => ({ ...p, port: parseInt(e.target.value) || 81 }))} />
                </div>
                <div className="space-y-2">
                  <Label>RTSP URL</Label>
                  <Input placeholder="Optional" value={form.rtsp_url} onChange={(e) => setForm(p => ({ ...p, rtsp_url: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Video Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stream Quality</Label>
                <Select value={form.stream_quality} onValueChange={(v) => setForm(p => ({ ...p, stream_quality: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (320x240)</SelectItem>
                    <SelectItem value="medium">Medium (640x480)</SelectItem>
                    <SelectItem value="hd">HD (1280x720)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resolution</Label>
                <Select value={form.resolution} onValueChange={(v) => setForm(p => ({ ...p, resolution: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="320x240">320x240 (QVGA)</SelectItem>
                    <SelectItem value="640x480">640x480 (VGA)</SelectItem>
                    <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                    <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frame Rate: {form.frame_rate} FPS</Label>
                <Slider
                  value={[form.frame_rate]}
                  min={5}
                  max={30}
                  step={5}
                  onValueChange={([v]) => setForm(p => ({ ...p, frame_rate: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audio Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Audio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enable Microphone</p>
                  <p className="text-xs text-muted-foreground">Capture audio from camera</p>
                </div>
                <Switch
                  checked={form.audio_enabled}
                  onCheckedChange={(checked) => setForm(p => ({ ...p, audio_enabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Motion Detection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Motion Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Motion Detection</p>
                  <p className="text-xs text-muted-foreground">Detect movement in camera view</p>
                </div>
                <Switch
                  checked={form.motion_detection_enabled}
                  onCheckedChange={(checked) => setForm(p => ({ ...p, motion_detection_enabled: checked }))}
                />
              </div>

              {form.motion_detection_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Sensitivity: {form.motion_sensitivity}%</Label>
                    <Slider
                      value={[form.motion_sensitivity]}
                      min={10}
                      max={100}
                      step={10}
                      onValueChange={([v]) => setForm(p => ({ ...p, motion_sensitivity: v }))}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Motion Alerts</p>
                      <p className="text-xs text-muted-foreground">Push notifications on motion</p>
                    </div>
                    <Switch
                      checked={form.motion_alerts_enabled}
                      onCheckedChange={(checked) => setForm(p => ({ ...p, motion_alerts_enabled: checked }))}
                    />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
