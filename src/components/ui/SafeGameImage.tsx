'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

interface GameCoverProps {
  src?: string;
  title: string;
  genre?: string;
  /** Sizing/shape classes for the frame (e.g. "aspect-[2/3] rounded-2xl"). */
  className?: string;
  /** Backdrop mode: a blurred, darkened fill used behind headers. */
  backdrop?: boolean;
}

const STEAM_APP = /\/apps\/(\d+)\//;
const steam = (appId: string, file: string) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/${file}`;

/** Portrait art first, then the landscape header, then whatever URL we were given. */
export const coverCandidates = (src?: string): string[] => {
  if (!src) return [];
  const appId = src.match(STEAM_APP)?.[1];
  if (!appId) return [src];
  return Array.from(new Set([steam(appId, 'library_600x900.jpg'), steam(appId, 'header.jpg'), src]));
};

/**
 * Game art that is never hard-cropped: portrait covers fill the frame; anything wider is
 * composed sharp-and-whole over a blurred fill of itself. Falls back to a generated plate.
 */
export const GameCover = ({ src, title, genre, className, backdrop = false }: GameCoverProps) => {
  const candidates = useMemo(() => coverCandidates(src), [src]);
  const [index, setIndex] = useState(0);
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    setIndex(0);
    setRatio(null);
  }, [src]);

  const url = candidates[index];
  const loaded = ratio !== null;
  // Narrower than ~0.8 is a real portrait cover; everything else gets the composed treatment.
  const composed = loaded && ratio > 0.8;

  if (!url) {
    return <CoverPlate title={title} genre={genre} className={className} quiet={backdrop} />;
  }

  return (
    <div className={cn('relative overflow-hidden bg-obsidian-dark', className)}>
      {!loaded && <div className="skeleton absolute inset-0 rounded-none" />}
      {(composed || backdrop) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl" draggable={false} />
      )}
      {!backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title}
          draggable={false}
          loading="lazy"
          onLoad={(e) => setRatio(e.currentTarget.naturalWidth / Math.max(1, e.currentTarget.naturalHeight))}
          onError={() => {
            setRatio(null);
            setIndex((i) => i + 1);
          }}
          className={cn(
            'absolute inset-0 h-full w-full transition-opacity duration-300',
            composed ? 'object-contain' : 'object-cover',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          aria-hidden
          className="hidden"
          onLoad={() => setRatio(1)}
          onError={() => {
            setRatio(null);
            setIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
};

const hashOf = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = value.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
};

/** Generated cover for games without art: grid + monogram, colored by title hash. */
const CoverPlate = ({ title, genre, className, quiet }: { title: string; genre?: string; className?: string; quiet?: boolean }) => {
  const h = hashOf(title);
  const mint = h % 2 === 1;
  const id = `plate-${h}`;
  const color = mint ? 'rgb(var(--c-mint))' : 'rgb(var(--c-red-bright))';
  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden bg-obsidian-dark', className)}>
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <defs>
          <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform={`rotate(${(h % 5) * 9})`}>
            <path d="M28 0H0V28" fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
            <circle cx="14" cy="14" r="1" fill={color} fillOpacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-transparent to-transparent" />
      {!quiet && (
        <div className="relative flex flex-col items-center px-3 text-center">
          <span
            className={cn(
              'mb-2 flex h-12 w-12 items-center justify-center rounded-full border font-heading text-lg font-black uppercase',
              mint ? 'border-mint-green/60 bg-mint-green/10 text-mint-green' : 'border-neon-red/60 bg-neon-red/10 text-neon-red-bright'
            )}
          >
            {title.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2) || '?'}
          </span>
          {genre && <span className="eyebrow text-[9px]">{genre}</span>}
        </div>
      )}
    </div>
  );
};

/** Kept for existing imports. */
export const SafeGameImage = GameCover;
