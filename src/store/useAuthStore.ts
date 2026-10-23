import { create } from 'zustand';
import { FirebaseError } from 'firebase/app';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { syncUserProfileToCloud } from '@/services/firestoreService';
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
  bio?: string;
  title?: string;
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
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const mapFirebaseError = (error: unknown): string => {
  if (error instanceof Error && error.message === 'AUTH_TIMEOUT') {
    return 'Error de conexión con el servidor de autenticación. Verifica tu internet.';
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
    const emailLower = email.trim().toLowerCase();

    const handleFallback = (e?: Record<string, unknown>) => {
      // STRICT: Never bypass real credential errors
      if (e && (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found')) {
         set({ authError: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
         return false;
      }

      if (typeof window !== 'undefined') {
        const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
        if (vaultStr) {
          const vault = JSON.parse(vaultStr);
          const account = vault[emailLower];
          if (account) {
            if (account.passwordHash === pass) {
              set({ user: account, isAuthLoading: false, authError: null });
              return true;
            } else {
              set({ authError: 'Contraseña incorrecta.' });
              return false;
            }
          }
        }
      }
      set({ authError: 'No existe una cuenta con este correo. Regístrate primero en Crear Cuenta.' });
      return false;
    };

    if (!isFirebaseConfigured) {
      console.warn('🔐 [GamerBox Auth] Demo Mode: Fake Sign In using Vault');
      return handleFallback();
    }

    try {
      const userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, pass), 5000);
      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('gamerbox_cached_user', JSON.stringify(newUser));
        const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
        const vault = vaultStr ? JSON.parse(vaultStr) : {};
        vault[emailLower] = { ...newUser, passwordHash: pass };
        localStorage.setItem('gamerbox_accounts_vault', JSON.stringify(vault));
      }

      set({ user: newUser, isAuthLoading: false, authError: null });
      return true;
    } catch (error: unknown) {
      const e = error as Record<string, unknown>;
      if (error instanceof Error) {
        if (
          error.message === 'AUTH_TIMEOUT' ||
          e.code === 'auth/network-request-failed' ||
          e.code === 'auth/configuration-not-found' ||
          e.code === 'auth/operation-not-allowed' ||
          e.code === 'auth/internal-error'
        ) {
          return handleFallback(e);
        }
      }

      return handleFallback(e);
    }
  },

  signUpWithEmail: async (email, pass, username) => {
    set({ authError: null });

    const usernameClean = username.trim().toLowerCase();
    if (usernameClean.length < 3) {
      set({ authError: 'El Gamertag debe tener al menos 3 caracteres.' });
      return false;
    }
    if (pass.length < 6) {
      set({ authError: 'La contraseña debe tener al menos 6 caracteres.' });
      return false;
    }

    const emailLower = email.trim().toLowerCase();

    // STRICT CHECK: Ensure uniqueness before trying Firebase
    if (typeof window !== 'undefined') {
      const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
      if (vaultStr) {
        const vault = JSON.parse(vaultStr);
        if (vault[emailLower]) {
           set({ authError: 'Este correo ya está registrado. Por favor usa la pestaña Iniciar Sesión.' });
           return false;
        }
        const usernameTaken = Object.values(vault).some((acc: unknown) => {
          const profile = acc as Record<string, unknown>;
          return typeof profile.displayName === 'string' && profile.displayName.toLowerCase() === usernameClean;
        });
        if (usernameTaken) {
           set({ authError: `El Gamertag "${username.trim()}" ya está en uso. Elige otro identificador.` });
           return false;
        }
      }
    }

    const handleFallbackCreate = () => {
      console.warn('🔐 [GamerBox Auth] Fallback Mode: Fake Sign Up due to network/timeout');
      const newUser = { uid: 'local-' + Date.now(), email: emailLower, displayName: username, photoURL: null };

      if (typeof window !== 'undefined') {
        localStorage.setItem('gamerbox_cached_user', JSON.stringify(newUser));
        const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
        const vault = vaultStr ? JSON.parse(vaultStr) : {};
        vault[emailLower] = { ...newUser, passwordHash: pass };
        localStorage.setItem('gamerbox_accounts_vault', JSON.stringify(vault));
      }

      set({ user: newUser, isAuthLoading: false, authError: null });
      return true;
    };

    if (!isFirebaseConfigured) {
      return handleFallbackCreate();
    }

    try {
      const userCredential = await withTimeout(createUserWithEmailAndPassword(auth, email, pass), 5000);
      updateProfile(userCredential.user, { displayName: username }).catch(() => {});

      const newUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: username,
        photoURL: userCredential.user.photoURL
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('gamerbox_cached_user', JSON.stringify(newUser));
        const vaultStr = localStorage.getItem('gamerbox_accounts_vault');
        const vault = vaultStr ? JSON.parse(vaultStr) : {};
        vault[emailLower] = { ...newUser, passwordHash: pass };
        localStorage.setItem('gamerbox_accounts_vault', JSON.stringify(vault));
      }

      set({ user: newUser, isAuthLoading: false, authError: null });
      return true;
    } catch (error: unknown) {
      const e = error as Record<string, unknown>;

      if (e.code === 'auth/email-already-in-use') {
         set({ authError: 'Este correo ya está registrado. Inicia sesión con tu cuenta.' });
         return false;
      }

      if (error instanceof Error) {
        if (
          error.message === 'AUTH_TIMEOUT' ||
          e.code === 'auth/network-request-failed' ||
          e.code === 'auth/configuration-not-found' ||
          e.code === 'auth/operation-not-allowed' ||
          e.code === 'auth/internal-error'
        ) {
          return handleFallbackCreate();
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

  updateUserProfile: async (data: Partial<UserProfile>) => {
    const user = get().user;
    if (!user) return;

    const newProfile = { ...user, ...data };
    set({ user: newProfile });

    if (typeof window !== 'undefined') {
      localStorage.setItem('gamerbox_cached_user', JSON.stringify(newProfile));
    }

    if (isFirebaseConfigured && auth.currentUser) {
      if (data.displayName !== undefined || data.photoURL !== undefined) {
        updateProfile(auth.currentUser, {
          displayName: data.displayName ?? auth.currentUser.displayName,
          photoURL: data.photoURL ?? auth.currentUser.photoURL
        }).catch(console.error);
      }

      // Sync extra profile fields to Firestore
      syncUserProfileToCloud(auth.currentUser.uid, {
        bio: newProfile.bio,
        title: newProfile.title
      }).catch(console.error);
    }
  },

  clearError: () => set({ authError: null }),
}));
