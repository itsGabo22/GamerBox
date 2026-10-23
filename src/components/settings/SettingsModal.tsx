'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/i18n/useTranslation';
import { X, Moon, Sun, Globe, LogOut } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';

export const SettingsModal = () => {
  const { isSettingsOpen, closeSettings, theme, setTheme, language, setLanguage } = useSettingsStore();
  const { logout } = useAuthStore();
  const { t } = useTranslation();

  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSettings}
          className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-obsidian-dark border-t border-surface-border rounded-t-3xl sm:rounded-2xl sm:border flex flex-col max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-border sticky top-0 bg-obsidian-dark/90 backdrop-blur-md z-10">
            <h2 className="font-heading font-bold text-xl text-white tracking-wide uppercase">
              {t('settings.title')}
            </h2>
            <button
              onClick={closeSettings}
              className="w-8 h-8 rounded-full bg-surface-glass flex items-center justify-center text-text-dim hover:text-white hover:bg-neon-red/20 transition-colors"
              aria-label={t('settings.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-8">
            {/* Language Selector */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-neon-red" />
                <h3 className="font-mono text-xs font-bold tracking-widest text-text-dim uppercase">
                  {t('settings.language')}
                </h3>
              </div>
              <div className="flex bg-surface-glass p-1 rounded-xl border border-surface-border relative">
                <button
                  onClick={() => setLanguage('es')}
                  className={`flex-1 py-3 font-heading font-bold text-sm z-10 transition-colors ${language === 'es' ? 'text-white' : 'text-text-dim'}`}
                >
                  🇪🇸 Español
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-3 font-heading font-bold text-sm z-10 transition-colors ${language === 'en' ? 'text-white' : 'text-text-dim'}`}
                >
                  🇺🇸 English
                </button>

                {/* Active Pill Indicator */}
                <motion.div
                  layout
                  initial={false}
                  animate={{ x: language === 'en' ? '100%' : '0%' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-obsidian-black rounded-lg shadow-glass border border-white/5"
                />
              </div>
            </section>

            {/* Currency Selector */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-neon-red" />
                <h3 className="font-mono text-xs font-bold tracking-widest text-text-dim uppercase">
                  MONEDA REGIONAL
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['COP', 'USD', 'EUR', 'MXN'] as const).map(cur => (
                  <button
                    key={cur}
                    onClick={() => useSettingsStore.getState().setCurrency(cur)}
                    className={`py-3 rounded-xl border font-heading font-bold text-sm transition-colors ${useSettingsStore.getState().currency === cur ? 'bg-neon-red/10 border-neon-red shadow-neon text-white' : 'bg-surface-glass border-surface-border text-text-dim hover:text-white'}`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </section>

            {/* Theme Selector */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sun size={16} className="text-neon-red" />
                <h3 className="font-mono text-xs font-bold tracking-widest text-text-dim uppercase">
                  {t('settings.theme')}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('dark')}
                  className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                    theme === 'dark'
                      ? 'bg-neon-red/10 border-neon-red shadow-neon text-neon-red-bright'
                      : 'bg-surface-glass border-surface-border text-text-dim hover:text-white'
                  }`}
                >
                  <Moon size={24} />
                  <span className="font-heading font-bold text-sm text-white">
                    {t('settings.dark')}
                  </span>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                    theme === 'light'
                      ? 'bg-neon-red/10 border-neon-red shadow-neon text-neon-red-bright'
                      : 'bg-surface-glass border-surface-border text-text-dim hover:text-white'
                  }`}
                >
                  <Sun size={24} />
                  <span className="font-heading font-bold text-sm text-white">
                    {t('settings.light')}
                  </span>
                </button>
              </div>
            </section>

            {/* System Info & Logout */}
            <section className="mt-4">
              <GlassPanel className="p-5 border border-neon-red/20 bg-neon-red/5">
                <div className="flex flex-col items-center text-center gap-2 mb-6">
                  <div className="w-12 h-12 bg-obsidian-black rounded-xl border border-surface-border flex items-center justify-center shadow-glass mb-2">
                    <span className="font-heading font-black text-xl text-neon-red-bright">GB</span>
                  </div>
                  <p className="font-mono text-[10px] font-bold text-white tracking-widest uppercase">
                    {t('settings.version')}
                  </p>
                  <p className="font-body text-xs text-text-dim">
                    {t('settings.credit')}
                  </p>
                </div>

                <button
                  onClick={() => {
                    closeSettings();
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-obsidian-black border border-neon-red/30 rounded-xl text-neon-red-bright font-mono text-xs font-bold tracking-widest uppercase transition-all hover:bg-neon-red/10 shadow-[0_0_15px_rgba(255,42,85,0.1)] active:scale-95"
                >
                  <LogOut size={16} />
                  {t('settings.logout')}
                </button>
              </GlassPanel>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
