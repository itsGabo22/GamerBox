'use client';

import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { ReviewPost } from '@/data/mockCommunity';
import { ALL_GAMES } from '@/data/mockGames';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { InteractionBar } from './InteractionBar';

interface ReviewCardProps {
  post: ReviewPost;
}

export const ReviewCard = ({ post }: ReviewCardProps) => {
  const game = ALL_GAMES.find(g => g.id === post.gameId);

  return (
    <GlassPanel className="p-4 md:p-5 mb-4">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10"
          style={{ backgroundImage: `url(${post.user.avatar})` }}
        />
        <div>
          <p className="font-heading font-bold text-sm text-white">{post.user.name}</p>
          <p className="font-mono text-[10px] text-text-dim">{post.timestamp}</p>
        </div>
      </div>

      {/* Game Reference */}
      {game && (
        <Link href={`/game/${game.id}`} className="block mb-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-obsidian-dark/50 border border-surface-border hover:border-white/20 transition-colors">
            <div 
              className="w-12 h-16 rounded-lg bg-cover bg-center shrink-0"
              style={{ backgroundImage: `url(${game.image})` }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-heading font-bold text-sm text-white truncate">{game.title}</h4>
              <p className="font-mono text-[10px] text-text-dim uppercase">{game.platform || 'GAME'}</p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 shrink-0">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="font-mono text-[10px] font-bold text-white">{post.rating.toFixed(1)} / 5.0</span>
            </div>
          </div>
        </Link>
      )}

      {/* Review Text */}
      <p className="font-body text-sm leading-relaxed text-white/90 mb-4 text-balance">
        {post.content}
      </p>

      {/* Attached Image */}
      {post.image && (
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-surface-border mb-4">
          <img 
            src={post.image} 
            alt="Review attachment" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Interactions */}
      <InteractionBar likes={post.likes} comments={post.comments} shares={post.shares} />
    </GlassPanel>
  );
};
