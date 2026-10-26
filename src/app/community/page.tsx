'use client';

import React, { useState } from 'react';
import { Gamepad2, PenLine, Search, UserPlus, Zap, X, Trophy, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useCommunityStore, CommunityPost, FriendProfile } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Star, MessageCircle, Heart, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'para-ti', label: '💬 FORO GLOBAL' },
  { id: 'amigos', label: '👥 MIS AMIGOS' }
];

export default function CommunityPage() {
  const { posts, friends, fetchPosts, addPost, toggleLike, addComment, addFriend, removeFriend } = useCommunityStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('para-ti');
  const [searchFriend, setSearchFriend] = useState('');
  const [inspectProfile, setInspectProfile] = useState<FriendProfile | null>(null);

  // Add the explicit friend action
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddFriendByTag = (tag: string) => {
    // Check if friend already exists in mock data or local vault
    const existingFriend = friends.find(f => f.gamertag.toLowerCase() === tag.toLowerCase());

    if (existingFriend) {
      addFriend(existingFriend.uid);
    } else {
      // Create dynamically but strictly ignore self
      if (user?.displayName?.toLowerCase() === tag.toLowerCase()) {
         return; // prevent self adding
      }

      const newFriendUid = `dyn-${Date.now()}`;
      useCommunityStore.setState((state) => ({
        friends: [
          ...state.friends,
          {
            uid: newFriendUid,
            gamertag: tag,
            title: 'NUEVO RECLUTA',
            photoURL: null,
            status: 'ONLINE',
            isFriend: true
          }
        ]
      }));
    }
    setSearchFriend('');
  };

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

            {searchFriend.trim().length > 0 && (() => {
               let foundUser: FriendProfile | null = null;

               // First check friends
               foundUser = friends.find(f => f.gamertag.toLowerCase() === searchFriend.trim().toLowerCase()) || null;

               // If not in friends, check local vault
               if (!foundUser && typeof window !== 'undefined') {
                 const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
                 if (vaultStr) {
                    const vault = JSON.parse(vaultStr);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const matchingAcc = Object.values(vault).find((acc: any) => acc.displayName?.toLowerCase() === searchFriend.trim().toLowerCase());
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (matchingAcc && (matchingAcc as any).uid !== user?.uid) { // Don't allow adding self
                       foundUser = {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          uid: (matchingAcc as any).uid,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          gamertag: (matchingAcc as any).displayName,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          title: (matchingAcc as any).title || 'GAMERBOX USER',
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          photoURL: (matchingAcc as any).photoURL || null,
                          status: 'ONLINE',
                          isFriend: false,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          level: (matchingAcc as any).level,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          platinums: (matchingAcc as any).platinums,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          totalHours: (matchingAcc as any).totalHours
                       };
                    }
                 }
               }

               if (foundUser) {
                 return (
                    <div className="mt-4 p-4 rounded-xl border border-neon-red/40 bg-zinc-900/90 flex items-center justify-between shadow-glass">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full border border-neon-red flex items-center justify-center font-bold uppercase bg-cover bg-center"
                          style={{ backgroundImage: foundUser.photoURL ? `url(${foundUser.photoURL})` : 'none', backgroundColor: foundUser.photoURL ? 'transparent' : 'rgba(255,42,85,0.2)' }}
                        >
                          {!foundUser.photoURL && <span className="text-neon-red">{foundUser.gamertag.slice(0, 2)}</span>}
                        </div>
                        <div className="flex flex-col text-left">
                          <p className="font-bold text-white leading-tight">@{foundUser.gamertag}</p>
                          <p className="text-[9px] text-mint-green font-mono uppercase tracking-widest mt-0.5">JUGADOR ENCONTRADO // ONLINE</p>
                        </div>
                      </div>
                      {foundUser.isFriend ? (
                        <span className="px-3 py-1 rounded bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                          EN TU ESCUADRÓN
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (foundUser) {
                              useCommunityStore.setState((state) => {
                                const exists = state.friends.find(f => f.uid === foundUser!.uid);
                                if (exists) {
                                   return { friends: state.friends.map(f => f.uid === foundUser!.uid ? { ...f, isFriend: true } : f) };
                                } else {
                                   return { friends: [...state.friends, { ...foundUser!, isFriend: true }] };
                                }
                              });
                              setSearchFriend('');
                            }
                          }}
                          className="px-4 py-2 rounded-lg bg-neon-red text-white text-[10px] font-bold uppercase tracking-wider shadow-neon"
                        >
                          + AGREGAR
                        </button>
                      )}
                    </div>
                 );
               } else {
                 // Block fake searches
                 return (
                    <div className="mt-4 p-4 rounded-xl border border-surface-border bg-obsidian-dark flex items-center justify-center text-center">
                      <p className="text-xs font-body text-text-dim">
                        USUARIO NO ENCONTRADO — No existe ninguna cuenta registrada como <span className="text-white font-bold">@{searchFriend.trim()}</span> en GamerBox.
                      </p>
                    </div>
                 );
               }
            })()}

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
                    <GlassPanel key={friend.uid} onClick={() => setInspectProfile(friend)} className="p-4 flex items-center justify-between cursor-pointer">
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
                        <Button variant="ghost" size="sm" className="h-8 px-2 border-surface-border" onClick={(e) => { e.stopPropagation(); removeFriend(friend.uid); }}>
                          <X size={14} />
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8 px-3 border-mint-green/30 text-mint-green hover:bg-mint-green/10 flex gap-2" onClick={(e) => { e.stopPropagation(); }}>
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
                {friends.filter(f => !f.isFriend && (searchFriend === '' || f.gamertag.toLowerCase().includes(searchFriend.toLowerCase())) && f.gamertag.toLowerCase() !== user?.displayName?.toLowerCase()).map(friend => (
                  <GlassPanel key={friend.uid} onClick={() => setInspectProfile(friend)} className="p-4 flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
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
                    <Button variant="ghost" size="sm" className="h-8 px-3 border-neon-red/30 text-neon-red-bright hover:bg-neon-red/10 flex gap-2" onClick={(e) => { e.stopPropagation(); addFriend(friend.uid); }}>
                      <UserPlus size={14} /> AGREGAR
                    </Button>
                  </GlassPanel>
                ))}
              </div>
            </section>
            {/* Profile Inspector Modal */}
            <AnimatePresence>
              {inspectProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setInspectProfile(null)} />
                  <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-zinc-950/90 backdrop-blur-2xl border border-white/15 p-6 rounded-3xl shadow-[0_0_50px_rgba(255,42,85,0.1)]">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative mb-3">
                        <div
                          className="w-20 h-20 rounded-full bg-obsidian-dark flex items-center justify-center border-2 border-neon-red shadow-[0_0_15px_rgba(255,42,85,0.3)] bg-cover bg-center"
                          style={{ backgroundImage: inspectProfile.photoURL ? `url(${inspectProfile.photoURL})` : 'none' }}
                        >
                          {!inspectProfile.photoURL && (
                            <span className="font-heading font-black text-2xl text-neon-red-bright uppercase">
                              {inspectProfile.gamertag.substring(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-zinc-950 ${inspectProfile.status === 'ONLINE' ? 'bg-mint-green' : inspectProfile.status === 'IN_GAME' ? 'bg-neon-red' : 'bg-surface-border'}`} />
                      </div>
                      <h3 className="font-heading font-black text-xl text-white uppercase">{inspectProfile.gamertag}</h3>
                      <p className="font-mono text-[10px] text-text-dim uppercase tracking-widest">{inspectProfile.title}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="bg-obsidian-black border border-surface-border rounded-xl p-3 flex flex-col items-center">
                        <Trophy size={14} className="text-mint-green mb-1" />
                        <span className="font-heading font-bold text-white text-sm">{inspectProfile.level ?? 1}</span>
                        <span className="font-mono text-[8px] text-text-dim uppercase tracking-widest">Nivel</span>
                      </div>
                      <div className="bg-obsidian-black border border-surface-border rounded-xl p-3 flex flex-col items-center">
                        <Star size={14} className="text-neon-red mb-1" />
                        <span className="font-heading font-bold text-white text-sm">{inspectProfile.platinums ?? 0}</span>
                        <span className="font-mono text-[8px] text-text-dim uppercase tracking-widest">Platinos</span>
                      </div>
                      <div className="bg-obsidian-black border border-surface-border rounded-xl p-3 flex flex-col items-center">
                        <Clock size={14} className="text-white/50 mb-1" />
                        <span className="font-heading font-bold text-white text-sm">{inspectProfile.totalHours ?? 0}h</span>
                        <span className="font-mono text-[8px] text-text-dim uppercase tracking-widest">Jugadas</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {inspectProfile.isFriend ? (
                        <>
                          <Button variant="neon" className="w-full h-12 flex gap-2"><Zap size={16}/> INVITAR A PARTIDA</Button>
                          <Button variant="ghost" className="w-full h-12 border border-surface-border text-text-dim hover:text-white" onClick={() => { removeFriend(inspectProfile.uid); setInspectProfile(null); }}>ELIMINAR DE MI ESCUADRÓN</Button>
                        </>
                      ) : (
                        <Button variant="neon" className="w-full h-12 flex gap-2" onClick={() => { addFriend(inspectProfile.uid); setInspectProfile(null); }}><UserPlus size={16}/> AGREGAR A MI ESCUADRÓN</Button>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

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
