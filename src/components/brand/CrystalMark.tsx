import React from 'react';
import { cn } from '@/lib/cn';

/**
 * The Obsidian Core in 2D: ten faceted shards with neon edges.
 * Original artwork, shared by the splash first frame, the CSS intro fallback,
 * the Home hero and the tutorial so everything speaks the same visual language.
 */
const SHARDS: { points: string; shade: number; from: [number, number, number] }[] = [
  { points: '60,4 104,44 60,50', shade: 0.95, from: [34, -70, 40] },
  { points: '60,4 60,50 16,44', shade: 0.55, from: [-36, -72, -35] },
  { points: '16,44 60,50 42,84', shade: 0.75, from: [-74, -18, 60] },
  { points: '16,44 42,84 24,104', shade: 0.35, from: [-80, 26, -50] },
  { points: '60,50 104,44 78,84', shade: 0.6, from: [70, -22, -45] },
  { points: '104,44 96,104 78,84', shade: 0.3, from: [84, 30, 55] },
  { points: '60,50 78,84 42,84', shade: 1, from: [0, -40, 90] },
  { points: '42,84 78,84 60,146', shade: 0.5, from: [4, 80, -30] },
  { points: '24,104 42,84 60,146', shade: 0.25, from: [-52, 76, 45] },
  { points: '78,84 96,104 60,146', shade: 0.4, from: [56, 74, -60] },
];

interface CrystalMarkProps {
  className?: string;
  /** assemble: shards fly in and lock (intro fallback). idle: slow float. */
  animation?: 'assemble' | 'idle' | 'none';
  /** Stagger base for `assemble`, in ms. */
  delay?: number;
  title?: string;
}

export const CrystalMark = ({ className, animation = 'none', delay = 0, title }: CrystalMarkProps) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="-20 -16 160 182"
      className={cn(animation === 'idle' && 'animate-float', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2d3c" />
          <stop offset="0.55" stopColor="#12141d" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ff003c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff003c" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <ellipse
        cx="60" cy="76" rx="76" ry="84" fill={`url(#${id}-glow)`}
        style={animation === 'assemble' ? { animation: `gb-fade-in 500ms ${delay + 420}ms both` } : undefined}
      />

      {SHARDS.map((s, i) => (
        <g
          key={i}
          style={
            animation === 'assemble'
              ? ({
                  '--sx': `${s.from[0]}px`,
                  '--sy': `${s.from[1]}px`,
                  '--sr': `${s.from[2]}deg`,
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                  animation: `gb-shard-in 520ms cubic-bezier(0.22,1,0.36,1) ${delay + i * 38}ms both`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <polygon points={s.points} fill={`url(#${id}-face)`} opacity={0.55 + s.shade * 0.45} />
          <polygon points={s.points} fill="#ff003c" opacity={s.shade * 0.07} />
          <polygon points={s.points} fill="none" stroke="#ff003c" strokeWidth="2.4" opacity="0.5" filter={`url(#${id}-blur)`} />
          <polygon points={s.points} fill="none" stroke="#ff2a55" strokeWidth="0.9" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
};

/** The neon "GB" monogram tile: identical glyph to the app icon and native splash (assets/brand/gb-mark.svg). */
export const GBMark = ({ className }: { className?: string }) => (
  <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neon-red shadow-neon', className)} aria-hidden>
    <svg viewBox="27 27 54 54" className="h-full w-full" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="square">
      <path d="M49 43.5H38.5V64.5H49V54.5H45" />
      <path d="M58.5 43.5V64.5H66.5a5.25 5.25 0 0 0 0-10.5H58.5M58.5 43.5H65.5a5.25 5.25 0 0 1 0 10.5" />
    </svg>
  </span>
);
