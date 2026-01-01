import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FlaskConical,
  Droplets,
  Thermometer,
  Save,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ThresholdConfig {
  ph: {
    safeMin: number;
    safeMax: number;
    warningMin: number;
    warningMax: number;
  };
  do: {
    safeMin: number;
    warningMin: number;
  };
  temperature: {
    safeMin: number;
    safeMax: number;
    warningMin: number;
    warningMax: number;
  };
}

const defaultThresholds: ThresholdConfig = {
  ph: {
    safeMin: 6.5,
    safeMax: 8.5,
    warningMin: 6.0,
    warningMax: 9.0,
  },
  do: {
    safeMin: 5.0,
    warningMin: 3.0,
  },
  temperature: {
    safeMin: 24,
    safeMax: 32,
    warningMin: 20,
    warningMax: 35,
  },
};

export default function ThresholdSettings() {
  const navigate = useNavigate();
  const [thresholds, setThresholds] = useState<ThresholdConfig>(() => {
    const saved = localStorage.getItem('sensorThresholds');
    return saved ? JSON.parse(saved) : defaultThresholds;
  });

  const handleSave = () => {
    localStorage.setItem('sensorThresholds', JSON.stringify(thresholds));
    toast.success('Thresholds saved successfully');
  };

  const handleReset = () => {
    setThresholds(defaultThresholds);
    localStorage.removeItem('sensorThresholds');
    toast.info('Thresholds reset to defaults');
  };

  const updateThreshold = (
    sensor: keyof ThresholdConfig,
    field: string,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setThresholds(prev => ({
      ...prev,
      [sensor]: {
        ...prev[sensor],
        [field]: numValue,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Threshold Settings" showBack />
      
      <main className="p-4 max-w-lg mx-auto space-y-4">
        {/* pH Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <FlaskConical className="h-4 w-4 text-violet-600" />
                </div>
                pH Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Safe Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={thresholds.ph.safeMin}
                      onChange={(e) => updateThreshold('ph', 'safeMin', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={thresholds.ph.safeMax}
                      onChange={(e) => updateThreshold('ph', 'safeMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Warning Range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={thresholds.ph.warningMin}
                      onChange={(e) => updateThreshold('ph', 'warningMin', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={thresholds.ph.warningMax}
                      onChange={(e) => updateThreshold('ph', 'warningMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Values outside warning range are critical
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dissolved Oxygen Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Droplets className="h-4 w-4 text-blue-600" />
                </div>
                Dissolved Oxygen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Safe Min (mg/L)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={thresholds.do.safeMin}
                    onChange={(e) => updateThreshold('do', 'safeMin', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Warning Min (mg/L)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={thresholds.do.warningMin}
                    onChange={(e) => updateThreshold('do', 'warningMin', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Below warning min is critical
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Temperature Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Thermometer className="h-4 w-4 text-orange-600" />
                </div>
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Safe Range (°C)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input
                      type="number"
                      step="1"
                      value={thresholds.temperature.safeMin}
                      onChange={(e) => updateThreshold('temperature', 'safeMin', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      step="1"
                      value={thresholds.temperature.safeMax}
                      onChange={(e) => updateThreshold('temperature', 'safeMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Warning Range (°C)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Min</Label>
                    <Input
                      type="number"
                      step="1"
                      value={thresholds.temperature.warningMin}
                      onChange={(e) => updateThreshold('temperature', 'warningMin', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max</Label>
                    <Input
                      type="number"
                      step="1"
                      value={thresholds.temperature.warningMax}
                      onChange={(e) => updateThreshold('temperature', 'warningMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex gap-3 pt-2"
        >
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
