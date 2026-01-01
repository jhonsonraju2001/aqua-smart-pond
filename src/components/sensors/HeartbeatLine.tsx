import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeartbeatLineProps {
  status: 'safe' | 'warning' | 'critical';
  isUpdating: boolean;
}

export function HeartbeatLine({ status, isUpdating }: HeartbeatLineProps) {
  const strokeColor = {
    safe: 'hsl(var(--status-safe))',
    warning: 'hsl(var(--status-warning))',
    critical: 'hsl(var(--status-critical))',
  };

  const animationSpeed = {
    safe: 2,
    warning: 1.2,
    critical: 0.6,
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden opacity-60">
      <svg
        viewBox="0 0 400 50"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`heartbeat-gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={strokeColor[status]} stopOpacity="0" />
            <stop offset="20%" stopColor={strokeColor[status]} stopOpacity="0.5" />
            <stop offset="50%" stopColor={strokeColor[status]} stopOpacity="1" />
            <stop offset="80%" stopColor={strokeColor[status]} stopOpacity="0.5" />
            <stop offset="100%" stopColor={strokeColor[status]} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M0,25 L30,25 L40,25 L50,10 L60,40 L70,5 L80,45 L90,25 L100,25 L130,25 L140,25 L150,10 L160,40 L170,5 L180,45 L190,25 L200,25 L230,25 L240,25 L250,10 L260,40 L270,5 L280,45 L290,25 L300,25 L330,25 L340,25 L350,10 L360,40 L370,5 L380,45 L390,25 L400,25"
          fill="none"
          stroke={`url(#heartbeat-gradient-${status})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathOffset: 0 }}
          animate={{ 
            pathOffset: [0, 1],
            strokeWidth: isUpdating ? [2, 3, 2] : 2,
          }}
          transition={{
            pathOffset: {
              duration: animationSpeed[status],
              repeat: Infinity,
              ease: "linear",
            },
            strokeWidth: {
              duration: 0.3,
            }
          }}
          style={{
            filter: `drop-shadow(0 0 4px ${strokeColor[status]})`,
          }}
        />
      </svg>
    </div>
  );
}
