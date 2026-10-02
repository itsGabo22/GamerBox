import React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Search = ({ value, onChange, className, ...props }: SearchProps) => {
  return (
    <div className={cn("relative w-full sticky top-4 z-40", className)}>
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-dim">
        <SearchIcon size={20} />
      </div>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Buscar en tu biblioteca..."
        className="w-full h-12 pl-12 pr-4 bg-surface-glass backdrop-blur-xl border border-surface-border rounded-xl text-white placeholder:text-text-dim focus:outline-none focus:border-neon-red focus:ring-1 focus:ring-neon-red transition-all shadow-glass"
        {...props}
      />
    </div>
  );
};
