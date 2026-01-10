import { useParams, useNavigate } from "react-router-dom";
import { usePondData } from "@/hooks/usePondData";
import { Header } from "@/components/Header";
import { DeviceCard } from "@/components/DeviceCard";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DeviceControls() {
  const { pondId } = useParams<{ pondId: string }>();
  const navigate = useNavigate();
  const { ponds, isLoading: pondsLoading } = usePondData();

  const pond = ponds.find((p) => p.id === pondId) || (ponds.length === 1 ? ponds[0] : null);
  const stablePondId = pondId || pond?.id || "pond1";

  if (pondsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pond) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Pond Not Found</h2>
          <Button onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Device Controls" showBack />

      <main className="p-4 max-w-lg mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ToggleRight className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{pond.name}</h2>
              <p className="text-xs text-muted-foreground">3 devices (static dashboard)</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/pond/${pond.id}/schedules`)}
            className="rounded-xl"
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schedules
          </Button>
        </motion.div>

        {/* STATIC Device Cards (always mounted; no loops; no conditions) */}
        <div className="space-y-3">
          <DeviceCard pondId={stablePondId} type="motor" title="Water Pump" />
          <DeviceCard pondId={stablePondId} type="aerator" title="Aerator" />
          <DeviceCard pondId={stablePondId} type="light" title="Light" />
        </div>

        {/* Helper text */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          Tapping a device only writes to its own Firebase path. All cards stay visible.
        </motion.p>
      </main>
    </div>
  );
}
