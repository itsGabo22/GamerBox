import type { Transition, Variants } from 'framer-motion';

/** One motion language for the whole app. Nothing runs longer than 600 ms. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DUR = { fast: 0.15, base: 0.25, slow: 0.4, max: 0.6 } as const;

export const tBase: Transition = { duration: DUR.base, ease: EASE_OUT };
export const tSlow: Transition = { duration: DUR.slow, ease: EASE_OUT };
export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: tSlow },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
