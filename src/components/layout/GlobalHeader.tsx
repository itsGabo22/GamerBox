'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTranslation } from '@/i18n/useTranslation';
import { GBMark } from '@/components/brand/CrystalMark';

export const GlobalHeader = () => {
  const pathname = usePathname() || '/';
  const { t } = useTranslation();
  const openSettings = useSettingsStore((s) => s.openSettings);
  const openDrawer = useNotificationStore((s) => s.openDrawer);
  // The badge is derived from real, unread notifications only.
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);

  if (pathname.startsWith('/game')) return null;

  const iconButton =
    'relative flex h-11 w-11 items-center justify-center rounded-full border border-surface-border bg-surface-glass text-white transition-colors duration-150 hover:bg-surface-glass-hover active:scale-95';

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border bg-obsidian-black/80 px-4 pb-3 backdrop-blur-xl"
      style={{ paddingTop: 'calc(var(--sat) + 12px)' }}
    >
      <div className="flex items-center gap-2.5">
        <GBMark className="h-9 w-9 text-sm" />
        <span className="font-heading text-lg font-bold tracking-wide text-white">GamerBox</span>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={openSettings} className={iconButton} aria-label={t('settings.open')} data-tour="settings">
          <Settings size={19} aria-hidden />
        </button>
        <button
          type="button"
          onClick={openDrawer}
          className={iconButton}
          aria-label={unread > 0 ? `${t('notifications.open')} (${unread})` : t('notifications.open')}
          data-action="notifications"
        >
          <Bell size={19} aria-hidden />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-red-bright px-1 font-mono text-[10px] font-bold text-real-white shadow-neon"
                aria-hidden
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
};
