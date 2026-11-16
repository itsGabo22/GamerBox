'use client';

import { useEffect, useRef } from 'react';

/**
 * Layered hardware-back handling. Anything that should close on "back"
 * (intro, tutorial, modals, sheets) registers here; the top-most handler wins.
 * BackButtonHandler falls through to history / exit-confirm when the stack is empty.
 */
type BackHandler = () => void;
const stack: BackHandler[] = [];

export const pushBackHandler = (handler: BackHandler) => {
  stack.push(handler);
  return () => {
    const i = stack.lastIndexOf(handler);
    if (i >= 0) stack.splice(i, 1);
  };
};

/** Runs the top-most handler. Returns true when something consumed the press. */
export const runBackHandler = (): boolean => {
  const handler = stack[stack.length - 1];
  if (!handler) return false;
  handler();
  return true;
};

export function useBackHandler(active: boolean, handler: BackHandler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => ref.current());
  }, [active]);
}
