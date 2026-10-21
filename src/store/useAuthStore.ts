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

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthLoading: true,
  authError: null,

  initAuthListener: () => {
    if (!isFirebaseConfigured) {
      const demoUserStr = typeof window !== 'undefined' ? localStorage.getItem('demo_user') : null;
      if (demoUserStr) {
        set({ user: JSON.parse(demoUserStr), isAuthLoading: false });
      } else {
        set({ user: null, isAuthLoading: false });
      }
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          },
          isAuthLoading: false
        });
      } else {
        set({ user: null, isAuthLoading: false });
      }
    });

    return unsubscribe;
  },

  signInWithEmail: async (email, pass) => {
    set({ authError: null });

    if (!isFirebaseConfigured) {
      console.warn('🔐 [GamerBox Auth] Demo Mode: Fake Sign In');
      const demoUser = { uid: 'demo-123', email, displayName: email.split('@')[0], photoURL: null };
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      set({ user: demoUser });
      return true;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error) {
      set({ authError: mapFirebaseError(error) });
      return false;
    }
  },

  signUpWithEmail: async (email, pass, username) => {
    set({ authError: null });

    if (!isFirebaseConfigured) {
      console.warn('🔐 [GamerBox Auth] Demo Mode: Fake Sign Up');
      const demoUser = { uid: 'demo-' + Date.now(), email, displayName: username, photoURL: null };
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      set({ user: demoUser });
      return true;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: username });

      // Update local state to reflect displayName immediately since onAuthStateChanged might fire before updateProfile finishes
      set({
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: username,
          photoURL: userCredential.user.photoURL
        }
      });
      return true;
    } catch (error) {
      set({ authError: mapFirebaseError(error) });
      return false;
    }
  },

  logout: async () => {
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
