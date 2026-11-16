'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  /** Size + text size come from the caller, e.g. "h-10 w-10 text-sm". */
  className?: string;
  alt?: string;
}

const hash = (value: string) => {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Photo cropped to fill the circle, or deterministic initials when there is no (valid) photo. */
export const Avatar = ({ name, src, className, alt }: AvatarProps) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const initials = (name || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?';
  const mint = hash(name || '') % 2 === 1;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-heading font-black leading-none',
        mint ? 'border-mint-green/40 bg-mint-green/10 text-mint-green' : 'border-neon-red/40 bg-neon-red/10 text-neon-red-bright',
        className
      )}
      role="img"
      aria-label={alt || name}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 block h-full w-full object-cover" onError={() => setFailed(true)} draggable={false} />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
};
