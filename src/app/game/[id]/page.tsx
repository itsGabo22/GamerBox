'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { ALL_GAMES } from '@/data/mockGames';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share, Bookmark, Star, Clock, Trophy, Target } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const gameId = params.id;
  // Handle if the ID is formatted with the index in the backlog (e.g. g2-1)
  const baseId = gameId.split('-')[0];
  const game = ALL_GAMES.find(g => g.id === baseId || g.id === gameId);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'success'>('idle');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (connectionState === 'connecting') {
      timer = setTimeout(() => {
        setConnectionState('success');
      }, 2000);
    } else if (connectionState === 'success') {
      timer = setTimeout(() => {
        setConnectionState('idle');
      }, 1500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [connectionState]);

  if (!game) {
    notFound();
  }

  const handlePlayNow = () => {
    setConnectionState('connecting');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-obsidian-black pb-28 overflow-x-hidden">
      {/* Background Layer z-0 */}
      <div className="fixed inset-0 w-full h-[60vh] md:h-[70vh] z-0 pointer-events-none">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${game.image})` }}
        />
      </div>

      {/* Gradient Overlays z-10 */}
      <div className="fixed inset-0 z-10 pointer-events-none bg-gradient-to-b from-obsidian-black/60 via-obsidian-black/10 to-obsidian-black h-[60vh] md:h-[70vh]" />
      <div className="fixed top-[60vh] md:top-[70vh] bottom-0 left-0 right-0 z-10 bg-obsidian-black pointer-events-none" />

      {/* Top Bar z-30 */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-4 pt-safe-top">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-obsidian-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button 
            className="w-10 h-10 rounded-full bg-obsidian-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
            aria-label="Share"
          >
            <Share size={18} />
          </button>
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="w-10 h-10 rounded-full bg-obsidian-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 transition-colors"
            aria-label="Bookmark"
          >
            <Bookmark 
              size={18} 
              className={isBookmarked ? "text-neon-red-bright fill-neon-red-bright" : "text-white"} 
            />
          </button>
        </div>
      </div>

      {/* Scrollable Content z-20 */}
      <div className="relative z-20 flex-1 px-4 mt-[30vh]">
        {/* Game Header */}
        <div className="mb-8">
          <div className="flex gap-2 mb-3">
            <span className="px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white border border-white/20 font-mono text-[10px] font-bold tracking-widest uppercase">
              {game.platform || 'UNKNOWN'}
            </span>
            <span className="px-2 py-1 rounded bg-white/10 backdrop-blur-md text-white border border-white/20 font-mono text-[10px] font-bold tracking-widest uppercase">
              {game.genre || 'GAME'}
            </span>
            {game.status === 'COMPLETED' && (
              <span className="px-2 py-1 rounded bg-mint-green/20 backdrop-blur-md text-mint-green border border-mint-green/30 font-mono text-[10px] font-bold tracking-widest uppercase">
                COMPLETED
              </span>
            )}
            {game.status === 'PLAYING' && (
              <span className="px-2 py-1 rounded bg-neon-red/20 backdrop-blur-md text-neon-red-bright border border-neon-red/30 font-mono text-[10px] font-bold tracking-widest uppercase">
                PLAYING
              </span>
            )}
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl leading-tight text-white drop-shadow-lg mb-2 text-balance">
            {game.title}
          </h1>
          <p className="text-white/70 font-mono text-sm uppercase tracking-wider drop-shadow-md">
            {game.developer || 'Unknown Developer'} • {game.year || new Date().getFullYear()}
          </p>
        </div>

        {/* Synopsis */}
        <GlassPanel className="p-5 mb-6">
          <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-2">Synopsis</h2>
          <p className="font-body text-sm leading-relaxed text-white/90">
            {game.synopsis || `Experience the ultimate journey in ${game.title}. Dive into an incredible world filled with challenges and mysteries waiting to be uncovered.`}
          </p>
        </GlassPanel>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-text-dim" />
              <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim">Time Played</h2>
            </div>
            <p className="font-heading font-bold text-2xl text-white">
              {game.playTime || '0 hrs'}
            </p>
          </GlassPanel>
          <GlassPanel className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-text-dim" />
              <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim">Trophies</h2>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <p className="font-heading font-bold text-2xl text-white">
                {game.trophies?.earned || 0}
              </p>
              <p className="font-heading font-bold text-sm text-text-dim pb-1">
                / {game.trophies?.total || 0}
              </p>
            </div>
            {game.trophies && (
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-mint-green rounded-full" 
                  style={{ width: `${(game.trophies.earned / game.trophies.total) * 100}%` }}
                />
              </div>
            )}
          </GlassPanel>
        </div>

        {/* Current Mission */}
        {game.mission && (
          <GlassPanel className="p-5 mb-6 border-l-2 border-l-neon-red border-t-surface-border border-r-surface-border border-b-surface-border">
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-neon-red" />
              <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-neon-red">Current Mission</h2>
            </div>
            <p className="font-body text-base font-semibold text-white mb-3">
              {game.mission.title}
            </p>
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between items-center text-[10px] font-mono text-text-dim uppercase">
                <span>Progress</span>
                <span>{game.mission.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-neon-red rounded-full" 
                  style={{ width: `${game.mission.progress}%` }}
                />
              </div>
            </div>
          </GlassPanel>
        )}

        {/* Community Log */}
        {game.community && (
          <GlassPanel className="p-5 mb-6">
            <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4">Community Log</h2>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-obsidian-dark flex-shrink-0 flex items-center justify-center border border-white/10 font-heading font-bold text-sm">
                {game.community.user.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-heading font-bold text-sm text-white">{game.community.user}</p>
                  <div className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-mono text-[10px] font-bold text-white">{game.community.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="font-body text-sm text-white/70 italic">"{game.community.review}"</p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Sticky PLAY NOW Action z-40 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe pt-4 px-4 bg-gradient-to-t from-obsidian-black via-obsidian-black/90 to-transparent">
        <div className="max-w-md mx-auto pb-6">
          <Button 
            variant="neon" 
            size="lg" 
            className="w-full font-heading font-bold text-lg tracking-wide uppercase shadow-neon"
            onClick={handlePlayNow}
          >
            PLAY NOW - PS5 REMOTE
          </Button>
        </div>
      </div>

      {/* Remote Connection Modal z-50 & z-60 */}
      <AnimatePresence>
        {connectionState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-black/90 backdrop-blur-xl px-6"
          >
            <div className="w-full max-w-sm flex flex-col items-center justify-center relative z-60">
              <AnimatePresence mode="wait">
                {connectionState === 'connecting' && (
                  <motion.div 
                    key="connecting"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center gap-8"
                  >
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-r-2 border-neon-red"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-b-2 border-l-2 border-neon-red-bright opacity-50"
                      />
                      <div className="w-12 h-12 bg-neon-red/20 rounded-full flex items-center justify-center animate-pulse shadow-neon">
                        <div className="w-4 h-4 bg-neon-red rounded-full shadow-neon-bright" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-xl text-white mb-2 tracking-wide uppercase">
                        Establishing Secure Link
                      </h3>
                      <p className="font-mono text-xs text-neon-red-bright tracking-widest uppercase animate-pulse">
                        Connecting to PS5...
                      </p>
                    </div>
                  </motion.div>
                )}

                {connectionState === 'success' && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center gap-6"
                  >
                    <div className="w-20 h-20 bg-mint-green/20 rounded-full flex items-center justify-center border border-mint-green shadow-[0_0_30px_rgba(94,230,168,0.3)]">
                      <svg className="w-10 h-10 text-mint-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={3} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-2xl text-mint-green mb-1 tracking-wide uppercase">
                        Connection Established
                      </h3>
                      <p className="font-mono text-xs text-text-dim tracking-widest uppercase">
                        Launching {game.title}...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
