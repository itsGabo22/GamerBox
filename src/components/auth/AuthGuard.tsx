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
import LoginPage from '@/app/login/page';

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
        // Do not block UI thread on Firestore. Let it sync in background.
        fetchGamesFromCloud(user.uid).then(async (cloudGames) => {
          if (mounted) {
            if (cloudGames) {
              setGames(cloudGames);
            } else {
              // New user: upload default local games as their starting library
              await syncGamesToCloud(user.uid, useGameStore.getState().games);
            }
          }
        }).catch(err => {
          console.warn('Firestore background sync warning:', err);
        }).finally(() => {
          if (mounted) setIsFetchingCloud(false);
        });
      } else if (user === null) {
        // Logged out, clear library to default
        if (mounted) {
          resetToDefault();
          setIsFetchingCloud(false);
        }
      }
    };

    if (!isAuthLoading) {
      syncCloudData();
    }

    return () => { mounted = false; };
  }, [user, user?.uid, isAuthLoading, setGames, resetToDefault]);

  const normalizedPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const isLoginRoute = normalizedPath === '/login' || normalizedPath.endsWith('/login');

  useEffect(() => {
    if (!isAuthLoading && !isFetchingCloud) {
      if (user && isLoginRoute) {
        router.replace('/');
      }
    }
  }, [user, isAuthLoading, isFetchingCloud, isLoginRoute, router]);

  const showLoading = isAuthLoading || isFetchingCloud;

  return (
    <>
      {/* Show loading overlay if auth is loading or fetching cloud data */}
      {showLoading && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-obsidian-black text-white w-full">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-16 border-t-2 border-r-2 border-neon-red rounded-full mb-4"
            style={{ borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }}
          />
          <p className="font-mono text-sm uppercase tracking-widest text-neon-red-bright animate-pulse mb-4">
            Verificando credenciales...
          </p>
          <button
            onClick={() => useAuthStore.setState({ isAuthLoading: false })}
            className="mt-4 px-4 py-2 border border-surface-border rounded-lg text-xs font-mono text-text-dim hover:text-white"
          >
            Saltar verificación &rarr;
          </button>
        </div>
      )}

      {/* Main Content Rendering Logic */}
      <div className={showLoading ? 'hidden' : 'contents'}>
        {!user ? (
           <LoginPage />
        ) : (
          <>
            <GlobalHeader />
            <main className={`flex-1 relative pb-32`}>
              <HydrationGuard>
                {children}
              </HydrationGuard>
            </main>
            <Navigation />
            <NotificationsDrawer />
            <SettingsModal />
          </>
        )}
      </div>
    </>
  );
}
