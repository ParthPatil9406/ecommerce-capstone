/**
 * storage.js
 * One tiny wrapper around localStorage so every other module fails soft
 * the same way (corrupted JSON, storage disabled, quota exceeded) instead
 * of each file reinventing its own try/catch.
 */

export function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota exceeded or storage disabled — caller keeps working in-memory
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
