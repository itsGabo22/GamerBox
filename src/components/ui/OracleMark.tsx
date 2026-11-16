import React from 'react';
import { cn } from '@/lib/cn';

/**
 * The Oracle's own glyph: an eye cut into an obsidian shard.
 * Replaces generic sparkle / "AI" marks everywhere the Oracle or Advisor speaks.
 */
export const OracleMark = ({ size = 20, className, active = false }: { size?: number; className?: string; active?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(active && 'animate-pulse-ring', className)}
    aria-hidden
  >
    <path d="M12 2 20 8.5 17.5 19 12 22 6.5 19 4 8.5Z" />
    <path d="M7 12.2c1.6-2.3 3.2-3.4 5-3.4s3.4 1.1 5 3.4c-1.6 2.3-3.2 3.4-5 3.4s-3.4-1.1-5-3.4Z" />
    <circle cx="12" cy="12.2" r="1.4" fill="currentColor" stroke="none" />
    <path d="M12 2v3.2M12 19v3" opacity="0.55" />
  </svg>
);
