import React from 'react';
import { cn } from '@/lib/cn';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, interactive = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('glass-panel overflow-hidden rounded-2xl', interactive && 'glass-panel-hover cursor-pointer active:scale-[0.99]', className)}
      {...props}
    >
      {children}
    </div>
  )
);

GlassPanel.displayName = 'GlassPanel';
