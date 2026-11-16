'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';

interface SegmentedProps<T extends string> {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** Unique per instance; drives the sliding pill. */
  name: string;
  label: string;
  className?: string;
}

/** Two-or-more option switch with a sliding pill (login tabs, language, theme). */
export function Segmented<T extends string>({ options, value, onChange, name, label, className }: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('relative flex rounded-2xl border border-surface-border bg-white/5 p-1', className)}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-tab={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative z-10 flex h-11 flex-1 items-center justify-center rounded-xl px-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors duration-150',
              active ? 'text-white' : 'text-text-dim hover:text-white'
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${name}`}
                transition={spring}
                className="absolute inset-0 -z-10 rounded-xl border border-neon-red/40 bg-neon-red/15"
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
