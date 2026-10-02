import React from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type KpiData = {
  label: string;
  value: number | string;
  accent?: 'default' | 'neon' | 'mint';
};

interface KpiCardProps {
  data: KpiData;
}

export const KpiCard = ({ data }: KpiCardProps) => {
  const accentColors = {
    default: 'text-white border-surface-border',
    neon: 'text-neon-red-bright border-neon-red/30',
    mint: 'text-mint-green border-mint-green/30',
  };

  return (
    <GlassPanel className={cn("p-4 flex flex-col gap-1 border-t-2", accentColors[data.accent || 'default'])}>
      <span className="font-mono text-[10px] tracking-widest uppercase text-text-dim">
        {data.label}
      </span>
      <span className="font-heading font-bold text-3xl">
        {data.value}
      </span>
    </GlassPanel>
  );
};
