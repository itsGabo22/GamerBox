import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Currency } from '@/i18n/format';

export type Theme = 'dark' | 'light';

interface SettingsState {
  theme: Theme;
  language: 'es' | 'en';
  currency: Currency;
  introEnabled: boolean;
  isSettingsOpen: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setCurrency: (currency: Currency) => void;
  setIntroEnabled: (enabled: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

/** Applies theme + language to the document so CSS tokens and a11y stay in sync with state. */
export const applyDocumentSettings = (theme: Theme, language: string) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.lang = language;
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'es',
      currency: 'COP',
      introEnabled: true,
      isSettingsOpen: false,

      setTheme: (theme) => {
        set({ theme });
        applyDocumentSettings(theme, get().language);
      },
      setLanguage: (language) => {
        set({ language });
        applyDocumentSettings(get().theme, language);
      },
      setCurrency: (currency) => set({ currency }),
      setIntroEnabled: (introEnabled) => set({ introEnabled }),
      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
    }),
    {
      name: 'gamerbox-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        introEnabled: state.introEnabled,
      }),
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      onRehydrateStorage: () => (state) => {
        if (state) applyDocumentSettings(state.theme, state.language);
      },
    }
  )
);
