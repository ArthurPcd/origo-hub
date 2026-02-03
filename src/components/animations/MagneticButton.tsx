'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number; // 0 to 1, default 0.3
  zone?: number; // magnetic zone radius in pixels, default 100
}

export const MagneticButton = ({
  children,
  className = '',
  strength = 0.3,
  zone = 100,
}: MagneticButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from cursor to center
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX ** 2 + distY ** 2);

      if (distance < zone) {
        // Pull strength (0 to strength, max displacement)
        const pullStrength = (1 - distance / zone) * strength;
        x.set(distX * pullStrength);
        y.set(distY * pullStrength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    ref.current?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      ref.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [x, y, zone, strength]);

  return (
    <motion.button
      ref={ref}
      style={{ x: xSpring, y: ySpring }}
      className={className}
    >
      {children}
    </motion.button>
  );
};
