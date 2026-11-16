/**
 * Tiny event bus between the login form / intro and the WebGL stage.
 * It never carries field values: only "something happened" signals.
 */
export type StageSignal = 'focus' | 'blur' | 'type' | 'error' | 'success';
type Listener = (signal: StageSignal) => void;

const listeners = new Set<Listener>();

export const stageBus = {
  emit(signal: StageSignal) {
    listeners.forEach((l) => l(signal));
  },
  on(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
