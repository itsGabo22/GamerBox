'use client';

import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, TrendingUp, Trophy, Swords, Gamepad2, Sparkles, Navigation as NavigationIcon } from 'lucide-react';
import { ALL_GAMES } from '@/data/mockGames';
import { GameCard } from '@/components/dashboard/GameCard';
import { GlassPanel } from '@/components/ui/GlassPanel';
import Link from 'next/link';
import { motion } from 'framer-motion';

const GENRES = [
  { id: 'all', label: 'Tendencias', icon: TrendingUp },
  { id: 'rpg', label: 'RPG', icon: Swords },
  { id: 'action', label: 'Acción', icon: Gamepad2 },
  { id: 'strategy', label: 'Estrategia', icon: NavigationIcon },
  { id: 'racing', label: 'Carreras', icon: Sparkles },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('all');

  // Filter games based on search and selected genre
  const filteredGames = useMemo(() => {
    let result = ALL_GAMES;
    
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
  }, [searchQuery, activeGenre]);

  // Upcoming/Recent Releases logic (just use recent/highest rated as mock)
  const releases = ALL_GAMES.slice(0, 4);
  const recommendations = filteredGames.slice(0, 6);

  return (
    <div className="flex flex-col w-full px-4 pt-6 md:px-8 pb-12">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white mb-1">
          DESCUBRIR
        </h1>
        <p className="font-body text-sm text-text-dim">
          Encuentra tu próximo juego.
        </p>
      </header>

      {/* Search Input */}
      <div className="relative w-full mb-8 z-30">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-dim">
          <SearchIcon size={20} />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar juegos..."
          className="w-full h-14 pl-12 pr-4 bg-surface-glass backdrop-blur-xl border border-surface-border rounded-2xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all shadow-glass"
        />
      </div>

      {/* Section 1: LANZAMIENTOS (16:9 Release Cards) */}
      {searchQuery === '' && activeGenre === 'all' && (
        <section className="mb-8">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
            Lanzamientos
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
            Explorar Géneros
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
            {searchQuery !== '' ? 'Resultados' : 'Podría Gustarte'}
          </h2>
          {filteredGames.length > 0 && (
            <span className="font-mono text-[10px] text-text-dim">{filteredGames.length} encontrados</span>
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
            <p className="text-white font-heading font-bold text-lg mb-2">NO ENCONTRAMOS ESE JUEGO</p>
            <p className="text-text-dim font-body text-sm max-w-[250px]">
              Prueba con otro título, género o plataforma.
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
