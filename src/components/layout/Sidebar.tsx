'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Compass, Users, LayoutList, User, Search, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Compass, label: 'Discover', href: '/discover' },
  { icon: Users, label: 'Community', href: '/community' },
  { icon: LayoutList, label: 'Backlog', href: '/backlog' },
];

const secondaryItems = [
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-surface-border bg-obsidian-dark/50 backdrop-blur-xl z-50">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-neon-red flex items-center justify-center text-white font-heading font-bold text-xl group-hover:shadow-neon transition-shadow">
              GB
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">
              Gamer<span className="text-neon-red">Box</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 px-4 py-6 space-y-8">
          <nav className="space-y-2">
            <p className="px-4 text-xs font-mono text-text-dim font-bold tracking-widest uppercase mb-4">Menu</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold',
                    isActive 
                      ? 'bg-neon-red/10 text-neon-red-bright relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-neon-red before:rounded-r-full'
                      : 'text-text-dim hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <nav className="space-y-2">
            <p className="px-4 text-xs font-mono text-text-dim font-bold tracking-widest uppercase mb-4">Account</p>
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold',
                    isActive 
                      ? 'bg-neon-red/10 text-neon-red-bright'
                      : 'text-text-dim hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Dock */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <nav className="glass-panel rounded-full px-6 py-4 flex items-center justify-between">
          {[...navItems.slice(0,3), secondaryItems[2]].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 transition-all duration-300',
                  isActive ? 'text-neon-red-bright' : 'text-text-dim hover:text-white'
                )}
              >
                <div className="relative">
                  <item.icon size={24} />
                  {isActive && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neon-red-bright shadow-neon-bright" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};
