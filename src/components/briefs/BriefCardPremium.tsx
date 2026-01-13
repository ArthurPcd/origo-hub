'use client';

import { Brief } from '@/lib/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface BriefCardPremiumProps {
  brief: Brief;
  accentColor?: string;
}

/**
 * Premium Skin - Elegant & Sophisticated
 * - Gradient borders (purple/amber)
 * - Dark elegant theme
 * - Premium feel without being flashy
 * - Sparkle icon for premium indicator
 */
export function BriefCardPremium({ brief, accentColor = '#A855F7' }: BriefCardPremiumProps) {
  const displayTitle = brief.customTitle || brief.title;
  const hasLogo = !!brief.customLogoUrl;

  return (
    <Link href={`/brief/${brief.id}`}>
      <motion.div
        className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-surface via-base to-surface p-6 h-72 cursor-pointer flex flex-col"
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        style={{
          border: `1px solid transparent`,
          backgroundImage: `
            linear-gradient(var(--color-base), var(--color-base)) padding-box,
            linear-gradient(135deg, ${accentColor}40, ${accentColor}10) border-box
          `,
        }}
      >
        {/* Premium indicator */}
        <div className="absolute top-4 right-4">
          <Sparkles size={18} style={{ color: accentColor }} />
        </div>

        {/* Logo area */}
        {hasLogo && (
          <div className="mb-4 flex justify-center">
            <Image
              src={brief.customLogoUrl!}
              alt={displayTitle}
              width={80}
              height={80}
              className="object-contain rounded-lg"
            />
          </div>
        )}

        {/* Title */}
        <h3
          className="text-foreground font-bold text-xl mb-2 line-clamp-2 group-hover:opacity-90 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {displayTitle}
        </h3>

        {/* Metadata */}
        <p className="text-muted text-xs mb-3">
          {new Date(brief.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>

        {/* Content preview */}
        <p className="text-muted text-sm line-clamp-3 flex-1">
          {brief.content.substring(0, 150)}...
        </p>

        {/* Hover gradient glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
          style={{
            boxShadow: `inset 0 0 0 2px ${accentColor}30, 0 8px 32px ${accentColor}20`,
          }}
        />
      </motion.div>
    </Link>
  );
}
