import React from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export type EmptyArt = 'vault' | 'heart' | 'signal' | 'squad' | 'chart' | 'search';

/** Original line illustrations in the crystal language. Stroke colors come from theme tokens. */
const Art = ({ kind }: { kind: EmptyArt }) => {
  const dim = 'rgb(var(--c-dim))';
  const red = 'rgb(var(--c-red-bright))';
  const mint = 'rgb(var(--c-mint))';
  const common = { fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 120 96" className="h-24 w-[120px]" aria-hidden>
      <ellipse cx="60" cy="86" rx="34" ry="4" fill={red} opacity="0.12" />
      {kind === 'vault' && (
        <g {...common}>
          <rect x="26" y="34" width="68" height="46" rx="6" stroke={dim} />
          <path d="M26 46h68" stroke={dim} />
          <path d="M60 10 74 24 60 40 46 24Z" stroke={red} className="animate-float" />
          <path d="M60 10v30M46 24h28" stroke={red} opacity="0.5" className="animate-float" />
          <circle cx="60" cy="62" r="7" stroke={mint} />
          <path d="M60 58v8M56 62h8" stroke={mint} />
        </g>
      )}
      {kind === 'heart' && (
        <g {...common}>
          <path d="M60 78 30 48a17 17 0 0 1 30-14 17 17 0 0 1 30 14Z" stroke={red} />
          <path d="M60 34 48 50l12 28 12-28Z" stroke={red} opacity="0.45" />
          <path d="M30 48h60" stroke={dim} opacity="0.6" />
          <circle cx="96" cy="20" r="2" fill={mint} stroke="none" className="animate-pulse-ring" />
          <circle cx="22" cy="28" r="1.5" fill={mint} stroke="none" />
        </g>
      )}
      {kind === 'signal' && (
        <g {...common}>
          <path d="M20 70h14l8-30 12 44 10-58 10 44h26" stroke={red} />
          <path d="M20 80h80" stroke={dim} opacity="0.5" />
          <circle cx="100" cy="70" r="3" stroke={mint} className="animate-pulse-ring" />
        </g>
      )}
      {kind === 'squad' && (
        <g {...common}>
          <circle cx="60" cy="34" r="12" stroke={red} />
          <path d="M38 78a22 22 0 0 1 44 0" stroke={red} />
          <circle cx="28" cy="44" r="8" stroke={dim} strokeDasharray="3 4" />
          <circle cx="92" cy="44" r="8" stroke={dim} strokeDasharray="3 4" />
          <path d="M92 40v8M88 44h8" stroke={mint} />
        </g>
      )}
      {kind === 'chart' && (
        <g {...common}>
          <path d="M24 78V22M24 78h74" stroke={dim} />
          <rect x="36" y="52" width="12" height="26" rx="2" stroke={red} />
          <rect x="56" y="36" width="12" height="42" rx="2" stroke={mint} strokeDasharray="3 4" />
          <rect x="76" y="60" width="12" height="18" rx="2" stroke={dim} strokeDasharray="3 4" />
        </g>
      )}
      {kind === 'search' && (
        <g {...common}>
          <circle cx="54" cy="42" r="22" stroke={dim} />
          <path d="m70 58 20 20" stroke={red} />
          <path d="M54 28 64 42 54 56 44 42Z" stroke={red} opacity="0.7" />
        </g>
      )}
    </svg>
  );
};

interface EmptyStateProps {
  art: EmptyArt;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
  'data-tour'?: string;
}

export const EmptyState = ({ art, title, body, actionLabel, onAction, className, compact, ...rest }: EmptyStateProps) => (
  <div
    {...rest}
    className={cn(
      'flex flex-col items-center rounded-3xl border border-dashed border-surface-border bg-surface-glass px-6 text-center',
      compact ? 'py-6' : 'py-10',
      className
    )}
  >
    <Art kind={art} />
    <h3 className="mt-3 font-heading text-base font-bold uppercase tracking-wide text-white">{title}</h3>
    {body && <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-text-dim">{body}</p>}
    {actionLabel && onAction && (
      <Button variant="neon" size="sm" className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);
