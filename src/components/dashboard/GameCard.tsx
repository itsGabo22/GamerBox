'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Heart } from 'lucide-react';
import type { Game } from '@/store/useGameStore';
import { GameCover } from '@/components/ui/SafeGameImage';
import { useTranslation, statusLabel } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';

interface GameCardProps {
  game: Game;
  /** When set, the card is a button (external / not-yet-owned games) instead of a link. */
  onOpen?: () => void;
  /** Replaces the status chip (e.g. a match score). */
  chip?: React.ReactNode;
  className?: string;
}

const STATUS_TONE: Record<string, string> = {
  COMPLETED: 'border-[#5EE6A8]/60 bg-black/70 text-[#5EE6A8]',
  PLAYING: 'border-[#FF003C]/70 bg-black/70 text-[#FF4D6D]',
};

/** One card everywhere: fixed 2:3 frame, portrait art, same chip + title positions. */
export const GameCard = ({ game, onOpen, chip, className }: GameCardProps) => {
  const { t } = useTranslation();
  const hours = game.hoursPlayed || 0;
  const progress = game.status === 'COMPLETED' ? 100 : game.progress || 0;

  const body = (
    <div
      className={cn(
        'group relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-surface-border bg-obsidian-dark transition-[transform,border-color] duration-150 ease-out active:scale-[0.97]',
        className
      )}
    >
      <GameCover src={game.coverUrl} title={game.title} genre={game.genre} className="absolute inset-0 h-full w-full" />
      {/* Art is always dark-graded so the white title stays legible in both themes. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
        {chip ?? (
          <span
            className={cn(
              'rounded-md border px-1.5 py-1 font-mono text-[9px] font-bold uppercase leading-none tracking-wider backdrop-blur-md',
              STATUS_TONE[game.status] || 'border-real-white/25 bg-black/70 text-real-white'
            )}
          >
            {statusLabel(t, game.status)}
          </span>
        )}
        {game.isFavorite && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 backdrop-blur-md">
            <Heart size={12} className="fill-neon-red-bright text-neon-red-bright" aria-hidden />
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 font-heading text-[15px] font-bold leading-tight text-real-white">{game.title}</h3>
        {hours > 0 && (
          <p className="flex items-center gap-1 font-mono text-[10px] font-bold text-real-white/70">
            <Clock size={10} aria-hidden />
            {t('common.hoursShort', { n: hours })}
          </p>
        )}
        {progress > 0 && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-real-white/15" aria-hidden>
            <div className={cn('h-full rounded-full', progress === 100 ? 'bg-mint-green' : 'bg-neon-red')} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className="block w-full rounded-2xl text-left">
        {body}
      </button>
    );
  }

  return (
    <Link href={`/game/view?id=${encodeURIComponent(game.id)}`} className="block w-full rounded-2xl">
      {body}
    </Link>
  );
};

export const GameCardSkeleton = () => <div className="skeleton aspect-[2/3] w-full" aria-hidden />;
