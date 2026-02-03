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
  Cpu,
  ArrowRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface DevicePairingDialogProps {
  onSuccess?: (pondId: string) => void;
}

type Step = 'info' | 'create' | 'success';

export function DevicePairingDialog({ onSuccess }: DevicePairingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [deviceIp, setDeviceIp] = useState('');
  const [location, setLocation] = useState('');
  const [createdPondId, setCreatedPondId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { isPairing, createPond, generatePondId } = useDevicePairing();
  const { user } = useAuth();
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
    
    if (result.success && result.pondId) {
      setCreatedPondId(result.pondId);
      setStep('success');
    }
  };

  const copyPondId = () => {
    if (createdPondId) {
      navigator.clipboard.writeText(createdPondId);
      setCopied(true);
      toast.success('Pond ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (createdPondId) {
      onSuccess?.(createdPondId);
    }
    setOpen(false);
    setStep('info');
    setName('');
    setDeviceIp('');
    setLocation('');
    setCreatedPondId(null);
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
                  Connect your ESP32 device to your account
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
                        <p className="text-xs text-muted-foreground">
                          Enter pond details. You become the <strong>Owner</strong> automatically.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Get Your Pond ID</h4>
                        <p className="text-xs text-muted-foreground">
                          A unique Pond ID is generated. Copy it for your ESP32.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Enter Pond ID on ESP32</h4>
                        <p className="text-xs text-muted-foreground">
                          During first boot, enter <strong>only the Pond ID</strong> via config portal.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-status-safe/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-status-safe" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Device Locked to Pond</h4>
                        <p className="text-xs text-muted-foreground">
                          ESP32 connects only to your pond path. Fully isolated.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-status-safe" />
                      Owner Security Model
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Your account UID = Pond Owner</li>
                      <li>• Only you can see & control this pond</li>
                      <li>• ESP32 uses Pond ID only (no password needed)</li>
                      <li>• Firebase rules enforce ownership server-side</li>
                    </ul>
                  </CardContent>
                </Card>

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
                  You will be assigned as the owner of this pond
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Owner Info */}
                <Card className="border-status-safe/30 bg-status-safe/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-status-safe" />
                      <span className="text-xs font-medium">Owner Account</span>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground truncate">
                      {user?.email || 'Not logged in'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your UID will be linked to this pond
                    </p>
                  </CardContent>
                </Card>

                {/* Pond ID Preview */}
                <Card className="border-dashed">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Auto-Generated Pond ID (for ESP32)</p>
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

          {step === 'success' && createdPondId && (
            <motion.div
              key="success"
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
                  You are now the owner of this pond
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Owner Confirmation */}
                <Card className="border-status-safe/30 bg-status-safe/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-status-safe" />
                      <span className="text-xs font-medium text-status-safe">Owner Assigned</span>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </CardContent>
                </Card>

                {/* Pond ID - Main Focus */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Pond ID <span className="text-muted-foreground">(Enter this on ESP32)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={createdPondId}
                      className="font-mono font-bold text-lg text-primary tracking-wide"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPondId}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-status-safe" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5" />
                      ESP32 Setup Instructions
                    </h4>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      <li>Power on your ESP32 device</li>
                      <li>Connect to its WiFi config portal (AP mode)</li>
                      <li>Enter the <strong>Pond ID</strong> shown above</li>
                      <li>Save and reboot - device connects automatically</li>
                    </ol>
                    <div className="mt-3 p-2 bg-background rounded border border-dashed">
                      <p className="text-xs text-muted-foreground">
                        <strong>No password needed</strong> - The Pond ID locks the ESP32 to your pond path in Firebase. 
                        Only your account can access this pond's data.
                      </p>
                    </div>
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
