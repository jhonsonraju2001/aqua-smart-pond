import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WaveBackgroundProps {
  status: 'safe' | 'warning' | 'critical';
}

export function WaveBackground({ status }: WaveBackgroundProps) {
  const waveColors = {
    safe: 'hsl(var(--status-safe) / 0.08)',
    warning: 'hsl(var(--status-warning) / 0.08)',
    critical: 'hsl(var(--status-critical) / 0.08)',
  };

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      {/* Wave 1 */}
      <motion.div
        className="absolute -bottom-4 left-0 right-0 h-24"
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
            fill={waveColors[status]}
          />
        </svg>
      </motion.div>

      {/* Wave 2 */}
      <motion.div
        className="absolute -bottom-2 left-0 right-0 h-20"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,80 C200,40 400,100 600,80 C800,60 1000,100 1200,80 L1200,120 L0,120 Z"
            fill={waveColors[status]}
          />
        </svg>
      </motion.div>

      {/* Wave 3 - Ripple effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-16"
        animate={{
          y: [0, -4, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,100 C300,80 600,110 900,90 C1050,80 1150,100 1200,100 L1200,120 L0,120 Z"
            fill={waveColors[status]}
          />
        </svg>
      </motion.div>
    </div>
  );
}
