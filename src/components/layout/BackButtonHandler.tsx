'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';

export const BackButtonHandler = () => {
  const router = useRouter();
  const pathname = usePathname();
  const closeSettings = useSettingsStore(state => state.closeSettings);
  const isSettingsOpen = useSettingsStore(state => state.isSettingsOpen);

  useEffect(() => {
    const handleNativeBack = (e: Event) => {
      // If a global modal is open, close it and prevent navigation
      if (isSettingsOpen) {
        e.preventDefault();
        closeSettings();
        return;
      }

      // If we are deep in the app, let the custom event handler block exit
      // and do a Next.js router.back() or router.push('/') to ensure clean state
      if (pathname !== '/' && pathname !== '/login') {
        e.preventDefault();
        router.back();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gamerbox-back-press', handleNativeBack);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gamerbox-back-press', handleNativeBack);
      }
    };
  }, [pathname, isSettingsOpen, closeSettings, router]);

  return null;
};
