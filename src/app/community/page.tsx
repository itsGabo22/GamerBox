'use client';

import React, { useState } from 'react';
import { Gamepad2, Image as ImageIcon, PenLine } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { MOCK_FEED, CommunityFeedItem } from '@/data/mockCommunity';
import { ReviewCard } from '@/components/community/ReviewCard';
import { PollCard } from '@/components/community/PollCard';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'para-ti', label: 'Para ti' },
  { id: 'amigos', label: 'Amigos' },
  { id: 'tendencias', label: 'Tendencias' },
  { id: 'debates', label: 'Debates' },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('para-ti');

  // Filter feed just to simulate changing tabs
  const getFilteredFeed = (): CommunityFeedItem[] => {
    switch (activeTab) {
      case 'amigos':
        return MOCK_FEED.filter(item => item.user.name === 'AlexGhost');
      case 'tendencias':
        return [...MOCK_FEED].sort((a, b) => b.likes - a.likes);
      case 'debates':
        return MOCK_FEED.filter(item => item.type === 'poll');
      case 'para-ti':
      default:
        return MOCK_FEED;
    }
  };

  const feed = getFilteredFeed();

  return (
    <div className="flex flex-col w-full px-4 pt-6 md:px-8 pb-12">
      {/* Header */}
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white mb-1">
            COMUNIDAD
          </h1>
        </div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-mint-green shadow-[0_0_8px_rgba(94,230,168,0.8)] animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-mint-green tracking-widest uppercase">
            1,428 ONLINE
          </span>
        </div>
      </header>

      {/* Sub-navigation Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6 border-b border-surface-border">
        <div className="flex gap-6">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 font-heading text-sm font-bold tracking-wide uppercase transition-colors whitespace-nowrap ${
                  isActive ? 'text-neon-red-bright' : 'text-text-dim hover:text-white'
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-red shadow-neon"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Post Trigger */}
      <GlassPanel className="p-4 mb-6 flex items-center gap-3 cursor-pointer hover:bg-surface-glass-hover transition-colors">
        <div className="w-8 h-8 rounded-full bg-obsidian-dark flex items-center justify-center border border-surface-border text-white">
          <PenLine size={14} />
        </div>
        <p className="flex-1 font-body text-sm text-text-dim">
          Escribe una reseña o comparte...
        </p>
        <div className="flex gap-2 text-text-dim">
          <ImageIcon size={18} />
          <Gamepad2 size={18} />
        </div>
      </GlassPanel>

      {/* Feed */}
      <div className="flex flex-col">
        <AnimatePresence mode="popLayout">
          {feed.map(post => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {post.type === 'review' && <ReviewCard post={post as any} />}
              {post.type === 'poll' && <PollCard post={post as any} />}
            </motion.div>
          ))}
          {feed.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-text-dim font-mono text-xs uppercase"
            >
              No hay publicaciones recientes.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
