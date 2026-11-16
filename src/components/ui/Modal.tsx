'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBackHandler } from '@/lib/backStack';
import { DUR, EASE_OUT } from '@/lib/motion';
import { useTranslation } from '@/i18n/useTranslation';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Mono telemetry line above the title. */
  eyebrow?: React.ReactNode;
  variant?: 'center' | 'sheet';
  /** When false, scrim tap / back / Escape do nothing (e.g. while a task runs). */
  dismissible?: boolean;
  tone?: 'default' | 'danger';
  className?: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
let openCount = 0;

/**
 * Shared dialog shell: theme tokens (works in light mode), portal to <body> so parent
 * transforms cannot break `fixed`, focus trap + restore, Escape, hardware back, scroll lock.
 * The header stays outside the scroll area so nothing slides underneath it.
 */
export const Modal = ({ open, onClose, title, eyebrow, variant = 'center', dismissible = true, tone = 'default', className, children }: ModalProps) => {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const titleId = React.useId();
  const tryClose = () => dismissible && onClose();

  useEffect(() => setMounted(true), []);
  useBackHandler(open, tryClose);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    openCount += 1;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        tryClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey, true);
      openCount -= 1;
      if (openCount <= 0) {
        openCount = 0;
        document.body.style.overflow = '';
      }
      previous?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  const sheet = variant === 'sheet';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[100] flex justify-center', sheet ? 'items-end' : 'items-center px-4 py-6')}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base }}
            onClick={tryClose}
            className="absolute inset-0 bg-scrim/70 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={sheet ? { y: '100%' } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={sheet ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: sheet ? DUR.slow : DUR.base, ease: EASE_OUT }}
            className={cn(
              'relative flex w-full max-w-md flex-col overflow-hidden border bg-surface-solid shadow-glass outline-none',
              tone === 'danger' ? 'border-neon-red/50' : 'border-surface-border',
              sheet ? 'max-h-[88dvh] rounded-t-3xl border-b-0' : 'max-h-[88dvh] max-w-sm rounded-3xl',
              className
            )}
          >
            {sheet && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden />}
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-border px-5 pb-4 pt-4">
              <div className="min-w-0">
                {eyebrow && <p className="eyebrow mb-1 text-neon-red-bright">{eyebrow}</p>}
                <h2 id={titleId} className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-white">
                  {title}
                </h2>
              </div>
              {dismissible && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('common.close')}
                  className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-dim transition-colors hover:bg-white/5 hover:text-white active:scale-95"
                >
                  <X size={20} />
                </button>
              )}
            </header>
            <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5', sheet && 'pb-safe')}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
