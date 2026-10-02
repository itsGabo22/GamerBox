'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { PollPost } from '@/data/mockCommunity';
import { InteractionBar } from './InteractionBar';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface PollCardProps {
  post: PollPost;
}

export const PollCard = ({ post }: PollCardProps) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  
  // Calculate total votes dynamically based on selection to simulate voting
  const totalVotes = post.options.reduce((acc, opt) => acc + opt.votes, 0) + (selectedOptionId ? 1 : 0);

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

      {/* Question */}
      <h3 className="font-heading font-bold text-lg text-white mb-4">
        {post.question}
      </h3>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-4">
        {post.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const hasVoted = selectedOptionId !== null;
          // Add 1 vote to the selected option for display purposes
          const optionVotes = option.votes + (isSelected ? 1 : 0);
          const percentage = Math.round((optionVotes / totalVotes) * 100) || 0;

          return (
            <button
              key={option.id}
              disabled={hasVoted}
              onClick={() => setSelectedOptionId(option.id)}
              className={cn(
                "relative w-full h-10 rounded-lg overflow-hidden border text-left flex items-center justify-between px-3 transition-all",
                isSelected 
                  ? "border-neon-red shadow-[0_0_10px_rgba(229,9,20,0.2)]" 
                  : hasVoted 
                    ? "border-surface-border opacity-70"
                    : "border-surface-border hover:border-white/20 bg-obsidian-dark/50"
              )}
            >
              {/* Background Progress */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "absolute top-0 bottom-0 left-0 opacity-20 pointer-events-none",
                    isSelected ? "bg-neon-red" : "bg-white"
                  )}
                />
              )}

              {/* Label */}
              <span className="relative z-10 font-body text-sm text-white font-semibold">
                {option.label}
              </span>

              {/* Percentage */}
              {hasVoted && (
                <span className="relative z-10 font-mono text-xs font-bold text-white">
                  {percentage}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="font-mono text-[10px] text-text-dim mb-4">{totalVotes} votos</p>

      {/* Interactions */}
      <InteractionBar likes={post.likes} comments={post.comments} shares={post.shares} />
    </GlassPanel>
  );
};
