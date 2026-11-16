'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Search, Star, Trophy } from 'lucide-react';
import type { TFn } from '@/i18n/useTranslation';
import { CrystalMark } from '@/components/brand/CrystalMark';
import { OracleMark } from '@/components/ui/OracleMark';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: EASE_OUT },
});

const Card = ({ className, children, style }: { className?: string; children?: React.ReactNode; style?: React.CSSProperties }) => (
  <div className={cn('rounded-2xl border border-surface-border bg-surface-solid shadow-glass', className)} style={style}>
    {children}
  </div>
);

/** Original illustrations built from the app's own components and the crystal mark. No stock imagery. */
export const TutorialArt = ({ slide, t }: { slide: 's1' | 's2' | 's3' | 's4'; t: TFn }) => {
  if (slide === 's1') {
    const covers = [
      { status: 'PENDING', tone: 'border-surface-border text-text-dim', rotate: -9, x: -78, delay: 0.05 },
      { status: 'PLAYING', tone: 'border-neon-red/50 text-neon-red-bright', rotate: 0, x: 0, delay: 0.15 },
      { status: 'COMPLETED', tone: 'border-mint-green/50 text-mint-green', rotate: 9, x: 78, delay: 0.25 },
    ];
    return (
      <div className="relative h-full w-full">
        {covers.map((c, i) => (
          <motion.div
            key={c.status}
            {...rise(c.delay)}
            className="absolute left-1/2 top-1/2"
            style={{ marginLeft: c.x - 52, marginTop: i === 1 ? -96 : -80 }}
          >
            <Card className="flex h-[150px] w-[104px] flex-col justify-between overflow-hidden p-2" style={{ transform: `rotate(${c.rotate}deg)` }}>
              <span className={cn('self-start rounded border bg-obsidian-black/60 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider', c.tone)}>
                {t(`status.${c.status}`)}
              </span>
              <CrystalMark className={cn('mx-auto h-16 w-auto', i === 1 ? 'opacity-100' : 'opacity-40')} animation={i === 1 ? 'idle' : 'none'} />
              <span className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <span className={cn('block h-full rounded-full', i === 2 ? 'w-full bg-mint-green' : i === 1 ? 'w-1/2 bg-neon-red' : 'w-0')} />
              </span>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  if (slide === 's2') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
        <motion.div {...rise(0.05)} className="w-[250px]">
          <Card className="flex h-12 items-center gap-3 px-4">
            <Search size={17} className="text-text-dim" />
            <span className="h-2 w-24 rounded-full bg-white/15" />
            <span className="ml-auto h-4 w-px animate-blink bg-neon-red-bright" />
          </Card>
        </motion.div>
        <motion.div {...rise(0.18)} className="relative flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full border border-neon-red/50" />
          <span className="absolute inset-3 rounded-full border border-neon-red/25" />
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neon-red text-real-white shadow-neon-bright">
            <OracleMark size={34} />
          </span>
        </motion.div>
        <motion.div {...rise(0.3)} className="flex gap-3">
          <Card className="flex items-center gap-2 px-3 py-2">
            <span className="rounded bg-neon-red px-1.5 py-0.5 font-mono text-[10px] font-bold text-real-white">−67%</span>
            <span className="h-2 w-14 rounded-full bg-white/15" />
          </Card>
          <Card className="flex items-center gap-2 border-mint-green/40 px-3 py-2">
            <span className="font-mono text-[10px] font-bold text-mint-green">96%</span>
            <span className="h-2 w-10 rounded-full bg-mint-green/30" />
          </Card>
        </motion.div>
      </div>
    );
  }

  if (slide === 's3') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        <motion.div {...rise(0.05)} className="w-[250px]">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neon-red/40 bg-neon-red/10 font-heading text-xs font-black text-neon-red-bright">GB</span>
              <span className="flex flex-col gap-1.5">
                <span className="h-2 w-20 rounded-full bg-white/25" />
                <span className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={11} className={i < 4 ? 'fill-neon-red text-neon-red' : 'text-white/20'} />
                  ))}
                </span>
              </span>
            </div>
            <span className="mb-1.5 block h-2 w-full rounded-full bg-white/10" />
            <span className="mb-3 block h-2 w-2/3 rounded-full bg-white/10" />
            <div className="flex gap-4 text-text-dim">
              <Heart size={15} className="animate-pulse-ring fill-neon-red-bright text-neon-red-bright" />
              <MessageCircle size={15} />
            </div>
          </Card>
        </motion.div>
        <motion.div {...rise(0.22)} className="flex items-center">
          {['NV', 'KR', 'ZE'].map((tag, i) => (
            <span
              key={tag}
              className={cn(
                '-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-obsidian-black font-heading text-xs font-black first:ml-0',
                i === 1 ? 'bg-mint-green/20 text-mint-green' : 'bg-neon-red/20 text-neon-red-bright'
              )}
            >
              {tag}
            </span>
          ))}
          <span className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-surface-border bg-obsidian-black font-heading text-lg text-text-dim">+</span>
        </motion.div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 62;
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div {...rise(0.05)} className="relative flex h-44 w-44 items-center justify-center">
        <svg viewBox="0 0 150 150" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="75" cy="75" r="62" fill="none" stroke="rgb(var(--c-text) / 0.08)" strokeWidth="8" />
          <motion.circle
            cx="75" cy="75" r="62" fill="none" stroke="rgb(var(--c-red-bright))" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * 0.28 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-text-dim">LVL</span>
          <span className="font-heading text-5xl font-black leading-none text-white">07</span>
          <span className="mt-1 font-mono text-[10px] font-bold text-neon-red-bright">720 / 1000 XP</span>
        </div>
      </motion.div>
      <motion.div {...rise(0.3)} className="absolute right-[12%] top-[14%]">
        <Card className="flex h-12 w-12 items-center justify-center border-mint-green/40 text-mint-green">
          <Trophy size={20} />
        </Card>
      </motion.div>
      <motion.div {...rise(0.38)} className="absolute bottom-[14%] left-[10%]">
        <Card className="px-3 py-1.5 font-mono text-[10px] font-bold text-mint-green">+500 XP</Card>
      </motion.div>
    </div>
  );
};
