/**
 * app.js
 * Included on every page. Wires the parts of the chrome that are the
 * same everywhere: the sign-in/sign-out nav slot, the cart count badge,
 * and the dark/light toggle. Page-specific logic (catalog, product
 * detail, cart table, admin CRUD) lives in products.js / cart.js /
 * admin.js and is loaded alongside this on the pages that need it.
 */

import { getCurrentUser, logout, isAdmin } from './auth.js';
import { getCartCount } from './cart.js';

function renderNav() {
  const authArea = document.getElementById('authArea');
  const cartCount = document.getElementById('cartCount');
  const adminLink = document.getElementById('adminLink');

  if (cartCount) {
    const count = getCartCount();
    cartCount.textContent = count;
    cartCount.hidden = count === 0;
  }

  if (adminLink) {
    adminLink.hidden = !isAdmin();
  }

  if (!authArea) return;
  const user = getCurrentUser();
  authArea.innerHTML = user
    ? `<span style="font-size:0.8125rem;">Hi, <strong>${escapeHtml(user)}</strong></span>
       <button class="btn-ghost" id="navLogout" type="button">Sign out</button>`
    : `<a class="btn-ghost" href="login.html">Sign in</a>`;

  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      renderNav();
      if (isAdmin() === false && location.pathname.endsWith('admin.html')) {
        location.href = 'login.html';
      }
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initTheme() {
  const btn = document.getElementById('themeToggle');
  const root = document.documentElement;
  if (!btn) return;

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    btn.textContent = mode === 'dark' ? 'Light mode' : 'Dark mode';
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(prefersDark ? 'dark' : 'light');
  btn.addEventListener('click', () => {
    apply(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

renderNav();
initTheme();

// exported so pages that mutate the cart (product.html, cart.html) can
// refresh the badge immediately without a full reload
export { renderNav };
