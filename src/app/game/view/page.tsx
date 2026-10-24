'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameStore, Game } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, Heart, Sparkles, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { getGameTacticalBreakdown } from '@/services/aiService';
import { SafeGameImage } from '@/components/ui/SafeGameImage';
import { useTranslation } from '@/i18n/useTranslation';

export default function GameViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const { t } = useTranslation();

  const { selectedGame, games, addGame, updateGameStatus, toggleFavorite, logPlaySession } = useGameStore();

  const [aiBreakdown, setAiBreakdown] = useState<{ synopsis: string; matchReason: string; tips: string[]; timeToBeat: string; difficulty: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState(1);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // If we arrived here without a selected game, try to find it in the user's library
  const localGame = games.find(g => g.id === id);
  const gameToDisplay: Game | null = localGame || selectedGame;

  // Sync state if game is added to library while viewing
  const isInLibrary = !!localGame;

  useEffect(() => {
     if (gameToDisplay && !aiBreakdown && !isAiLoading) {
         handleAiBreakdown();
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameToDisplay]);

  // Make sure we save it to session storage to persist across reloads
  useEffect(() => {
    if (gameToDisplay && typeof window !== 'undefined') {
      sessionStorage.setItem('gamerbox_active_game', JSON.stringify(gameToDisplay));
    }
  }, [gameToDisplay]);

  // Fallback to read from session storage if state lost
  let finalGame = gameToDisplay;
  if (!finalGame && typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('gamerbox_active_game');
    if (saved) {
      finalGame = JSON.parse(saved);
    }
  }

  if (!finalGame) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <p className="font-mono text-xs uppercase tracking-widest text-text-dim">Juego no encontrado</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft size={16} className="mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const handleAiBreakdown = async () => {
    setIsAiLoading(true);
    try {
      const breakdown = await getGameTacticalBreakdown(finalGame!.title);
      setAiBreakdown(breakdown);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddHours = () => {
    if (isInLibrary) {
      logPlaySession(finalGame!.id, hoursToAdd);
      setHoursToAdd(1);
    }
  };

  const handleChangeStatus = (status: string) => {
    if (isInLibrary) {
      updateGameStatus(finalGame!.id, status);
      setShowStatusDropdown(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-obsidian-black pb-24 relative overflow-x-hidden">
      {/* Hero Header */}
      <div className="relative w-full h-[55vh] min-h-[400px]">
        <SafeGameImage
          src={finalGame.coverUrl}
          alt={finalGame.title}
          genre={finalGame.genre}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-black/80 to-transparent" />

        {/* Top Nav */}
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-20">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-obsidian-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white"
          >
            <ArrowLeft size={20} />
          </button>

          {isInLibrary && (
            <button
              onClick={() => toggleFavorite(finalGame!.id)}
              className="w-10 h-10 rounded-full bg-obsidian-black/50 backdrop-blur-md flex items-center justify-center border border-white/10"
            >
              <Heart size={20} className={finalGame!.isFavorite ? "fill-neon-red text-neon-red" : "text-white"} />
            </button>
          )}
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 z-20">
          {isInLibrary && (
            <div className="relative inline-block mb-4">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-glass border border-surface-border text-white font-mono text-[10px] font-bold uppercase tracking-widest shadow-glass hover:bg-surface-glass-hover transition-colors"
              >
                {finalGame.status}
                <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-32 bg-obsidian-dark border border-surface-border rounded-xl shadow-glass overflow-hidden z-50 flex flex-col"
                  >
                    {[
                      { key: 'PENDING', label: t('common.pending') },
                      { key: 'PLAYING', label: t('common.playing') },
                      { key: 'COMPLETED', label: t('common.completed') },
                    ].map(s => (
                      <button
                        key={s.key}
                        onClick={() => handleChangeStatus(s.key)}
                        className="px-3 py-2 text-left font-mono text-[10px] text-text-dim hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest flex items-center justify-between"
                      >
                        {s.label}
                        {finalGame!.status === s.key && <Check size={12} className="text-neon-red" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <h1 className="font-heading font-black text-4xl text-white mb-2 leading-tight drop-shadow-md">
            {finalGame.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              {finalGame.platform}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-text-dim font-mono text-[10px] uppercase tracking-wider">
              {finalGame.genre}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="px-6 -mt-4 relative z-20 flex flex-col gap-6">

        {!isInLibrary ? (
          <GlassPanel className="p-5 flex flex-col items-center text-center gap-4 border-neon-red/30 shadow-[0_0_20px_rgba(255,42,85,0.1)]">
            <p className="font-body text-sm text-white/80">Este juego no está en tu biblioteca de GamerBox.</p>
            <Button
              variant="neon"
              className="w-full"
              onClick={() => {
                addGame(finalGame!);
                router.replace('/backlog'); // Navigate to backlog after adding
              }}
            >
              + Añadir a mi Backlog
            </Button>
          </GlassPanel>
        ) : (
          <GlassPanel className="p-5 flex flex-col gap-4 border-mint-green/30 shadow-[0_0_20px_rgba(94,230,168,0.05)]">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-mint-green" />
                <div>
                  <p className="font-mono text-[10px] text-text-dim uppercase tracking-widest">Tiempo Jugado</p>
                  <p className="font-heading font-bold text-xl text-white">{finalGame.hoursPlayed || 0} hrs</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={hoursToAdd}
                  onChange={(e) => setHoursToAdd(parseInt(e.target.value) || 1)}
                  className="w-12 h-8 bg-obsidian-black border border-surface-border rounded-lg text-center text-white font-mono text-xs focus:outline-none focus:border-mint-green"
                />
                <button
                  onClick={handleAddHours}
                  className="h-8 px-3 bg-mint-green/20 text-mint-green hover:bg-mint-green hover:text-obsidian-black rounded-lg font-mono text-xs font-bold transition-colors"
                >
                  + LOG
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Trophy size={20} className="text-text-dim" />
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <p className="font-mono text-[10px] text-text-dim uppercase tracking-widest">Progreso / Trofeos</p>
                  <p className="font-mono text-xs font-bold text-white">{finalGame.progress || 0}%</p>
                </div>
                <div className="h-1.5 w-full bg-obsidian-black rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${finalGame.progress || 0}%` }}
                    className="h-full bg-neon-red"
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* AI Tactical Breakdown */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim flex items-center gap-2">
              <Sparkles size={14} className="text-mint-green" />
              GAMERBOX AI
            </h2>
          </div>

          {!aiBreakdown && !isAiLoading ? (
            <button
              onClick={handleAiBreakdown}
              className="w-full py-6 flex flex-col items-center justify-center gap-3 bg-surface-glass border border-surface-border border-dashed rounded-2xl hover:border-mint-green/50 hover:bg-mint-green/5 transition-all group"
            >
              <Sparkles size={24} className="text-text-dim group-hover:text-mint-green transition-colors" />
              <span className="font-mono text-xs uppercase tracking-widest text-text-dim group-hover:text-white transition-colors">
                Generar Análisis Táctico
              </span>
            </button>
          ) : isAiLoading ? (
            <div className="w-full h-32 bg-surface-glass border border-surface-border rounded-2xl flex flex-col items-center justify-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-8 h-8 rounded-full border-2 border-mint-green border-t-transparent animate-spin"
              />
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
                Analizando metadatos...
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-3 bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl"
            >
              <div className="border-l-2 border-l-mint-green pl-3">
                <p className="font-mono text-[10px] text-mint-green uppercase font-bold tracking-widest mb-2">Sinopsis</p>
                <p className="font-body text-sm text-white/90 leading-relaxed text-pretty line-clamp-3">
                  {aiBreakdown?.synopsis}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-obsidian-dark border border-surface-border rounded-xl p-3">
                  <p className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-widest mb-1">Tiempo Estimado</p>
                  <p className="font-heading text-sm font-bold text-white line-clamp-1">{aiBreakdown?.timeToBeat}</p>
                </div>
                <div className="bg-obsidian-dark border border-surface-border rounded-xl p-3">
                  <p className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-widest mb-1">Dificultad</p>
                  <p className="font-heading text-sm font-bold text-white line-clamp-1">{aiBreakdown?.difficulty}</p>
                </div>
              </div>

              <button
                onClick={() => setShowDossierModal(true)}
                className="mt-2 group relative overflow-hidden rounded-xl bg-neon-red/10 border border-neon-red/30 p-4 text-left hover:bg-neon-red/20 transition-colors"
              >
                <p className="font-mono text-[10px] text-neon-red-bright uppercase font-bold tracking-widest mb-1 flex items-center justify-between">
                  PRO TIPS TÁCTICOS
                  <ChevronRight size={14} className="text-neon-red-bright transform group-hover:translate-x-1 transition-transform" />
                </p>
                <p className="font-body text-xs text-white/90 line-clamp-1 italic">
                  {aiBreakdown?.tips[0]}
                </p>
                <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                   <Sparkles size={16} className="text-neon-red-bright" />
                </div>
              </button>
            </motion.div>
          )}
        </section>

      </div>

      {/* Dossier Táctico Modal */}
      <AnimatePresence>
        {showDossierModal && aiBreakdown && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDossierModal(false)} />
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-zinc-950/90 backdrop-blur-2xl border border-neon-red/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,42,85,0.15)] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-950/90 py-2 z-10 border-b border-surface-border">
                <div>
                  <h3 className="font-heading font-black text-xl text-white uppercase leading-tight">{finalGame.title}</h3>
                  <p className="font-mono text-[10px] text-neon-red-bright tracking-widest uppercase flex items-center gap-1 mt-1">
                    <Sparkles size={10} /> DOSSIER TÁCTICO GAMERBOX AI
                  </p>
                </div>
                <button onClick={() => setShowDossierModal(false)} className="w-8 h-8 rounded-full bg-surface-glass flex items-center justify-center text-text-dim hover:text-white transition-colors">
                  <ArrowLeft size={16} />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-widest mb-2 border-b border-surface-border pb-1">Análisis General</h4>
                  <p className="font-body text-sm text-white/90 leading-relaxed text-pretty mb-3">
                    {aiBreakdown.synopsis}
                  </p>
                  <p className="font-body text-sm text-mint-green/90 italic leading-relaxed text-pretty border-l-2 border-mint-green pl-3">
                    &quot;{aiBreakdown.matchReason}&quot;
                  </p>
                </div>

                <div>
                  <h4 className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-widest mb-3 border-b border-surface-border pb-1">Estrategia Avanzada</h4>
                  <div className="flex flex-col gap-3">
                    {aiBreakdown.tips.map((tip, idx) => (
                      <div key={idx} className="flex gap-3 bg-obsidian-black border border-surface-border rounded-xl p-4">
                        <span className="font-heading font-black text-2xl text-neon-red/30 leading-none">0{idx + 1}</span>
                        <p className="font-body text-sm text-white/90 leading-relaxed pt-1">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-surface-glass border border-surface-border rounded-xl p-4 text-center">
                    <p className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-widest mb-1">Duración</p>
                    <p className="font-heading text-base font-bold text-white">{aiBreakdown.timeToBeat}</p>
                  </div>
                  <div className="bg-surface-glass border border-surface-border rounded-xl p-4 text-center">
                    <p className="font-mono text-[10px] text-text-dim uppercase font-bold tracking-widest mb-1">Dificultad</p>
                    <p className="font-heading text-base font-bold text-white">{aiBreakdown.difficulty}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
