'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon, TrendingUp, Swords, Gamepad2, Sparkles, Navigation as NavigationIcon, Flame } from 'lucide-react';
import { GameCard } from '@/components/dashboard/GameCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { getOracleRecommendations, AiRecommendation, analyzeSteamDeals } from '@/services/aiService';
import { fetchSteamDeals, searchGlobalGames, ApiGameDeal, ApiGameSearchResult } from '@/services/gameApiService';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n/useTranslation';
import { useRouter } from 'next/navigation';

const GENRES = [
  { id: 'all', label: 'TODOS', icon: TrendingUp },
  { id: 'rpg', label: 'RPG', icon: Swords },
  { id: 'action', label: 'ACTION', icon: Gamepad2 },
  { id: 'strategy', label: 'STRATEGY', icon: NavigationIcon },
  { id: 'racing', label: 'RACING', icon: Sparkles },
];

export default function DiscoverPage() {
  const games = useGameStore(state => state.games);
  const addGame = useGameStore(state => state.addGame);
  const setSelectedGame = useGameStore(state => state.setSelectedGame);
  const { t, language } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');

  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleResults, setOracleResults] = useState<AiRecommendation[] | null>(null);

  const [deals, setDeals] = useState<ApiGameDeal[]>([]);
  const [isDealsLoading, setIsDealsLoading] = useState(true);
  const [dealAnalysis, setDealAnalysis] = useState<{ recommendedDealId: string; analysis: string } | null>(null);
  const [isDealAnalysisLoading, setIsDealAnalysisLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<ApiGameSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Custom Game Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGame, setNewGame] = useState({ title: '', platform: 'PC', genre: 'RPG', status: 'PENDING' });

  useEffect(() => {
    fetchSteamDeals().then(data => {
      setDeals(data);
      setIsDealsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
      const delay = setTimeout(() => {
        searchGlobalGames(searchQuery).then(res => {
          setSearchResults(res);
          setIsSearching(false);
        });
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

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

  const handleDealAnalysis = async () => {
    setIsDealAnalysisLoading(true);
    try {
      const favorites = games.filter(g => g.isFavorite).map(g => g.title);
      const res = await analyzeSteamDeals(deals, favorites, language);
      setDealAnalysis(res);
    } finally {
      setIsDealAnalysisLoading(false);
    }
  };

  const handleOpenGlobalGame = (gameInfo: ApiGameSearchResult) => {
    const tempGame = {
      id: gameInfo.gameID,
      title: gameInfo.external,
      coverUrl: gameInfo.thumb,
      genre: 'UNKNOWN',
      platform: 'PC',
      status: 'PENDING',
      isFavorite: false,
      timePlayed: '0 hrs',
      rating: 0
    };
    setSelectedGame(tempGame);
    router.push(`/game/view?id=${gameInfo.gameID}&external=true`);
  };
  const handleAddToBacklog = (rec: AiRecommendation) => {
    addGame({
      id: rec.id,
      title: rec.title,
      coverUrl: rec.coverUrl,
      genre: rec.genre,
      platform: rec.platform,
      status: 'PENDING',
      isFavorite: false,
      timePlayed: '0 hrs',
      rating: 0
    });
    setOracleResults(prev => prev ? prev.filter(r => r.id !== rec.id) : null);
  };

  const submitNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    addGame({
      id: `custom-${Date.now()}`,
      title: newGame.title,
      coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000',
      genre: newGame.genre,
      platform: newGame.platform,
      status: newGame.status,
      isFavorite: false,
      timePlayed: '0 hrs',
      rating: 0
    });
    setShowAddModal(false);
    setNewGame({ title: '', platform: 'PC', genre: 'RPG', status: 'PENDING' });
  };

  // Filter games based on search and selected genre
  const filteredGames = useMemo(() => {
    let result = games;
    if (activeGenre !== 'all') {
      result = result.filter(game => game.genre?.toLowerCase() === activeGenre);
    }
    return result;
  }, [activeGenre, games]);

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
                <div className="flex gap-4">
                  <button
                    onClick={handleOracleClick}
                    className="font-mono text-[10px] text-text-dim uppercase underline hover:text-white"
                  >
                    🔄 Recalibrar
                  </button>
                  <button
                    onClick={() => setOracleResults(null)}
                    className="font-mono text-[10px] text-text-dim uppercase underline hover:text-neon-red"
                  >
                    {t('discover.reset')}
                  </button>
                </div>
              </div>

              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
                {oracleResults.map((game) => (
                  <div key={game.id} className="snap-start shrink-0 w-[240px] md:w-[280px] relative flex flex-col gap-2">
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
                    }} />
                    <div className="absolute -top-3 -right-2 z-10">
                      <div className="bg-obsidian-black px-3 py-1.5 rounded-lg border-2 border-mint-green shadow-[0_0_15px_rgba(94,230,168,0.4)]">
                        <p className="font-mono text-xs font-bold text-mint-green tracking-widest uppercase whitespace-nowrap drop-shadow-md">
                          {game.matchScore}% AI MATCH
                        </p>
                      </div>
                    </div>
                    <div className="bg-surface-glass border border-surface-border rounded-xl p-3 mt-1 shadow-glass">
                      <p className="font-body text-xs text-white/80 italic leading-relaxed">&quot;{game.reason}&quot;</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-1 border-mint-green/30 text-mint-green hover:bg-mint-green/10"
                      onClick={() => handleAddToBacklog(game)}
                    >
                      + Añadir al Backlog
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Section 1: OFERTAS STEAM (Live) */}
      {searchQuery === '' && activeGenre === 'all' && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim flex items-center gap-2">
              <Flame size={14} className="text-neon-red-bright" />
              Ofertas de Steam en Vivo
            </h2>
            <button
              onClick={handleDealAnalysis}
              disabled={isDealsLoading || isDealAnalysisLoading || deals.length === 0}
              className="font-mono text-[10px] text-mint-green uppercase underline hover:text-white transition-colors"
            >
              {isDealAnalysisLoading ? 'Analizando...' : '✨ Analizar Ofertas con IA'}
            </button>
          </div>

          {dealAnalysis && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 px-4 py-3 bg-mint-green/10 border border-mint-green/30 rounded-xl">
              <p className="font-mono text-[10px] text-mint-green font-bold uppercase mb-1">GamerBox Advisor</p>
              <p className="font-body text-xs text-white leading-relaxed">{dealAnalysis.analysis}</p>
            </motion.div>
          )}

          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
            {isDealsLoading ? (
              <div className="text-text-dim font-mono text-xs uppercase px-2 py-8">Sincronizando ofertas...</div>
            ) : (
              deals.map(deal => {
                const isRecommended = dealAnalysis?.recommendedDealId === deal.dealID;
                return (
                  <div
                    key={deal.dealID}
                    onClick={() => {
                      const tempGame = {
                        id: deal.gameID,
                        title: deal.title,
                        coverUrl: deal.thumb,
                        genre: 'PC',
                        platform: 'PC',
                        status: 'PENDING',
                        isFavorite: false,
                        timePlayed: '0 hrs',
                        rating: 0
                      };
                      setSelectedGame(tempGame);
                      router.push(`/game/view?id=${deal.gameID}&external=true`);
                    }}
                    className={`snap-start shrink-0 w-[260px] relative rounded-2xl overflow-hidden group bg-obsidian-dark border cursor-pointer transition-colors ${isRecommended ? 'border-mint-green shadow-[0_0_15px_rgba(94,230,168,0.2)]' : 'border-surface-border hover:border-neon-red/50'}`}
                  >
                    <div className="w-full aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url(${deal.thumb})` }} />
                    <div className="absolute top-2 left-2 bg-neon-red px-2 py-1 rounded shadow-neon">
                      <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        -{Math.round(parseFloat(deal.savings))}%
                      </span>
                    </div>
                    {isRecommended && (
                      <div className="absolute top-2 right-2 bg-mint-green px-2 py-1 rounded shadow-[0_0_10px_rgba(94,230,168,0.5)]">
                        <span className="font-mono text-[10px] font-bold text-obsidian-black uppercase tracking-wider">
                          ✨ IA Pick
                        </span>
                      </div>
                    )}
                    <div className="p-3 bg-obsidian-black border-t border-surface-border">
                      <h3 className="font-heading font-bold text-sm text-white line-clamp-1 mb-2">{deal.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-text-dim text-xs line-through">${deal.normalPrice}</span>
                        <span className="text-mint-green font-bold font-mono">${deal.salePrice}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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

      {/* Section 3: PODRÍA GUSTARTE / BÚSQUEDA */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim">
            {searchQuery !== '' ? t('common.results') : t('discover.mightLike')}
          </h2>
          {(searchQuery !== '' ? searchResults.length > 0 : filteredGames.length > 0) && (
            <span className="font-mono text-[10px] text-text-dim">
              {searchQuery !== '' ? searchResults.length : filteredGames.length} {t('common.found')}
            </span>
          )}
        </div>

        {searchQuery !== '' ? (
          // Global Search Results
          isSearching ? (
            <div className="py-12 text-center text-text-dim font-mono text-xs uppercase">Buscando...</div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              {searchResults.map(game => (
                <div key={game.gameID} onClick={() => handleOpenGlobalGame(game)} className="cursor-pointer">
                  <GameCard game={{
                    id: game.gameID,
                    title: game.external,
                    coverUrl: game.thumb,
                    status: 'GLOBAL',
                    rating: 0,
                    isFavorite: false,
                    timePlayed: '0 hrs',
                    platform: 'PC',
                    genre: 'UNKNOWN',
                  }} />
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
          )
        ) : (
          // Standard Filtering from User Library
          filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              {recommendations.map(game => (
                <div key={game.id} className="relative cursor-pointer" onClick={() => {
                  setSelectedGame(game);
                  router.push(`/game/view?id=${game.id}`);
                }}>
                  <GameCard game={game} />
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
          )
        )}
      </section>
      {/* Custom Game Button */}
      <div className="flex justify-center mt-6">
        <Button variant="ghost" onClick={() => setShowAddModal(true)} className="border border-surface-border">
          + Registrar Juego Nuevo
        </Button>
      </div>

      {/* Add Game Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-obsidian-dark border border-surface-border p-6 rounded-3xl w-full max-w-sm shadow-glass">
              <h3 className="font-heading font-bold text-xl text-white mb-4 uppercase">Nuevo Juego</h3>
              <form onSubmit={submitNewGame} className="flex flex-col gap-4">
                <input required placeholder="Título" value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={newGame.platform} onChange={e => setNewGame({...newGame, platform: e.target.value})} className="h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm">
                    <option value="PC">PC</option>
                    <option value="PS5">PS5</option>
                    <option value="Switch">Switch</option>
                    <option value="Xbox">Xbox</option>
                  </select>
                  <select value={newGame.genre} onChange={e => setNewGame({...newGame, genre: e.target.value})} className="h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm">
                    <option value="RPG">RPG</option>
                    <option value="ACTION">ACTION</option>
                    <option value="SHOOTER">SHOOTER</option>
                    <option value="RACING">RACING</option>
                  </select>
                </div>
                <Button type="submit" variant="neon" className="w-full mt-2">Guardar en Backlog</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
