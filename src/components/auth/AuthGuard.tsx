'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useGameStore } from '@/store/useGameStore';
import { useCommunityStore } from '@/store/useCommunityStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSettingsStore, applyDocumentSettings } from '@/store/useSettingsStore';
import { useStageStore } from '@/store/useStageStore';
import { isTutorialDone, useTutorialStore } from '@/store/useTutorialStore';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Navigation } from '@/components/layout/Navigation';
import { HydrationGuard } from '@/components/layout/HydrationGuard';
import { NotificationsDrawer } from '@/components/notifications/NotificationsDrawer';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Toaster } from '@/components/ui/Toaster';
import { BootFrame, IntroExperience } from '@/components/intro/IntroExperience';
import { Tutorial } from '@/components/tutorial/Tutorial';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { fetchGamesFromCloud, fetchUserProfileFromCloud, syncGamesToCloud } from '@/services/firestoreService';
import { cachedUser } from '@/lib/accountVault';
import { setNativeTheme } from '@/lib/native';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const initAuthListener = useAuthStore((s) => s.initAuthListener);
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const introPhase = useStageStore((s) => s.phase);
  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const tutorialActive = useTutorialStore((s) => s.active);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const uid = user?.uid;

  // Everything below depends on localStorage, so the server HTML is just the boot frame.
  useEffect(() => {
    setMounted(true);
    return initAuthListener();
  }, [initAuthListener]);

  // Keep <html data-theme/lang> and the Android system bars in step with settings.
  // The login and intro are always dark.
  useEffect(() => {
    if (!mounted) return;
    applyDocumentSettings(theme, language);
    setNativeTheme(!user || introPhase !== 'done' ? 'dark' : theme);
  }, [mounted, theme, language, user, introPhase]);

  // Per-user stores: reload from this user's keys whenever the account changes.
  useEffect(() => {
    if (!mounted) return;
    useGameStore.persist.rehydrate();
    useCommunityStore.persist.rehydrate();
    useNotificationStore.persist.rehydrate();
  }, [mounted, uid]);

  // Cloud sync runs in the background and never blocks the UI.
  useEffect(() => {
    if (!mounted || !uid || isAuthLoading) return;
    let alive = true;
    const stillThisUser = () => alive && cachedUser.uid() === uid;

    fetchGamesFromCloud(uid).then((cloudGames) => {
      if (!stillThisUser()) return;
      if (cloudGames) useGameStore.getState().setGames(cloudGames);
      else syncGamesToCloud(uid, useGameStore.getState().games);
    });

    fetchUserProfileFromCloud(uid).then((profile) => {
      const current = useAuthStore.getState().user;
      if (!stillThisUser() || !profile || !current) return;
      const merged = {
        ...current,
        bio: profile.bio ?? current.bio,
        title: profile.title ?? current.title,
        photoURL: profile.photoURL ?? current.photoURL,
      };
      cachedUser.write(merged);
      useAuthStore.setState({ user: merged });
    });

    return () => {
      alive = false;
    };
  }, [mounted, uid, isAuthLoading]);

  // Signed-in users never stay on /login.
  const isLoginRoute = (pathname || '/').replace(/\/+$/, '') === '/login';
  useEffect(() => {
    if (mounted && user && isLoginRoute) router.replace('/');
  }, [mounted, user, isLoginRoute, router]);

  // First run for this account: start the tutorial once the intro is out of the way.
  useEffect(() => {
    if (!mounted || !uid || introPhase !== 'done' || !hasHydrated) return;
    if (!isTutorialDone(uid) && !useTutorialStore.getState().active) {
      const timer = setTimeout(() => useTutorialStore.getState().start(), 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, uid, introPhase, hasHydrated]);

  if (!mounted) return <BootFrame />;

  return (
    <MotionConfig reducedMotion="user">
      <IntroExperience hasUser={Boolean(user)} />
      {!user ? (
        <LoginScreen />
      ) : (
        <>
          <GlobalHeader />
          <main id="main" className="relative flex-1" aria-hidden={tutorialActive && undefined}>
            <HydrationGuard>{children}</HydrationGuard>
          </main>
          <Navigation />
          <NotificationsDrawer />
          <SettingsModal />
          <Tutorial />
        </>
      )}
      <Toaster />
    </MotionConfig>
  );
}
