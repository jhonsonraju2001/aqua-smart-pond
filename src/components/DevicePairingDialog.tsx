import { useState, useEffect } from 'react';
import { useDevicePairing } from '@/hooks/useDevicePairing';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Loader2, 
  Wifi, 
  MapPin, 
  Tag, 
  Check, 
  Copy, 
  QrCode,
  Cpu,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DevicePairingDialogProps {
  onSuccess?: (pondId: string) => void;
}

type Step = 'info' | 'create' | 'pairing';

export function DevicePairingDialog({ onSuccess }: DevicePairingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [deviceIp, setDeviceIp] = useState('');
  const [location, setLocation] = useState('');
  const [pairingResult, setPairingResult] = useState<{ pondId: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { isPairing, createPond, generatePondId } = useDevicePairing();
  const [previewPondId, setPreviewPondId] = useState('');

  useEffect(() => {
    if (open && step === 'create') {
      setPreviewPondId(generatePondId());
    }
  }, [open, step, generatePondId]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Pond name is required');
      return;
    }
    if (!deviceIp.trim()) {
      toast.error('Device IP is required');
      return;
    }

    const result = await createPond(name, deviceIp, location);
    
    if (result.success && result.pondId && result.pairingCode) {
      setPairingResult({ pondId: result.pondId, code: result.pairingCode });
      setStep('pairing');
    }
  };

  const copyPondId = () => {
    if (pairingResult) {
      navigator.clipboard.writeText(pairingResult.pondId);
      setCopied(true);
      toast.success('Pond ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPairingCode = () => {
    if (pairingResult) {
      navigator.clipboard.writeText(pairingResult.code);
      toast.success('Pairing code copied!');
    }
  };

  const handleClose = () => {
    if (pairingResult) {
      onSuccess?.(pairingResult.pondId);
    }
    setOpen(false);
    setStep('info');
    setName('');
    setDeviceIp('');
    setLocation('');
    setPairingResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => o ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  How Device Pairing Works
                </DialogTitle>
                <DialogDescription>
                  Connect your ESP32 device to the monitoring system
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Create Pond in App</h4>
                        <p className="text-xs text-muted-foreground">Enter pond details and generate a unique Pond ID</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Enter Pond ID on ESP32</h4>
                        <p className="text-xs text-muted-foreground">During first boot, enter the Pond ID via serial or config portal</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Device Locked to Pond</h4>
                        <p className="text-xs text-muted-foreground">ESP32 connects only to its assigned pond path in Firebase</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5" />
                    Multi-Device Architecture
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Each ESP32 reads only its own pond path</li>
                    <li>• No interference between client devices</li>
                    <li>• Scales to 10,000+ devices</li>
                    <li>• Works independently when offline</li>
                  </ul>
                </div>

                <Button onClick={() => setStep('create')} className="w-full">
                  Continue to Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle>Create New Pond</DialogTitle>
                <DialogDescription>
                  Enter your pond details to generate a unique Pond ID
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Pond ID Preview */}
                <Card className="border-dashed">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Auto-Generated Pond ID</p>
                    <code className="text-sm font-mono font-bold text-primary">{previewPondId}</code>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Pond Name *</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Main Fish Pond"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Device IP Address *</Label>
                  <div className="relative">
                    <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., 192.168.1.100"
                      value={deviceIp}
                      onChange={(e) => setDeviceIp(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The static IP assigned to your ESP32
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Location (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., North Farm Area"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('info')}
                    className="flex-1"
                    disabled={isPairing}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreate}
                    className="flex-1"
                    disabled={isPairing || !name.trim() || !deviceIp.trim()}
                  >
                    {isPairing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Pond'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'pairing' && pairingResult && (
            <motion.div
              key="pairing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-status-safe">
                  <Check className="h-5 w-5" />
                  Pond Created Successfully!
                </DialogTitle>
                <DialogDescription>
                  Use these credentials to connect your ESP32
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Pond ID */}
                <div className="space-y-2">
                  <Label className="text-xs">Pond ID (Enter on ESP32)</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={pairingResult.pondId}
                      className="font-mono font-bold text-primary"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPondId}
                    >
                      {copied ? <Check className="h-4 w-4 text-status-safe" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Pairing Code */}
                <div className="space-y-2">
                  <Label className="text-xs">Pairing Code (Optional Verification)</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={pairingResult.code}
                      className="font-mono font-bold text-lg tracking-widest text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPairingCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Expires in 24 hours
                  </p>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <h4 className="text-xs font-medium mb-2">ESP32 Configuration</h4>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Power on your ESP32 device</li>
                      <li>Connect to its WiFi config portal</li>
                      <li>Enter the <strong>Pond ID</strong> in the setup</li>
                      <li>Device will connect automatically</li>
                    </ol>
                  </CardContent>
                </Card>

                <Button onClick={handleClose} className="w-full">
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
