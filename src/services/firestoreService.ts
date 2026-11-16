import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { Game } from '@/store/useGameStore';

export interface CloudProfile {
  bio?: string;
  title?: string;
  photoURL?: string | null;
}

export interface PublicProfile {
  uid: string;
  gamertag: string;
  gamertagLower: string;
  title: string;
  level: number;
  platinums: number;
  totalHours: number;
  updatedAt: string;
}

const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.warn('[firestore]', ...args);
};

/** Firestore rejects `undefined`; strip it from anything we write. */
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const syncUserProfileToCloud = async (uid: string, profile: CloudProfile) => {
  if (!isFirebaseConfigured || !uid) return;
  try {
    await setDoc(doc(db, 'users', uid), { profile: clean(profile), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    log('profile sync failed', error);
  }
};

export const fetchUserProfileFromCloud = async (uid: string): Promise<CloudProfile | null> => {
  if (!isFirebaseConfigured || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().profile as CloudProfile) || null : null;
  } catch (error) {
    log('profile fetch failed', error);
    return null;
  }
};

export const syncGamesToCloud = async (uid: string, games: Game[]) => {
  if (!isFirebaseConfigured || !uid) return;
  try {
    await setDoc(doc(db, 'users', uid), { games: clean(games), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    log('library sync failed', error);
  }
};

/** Returns null when the user has no cloud library yet (new account) or the read failed. */
export const fetchGamesFromCloud = async (uid: string): Promise<Game[] | null> => {
  if (!isFirebaseConfigured || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const games = snap.data().games;
    return Array.isArray(games) ? (games as Game[]) : null;
  } catch (error) {
    log('library fetch failed', error);
    return null;
  }
};

export const publishPublicProfile = async (
  uid: string,
  data: { gamertag: string; title: string; level: number; platinums: number; totalHours: number }
) => {
  if (!isFirebaseConfigured || !uid || !data.gamertag) return;
  try {
    const profile: PublicProfile = {
      uid,
      gamertag: data.gamertag,
      gamertagLower: data.gamertag.toLowerCase(),
      title: data.title,
      level: data.level,
      platinums: data.platinums,
      totalHours: data.totalHours,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'public_profiles', uid), profile);
  } catch (error) {
    log('public profile sync failed', error);
  }
};

/** Exact (case-insensitive) gamertag lookup. Null when not found or when rules/network block it. */
export const findPublicProfileByGamertag = async (gamertag: string): Promise<PublicProfile | null> => {
  if (!isFirebaseConfigured || !gamertag.trim()) return null;
  try {
    const q = query(collection(db, 'public_profiles'), where('gamertagLower', '==', gamertag.trim().toLowerCase()), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as PublicProfile);
  } catch (error) {
    log('gamertag lookup failed', error);
    return null;
  }
};

export const deleteUserCloudData = async (uid: string) => {
  if (!isFirebaseConfigured || !uid) return;
  await Promise.allSettled([deleteDoc(doc(db, 'users', uid)), deleteDoc(doc(db, 'public_profiles', uid))]);
};
