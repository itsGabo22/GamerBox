'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface InteractionBarProps {
  likes: number;
  comments: number;
  shares: number;
}

export const InteractionBar = ({ likes, comments, shares }: InteractionBarProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-border">
      <button 
        onClick={handleLike}
        className="flex items-center gap-2 text-text-dim hover:text-white transition-colors"
      >
        <motion.div
          whileTap={{ scale: 0.8 }}
          animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
        >
          <Heart 
            size={18} 
            className={isLiked ? "text-neon-red-bright fill-neon-red-bright" : ""} 
          />
        </motion.div>
        <span className={`font-mono text-xs ${isLiked ? 'text-neon-red-bright font-bold' : ''}`}>
          {likeCount}
        </span>
      </button>

      <button className="flex items-center gap-2 text-text-dim hover:text-white transition-colors">
        <MessageCircle size={18} />
        <span className="font-mono text-xs">{comments}</span>
      </button>

      <button className="flex items-center gap-2 text-text-dim hover:text-white transition-colors">
        <Share2 size={18} />
        <span className="font-mono text-xs">{shares}</span>
      </button>
    </div>
  );
};
