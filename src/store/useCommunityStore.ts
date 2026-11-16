import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, increment, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { perUserStorage, readVault } from '@/lib/accountVault';
import { findPublicProfileByGamertag } from '@/services/firestoreService';
import { translate } from '@/i18n/useTranslation';
import { useAuthStore } from './useAuthStore';
import { notify } from './useNotificationStore';

export interface Comment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface FriendProfile {
  uid: string;
  gamertag: string;
  title: string;
  photoURL: string | null;
  level?: number;
  platinums?: number;
  totalHours?: number;
  /** Fictional profile shipped with the app so the screen can be tried. */
  isSample?: boolean;
}

export interface CommunityPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string | null;
  authorTitle: string;
  gameTitle: string;
  rating: number;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  /** Local example content; never written to the cloud and hidden once real posts exist. */
  isSample?: boolean;
}

interface CommunityState {
  posts: CommunityPost[];
  /** Squad members only. */
  friends: FriendProfile[];
  isFetching: boolean;
}

interface CommunityActions {
  fetchPosts: () => Promise<void>;
  addPost: (postData: { gameTitle: string; rating: number; content: string }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  addFriend: (profile: FriendProfile) => void;
  removeFriend: (uid: string) => void;
  findPlayer: (gamertag: string) => Promise<FriendProfile | null>;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

const samplePosts = (): CommunityPost[] => [
  {
    id: 'sample-1',
    authorUid: 'sample-neondrifter',
    authorName: 'NeonDrifter',
    authorAvatar: null,
    authorTitle: 'Speedrunner',
    gameTitle: 'Hades II',
    rating: 5,
    content: 'community.samplePost1', // dictionary key, translated when rendered
    createdAt: hoursAgo(2),
    likes: 0,
    likedByMe: false,
    comments: [],
    isSample: true,
  },
  {
    id: 'sample-2',
    authorUid: 'sample-vlegend',
    authorName: 'V_Legend',
    authorAvatar: null,
    authorTitle: 'Lore master',
    gameTitle: 'Elden Ring',
    rating: 4,
    content: 'community.samplePost2',
    createdAt: hoursAgo(26),
    likes: 0,
    likedByMe: false,
    comments: [],
    isSample: true,
  },
];

export const SAMPLE_PLAYERS: FriendProfile[] = [
  { uid: 'sample-neondrifter', gamertag: 'NeonDrifter', title: 'Speedrunner', photoURL: null, level: 7, platinums: 9, totalHours: 412, isSample: true },
  { uid: 'sample-vlegend', gamertag: 'V_Legend', title: 'Lore master', photoURL: null, level: 4, platinums: 3, totalHours: 188, isSample: true },
];

type CloudPost = Omit<CommunityPost, 'likedByMe' | 'isSample'> & { likedBy?: string[] };

const toLocal = (data: CloudPost, uid?: string): CommunityPost => ({
  id: data.id,
  authorUid: data.authorUid,
  authorName: data.authorName || '—',
  authorAvatar: data.authorAvatar || null,
  authorTitle: data.authorTitle || '',
  gameTitle: data.gameTitle || '',
  rating: Math.min(5, Math.max(1, Number(data.rating) || 1)),
  content: data.content || '',
  createdAt: data.createdAt,
  likes: Math.max(0, Number(data.likes) || 0),
  likedByMe: Boolean(uid && data.likedBy?.includes(uid)),
  comments: Array.isArray(data.comments) ? data.comments : [],
});

const warn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.warn('[community]', ...args);
};

const mapPost = (posts: CommunityPost[], id: string, change: (p: CommunityPost) => CommunityPost) =>
  posts.map((p) => (p.id === id ? change(p) : p));

export const useCommunityStore = create<CommunityState & CommunityActions>()(
  persist(
    (set, get) => ({
      posts: samplePosts(),
      friends: [],
      isFetching: false,

      fetchPosts: async () => {
        if (!isFirebaseConfigured) return;
        set({ isFetching: true });
        try {
          const uid = useAuthStore.getState().user?.uid;
          const snapshot = await getDocs(collection(db, 'community_posts'));
          if (!snapshot.empty) {
            const fetched = snapshot.docs.map((d) => toLocal({ ...(d.data() as CloudPost), id: d.id }, uid));
            fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            set({ posts: fetched });
          }
        } catch (error) {
          warn('feed fetch failed, showing local copy', error);
        } finally {
          set({ isFetching: false });
        }
      },

      addPost: async ({ gameTitle, rating, content }) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const post: CommunityPost = {
          id: `post-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
          authorUid: user.uid,
          authorName: user.displayName || 'Player',
          // Data-URL avatars are too heavy to copy into every post; initials are used instead.
          authorAvatar: user.photoURL && !user.photoURL.startsWith('data:image/jpeg') ? user.photoURL : null,
          authorTitle: user.title || translate('profile.defaultTitle'),
          gameTitle: gameTitle.trim().slice(0, 120),
          rating: Math.min(5, Math.max(1, Math.round(rating))),
          content: content.trim().slice(0, 2000),
          createdAt: new Date().toISOString(),
          likes: 0,
          likedByMe: false,
          comments: [],
        };

        // The first real post retires the sample content.
        set((state) => ({ posts: [post, ...state.posts.filter((p) => !p.isSample)] }));

        if (isFirebaseConfigured) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { likedByMe, isSample, ...cloud } = post;
            await setDoc(doc(db, 'community_posts', post.id), { ...cloud, likedBy: [] });
          } catch (error) {
            warn('post sync failed', error);
          }
        }
      },

      deletePost: async (postId) => {
        const uid = useAuthStore.getState().user?.uid;
        const post = get().posts.find((p) => p.id === postId);
        if (!post || post.authorUid !== uid) return;
        set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
        if (isFirebaseConfigured) {
          await deleteDoc(doc(db, 'community_posts', postId)).catch((error) => warn('post delete failed', error));
        }
      },

      toggleLike: async (postId) => {
        const uid = useAuthStore.getState().user?.uid;
        const post = get().posts.find((p) => p.id === postId);
        if (!post || !uid) return;
        const liking = !post.likedByMe;

        set((state) => ({
          posts: mapPost(state.posts, postId, (p) => ({ ...p, likedByMe: liking, likes: Math.max(0, p.likes + (liking ? 1 : -1)) })),
        }));

        if (isFirebaseConfigured && !post.isSample) {
          try {
            await updateDoc(doc(db, 'community_posts', postId), {
              likes: increment(liking ? 1 : -1),
              likedBy: liking ? arrayUnion(uid) : arrayRemove(uid),
            });
          } catch (error) {
            warn('like sync failed', error);
          }
        }
      },

      addComment: async (postId, text) => {
        const user = useAuthStore.getState().user;
        const post = get().posts.find((p) => p.id === postId);
        const clean = text.trim().slice(0, 500);
        if (!user || !post || !clean) return;
        const comment: Comment = {
          id: `cmt-${Date.now()}`,
          authorName: user.displayName || 'Player',
          text: clean,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ posts: mapPost(state.posts, postId, (p) => ({ ...p, comments: [...p.comments, comment] })) }));

        if (isFirebaseConfigured && !post.isSample) {
          try {
            await updateDoc(doc(db, 'community_posts', postId), { comments: arrayUnion(comment) });
          } catch (error) {
            warn('comment sync failed', error);
          }
        }
      },

      addFriend: (profile) => {
        if (get().friends.some((f) => f.uid === profile.uid)) return;
        if (profile.uid === useAuthStore.getState().user?.uid) return;
        set((state) => ({ friends: [...state.friends, profile] }));
        notify({ type: 'FRIEND', titleKey: 'notifications.friendTitle', bodyKey: 'notifications.friendBody', params: { tag: profile.gamertag } });
      },

      removeFriend: (uid) => set((state) => ({ friends: state.friends.filter((f) => f.uid !== uid) })),

      /** Exact gamertag match: squad → sample profiles → cloud directory → accounts on this device. */
      findPlayer: async (gamertag) => {
        const tag = gamertag.trim().replace(/^@/, '').toLowerCase();
        if (!tag) return null;
        const me = useAuthStore.getState().user;

        const known = [...get().friends, ...SAMPLE_PLAYERS].find((f) => f.gamertag.toLowerCase() === tag);
        if (known) return known;

        const remote = await findPublicProfileByGamertag(tag);
        if (remote) {
          return {
            uid: remote.uid,
            gamertag: remote.gamertag,
            title: remote.title,
            photoURL: null,
            level: remote.level,
            platinums: remote.platinums,
            totalHours: remote.totalHours,
          };
        }

        const local = Object.values(readVault()).find((acc) => acc.displayName?.toLowerCase() === tag);
        if (local && local.uid !== me?.uid) {
          return { uid: local.uid, gamertag: local.displayName || tag, title: local.title || translate('community.defaultTitle'), photoURL: local.photoURL };
        }
        if (local && local.uid === me?.uid) {
          return { uid: local.uid, gamertag: local.displayName || tag, title: local.title || '', photoURL: local.photoURL };
        }
        return null;
      },
    }),
    {
      name: 'gamerbox-community-storage',
      storage: createJSONStorage(perUserStorage),
      skipHydration: true,
      version: 2,
      partialize: (state) => ({ posts: state.posts, friends: state.friends }),
      // v1 stored fabricated friends/posts mixed with real ones; keep only what the user chose.
      migrate: (persisted, version) => {
        const old = (persisted || {}) as { posts?: CommunityPost[]; friends?: (FriendProfile & { isFriend?: boolean })[] };
        if (version >= 2) return old as CommunityState;
        const realPosts = (old.posts || []).filter((p) => !['post-1', 'post-2'].includes(p.id));
        return {
          posts: realPosts.length ? realPosts : samplePosts(),
          friends: (old.friends || [])
            .filter((f) => f.isFriend && !f.uid.startsWith('sys-') && !f.uid.startsWith('dyn-'))
            .map((f) => ({ uid: f.uid, gamertag: f.gamertag, title: f.title, photoURL: f.photoURL, level: f.level, platinums: f.platinums, totalHours: f.totalHours })),
        } as CommunityState;
      },
      merge: (persisted, current) => {
        const saved = (persisted || {}) as Partial<CommunityState>;
        return {
          ...current,
          posts: saved.posts?.length ? saved.posts : samplePosts(),
          friends: saved.friends || [],
        };
      },
    }
  )
);
