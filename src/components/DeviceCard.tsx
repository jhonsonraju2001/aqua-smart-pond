import { useEffect, useMemo, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { motion } from "framer-motion";
import { Fan, Lightbulb, Power, Waves } from "lucide-react";

import { database } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export type StaticDeviceType = "motor" | "aerator" | "light";

interface DeviceCardProps {
  pondId: string;
  type: StaticDeviceType;
  title: string;
  className?: string;
}

type DeviceMode = "manual" | "auto";

function deviceMeta(type: StaticDeviceType) {
  switch (type) {
    case "motor":
      return { icon: Waves, subtitle: "Water Pump" };
    case "aerator":
      return { icon: Fan, subtitle: "Aeration" };
    case "light":
      return { icon: Lightbulb, subtitle: "Lighting" };
  }
}

export function DeviceCard({ pondId, type, title, className }: DeviceCardProps) {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<DeviceMode>("manual");
  const [isPressing, setIsPressing] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  const { icon: Icon, subtitle } = useMemo(() => deviceMeta(type), [type]);

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

  const handleTogglePower = async () => {
    // Local-only press feedback.
    setIsPressing(true);
    window.setTimeout(() => setIsPressing(false), 140);

    const nextOn = !isOn;

    // Optimistic local UI update (does NOT affect siblings).
    setIsOn(nextOn);

    setIsWriting(true);
    try {
      // Manual override contract: set mode=manual before writing state.
      await set(ref(database, `ponds/${pondId}/devices/${type}/mode`), "manual");
      await set(ref(database, `ponds/${pondId}/devices/${type}/state`), nextOn ? 1 : 0);
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
    <Card
      variant="device"
      className={cn("rounded-2xl", className)}
      aria-label={`${title} control`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-11 w-11 rounded-2xl flex items-center justify-center border",
                isOn
                  ? "bg-status-safe/10 border-status-safe/20"
                  : "bg-status-critical/10 border-status-critical/20"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isOn ? "text-status-safe" : "text-status-critical"
                )}
              />
            </div>

            <div>
              <div className="text-base font-semibold text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={cn(
                "text-xs font-medium",
                isOn ? "text-status-safe" : "text-status-critical"
              )}
            >
              {isOn ? "ON" : "OFF"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isAuto ? "Auto" : "Manual"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-4">
          <motion.button
            type="button"
            onClick={handleTogglePower}
            onPointerDown={() => setIsPressing(true)}
            onPointerUp={() => setIsPressing(false)}
            onPointerCancel={() => setIsPressing(false)}
            disabled={isWriting}
            className={cn(
              "w-full rounded-2xl border px-4 py-4 flex items-center justify-center gap-2 transition-colors",
              isOn
                ? "bg-status-safe/10 border-status-safe/20"
                : "bg-status-critical/10 border-status-critical/20"
            )}
            animate={{ scale: isPressing ? 0.98 : 1 }}
            transition={{ duration: 0.08 }}
            aria-pressed={isOn}
          >
            <Power
              className={cn(
                "h-5 w-5",
                isOn ? "text-status-safe" : "text-status-critical"
              )}
            />
            <span className="text-sm font-semibold text-foreground">
              {isWriting ? "Updating…" : isOn ? "Turn Off" : "Turn On"}
            </span>
          </motion.button>

          <div className="shrink-0 flex items-center gap-2 rounded-2xl border px-3 py-3 bg-card">
            <span className="text-xs text-muted-foreground">Auto</span>
            <Switch
              checked={isAuto}
              onCheckedChange={handleAutoChange}
              disabled={isWriting}
              aria-label={`Toggle ${title} auto mode`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
