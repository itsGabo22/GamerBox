'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalHeader = () => {
  const pathname = usePathname();
  const { unreadCount, openDrawer } = useNotifications();

  // Hide on game detail routes to provide immersive full-screen experience
  if (pathname.startsWith('/game/')) return null;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-4 md:px-8 bg-obsidian-black/80 backdrop-blur-xl border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-red flex items-center justify-center font-heading font-black text-white shadow-neon text-sm">
            GB
          </div>
          <span className="font-heading font-bold text-white tracking-wide">
            GamerBox
          </span>
        </div>

        <button
          onClick={openDrawer}
          className="relative w-10 h-10 rounded-full bg-surface-glass flex items-center justify-center border border-surface-border text-white hover:bg-surface-glass-hover transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={18} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neon-red-bright flex items-center justify-center shadow-neon"
              >
                <span className="font-mono text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </header>
    </>
  );
};
