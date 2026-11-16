/**
 * Offline DEMO auth, used ONLY when no Firebase config is present (local dev / design review).
 * Stores a salted PBKDF2 verifier (never the password) so sign-in can be checked on-device.
 */
const KEY = 'gamerbox_demo_verifiers';

type Verifier = { salt: string; hash: string };

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

async function derive(password: string, saltHex: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('NO_CRYPTO');
  const salt = new Uint8Array((saltHex.match(/.{2}/g) || []).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 120000 }, key, 256);
  return toHex(new Uint8Array(bits));
}

const read = (): Record<string, Verifier> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};

export const demoAuth = {
  has: (email: string) => Boolean(read()[email]),
  async register(email: string, password: string) {
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const all = read();
    all[email] = { salt, hash: await derive(password, salt) };
    localStorage.setItem(KEY, JSON.stringify(all));
  },
  async verify(email: string, password: string) {
    const entry = read()[email];
    if (!entry) return false;
    return (await derive(password, entry.salt)) === entry.hash;
  },
  remove(email: string) {
    const all = read();
    delete all[email];
    localStorage.setItem(KEY, JSON.stringify(all));
  },
};
