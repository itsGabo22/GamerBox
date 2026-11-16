'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Compass, LibraryBig, Users, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { useTranslation } from '@/i18n/useTranslation';

const ITEMS = [
  { icon: Home, key: 'home', href: '/' },
  { icon: Compass, key: 'discover', href: '/discover' },
  { icon: LibraryBig, key: 'backlog', href: '/backlog' },
  { icon: Users, key: 'community', href: '/community' },
  { icon: User, key: 'profile', href: '/profile' },
] as const;

export const Navigation = () => {
  const pathname = (usePathname() || '/').replace(/\/+$/, '') || '/';
  const { t } = useTranslation();

  // Game pages are immersive: no tab bar.
  if (pathname.startsWith('/game')) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-obsidian-black via-obsidian-black/85 to-transparent px-3 pt-6"
      style={{ paddingBottom: 'calc(var(--sab) + 10px)' }}
    >
      <nav
        aria-label={t('nav.label')}
        data-tour="nav"
        className="pointer-events-auto flex h-16 w-full max-w-md items-stretch justify-between rounded-[22px] border border-surface-border bg-surface-solid/90 px-1.5 shadow-glass backdrop-blur-xl"
      >
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              data-nav={item.key}
              className={cn(
                'relative flex min-w-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-colors duration-150 active:scale-95',
                active ? 'text-neon-red-bright' : 'text-text-dim hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  transition={spring}
                  className="absolute inset-x-1.5 inset-y-1.5 -z-10 rounded-2xl bg-neon-red/10"
                />
              )}
              <item.icon size={21} strokeWidth={active ? 2.4 : 1.9} aria-hidden />
              <span className={cn('font-mono text-[9px] font-bold uppercase tracking-wider', active ? 'opacity-100' : 'opacity-80')}>
                {t(`nav.${item.key}`)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
