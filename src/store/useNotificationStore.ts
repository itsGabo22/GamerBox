import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { perUserStorage } from '@/lib/accountVault';
import type { TParams } from '@/i18n/dictionary';

export type NotificationType = 'SYSTEM' | 'GAME' | 'COMPLETED' | 'LEVEL' | 'FRIEND';

/**
 * Notifications are generated only by real events in this account
 * (game registered, level up, new squad member…). Nothing is pre-seeded.
 * Text is stored as dictionary keys so it follows the active language.
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  titleKey: string;
  bodyKey: string;
  params?: TParams;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  isDrawerOpen: boolean;
  push: (n: Pick<NotificationItem, 'type' | 'titleKey' | 'bodyKey' | 'params'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isDrawerOpen: false,
      push: (n) =>
        set({
          notifications: [
            { ...n, id: `n-${Date.now()}-${Math.round(Math.random() * 1e4)}`, createdAt: new Date().toISOString(), read: false },
            ...get().notifications,
          ].slice(0, 30),
        }),
      markAsRead: (id) => set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      markAllAsRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      reset: () => set({ notifications: [], isDrawerOpen: false }),
    }),
    {
      name: 'gamerbox-notifications',
      storage: createJSONStorage(perUserStorage),
      partialize: (state) => ({ notifications: state.notifications }),
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        notifications: (persisted as Partial<NotificationState> | undefined)?.notifications || [],
      }),
    }
  )
);

export const notify = (n: Pick<NotificationItem, 'type' | 'titleKey' | 'bodyKey' | 'params'>) =>
  useNotificationStore.getState().push(n);
