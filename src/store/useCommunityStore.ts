import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from './useAuthStore';

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
  status: 'ONLINE' | 'IN_GAME' | 'OFFLINE';
  currentGame?: string;
  isFriend: boolean;
  level?: number;
  platinums?: number;
  totalHours?: number;
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
}

interface CommunityState {
  posts: CommunityPost[];
  friends: FriendProfile[];
  isFetching: boolean;
}

interface CommunityActions {
  fetchPosts: () => Promise<void>;
  addPost: (postData: { gameTitle: string; rating: number; content: string }) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  addFriend: (uid: string) => void;
  removeFriend: (uid: string) => void;
}

const STARTER_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorUid: 'sys-1',
    authorName: 'NeonDrifter',
    authorAvatar: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80',
    authorTitle: 'SPEEDRUNNER',
    gameTitle: 'Neon White',
    rating: 5,
    content: 'Acabo de batir mi récord en la misión 4. Este juego es la definición de adrenalina pura. ¡Recomendadísimo para los fans del plataformeo rápido!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 42,
    likedByMe: false,
    comments: [
      { id: 'c1', authorName: 'AlexGhost', text: '¡Increíble tiempo! ¿Usaste atajos?', createdAt: new Date().toISOString() }
    ]
  },
  {
    id: 'post-2',
    authorUid: 'sys-2',
    authorName: 'V_Legend',
    authorAvatar: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=100&q=80',
    authorTitle: 'CYBER MERCENARY',
    gameTitle: 'Cyberpunk Redux',
    rating: 4,
    content: 'La nueva actualización lo cambia todo. Night City se siente por fin como nos la prometieron. Solo me faltan dos trofeos para el platino.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 128,
    likedByMe: false,
    comments: []
  }
];

const STARTER_FRIENDS: FriendProfile[] = [
  {
    uid: 'sys-1',
    gamertag: 'NeonDrifter',
    title: 'SPEEDRUNNER',
    photoURL: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80',
    status: 'IN_GAME',
    currentGame: 'Neon White',
    isFriend: true
  },
  {
    uid: 'sys-2',
    gamertag: 'V_Legend',
    title: 'CYBER MERCENARY',
    photoURL: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=100&q=80',
    status: 'ONLINE',
    isFriend: false
  }
];

export const useCommunityStore = create<CommunityState & CommunityActions>()(
  persist(
    (set) => ({
      posts: STARTER_POSTS,
      friends: STARTER_FRIENDS,
      isFetching: false,

      fetchPosts: async () => {
        if (!isFirebaseConfigured) return;
        set({ isFetching: true });
        try {
          const snapshot = await getDocs(collection(db, 'community_posts'));
          if (!snapshot.empty) {
            const fetchedPosts: CommunityPost[] = [];
            snapshot.forEach(doc => {
              fetchedPosts.push(doc.data() as CommunityPost);
            });
            // Sort newest first
            fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            set({ posts: fetchedPosts });
          }
        } catch (error) {
          console.warn('☁️ [Firestore] Background fetch failed (offline mode):', error);
        } finally {
          set({ isFetching: false });
        }
      },

      addPost: async (postData) => {
        const user = useAuthStore.getState().user;
        const newPost: CommunityPost = {
          id: `post-${Date.now()}`,
          authorUid: user?.uid || 'local-user',
          authorName: user?.displayName || 'Player One',
          authorAvatar: user?.photoURL || null,
          authorTitle: user?.title || 'GAMER',
          gameTitle: postData.gameTitle,
          rating: postData.rating,
          content: postData.content,
          createdAt: new Date().toISOString(),
          likes: 0,
          likedByMe: false,
          comments: []
        };

        set((state) => ({ posts: [newPost, ...state.posts] }));

        if (isFirebaseConfigured) {
          try {
            await setDoc(doc(db, 'community_posts', newPost.id), newPost);
          } catch (error) {
            console.warn('☁️ [Firestore] Post sync failed (will retry later):', error);
          }
        }
      },

      toggleLike: async (postId) => {
        let isLiking = false;

        set((state) => ({
          posts: state.posts.map(post => {
            if (post.id === postId) {
              isLiking = !post.likedByMe;
              return {
                ...post,
                likedByMe: isLiking,
                likes: isLiking ? post.likes + 1 : Math.max(0, post.likes - 1)
              };
            }
            return post;
          })
        }));

        if (isFirebaseConfigured) {
          try {
            const postRef = doc(db, 'community_posts', postId);
            await updateDoc(postRef, {
              likes: increment(isLiking ? 1 : -1)
            });
          } catch (error) {
            console.warn('☁️ [Firestore] Like sync failed:', error);
          }
        }
      },

      addComment: async (postId, text) => {
        const user = useAuthStore.getState().user;
        const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          authorName: user?.displayName || 'Player One',
          text,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          posts: state.posts.map(post => {
            if (post.id === postId) {
              return { ...post, comments: [...post.comments, newComment] };
            }
            return post;
          })
        }));

        if (isFirebaseConfigured) {
          try {
            const postRef = doc(db, 'community_posts', postId);
            await updateDoc(postRef, {
              comments: arrayUnion(newComment)
            });
          } catch (error) {
            console.warn('☁️ [Firestore] Comment sync failed:', error);
          }
        }
      },

      addFriend: (uid) => set((state) => ({
        friends: state.friends.map(f => f.uid === uid ? { ...f, isFriend: true } : f)
      })),

      removeFriend: (uid) => set((state) => ({
        friends: state.friends.map(f => f.uid === uid ? { ...f, isFriend: false } : f)
      }))
    }),
    {
      name: 'gamerbox-community-storage',
      // Dynamic storage key based on active user to isolate friends
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        const userStr = localStorage.getItem('gamerbox_cached_user');
        const uid = userStr ? JSON.parse(userStr).uid : 'guest';

        return {
          getItem: (name) => localStorage.getItem(`${name}_${uid}`),
          setItem: (name, value) => localStorage.setItem(`${name}_${uid}`, value),
          removeItem: (name) => localStorage.removeItem(`${name}_${uid}`)
        };
      })
    }
  )
);
