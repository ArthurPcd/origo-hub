'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GridAssemblyProps {
  children: ReactNode;
  className?: string;
  delay?: number; // delay before animation starts, in seconds
  gridSize?: number; // number of grid lines (default: 8)
}

export const GridAssembly = ({
  children,
  className = '',
  delay = 0,
  gridSize = 8,
}: GridAssemblyProps) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.94,
        filter: 'blur(8px)',
      }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative ${className}`}
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent calc(100% / ${gridSize} - 1px), rgba(0, 217, 255, 0.08) calc(100% / ${gridSize})),
          repeating-linear-gradient(90deg, transparent, transparent calc(100% / ${gridSize} - 1px), rgba(0, 217, 255, 0.08) calc(100% / ${gridSize}))
        `,
      }}
    >
      {children}
    </motion.div>
  );
};
