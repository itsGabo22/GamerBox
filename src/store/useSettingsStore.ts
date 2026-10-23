import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light';
  language: 'es' | 'en';
  currency: 'COP' | 'USD' | 'EUR' | 'MXN';
  isSettingsOpen: boolean;
}

interface SettingsActions {
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setCurrency: (currency: 'COP' | 'USD' | 'EUR' | 'MXN') => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const formatPrice = (usdAmount: number | string, currency: 'COP' | 'USD' | 'EUR' | 'MXN'): string => {
  const num = typeof usdAmount === 'string' ? parseFloat(usdAmount.replace(/[^0-9.]/g, '')) || 19.99 : usdAmount;

  if (currency === 'COP') {
    const cop = Math.round(num * 3751.32);
    return 'COL$ ' + cop.toLocaleString('es-CO');
  }
  if (currency === 'EUR') {
    return '€' + (num * 0.92).toFixed(2);
  }
  if (currency === 'MXN') {
    return '$' + Math.round(num * 18.5).toLocaleString('es-MX') + ' MXN';
  }
  return '$' + num.toFixed(2) + ' USD';
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'es',
      currency: 'COP',
      isSettingsOpen: false,

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },

      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
        return { theme: newTheme };
      }),

      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
    }),
    {
      name: 'gamerbox-settings',
      partialize: (state) => ({ theme: state.theme, language: state.language, currency: state.currency }), // don't persist isSettingsOpen
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
