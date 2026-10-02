'use client';

import React, { useState, useMemo } from 'react';
import { BacklogStats } from '@/components/backlog/BacklogStats';
import { Search } from '@/components/backlog/Search';
import { FilterChips, Filter } from '@/components/backlog/FilterChips';
import { GameCard } from '@/components/dashboard/GameCard';
import { YOUR_GAMES, TRENDING_GAMES } from '@/data/mockGames';

// Combine mock data to create a larger backlog for demonstration
const BACKLOG_GAMES = [...YOUR_GAMES, ...TRENDING_GAMES].map((g, i) => ({
  ...g,
  id: `${g.id}-${i}` // ensure unique IDs
}));

const AVAILABLE_FILTERS: Filter[] = [
  { id: 'status:PLAYING', label: 'PLAYING', type: 'status' },
  { id: 'status:PENDING', label: 'PENDING', type: 'status' },
  { id: 'status:COMPLETED', label: 'COMPLETED', type: 'status' },
  { id: 'platform:PS5', label: 'PS5', type: 'platform' },
  { id: 'platform:PC', label: 'PC', type: 'platform' },
  { id: 'platform:SWITCH', label: 'SWITCH', type: 'platform' },
  { id: 'genre:RPG', label: 'RPG', type: 'genre' },
  { id: 'genre:ACTION', label: 'ACTION', type: 'genre' },
];

export default function BacklogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleToggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const handleResetFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };

  const filteredGames = useMemo(() => {
    return BACKLOG_GAMES.filter((game) => {
      // 1. Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          game.title.toLowerCase().includes(query) ||
          (game.genre && game.genre.toLowerCase().includes(query)) ||
          (game.platform && game.platform.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // 2. Faceted filters
      if (activeFilters.length > 0) {
        // Group active filters by type to allow OR within same type and AND between different types
        // Example: (PS5 OR PC) AND (RPG)
        const filterGroups = activeFilters.reduce((acc, filterId) => {
          const [type, value] = filterId.split(':');
          if (!acc[type]) acc[type] = [];
          acc[type].push(value.toUpperCase());
          return acc;
        }, {} as Record<string, string[]>);

        for (const [type, values] of Object.entries(filterGroups)) {
          if (type === 'status' && !values.includes(game.status.toUpperCase())) return false;
          if (type === 'platform' && (!game.platform || !values.includes(game.platform.toUpperCase()))) return false;
          if (type === 'genre' && (!game.genre || !values.includes(game.genre.toUpperCase()))) return false;
        }
      }

      return true;
    });
  }, [searchQuery, activeFilters]);

  return (
    <div className="flex flex-col w-full px-4 pt-6 md:px-8 pb-12">
      {/* Vault Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white mb-1">
          MI BACKLOG
        </h1>
        <p className="font-mono text-xs text-text-dim tracking-widest uppercase">
          VAULT // v2.4
        </p>
      </header>

      {/* KPI System */}
      <BacklogStats />

      {/* Search Interface (Sticky) */}
      <div className="sticky top-4 z-40 bg-obsidian-black/80 backdrop-blur-md pb-2 -mx-4 px-4 md:-mx-8 md:px-8 shadow-[0_8px_16px_-8px_rgba(0,0,0,0.5)]">
        <Search 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        
        <FilterChips 
          filters={AVAILABLE_FILTERS}
          activeFilters={activeFilters}
          onToggle={handleToggleFilter}
          onReset={handleResetFilters}
          totalCount={BACKLOG_GAMES.length}
        />
      </div>

      {/* Game Library Grid */}
      <div className="mt-6 mb-12">
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        
        {filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-surface-border rounded-2xl bg-surface-glass mt-4">
            <p className="text-text-dim font-mono text-sm uppercase tracking-wider mb-2">No results found</p>
            <p className="text-white/50 text-xs max-w-[200px]">Try adjusting your search or filters to find what you are looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
