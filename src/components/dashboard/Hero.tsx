'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CrystalMark } from '@/components/brand/CrystalMark';
import { useGameStore } from '@/store/useGameStore';
import { useTranslation } from '@/i18n/useTranslation';
import { toast } from '@/store/useToastStore';
import { tSlow } from '@/lib/motion';
import { cn } from '@/lib/cn';

const REGIONS = [
  { id: 'bog', label: 'LATAM North · Bogotá' },
  { id: 'vir', label: 'US East · Virginia' },
  { id: 'sao', label: 'Brazil South · São Paulo' },
];
const ROLES = ['roleAssault', 'roleSupport', 'roleRecon'] as const;
const SESSION_HOURS = 3;

// Deterministic "motes" so the art is identical on server and client.
const MOTES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.4,
  mint: i % 6 === 0,
}));

type ArenaPhase = 'setup' | 'running' | 'done';

/**
 * Home hero. Original art in the intro's language (crystal + motes), no stock photo.
 * "Neon Arena" is a clearly labelled SIMULATION: it only writes hours if the player says yes.
 */
export const Hero = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const games = useGameStore((s) => s.games);
  const logPlaySession = useGameStore((s) => s.logPlaySession);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<ArenaPhase>('setup');
  const [region, setRegion] = useState(REGIONS[0].id);
  const [role, setRole] = useState<(typeof ROLES)[number]>(ROLES[0]);

  const playing = games.find((g) => g.status === 'PLAYING');

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = setTimeout(() => setPhase('done'), 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  const close = () => {
    setOpen(false);
    setTimeout(() => setPhase('setup'), 300);
  };

  const logSession = () => {
    if (!playing) return;
    logPlaySession(playing.id, SESSION_HOURS);
    toast(t('game.logged', { n: SESSION_HOURS, title: playing.title }), 'success');
    close();
  };

  const option = (active: boolean, tone: 'red' | 'mint') =>
    cn(
      'flex min-h-[44px] w-full items-center rounded-xl border px-3 text-left font-mono text-xs transition-colors duration-150',
      active
        ? tone === 'red'
          ? 'border-neon-red/50 bg-neon-red/15 text-neon-red-bright'
          : 'border-mint-green/50 bg-mint-green/15 text-mint-green'
        : 'border-transparent text-text-dim hover:bg-white/5 hover:text-white'
    );

  return (
    <>
      <section className="px-4 pt-5">
        {/* Always-dark art card, equal margins and radius on every side. */}
        <div data-theme="dark" className="relative h-[340px] overflow-hidden rounded-3xl border border-surface-border bg-[#07070b] shadow-glass">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_30%,rgba(229,9,20,0.32),transparent_58%)]" />
          <div className="scanlines absolute inset-0 opacity-40" />
          {MOTES.map((m, i) => (
            <span
              key={i}
              className={cn('absolute animate-pulse-ring rounded-full', m.mint ? 'bg-mint-green' : 'bg-neon-red-bright')}
              style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, animationDelay: `${m.delay}s` }}
            />
          ))}
          <div className="absolute -right-10 -top-6 h-[300px] w-[240px]" aria-hidden>
            <div className="absolute inset-8 animate-spin-slow rounded-full border border-dashed border-neon-red/30" />
            <CrystalMark animation="idle" className="relative h-full w-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07070b]/85 via-transparent to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tSlow}
            className="absolute inset-0 flex flex-col justify-end p-5"
          >
            <Badge variant="live" className="mb-3 self-start">
              {t('home.heroBadge')}
            </Badge>
            <h1 className="font-heading text-[2.1rem] font-black uppercase leading-[0.95] tracking-tight text-white">
              {t('home.heroTitle')}
              <span className="block text-neon-red-bright text-glow-red">{t('home.heroSubtitle')}</span>
            </h1>
            <p className="mt-2.5 max-w-[250px] text-[13px] leading-snug text-white/70">{t('home.heroBody')}</p>
            <div className="mt-4 flex gap-2.5">
              <Button variant="neon" size="sm" onClick={() => setOpen(true)} data-action="arena">
                <Play size={15} fill="currentColor" aria-hidden />
                {t('home.heroEnter')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push('/discover')}>
                {t('home.heroExplore')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Modal open={open} onClose={close} title={t('home.arenaTitle')} eyebrow={t('common.simulated')} dismissible={phase !== 'running'}>
        {phase === 'setup' && (
          <div className="flex flex-col gap-4">
            <fieldset>
              <legend className="eyebrow mb-1.5">{t('home.arenaRegion')}</legend>
              <div className="flex flex-col gap-1 rounded-2xl border border-surface-border bg-obsidian-black p-1" role="radiogroup">
                {REGIONS.map((r) => (
                  <button key={r.id} type="button" role="radio" aria-checked={region === r.id} onClick={() => setRegion(r.id)} className={option(region === r.id, 'red')}>
                    {r.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="eyebrow mb-1.5">{t('home.arenaRole')}</legend>
              <div className="flex flex-col gap-1 rounded-2xl border border-surface-border bg-obsidian-black p-1" role="radiogroup">
                {ROLES.map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={option(role === r, 'mint')}>
                    {t(`home.${r}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button variant="neon" className="mt-1 w-full" onClick={() => setPhase('running')} data-action="arena-start">
              {t('home.arenaStart')}
            </Button>
          </div>
        )}

        {phase === 'running' && (
          <div className="flex flex-col items-center py-8" role="status">
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-surface-border border-t-neon-red-bright" />
              <Activity size={28} className="animate-pulse-ring text-neon-red-bright" aria-hidden />
            </div>
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-neon-red-bright">{t('home.arenaRunning')}</p>
            <p className="mt-2 font-mono text-[11px] uppercase text-text-dim">{t('home.arenaSync')}</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex flex-col gap-4" role="status">
            <div>
              <p className="font-heading text-base font-bold uppercase text-white">{t('home.arenaDoneTitle')}</p>
              <p className="mt-1 text-sm leading-relaxed text-text-dim">{t('home.arenaDoneBody')}</p>
            </div>
            {playing ? (
              <div className="rounded-2xl border border-surface-border bg-white/5 p-4">
                <p className="mb-3 text-sm font-medium text-white">{t('home.arenaLogAsk', { game: playing.title })}</p>
                <div className="flex flex-col gap-2">
                  <Button variant="mint" size="sm" className="w-full" onClick={logSession} data-action="arena-log">
                    {t('home.arenaLogYes')}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full" onClick={close}>
                    {t('home.arenaLogNo')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" className="w-full" onClick={close}>
                {t('common.close')}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
