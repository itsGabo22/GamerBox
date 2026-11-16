import { create } from 'zustand';
import { FirebaseError } from 'firebase/app';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  cachedUser,
  clearLocalUserData,
  isLegacyLocalUid,
  migrateLocalData,
  readVault,
  removeAccount,
  sanitizeVault,
  saveAccount,
} from '@/lib/accountVault';
import { demoAuth } from '@/lib/demoAuth';
import {
  deleteUserCloudData,
  findPublicProfileByGamertag,
  syncUserProfileToCloud,
} from '@/services/firestoreService';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  bio?: string;
  title?: string;
}

/** Errors are dictionary keys (auth.errors.* / auth.validation.*), translated by the UI. */
export type AuthErrorKey = string;
export type DeleteResult = 'ok' | 'reauth' | 'error';

interface AuthState {
  user: UserProfile | null;
  isAuthLoading: boolean;
  authError: AuthErrorKey | null;
}

interface AuthActions {
  initAuthListener: () => () => void;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, username: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<AuthErrorKey | null>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<DeleteResult>;
  clearError: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const GAMERTAG_RE = /^[A-Za-z][A-Za-z0-9_]{2,15}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const AUTH_TIMEOUT_MS = 12000;

const errorKey = (error: unknown): AuthErrorKey => {
  if (error instanceof Error && error.message === 'AUTH_TIMEOUT') return 'auth.errors.timeout';
  const code = error instanceof FirebaseError ? error.code : (error as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return 'auth.errors.invalidCredentials';
    case 'auth/email-already-in-use':
      return 'auth.errors.emailInUse';
    case 'auth/weak-password':
      return 'auth.errors.weakPassword';
    case 'auth/invalid-email':
      return 'auth.errors.invalidEmail';
    case 'auth/network-request-failed':
      return 'auth.errors.network';
    case 'auth/too-many-requests':
      return 'auth.errors.tooMany';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'auth.errors.disabled';
    default:
      return 'auth.errors.generic';
  }
};

const withTimeout = <T,>(promise: Promise<T>, ms = AUTH_TIMEOUT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AUTH_TIMEOUT')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const gamertagTakenLocally = (gamertag: string, exceptEmail: string) =>
  Object.values(readVault()).some(
    (acc) => acc.email !== exceptEmail && acc.displayName?.toLowerCase() === gamertag.toLowerCase()
  );

export const useAuthStore = create<AuthState & AuthActions>((set, get) => {
  /** Persist the non-sensitive session + saved-account entry and adopt any legacy local profile. */
  const establish = (profile: UserProfile) => {
    const email = profile.email?.toLowerCase() || '';
    const previous = readVault()[email];
    let next = profile;
    if (previous && previous.uid !== profile.uid && isLegacyLocalUid(previous.uid)) {
      migrateLocalData(previous.uid, profile.uid);
      next = { ...profile, photoURL: profile.photoURL || previous.photoURL, title: previous.title };
    } else if (previous && previous.uid === profile.uid) {
      next = { ...profile, photoURL: profile.photoURL || previous.photoURL, title: profile.title || previous.title };
    }
    cachedUser.write(next);
    if (email) saveAccount({ uid: next.uid, email, displayName: next.displayName, photoURL: next.photoURL, title: next.title });
    set({ user: next, isAuthLoading: false, authError: null });
  };

  const fromFirebase = (u: User, displayName?: string): UserProfile => ({
    uid: u.uid,
    email: u.email,
    displayName: displayName ?? u.displayName,
    photoURL: u.photoURL,
  });

  const fail = (key: AuthErrorKey) => {
    set({ authError: key });
    return false;
  };

  return {
    user: cachedUser.read<UserProfile>(),
    isAuthLoading: !cachedUser.read<UserProfile>(),
    authError: null,

    initAuthListener: () => {
      sanitizeVault();

      if (!isFirebaseConfigured) {
        // Local demo mode: the cached profile is the session.
        set({ user: cachedUser.read<UserProfile>(), isAuthLoading: false });
        return () => {};
      }

      const watchdog = setTimeout(() => {
        if (get().isAuthLoading) set({ isAuthLoading: false });
      }, 4000);

      return onAuthStateChanged(auth, (firebaseUser) => {
        clearTimeout(watchdog);
        if (firebaseUser) {
          const cached = cachedUser.read<UserProfile>();
          const extras = cached?.uid === firebaseUser.uid ? cached : null;
          const profile: UserProfile = {
            ...fromFirebase(firebaseUser),
            displayName: firebaseUser.displayName || extras?.displayName || null,
            photoURL: extras?.photoURL || firebaseUser.photoURL,
            bio: extras?.bio,
            title: extras?.title,
          };
          cachedUser.write(profile);
          set({ user: profile, isAuthLoading: false });
        } else {
          // No Firebase session means signed out. Profiles created by old builds without a
          // real account stay listed under "saved accounts" but can no longer open a session.
          cachedUser.clear();
          set({ user: null, isAuthLoading: false });
        }
      });
    },

    signInWithEmail: async (email, pass) => {
      set({ authError: null });
      const emailLower = email.trim().toLowerCase();

      if (!isFirebaseConfigured) {
        const account = readVault()[emailLower];
        if (!account || !demoAuth.has(emailLower)) return fail('auth.errors.noAccount');
        try {
          if (!(await demoAuth.verify(emailLower, pass))) return fail('auth.errors.invalidCredentials');
        } catch {
          return fail('auth.errors.generic');
        }
        establish({ ...account });
        return true;
      }

      try {
        const cred = await withTimeout(signInWithEmailAndPassword(auth, emailLower, pass));
        establish(fromFirebase(cred.user));
        return true;
      } catch (error) {
        return fail(errorKey(error));
      }
    },

    signUpWithEmail: async (email, pass, username) => {
      set({ authError: null });
      const emailLower = email.trim().toLowerCase();
      const gamertag = username.trim();

      if (!GAMERTAG_RE.test(gamertag)) return fail('auth.validation.gamertagRule');
      if (!EMAIL_RE.test(emailLower)) return fail('auth.validation.emailInvalid');
      if (pass.length < 6) return fail('auth.validation.passwordShort');
      if (gamertagTakenLocally(gamertag, emailLower)) return fail('auth.errors.gamertagTaken');

      if (!isFirebaseConfigured) {
        if (demoAuth.has(emailLower)) return fail('auth.errors.emailInUse');
        try {
          await demoAuth.register(emailLower, pass);
        } catch {
          return fail('auth.errors.generic');
        }
        establish({ uid: `demo-${Date.now()}`, email: emailLower, displayName: gamertag, photoURL: null });
        return true;
      }

      try {
        const cred = await withTimeout(createUserWithEmailAndPassword(auth, emailLower, pass));

        // Gamertags are unique across accounts. The lookup needs a signed-in user, so it
        // runs right after creation and rolls the new account back if the tag is taken.
        const existing = await findPublicProfileByGamertag(gamertag);
        if (existing && existing.uid !== cred.user.uid) {
          await cred.user.delete().catch(() => signOut(auth).catch(() => {}));
          return fail('auth.errors.gamertagTaken');
        }

        await updateProfile(cred.user, { displayName: gamertag }).catch(() => {});
        establish(fromFirebase(cred.user, gamertag));
        return true;
      } catch (error) {
        return fail(errorKey(error));
      }
    },

    sendPasswordReset: async (email) => {
      const emailLower = email.trim().toLowerCase();
      if (!EMAIL_RE.test(emailLower)) return 'auth.validation.emailInvalid';
      if (!isFirebaseConfigured) return 'auth.forgotDemo';
      try {
        await withTimeout(sendPasswordResetEmail(auth, emailLower));
        return null;
      } catch (error) {
        const key = errorKey(error);
        // Do not reveal whether an address is registered.
        return key === 'auth.errors.invalidCredentials' ? null : key;
      }
    },

    logout: async () => {
      cachedUser.clear();
      set({ user: null, authError: null });
      if (isFirebaseConfigured) {
        await signOut(auth).catch(() => {});
      }
    },

    deleteAccount: async (password) => {
      const user = get().user;
      if (!user) return 'error';

      if (isFirebaseConfigured) {
        const current = auth.currentUser;
        if (!current || current.uid !== user.uid) return 'error';
        try {
          if (password && current.email) {
            await withTimeout(reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password)));
          }
          await deleteUserCloudData(user.uid);
          await withTimeout(current.delete());
        } catch (error) {
          const code = (error as { code?: string })?.code;
          if (code === 'auth/requires-recent-login') return 'reauth';
          return 'error';
        }
      } else if (user.email) {
        demoAuth.remove(user.email.toLowerCase());
      }

      clearLocalUserData(user.uid);
      removeAccount(user.email);
      cachedUser.clear();
      set({ user: null, authError: null });
      return 'ok';
    },

    updateUserProfile: async (data) => {
      const user = get().user;
      if (!user) return;

      const next: UserProfile = { ...user, ...data };
      set({ user: next });
      cachedUser.write(next);
      if (next.email) {
        saveAccount({ uid: next.uid, email: next.email, displayName: next.displayName, photoURL: next.photoURL, title: next.title });
      }

      if (isFirebaseConfigured && auth.currentUser?.uid === next.uid) {
        if (data.displayName !== undefined && data.displayName !== auth.currentUser.displayName) {
          updateProfile(auth.currentUser, { displayName: data.displayName }).catch(() => {});
        }
        // Avatars may be data URLs, too large for the Auth profile: they live in the user's own doc.
        await syncUserProfileToCloud(next.uid, { bio: next.bio, title: next.title, photoURL: next.photoURL });
      }
    },

    clearError: () => set({ authError: null }),
  };
});
