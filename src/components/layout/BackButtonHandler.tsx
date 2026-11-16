'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { runBackHandler } from '@/lib/backStack';
import { toast } from '@/store/useToastStore';
import { translate } from '@/i18n/useTranslation';

const ROOT_ROUTES = ['/', '/login'];

/**
 * Hardware back, in layers:
 *   1. whatever is on top of the back stack (intro → tutorial → modal/sheet/drawer)
 *   2. in-app history (any route that is not a root)
 *   3. at a root: first press shows "press again to exit", second one lets Android minimize.
 * MainActivity dispatches the cancelable `gamerbox-back-press` event; preventDefault = handled.
 */
export const BackButtonHandler = () => {
  const router = useRouter();
  const pathname = usePathname();
  const lastRootPress = useRef(0);

  useEffect(() => {
    const onBack = (e: Event) => {
      if (runBackHandler()) {
        e.preventDefault();
        return;
      }
      const path = (pathname || '/').replace(/\/+$/, '') || '/';
      if (!ROOT_ROUTES.includes(path)) {
        e.preventDefault();
        if (window.history.length > 1) router.back();
        else router.replace('/');
        return;
      }
      const now = Date.now();
      if (now - lastRootPress.current > 2000) {
        lastRootPress.current = now;
        e.preventDefault();
        toast(translate('common.exitHint'));
      }
      // Second press within 2 s: not prevented → the native side minimizes the app.
    };

    window.addEventListener('gamerbox-back-press', onBack);
    return () => window.removeEventListener('gamerbox-back-press', onBack);
  }, [pathname, router]);

  return null;
};
