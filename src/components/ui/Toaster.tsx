'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import { cn } from '@/lib/cn';
import { tBase } from '@/lib/motion';

const ICON = { info: Info, success: Check, error: AlertTriangle };

/** Short confirmations above the nav. Announced politely to screen readers. */
export const Toaster = () => {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[130] flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'calc(var(--nav-h) + var(--sab) + 20px)' }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICON[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={tBase}
              className={cn(
                'flex max-w-sm items-center gap-2.5 rounded-2xl border bg-surface-solid px-4 py-3 shadow-glass',
                toast.tone === 'error' ? 'border-neon-red/50' : toast.tone === 'success' ? 'border-mint-green/40' : 'border-surface-border'
              )}
            >
              <Icon
                size={16}
                className={cn('shrink-0', toast.tone === 'error' ? 'text-neon-red-bright' : toast.tone === 'success' ? 'text-mint-green' : 'text-text-dim')}
              />
              <p className="text-sm leading-snug text-white">{toast.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
