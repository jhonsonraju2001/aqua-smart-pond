import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Wind, Lightbulb, Power, Clock, Camera, ChevronRight, Video } from "lucide-react";

import { database } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { triggerHapticMedium } from "@/lib/haptics";
import { useDeviceSchedule } from "@/hooks/useDeviceSchedule";
import { CameraViewerDialog } from "@/components/CameraViewerDialog";

export type StaticDeviceType = "motor" | "aerator" | "light" | "camera";

interface DeviceCardProps {
  pondId: string;
  type: StaticDeviceType;
  title: string;
  className?: string;
}

type DeviceMode = "manual" | "auto";

interface DeviceMeta {
  icon: typeof Droplets;
  subtitle: string;
  hasSchedule: boolean;
}

function deviceMeta(type: StaticDeviceType): DeviceMeta {
  switch (type) {
    case "motor":
      return {
        icon: Droplets,
        subtitle: "Water circulation",
        hasSchedule: true,
      };
    case "aerator":
      return {
        icon: Wind,
        subtitle: "Oxygen supply",
        hasSchedule: true,
      };
    case "light":
      return {
        icon: Lightbulb,
        subtitle: "Pond lighting",
        hasSchedule: true,
      };
    case "camera":
      return {
        icon: Camera,
        subtitle: "Live monitoring",
        hasSchedule: false,
      };
  }
}

export function DeviceCard({ pondId, type, title, className }: DeviceCardProps) {
  const navigate = useNavigate();
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<DeviceMode>("manual");
  const [isWriting, setIsWriting] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);

  const meta = useMemo(() => deviceMeta(type), [type]);
  const { icon: Icon, subtitle, hasSchedule } = meta;

  // Fetch real schedule data from Firebase
  const { nextSchedule, isLoading: scheduleLoading } = useDeviceSchedule(pondId, type);

  const handleScheduleClick = () => {
    triggerHapticMedium();
    navigate(`/pond/${pondId}/schedules`);
  };

  const handleCameraClick = () => {
    triggerHapticMedium();
    setCameraDialogOpen(true);
  };

  useEffect(() => {
    if (type === "camera") return; // Camera doesn't have state in Firebase

    const deviceRef = ref(database, `ponds/${pondId}/devices/${type}`);

    const unsubscribe = onValue(
      deviceRef,
      (snap) => {
        const val = snap.val() as { state?: number; mode?: DeviceMode } | null;
        setIsOn((val?.state ?? 0) === 1);
        setMode(val?.mode ?? "manual");
      },
      () => {
        // Keep card mounted and usable; fall back to local defaults.
      }
    );

    return () => unsubscribe();
  }, [pondId, type]);

  const handleToggle = async () => {
    if (type === "camera") {
      handleCameraClick();
      return;
    }

    if (mode === "auto" || isWriting) return;
    
    triggerHapticMedium();
    
    const newState = !isOn;
    setIsOn(newState);

    setIsWriting(true);
    try {
      await set(ref(database, `ponds/${pondId}/devices/${type}/state`), newState ? 1 : 0);
    } finally {
      setIsWriting(false);
    }
  };

  const handleModeToggle = async () => {
    if (type === "camera") return;

    triggerHapticMedium();
    
    const nextMode: DeviceMode = mode === "auto" ? "manual" : "auto";
    setMode(nextMode);

    setIsWriting(true);
    try {
      await set(ref(database, `ponds/${pondId}/devices/${type}/mode`), nextMode);
    } finally {
      setIsWriting(false);
    }
  };

  const isAuto = mode === "auto";
  const isCamera = type === "camera";

  // Get border and text colors for button based on state
  const getButtonStyles = () => {
    if (isCamera) {
      return "border-primary text-primary bg-primary/5 hover:bg-primary/10";
    }
    if (isAuto) {
      return "border-muted-foreground/40 text-muted-foreground bg-muted/30";
    }
    if (isOn) {
      return "border-status-safe text-status-safe bg-status-safe/5 hover:bg-status-safe/10";
    }
    return "border-destructive text-destructive bg-destructive/5 hover:bg-destructive/10";
  };

  // Get status dot color
  const getStatusDotColor = () => {
    if (isCamera) return "bg-primary";
    if (isAuto) return "bg-muted-foreground";
    if (isOn) return "bg-status-safe";
    return "bg-destructive";
  };

  const getStatusText = () => {
    if (isCamera) return "LIVE";
    if (isAuto) return "AUTO";
    return isOn ? "ON" : "OFF";
  };

  // Mode badge styles
  const getModeBadgeStyles = () => {
    if (isAuto) {
      return "border-muted-foreground/30 text-muted-foreground bg-muted/20";
    }
    return "border-primary/30 text-primary bg-primary/5";
  };

  // Get schedule display text
  const getScheduleDisplay = () => {
    if (isCamera) return "Always On";
    if (scheduleLoading) return "Loading...";
    if (nextSchedule) return nextSchedule.display;
    return "No schedule";
  };

  return (
    <>
      <motion.div
        layout
        className={cn(
          "relative rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300",
          className
        )}
        aria-label={`${title} control`}
      >
        {/* Content Layer */}
        <div className="relative">
          {/* Status Badge with Dot - Top Right */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={getStatusText()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/30"
              >
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  getStatusDotColor(),
                  isCamera && "animate-pulse"
                )} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {getStatusText()}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Device Info Row */}
          <div className="flex items-center gap-4 mb-5">
            {/* Icon Container */}
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 border",
                isCamera
                  ? "border-primary/30 bg-primary/10"
                  : isOn && !isAuto
                  ? "border-status-safe/30 bg-status-safe/10"
                  : isAuto
                  ? "border-muted-foreground/20 bg-muted/50"
                  : "border-border bg-muted/30"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-colors duration-300",
                  isCamera
                    ? "text-primary"
                    : isOn && !isAuto
                    ? "text-status-safe"
                    : isAuto
                    ? "text-muted-foreground"
                    : "text-foreground"
                )}
                strokeWidth={2}
              />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Schedule Preview Indicator - Tappable */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={hasSchedule ? handleScheduleClick : isCamera ? handleCameraClick : undefined}
            className={cn(
              "flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 w-full transition-colors",
              (hasSchedule || isCamera) && "hover:bg-muted/50 hover:border-primary/30 cursor-pointer"
            )}
          >
            {isCamera ? (
              <Video className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {isCamera ? "Status:" : "Next:"}
            </span>
            <span className="text-xs font-medium text-foreground flex-1 text-left">
              {getScheduleDisplay()}
            </span>
            {(hasSchedule || isCamera) && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </motion.button>

          {/* Single Large Toggle Button - Outline Only */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleToggle}
            disabled={isWriting || (isAuto && !isCamera)}
            className={cn(
              "h-16 w-full rounded-xl flex items-center justify-center gap-3 transition-all duration-300 border-2 font-bold text-base",
              getButtonStyles(),
              isAuto && !isCamera && "cursor-not-allowed opacity-60"
            )}
            aria-label={isCamera ? "View camera feed" : isAuto ? `${title} in auto mode` : `Toggle ${title}`}
          >
            {isCamera ? (
              <>
                <Video className="h-5 w-5" strokeWidth={2.5} />
                <span className="uppercase tracking-wide">View Feed</span>
              </>
            ) : (
              <>
                <Power className="h-5 w-5" strokeWidth={2.5} />
                <span className="uppercase tracking-wide">
                  {isAuto ? "Auto Mode" : isOn ? "ON" : "OFF"}
                </span>
              </>
            )}
          </motion.button>

          {/* Divider - Hide for camera */}
          {!isCamera && <div className="h-px bg-border/50 my-4" />}

          {/* Mode Toggle Row - Hide for camera */}
          {!isCamera && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">
                Control Mode
              </span>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleModeToggle}
                disabled={isWriting}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border uppercase tracking-wide",
                  getModeBadgeStyles()
                )}
              >
                {isAuto ? "AUTO" : "MANUAL"}
              </motion.button>
            </div>
          )}
        </div>

        {/* Writing indicator overlay */}
        <AnimatePresence>
          {isWriting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center z-20"
            >
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Camera Viewer Dialog */}
      {isCamera && (
        <CameraViewerDialog
          open={cameraDialogOpen}
          onOpenChange={setCameraDialogOpen}
          pondId={pondId}
          cameraName={title}
        />
      )}
    </>
  );
}
