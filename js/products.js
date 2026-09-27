/**
 * products.js
 * Page controller for index.html (catalog: search/tabs/sort/grid) and
 * product.html (single item detail, read via ?id= in the URL). Both live
 * here since they're two views over the same data fetched through api.js.
 */

import { fetchProducts, fetchCategories, fetchProductById } from './api.js';
import { addToCart } from './cart.js';
import { renderNav } from './app.js';

const state = { all: [], category: 'all', query: '', sort: 'default' };

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getVisible() {
  let list = state.all;
  if (state.category !== 'all') list = list.filter((p) => p.category === state.category);
  if (state.query.trim()) {
    const q = state.query.trim().toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(q));
  }
  const sorted = [...list];
  if (state.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating-desc') sorted.sort((a, b) => b.rating.rate - a.rating.rate);
  return sorted;
}

function renderTabs(categories, tabsEl) {
  tabsEl.innerHTML = ['all', ...categories]
    .map(
      (cat) => `<button class="tab" type="button" data-category="${cat}"
        aria-current="${cat === state.category ? 'page' : 'false'}">${cat === 'all' ? 'All' : cat}</button>`
    )
    .join('');
}

function renderGrid(products, gridEl) {
  gridEl.innerHTML = products.length
    ? products
        .map(
          (p) => `
      <article class="product-card">
        <a href="product.html?id=${p.id}">
          <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy">
          <p class="product-card__title">${escapeHtml(p.title)}</p>
        </a>
        <p class="product-card__price">$${p.price.toFixed(2)}</p>
        <button class="product-card__add" type="button" data-id="${p.id}">Add to cart</button>
      </article>`
        )
        .join('')
    : `<p class="catalog-empty">No items match your search.</p>`;
}

function debounce(fn, delay) {
  let handle;
  return (...args) => {
    clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delay);
  };
}

export async function initCatalog() {
  const els = {
    grid: document.getElementById('catalogGrid'),
    skeleton: document.getElementById('catalogSkeleton'),
    error: document.getElementById('catalogError'),
    retry: document.getElementById('catalogRetry'),
    search: document.getElementById('catalogSearch'),
    tabs: document.getElementById('catalogTabs'),
    sort: document.getElementById('catalogSort'),
  };

  function show(mode) {
    els.skeleton.hidden = mode !== 'loading';
    els.grid.hidden = mode !== 'ready';
    els.error.hidden = mode !== 'error';
  }

  function refresh() {
    renderGrid(getVisible(), els.grid);
  }

  els.search.addEventListener('input', debounce((e) => { state.query = e.target.value; refresh(); }, 200));
  els.sort.addEventListener('change', (e) => { state.sort = e.target.value; refresh(); });
  els.tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-category]');
    if (!btn) return;
    state.category = btn.dataset.category;
    [...els.tabs.children].forEach((el) => el.setAttribute('aria-current', el === btn ? 'page' : 'false'));
    refresh();
  });
  els.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    addToCart(btn.dataset.id);
    renderNav();
  });
  els.retry.addEventListener('click', load);

  async function load() {
    show('loading');
    try {
      const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
      state.all = products;
      renderTabs(categories, els.tabs);
      refresh();
      show('ready');
    } catch (err) {
      els.error.querySelector('.error-banner__message').textContent = err.message;
      show('error');
    }
  }

  load();
}

export async function initProductDetail() {
  const root = document.getElementById('productDetail');
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    root.innerHTML = `<p class="catalog-empty">No product selected. <a href="index.html">Back to catalog</a></p>`;
    return;
  }

  try {
    const p = await fetchProductById(id);
    root.innerHTML = `
      <div class="product-detail">
        <img src="${p.image}" alt="${escapeHtml(p.title)}">
        <div>
          <h1 style="font-family: var(--font-display); font-size: var(--step-2); margin-top:0;">${escapeHtml(p.title)}</h1>
          <p style="color: var(--text-muted);">${escapeHtml(p.category)} · ★ ${p.rating.rate} (${p.rating.count})</p>
          <p class="card__figure" style="font-size: var(--step-3);">$${p.price.toFixed(2)}</p>
          <p>${escapeHtml(p.description)}</p>
          <button class="product-card__add" id="detailAdd" type="button">Add to cart</button>
        </div>
      </div>`;
    document.getElementById('detailAdd').addEventListener('click', () => {
      addToCart(p.id);
      renderNav();
    });
  } catch (err) {
    root.innerHTML = `<div class="error-banner"><span class="error-banner__message">${escapeHtml(err.message)}</span></div>`;
  }
}
