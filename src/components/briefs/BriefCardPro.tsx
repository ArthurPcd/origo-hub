'use client';

import { Brief } from '@/lib/types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface BriefCardProProps {
  brief: Brief;
  accentColor?: string;
}

/**
 * Pro Skin - Minimal & Clean
 * - Simple border, focus on readability
 * - Small logo thumbnail (optional, top-left corner)
 * - Clean typography
 * - No fancy effects
 */
export function BriefCardPro({ brief, accentColor = '#6B7CFF' }: BriefCardProProps) {
  const displayTitle = brief.customTitle || brief.title;
  const hasLogo = !!brief.customLogoUrl;

  return (
    <Link href={`/brief/${brief.id}`}>
      <motion.div
        className="group relative rounded-lg overflow-hidden bg-surface border border-edge p-6 h-60 cursor-pointer flex flex-col"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
      >
        {/* Header with optional logo */}
        <div className="flex items-start gap-3 mb-4">
          {hasLogo && (
            <Image
              src={brief.customLogoUrl!}
              alt={displayTitle}
              width={40}
              height={40}
              className="object-contain rounded"
            />
          )}
          <div className="flex-1">
            <h3 className="text-foreground font-semibold text-base line-clamp-2 mb-1 group-hover:text-accent transition-colors">
              {displayTitle}
            </h3>
            <p className="text-muted text-xs">
              {new Date(brief.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-muted text-sm line-clamp-4 flex-1">
          {brief.content.substring(0, 200)}...
        </p>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: accentColor }}
        />
      </motion.div>
    </Link>
  );
}
