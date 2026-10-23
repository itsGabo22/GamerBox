'use client';

import React, { useState } from 'react';

interface SafeGameImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  genre?: string;
  className?: string;
}

export const SafeGameImage: React.FC<SafeGameImageProps> = ({ src, alt, genre = 'GAME', className = '', ...props }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-obsidian-dark overflow-hidden ${className}`}>
        {/* Dynamic Abstract SVG Background based on string hash */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" dangerouslySetInnerHTML={{ __html: generateSVGPattern(alt) }} />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center p-4">
           <div className="w-12 h-12 mb-3 rounded-full border border-neon-red flex items-center justify-center bg-neon-red/10 shadow-[0_0_15px_rgba(255,42,85,0.3)]">
             <span className="font-heading font-black text-xl text-neon-red-bright uppercase">{alt.substring(0,2)}</span>
           </div>
           <p className="font-mono text-[10px] text-neon-red font-bold tracking-widest uppercase mb-1">{genre}</p>
           <h3 className="font-heading font-bold text-white text-base leading-tight line-clamp-2">{alt}</h3>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
};

// Generates a deterministic cyberpunk SVG pattern based on the game title
function generateSVGPattern(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = hash % 2 === 0 ? '#ff2a55' : '#5ee6a8';
  return `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-${hash}" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${color}" stroke-width="0.5" stroke-opacity="0.3"/>
          <circle cx="20" cy="20" r="1" fill="${color}" fill-opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-${hash})" />
    </svg>
  `;
}