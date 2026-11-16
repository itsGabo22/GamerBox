/**
 * "Saved accounts on this device": a NON-SENSITIVE list used only to prefill the
 * login form and to find local profiles. It never stores passwords, hashes or tokens.
 * Older builds stored the password in plaintext here; sanitizeVault() strips it.
 */
export interface SavedAccount {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  title?: string;
}

const VAULT_KEY = 'gamerbox_accounts_vault';
const CACHED_USER_KEY = 'gamerbox_cached_user';

const hasWindow = () => typeof window !== 'undefined';

const pick = (raw: Record<string, unknown>): SavedAccount | null => {
  if (typeof raw?.uid !== 'string' || typeof raw?.email !== 'string') return null;
  return {
    uid: raw.uid,
    email: raw.email.toLowerCase(),
    displayName: typeof raw.displayName === 'string' ? raw.displayName : null,
    photoURL: typeof raw.photoURL === 'string' ? raw.photoURL : null,
    ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
  };
};

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const readVault = (): Record<string, SavedAccount> => {
  if (!hasWindow()) return {};
  const raw = safeParse<Record<string, Record<string, unknown>>>(localStorage.getItem(VAULT_KEY)) || {};
  const clean: Record<string, SavedAccount> = {};
  Object.values(raw).forEach((entry) => {
    const account = pick(entry);
    if (account) clean[account.email] = account;
  });
  return clean;
};

const writeVault = (vault: Record<string, SavedAccount>) => {
  if (hasWindow()) localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
};

/** One-time migration: rewrite the vault and the cached user without secrets. */
export const sanitizeVault = () => {
  if (!hasWindow()) return;
  const before = localStorage.getItem(VAULT_KEY);
  if (before) {
    const after = JSON.stringify(readVault());
    if (after !== before) localStorage.setItem(VAULT_KEY, after);
  }
  const cached = safeParse<Record<string, unknown>>(localStorage.getItem(CACHED_USER_KEY));
  if (cached && ('passwordHash' in cached || 'password' in cached)) {
    delete cached.passwordHash;
    delete cached.password;
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(cached));
  }
  localStorage.removeItem('demo_user');
};

export const listSavedAccounts = (): SavedAccount[] => Object.values(readVault());

export const saveAccount = (account: SavedAccount) => {
  const clean = pick(account as unknown as Record<string, unknown>);
  if (!clean) return;
  const vault = readVault();
  vault[clean.email] = clean;
  writeVault(vault);
};

export const removeAccount = (email: string | null | undefined) => {
  if (!email) return;
  const vault = readVault();
  delete vault[email.toLowerCase()];
  writeVault(vault);
};

/** Profiles created by old builds without a real Firebase account. */
export const isLegacyLocalUid = (uid: string) => uid.startsWith('local-') || uid.startsWith('google-');

const PER_USER_KEYS = ['gamerbox-storage', 'gamerbox-community-storage', 'gamerbox-notifications'];

/** Carry a legacy local profile's library over to the real account that replaces it. */
export const migrateLocalData = (fromUid: string, toUid: string) => {
  if (!hasWindow() || fromUid === toUid) return;
  PER_USER_KEYS.forEach((key) => {
    const from = localStorage.getItem(`${key}_${fromUid}`);
    if (from && !localStorage.getItem(`${key}_${toUid}`)) {
      localStorage.setItem(`${key}_${toUid}`, from);
    }
    localStorage.removeItem(`${key}_${fromUid}`);
  });
};

export const clearLocalUserData = (uid: string) => {
  if (!hasWindow()) return;
  [...PER_USER_KEYS, 'tutorial_done'].forEach((key) => localStorage.removeItem(`${key}_${uid}`));
};

export const cachedUser = {
  read<T>(): T | null {
    return hasWindow() ? safeParse<T>(localStorage.getItem(CACHED_USER_KEY)) : null;
  },
  write(user: unknown) {
    if (hasWindow()) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (hasWindow()) localStorage.removeItem(CACHED_USER_KEY);
  },
  uid(): string {
    return cachedUser.read<{ uid?: string }>()?.uid || 'guest';
  },
};

/** Storage adapter for zustand/persist that resolves the user key on every call. */
export const perUserStorage = () => ({
  // A user without stored data gets an empty envelope (instead of null) so persist still runs
  // `merge` and the previous account's in-memory state can never leak into the new one.
  getItem: (name: string) =>
    hasWindow() ? localStorage.getItem(`${name}_${cachedUser.uid()}`) ?? '{"state":{},"version":0}' : null,
  setItem: (name: string, value: string) => {
    if (hasWindow()) localStorage.setItem(`${name}_${cachedUser.uid()}`, value);
  },
  removeItem: (name: string) => {
    if (hasWindow()) localStorage.removeItem(`${name}_${cachedUser.uid()}`);
  },
});
