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
import { fetchGamesFromCloud, syncGamesToCloud } from '@/services/firestoreService';
import { useGameStore } from '@/store/useGameStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading, initAuthListener } = useAuthStore();
  const { setGames, resetToDefault } = useGameStore();
  const [isFetchingCloud, setIsFetchingCloud] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  useEffect(() => {
    let mounted = true;

    const syncCloudData = async () => {
      if (user?.uid) {
        setIsFetchingCloud(true);
        const cloudGames = await fetchGamesFromCloud(user.uid);
        if (mounted) {
          if (cloudGames) {
            setGames(cloudGames);
          } else {
            // New user: upload default local games as their starting library
            await syncGamesToCloud(user.uid, useGameStore.getState().games);
          }
          setIsFetchingCloud(false);
        }
      } else if (user === null) {
        // Logged out, clear library to default
        resetToDefault();
      }
    };

    if (!isAuthLoading) {
      syncCloudData();
    }

    return () => { mounted = false; };
  }, [user, user?.uid, isAuthLoading, setGames, resetToDefault]);

  useEffect(() => {
    if (!isAuthLoading && !isFetchingCloud) {
      if (!user && pathname !== '/login') {
        router.replace('/login');
      } else if (user && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [user, isAuthLoading, isFetchingCloud, pathname, router]);

  const isLoginRoute = pathname === '/login' || pathname === '/login/' || pathname?.includes('/login');
  const isTransitioning = (!user && !isLoginRoute) || (user && isLoginRoute);
  const showLoading = isAuthLoading || isFetchingCloud || isTransitioning;

  return (
    <>
      {/* Show loading overlay if auth is loading, fetching cloud data, or a route transition is needed */}
      {showLoading && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-obsidian-black text-white w-full">
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
      )}

      {/* Render children so Next.js router doesn't abort the transition, but hide Chrome if on login */}
      <div className={showLoading ? 'hidden' : 'contents'}>
        {!isLoginRoute && <GlobalHeader />}
        <main className={`flex-1 relative ${!isLoginRoute ? 'pb-32' : ''}`}>
          <HydrationGuard>
            {children}
          </HydrationGuard>
        </main>
        {!isLoginRoute && <Navigation />}
        {!isLoginRoute && <NotificationsDrawer />}
        <SettingsModal />
      </div>
    </>
  );
}
