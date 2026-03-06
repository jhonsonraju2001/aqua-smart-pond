import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCameras } from '@/hooks/useCameras';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  Video,
  VideoOff,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Settings,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export default function CameraLiveView() {
  const { cameraId } = useParams<{ cameraId: string }>();
  const navigate = useNavigate();
  const { cameras, getStreamUrl, getCaptureUrl, updateCamera } = useCameras();
  const camera = cameras.find(c => c.id === cameraId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const streamUrl = camera ? getStreamUrl(camera) : '';
  const captureUrl = camera ? getCaptureUrl(camera) : '';

  // Auto-reconnect on stream error
  useEffect(() => {
    if (!streamError || isReconnecting) return;
    const timer = setTimeout(() => {
      setStreamError(false);
      setIsReconnecting(true);
      setTimeout(() => setIsReconnecting(false), 2000);
    }, 5000);
    return () => clearTimeout(timer);
  }, [streamError, isReconnecting]);

  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      // Toggle internal fullscreen state as fallback
      setIsFullscreen(prev => !prev);
    }
  }, []);

  const handleSnapshot = useCallback(async () => {
    if (!camera) return;
    try {
      // For MJPEG streams, capture from the image element
      if (imgRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = imgRef.current.naturalWidth || 1280;
        canvas.height = imgRef.current.naturalHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(imgRef.current, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          // Download snapshot
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${camera.name}_${new Date().toISOString().slice(0, 19)}.jpg`;
          link.click();
          
          toast.success('Snapshot saved!');
        }
      }
    } catch (err) {
      // Fallback: open capture URL directly
      window.open(captureUrl, '_blank');
      toast.info('Snapshot opened in new tab');
    }
  }, [camera, captureUrl]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      toast.success('Recording stopped');
    } else {
      setIsRecording(true);
      toast.info('Recording started');
    }
  }, [isRecording]);

  if (!camera) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <CameraIcon className="h-12 w-12 mx-auto mb-4 text-white/40" />
          <p className="text-lg font-medium">Camera not found</p>
          <Button variant="ghost" className="mt-4 text-white" onClick={() => navigate('/cameras')}>
            Back to Cameras
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-black flex flex-col',
        isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'
      )}
    >
      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => navigate('/cameras')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-white font-semibold text-sm">{camera.name}</h1>
              <p className="text-white/50 text-xs font-mono">{camera.ip_address}:{camera.port}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <Badge
              variant="outline"
              className={cn(
                'gap-1.5 text-xs border-0',
                streamError
                  ? 'bg-destructive/80 text-white'
                  : 'bg-red-500/80 text-white'
              )}
            >
              {streamError ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              ) : (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                  </span>
                  LIVE
                </>
              )}
            </Badge>

            {isRecording && (
              <Badge variant="outline" className="gap-1.5 text-xs border-0 bg-red-600 text-white animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                REC
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Video Container */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {streamError ? (
          <div className="text-center text-white/40 p-8">
            <WifiOff className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Connection Lost</p>
            <p className="text-sm mb-4">Attempting to reconnect...</p>
            {isReconnecting && (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            )}
          </div>
        ) : (
          <>
            {/* MJPEG Stream */}
            <img
              ref={imgRef}
              src={streamUrl}
              alt={camera.name}
              className={cn(
                'max-w-full max-h-full object-contain',
                nightMode && 'brightness-150 contrast-125'
              )}
              onError={() => setStreamError(true)}
              crossOrigin="anonymous"
            />

            {/* Night mode overlay */}
            {nightMode && (
              <div className="absolute inset-0 bg-green-900/20 mix-blend-multiply pointer-events-none" />
            )}

            {/* Simulated static for when stream loads */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
      >
        <div className="max-w-4xl mx-auto">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleSnapshot}
            >
              <CameraIcon className="h-5 w-5" />
            </Button>

            {/* Record button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-16 w-16 rounded-full border-2',
                isRecording
                  ? 'border-red-500 bg-red-500/20 text-red-500'
                  : 'border-white/30 text-white/70 hover:text-white hover:bg-white/10'
              )}
              onClick={handleToggleRecording}
            >
              {isRecording ? (
                <VideoOff className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full',
                nightMode
                  ? 'text-green-400 bg-green-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
              onClick={() => setNightMode(!nightMode)}
            >
              {nightMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>

          {/* Stream Info */}
          <div className="flex items-center justify-center gap-4 text-xs text-white/30">
            <span>{camera.resolution || '1280x720'}</span>
            <span>•</span>
            <span>{camera.frame_rate || 15} FPS</span>
            <span>•</span>
            <span className="uppercase">{camera.stream_type}</span>
            <span>•</span>
            <span>{camera.stream_quality}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
