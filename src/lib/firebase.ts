import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.apiKey.length > 10
);

if (typeof window !== 'undefined') {
  if (isFirebaseConfigured) {
    console.log('🔐 [GamerBox Auth] Firebase Configured. Initializing...');
  } else {
    console.warn('🔐 [GamerBox Auth] Firebase variables missing. Falling back to DEMO LOCAL SESSION mode.');
  }
}

// Fallback config to prevent crash during 'npm run build' or if vars are missing
const safeConfig = isFirebaseConfigured ? firebaseConfig : {
  apiKey: "demo-key-demo-key-demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};

const app = getApps().length === 0 ? initializeApp(safeConfig) : getApp();
export const auth = getAuth(app);
