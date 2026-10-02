import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export type Filter = {
  id: string;
  label: string;
  type: 'all' | 'platform' | 'genre' | 'status';
};

interface FilterChipsProps {
  filters: Filter[];
  activeFilters: string[];
  onToggle: (filterId: string) => void;
  onReset: () => void;
  totalCount: number;
}

export const FilterChips = ({ filters, activeFilters, onToggle, onReset, totalCount }: FilterChipsProps) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 mt-4 -mx-4 px-4 snap-x">
      <button
        onClick={onReset}
        className={cn(
          "snap-start shrink-0 px-4 h-9 rounded-full font-mono text-xs font-bold tracking-wider transition-all border",
          activeFilters.length === 0
            ? "bg-neon-red text-white border-neon-red shadow-neon"
            : "bg-surface-glass text-text-dim border-surface-border hover:text-white"
        )}
      >
        ALL ({totalCount})
      </button>

      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => onToggle(filter.id)}
            className={cn(
              "snap-start shrink-0 px-4 h-9 rounded-full font-mono text-xs font-bold tracking-wider transition-all border uppercase",
              isActive
                ? "bg-neon-red/20 text-neon-red-bright border-neon-red"
                : "bg-surface-glass text-text-dim border-surface-border hover:text-white"
            )}
          >
            {filter.type}: {filter.label}
          </button>
        );
      })}
    </div>
  );
};
