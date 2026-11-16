import React from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'neon' | 'mint';
  children: React.ReactNode;
}

export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'border-surface-border bg-white/5 text-white',
    live: 'border-neon-red/40 bg-neon-red/15 text-neon-red-bright',
    neon: 'border-transparent bg-neon-red text-real-white shadow-neon',
    mint: 'border-mint-green/40 bg-mint-green/15 text-mint-green',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest',
        variants[variant],
        className
      )}
      {...props}
    >
      {variant === 'live' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-neon-red-bright" />}
      {children}
    </span>
  );
};
