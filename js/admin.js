/**
 * admin.js
 * Page controller for admin.html. Full CRUD over "managed listings" —
 * FakeStoreAPI is read-only, so create/update/delete operate on
 * admin-owned data persisted locally via storage.js. Gated by auth.js's
 * isAdmin() (sign in as the username "admin" to reach this page).
 */

import { getItem, setItem } from './storage.js';
import { isAdmin } from './auth.js';

const LISTINGS_KEY = 'aperture_listings_v1';

function readAll() {
  return getItem(LISTINGS_KEY, []);
}
function writeAll(listings) {
  setItem(LISTINGS_KEY, listings);
}

export function createListing({ title, price, category }) {
  const listings = readAll();
  const listing = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    price: Number(price),
    category,
    createdAt: Date.now(),
  };
  listings.push(listing);
  writeAll(listings);
  return listing;
}

export function updateListing(id, patch) {
  const listings = readAll();
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error('Listing not found.');
  listings[idx] = { ...listings[idx], ...patch };
  writeAll(listings);
  return listings[idx];
}

export function deleteListing(id) {
  writeAll(readAll().filter((l) => l.id !== id));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function initAdminPage() {
  const gate = document.getElementById('adminGate');
  const panel = document.getElementById('adminPanel');
  const form = document.getElementById('adminForm');
  const list = document.getElementById('adminList');

  if (!isAdmin()) {
    gate.hidden = false;
    panel.hidden = true;
    return;
  }
  gate.hidden = true;
  panel.hidden = false;

  function render() {
    const listings = readAll();
    list.innerHTML = listings.length
      ? listings
          .map(
            (l) => `
        <li class="product-card" style="flex-direction:row; align-items:center; justify-content:space-between;">
          <span>${escapeHtml(l.title)} — $${l.price.toFixed(2)} <em style="color:var(--text-muted); font-style:normal; font-size:0.75rem;">(${escapeHtml(l.category)})</em></span>
          <span style="display:flex; gap: var(--space-2);">
            <button class="product-card__add" type="button" data-edit="${l.id}">Edit</button>
            <button class="error-banner__retry" type="button" data-delete="${l.id}">Delete</button>
          </span>
        </li>`
          )
          .join('')
      : `<li class="catalog-empty">No managed listings yet.</li>`;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('listingTitle').value.trim();
    const price = document.getElementById('listingPrice').value;
    const category = document.getElementById('listingCategory').value.trim() || 'general';
    if (!title || !price) return;
    createListing({ title, price, category });
    form.reset();
    render();
  });

  list.addEventListener('click', (e) => {
    const editBtn = e.target.closest('button[data-edit]');
    const delBtn = e.target.closest('button[data-delete]');
    if (editBtn) {
      const listing = readAll().find((l) => l.id === editBtn.dataset.edit);
      if (!listing) return;
      const newTitle = prompt('Title', listing.title);
      if (newTitle === null) return;
      const newPrice = prompt('Price', listing.price);
      if (newPrice === null) return;
      updateListing(listing.id, { title: newTitle.trim(), price: Number(newPrice) });
      render();
    }
    if (delBtn) {
      deleteListing(delBtn.dataset.delete);
      render();
    }
  });

  render();
}
