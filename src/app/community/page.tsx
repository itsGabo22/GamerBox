'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Heart, MessageCircle, MessagesSquare, PenLine, Search, Send, Star, Trash2, Trophy, TrendingUp, UserMinus, UserPlus, Users } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SAMPLE_PLAYERS, useCommunityStore, type CommunityPost, type FriendProfile } from '@/store/useCommunityStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { useTranslation } from '@/i18n/useTranslation';
import { formatRelative } from '@/i18n/format';
import { fadeUp, spring, stagger, tBase } from '@/lib/motion';
import { cn } from '@/lib/cn';

type Tab = 'feed' | 'squad';

const Stars = ({ value, label }: { value: number; label: string }) => (
  <span className="flex items-center gap-0.5" role="img" aria-label={label}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={12} className={n <= value ? 'fill-neon-red text-neon-red' : 'text-white/20'} aria-hidden />
    ))}
  </span>
);

const SampleTag = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 rounded border border-surface-border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-text-dim">{children}</span>
);

export default function CommunityPage() {
  const { posts, friends, fetchPosts, addPost, deletePost, toggleLike, addComment, addFriend, removeFriend, findPlayer } = useCommunityStore();
  const user = useAuthStore((s) => s.user);
  const { t, language } = useTranslation();
  const [tab, setTab] = useState<Tab>('feed');

  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ gameTitle: '', rating: 4, content: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const [search, setSearch] = useState('');
  const [lookup, setLookup] = useState<{ state: 'idle' | 'loading' | 'done'; player: FriendProfile | null }>({ state: 'idle', player: null });
  const [inspect, setInspect] = useState<FriendProfile | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Exact-gamertag lookup, debounced.
  useEffect(() => {
    const tag = search.trim().replace(/^@/, '');
    if (tag.length < 3) {
      setLookup({ state: 'idle', player: null });
      return;
    }
    let alive = true;
    setLookup({ state: 'loading', player: null });
    const timer = setTimeout(() => {
      findPlayer(tag).then((player) => alive && setLookup({ state: 'done', player }));
    }, 450);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [search, findPlayer]);

  const isFriend = (uid: string) => friends.some((f) => f.uid === uid);
  const hasSamples = posts.some((p) => p.isSample);
  const suggestions = SAMPLE_PLAYERS.filter((p) => !isFriend(p.uid));

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.gameTitle.trim() || !draft.content.trim()) return;
    await addPost(draft);
    setComposeOpen(false);
    setDraft({ gameTitle: '', rating: 4, content: '' });
    toast(t('community.posted'), 'success');
  };

  const sendComment = (postId: string) => {
    if (!comment.trim()) return;
    addComment(postId, comment);
    setComment('');
  };

  const recruit = (player: FriendProfile) => {
    addFriend(player);
    toast(t('community.addedToast', { tag: player.gamertag }), 'success');
  };

  const dismiss = (player: FriendProfile) => {
    removeFriend(player.uid);
    toast(t('community.removedToast', { tag: player.gamertag }));
  };

  const renderPost = (post: CommunityPost) => {
    const open = expanded === post.id;
    const mine = post.authorUid === user?.uid;
    return (
      <motion.li key={post.id} layout="position" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={tBase}>
        <GlassPanel className="flex flex-col gap-3.5 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={post.authorName} src={post.authorAvatar} className="h-10 w-10 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className="truncate font-heading text-sm font-bold text-white">{post.authorName}</span>
                {post.isSample && <SampleTag>{t('common.sample')}</SampleTag>}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-text-dim">
                {post.authorTitle} · {formatRelative(post.createdAt, language, t('notifications.now'))}
              </p>
            </div>
            {mine && (
              <button
                type="button"
                onClick={() => {
                  deletePost(post.id);
                  toast(t('community.postDeleted'));
                }}
                aria-label={t('community.deletePost')}
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-dim hover:text-neon-red-bright"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="max-w-full truncate rounded-md border border-surface-border bg-white/5 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              {post.gameTitle}
            </span>
            <Stars value={post.rating} label={t('community.ratingValue', { n: post.rating })} />
          </div>

          <p className="selectable text-sm leading-relaxed text-white/90">{post.isSample ? t(post.content) : post.content}</p>

          <div className="-mx-1 -mb-2 flex items-center gap-1 border-t border-surface-border pt-1">
            <button
              type="button"
              onClick={() => toggleLike(post.id)}
              aria-pressed={post.likedByMe}
              aria-label={`${t(post.likedByMe ? 'community.unlike' : 'community.like')} (${post.likes})`}
              className={cn('flex h-11 items-center gap-2 rounded-full px-3 transition-colors', post.likedByMe ? 'text-neon-red-bright' : 'text-text-dim hover:text-white')}
            >
              <motion.span key={String(post.likedByMe)} initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={spring}>
                <Heart size={17} className={post.likedByMe ? 'fill-neon-red-bright' : ''} aria-hidden />
              </motion.span>
              <span className="font-mono text-xs font-bold">{post.likes}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(open ? null : post.id);
                setComment('');
              }}
              aria-expanded={open}
              aria-label={`${t('community.comments')} (${post.comments.length})`}
              className={cn('flex h-11 items-center gap-2 rounded-full px-3 transition-colors', open ? 'text-white' : 'text-text-dim hover:text-white')}
            >
              <MessageCircle size={17} aria-hidden />
              <span className="font-mono text-xs font-bold">{post.comments.length}</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={tBase} className="overflow-hidden">
                <div className="flex flex-col gap-2 pt-1">
                  {post.comments.length === 0 && <p className="py-1 text-xs text-text-dim">{t('community.noComments')}</p>}
                  <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                    {post.comments.map((c) => (
                      <li key={c.id} className="rounded-xl border border-surface-border bg-white/5 p-3">
                        <p className="mb-0.5 font-heading text-xs font-bold text-mint-green">{c.authorName}</p>
                        <p className="selectable text-xs leading-relaxed text-white/85">{c.text}</p>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="relative"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendComment(post.id);
                    }}
                  >
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={500}
                      placeholder={t('community.commentPlaceholder')}
                      aria-label={t('community.commentPlaceholder')}
                      className="field h-11 pr-12 font-body text-sm"
                    />
                    <button type="submit" aria-label={t('community.send')} disabled={!comment.trim()} className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-neon-red-bright disabled:text-text-dim">
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </motion.li>
    );
  };

  const playerRow = (player: FriendProfile, action: React.ReactNode) => (
    <GlassPanel key={player.uid} className="flex items-center gap-1 pr-2">
      <button type="button" onClick={() => setInspect(player)} className="flex min-h-[64px] min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left">
        <Avatar name={player.gamertag} src={player.photoURL} className="h-11 w-11 text-sm" />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate font-heading text-[15px] font-bold text-white">{player.gamertag}</span>
            {player.isSample && <SampleTag>{t('common.sample')}</SampleTag>}
          </span>
          <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-text-dim">{player.title || t('community.defaultTitle')}</span>
        </span>
      </button>
      {action}
    </GlassPanel>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'feed', label: t('community.tabFeed'), icon: <MessagesSquare size={16} aria-hidden /> },
    { id: 'squad', label: `${t('community.tabSquad')} · ${friends.length}`, icon: <Users size={16} aria-hidden /> },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pb-nav flex w-full flex-col px-4 pt-6">
      <motion.header variants={fadeUp} className="mb-5">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-white">{t('community.title')}</h1>
        {/* Real number: members of this account's squad. */}
        <p className="eyebrow mt-1.5">{t('community.squadCount', { n: friends.length })}</p>
      </motion.header>

      <motion.div variants={fadeUp} role="tablist" className="mb-5 flex border-b border-surface-border">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-tab={item.id}
              onClick={() => setTab(item.id)}
              className={cn('relative flex h-12 flex-1 items-center justify-center gap-2 font-heading text-sm font-bold uppercase tracking-wide transition-colors', active ? 'text-neon-red-bright' : 'text-text-dim hover:text-white')}
            >
              {item.icon}
              {item.label}
              {active && <motion.span layoutId="community-tab" transition={spring} className="absolute inset-x-0 -bottom-px h-0.5 bg-neon-red shadow-neon" />}
            </button>
          );
        })}
      </motion.div>

      {tab === 'feed' ? (
        <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={tBase} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            data-tour="post-review"
            className="glass-panel glass-panel-hover flex min-h-[60px] items-center gap-3 rounded-2xl px-4 text-left active:scale-[0.99]"
          >
            <Avatar name={user?.displayName || 'GB'} src={user?.photoURL} className="h-9 w-9 text-xs" />
            <span className="flex-1 text-sm text-text-dim">{t('community.postCta')}</span>
            <PenLine size={18} className="text-neon-red-bright" aria-hidden />
          </button>

          {hasSamples && <p className="rounded-xl border border-dashed border-surface-border px-3 py-2 text-xs text-text-dim">{t('community.sampleNote')}</p>}

          {posts.length === 0 ? (
            <EmptyState art="signal" title={t('community.noPosts')} actionLabel={t('community.newReview')} onAction={() => setComposeOpen(true)} />
          ) : (
            <ul className="flex flex-col gap-4">
              <AnimatePresence initial={false}>{posts.map(renderPost)}</AnimatePresence>
            </ul>
          )}
        </motion.div>
      ) : (
        <motion.div key="squad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={tBase} className="flex flex-col gap-6">
          <div>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={t('community.searchPlayer')}
                aria-label={t('community.searchPlayer')}
                className="field h-14 rounded-2xl bg-surface-glass pl-12"
              />
            </div>
            <div aria-live="polite" className="mt-3">
              {lookup.state === 'loading' && <div className="skeleton h-16" role="status" aria-label={t('community.searching')} />}
              {lookup.state === 'done' && !lookup.player && (
                <p className="rounded-2xl border border-surface-border bg-white/5 p-4 text-center text-sm text-text-dim">
                  {t('community.notFound', { tag: search.trim().replace(/^@/, '') })}
                </p>
              )}
              {lookup.state === 'done' && lookup.player && (
                <div className="rounded-2xl border border-neon-red/40">
                  {playerRow(
                    lookup.player,
                    lookup.player.uid === user?.uid ? (
                      <span className="px-2 font-mono text-[10px] font-bold uppercase text-text-dim">{t('community.self')}</span>
                    ) : isFriend(lookup.player.uid) ? (
                      <span className="px-2 font-mono text-[10px] font-bold uppercase text-mint-green">{t('community.inSquad')}</span>
                    ) : (
                      <Button
                        variant="neon"
                        size="sm"
                        className="px-4"
                        onClick={() => {
                          recruit(lookup.player as FriendProfile);
                          setSearch('');
                        }}
                      >
                        <UserPlus size={15} aria-hidden />
                        {t('community.add')}
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <section>
            <h2 className="eyebrow mb-3">
              {t('community.squad')} · {friends.length}
            </h2>
            {friends.length === 0 ? (
              <EmptyState art="squad" compact title={t('community.squadEmptyTitle')} body={t('community.squadEmptyBody')} />
            ) : (
              <div className="flex flex-col gap-2.5">
                {friends.map((friend) =>
                  playerRow(
                    friend,
                    <button type="button" onClick={() => dismiss(friend)} aria-label={`${t('community.remove')}: ${friend.gamertag}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-dim hover:text-neon-red-bright">
                      <UserMinus size={17} />
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {suggestions.length > 0 && (
            <section>
              <h2 className="eyebrow mb-1">{t('community.suggestions')}</h2>
              <p className="mb-3 text-xs text-text-dim">{t('community.suggestionsNote')}</p>
              <div className="flex flex-col gap-2.5">
                {suggestions.map((player) =>
                  playerRow(
                    player,
                    <Button variant="ghost" size="sm" className="px-4" onClick={() => recruit(player)}>
                      <UserPlus size={15} aria-hidden />
                      {t('community.add')}
                    </Button>
                  )
                )}
              </div>
            </section>
          )}
        </motion.div>
      )}

      {/* Player card */}
      <Modal
        open={Boolean(inspect)}
        onClose={() => setInspect(null)}
        title={inspect?.gamertag || ''}
        eyebrow={inspect?.isSample ? t('common.sample') : inspect?.title || t('community.defaultTitle')}
      >
        {inspect && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-center">
              <Avatar name={inspect.gamertag} src={inspect.photoURL} className="h-20 w-20 border-2 text-2xl" />
            </div>
            <dl className="grid grid-cols-3 gap-2">
              {[
                { icon: <TrendingUp size={15} className="text-mint-green" />, label: t('community.level'), value: inspect.level ?? '—' },
                { icon: <Trophy size={15} className="text-neon-red-bright" />, label: t('community.platinums'), value: inspect.platinums ?? '—' },
                { icon: <Clock size={15} className="text-text-dim" />, label: t('community.hours'), value: inspect.totalHours ?? '—' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1 rounded-2xl border border-surface-border bg-white/5 p-3">
                  {stat.icon}
                  <dd className="font-heading text-lg font-bold leading-none text-white">{stat.value}</dd>
                  <dt className="font-mono text-[9px] uppercase tracking-wider text-text-dim">{stat.label}</dt>
                </div>
              ))}
            </dl>
            {inspect.uid !== user?.uid &&
              (isFriend(inspect.uid) ? (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => {
                    dismiss(inspect);
                    setInspect(null);
                  }}
                >
                  <UserMinus size={16} aria-hidden />
                  {t('community.removeFromSquad')}
                </Button>
              ) : (
                <Button
                  variant="neon"
                  className="w-full"
                  onClick={() => {
                    recruit(inspect);
                    setInspect(null);
                  }}
                >
                  <UserPlus size={16} aria-hidden />
                  {t('community.addToSquad')}
                </Button>
              ))}
          </div>
        )}
      </Modal>

      {/* New review */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={t('community.newReview')} variant="sheet">
        <form onSubmit={publish} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">{t('community.game')}</span>
            <input
              required
              maxLength={120}
              placeholder={t('community.gamePlaceholder')}
              value={draft.gameTitle}
              onChange={(e) => setDraft({ ...draft, gameTitle: e.target.value })}
              className="field font-body"
            />
          </label>

          <fieldset>
            <legend className="eyebrow mb-1">{t('community.rating')}</legend>
            <div className="-ml-2 flex" role="radiogroup" aria-label={t('community.rating')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={draft.rating === n}
                  aria-label={t('community.ratingValue', { n })}
                  onClick={() => setDraft({ ...draft, rating: n })}
                  className="flex h-12 w-12 items-center justify-center transition-transform active:scale-90"
                >
                  <Star size={28} className={n <= draft.rating ? 'fill-neon-red text-neon-red' : 'text-white/25'} />
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">{t('community.opinion')}</span>
            <textarea
              required
              rows={4}
              maxLength={2000}
              placeholder={t('community.opinionPlaceholder')}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              className="field h-auto resize-none py-3 font-body"
            />
          </label>

          <Button type="submit" variant="neon" className="w-full" data-action="publish">
            {t('community.publish')}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
