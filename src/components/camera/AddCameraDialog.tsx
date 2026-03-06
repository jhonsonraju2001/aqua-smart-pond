import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCameras } from '@/hooks/useCameras';
import { usePondData } from '@/hooks/usePondData';
import { isValidCameraIP, isValidCameraURL } from '@/lib/cameraValidation';
import { toast } from 'sonner';
import { Loader2, Wifi, WifiOff, CheckCircle2, XCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Camera, CameraFormData } from '@/types/camera';

interface AddCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCamera?: Camera | null;
  onSuccess: () => void;
}

export function AddCameraDialog({ open, onOpenChange, editCamera, onSuccess }: AddCameraDialogProps) {
  const { addCamera, updateCamera, testConnection } = useCameras();
  const { ponds } = usePondData();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<string[]>([]);

  const [form, setForm] = useState<CameraFormData>({
    name: '',
    ip_address: '',
    port: 81,
    rtsp_url: '',
    username: '',
    password: '',
    stream_type: 'mjpeg',
    pond_id: null,
  });

  useEffect(() => {
    if (editCamera) {
      setForm({
        name: editCamera.name,
        ip_address: editCamera.ip_address,
        port: editCamera.port,
        rtsp_url: editCamera.rtsp_url || '',
        username: editCamera.username || '',
        password: editCamera.password || '',
        stream_type: editCamera.stream_type,
        pond_id: editCamera.pond_id,
      });
    } else {
      setForm({
        name: '',
        ip_address: '',
        port: 81,
        rtsp_url: '',
        username: '',
        password: '',
        stream_type: 'mjpeg',
        pond_id: null,
      });
    }
    setTestResult(null);
    setFoundDevices([]);
  }, [editCamera, open]);

  const handleTest = async () => {
    if (!form.ip_address) {
      toast.error('Enter an IP address first');
      return;
    }
    const ipValidation = isValidCameraIP(form.ip_address);
    if (!ipValidation.valid) {
      toast.error(ipValidation.error);
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const result = await testConnection(form.ip_address, form.port);
    setTestResult(result);
    setIsTesting(false);

    if (result) {
      toast.success('Camera is reachable!');
    } else {
      toast.error('Could not reach camera. Check IP and port.');
    }
  };

  const handleScanNetwork = async () => {
    setIsScanning(true);
    setFoundDevices([]);
    
    // Scan common ESP32-CAM addresses
    const baseIPs = ['192.168.1', '192.168.0', '192.168.4'];
    const found: string[] = [];

    for (const base of baseIPs) {
      // Check common ESP32 defaults: .1, .100-105
      const targets = [1, 100, 101, 102, 103, 104, 105];
      const promises = targets.map(async (last) => {
        const ip = `${base}.${last}`;
        try {
          const reachable = await testConnection(ip, 81);
          if (reachable) found.push(ip);
        } catch {}
      });
      await Promise.all(promises);
    }

    setFoundDevices(found);
    setIsScanning(false);

    if (found.length === 0) {
      toast.info('No cameras found on common addresses. Try entering IP manually.');
    } else {
      toast.success(`Found ${found.length} camera(s)!`);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Camera name is required');
      return;
    }
    if (!form.ip_address.trim()) {
      toast.error('IP address is required');
      return;
    }
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
      if (editCamera) {
        await updateCamera(editCamera.id, {
          name: form.name,
          ip_address: form.ip_address,
          port: form.port,
          rtsp_url: form.rtsp_url || null,
          username: form.username || null,
          password: form.password || null,
          stream_type: form.stream_type,
          pond_id: form.pond_id,
        });
      } else {
        await addCamera(form);
      }
      onSuccess();
    } catch {
      // Error handled in hook
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCamera ? 'Edit Camera' : 'Add Camera'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Camera Name */}
          <div className="space-y-2">
            <Label>Camera Name</Label>
            <Input
              placeholder="Pond 1 Camera"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* IP Address with scan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Camera IP Address</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleScanNetwork}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
                {isScanning ? 'Scanning...' : 'Scan Network'}
              </Button>
            </div>
            <Input
              placeholder="192.168.1.100"
              value={form.ip_address}
              onChange={(e) => setForm(prev => ({ ...prev, ip_address: e.target.value }))}
            />
            
            {/* Found devices */}
            <AnimatePresence>
              {foundDevices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <p className="text-xs text-muted-foreground">Found cameras:</p>
                  {foundDevices.map(ip => (
                    <Button
                      key={ip}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs w-full justify-start gap-2 font-mono"
                      onClick={() => setForm(prev => ({ ...prev, ip_address: ip }))}
                    >
                      <Wifi className="h-3 w-3 text-status-safe" />
                      {ip}
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Port */}
          <div className="space-y-2">
            <Label>Port Number</Label>
            <Input
              type="number"
              placeholder="81"
              value={form.port}
              onChange={(e) => setForm(prev => ({ ...prev, port: parseInt(e.target.value) || 81 }))}
            />
          </div>

          {/* Stream Type */}
          <div className="space-y-2">
            <Label>Stream Type</Label>
            <RadioGroup
              value={form.stream_type}
              onValueChange={(v) => setForm(prev => ({ ...prev, stream_type: v as 'mjpeg' | 'rtsp' }))}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mjpeg" id="mjpeg" />
                <Label htmlFor="mjpeg" className="cursor-pointer">MJPEG (ESP32-CAM)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rtsp" id="rtsp" />
                <Label htmlFor="rtsp" className="cursor-pointer">RTSP</Label>
              </div>
            </RadioGroup>
          </div>

          {/* RTSP URL (shown for RTSP type) */}
          {form.stream_type === 'rtsp' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Label>RTSP Stream URL</Label>
              <Input
                placeholder="rtsp://192.168.1.100:554/stream"
                value={form.rtsp_url}
                onChange={(e) => setForm(prev => ({ ...prev, rtsp_url: e.target.value }))}
              />
            </motion.div>
          )}

          {/* Username & Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Username (optional)</Label>
              <Input
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password (optional)</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          {/* Linked Pond */}
          {ponds.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Pond (optional)</Label>
              <Select
                value={form.pond_id || 'none'}
                onValueChange={(v) => setForm(prev => ({ ...prev, pond_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a pond" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No pond</SelectItem>
                  {ponds.map(pond => (
                    <SelectItem key={pond.id} value={pond.id}>
                      {pond.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || !form.ip_address}
              className="flex-1 gap-2"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : testResult === true ? (
                <CheckCircle2 className="h-4 w-4 text-status-safe" />
              ) : testResult === false ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editCamera ? 'Update Camera' : 'Save Camera'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
