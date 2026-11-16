import React from 'react';
import { cn } from '@/lib/cn';

interface WordmarkProps {
  tagline?: string;
  glitch?: boolean;
  className?: string;
  as?: 'h1' | 'p';
}

/** GAMERBOX in Space Grotesk caps with the mono tagline underneath. */
export const Wordmark = ({ tagline, glitch = false, className, as: Tag = 'p' }: WordmarkProps) => (
  <div className={cn('flex flex-col items-center text-center', className)}>
    <Tag
      className={cn(
        'font-heading text-[2.5rem] font-black uppercase leading-none tracking-[0.08em] text-white text-glow-red',
        glitch && 'gb-glitch'
      )}
    >
      Gamer<span className="text-neon-red-bright">Box</span>
    </Tag>
    {tagline && (
      <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.5em] text-text-dim" style={{ marginRight: '-0.5em' }}>
        {tagline}
      </p>
    )}
  </div>
);
