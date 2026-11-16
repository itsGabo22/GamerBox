import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

/**
 * Thin bridge to the Android shell. Uses Capacitor's built-in SystemBars plugin
 * (no extra dependency, no extra permission). Every call is a no-op in a browser.
 */
export const isNative = () => typeof window !== 'undefined' && Capacitor.isNativePlatform();

/** Light theme → dark status/navigation bar icons, and vice versa. */
export const setNativeTheme = (theme: 'dark' | 'light') => {
  if (typeof document !== 'undefined') {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F4F5F8' : '#050505');
  }
  if (!isNative()) return;
  // "Dark" style = light icons for a dark background; "Light" = dark icons.
  SystemBars.setStyle({ style: theme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => {});
};
