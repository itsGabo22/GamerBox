'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface Game {
  id: string;
  title: string;
  image: string;
  rating: number;
  status: string;
  playTime?: string;
}

interface GameCardProps {
  game: Game;
}

export const GameCard = ({ game }: GameCardProps) => {
  return (
    <motion.div
      whileHover="hover"
      initial="initial"
      className="relative w-64 md:w-72 h-[380px] rounded-2xl overflow-hidden cursor-pointer group bg-obsidian-dark border border-surface-border transition-colors duration-300 hover:border-neon-red/50 hover:shadow-neon"
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          variants={{
            initial: { scale: 1 },
            hover: { scale: 1.08 }
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${game.image})` }}
        />
        {/* Persistent Gradient Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-black/60 to-transparent" />
      </div>

      {/* Persistent Top Badge */}
      <div className="absolute top-4 left-4">
        {game.status === 'live' ? (
          <Badge variant="live">LIVE</Badge>
        ) : (
          <Badge>{game.status}</Badge>
        )}
      </div>

      {/* Persistent Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-1">
        <h3 className="font-heading font-bold text-xl text-white truncate">{game.title}</h3>
        <p className="font-mono text-xs text-text-dim uppercase tracking-wider">
          {game.playTime ? `${game.playTime} Played` : 'New'}
        </p>
      </div>

      {/* Hover Overlay Content */}
      <motion.div
        variants={{
          initial: { opacity: 0, y: 20 },
          hover: { opacity: 1, y: 0 }
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm flex flex-col justify-between p-6 pointer-events-none group-hover:pointer-events-auto"
      >
        <div className="flex justify-between items-start">
          <Badge variant="neon">SCORE {game.rating.toFixed(1)}</Badge>
        </div>

        <div className="flex flex-col gap-4 mt-auto">
          <h3 className="font-heading font-bold text-2xl text-white line-clamp-2 leading-tight">
            {game.title}
          </h3>
          <Button variant="neon" className="w-full gap-2">
            <Play fill="currentColor" size={18} />
            PLAY NOW
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
