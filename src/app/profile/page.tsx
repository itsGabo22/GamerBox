'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GameCard } from '@/components/dashboard/GameCard';
import { useGameStore } from '@/store/useGameStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/i18n/useTranslation';
import { LogOut, Edit2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const games = useGameStore(state => state.games);
  const { user, logout, updateUserProfile } = useAuthStore();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    title: user?.title || 'CYBER MERCENARY',
    bio: user?.bio || 'Explorador del ecosistema GamerBox.',
    photoURL: user?.photoURL || ''
  });

  const completedGames = games.filter(g => g.status === 'COMPLETED' || g.progress === 100);
  const playingGames = games.filter(g => g.status === 'PLAYING');
  const favoriteGames = games.filter(g => g.isFavorite);

  const totalHours = games.reduce((acc, game) => acc + (game.hoursPlayed || parseInt(game.timePlayed) || 0), 0);
  const xp = completedGames.length * 500 + playingGames.length * 200 + favoriteGames.length * 150 + games.length * 50;
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  const nextLevelXp = level * 1000;
  const xpProgressPercent = Math.min(100, Math.round(((xp % 1000) / 1000) * 100));

  const totalGamesCount = games.length || 1;

  // Dynamically aggregate genres
  const genreCounts: Record<string, number> = {};
  games.forEach(g => {
    if (g.genre) {
      genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
    }
  });

  const genres = Object.entries(genreCounts)
    .map(([label, count]) => ({
      label,
      percentage: Math.round((count / totalGamesCount) * 100)
    }))
    .filter(g => g.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const PRESET_TITLES = ["CYBER MERCENARY", "PLATINUM HUNTER", "LORE MASTER", "SPEEDRUNNER"];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(editForm);
    setIsEditing(false);
  };

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
            className="relative w-24 h-24 rounded-full bg-cover bg-center border-2 border-neon-red shadow-[0_0_20px_rgba(255,42,85,0.4)] bg-obsidian-black flex items-center justify-center overflow-hidden"
            style={{ backgroundImage: user?.photoURL ? `url(${user.photoURL})` : 'none' }}
            aria-label={`Avatar de ${user?.displayName || 'Player'}`}
          >
            {!user?.photoURL && (
              <span className="font-heading font-black text-3xl text-neon-red-bright drop-shadow-md">
                {(user?.displayName?.substring(0,2) || 'P1').toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-heading font-bold text-2xl text-white">
            {user?.displayName || 'Player One'}
          </h1>
          <button onClick={() => setIsEditing(true)} className="text-text-dim hover:text-white transition-colors">
            <Edit2 size={16} />
          </button>
        </div>

        <p className="font-mono text-xs font-bold tracking-widest text-text-dim uppercase mb-2">
          {user?.title || 'CYBER MERCENARY'} • LVL {level}
        </p>

        <p className="font-body text-sm text-white/70 max-w-[280px] leading-relaxed">
          {user?.bio || 'Explorador del ecosistema GamerBox.'}
        </p>

        {/* XP Progress */}
        <div className="w-full max-w-[240px] mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-[10px] text-text-dim uppercase">{t('profile.progress')}</span>
            <span className="font-mono text-[10px] text-white">
              <span className="text-neon-red-bright">{xp.toLocaleString()}</span> / {nextLevelXp.toLocaleString()} XP
            </span>
          </div>
          <div className="h-1.5 w-full bg-obsidian-dark rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpProgressPercent}%` }}
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
          <p className="font-mono text-[9px] text-text-dim mb-1 tracking-widest uppercase truncate w-full">{t('profile.daysStreak')}</p>
          <p className="font-heading font-black text-2xl text-white">
            {Math.max(1, Math.floor(completedGames.length / 2))}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[9px] text-text-dim mb-1 tracking-widest uppercase truncate w-full">{t('profile.platinums')}</p>
          <p className="font-heading font-black text-2xl text-mint-green drop-shadow-[0_0_8px_rgba(94,230,168,0.5)]">{completedGames.length}</p>
        </GlassPanel>
        <GlassPanel className="p-4 flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[9px] text-text-dim mb-1 tracking-widest uppercase truncate w-full">{t('profile.totalTime')}</p>
          <p className="font-heading font-black text-2xl text-white">{totalHours}h</p>
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
          {t('profile.favorites')}
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
          {t('profile.genreDist')}
        </h2>
        <GlassPanel className="p-5 flex flex-col gap-4">
          {genres.length === 0 ? (
            <p className="text-text-dim text-xs font-mono text-center py-4">Juega para generar estadísticas.</p>
          ) : (
            genres.map((genre, i) => (
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
            ))
          )}
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
          {t('profile.logout')}
        </button>
      </motion.section>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-obsidian-dark border border-surface-border p-6 rounded-3xl w-full max-w-sm shadow-glass max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-bold text-xl text-white uppercase">Editar Perfil</h3>
                <button onClick={() => setIsEditing(false)} className="text-text-dim hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Gamertag</label>
                  <input required value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Título</label>
                  <input required value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm mb-2" />
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TITLES.map(title => (
                      <button key={title} type="button" onClick={() => setEditForm({...editForm, title})} className="px-2 py-1 bg-surface-glass border border-surface-border rounded text-[10px] font-mono text-text-dim hover:text-white hover:border-neon-red transition-colors">
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Biografía</label>
                  <textarea rows={3} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full p-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-body text-sm resize-none" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Avatar URL</label>
                  <input placeholder="https://..." value={editForm.photoURL} onChange={e => setEditForm({...editForm, photoURL: e.target.value})} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                </div>
                <Button type="submit" variant="neon" className="w-full mt-4">Guardar Cambios</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
