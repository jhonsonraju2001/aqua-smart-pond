import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PulseValueProps {
  value: number;
  decimals: number;
  unit: string;
  status: 'safe' | 'warning' | 'critical';
}

export function PulseValue({ value, decimals, unit, status }: PulseValueProps) {
  const statusColors = {
    safe: 'text-status-safe',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
  };

  const glowColors = {
    safe: '0 0 20px hsl(var(--status-safe) / 0.5)',
    warning: '0 0 20px hsl(var(--status-warning) / 0.5)',
    critical: '0 0 30px hsl(var(--status-critical) / 0.7)',
  };

  const pulseSpeed = {
    safe: 2,
    warning: 1.2,
    critical: 0.5,
  };

  return (
    <div className="flex items-baseline gap-1.5">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          className="relative"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Glow effect behind the value */}
          <motion.div
            className={cn(
              'absolute inset-0 blur-xl rounded-full',
              status === 'safe' && 'bg-status-safe/20',
              status === 'warning' && 'bg-status-warning/30',
              status === 'critical' && 'bg-status-critical/40'
            )}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: pulseSpeed[status],
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Main value with pulse animation */}
          <motion.span
            className={cn(
              'relative text-5xl font-bold tracking-tight tabular-nums',
              statusColors[status]
            )}
            style={{
              textShadow: glowColors[status],
            }}
            animate={status !== 'safe' ? {
              scale: [1, 1.02, 1],
            } : {}}
            transition={{
              duration: pulseSpeed[status],
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {value.toFixed(decimals)}
          </motion.span>
        </motion.div>
      </AnimatePresence>
      
      <motion.span 
        className="text-xl text-muted-foreground/80 font-medium"
        animate={status !== 'safe' ? {
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={{
          duration: pulseSpeed[status],
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {unit}
      </motion.span>
    </div>
  );
}
