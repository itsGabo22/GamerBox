'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Navigation } from '@/components/layout/Navigation';
import { NotificationsDrawer } from '@/components/notifications/NotificationsDrawer';
import { HydrationGuard } from '@/components/layout/HydrationGuard';
import { SettingsModal } from '@/components/settings/SettingsModal';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading, initAuthListener } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user && pathname !== '/login') {
        router.replace('/login');
      } else if (user && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [user, isAuthLoading, pathname, router]);

  const isLoginRoute = pathname === '/login';

  if (isAuthLoading || (!user && !isLoginRoute) || (user && isLoginRoute)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-obsidian-black text-white w-full">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 border-t-2 border-r-2 border-neon-red rounded-full mb-4"
          style={{ borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }}
        />
        <p className="font-mono text-sm uppercase tracking-widest text-neon-red-bright animate-pulse">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  return (
    <>
      {!isLoginRoute && <GlobalHeader />}
      <main className={`flex-1 relative ${!isLoginRoute ? 'pb-32' : ''}`}>
        <HydrationGuard>
          {children}
        </HydrationGuard>
      </main>
      {!isLoginRoute && <Navigation />}
      {!isLoginRoute && <NotificationsDrawer />}
      <SettingsModal />
    </>
  );
}
