import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Wind, Lightbulb, Power } from "lucide-react";

import { database } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { triggerHapticMedium } from "@/lib/haptics";

export type StaticDeviceType = "motor" | "aerator" | "light";

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
  accentHsl: string;
}

function deviceMeta(type: StaticDeviceType): DeviceMeta {
  switch (type) {
    case "motor":
      return {
        icon: Droplets,
        subtitle: "Water circulation",
        accentHsl: "205,80%,50%",
      };
    case "aerator":
      return {
        icon: Wind,
        subtitle: "Oxygen supply",
        accentHsl: "152,60%,48%",
      };
    case "light":
      return {
        icon: Lightbulb,
        subtitle: "Pond lighting",
        accentHsl: "38,92%,50%",
      };
  }
}

export function DeviceCard({ pondId, type, title, className }: DeviceCardProps) {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<DeviceMode>("manual");
  const [isWriting, setIsWriting] = useState(false);

  const meta = useMemo(() => deviceMeta(type), [type]);
  const { icon: Icon, subtitle } = meta;

  useEffect(() => {
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

  // Dynamic button styles based on state
  const getButtonStyles = () => {
    if (isAuto) {
      return "bg-muted/60 text-muted-foreground cursor-not-allowed border-border";
    }
    if (isOn) {
      return "bg-status-safe text-white border-status-safe shadow-[0_4px_20px_hsl(var(--status-safe)/0.4)]";
    }
    return "bg-destructive text-white border-destructive shadow-[0_4px_20px_hsl(var(--destructive)/0.3)]";
  };

  const getStatusBadgeStyles = () => {
    if (isAuto) {
      return "bg-primary/10 text-primary border-primary/20";
    }
    if (isOn) {
      return "bg-status-safe/10 text-status-safe border-status-safe/20";
    }
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getStatusText = () => {
    if (isAuto) return "AUTO";
    return isOn ? "ON" : "OFF";
  };

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300",
        isOn && !isAuto && "shadow-[0_0_20px_hsl(var(--status-safe)/0.15)]",
        className
      )}
      aria-label={`${title} control`}
    >
      {/* Status Badge - Top Right */}
      <div className="absolute top-4 right-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={getStatusText()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              getStatusBadgeStyles()
            )}
          >
            {getStatusText()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Device Info Row */}
      <div className="flex items-center gap-4 mb-6">
        {/* Icon Container */}
        <div
          className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300",
            isOn && !isAuto
              ? "bg-status-safe/10"
              : isAuto
              ? "bg-primary/10"
              : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "h-7 w-7 transition-colors duration-300",
              isOn && !isAuto
                ? "text-status-safe"
                : isAuto
                ? "text-primary"
                : "text-muted-foreground"
            )}
            strokeWidth={2}
          />
        </div>

        {/* Title & Subtitle */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Single Large Toggle Button */}
      <div className="flex justify-center py-2">
        <motion.button
          whileHover={!isAuto ? { scale: 1.03 } : undefined}
          whileTap={!isAuto ? { scale: 0.97 } : undefined}
          onClick={handleToggle}
          disabled={isWriting || isAuto}
          className={cn(
            "h-20 w-full max-w-[200px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 border-2 font-bold text-lg",
            getButtonStyles()
          )}
          aria-label={isAuto ? `${title} in auto mode` : `Toggle ${title}`}
        >
          <Power className="h-6 w-6" strokeWidth={2.5} />
          <span className="uppercase tracking-wide">
            {isAuto ? "Auto Mode" : isOn ? "ON" : "OFF"}
          </span>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-4" />

      {/* Mode Toggle Row */}
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
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border",
            isAuto
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          )}
        >
          {isAuto ? "AUTO" : "MANUAL"}
        </motion.button>
      </div>

      {/* Writing indicator overlay */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center backdrop-blur-[2px]"
          >
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
