'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface AnimatedBackgroundProps {
  className?: string;
  showGrid?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className = '',
  showGrid = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 bg-white ${className}`}
      aria-hidden="true"
    >
      {/* Subtle Dot Grid Pattern with radial mask */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 40%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 40%, transparent 95%)',
          }}
        />
      )}

      {/* Aurora Ambient Glowing Orbs with Framer Motion */}
      {mounted && (
        <div className="absolute inset-0">
          {/* Orb 1: Primary Leaf Green (#5cb028) Top-Left to Center */}
          <motion.div
            className="absolute -top-24 -left-20 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#5cb028]/25 via-[#6ec437]/20 to-emerald-300/15 blur-[96px]"
            animate={{
              x: [0, 90, -40, 0],
              y: [0, 80, -50, 0],
              scale: [1, 1.18, 0.92, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Orb 2: Mint / Emerald Soft Glow Bottom-Right */}
          <motion.div
            className="absolute -bottom-28 -right-24 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-[#34d399]/20 via-[#5cb028]/15 to-[#a7f3d0]/20 blur-[110px]"
            animate={{
              x: [0, -80, 50, 0],
              y: [0, -70, 40, 0],
              scale: [1, 0.9, 1.15, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Orb 3: Central Soft Aura (subtle pulse behind card) */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-[#eaf5e3]/60 via-[#cdeac0]/35 to-[#5cb028]/10 blur-[120px]"
            animate={{
              scale: [0.92, 1.08, 0.96, 0.92],
              opacity: [0.7, 0.95, 0.8, 0.7],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Orb 4: Subtle Floating Pastel Accent */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-gradient-to-br from-[#86efac]/20 to-[#5cb028]/15 blur-[80px]"
            animate={{
              x: [0, -60, 40, 0],
              y: [0, 60, -30, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}
    </div>
  );
};
