'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, MessageCircle, Heart, Info, Tag, UserPlus } from 'lucide-react';
import { useNotifications, NotificationType } from './NotificationProvider';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case 'COMMENT': return <MessageCircle size={16} className="text-blue-400" />;
    case 'LIKE': return <Heart size={16} className="text-neon-red-bright" />;
    case 'SALE': return <Tag size={16} className="text-mint-green" />;
    case 'FRIEND': return <UserPlus size={16} className="text-purple-400" />;
    case 'SYSTEM':
    case 'SOCIAL':
    default: return <Info size={16} className="text-text-dim" />;
  }
};

export const NotificationsDrawer = () => {
  const { isDrawerOpen, closeDrawer, notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) closeDrawer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isDrawerOpen, closeDrawer]);

  // Prevent background scroll
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-obsidian-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-obsidian-dark border-l border-surface-border shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Notificaciones"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border bg-obsidian-black/50">
              <h2 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                Notificaciones
              </h2>
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 text-text-dim hover:text-white transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    <span className="font-mono text-xs uppercase">Marcar todo leído</span>
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-full bg-surface-glass flex items-center justify-center text-white hover:bg-surface-glass-hover transition-colors"
                  aria-label="Cerrar notificaciones"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                  <CheckCircle2 size={48} className="text-mint-green mb-4" />
                  <p className="font-heading font-bold text-lg text-white mb-1 uppercase">Todo Tranquilo</p>
                  <p className="font-body text-sm text-text-dim">No tienes notificaciones nuevas.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl flex gap-3 transition-all border",
                      notif.read 
                        ? "bg-transparent border-transparent opacity-60 hover:bg-white/5" 
                        : "bg-surface-glass border-surface-border shadow-glass relative"
                    )}
                  >
                    {!notif.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-neon-red-bright shadow-neon-bright" />
                    )}
                    
                    <div className="mt-1">
                      <div className="w-8 h-8 rounded-full bg-obsidian-black border border-white/10 flex items-center justify-center">
                        {getIconForType(notif.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 pr-6">
                      <h4 className={cn(
                        "font-body text-sm mb-1",
                        notif.read ? "font-normal text-white/80" : "font-bold text-white"
                      )}>
                        {notif.title}
                      </h4>
                      <p className="font-body text-xs text-text-dim leading-relaxed mb-2">
                        {notif.description}
                      </p>
                      <p className="font-mono text-[10px] text-text-dim/60 uppercase">
                        {notif.timestamp}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
