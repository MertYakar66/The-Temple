import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Siri token management.
 *
 * Token flow:
 * 1. User generates a token in-app → stored in Firestore at two locations:
 *    - /users/{uid}/data/siriConfig  (user's own reference)
 *    - /siriTokens/{token}           (lookup index for Cloud Functions)
 * 2. User copies token into Apple Shortcuts
 * 3. Siri shortcut sends token as ?token= query param
 * 4. Cloud Function validates token → reads user data → responds with text
 */

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 8; i++) {
      segment += chars.charAt(randomValues[s * 8 + i] % chars.length);
    }
    segments.push(segment);
  }
  return segments.join('-');
}

export interface SiriConfig {
  token: string;
  createdAt: string;
  timezone?: string;
}

/** Load the user's existing Siri config */
export async function loadSiriConfig(uid: string): Promise<SiriConfig | null> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'siriConfig');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as SiriConfig;
    }
    return null;
  } catch (error) {
    console.error('Failed to load Siri config:', error);
    return null;
  }
}

/** Generate a new Siri token (revokes any previous one) */
export async function generateSiriToken(uid: string, timezone?: string): Promise<SiriConfig> {
  // Revoke old token if exists
  const existing = await loadSiriConfig(uid);
  if (existing?.token) {
    try {
      await deleteDoc(doc(db, 'siriTokens', existing.token));
    } catch {
      // old token cleanup is best-effort
    }
  }

  const token = generateToken();
  const config: SiriConfig = {
    token,
    createdAt: new Date().toISOString(),
    timezone,
  };

  // Write both docs
  await Promise.all([
    setDoc(doc(db, 'users', uid, 'data', 'siriConfig'), config),
    setDoc(doc(db, 'siriTokens', token), {
      userId: uid,
      createdAt: config.createdAt,
    }),
  ]);

  return config;
}

/** Revoke the user's Siri token */
export async function revokeSiriToken(uid: string): Promise<void> {
  const existing = await loadSiriConfig(uid);
  if (existing?.token) {
    await Promise.all([
      deleteDoc(doc(db, 'siriTokens', existing.token)),
      deleteDoc(doc(db, 'users', uid, 'data', 'siriConfig')),
    ]);
  }
}
