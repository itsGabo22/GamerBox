import { create } from 'zustand';

/** boot → forge → burst → settle → done. `done` is also the state when the intro is off. */
export type IntroPhase = 'pending' | 'boot' | 'forge' | 'burst' | 'settle' | 'done';
/** What draws the crystal: the WebGL stage or the SVG/CSS fallback. */
export type StageRenderer = 'pending' | 'webgl' | 'svg';
export type IntroVariant = 'webgl' | 'css' | 'reduced' | 'none';

interface StageState {
  phase: IntroPhase;
  variant: IntroVariant;
  renderer: StageRenderer;
  /** True from the moment the wordmark should be on screen. */
  wordmark: boolean;
  set: (patch: Partial<Omit<StageState, 'set'>>) => void;
}

export const useStageStore = create<StageState>((set) => ({
  phase: 'pending',
  variant: 'none',
  renderer: 'pending',
  wordmark: false,
  set: (patch) => set(patch),
}));

export const introFinished = (phase: IntroPhase) => phase === 'done';
