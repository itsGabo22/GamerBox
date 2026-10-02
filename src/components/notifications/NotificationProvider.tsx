'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'SOCIAL' | 'COMMENT' | 'LIKE' | 'SYSTEM' | 'SALE' | 'FRIEND';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'COMMENT',
    title: 'Nuevo Comentario',
    description: 'AlexGhost comentó en tu reseña de Elden Ring.',
    timestamp: 'Hace 5m',
    read: false,
  },
  {
    id: 'n2',
    type: 'SALE',
    title: 'Wishlist en Oferta',
    description: 'Armored Core VI tiene un -40% de descuento.',
    timestamp: 'Hace 2h',
    read: false,
  },
  {
    id: 'n3',
    type: 'FRIEND',
    title: 'Nuevo Seguidor',
    description: 'Marcus comenzó a seguirte.',
    timestamp: 'Ayer',
    read: true,
  },
];

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
