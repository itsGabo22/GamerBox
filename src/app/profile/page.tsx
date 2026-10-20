'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GameCard } from '@/components/dashboard/GameCard';
import { useGameStore } from '@/store/useGameStore';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut } from 'lucide-react';

const MOCK_PROFILE = {
  username: 'AlexGhost',
  title: 'THE NIGHT PLAYER',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
  level: 42,
  xp: 8420,
  maxXp: 10000,
  kpis: {
    streak: 24,
    platinums: 18,
    totalTime: '1,284h',
  },
  favorites: ['t2', 'g3'], // Elden Ring, Cyberpunk Redux
  genres: [
    { label: 'RPG', percentage: 42 },
    { label: 'ACTION', percentage: 28 },
    { label: 'SHOOTER', percentage: 18 },
    { label: 'INDIE', percentage: 12 },
  ]
};

export default function ProfilePage() {
  const games = useGameStore(state => state.games);
  const { user, logout } = useAuthStore();

  const favoriteGames = games.filter(g => g.isFavorite);
  const platinums = games.filter(g => g.status === 'COMPLETED').length;

  const totalGames = games.length || 1;
  const genres = ['RPG', 'ACTION', 'SHOOTER', 'INDIE', 'RACING', 'STRATEGY'].map(label => ({
    label,
    percentage: Math.round((games.filter(g => g.genre === label).length / totalGames) * 100)
  })).filter(g => g.percentage > 0).sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="flex flex-col w-full px-4 pt-6 md:px-8 pb-12 overflow-x-hidden">
      {/* Identity Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center mb-8"
      >
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-neon-red blur-[20px] opacity-20" />
          <div 
            className="relative w-24 h-24 rounded-full bg-cover bg-center border-2 border-surface-border shadow-2xl bg-obsidian-black flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: user?.photoURL ? `url(${user.photoURL})` : 'none' }}
            aria-label={`Avatar de ${user?.displayName || MOCK_PROFILE.username}`}
          >
            {!user?.photoURL && (
              <span className="font-heading font-bold text-3xl text-text-dim">
                {(user?.displayName || MOCK_PROFILE.username).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        <h1 className="font-heading font-bold text-2xl text-white mb-1">
          {user?.displayName || MOCK_PROFILE.username}
        </h1>
        <p className="font-mono text-xs font-bold tracking-widest text-text-dim uppercase">
          {user?.email || 'N/A'} • LVL {MOCK_PROFILE.level}
        </p>

        {/* XP Progress */}
        <div className="w-full max-w-[240px] mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[10px] text-text-dim uppercase">Progreso</span>
            <span className="font-mono text-[10px] text-white">
              <span className="text-neon-red-bright">{MOCK_PROFILE.xp.toLocaleString()}</span> / {MOCK_PROFILE.maxXp.toLocaleString()} XP
            </span>
          </div>
          <div className="h-1.5 w-full bg-obsidian-dark rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(MOCK_PROFILE.xp / MOCK_PROFILE.maxXp) * 100}%` }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="h-full bg-neon-red shadow-neon-bright"
            />
          </div>
        </div>
      </motion.section>

      {/* KPI Grid */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        <GlassPanel className="p-4 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[9px] text-text-dim mb-1 tracking-widest uppercase truncate w-full">Days Streak</p>
          <p className="font-heading font-black text-2xl text-white">{MOCK_PROFILE.kpis.streak}</p>
        </GlassPanel>
        <GlassPanel className="p-4 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[9px] text-text-dim mb-1 tracking-widest uppercase truncate w-full">Platinums</p>
          <p className="font-heading font-black text-2xl text-mint-green drop-shadow-[0_0_8px_rgba(94,230,168,0.5)]">{platinums}</p>
        </GlassPanel>
        <GlassPanel className="p-4 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[9px] text-text-dim mb-1 tracking-widest uppercase truncate w-full">Total Time</p>
          <p className="font-heading font-black text-2xl text-white">{MOCK_PROFILE.kpis.totalTime}</p>
        </GlassPanel>
      </motion.section>

      {/* Favoritos Históricos */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
          Favoritos Históricos
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {favoriteGames.map(game => (
            <div key={game.id} className="relative group">
              <div className="absolute -inset-0.5 bg-neon-red/30 rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none" />
              <div className="relative rounded-2xl ring-1 ring-neon-red/50 overflow-hidden">
                <GameCard game={game} />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Genre Distribution */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
          Distribución por Géneros
        </h2>
        <GlassPanel className="p-5 flex flex-col gap-4">
          {genres.map((genre, i) => (
            <div key={genre.label} className="w-full">
              <div className="flex justify-between items-end mb-2">
                <span className="font-heading text-sm font-bold text-white tracking-wide">{genre.label}</span>
                <span className="font-mono text-[10px] font-bold text-text-dim">{genre.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-obsidian-black rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${genre.percentage}%` }}
                  transition={{ duration: 1, delay: 0.4 + (i * 0.1), ease: "easeOut" }}
                  className="h-full bg-mint-green shadow-[0_0_8px_rgba(94,230,168,0.5)]"
                />
              </div>
            </div>
          ))}
        </GlassPanel>
      </motion.section>

      {/* Logout Action */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 mb-8 px-4"
      >
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 h-14 bg-obsidian-dark border border-neon-red/30 rounded-2xl text-neon-red-bright font-mono text-xs font-bold tracking-widest uppercase transition-all hover:bg-neon-red/10 shadow-[0_0_15px_rgba(255,42,85,0.1)] active:scale-95"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </motion.section>
    </div>
  );
}
