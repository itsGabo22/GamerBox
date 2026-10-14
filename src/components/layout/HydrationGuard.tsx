'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';

export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hasHydrated = useGameStore((state) => state.hasHydrated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !hasHydrated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-white">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 border-t-2 border-r-2 border-neon-red rounded-full"
          style={{ borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }}
        />
        <p className="mt-4 font-mono text-sm uppercase tracking-widest text-text-dim">
          Inicializando base de datos...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
