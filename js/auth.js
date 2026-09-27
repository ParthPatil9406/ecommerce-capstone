/**
 * auth.js
 * Simulated authentication — no real backend or password check. A
 * "session" is a username persisted via storage.js. Signing in as the
 * literal username "admin" (case-insensitive) unlocks admin.html; this is
 * a demo convenience, not a security boundary.
 */

import { getItem, setItem, removeItem } from './storage.js';

const SESSION_KEY = 'aperture_session_v1';

export function getCurrentUser() {
  const session = getItem(SESSION_KEY, null);
  return session ? session.username : null;
}

export function isAdmin() {
  const user = getCurrentUser();
  return !!user && user.toLowerCase() === 'admin';
}

export function login(username) {
  const clean = username.trim();
  if (!clean) throw new Error('Enter a username to sign in.');
  setItem(SESSION_KEY, { username: clean, since: Date.now() });
  return clean;
}

export function logout() {
  removeItem(SESSION_KEY);
}
