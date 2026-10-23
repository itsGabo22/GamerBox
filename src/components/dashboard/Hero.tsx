'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Play, X, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';

export const Hero = () => {
  const router = useRouter();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const { logPlaySession } = useGameStore();

  const handleDetailsClick = () => {
    // Navigate to a featured game ID (example: Neon White ID from mock, or generic search)
    router.push('/game/view?id=g1');
  };

  const handleStartSession = () => {
    setSessionActive(true);
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      if (seconds >= 2) {
        clearInterval(interval);
        setSessionActive(false);
        setShowMatchModal(false);
        logPlaySession('g1', 3); // mock log 3 hours to favorite game
        alert('¡Sesión finalizada! Has ganado +100 XP y se han registrado 3 horas de juego.');
      }
    }, 1000);
  };

  return (
    <>
      <div className="relative w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] h-[60vh] min-h-[400px] max-h-[600px] rounded-3xl overflow-hidden mt-6 md:mt-8 mx-4 md:mx-8 shadow-glass">
        {/* Background Image & Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-black via-obsidian-dark/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian-black via-obsidian-dark/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl space-y-4"
          >
            <Badge variant="live" className="mb-4">Live Tournament</Badge>
            <h1 className="text-4xl md:text-6xl font-heading font-black text-white tracking-tighter leading-tight text-balance uppercase">
              Neon Arena <br /> <span className="text-neon-red-bright">CHAMPIONSHIP 2026</span>
            </h1>
            <p className="text-text-dim text-sm md:text-base font-mono tracking-wide max-w-xl pb-4 uppercase">
              Join the ultimate competitive experience. Prove your skills and climb the ranks.
            </p>

            <div className="flex items-center gap-4">
              <Button variant="neon" size="lg" className="gap-2" onClick={() => setShowMatchModal(true)}>
                <Play fill="currentColor" size={20} />
                JOIN MATCH
              </Button>
              <Button variant="secondary" size="lg" onClick={handleDetailsClick}>
                Details
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showMatchModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-obsidian-black/80 backdrop-blur-sm" onClick={() => !sessionActive && setShowMatchModal(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-obsidian-dark border border-surface-border p-6 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(255,42,85,0.15)] overflow-hidden">
              {sessionActive && (
                <div className="absolute inset-0 border-[3px] border-neon-red-bright rounded-3xl opacity-50 animate-pulse pointer-events-none" />
              )}
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-bold text-xl text-white uppercase flex items-center gap-2">
                  <Activity className={sessionActive ? "text-neon-red-bright animate-pulse" : "text-text-dim"} />
                  {sessionActive ? 'TELEMETRY ACTIVE' : 'MATCHMAKING'}
                </h3>
                {!sessionActive && <button onClick={() => setShowMatchModal(false)} className="text-text-dim hover:text-white"><X size={20} /></button>}
              </div>

              {!sessionActive ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Server Region</label>
                    <select className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm">
                      <option>LATAM North - Bogotá</option>
                      <option>US East - Virginia</option>
                      <option>Brazil South - SP</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-text-dim uppercase tracking-widest mb-1 block">Squad Role</label>
                    <select className="w-full h-12 px-4 bg-obsidian-black border border-surface-border rounded-xl text-white font-mono text-sm">
                      <option>Assault / DPS</option>
                      <option>Tactical Support</option>
                      <option>Recon</option>
                    </select>
                  </div>
                  <Button variant="neon" className="w-full mt-4" onClick={handleStartSession}>
                    INITIALIZE SESSION
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="w-24 h-24 rounded-full border-4 border-t-neon-red-bright border-r-neon-red-bright border-b-surface-border border-l-surface-border animate-spin mb-6" />
                  <p className="font-mono text-sm font-bold text-neon-red-bright uppercase tracking-widest animate-pulse">
                    LINK ESTABLISHED
                  </p>
                  <p className="font-mono text-[10px] text-text-dim mt-2 uppercase">
                    Syncing telemetry data...
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
