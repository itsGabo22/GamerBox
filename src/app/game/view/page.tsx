'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Clock, Heart, Minus, Plus, Trash2 } from 'lucide-react';
import { useGameStore, type Game, type GameStatus } from '@/store/useGameStore';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Modal } from '@/components/ui/Modal';
import { GameCover } from '@/components/ui/SafeGameImage';
import { OracleMark } from '@/components/ui/OracleMark';
import { getGameTacticalBreakdown, type TacticalBreakdown } from '@/services/aiService';
import { readActiveGame } from '@/lib/openGame';
import { toast } from '@/store/useToastStore';
import { useTranslation, genreLabel, statusLabel } from '@/i18n/useTranslation';
import { fadeUp, stagger } from '@/lib/motion';
import { cn } from '@/lib/cn';

const STATUSES: GameStatus[] = ['PENDING', 'PLAYING', 'COMPLETED'];

function GameView() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const { t, language } = useTranslation();
  const { selectedGame, games, addGame, removeGame, updateGameStatus, updateGameProgress, toggleFavorite, logPlaySession } = useGameStore();

  const [external, setExternal] = useState<Game | null>(null);
  const [breakdown, setBreakdown] = useState<TacticalBreakdown | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [hours, setHours] = useState(1);

  const owned = games.find((g) => g.id === id) || null;
  useEffect(() => {
    if (!owned) setExternal(selectedGame?.id === id ? selectedGame : readActiveGame(id));
  }, [owned, selectedGame, id]);

  const game = owned || external;
  const goBack = () => (window.history.length > 1 ? router.back() : router.replace('/'));

  // A new game or language invalidates the briefing.
  useEffect(() => {
    setBreakdown(null);
  }, [id, language]);

  if (!game) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="eyebrow">{t('game.notFound')}</p>
        <Button variant="ghost" onClick={goBack}>
          <ArrowLeft size={16} aria-hidden />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const progress = game.status === 'COMPLETED' ? 100 : game.progress || 0;

  const loadBriefing = async () => {
    setLoadingBrief(true);
    try {
      setBreakdown(await getGameTacticalBreakdown(game.title, language));
    } finally {
      setLoadingBrief(false);
    }
  };

  const logHours = () => {
    logPlaySession(game.id, hours);
    toast(t('game.logged', { n: hours, title: game.title }), 'success');
    setHours(1);
  };

  const changeStatus = (status: GameStatus) => {
    if (status === game.status) return;
    updateGameStatus(game.id, status);
    toast(t('game.statusChanged', { status: statusLabel(t, status) }), 'success');
  };

  const roundButton =
    'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-real-white backdrop-blur-md transition-transform duration-150 active:scale-90';

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col pb-10">
      {/* Blurred backdrop + whole, uncropped cover */}
      <div className="absolute inset-x-0 top-0 h-[300px] overflow-hidden" aria-hidden>
        <GameCover src={game.coverUrl} title={game.title} backdrop className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-obsidian-black/60 to-obsidian-black" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4" style={{ paddingTop: 'calc(var(--sat) + 12px)' }}>
        <button type="button" onClick={goBack} aria-label={t('common.back')} className={roundButton}>
          <ArrowLeft size={20} />
        </button>
        {owned && (
          <button
            type="button"
            onClick={() => toggleFavorite(game.id)}
            aria-pressed={game.isFavorite}
            aria-label={t(game.isFavorite ? 'game.favoriteRemove' : 'game.favoriteAdd')}
            className={roundButton}
            data-action="favorite"
          >
            <Heart size={20} className={game.isFavorite ? 'fill-neon-red-bright text-neon-red-bright' : ''} />
          </button>
        )}
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 mt-5 flex flex-col gap-6 px-4">
        <motion.header variants={fadeUp} className="flex items-end gap-4">
          <GameCover src={game.coverUrl} title={game.title} genre={game.genre} className="aspect-[2/3] w-[124px] shrink-0 rounded-2xl border border-surface-border shadow-glass" />
          <div className="min-w-0 pb-1">
            <h1 className="selectable font-heading text-2xl font-black leading-tight text-white">{game.title}</h1>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[game.platform, genreLabel(t, game.genre)].filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full border border-surface-border bg-surface-glass px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-dim">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.header>

        {!owned ? (
          <motion.div variants={fadeUp}>
            <GlassPanel className="flex flex-col gap-4 border-neon-red/30 p-5 text-center">
              <p className="text-sm text-text-dim">{t('game.notInLibrary')}</p>
              <Button
                variant="neon"
                className="w-full"
                data-action="add-to-vault"
                onClick={() => {
                  const ok = addGame(game);
                  toast(t(ok ? 'discover.added' : 'discover.duplicate', { title: game.title }), ok ? 'success' : 'error');
                }}
              >
                <Plus size={17} aria-hidden />
                {t('game.addToBacklog')}
              </Button>
            </GlassPanel>
          </motion.div>
        ) : (
          <>
            <motion.section variants={fadeUp} aria-labelledby="status-label">
              <h2 id="status-label" className="eyebrow mb-2">
                {t('game.status')}
              </h2>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="status-label">
                {STATUSES.map((status) => {
                  const active = game.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-status={status}
                      onClick={() => changeStatus(status)}
                      className={cn(
                        'h-12 rounded-2xl border font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 active:scale-[0.97]',
                        active
                          ? status === 'COMPLETED'
                            ? 'border-mint-green/60 bg-mint-green/15 text-mint-green'
                            : 'border-neon-red bg-neon-red/15 text-neon-red-bright'
                          : 'border-surface-border bg-surface-glass text-text-dim'
                      )}
                    >
                      {statusLabel(t, status)}
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.div variants={fadeUp}>
              <GlassPanel className="flex flex-col gap-5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-mint-green" aria-hidden />
                    <div>
                      <p className="eyebrow">{t('game.timePlayed')}</p>
                      <p className="font-heading text-2xl font-black leading-tight text-white">{t('common.hoursShort', { n: game.hoursPlayed || 0 })}</p>
                    </div>
                  </div>
                  <div className="flex items-center" role="group" aria-label={t('game.logLabel')}>
                    <button type="button" onClick={() => setHours((h) => Math.max(1, h - 1))} aria-label={t('game.less')} className="flex h-11 w-10 items-center justify-center rounded-l-xl border border-surface-border text-text-dim active:bg-white/10">
                      <Minus size={15} />
                    </button>
                    <output className="flex h-11 w-10 items-center justify-center border-y border-surface-border font-mono text-sm font-bold text-white" aria-live="polite">
                      {hours}
                    </output>
                    <button type="button" onClick={() => setHours((h) => Math.min(24, h + 1))} aria-label={t('game.more')} className="flex h-11 w-10 items-center justify-center rounded-r-xl border border-surface-border text-text-dim active:bg-white/10">
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                <Button variant="mint" size="sm" className="w-full" onClick={logHours} data-action="log-hours">
                  <Plus size={15} aria-hidden />
                  {t('game.log')} · {t('common.hoursShort', { n: hours })}
                </Button>

                <div className="border-t border-surface-border pt-4">
                  <div className="mb-2 flex items-end justify-between">
                    <label htmlFor="progress" className="eyebrow">
                      {t('game.progress')}
                    </label>
                    <span className="font-mono text-xs font-bold text-white">{progress}%</span>
                  </div>
                  <input
                    id="progress"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    disabled={game.status === 'COMPLETED'}
                    onChange={(e) => updateGameProgress(game.id, Number(e.target.value))}
                    aria-label={t('game.progressLabel')}
                    className="h-11 w-full accent-[rgb(var(--c-red))] disabled:opacity-60"
                  />
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}

        {/* Oracle briefing (on demand) */}
        <motion.section variants={fadeUp}>
          <h2 className="eyebrow mb-3 flex items-center gap-2 text-neon-red-bright">
            <OracleMark size={15} />
            {t('game.briefing')}
          </h2>

          {loadingBrief ? (
            <div className="flex h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface-glass" role="status">
              <OracleMark size={28} active className="text-neon-red-bright" />
              <p className="font-mono text-[11px] uppercase tracking-wider text-text-dim">{t('game.analyzing')}</p>
            </div>
          ) : !breakdown ? (
            <button
              type="button"
              onClick={loadBriefing}
              data-action="briefing"
              className="flex min-h-[72px] w-full items-center gap-4 rounded-2xl border border-dashed border-surface-border bg-surface-glass px-5 text-left transition-colors hover:border-neon-red/50 active:scale-[0.99]"
            >
              <OracleMark size={26} className="shrink-0 text-neon-red-bright" />
              <span className="flex-1 font-heading text-sm font-bold uppercase tracking-wide text-white">{t('game.generate')}</span>
              <ChevronRight size={18} className="text-text-dim" aria-hidden />
            </button>
          ) : (
            <GlassPanel className="flex flex-col gap-4 p-5">
              <div className="border-l-2 border-neon-red pl-3">
                <p className="eyebrow mb-1">{t('game.synopsis')}</p>
                <p className="selectable line-clamp-4 text-sm leading-relaxed text-white/90">{breakdown.synopsis}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { label: t('game.timeToBeat'), value: breakdown.timeToBeat },
                  { label: t('game.difficulty'), value: breakdown.difficulty },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-surface-border bg-white/5 p-3">
                    <dt className="eyebrow mb-1 text-[9px]">{item.label}</dt>
                    <dd className="font-heading text-sm font-bold leading-snug text-white">{item.value}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() => setDossierOpen(true)}
                data-action="dossier"
                className="flex min-h-[56px] items-center gap-3 rounded-xl border border-neon-red/30 bg-neon-red/10 px-4 py-3 text-left transition-colors hover:bg-neon-red/15"
              >
                <span className="min-w-0 flex-1">
                  <span className="eyebrow block text-neon-red-bright">{t('game.tips')}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-white/80">{breakdown.tips[0]}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-neon-red-bright" aria-hidden />
              </button>
            </GlassPanel>
          )}
        </motion.section>

        {owned && (
          <motion.div variants={fadeUp}>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                removeGame(game.id);
                toast(t('game.removed', { title: game.title }));
                router.replace('/backlog');
              }}
            >
              <Trash2 size={16} aria-hidden />
              {t('game.remove')}
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Modal open={dossierOpen && Boolean(breakdown)} onClose={() => setDossierOpen(false)} title={game.title} eyebrow={t('game.dossier')} variant="sheet">
        {breakdown && (
          <div className="selectable flex flex-col gap-6">
            <section>
              <h3 className="eyebrow mb-2">{t('game.overview')}</h3>
              <p className="text-sm leading-relaxed text-white/90">{breakdown.synopsis}</p>
              <p className="mt-3 border-l-2 border-mint-green pl-3 text-sm italic leading-relaxed text-mint-green">{breakdown.matchReason}</p>
            </section>
            <section>
              <h3 className="eyebrow mb-3">{t('game.strategy')}</h3>
              <ol className="flex flex-col gap-3">
                {breakdown.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl border border-surface-border bg-white/5 p-4">
                    <span className="font-heading text-2xl font-black leading-none text-neon-red/50" aria-hidden>
                      0{i + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed text-white/90">{tip}</p>
                  </li>
                ))}
              </ol>
            </section>
            <dl className="grid grid-cols-2 gap-3">
              {[
                { label: t('game.duration'), value: breakdown.timeToBeat },
                { label: t('game.difficulty'), value: breakdown.difficulty },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-surface-border bg-white/5 p-4 text-center">
                  <dt className="eyebrow mb-1 text-[9px]">{item.label}</dt>
                  <dd className="font-heading text-sm font-bold text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for the static export.
export default function GameViewPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-24"><div className="skeleton h-64 w-full" /></div>}>
      <GameView />
    </Suspense>
  );
}
