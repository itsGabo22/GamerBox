'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GameCard } from '@/components/dashboard/GameCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGameStore } from '@/store/useGameStore';
import { useTranslation, genreLabel, statusLabel } from '@/i18n/useTranslation';
import { formatNumber } from '@/i18n/format';
import { getProgression } from '@/lib/progression';
import { fadeUp, stagger } from '@/lib/motion';
import { cn } from '@/lib/cn';

const STATUSES = ['PLAYING', 'PENDING', 'COMPLETED'] as const;
const platformsOf = (platform: string) => platform.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);

export default function BacklogPage() {
  const games = useGameStore((state) => state.games);
  const { t, language } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<string[]>([]);

  const stats = useMemo(() => getProgression(games), [games]);
  const pending = games.length - stats.playing - stats.completed;

  // Filters are built from what is actually in the vault, so no chip is ever a dead end.
  const filters = useMemo(() => {
    const platforms = Array.from(new Set(games.flatMap((g) => platformsOf(g.platform)))).slice(0, 5);
    const genres = Array.from(new Set(games.map((g) => (g.genre || 'UNKNOWN').toUpperCase()))).slice(0, 6);
    return [
      ...STATUSES.map((s) => ({ id: `status:${s}`, label: statusLabel(t, s) })),
      ...platforms.map((p) => ({ id: `platform:${p}`, label: p })),
      ...genres.map((g) => ({ id: `genre:${g}`, label: genreLabel(t, g) })),
    ];
  }, [games, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups: Record<string, string[]> = {};
    active.forEach((id) => {
      const [type, value] = id.split(':');
      (groups[type] ||= []).push(value);
    });
    // OR inside a group (PS5 or PC), AND between groups (… and RPG).
    return games.filter((game) => {
      if (q && !`${game.title} ${game.genre} ${game.platform}`.toLowerCase().includes(q)) return false;
      if (groups.status && !groups.status.includes(game.status)) return false;
      if (groups.platform && !platformsOf(game.platform).some((p) => groups.platform.includes(p))) return false;
      if (groups.genre && !groups.genre.includes((game.genre || 'UNKNOWN').toUpperCase())) return false;
      return true;
    });
  }, [games, query, active]);

  const toggle = (id: string) => setActive((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  const reset = () => {
    setActive([]);
    setQuery('');
  };

  const kpis = [
    { label: t('backlog.total'), value: games.length, tone: 'text-white' },
    { label: t('backlog.pending'), value: pending, tone: 'text-white' },
    { label: t('backlog.playing'), value: stats.playing, tone: 'text-neon-red-bright' },
    { label: t('backlog.completed'), value: stats.completed, tone: 'text-mint-green' },
  ];

  const chip = (on: boolean) =>
    cn(
      'flex h-11 shrink-0 snap-start items-center rounded-full border px-4 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 active:scale-95',
      on ? 'border-neon-red bg-neon-red/15 text-neon-red-bright' : 'border-surface-border bg-surface-glass text-text-dim hover:text-white'
    );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pb-nav flex w-full flex-col px-4 pt-6">
      <motion.header variants={fadeUp} className="mb-5">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white">{t('backlog.title')}</h1>
        <p className="eyebrow mt-1.5">
          {t('backlog.subtitle', { games: formatNumber(games.length, language), hours: formatNumber(stats.totalHours, language) })}
        </p>
      </motion.header>

      <motion.dl variants={fadeUp} className="glass-panel mb-5 grid grid-cols-4 divide-x divide-surface-border rounded-2xl" data-tour="backlog-vault">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col-reverse items-center gap-1 px-1 py-3.5 text-center">
            <dt className="font-mono text-[8.5px] font-bold uppercase leading-tight tracking-wider text-text-dim">{kpi.label}</dt>
            <dd className={cn('font-heading text-2xl font-black leading-none', kpi.tone)}>{kpi.value}</dd>
          </div>
        ))}
      </motion.dl>

      {games.length === 0 ? (
        <motion.div variants={fadeUp}>
          <EmptyState
            art="vault"
            title={t('backlog.emptyTitle')}
            body={t('backlog.emptyBody')}
            actionLabel={t('backlog.emptyCta')}
            onAction={() => router.push('/discover')}
          />
        </motion.div>
      ) : (
        <>
          <div
            className="sticky z-20 -mx-4 bg-obsidian-black/90 px-4 pb-2 pt-2 backdrop-blur-md"
            style={{ top: 'calc(var(--sat) + 68px)' }}
          >
            <div className="relative">
              <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('backlog.searchPlaceholder')}
                aria-label={t('backlog.searchPlaceholder')}
                className="field h-12 bg-surface-glass pl-11 pr-12 font-body"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('backlog.clearFilters')}
                  className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-text-dim"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* The fading right edge signals that the rail scrolls. */}
            <div className="rail-fade -mx-4 mt-2">
              <div className="scrollbar-hide flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pr-12" role="group" aria-label={t('backlog.filters')}>
                <button type="button" onClick={reset} aria-pressed={active.length === 0} className={chip(active.length === 0)}>
                  {t('common.all')} · {games.length}
                </button>
                {filters.map((f) => (
                  <button key={f.id} type="button" onClick={() => toggle(f.id)} aria-pressed={active.includes(f.id)} className={chip(active.includes(f.id))}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {filtered.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <EmptyState
              art="search"
              className="mt-4"
              title={t('backlog.noResults')}
              body={t('backlog.noResultsSub')}
              actionLabel={t('backlog.clearFilters')}
              onAction={reset}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
