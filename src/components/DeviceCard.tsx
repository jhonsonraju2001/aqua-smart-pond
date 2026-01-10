import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Wind, Lightbulb, Zap } from "lucide-react";

import { database } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

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
  accentClass: string;
  bgClass: string;
  glowClass: string;
}

function deviceMeta(type: StaticDeviceType): DeviceMeta {
  switch (type) {
    case "motor":
      return {
        icon: Droplets,
        subtitle: "Water Pump",
        accentClass: "text-[hsl(205,80%,50%)]",
        bgClass: "bg-[hsl(205,80%,50%)]/10",
        glowClass: "shadow-[0_0_20px_hsl(205,80%,50%,0.25)]",
      };
    case "aerator":
      return {
        icon: Wind,
        subtitle: "Aeration System",
        accentClass: "text-[hsl(152,60%,48%)]",
        bgClass: "bg-[hsl(152,60%,48%)]/10",
        glowClass: "shadow-[0_0_20px_hsl(152,60%,48%,0.25)]",
      };
    case "light":
      return {
        icon: Lightbulb,
        subtitle: "Pond Lighting",
        accentClass: "text-[hsl(38,92%,50%)]",
        bgClass: "bg-[hsl(38,92%,50%)]/10",
        glowClass: "shadow-[0_0_20px_hsl(38,92%,50%,0.25)]",
      };
  }
}

export function DeviceCard({ pondId, type, title, className }: DeviceCardProps) {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<DeviceMode>("manual");
  const [isWriting, setIsWriting] = useState(false);

  const { icon: Icon, subtitle, accentClass, bgClass, glowClass } = useMemo(
    () => deviceMeta(type),
    [type]
  );

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

  const handleTogglePower = async (checked: boolean) => {
    // Optimistic local UI update (does NOT affect siblings).
    setIsOn(checked);

    setIsWriting(true);
    try {
      // Manual override contract: set mode=manual before writing state.
      await set(ref(database, `ponds/${pondId}/devices/${type}/mode`), "manual");
      await set(ref(database, `ponds/${pondId}/devices/${type}/state`), checked ? 1 : 0);
      setMode("manual");
    } finally {
      setIsWriting(false);
    }
  };

  const handleAutoChange = async (checked: boolean) => {
    const nextMode: DeviceMode = checked ? "auto" : "manual";

    // Optimistic UI update.
    setMode(nextMode);

    setIsWriting(true);
    try {
      await set(ref(database, `ponds/${pondId}/devices/${type}/mode`), nextMode);
    } finally {
      setIsWriting(false);
    }
  };

  const isAuto = mode === "auto";

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-2xl border bg-card p-4 transition-all duration-300",
        isOn ? glowClass : "shadow-sm",
        className
      )}
      aria-label={`${title} control`}
    >
      {/* Top Row: Icon, Title, Status Pill */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Icon Container */}
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center transition-colors duration-300",
              isOn ? bgClass : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-colors duration-300",
                isOn ? accentClass : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Status Pill */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isOn ? "on" : "off"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300",
              isOn
                ? cn(bgClass, accentClass)
                : "bg-muted text-muted-foreground"
            )}
          >
            {isOn ? "ON" : "OFF"}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Toggle Switch (Primary Action) */}
      <div className="flex items-center justify-center py-3">
        <motion.div
          className="relative"
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.1 }}
        >
          <Switch
            checked={isOn}
            onCheckedChange={handleTogglePower}
            disabled={isWriting}
            aria-label={`Toggle ${title} power`}
            className={cn(
              "h-8 w-14 data-[state=checked]:bg-[hsl(var(--device-on))]",
              type === "motor" && "data-[state=checked]:bg-[hsl(205,80%,50%)]",
              type === "aerator" && "data-[state=checked]:bg-[hsl(152,60%,48%)]",
              type === "light" && "data-[state=checked]:bg-[hsl(38,92%,50%)]"
            )}
          />
        </motion.div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-3" />

      {/* Bottom Row: Auto Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap
            className={cn(
              "h-3.5 w-3.5 transition-colors duration-300",
              isAuto ? "text-device-auto" : "text-muted-foreground"
            )}
          />
          <span className="text-xs text-muted-foreground font-medium">
            Auto Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wide transition-colors duration-200",
              isAuto ? "text-device-auto" : "text-muted-foreground"
            )}
          >
            {isAuto ? "Auto" : "Manual"}
          </span>
          <Switch
            checked={isAuto}
            onCheckedChange={handleAutoChange}
            disabled={isWriting}
            aria-label={`Toggle ${title} auto mode`}
            className="h-5 w-9 data-[state=checked]:bg-device-auto"
          />
        </div>
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
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
