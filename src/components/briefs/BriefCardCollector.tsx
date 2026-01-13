'use client';

import { Brief } from '@/lib/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import Image from 'next/image';

interface BriefCardCollectorProps {
  brief: Brief;
  accentColor?: string;
}

/**
 * Collector Skin - Album style
 * - Large custom logo area (top 60%)
 * - Custom title overlay (bottom, gradient backdrop)
 * - Subtle cyan glow on hover
 * - Book icon if bookViewerEnabled
 */
export function BriefCardCollector({ brief, accentColor = '#00D9FF' }: BriefCardCollectorProps) {
  const displayTitle = brief.customTitle || brief.title;
  const hasLogo = !!brief.customLogoUrl;

  return (
    <Link href={`/brief/${brief.id}`}>
      <motion.div
        className="group relative rounded-xl overflow-hidden bg-surface border border-edge h-80 cursor-pointer"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        style={{
          boxShadow: `0 0 0 0 ${accentColor}20`,
        }}
      >
        {/* Logo Area (top 60%) */}
        <div className="h-[60%] bg-gradient-to-br from-surface to-base flex items-center justify-center p-6 relative overflow-hidden">
          {hasLogo ? (
            <Image
              src={brief.customLogoUrl!}
              alt={displayTitle}
              width={200}
              height={200}
              className="object-contain max-h-full w-auto"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {displayTitle.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Book viewer indicator */}
          {brief.bookViewerEnabled && (
            <div
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <BookOpen size={16} style={{ color: accentColor }} />
            </div>
          )}
        </div>

        {/* Title Overlay (bottom 40%) */}
        <div
          className="h-[40%] relative flex flex-col justify-center px-6 py-4"
          style={{
            background: `linear-gradient(to top, ${accentColor}15, transparent)`,
          }}
        >
          <h3 className="text-foreground font-semibold text-lg mb-1 line-clamp-2 group-hover:text-accent transition-colors">
            {displayTitle}
          </h3>
          <p className="text-muted text-sm">
            {new Date(brief.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            boxShadow: `inset 0 0 0 1px ${accentColor}40, 0 0 20px ${accentColor}20`,
          }}
        />
      </motion.div>
    </Link>
  );
}
