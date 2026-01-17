import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Wind, Lightbulb, Zap, Power } from "lucide-react";

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
  accentHsl: string;
  accentClass: string;
  bgClass: string;
  glowClass: string;
  buttonOnClass: string;
  buttonOffClass: string;
}

function deviceMeta(type: StaticDeviceType): DeviceMeta {
  switch (type) {
    case "motor":
      return {
        icon: Droplets,
        subtitle: "Water Pump",
        accentHsl: "205,80%,50%",
        accentClass: "text-[hsl(205,80%,50%)]",
        bgClass: "bg-[hsl(205,80%,50%)]/10",
        glowClass: "shadow-[0_0_24px_hsl(205,80%,50%,0.3)]",
        buttonOnClass: "bg-[hsl(205,80%,50%)] shadow-[0_0_30px_hsl(205,80%,50%,0.5)]",
        buttonOffClass: "bg-muted hover:bg-muted/80",
      };
    case "aerator":
      return {
        icon: Wind,
        subtitle: "Aeration System",
        accentHsl: "152,60%,48%",
        accentClass: "text-[hsl(152,60%,48%)]",
        bgClass: "bg-[hsl(152,60%,48%)]/10",
        glowClass: "shadow-[0_0_24px_hsl(152,60%,48%,0.3)]",
        buttonOnClass: "bg-[hsl(152,60%,48%)] shadow-[0_0_30px_hsl(152,60%,48%,0.5)]",
        buttonOffClass: "bg-muted hover:bg-muted/80",
      };
    case "light":
      return {
        icon: Lightbulb,
        subtitle: "Pond Lighting",
        accentHsl: "38,92%,50%",
        accentClass: "text-[hsl(38,92%,50%)]",
        bgClass: "bg-[hsl(38,92%,50%)]/10",
        glowClass: "shadow-[0_0_24px_hsl(38,92%,50%,0.3)]",
        buttonOnClass: "bg-[hsl(38,92%,50%)] shadow-[0_0_30px_hsl(38,92%,50%,0.5)]",
        buttonOffClass: "bg-muted hover:bg-muted/80",
      };
  }
}

export function DeviceCard({ pondId, type, title, className }: DeviceCardProps) {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<DeviceMode>("manual");
  const [isWriting, setIsWriting] = useState(false);

  const meta = useMemo(() => deviceMeta(type), [type]);
  const { icon: Icon, subtitle, accentClass, bgClass, glowClass, buttonOnClass, buttonOffClass } = meta;

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

  const handleTogglePower = async (turnOn: boolean) => {
    // Optimistic local UI update
    setIsOn(turnOn);

    setIsWriting(true);
    try {
      await set(ref(database, `ponds/${pondId}/devices/${type}/mode`), "manual");
      await set(ref(database, `ponds/${pondId}/devices/${type}/state`), turnOn ? 1 : 0);
      setMode("manual");
    } finally {
      setIsWriting(false);
    }
  };

  const handleAutoChange = async (checked: boolean) => {
    const nextMode: DeviceMode = checked ? "auto" : "manual";
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
        "relative rounded-2xl border bg-card p-5 transition-all duration-300",
        isOn ? glowClass : "shadow-sm",
        className
      )}
      aria-label={`${title} control`}
    >
      {/* Top Row: Icon, Title, Status Pill */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {/* Icon Container */}
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center transition-colors duration-300",
              isOn ? bgClass : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6 transition-colors duration-300",
                isOn ? accentClass : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="text-base font-semibold text-foreground leading-tight">
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
              "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors duration-300",
              isOn
                ? cn(bgClass, accentClass)
                : "bg-muted text-muted-foreground"
            )}
          >
            {isOn ? "ON" : "OFF"}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Large Circular ON/OFF Buttons */}
      <div className="flex items-center justify-center gap-6 py-4">
        {/* OFF Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTogglePower(false)}
          disabled={isWriting}
          className={cn(
            "h-20 w-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-2",
            !isOn
              ? "bg-muted/80 border-foreground/20 text-foreground"
              : "bg-background border-border text-muted-foreground hover:border-foreground/30"
          )}
          aria-label={`Turn ${title} off`}
        >
          <Power className="h-7 w-7 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Off</span>
        </motion.button>

        {/* ON Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleTogglePower(true)}
          disabled={isWriting}
          className={cn(
            "h-20 w-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-2",
            isOn
              ? cn(buttonOnClass, "border-transparent text-white")
              : "bg-background border-border text-muted-foreground hover:border-foreground/30"
          )}
          aria-label={`Turn ${title} on`}
        >
          <Power className="h-7 w-7 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-bold uppercase tracking-wide">On</span>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="h-px bg-border my-4" />

      {/* Bottom Row: Auto Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap
            className={cn(
              "h-4 w-4 transition-colors duration-300",
              isAuto ? "text-device-auto" : "text-muted-foreground"
            )}
          />
          <span className="text-sm text-muted-foreground font-medium">
            Auto Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wide transition-colors duration-200",
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
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
