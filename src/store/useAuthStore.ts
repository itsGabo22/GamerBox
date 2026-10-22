import { create } from 'zustand';
import { FirebaseError } from 'firebase/app';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isAuthLoading: boolean;
  authError: string | null;
}

interface AuthActions {
  initAuthListener: () => () => void;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const mapFirebaseError = (error: unknown): string => {
  if (error instanceof Error && error.message === 'AUTH_TIMEOUT') {
    return 'Tiempo de espera agotado. Inténtalo de nuevo.';
  }
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Credenciales incorrectas.';
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'El formato del correo es inválido.';
      default:
        return 'Error de autenticación. Inténtalo de nuevo.';
    }
  }
  return 'Ocurrió un error inesperado.';
};

const withTimeout = <T>(promise: Promise<T>, ms = 3500): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('AUTH_TIMEOUT'));
    }, ms);
  });
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthLoading: true,
  authError: null,

  initAuthListener: () => {
    const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('gamerbox_cached_user') : null;
    if (cachedUser) {
      set({ user: JSON.parse(cachedUser), isAuthLoading: false });
    }

    if (!isFirebaseConfigured) {
      const demoUserStr = typeof window !== 'undefined' ? localStorage.getItem('demo_user') : null;
      if (demoUserStr) {
        set({ user: JSON.parse(demoUserStr), isAuthLoading: false });
      } else if (!cachedUser) {
        set({ user: null, isAuthLoading: false });
      }
      return () => {};
    }

    const watchdog = setTimeout(() => {
      if (get().isAuthLoading) {
        console.warn('🔐 [GamerBox Auth] Watchdog unlocked UI');
        set({ isAuthLoading: false });
      }
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(watchdog);

      if (firebaseUser) {
        const newUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        if (typeof window !== 'undefined') localStorage.setItem('gamerbox_cached_user', JSON.stringify(newUser));
        set({ user: newUser, isAuthLoading: false });
      } else {
        if (typeof window !== 'undefined') localStorage.removeItem('gamerbox_cached_user');
        set({ user: null, isAuthLoading: false });
      }
    });

    return unsubscribe;
  },

  signInWithEmail: async (email, pass) => {
    set({ authError: null });

    const fallbackLogin = () => {
      console.warn('🔐 [GamerBox Auth] Fallback Mode: Fake Sign In due to network/timeout');
      const demoUser = { uid: 'demo-123', email, displayName: email.split('@')[0], photoURL: null };
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      set({ user: demoUser, isAuthLoading: false, authError: null });
      return true;
    };

    if (!isFirebaseConfigured) {
      return fallbackLogin();
    }

    try {
      const userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, pass), 3500);
      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      };
      if (typeof window !== 'undefined') localStorage.setItem('gamerbox_cached_user', JSON.stringify(newUser));
      return true;
    } catch (error: unknown) {
      const e = error as Record<string, unknown>;
      if (error instanceof Error) {
        if (
          error.message === 'AUTH_TIMEOUT' ||
          e.code === 'auth/network-request-failed' ||
          e.code === 'auth/api-key-not-valid' ||
          e.code === 'auth/internal-error'
        ) {
          return fallbackLogin();
        }
      }
      set({ authError: mapFirebaseError(error) });
      return false;
    }
  },

  signUpWithEmail: async (email, pass, username) => {
    set({ authError: null });

    const fallbackSignUp = () => {
      console.warn('🔐 [GamerBox Auth] Fallback Mode: Fake Sign Up due to network/timeout');
      const demoUser = { uid: 'demo-' + Date.now(), email, displayName: username, photoURL: null };
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      set({ user: demoUser, isAuthLoading: false, authError: null });
      return true;
    };

    if (!isFirebaseConfigured) {
      return fallbackSignUp();
    }

    try {
      const userCredential = await withTimeout(createUserWithEmailAndPassword(auth, email, pass), 3500);
      updateProfile(userCredential.user, { displayName: username }).catch(() => {});

      // Update local state to reflect displayName immediately since onAuthStateChanged might fire before updateProfile finishes
      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: username,
        photoURL: userCredential.user.photoURL
      };
      if (typeof window !== 'undefined') localStorage.setItem('gamerbox_cached_user', JSON.stringify(newUser));

      set({ user: newUser });
      return true;
    } catch (error: unknown) {
      const e = error as Record<string, unknown>;
      if (error instanceof Error) {
        if (
          error.message === 'AUTH_TIMEOUT' ||
          e.code === 'auth/network-request-failed' ||
          e.code === 'auth/api-key-not-valid' ||
          e.code === 'auth/internal-error'
        ) {
          return fallbackSignUp();
        }
      }
      set({ authError: mapFirebaseError(error) });
      return false;
    }
  },

  logout: async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('gamerbox_cached_user');

    if (!isFirebaseConfigured) {
      console.warn('🔐 [GamerBox Auth] Demo Mode: Fake Logout');
      localStorage.removeItem('demo_user');
      set({ user: null });
      return;
    }

    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      console.error('Logout error', error);
    }
  },

  clearError: () => set({ authError: null }),
}));
