import React from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'neon' | 'danger' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

/** All sizes keep a ≥44 px touch target. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const base =
      'relative inline-flex select-none items-center justify-center gap-2 rounded-full font-heading font-bold uppercase tracking-wider transition-[transform,background-color,box-shadow,color,border-color] duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-red-bright focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-black disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]';

    const variants = {
      primary: 'bg-neon-red text-real-white hover:bg-neon-red-bright',
      neon: 'bg-neon-red text-real-white shadow-neon hover:bg-neon-red-bright',
      secondary: 'glass-panel glass-panel-hover text-white',
      ghost: 'border border-surface-border bg-transparent text-text-dim hover:bg-white/5 hover:text-white',
      // One destructive style everywhere (settings, profile, confirmations).
      danger: 'border border-neon-red/40 bg-neon-red/10 text-neon-red-bright hover:bg-neon-red/20',
      mint: 'border border-mint-green/40 bg-mint-green/10 text-mint-green hover:bg-mint-green/20',
    };

    const sizes = {
      sm: 'h-11 px-5 text-xs',
      md: 'h-12 px-6 text-sm',
      lg: 'h-14 px-8 text-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />
          </span>
        )}
        <span className={cn('inline-flex items-center justify-center gap-2', loading && 'opacity-0')}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
