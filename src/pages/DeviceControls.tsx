import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ref, set } from "firebase/database";
import { usePondData } from "@/hooks/usePondData";
import { database } from "@/lib/firebase";
import { Header } from "@/components/Header";
import { DeviceCard } from "@/components/DeviceCard";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, PowerOff, Power } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { triggerHapticHeavy } from "@/lib/haptics";

export default function DeviceControls() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();
  const [isAllOff, setIsAllOff] = useState(false);
  const [isAllOn, setIsAllOn] = useState(false);

  const pond = ponds.find((p) => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);
  const stablePondId = pondId || pond?.id || "pond1";

  const handleAllOff = async () => {
    triggerHapticHeavy();
    setIsAllOff(true);
    try {
      const devices = ["motor", "aerator", "light"];
      await Promise.all(
        devices.map(async (device) => {
          await set(ref(database, `ponds/${stablePondId}/devices/${device}/mode`), "manual");
          await set(ref(database, `ponds/${stablePondId}/devices/${device}/state`), 0);
        })
      );
      toast.success("All devices turned off");
    } catch (error) {
      toast.error("Failed to turn off devices");
    } finally {
      setIsAllOff(false);
    }
  };

  const handleAllOn = async () => {
    triggerHapticHeavy();
    setIsAllOn(true);
    try {
      const devices = ["motor", "aerator", "light"];
      await Promise.all(
        devices.map(async (device) => {
          await set(ref(database, `ponds/${stablePondId}/devices/${device}/mode`), "manual");
          await set(ref(database, `ponds/${stablePondId}/devices/${device}/state`), 1);
        })
      );
      toast.success("All devices turned on");
    } catch (error) {
      toast.error("Failed to turn on devices");
    } finally {
      setIsAllOn(false);
    }
  };

  if (pondsLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pond) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Pond Not Found</h2>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      <Header title="Device Controls" showBack />

      <main className="p-4 max-w-md mx-auto">
        {/* Header with Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-5"
        >
          {/* Pond Info */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{pond.name}</h2>
              <p className="text-xs text-muted-foreground">3 devices connected</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/pond/${pond.id}/schedules`)}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Schedules
            </Button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-3">
            {/* All On Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAllOn}
              disabled={isAllOn || isAllOff}
              className="flex-1 text-status-safe border-status-safe/30 hover:bg-status-safe/10 hover:text-status-safe gap-2"
            >
              {isAllOn ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              All On
            </Button>

            {/* All Off Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAllOff}
              disabled={isAllOff || isAllOn}
              className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2"
            >
              {isAllOff ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
              All Off
            </Button>
          </div>
        </motion.div>

        {/* STATIC Device Cards */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <DeviceCard pondId={stablePondId} type="motor" title="Water Pump" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <DeviceCard pondId={stablePondId} type="aerator" title="Aerator" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <DeviceCard pondId={stablePondId} type="light" title="Light" />
          </motion.div>
        </div>

        {/* Subtle footer hint */}
        <motion.p
          className="text-center text-[11px] text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.25 }}
        >
          Tap the button to toggle each device
        </motion.p>
      </main>
    </div>
  );
}
