import { create } from 'zustand';

export type TutorialPhase = 'carousel' | 'tour';

interface TutorialState {
  active: boolean;
  phase: TutorialPhase;
  step: number;
  start: () => void;
  setPhase: (phase: TutorialPhase) => void;
  setStep: (step: number) => void;
  /** Ends the tutorial and remembers it for this account. */
  finish: (uid?: string | null) => void;
}

const doneKey = (uid: string) => `tutorial_done_${uid}`;

export const isTutorialDone = (uid: string) =>
  typeof window !== 'undefined' && localStorage.getItem(doneKey(uid)) === '1';

export const useTutorialStore = create<TutorialState>((set) => ({
  active: false,
  phase: 'carousel',
  step: 0,
  start: () => set({ active: true, phase: 'carousel', step: 0 }),
  setPhase: (phase) => set({ phase, step: 0 }),
  setStep: (step) => set({ step }),
  finish: (uid) => {
    if (uid && typeof window !== 'undefined') localStorage.setItem(doneKey(uid), '1');
    set({ active: false, phase: 'carousel', step: 0 });
  },
}));
