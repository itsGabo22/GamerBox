'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';

export const BackButtonHandler = () => {
  const pathname = usePathname();
  const closeSettings = useSettingsStore(state => state.closeSettings);
  const isSettingsOpen = useSettingsStore(state => state.isSettingsOpen);

  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      // If settings are open, close them and prevent default back behavior
      if (isSettingsOpen) {
        e.preventDefault();
        closeSettings();
        // pushState so the next back button press doesn't exit immediately
        window.history.pushState(null, '', window.location.pathname);
        return;
      }

      // If we are not on the home page, let the router handle it
      if (pathname !== '/' && pathname !== '/login') {
        // Native back behavior is fine, or we could router.back()
        return;
      }

      // If we are on home/login, native back will exit the app (expected behavior on Android)
    };

    // Push an initial state so the first back button press triggers popstate
    if (typeof window !== 'undefined') {
       window.history.pushState(null, '', window.location.pathname);
       window.addEventListener('popstate', handleBackButton);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleBackButton);
      }
    };
  }, [pathname, isSettingsOpen, closeSettings]);

  return null;
};
