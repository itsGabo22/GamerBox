'use client';

import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, TrendingUp, Swords, Gamepad2, Sparkles, Navigation as NavigationIcon } from 'lucide-react';
import { ALL_GAMES } from '@/data/mockGames';
import { GameCard } from '@/components/dashboard/GameCard';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { getOracleRecommendations, AiRecommendation } from '@/services/aiService';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';

const GENRES = [
  { id: 'all', label: 'TODOS', icon: TrendingUp },
  { id: 'rpg', label: 'RPG', icon: Swords },
  { id: 'action', label: 'ACTION', icon: Gamepad2 },
  { id: 'strategy', label: 'STRATEGY', icon: NavigationIcon },
  { id: 'racing', label: 'RACING', icon: Sparkles },
];

export default function DiscoverPage() {
  const games = useGameStore(state => state.games);
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');

  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleResults, setOracleResults] = useState<AiRecommendation[] | null>(null);

  const handleOracleClick = async () => {
    setIsOracleLoading(true);
    try {
      const favorites = games.filter(g => g.isFavorite).map(g => g.title);
      const completed = games.filter(g => g.status === 'COMPLETED').map(g => g.title);

      const results = await getOracleRecommendations(favorites, completed, language);
      setOracleResults(results);
    } finally {
      setIsOracleLoading(false);
    }
  };

  // Filter games based on search and selected genre
  const filteredGames = useMemo(() => {
    let result = games;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(game => 
        game.title.toLowerCase().includes(q) || 
        game.genre?.toLowerCase().includes(q) ||
        game.platform?.toLowerCase().includes(q) ||
        game.developer?.toLowerCase().includes(q)
      );
    }
    
    // Apply genre filter
    if (activeGenre !== 'all') {
      result = result.filter(game => game.genre?.toLowerCase() === activeGenre);
    }
    
    return result;
  }, [searchQuery, activeGenre, games]);

  // Upcoming/Recent Releases logic (just use recent/highest rated as mock)
  const releases = ALL_GAMES.slice(0, 4);
  const recommendations = filteredGames.slice(0, 6);

  return (
    <div className="flex flex-col w-full px-4 pt-6 md:px-8 pb-12">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white mb-1">
          {t('discover.title')}
        </h1>
        <p className="font-body text-sm text-text-dim">
          {t('discover.subtitle')}
        </p>
      </header>

      {/* Search Input */}
      <div className="relative w-full mb-6 z-30">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-dim">
          <SearchIcon size={20} />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('common.searchPlaceholder')}
          className="w-full h-14 pl-12 pr-4 bg-surface-glass backdrop-blur-xl border border-surface-border rounded-2xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all shadow-glass"
        />
      </div>

      {/* GamerBox AI Oracle Section */}
      <section className="mb-8 relative z-20">
        <AnimatePresence mode="wait">
          {!oracleResults && !isOracleLoading && (
            <motion.div
              key="oracle-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button
                variant="neon"
                className="w-full h-14 font-heading font-bold text-lg tracking-wide uppercase shadow-neon flex items-center justify-center gap-2"
                onClick={handleOracleClick}
              >
                <Sparkles size={20} />
                {t('discover.analyzeProfile')}
              </Button>
            </motion.div>
          )}

          {isOracleLoading && (
            <motion.div
              key="oracle-loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-24 bg-surface-glass border border-surface-border rounded-2xl flex flex-col items-center justify-center gap-3 overflow-hidden relative"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-neon-red/10"
              />
              <Sparkles size={24} className="text-neon-red animate-pulse relative z-10" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim relative z-10">
                {t('discover.analyzing')}
              </p>
            </motion.div>
          )}

          {oracleResults && !isOracleLoading && (
            <motion.div
              key="oracle-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="w-full flex flex-col gap-4"
            >
              <div className="flex items-center justify-between px-2">
                <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-mint-green flex items-center gap-2">
                  <Sparkles size={12} />
                  GamerBox AI Oracle
                </h2>
                <button
                  onClick={() => setOracleResults(null)}
                  className="font-mono text-[10px] text-text-dim uppercase underline"
                >
                  {t('discover.reset')}
                </button>
              </div>

              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
                {oracleResults.map((game) => (
                  <div key={game.id} className="snap-start shrink-0 w-[240px] md:w-[280px] relative">
                    <GameCard game={{
                      id: game.id,
                      title: game.title,
                      coverUrl: game.coverUrl,
                      status: 'AI REC',
                      rating: 0,
                      isFavorite: false,
                      timePlayed: '0 hrs',
                      platform: game.platform,
                      genre: game.genre,
                      matchPercentage: game.matchPercentage,
                    }} />
                    <div className="absolute -top-3 -right-2 z-10">
                      <div className="bg-obsidian-black px-3 py-1.5 rounded-lg border-2 border-mint-green shadow-[0_0_15px_rgba(94,230,168,0.4)]">
                        <p className="font-mono text-xs font-bold text-mint-green tracking-widest uppercase whitespace-nowrap drop-shadow-md">
                          {game.matchPercentage}% AI MATCH
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Section 1: LANZAMIENTOS (16:9 Release Cards) */}
      {searchQuery === '' && activeGenre === 'all' && (
        <section className="mb-8">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
            {t('discover.releases')}
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
            {releases.map(game => (
              <Link 
                key={game.id} 
                href={`/game/${game.id}`}
                className="snap-start shrink-0 w-[280px] md:w-[320px] aspect-video relative rounded-2xl overflow-hidden group bg-obsidian-dark border border-surface-border transition-colors hover:border-neon-red/50"
              >
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 md:group-hover:scale-105"
                  style={{ backgroundImage: `url(${game.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-black/40 to-transparent" />
                
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 rounded bg-neon-red/90 backdrop-blur-md text-white font-mono text-[10px] font-bold tracking-widest uppercase shadow-neon">
                    NEW
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading font-bold text-lg text-white leading-tight line-clamp-1 mb-1">
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                      {game.releaseDate || 'Recién añadido'}
                    </p>
                    {game.platform && (
                      <span className="text-[10px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                        {game.platform}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: EXPLORAR GÉNEROS */}
      {searchQuery === '' && (
        <section className="mb-8">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
            {t('discover.genres')}
          </h2>
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x">
            {GENRES.map(genre => {
              const isActive = activeGenre === genre.id;
              const Icon = genre.icon;
              return (
                <button
                  key={genre.id}
                  onClick={() => setActiveGenre(genre.id)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-4 h-10 rounded-full font-mono text-xs font-bold tracking-wider transition-all border ${
                    isActive 
                      ? 'bg-neon-red/20 text-neon-red-bright border-neon-red shadow-neon' 
                      : 'bg-surface-glass text-text-dim border-surface-border hover:text-white'
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-neon-red-bright" : "text-text-dim"} />
                  <span className="uppercase">{genre.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3: PODRÍA GUSTARTE */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim">
            {searchQuery !== '' ? t('common.results') : t('discover.mightLike')}
          </h2>
          {filteredGames.length > 0 && (
            <span className="font-mono text-[10px] text-text-dim">{filteredGames.length} {t('common.found')}</span>
          )}
        </div>

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {recommendations.map(game => (
              <div key={game.id} className="relative">
                <GameCard game={game} />
                {game.matchPercentage && (
                  <div className="absolute -top-2 -right-2 z-10 pointer-events-none">
                    <div className="bg-obsidian-black px-2 py-1 rounded border border-mint-green shadow-[0_0_10px_rgba(94,230,168,0.2)]">
                      <p className="font-mono text-[10px] font-bold text-mint-green tracking-widest uppercase whitespace-nowrap">
                        {game.matchPercentage}% Match
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-surface-border rounded-2xl bg-surface-glass mt-2"
          >
            <p className="text-white font-heading font-bold text-lg mb-2">{t('discover.noResults')}</p>
            <p className="text-text-dim font-body text-sm max-w-[250px]">
              {t('discover.noResultsSub')}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
