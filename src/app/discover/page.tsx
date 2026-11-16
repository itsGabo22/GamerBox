'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flame, Plus, RefreshCw, Search as SearchIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GameCard, GameCardSkeleton } from '@/components/dashboard/GameCard';
import { GameCover } from '@/components/ui/SafeGameImage';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { OracleMark } from '@/components/ui/OracleMark';
import { useGameStore, type GameStatus } from '@/store/useGameStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { toast } from '@/store/useToastStore';
import { useTranslation, genreLabel, statusLabel } from '@/i18n/useTranslation';
import { formatPrice } from '@/i18n/format';
import { analyzeSteamDeals, getOracleRecommendations, type AiRecommendation } from '@/services/aiService';
import { fetchSteamDeals, searchGlobalGames, type ApiGameDeal, type ExternalGameResult, type Sourced } from '@/services/gameApiService';
import { openExternalGame } from '@/lib/openGame';
import { fadeUp, stagger, tBase } from '@/lib/motion';
import { cn } from '@/lib/cn';

const PLATFORMS = ['PC', 'PS5', 'Xbox', 'Switch'];
const GENRES = ['RPG', 'ACTION', 'SHOOTER', 'RACING', 'STRATEGY', 'HORROR', 'SPORTS', 'ADVENTURE'];
const STATUSES: GameStatus[] = ['PENDING', 'PLAYING', 'COMPLETED'];

const Chip = ({ active, onClick, children, tone = 'red' }: { active: boolean; onClick: () => void; children: React.ReactNode; tone?: 'red' | 'mint' }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={cn(
      'flex h-11 shrink-0 items-center rounded-full border px-4 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 active:scale-95',
      active
        ? tone === 'red'
          ? 'border-neon-red bg-neon-red/15 text-neon-red-bright'
          : 'border-mint-green/60 bg-mint-green/15 text-mint-green'
        : 'border-surface-border bg-surface-glass text-text-dim hover:text-white'
    )}
  >
    {children}
  </button>
);

export default function DiscoverPage() {
  const games = useGameStore((s) => s.games);
  const addGame = useGameStore((s) => s.addGame);
  const { t, language } = useTranslation();
  const currency = useSettingsStore((s) => s.currency);
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalGameResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [genre, setGenre] = useState('ALL');

  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracle, setOracle] = useState<AiRecommendation[] | null>(null);

  const [deals, setDeals] = useState<Sourced<ApiGameDeal> | null>(null);
  const [advice, setAdvice] = useState<{ recommendedDealId: string; analysis: string } | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState<ExternalGameResult[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [picked, setPicked] = useState<ExternalGameResult | null>(null);
  const [draft, setDraft] = useState<{ platform: string; genre: string; status: GameStatus }>({ platform: 'PC', genre: 'RPG', status: 'PENDING' });

  useEffect(() => {
    let alive = true;
    fetchSteamDeals().then((d) => alive && setDeals(d));
    return () => {
      alive = false;
    };
  }, []);

  // Debounced global search; stale responses are ignored.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(() => {
      searchGlobalGames(q).then((found) => {
        if (!alive) return;
        setResults(found);
        setSearching(false);
      });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const q = addQuery.trim();
    if (q.length < 3 || picked) {
      setAddResults([]);
      setAddSearching(false);
      return;
    }
    let alive = true;
    setAddSearching(true);
    const timer = setTimeout(() => {
      searchGlobalGames(q).then((found) => {
        if (!alive) return;
        setAddResults(found.slice(0, 5));
        setAddSearching(false);
      });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [addQuery, picked]);

  const askOracle = async () => {
    setOracleLoading(true);
    try {
      setOracle(await getOracleRecommendations(games, language));
    } finally {
      setOracleLoading(false);
    }
  };

  const askAdvisor = async () => {
    if (!deals) return;
    setAdviceLoading(true);
    try {
      setAdvice(await analyzeSteamDeals(deals.items, games.filter((g) => g.isFavorite).map((g) => g.title), language));
    } finally {
      setAdviceLoading(false);
    }
  };

  const register = (game: { id: string; title: string; coverUrl: string; genre: string; platform: string; status?: GameStatus }) => {
    const ok = addGame({ ...game, status: game.status || 'PENDING', isFavorite: false, timePlayed: '0 h', hoursPlayed: 0, rating: 0 });
    toast(t(ok ? 'discover.added' : 'discover.duplicate', { title: game.title }), ok ? 'success' : 'error');
    return ok;
  };

  const closeAdd = () => {
    setAddOpen(false);
    setAddQuery('');
    setPicked(null);
    setAddResults([]);
    setDraft({ platform: 'PC', genre: 'RPG', status: 'PENDING' });
  };

  const submitNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    const title = (picked?.title || addQuery).trim();
    if (!title) return;
    const ok = register({
      id: picked ? picked.gameID : `custom-${Date.now()}`,
      title,
      coverUrl: picked?.cover || '',
      genre: draft.genre,
      platform: draft.platform,
      status: draft.status,
    });
    if (ok) closeAdd();
  };

  const owned = useMemo(() => new Set(games.map((g) => g.title.trim().toLowerCase())), [games]);
  const libraryGenres = useMemo(() => ['ALL', ...Array.from(new Set(games.map((g) => (g.genre || 'UNKNOWN').toUpperCase())))], [games]);
  const library = genre === 'ALL' ? games : games.filter((g) => (g.genre || 'UNKNOWN').toUpperCase() === genre);
  const isSearch = query.trim().length >= 3;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pb-nav flex w-full flex-col gap-7 px-4 pt-6">
      <motion.header variants={fadeUp}>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white">{t('discover.title')}</h1>
        <p className="mt-1 text-sm text-text-dim">{t('discover.subtitle')}</p>
      </motion.header>

      <motion.div variants={fadeUp} className="relative -mt-2">
        <SearchIcon size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.searchPlaceholder')}
          aria-label={t('common.searchPlaceholder')}
          className="field h-14 rounded-2xl bg-surface-glass pl-12 pr-12 font-body text-base"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label={t('common.close')} className="absolute right-0 top-0 flex h-14 w-12 items-center justify-center text-text-dim">
            <X size={17} />
          </button>
        )}
      </motion.div>

      {isSearch ? (
        <section aria-busy={searching}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="eyebrow">{t('common.results')}</h2>
            {!searching && results.length > 0 && (
              <span className="font-mono text-[10px] text-text-dim">
                {results.length} {t('common.found')}
              </span>
            )}
          </div>
          {searching ? (
            <div className="grid grid-cols-2 gap-3" role="status" aria-label={t('discover.searching')}>
              {[0, 1, 2, 3].map((i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {results.map((item) => (
                <GameCard
                  key={item.gameID}
                  game={{ id: item.gameID, title: item.title, coverUrl: item.cover, genre: item.genre, platform: item.platform, status: 'GLOBAL', isFavorite: false, timePlayed: '', rating: 0 }}
                  onOpen={() => openExternalGame(item, router)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              art="search"
              title={t('discover.noResults')}
              body={t('discover.noResultsSub')}
              actionLabel={t('discover.addGame')}
              onAction={() => {
                setAddQuery(query.trim());
                setAddOpen(true);
              }}
            />
          )}
        </section>
      ) : (
        <>
          {/* The Oracle + manual registration */}
          <motion.section variants={fadeUp} className="flex flex-col gap-3">
            <AnimatePresence mode="wait" initial={false}>
              {oracleLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={tBase}
                  role="status"
                  className="flex h-[72px] items-center justify-center gap-3 rounded-2xl border border-neon-red/30 bg-neon-red/10"
                >
                  <OracleMark size={24} active className="text-neon-red-bright" />
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">{t('discover.analyzing')}</p>
                </motion.div>
              ) : oracle ? (
                <motion.div key="results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={tBase}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="eyebrow flex items-center gap-2 text-neon-red-bright">
                      <OracleMark size={15} />
                      {t('discover.oracleTitle')}
                    </h2>
                    <div className="-mr-2 flex">
                      <button type="button" onClick={askOracle} className="flex h-11 items-center gap-1.5 px-2 font-mono text-[11px] font-bold uppercase tracking-wider text-text-dim hover:text-white">
                        <RefreshCw size={13} aria-hidden />
                        {t('discover.recalibrate')}
                      </button>
                      <button type="button" onClick={() => setOracle(null)} aria-label={t('discover.dismiss')} className="flex h-11 w-11 items-center justify-center text-text-dim hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
                    {oracle.map((rec) => {
                      const has = owned.has(rec.title.trim().toLowerCase());
                      return (
                        <div key={rec.id} className="flex w-[210px] shrink-0 snap-start flex-col gap-2">
                          <GameCard
                            game={{ id: rec.id, title: rec.title, coverUrl: rec.coverUrl, genre: rec.genre, platform: rec.platform, status: 'ORACLE', isFavorite: false, timePlayed: '', rating: 0 }}
                            onOpen={() => openExternalGame({ gameID: rec.id, title: rec.title, cover: rec.coverUrl, genre: rec.genre, platform: rec.platform }, router)}
                            chip={
                              <span className="rounded-md border border-mint-green/60 bg-black/70 px-1.5 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-[#5EE6A8] backdrop-blur-md">
                                {t('discover.match', { n: rec.matchScore })}
                              </span>
                            }
                          />
                          <p className="selectable line-clamp-4 min-h-[4.5rem] text-xs leading-relaxed text-text-dim">{rec.reason}</p>
                          <Button
                            variant={has ? 'ghost' : 'mint'}
                            size="sm"
                            className="w-full"
                            disabled={has}
                            onClick={() => register({ id: rec.id, title: rec.title, coverUrl: rec.coverUrl, genre: rec.genre, platform: rec.platform })}
                          >
                            {has ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
                            {has ? t('discover.inBacklog') : t('discover.addToBacklog')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="cta"
                  type="button"
                  onClick={askOracle}
                  data-tour="oracle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={tBase}
                  className="flex h-[72px] w-full items-center gap-4 rounded-2xl bg-neon-red px-5 text-left text-real-white shadow-neon transition-transform duration-150 active:scale-[0.98]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/25">
                    <OracleMark size={26} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-heading text-base font-bold uppercase tracking-wide">{t('discover.oracleCta')}</span>
                    <span className="block truncate text-xs text-real-white/80">{t('discover.oracleHint')}</span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <Button variant="ghost" className="w-full" onClick={() => setAddOpen(true)} data-tour="add-game">
              <Plus size={17} aria-hidden />
              {t('discover.addGame')}
            </Button>
          </motion.section>

          {/* Steam deals */}
          <motion.section variants={fadeUp} aria-busy={!deals}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="eyebrow flex min-w-0 items-center gap-2">
                <Flame size={14} className="shrink-0 text-neon-red-bright" aria-hidden />
                <span className="truncate">{t('discover.deals')}</span>
                {deals && (
                  <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[9px]', deals.live ? 'border-mint-green/40 text-mint-green' : 'border-surface-border text-text-dim')}>
                    {t(deals.live ? 'discover.dealsLive' : 'discover.dealsLocal')}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={askAdvisor}
                disabled={!deals || adviceLoading}
                className="-mr-2 flex h-11 shrink-0 items-center gap-1.5 px-2 font-mono text-[11px] font-bold uppercase tracking-wider text-mint-green disabled:opacity-50"
              >
                <OracleMark size={14} active={adviceLoading} />
                {adviceLoading ? t('discover.analyzingDeals') : t('discover.analyzeDeals')}
              </button>
            </div>

            <AnimatePresence>
              {advice && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={tBase} className="overflow-hidden">
                  <div className="mb-3 rounded-2xl border border-mint-green/40 bg-mint-green/10 p-4" role="status">
                    <p className="eyebrow mb-1 text-mint-green">{t('discover.advisor')}</p>
                    <p className="selectable text-sm leading-relaxed text-white">{advice.analysis}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
              {!deals
                ? [0, 1, 2].map((i) => (
                    <div key={i} className="w-[150px] shrink-0">
                      <GameCardSkeleton />
                      <div className="skeleton mt-2 h-4 w-24 rounded" />
                    </div>
                  ))
                : deals.items.map((deal) => {
                    const pick = advice?.recommendedDealId === deal.dealID;
                    return (
                      <button
                        key={deal.dealID}
                        type="button"
                        onClick={() => openExternalGame({ gameID: deal.gameID, title: deal.title, cover: deal.thumb, genre: 'PC', platform: 'PC' }, router)}
                        className="w-[150px] shrink-0 snap-start text-left transition-transform duration-150 active:scale-[0.97]"
                      >
                        <div className={cn('relative aspect-[2/3] overflow-hidden rounded-2xl border bg-obsidian-dark', pick ? 'border-mint-green shadow-mint' : 'border-surface-border')}>
                          <GameCover src={deal.thumb} title={deal.title} className="absolute inset-0 h-full w-full" />
                          <span className="absolute left-2 top-2 rounded-md bg-neon-red px-1.5 py-1 font-mono text-[11px] font-bold leading-none text-real-white shadow-neon">
                            −{deal.savings}%
                          </span>
                          {pick && (
                            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-[#5EE6A8] py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black">
                              <OracleMark size={12} />
                              {t('discover.advisorPick')}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 line-clamp-1 font-heading text-sm font-bold text-white">{deal.title}</h3>
                        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                          <span className="font-mono text-xs font-bold text-mint-green">{formatPrice(deal.salePrice, currency, language)}</span>
                          <span className="font-mono text-[10px] text-text-dim line-through">{formatPrice(deal.normalPrice, currency, language)}</span>
                        </p>
                      </button>
                    );
                  })}
            </div>
          </motion.section>

          {/* The player's own vault, by genre */}
          <motion.section variants={fadeUp}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="eyebrow">{t('discover.mightLike')}</h2>
              {library.length > 0 && <span className="font-mono text-[10px] text-text-dim">{library.length}</span>}
            </div>
            {games.length === 0 ? (
              <EmptyState art="signal" compact title={t('discover.emptyLibTitle')} body={t('discover.emptyLibBody')} />
            ) : (
              <>
                <div className="rail-fade -mx-4 mb-4">
                  <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pr-12" role="radiogroup" aria-label={t('discover.genres')}>
                    {libraryGenres.map((g) => (
                      <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
                        {genreLabel(t, g)}
                      </Chip>
                    ))}
                  </div>
                </div>
                {library.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {library.slice(0, 6).map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-text-dim">{t('discover.emptyGenre')}</p>
                )}
              </>
            )}
          </motion.section>
        </>
      )}

      <Modal open={addOpen} onClose={closeAdd} title={t('discover.addTitle')} variant="sheet">
        <form onSubmit={submitNewGame} className="flex flex-col gap-5">
          <div>
            <label htmlFor="add-title" className="eyebrow mb-1.5 block">
              {t('discover.addTitleLabel')}
            </label>
            <div className="relative">
              <SearchIcon size={17} className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim', addSearching && 'animate-pulse-ring text-neon-red-bright')} aria-hidden />
              <input
                id="add-title"
                required
                maxLength={120}
                autoComplete="off"
                placeholder={t('discover.addPlaceholder')}
                value={addQuery}
                onChange={(e) => {
                  setAddQuery(e.target.value);
                  setPicked(null);
                }}
                className="field pl-11 font-body"
              />
            </div>

            {addResults.length > 0 && !picked && (
              <ul className="mt-2 flex flex-col gap-1 rounded-2xl border border-surface-border bg-obsidian-black p-1.5">
                {addResults.map((res) => (
                  <li key={res.gameID}>
                    <button
                      type="button"
                      onClick={() => {
                        setPicked(res);
                        setAddQuery(res.title);
                        setDraft((d) => ({
                          ...d,
                          genre: GENRES.includes(res.genre.toUpperCase()) ? res.genre.toUpperCase() : d.genre,
                          platform: PLATFORMS.find((p) => res.platform.toUpperCase().includes(p.toUpperCase())) || d.platform,
                        }));
                      }}
                      className="flex min-h-[56px] w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/5"
                    >
                      <GameCover src={res.cover} title={res.title} className="h-12 w-9 shrink-0 rounded-md" />
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-heading text-sm font-bold text-white">{res.title}</span>
                        <span className="font-mono text-[10px] uppercase text-text-dim">
                          {genreLabel(t, res.genre)} · {res.platform}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {picked && (
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-neon-red/40 bg-neon-red/10 p-2">
                <GameCover src={picked.cover} title={picked.title} className="h-16 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="eyebrow text-neon-red-bright">{t('discover.selected')}</p>
                  <p className="line-clamp-2 font-heading text-sm font-bold text-white">{picked.title}</p>
                </div>
              </div>
            )}
          </div>

          <fieldset>
            <legend className="eyebrow mb-2">{t('discover.platform')}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {PLATFORMS.map((p) => (
                <Chip key={p} active={draft.platform === p} onClick={() => setDraft({ ...draft, platform: p })}>
                  {p}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-2">{t('discover.genreLabel')}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {GENRES.map((g) => (
                <Chip key={g} tone="mint" active={draft.genre === g} onClick={() => setDraft({ ...draft, genre: g })}>
                  {genreLabel(t, g)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-2">{t('discover.statusLabel')}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {STATUSES.map((s) => (
                <Chip key={s} active={draft.status === s} onClick={() => setDraft({ ...draft, status: s })}>
                  {statusLabel(t, s)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <Button type="submit" variant="neon" className="w-full" data-action="save-game">
            {t('discover.saveToBacklog')}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
