'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@/i18n/useTranslation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useStageStore, type IntroVariant } from '@/store/useStageStore';
import { useBackHandler } from '@/lib/backStack';
import { stageBus } from '@/lib/stageBus';
import { CrystalMark, GBMark } from '@/components/brand/CrystalMark';
import { Wordmark } from '@/components/brand/Wordmark';

// three.js + the engine live in their own chunk, fetched after first paint.
const ObsidianStage = dynamic(() => import('./ObsidianStage'), { ssr: false });

/** Module scope survives app resume but not a cold start: the intro plays once per launch. */
let playedThisLaunch = false;

const hasWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

const isLowEnd = () => {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 3;
};

// Locale-neutral terminal lines.
const BOOT_LINES = [
  { text: 'VAULT://INIT', tone: 'text-neon-red-bright', at: 60 },
  { text: 'LINK ......... OK', tone: 'text-mint-green', at: 300 },
  { text: 'ACCESS //', tone: 'text-neon-red-bright', at: 540 },
];

/** The very first frame: same mark and position as the native splash, pure CSS. */
export const BootFrame = () => (
  <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[#050505]" data-theme="dark" aria-hidden>
    <GBMark className="h-[72px] w-[72px] rounded-2xl text-3xl" />
  </div>
);

interface IntroExperienceProps {
  /** A session exists (cached or restored): the intro ends in "access granted" instead of the login. */
  hasUser: boolean;
}

export function IntroExperience({ hasUser }: IntroExperienceProps) {
  const { t } = useTranslation();
  const { phase, variant, wordmark, set } = useStageStore();
  const [webgl, setWebgl] = useState(false);
  const [stageMounted, setStageMounted] = useState(false);
  const [snap, setSnap] = useState(0);
  const [sessionPath, setSessionPath] = useState(false);
  const [exitBurst, setExitBurst] = useState(false);
  const introStart = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stageReady = useRef(false);
  const lowEnd = useRef(false);
  const hadUser = useRef(hasUser);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  /** SVG shards converge into the logo; also used when WebGL is too slow or missing. */
  const runCssTimeline = useCallback(() => {
    clearTimers();
    set({ variant: 'css', phase: 'forge', renderer: 'svg', wordmark: false });
    at(1000, () => set({ phase: 'burst', wordmark: true }));
    at(1800, () => set({ phase: 'settle' }));
    at(2300, () => set({ phase: 'done' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canWebGL = !reduced && hasWebGL();
    const play = useSettingsStore.getState().introEnabled && !playedThisLaunch;
    playedThisLaunch = true;
    lowEnd.current = isLowEnd();
    introStart.current = performance.now();
    setWebgl(canWebGL);
    setSessionPath(hasUser);

    const chosen: IntroVariant = !play ? 'none' : reduced ? 'reduced' : canWebGL ? 'webgl' : 'css';
    set({ variant: chosen, renderer: canWebGL ? 'pending' : 'svg' });

    if (chosen === 'none') {
      set({ phase: 'done', wordmark: true });
      setStageMounted(canWebGL && !hasUser);
    } else if (chosen === 'reduced') {
      // 600 ms fade of the logo and one boot line, nothing else moves.
      set({ phase: 'settle', wordmark: true });
      at(600, () => set({ phase: 'done' }));
    } else if (chosen === 'css') {
      set({ phase: 'boot' });
      at(450, runCssTimeline);
    } else {
      setStageMounted(true);
      set({ phase: 'boot', wordmark: false });
      at(800, () => set({ phase: 'forge' }));
      // If the 3D chunk is not drawing by now, finish with the CSS version instead of a blank stage.
      at(1300, () => {
        if (!stageReady.current) runCssTimeline();
      });
      at(2000, () => set({ phase: 'burst' }));
      at(2450, () => set({ wordmark: true }));
      at(3000, () => set({ phase: 'settle' }));
      at(3600, () => set({ phase: 'done' }));
    }
    return clearTimers;
    // Runs once per mount; later auth changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const running = phase !== 'done' && phase !== 'pending';

  const skip = useCallback(() => {
    if (!running) return;
    clearTimers();
    set({ phase: 'done', wordmark: true });
    setSnap((n) => n + 1);
  }, [running, set]);

  useBackHandler(running, skip);

  // Stage lifetime after the intro: alive on the login screen, burst + unmount once signed in.
  useEffect(() => {
    if (phase !== 'done') return;
    if (!hasUser) {
      hadUser.current = false;
      setExitBurst(false);
      setSessionPath(false);
      if (webgl && useStageStore.getState().renderer !== 'svg') {
        if (!stageMounted) setSnap((n) => n + 1);
        setStageMounted(true);
      }
      return;
    }
    if (!stageMounted) return;
    if (!hadUser.current) {
      // Just signed in: let the crystal burst over the incoming Home, then free the GPU.
      hadUser.current = true;
      setExitBurst(true);
      stageBus.emit('success');
      const timer = setTimeout(() => {
        setStageMounted(false);
        setExitBurst(false);
      }, 650);
      return () => clearTimeout(timer);
    }
    setStageMounted(false);
  }, [phase, hasUser, webgl, stageMounted]);

  const onStageFallback = useCallback(() => {
    setStageMounted(false);
    set({ renderer: 'svg' });
    const current = useStageStore.getState().phase;
    if (current !== 'done' && current !== 'pending') runCssTimeline();
  }, [runCssTimeline, set]);

  const stageMode = phase === 'boot' || phase === 'forge' || phase === 'burst' ? 'intro' : hasUser ? 'exit' : 'login';
  const allowFallback = typeof window !== 'undefined' && localStorage.getItem('gb_force_webgl') !== '1';
  const overSession = sessionPath && running;
  const showCssCrystal = variant === 'css' && running && phase !== 'boot';

  return (
    <>
      {/* Opaque cover for the session path: the app loads underneath and is revealed at the end. */}
      <AnimatePresence>
        {overSession && phase !== 'settle' && (
          <motion.div
            key="intro-cover"
            className="fixed inset-0 z-[190] bg-[#050505]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {stageMounted && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: overSession || exitBurst ? 200 : 5 }}
          data-stage="webgl"
        >
          <ObsidianStage
            mode={stageMode}
            introStart={introStart.current}
            lowEnd={lowEnd.current}
            allowFallback={allowFallback}
            snap={snap}
            onReady={() => {
              stageReady.current = true;
              if (useStageStore.getState().renderer === 'pending') set({ renderer: 'webgl' });
            }}
            onFallback={onStageFallback}
          />
        </div>
      )}

      <AnimatePresence>
        {running && (
          <motion.div
            key="intro-ui"
            data-theme="dark"
            className="fixed inset-0 z-[210] cursor-pointer overflow-hidden"
            role="img"
            aria-label={t('intro.label')}
            onPointerDown={skip}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Scanline flicker during boot */}
            {(phase === 'boot' || phase === 'forge') && variant !== 'reduced' && (
              <div className="scanlines absolute inset-0 opacity-60" style={{ animation: 'gb-flicker 900ms steps(5, end) 1' }} />
            )}

            {/* The splash mark hands over to the intro without a cut */}
            <AnimatePresence>
              {phase === 'boot' && (
                <motion.div
                  key="mark"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.82 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeIn' }}
                >
                  <GBMark className="h-[72px] w-[72px] rounded-2xl text-3xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {showCssCrystal && (
              <motion.div
                className="absolute inset-x-0 flex justify-center"
                style={{ top: '18dvh' }}
                animate={{ opacity: phase === 'settle' && sessionPath ? 0 : 1 }}
              >
                <CrystalMark animation="assemble" className="h-[34dvh] w-auto" />
              </motion.div>
            )}

            {/* Boot telemetry */}
            <AnimatePresence>
              {(phase === 'boot' || phase === 'forge' || variant === 'reduced') && (
                <motion.div
                  key="boot"
                  className="absolute inset-x-0 flex flex-col items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.25em]"
                  style={{ top: '66dvh' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {(variant === 'reduced' ? BOOT_LINES.slice(0, 1) : BOOT_LINES).map((line) => (
                    <span
                      key={line.text}
                      className={`${line.tone} overflow-hidden whitespace-nowrap`}
                      style={
                        variant === 'reduced'
                          ? { animation: 'gb-fade-in 400ms both' }
                          : { width: `${line.text.length + 1}ch`, clipPath: 'inset(0 100% 0 0)', animation: `gb-type 380ms steps(${line.text.length}) ${line.at}ms forwards` }
                      }
                    >
                      {line.text}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Session path: wordmark settles, then ACCESS GRANTED */}
            {sessionPath && wordmark && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Wordmark tagline={t('intro.tagline')} glitch={variant !== 'reduced'} />
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: phase === 'settle' ? 1 : 0, y: phase === 'settle' ? 0 : 6 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 rounded-md border border-mint-green/40 bg-mint-green/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-mint-green"
                >
                  {t('intro.granted')}
                </motion.p>
              </div>
            )}

            {variant !== 'reduced' && (
              <p
                className="absolute inset-x-0 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/40"
                style={{ bottom: 'calc(var(--sab) + 28px)', animation: 'gb-fade-in 400ms 700ms both' }}
              >
                {t('intro.skip')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
