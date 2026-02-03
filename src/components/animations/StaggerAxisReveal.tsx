'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import React from 'react';

interface StaggerAxisRevealProps {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const StaggerAxisReveal = ({
  children,
  direction = 'vertical',
  className = '',
}: StaggerAxisRevealProps) => {
  const childArray = React.Children.toArray(children);

  return (
    <motion.div
      className={`relative ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.15,
          },
        },
      }}
    >
      {childArray.map((child, index) => (
        <motion.div
          key={index}
          className="relative"
          variants={{
            hidden: {
              opacity: 0,
              y: direction === 'vertical' ? 20 : 0,
              x: direction === 'horizontal' ? 20 : 0,
            },
            visible: {
              opacity: 1,
              y: 0,
              x: 0,
              transition: {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
        >
          {/* Axis line that appears before content */}
          <motion.div
            className={`absolute ${
              direction === 'vertical'
                ? 'left-0 top-0 w-px h-8 -translate-y-12'
                : 'left-0 top-0 h-px w-8 -translate-x-12'
            } bg-accent`}
            initial={{
              scaleY: direction === 'vertical' ? 0 : 1,
              scaleX: direction === 'horizontal' ? 0 : 1,
              opacity: 0,
            }}
            animate={{
              scaleY: 1,
              scaleX: 1,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.4,
              ease: 'easeOut',
              delay: index * 0.15 - 0.1, // Appears just before content
            }}
          />

          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
