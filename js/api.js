/**
 * api.js
 * Async client for FakeStoreAPI (https://fakestoreapi.com). Every export
 * returns a Promise and throws a plain Error with a readable message, so
 * callers only ever need one catch block.
 */

const API_BASE = 'https://fakestoreapi.com';

async function request(path, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status} ${res.statusText})`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out — check your connection and try again.');
    throw new Error(err.message || 'Network error — please try again.');
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchProducts() {
  return request('/products');
}

export async function fetchProductById(id) {
  return request(`/products/${encodeURIComponent(id)}`);
}

export async function fetchProductsByCategory(category) {
  return request(`/products/category/${encodeURIComponent(category)}`);
}

export async function fetchCategories() {
  return request('/products/categories');
}
