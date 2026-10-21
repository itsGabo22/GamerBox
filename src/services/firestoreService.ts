import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Game } from '@/store/useGameStore';

/**
 * Guarda o actualiza la biblioteca completa de juegos del usuario en la nube.
 */
export const syncGamesToCloud = async (uid: string, games: Game[]) => {
  if (!isFirebaseConfigured || !uid) return;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      games,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`☁️ [Firestore] Biblioteca sincronizada en la nube (${games.length} juegos).`);
  } catch (error) {
    console.error('☁️ [Firestore] Error al sincronizar la biblioteca:', error);
  }
};

/**
 * Recupera la biblioteca de juegos de un usuario desde Firestore.
 * Devuelve null si el usuario es nuevo y no tiene ningún documento.
 */
export const fetchGamesFromCloud = async (uid: string): Promise<Game[] | null> => {
  if (!isFirebaseConfigured || !uid) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`☁️ [Firestore] Biblioteca descargada (${data.games?.length || 0} juegos).`);
      return data.games || [];
    } else {
      console.log('☁️ [Firestore] Nuevo usuario detectado. No se encontró biblioteca.');
      return null;
    }
  } catch (error) {
    console.error('☁️ [Firestore] Error al descargar la biblioteca:', error);
    return null;
  }
};
