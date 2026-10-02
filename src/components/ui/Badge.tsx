import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'neon';
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center px-2 py-1 rounded text-xs font-mono font-bold tracking-widest uppercase';
    
    const variants = {
      default: 'bg-white/10 text-white border border-white/20',
      live: 'bg-neon-red/20 text-neon-red-bright border border-neon-red/30',
      neon: 'bg-neon-red text-white shadow-neon',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {variant === 'live' && (
          <span className="w-1.5 h-1.5 rounded-full bg-neon-red-bright mr-2 animate-pulse" />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
