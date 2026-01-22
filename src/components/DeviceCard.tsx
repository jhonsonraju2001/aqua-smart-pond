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

// Water Wave Animation Component
function WaterWaveAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(205,80%,50%/0.15)] to-[hsl(205,80%,60%/0.25)]" />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-full"
        style={{ background: 'linear-gradient(180deg, transparent 0%, hsl(205,80%,50%/0.1) 50%, hsl(205,80%,50%/0.2) 100%)' }}
      >
        {/* Wave 1 */}
        <motion.svg
          className="absolute bottom-0 w-[200%] h-16"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          animate={{ x: [0, -600] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
            fill="hsl(205,80%,50%/0.3)"
          />
        </motion.svg>
        {/* Wave 2 */}
        <motion.svg
          className="absolute bottom-0 w-[200%] h-12"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          animate={{ x: [-300, -900] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M0,80 C200,40 400,100 600,60 C800,20 1000,80 1200,60 L1200,120 L0,120 Z"
            fill="hsl(205,80%,60%/0.25)"
          />
        </motion.svg>
      </motion.div>
    </div>
  );
}

// Bubble Animation Component
function BubbleAnimation() {
  const bubbles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${10 + Math.random() * 80}%`,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(152,60%,48%/0.15)] to-[hsl(152,60%,60%/0.08)]" />
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full bg-[hsl(152,60%,55%/0.4)] border border-[hsl(152,60%,60%/0.3)]"
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
          }}
          initial={{ bottom: -20, opacity: 0 }}
          animate={{ 
            bottom: ['0%', '100%'],
            opacity: [0, 0.8, 0.8, 0],
            x: [0, Math.random() * 20 - 10, Math.random() * 20 - 10, 0]
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

// Light Glow Animation Component
function LightGlowAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, hsl(38,92%,50%/0.25) 0%, hsl(38,92%,50%/0.1) 40%, transparent 70%)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Light rays */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[0, 45, 90, 135].map((angle) => (
          <motion.div
            key={angle}
            className="absolute top-1/2 left-1/2 w-1 h-16 origin-bottom"
            style={{ 
              transform: `rotate(${angle}deg) translateX(-50%)`,
              background: 'linear-gradient(to top, hsl(38,92%,50%/0.3), transparent)'
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: angle * 0.01 }}
          />
        ))}
      </motion.div>
      {/* Warm glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(38,92%,50%/0.08)] to-[hsl(38,92%,60%/0.15)]" />
    </div>
  );
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
  const showAnimation = isOn && !isAuto;

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

  // Render device-specific animation
  const renderAnimation = () => {
    if (!showAnimation) return null;
    
    switch (type) {
      case "motor":
        return <WaterWaveAnimation />;
      case "aerator":
        return <BubbleAnimation />;
      case "light":
        return <LightGlowAnimation />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 overflow-hidden",
        isOn && !isAuto && "shadow-lg",
        className
      )}
      aria-label={`${title} control`}
    >
      {/* Device-specific Animation Background */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-0"
          >
            {renderAnimation()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Status Badge - Top Right */}
        <div className="absolute top-0 right-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={getStatusText()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm",
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
              "h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm",
              isOn && !isAuto
                ? "bg-status-safe/20"
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
              "h-20 w-full max-w-[200px] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 border-2 font-bold text-lg backdrop-blur-sm",
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
        <div className="h-px bg-border/50 my-4 backdrop-blur-sm" />

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
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border backdrop-blur-sm",
              isAuto
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted/80 text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {isAuto ? "AUTO" : "MANUAL"}
          </motion.button>
        </div>
      </div>

      {/* Writing indicator overlay */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center backdrop-blur-[2px] z-20"
          >
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
