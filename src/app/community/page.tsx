'use client';

import React, { useState } from 'react';
import { Gamepad2, PenLine, Search, UserPlus, Zap, X } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useCommunityStore, CommunityPost } from '@/store/useCommunityStore';
import { Star, MessageCircle, Heart, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'para-ti', label: '💬 FORO GLOBAL' },
  { id: 'amigos', label: '👥 MIS AMIGOS' }
];

export default function CommunityPage() {
  const { posts, friends, fetchPosts, addPost, toggleLike, addComment, addFriend, removeFriend } = useCommunityStore();
  const [activeTab, setActiveTab] = useState('para-ti');
  const [searchFriend, setSearchFriend] = useState('');

  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ gameTitle: '', rating: 5, content: '' });

  // Comment Thread Expansion State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState('');

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    addPost(newPost);
    setShowCreateModal(false);
    setNewPost({ gameTitle: '', rating: 5, content: '' });
  };

  const handleSendComment = (postId: string) => {
    if (newCommentText.trim() === '') return;
    addComment(postId, newCommentText);
    setNewCommentText('');
  };

  // Filter feed based on tab
  const getFilteredFeed = (): CommunityPost[] => {
    switch (activeTab) {
      case 'amigos':
        // Just mock 'amigos' filter for now, return 1 post or similar
        return posts.slice(0, 1);
      case 'tendencias':
        return [...posts].sort((a, b) => b.likes - a.likes);
      case 'para-ti':
      default:
        return posts;
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
                {tab.id === 'amigos' ? `${tab.label} (${friends.filter(f => f.isFriend).length})` : tab.label}
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

      <AnimatePresence mode="wait">
        {activeTab === 'para-ti' ? (
          <motion.div
            key="para-ti"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col gap-6"
          >
            {/* Post Trigger */}
            <GlassPanel
              onClick={() => setShowCreateModal(true)}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-glass-hover transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-obsidian-dark flex items-center justify-center border border-surface-border text-white">
                <PenLine size={14} />
              </div>
              <p className="flex-1 font-body text-sm text-text-dim">
                + Publicar Reseña / Post...
              </p>
              <div className="flex gap-2 text-text-dim">
                <Gamepad2 size={18} />
              </div>
            </GlassPanel>

            {/* Real Feed */}
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {feed.map(post => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassPanel className="p-5 flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 items-center">
                          <div
                            className="w-10 h-10 rounded-full bg-obsidian-dark flex-shrink-0 flex items-center justify-center border border-surface-border bg-cover bg-center"
                            style={{ backgroundImage: post.authorAvatar ? `url(${post.authorAvatar})` : 'none' }}
                          >
                            {!post.authorAvatar && (
                              <span className="font-heading font-bold text-sm text-text-dim">
                                {post.authorName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <p className="font-heading font-bold text-sm text-white">{post.authorName}</p>
                            <p className="font-mono text-[9px] text-text-dim tracking-widest uppercase">{post.authorTitle} • {new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Rating & Game Tag */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-white/5 border border-surface-border font-mono text-[10px] font-bold text-white uppercase tracking-widest">
                          {post.gameTitle}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < post.rating ? "text-neon-red fill-neon-red" : "text-surface-border"} />
                          ))}
                        </div>
                      </div>

                      {/* Content */}
                      <p className="font-body text-sm leading-relaxed text-white/90 text-balance">
                        {post.content}
                      </p>

                      {/* Actions & Divider */}
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-surface-border to-transparent mt-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-6">
                          <button
                            onClick={() => toggleLike(post.id)}
                            className={`flex items-center gap-2 transition-colors ${post.likedByMe ? 'text-neon-red-bright' : 'text-text-dim hover:text-white'}`}
                          >
                            <Heart size={16} className={post.likedByMe ? "fill-neon-red-bright" : ""} />
                            <span className="font-mono text-xs font-bold">{post.likes}</span>
                          </button>
                          <button
                            onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="flex items-center gap-2 text-text-dim hover:text-white transition-colors"
                          >
                            <MessageCircle size={16} />
                            <span className="font-mono text-xs font-bold">{post.comments.length}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <AnimatePresence>
                        {expandedComments[post.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-col gap-3 mt-2 overflow-hidden"
                          >
                            <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-2">
                              {post.comments.map(c => (
                                <div key={c.id} className="bg-obsidian-black/50 rounded-xl p-3 border border-surface-border/50">
                                  <p className="font-heading font-bold text-xs text-mint-green mb-1">{c.authorName}</p>
                                  <p className="font-body text-xs text-white/80 leading-relaxed">{c.text}</p>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 relative">
                              <input
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="w-full h-10 pl-3 pr-10 bg-obsidian-black border border-surface-border rounded-lg text-white font-body text-xs focus:border-neon-red focus:outline-none"
                              />
                              <button
                                onClick={() => handleSendComment(post.id)}
                                className="absolute right-2 top-2.5 text-text-dim hover:text-neon-red transition-colors"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassPanel>
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
          </motion.div>
        ) : (
          <motion.div
            key="amigos"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6"
          >
            {/* Friends Search */}
            <div className="relative w-full z-30">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-dim">
                <Search size={20} />
              </div>
              <input
                type="search"
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                placeholder="Buscar jugador por Gamertag (@...)"
                className="w-full h-14 pl-12 pr-4 bg-surface-glass backdrop-blur-xl border border-surface-border rounded-2xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all shadow-glass font-mono text-sm"
              />
            </div>

            {/* My Squad */}
            <section>
              <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
                TU ESCUADRÓN ({friends.filter(f => f.isFriend).length})
              </h2>
              <div className="flex flex-col gap-3">
                {friends.filter(f => f.isFriend).length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-surface-border rounded-2xl bg-surface-glass">
                    <p className="text-text-dim font-mono text-xs uppercase tracking-wider">Aún no tienes amigos añadidos</p>
                  </div>
                ) : (
                  friends.filter(f => f.isFriend).map(friend => (
                    <GlassPanel key={friend.uid} className="p-4 flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full bg-obsidian-dark flex-shrink-0 flex items-center justify-center border border-surface-border bg-cover bg-center"
                            style={{ backgroundImage: friend.photoURL ? `url(${friend.photoURL})` : 'none' }}
                          >
                            {!friend.photoURL && (
                              <span className="font-heading font-bold text-lg text-text-dim">
                                {friend.gamertag.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-obsidian-black ${friend.status === 'ONLINE' ? 'bg-mint-green' : friend.status === 'IN_GAME' ? 'bg-neon-red' : 'bg-surface-border'}`} />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-heading font-bold text-base text-white">{friend.gamertag}</p>
                          {friend.status === 'IN_GAME' && friend.currentGame ? (
                            <p className="font-mono text-[9px] text-neon-red tracking-widest uppercase flex items-center gap-1">
                              <Gamepad2 size={10} /> Jugando {friend.currentGame}
                            </p>
                          ) : (
                            <p className="font-mono text-[9px] text-text-dim tracking-widest uppercase">{friend.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 border-surface-border" onClick={() => removeFriend(friend.uid)}>
                          <X size={14} />
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8 px-3 border-mint-green/30 text-mint-green hover:bg-mint-green/10 flex gap-2">
                          <Zap size={14} /> Invitar
                        </Button>
                      </div>
                    </GlassPanel>
                  ))
                )}
              </div>
            </section>

            {/* Suggested / Search Results */}
            <section>
              <h2 className="font-mono text-[10px] font-bold tracking-widest uppercase text-text-dim mb-4 px-2">
                COMUNIDAD / SUGERENCIAS
              </h2>
              <div className="flex flex-col gap-3">
                {friends.filter(f => !f.isFriend && (searchFriend === '' || f.gamertag.toLowerCase().includes(searchFriend.toLowerCase()))).map(friend => (
                  <GlassPanel key={friend.uid} className="p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex gap-3 items-center">
                      <div
                        className="w-10 h-10 rounded-full bg-obsidian-dark flex-shrink-0 flex items-center justify-center border border-surface-border bg-cover bg-center"
                        style={{ backgroundImage: friend.photoURL ? `url(${friend.photoURL})` : 'none' }}
                      >
                        {!friend.photoURL && (
                          <span className="font-heading font-bold text-sm text-text-dim">
                            {friend.gamertag.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="font-heading font-bold text-sm text-white">{friend.gamertag}</p>
                        <p className="font-mono text-[9px] text-text-dim tracking-widest uppercase">{friend.title}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-3 border-neon-red/30 text-neon-red-bright hover:bg-neon-red/10 flex gap-2" onClick={() => addFriend(friend.uid)}>
                      <UserPlus size={14} /> Agregar
                    </Button>
                  </GlassPanel>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-obsidian-dark border border-surface-border p-6 rounded-3xl w-full max-w-sm shadow-glass">
              <h3 className="font-heading font-bold text-xl text-white mb-4 uppercase">Nueva Reseña</h3>
              <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Juego</label>
                  <input required placeholder="Ej. Neon White" value={newPost.gameTitle} onChange={e => setNewPost({...newPost, gameTitle: e.target.value})} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Calificación</label>
                  <input required type="number" min="1" max="5" value={newPost.rating} onChange={e => setNewPost({...newPost, rating: parseInt(e.target.value) || 5})} className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Tu Opinión</label>
                  <textarea required rows={4} value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full p-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-body text-sm resize-none" />
                </div>
                <Button type="submit" variant="neon" className="w-full mt-2">Publicar</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
