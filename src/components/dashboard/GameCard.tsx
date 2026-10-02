'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import Link from 'next/link';

export interface Game {
  id: string;
  title: string;
  image: string;
  rating: number;
  status: string;
  playTime?: string;
  platform?: string;
  genre?: string;
  progress?: number;
  developer?: string;
  year?: number;
  synopsis?: string;
  trophies?: { earned: number; total: number };
  mission?: { title: string; progress: number };
  community?: { user: string; rating: number; review: string };
}

interface GameCardProps {
  game: Game;
}

export const GameCard = ({ game }: GameCardProps) => {
  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'mint';
      case 'PLAYING': return 'neon';
      case 'LIVE': return 'live';
      default: return 'default';
    }
  };

  const statusVariant = getStatusVariant(game.status);
  
  // A helper function to apply variant specific classes to our custom badge
  const badgeClasses = {
    default: 'bg-surface-glass text-white border-surface-border',
    neon: 'bg-neon-red/20 text-neon-red-bright border-neon-red/30',
    mint: 'bg-mint-green/20 text-mint-green border-mint-green/30',
    live: 'bg-neon-red/20 text-neon-red-bright border-neon-red/30',
  };

  return (
    <Link href={`/game/${game.id}`} className="block w-full">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer group bg-obsidian-dark border border-surface-border transition-colors duration-300 md:hover:border-neon-red/50 md:hover:shadow-neon"
      >
      {/* Background Image Container */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-500 md:group-hover:scale-105"
          style={{ backgroundImage: `url(${game.image})` }}
        />
        {/* Persistent Gradient Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-black/40 to-transparent" />
      </div>

      {/* Top Section: Status & Rating */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-mono font-bold tracking-widest uppercase backdrop-blur-md border ${badgeClasses[statusVariant]}`}>
          {game.status}
        </span>
        
        <div className="flex items-center gap-1 bg-obsidian-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-surface-border">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="font-mono text-[10px] font-bold text-white">{game.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Bottom Section: Title & Progress */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">
        <h3 className="font-heading font-bold text-lg md:text-xl text-white leading-tight line-clamp-2">
          {game.title}
        </h3>
        
        {game.progress !== undefined && (
          <div className="flex flex-col gap-1.5 w-full mt-1">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase text-text-dim">
              <span>Progress</span>
              <span>{game.progress}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-neon-red rounded-full" 
                style={{ width: `${game.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
    </Link>
  );
};
