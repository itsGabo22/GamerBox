'use client';

import React, { useEffect, useRef } from 'react';
import { stageBus } from '@/lib/stageBus';
import { StageEngine, type StageMode } from './stageEngine';

interface ObsidianStageProps {
  mode: StageMode;
  introStart: number;
  lowEnd: boolean;
  allowFallback: boolean;
  /** Increment to jump straight to the settled login composition (intro skipped). */
  snap: number;
  onReady: () => void;
  onFallback: (reason: 'fps' | 'context') => void;
}

/**
 * The single WebGL canvas shared by the intro and the login stage.
 * Loaded as its own lazy chunk; unmounting disposes every GPU resource.
 */
export default function ObsidianStage({ mode, introStart, lowEnd, allowFallback, snap, onReady, onFallback }: ObsidianStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<StageEngine | null>(null);
  const callbacks = useRef({ onReady, onFallback });
  callbacks.current = { onReady, onFallback };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      engineRef.current = new StageEngine(canvas, {
        mode,
        introStart,
        lowEnd,
        allowFallback,
        onFallback: (reason) => callbacks.current.onFallback(reason),
      });
      callbacks.current.onReady();
    } catch {
      callbacks.current.onFallback('context');
      return;
    }
    const off = stageBus.on((signal) => engineRef.current?.signal(signal));
    return () => {
      off();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
    // The engine is created once; later prop changes are pushed through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    if (snap > 0) engineRef.current?.snapToLogin();
  }, [snap]);

  return <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />;
}
