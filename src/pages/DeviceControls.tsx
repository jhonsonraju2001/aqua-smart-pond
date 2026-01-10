import { useParams, useNavigate } from "react-router-dom";
import { usePondData } from "@/hooks/usePondData";
import { Header } from "@/components/Header";
import { DeviceCard } from "@/components/DeviceCard";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function DeviceControls() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();

  const pond = ponds.find((p) => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);
  const stablePondId = pondId || pond?.id || "pond1";

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
        {/* Minimal Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between mb-5"
        >
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
        </motion.div>

        {/* STATIC Device Cards (always mounted; no loops; no conditions) */}
        <div className="space-y-3">
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
          Tap the toggle to control each device
        </motion.p>
      </main>
    </div>
  );
}
