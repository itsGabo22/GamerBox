'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, Globe, GraduationCap, Languages, LogOut, Moon, Palette, PlayCircle, Sun, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTutorialStore } from '@/store/useTutorialStore';
import { useTranslation } from '@/i18n/useTranslation';
import type { Currency } from '@/i18n/format';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { GBMark } from '@/components/brand/CrystalMark';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';
import { cn } from '@/lib/cn';

export const APP_VERSION = '1.0.0';
const CURRENCIES: Currency[] = ['COP', 'USD', 'EUR', 'MXN'];

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <h3 className="eyebrow mb-3 flex items-center gap-2">
    <span className="text-neon-red-bright">{icon}</span>
    {children}
  </h3>
);

export const SettingsModal = () => {
  const { isSettingsOpen, closeSettings, theme, setTheme, language, setLanguage, currency, setCurrency, introEnabled, setIntroEnabled } =
    useSettingsStore();
  const logout = useAuthStore((s) => s.logout);
  const startTutorial = useTutorialStore((s) => s.start);
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isSettingsOpen) setConfirmDelete(false);
  }, [isSettingsOpen]);

  const replayTutorial = () => {
    closeSettings();
    router.push('/');
    setTimeout(startTutorial, 350);
  };

  return (
    <>
      <Modal open={isSettingsOpen && !confirmDelete} onClose={closeSettings} title={t('settings.title')} variant="sheet">
        <div className="flex flex-col gap-7">
          <section>
            <SectionLabel icon={<Languages size={14} />}>{t('settings.language')}</SectionLabel>
            <Segmented
              name="language"
              label={t('settings.language')}
              value={language}
              onChange={setLanguage}
              options={[
                { id: 'es', label: 'Español' },
                { id: 'en', label: 'English' },
              ]}
            />
          </section>

          <section>
            <SectionLabel icon={<Palette size={14} />}>{t('settings.theme')}</SectionLabel>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('settings.theme')}>
              {(['dark', 'light'] as const).map((option) => {
                const active = theme === option;
                const Icon = option === 'dark' ? Moon : Sun;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-theme-option={option}
                    onClick={() => setTheme(option)}
                    className={cn(
                      'flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl border font-heading text-sm font-bold uppercase tracking-wide transition-colors duration-150 active:scale-[0.98]',
                      active ? 'border-neon-red bg-neon-red/10 text-white shadow-neon' : 'border-surface-border bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    <Icon size={20} className={active ? 'text-neon-red-bright' : undefined} aria-hidden />
                    {t(`settings.${option}`)}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionLabel icon={<Globe size={14} />}>{t('settings.currency')}</SectionLabel>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t('settings.currency')}>
              {CURRENCIES.map((option) => {
                const active = currency === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCurrency(option)}
                    className={cn(
                      'h-11 rounded-xl border font-mono text-xs font-bold tracking-wider transition-colors duration-150 active:scale-[0.97]',
                      active ? 'border-neon-red bg-neon-red/10 text-white' : 'border-surface-border bg-white/5 text-text-dim hover:text-white'
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={introEnabled}
              onClick={() => setIntroEnabled(!introEnabled)}
              className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-surface-border bg-white/5 px-4 py-3 text-left"
            >
              <PlayCircle size={20} className="shrink-0 text-neon-red-bright" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-bold text-white">{t('settings.intro')}</span>
                <span className="block text-xs text-text-dim">{t('settings.introHint')}</span>
              </span>
              <span
                className={cn('relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-150', introEnabled ? 'border-neon-red bg-neon-red' : 'border-surface-border bg-white/10')}
                aria-hidden
              >
                <span className={cn('absolute top-0.5 h-[22px] w-[22px] rounded-full bg-real-white shadow transition-transform duration-150', introEnabled ? 'translate-x-[22px]' : 'translate-x-0.5')} />
              </span>
            </button>

            <button
              type="button"
              onClick={replayTutorial}
              data-action="replay-tutorial"
              className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-surface-border bg-white/5 px-4 py-3 text-left transition-colors hover:bg-white/10"
            >
              <GraduationCap size={20} className="shrink-0 text-mint-green" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-bold text-white">{t('settings.tutorial')}</span>
                <span className="block text-xs text-text-dim">{t('settings.tutorialHint')}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-text-dim" aria-hidden />
            </button>
          </section>

          <section>
            <h3 className="eyebrow mb-3">{t('settings.account')}</h3>
            <div className="flex flex-col gap-3">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  closeSettings();
                  logout();
                }}
              >
                <LogOut size={16} aria-hidden />
                {t('settings.logout')}
              </Button>
              <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} aria-hidden />
                {t('settings.delete')}
              </Button>
            </div>
          </section>

          <footer className="flex items-center justify-center gap-2.5 pb-2 pt-1">
            <GBMark className="h-6 w-6 rounded-md text-[10px]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-dim">{t('settings.version', { v: APP_VERSION })}</span>
          </footer>
        </div>
      </Modal>

      <DeleteAccountDialog
        open={isSettingsOpen && confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onDeleted={closeSettings}
      />
    </>
  );
};
