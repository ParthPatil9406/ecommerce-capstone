/**
 * cart.js
 * Cart state: pure data functions over storage.js. Any page can import
 * these without pulling in DOM code — product.html calls addToCart(),
 * cart.html renders and mutates the whole cart, app.js just reads the count.
 */

import { getItem, setItem } from './storage.js';

const CART_KEY = 'aperture_cart_v1';

export function getCart() {
  return getItem(CART_KEY, {}); // { [productId]: qty }
}

function saveCart(cart) {
  setItem(CART_KEY, cart);
}

export function addToCart(productId, qty = 1) {
  const cart = getCart();
  cart[productId] = (cart[productId] || 0) + qty;
  saveCart(cart);
  return cart;
}

export function updateQty(productId, qty) {
  const cart = getCart();
  if (qty <= 0) {
    delete cart[productId];
  } else {
    cart[productId] = qty;
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart();
  delete cart[productId];
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart({});
}

export function getCartCount() {
  return Object.values(getCart()).reduce((sum, n) => sum + n, 0);
}

/* ---------------------------------------------------- cart.html page --- */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export async function initCartPage() {
  const { fetchProductById } = await import('./api.js');
  const { renderNav } = await import('./app.js');

  const listEl = document.getElementById('cartList');
  const emptyEl = document.getElementById('cartEmpty');
  const totalEl = document.getElementById('cartTotal');
  const errorEl = document.getElementById('cartError');

  async function render() {
    const cart = getCart();
    const ids = Object.keys(cart);

    if (ids.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      totalEl.textContent = '$0.00';
      return;
    }
    emptyEl.hidden = true;

    try {
      const products = await Promise.all(ids.map((id) => fetchProductById(id)));
      let total = 0;

      listEl.innerHTML = products
        .map((p) => {
          const qty = cart[p.id];
          total += p.price * qty;
          return `
          <li class="product-card" style="flex-direction:row; align-items:center; gap: var(--space-4);">
            <img src="${p.image}" alt="${escapeHtml(p.title)}" style="width:56px; height:56px; object-fit:contain; background:#fff; border-radius: var(--radius-sm);">
            <span style="flex:1; min-width:0;">${escapeHtml(p.title)}</span>
            <input type="number" min="1" value="${qty}" data-qty="${p.id}" style="width:64px; padding: var(--space-2); border:1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text);">
            <span style="width:80px; text-align:right;">$${(p.price * qty).toFixed(2)}</span>
            <button class="error-banner__retry" type="button" data-remove="${p.id}">Remove</button>
          </li>`;
        })
        .join('');

      totalEl.textContent = `$${total.toFixed(2)}`;
    } catch (err) {
      errorEl.hidden = false;
      errorEl.querySelector('.error-banner__message').textContent = err.message;
    }
  }

  listEl.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-qty]');
    if (!input) return;
    updateQty(input.dataset.qty, Number(input.value) || 0);
    renderNav();
    render();
  });

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-remove]');
    if (!btn) return;
    removeFromCart(btn.dataset.remove);
    renderNav();
    render();
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (Object.keys(getCart()).length === 0) return;
    alert('This is a simulated checkout — no payment is actually processed.');
    clearCart();
    renderNav();
    render();
  });

  render();
}
