'use client';

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlitchCoordinateProps {
  children: ReactNode;
  className?: string;
  trigger?: 'hover' | 'always'; // default: hover
}

export const GlitchCoordinate = ({
  children,
  className = '',
  trigger = 'hover',
}: GlitchCoordinateProps) => {
  const [isActive, setIsActive] = useState(trigger === 'always');

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => trigger === 'hover' && setIsActive(true)}
      onMouseLeave={() => trigger === 'hover' && setIsActive(false)}
    >
      {children}

      {isActive && (
        <>
          {/* Cyan glitch layer */}
          <motion.div
            className="absolute inset-0 text-accent pointer-events-none"
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [-2, 2, -1, 1, 0],
              y: [1, -1, 1, -1, 0],
              opacity: [0.8, 0.6, 0.4, 0.2, 0],
            }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>

          {/* Magenta glitch layer (complementary) */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ color: '#FF00FF' }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [2, -2, 1, -1, 0],
              y: [-1, 1, -1, 1, 0],
              opacity: [0.8, 0.6, 0.4, 0.2, 0],
            }}
            transition={{ duration: 0.15, delay: 0.05 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </div>
  );
};
