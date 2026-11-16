'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, GraduationCap, LogOut, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GameCard } from '@/components/dashboard/GameCard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';
import { useGameStore } from '@/store/useGameStore';
import { GAMERTAG_RE, useAuthStore } from '@/store/useAuthStore';
import { useTutorialStore } from '@/store/useTutorialStore';
import { toast } from '@/store/useToastStore';
import { useTranslation, genreLabel } from '@/i18n/useTranslation';
import { formatNumber } from '@/i18n/format';
import { getProgression } from '@/lib/progression';
import { EASE_OUT, fadeUp, stagger } from '@/lib/motion';
import { cn } from '@/lib/cn';

// Original geometric avatars (inline SVG, full-bleed so they fill the circle).
const svg = (body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#12141D"/>${body}</svg>`)}`;
const AVATAR_PRESETS = [
  svg('<path d="M50 8 88 38 76 86 50 96 24 86 12 38Z" fill="#1c0508" stroke="#ff003c" stroke-width="4"/><path d="M50 8v88M12 38l38 14 38-14" stroke="#ff003c" stroke-width="2.5" fill="none"/>'),
  svg('<circle cx="50" cy="50" r="34" fill="#06231a" stroke="#5ee6a8" stroke-width="4"/><path d="M22 50c9-13 18-19 28-19s19 6 28 19c-9 13-18 19-28 19s-19-6-28-19Z" fill="none" stroke="#5ee6a8" stroke-width="3"/><circle cx="50" cy="50" r="8" fill="#5ee6a8"/>'),
  svg('<rect x="22" y="22" width="56" height="56" fill="#1c0508" stroke="#ff003c" stroke-width="4" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="13" fill="#ff003c"/>'),
  svg('<path d="M14 70 38 30 52 54 64 38 86 70Z" fill="#06231a" stroke="#5ee6a8" stroke-width="4" stroke-linejoin="round"/><circle cx="72" cy="26" r="7" fill="#ff003c"/>'),
];

export default function ProfilePage() {
  const games = useGameStore((state) => state.games);
  const { user, logout, updateUserProfile } = useAuthStore();
  const startTutorial = useTutorialStore((s) => s.start);
  const { t, language } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ displayName: '', title: '', bio: '', photoURL: '' });
  const [nameError, setNameError] = useState(false);

  const name = user?.displayName || 'Player';
  const title = user?.title || t('profile.defaultTitle');
  const bio = user?.bio || t('profile.defaultBio');

  useEffect(() => {
    if (editing) {
      setForm({ displayName: user?.displayName || '', title: user?.title || '', bio: user?.bio || '', photoURL: user?.photoURL || '' });
      setNameError(false);
    }
  }, [editing, user]);

  const stats = useMemo(() => getProgression(games), [games]);
  const favorites = games.filter((g) => g.isFavorite);

  const genres = useMemo(() => {
    const counts: Record<string, number> = {};
    games.forEach((g) => {
      const key = (g.genre || 'UNKNOWN').toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, percentage: Math.round((count / games.length) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 6);
  }, [games]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = form.displayName.trim();
    if (!GAMERTAG_RE.test(displayName)) {
      setNameError(true);
      return;
    }
    await updateUserProfile({ displayName, title: form.title.trim().slice(0, 30), bio: form.bio.trim().slice(0, 160), photoURL: form.photoURL || null });
    setEditing(false);
    toast(t('profile.saved'), 'success');
  };

  // Gallery photo → centered square crop → small JPEG, so it always fills the circle.
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 240;
      canvas.getContext('2d')?.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 240, 240);
      setForm((prev) => ({ ...prev, photoURL: canvas.toDataURL('image/jpeg', 0.82) }));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const kpis = [
    { label: t('profile.games'), value: formatNumber(stats.totalGames, language), tone: 'text-white' },
    { label: t('profile.platinums'), value: formatNumber(stats.completed, language), tone: 'text-mint-green' },
    { label: t('profile.totalTime'), value: formatNumber(stats.totalHours, language), tone: 'text-white' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="pb-nav flex w-full flex-col gap-8 px-4 pt-6">
      <motion.section variants={fadeUp} className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-neon-red opacity-25 blur-xl" aria-hidden />
          <Avatar name={name} src={user?.photoURL} alt={t('profile.avatarAlt', { name })} className="relative h-24 w-24 border-2 border-neon-red text-3xl shadow-neon" />
        </div>

        <div className="flex items-center gap-1">
          <h1 className="font-heading text-2xl font-bold text-white">{name}</h1>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t('profile.edit')}
            data-action="edit-profile"
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-dim transition-colors hover:text-white"
          >
            <Pencil size={16} />
          </button>
        </div>
        <p className="eyebrow -mt-1.5">{title}</p>
        <p className="selectable mt-2 max-w-[280px] text-sm leading-relaxed text-white/70">{bio}</p>

        <div className="glass-panel mt-5 w-full rounded-2xl p-4 text-left" data-tour="profile-xp">
          <div className="mb-2.5 flex items-end justify-between">
            <div>
              <p className="eyebrow">{t('profile.progress')}</p>
              <p className="font-heading text-xl font-black uppercase leading-tight text-white">{t('profile.level', { n: stats.level })}</p>
            </div>
            <p className="font-mono text-[11px] font-bold text-text-dim">
              <span className="text-neon-red-bright">{formatNumber(stats.xp, language)}</span> / {formatNumber(stats.nextLevelXp, language)} XP
            </p>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.percent}
            aria-label={t('profile.progress')}
          >
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.percent}%` }} transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }} className="h-full rounded-full bg-neon-red shadow-neon-bright" />
          </div>
        </div>
      </motion.section>

      <motion.dl variants={fadeUp} className="grid grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <GlassPanel key={kpi.label} className="flex flex-col-reverse items-center gap-1.5 px-2 py-4 text-center">
            {/* Short labels that wrap instead of truncating. */}
            <dt className="font-mono text-[9px] font-bold uppercase leading-tight tracking-wider text-text-dim">{kpi.label}</dt>
            <dd className={cn('font-heading text-2xl font-black leading-none', kpi.tone)}>{kpi.value}</dd>
          </GlassPanel>
        ))}
      </motion.dl>

      <motion.section variants={fadeUp}>
        <h2 className="eyebrow mb-3">{t('profile.favorites')}</h2>
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((game) => (
              <GameCard key={game.id} game={game} className="border-neon-red/50" />
            ))}
          </div>
        ) : (
          <EmptyState
            art="heart"
            compact
            title={t('profile.favEmptyTitle')}
            body={t('profile.favEmptyBody')}
            actionLabel={games.length > 0 ? t('profile.favEmptyCta') : undefined}
            onAction={() => router.push('/backlog')}
          />
        )}
      </motion.section>

      <motion.section variants={fadeUp}>
        <h2 className="eyebrow mb-3">{t('profile.genreDist')}</h2>
        {genres.length === 0 ? (
          <EmptyState art="chart" compact title={t('profile.genreEmpty')} />
        ) : (
          <GlassPanel className="flex flex-col gap-4 p-5">
            {genres.map((genre, i) => (
              <div key={genre.label}>
                <div className="mb-1.5 flex items-end justify-between">
                  <span className="font-heading text-sm font-bold text-white">{genreLabel(t, genre.label)}</span>
                  <span className="font-mono text-[11px] font-bold text-text-dim">{genre.percentage}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${genre.percentage}%` }} transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: EASE_OUT }} className="h-full rounded-full bg-mint-green" />
                </div>
              </div>
            ))}
          </GlassPanel>
        )}
      </motion.section>

      <motion.section variants={fadeUp} className="flex flex-col gap-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            router.push('/');
            setTimeout(startTutorial, 350);
          }}
        >
          <GraduationCap size={17} aria-hidden />
          {t('profile.replayTutorial')}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => logout()} data-action="logout">
          <LogOut size={16} aria-hidden />
          {t('profile.logout')}
        </Button>
        <Button variant="danger" className="w-full" onClick={() => setDeleting(true)}>
          <Trash2 size={16} aria-hidden />
          {t('profile.deleteAccount')}
        </Button>
      </motion.section>

      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} />

      <Modal open={editing} onClose={() => setEditing(false)} title={t('profile.edit')} variant="sheet">
        <form onSubmit={save} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3">
            <Avatar name={form.displayName || name} src={form.photoURL} className="h-20 w-20 border-2 text-2xl" />
            <div className="flex items-center gap-2.5" role="radiogroup" aria-label={t('profile.avatar')}>
              {AVATAR_PRESETS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={form.photoURL === url}
                  aria-label={t('profile.preset', { n: i + 1 })}
                  onClick={() => setForm({ ...form, photoURL: url })}
                  className={cn('h-11 w-11 overflow-hidden rounded-full border-2 transition-colors', form.photoURL === url ? 'border-neon-red shadow-neon' : 'border-surface-border')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="block h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onPickImage} />
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Camera size={15} aria-hidden />
              {t('profile.choosePhoto')}
            </Button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">{t('profile.gamertag')}</span>
            <input
              required
              maxLength={16}
              autoCapitalize="none"
              autoCorrect="off"
              value={form.displayName}
              onChange={(e) => {
                setNameError(false);
                setForm({ ...form, displayName: e.target.value });
              }}
              aria-invalid={nameError}
              className={cn('field', nameError && 'field-error')}
            />
            {nameError && (
              <span role="alert" className="text-xs text-neon-red-bright">
                {t('auth.validation.gamertagRule')}
              </span>
            )}
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-title" className="eyebrow">
              {t('profile.titleLabel')}
            </label>
            <input id="profile-title" maxLength={30} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field font-body" />
            <div className="mt-1 flex flex-wrap gap-2">
              {t('profile.titlePresets').split('|').map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setForm({ ...form, title: preset })}
                  className={cn(
                    'flex h-11 items-center rounded-full border px-3 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors',
                    form.title === preset ? 'border-neon-red bg-neon-red/15 text-neon-red-bright' : 'border-surface-border text-text-dim'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">{t('profile.bio')}</span>
            <textarea rows={3} maxLength={160} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="field h-auto resize-none py-3 font-body" />
          </label>

          <Button type="submit" variant="neon" className="w-full" data-action="save-profile">
            {t('profile.saveChanges')}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
