'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Compass, LayoutList, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Compass, label: 'Discover', href: '/discover' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: LayoutList, label: 'Backlog', href: '/backlog' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export const Navigation = () => {
  const pathname = usePathname();

  // Hide on game detail routes to provide immersive full-screen experience
  if (pathname.startsWith('/game/')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pt-4 px-4 bg-gradient-to-t from-obsidian-black via-obsidian-black/80 to-transparent pointer-events-none">
      <nav className="glass-panel rounded-full px-6 py-4 flex items-center justify-between w-full max-w-md pointer-events-auto shadow-glass border border-surface-border bg-obsidian-dark/90 backdrop-blur-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 transition-all duration-300 relative',
                isActive ? 'text-neon-red-bright' : 'text-text-dim hover:text-white'
              )}
              aria-label={item.label}
            >
              <div className="relative p-1">
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-neon-red-bright shadow-neon-bright" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
