/**
 * PROTEINX — Global Application Script
 * Theme, Auth State, Cart Drawer, Toasts, Search Modal, Header/Footer
 */

window.API_BASE = window.API_BASE || (window.location.port === '5000' ? '/api' : 'http://localhost:5000/api');
var API_BASE = window.API_BASE;

// === UNIFIED PRODUCT IMAGE RESOLVER ===
function normalizeProductImgUrl(url) {
  if (!url || typeof url !== 'string') return '/assets/images/Createin Monohydrate.jpeg';
  url = url.trim();
  if (url.startsWith('./images/')) return '/assets/' + url.slice(2);
  if (url.startsWith('assets/')) return '/' + url;
  if (url.startsWith('uploads/')) return '/' + url;
  return url;
}
window.normalizeProductImgUrl = normalizeProductImgUrl;

function getProductImage(product) {
  if (!product) return '/assets/images/Createin Monohydrate.jpeg';

  // If passed a direct string URL
  if (typeof product === 'string') {
    return normalizeProductImgUrl(product);
  }

  // 1. Check images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find(img => img && (img.isPrimary || img.isMain));
    if (primary) {
      const url = typeof primary === 'string' ? primary : primary.url;
      if (url) return normalizeProductImgUrl(url);
    }
    const first = product.images[0];
    const firstUrl = typeof first === 'string' ? first : (first && first.url);
    if (firstUrl) return normalizeProductImgUrl(firstUrl);
  }

  // 2. Check direct image fields
  if (product.imageUrl) return normalizeProductImgUrl(product.imageUrl);
  if (product.image) return normalizeProductImgUrl(product.image);

  // 3. Fallback
  return '/assets/images/Createin Monohydrate.jpeg';
}
window.getProductImage = getProductImage;

// === 3-WAY THEME MANAGEMENT (Light / Dark / System) ===
let systemMediaListener = null;

function applyThemeMode(mode) {
  let effective = mode;
  if (mode === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (!systemMediaListener) {
      systemMediaListener = (e) => {
        if (localStorage.getItem('proteinx_theme') === 'system') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
          updateThemeIcon('system');
        }
      };
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', systemMediaListener);
    }
  }
  document.documentElement.setAttribute('data-theme', effective);
  updateThemeIcon(mode);
}

function initTheme() {
  const saved = localStorage.getItem('proteinx_theme') || 'system';
  applyThemeMode(saved);
  loadStoreAppearanceSettings();
}

function toggleTheme() {
  const current = localStorage.getItem('proteinx_theme') || 'system';
  const modes = ['light', 'dark', 'system'];
  const nextIdx = (modes.indexOf(current) + 1) % modes.length;
  const next = modes[nextIdx];
  localStorage.setItem('proteinx_theme', next);
  applyThemeMode(next);
  const labels = { light: '☀️ Light Theme', dark: '🌙 Dark Theme', system: '💻 System Theme' };
  showToast(labels[next] || next, 'info');
}

function updateThemeIcon(mode) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  if (mode === 'dark') {
    btn.setAttribute('title', 'Theme: Dark (Click for System)');
    btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
  } else if (mode === 'light') {
    btn.setAttribute('title', 'Theme: Light (Click for Dark)');
    btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
  } else {
    btn.setAttribute('title', 'Theme: System Match (Click for Light)');
    btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
  }
}

// === DYNAMIC STORE APPEARANCE LOADER ===
async function loadStoreAppearanceSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    if (!data.success || !data.settings) return;
    const ts = data.settings.themeSettings;
    if (!ts) return;

    const root = document.documentElement;
    if (ts.primaryColor) {
      root.style.setProperty('--primary', ts.primaryColor);
      root.style.setProperty('--brand', ts.primaryColor);
    }
    if (ts.secondaryColor) root.style.setProperty('--secondary', ts.secondaryColor);
    if (ts.accentColor) root.style.setProperty('--accent', ts.accentColor);
    if (ts.borderRadius) root.style.setProperty('--radius', ts.borderRadius);
    if (ts.headerColor) root.style.setProperty('--header-bg', ts.headerColor);
    if (ts.footerColor) root.style.setProperty('--footer-bg', ts.footerColor);
    if (ts.defaultTheme && !localStorage.getItem('proteinx_theme')) {
      applyThemeMode(ts.defaultTheme);
    }
  } catch (e) {
    console.debug('Appearance settings notice:', e);
  }
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// === AUTHENTICATION HELPERS ===
function getToken() {
  return localStorage.getItem('proteinx_token') || localStorage.getItem('token') || '';
}

function getUser() {
  const u = localStorage.getItem('proteinx_user') || localStorage.getItem('user');
  try { return u ? JSON.parse(u) : null; } catch { return null; }
}

function setAuth(token, user) {
  localStorage.setItem('proteinx_token', token);
  localStorage.setItem('proteinx_user', JSON.stringify(user));
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateNavAuth();
}

function logout() {
  localStorage.removeItem('proteinx_token');
  localStorage.removeItem('proteinx_user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    const inAdmin = window.location.pathname.includes('/admin');
    window.location.href = inAdmin ? 'login.html' : 'login.html';
  }, 500);
}

function updateNavAuth() {
  const user = getUser();
  const authLinks = document.querySelectorAll('.auth-required-nav');
  const guestLinks = document.querySelectorAll('.guest-required-nav');
  const userGreeting = document.getElementById('nav-user-name');

  if (user) {
    authLinks.forEach(el => el.classList.remove('hidden'));
    guestLinks.forEach(el => el.classList.add('hidden'));
    if (userGreeting) userGreeting.textContent = user.name.split(' ')[0];
    if (user.role === 'admin') {
      document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.remove('hidden'));
    }
  } else {
    authLinks.forEach(el => el.classList.add('hidden'));
    guestLinks.forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.add('hidden'));
  }
}

// === WISHLIST SYSTEM ===
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem('proteinx_wishlist') || '[]');
  } catch {
    return [];
  }
}

function toggleWishlist(product) {
  let list = getWishlist();
  const idx = list.findIndex(item => item._id === product._id || item.id === product._id);
  
  if (idx > -1) {
    list.splice(idx, 1);
    showToast('Removed from Wishlist', 'info');
  } else {
    list.push({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      basePrice: product.basePrice,
      mrp: product.mrp,
      discountPercent: product.discountPercent,
      images: product.images,
      rating: product.rating
    });
    showToast('Added to Wishlist!', 'success');
  }

  localStorage.setItem('proteinx_wishlist', JSON.stringify(list));
  updateBadges();

  // If user is logged in, sync with backend asynchronously
  if (getToken()) {
    fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ productId: product._id })
    }).catch(() => {});
  }
}

function isInWishlist(productId) {
  const list = getWishlist();
  return list.some(item => item._id === productId || item.id === productId);
}

// === CART SYSTEM ===
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('proteinx_cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('proteinx_cart', JSON.stringify(cart));
  updateBadges();
  renderCartDrawer();
  if (typeof window.triggerCartBounce === 'function') {
    window.triggerCartBounce();
  }
}

function addToCart(product, variant = null, quantity = 1) {
  const cart = getCart();
  const variantId = variant ? variant._id || variant.sku : 'default';
  const itemIndex = cart.findIndex(i => i.productId === product._id && i.variantId === variantId);

  const price = variant ? variant.price : product.basePrice;
  const image = getProductImage(product);

  if (itemIndex > -1) {
    cart[itemIndex].quantity += quantity;
  } else {
    cart.push({
      productId: product._id,
      variantId,
      name: product.name,
      brand: product.brand,
      price,
      quantity,
      image,
      flavor: variant ? variant.flavor : '',
      size: variant ? variant.size : ''
    });
  }

  saveCart(cart);
  if (typeof window.triggerCartBounce === 'function') {
    window.triggerCartBounce();
  }
  showToast('Added to cart', 'success');
  openCartDrawer();
}

function updateCartQty(productId, variantId, delta) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.productId === productId && i.variantId === variantId);
  if (idx > -1) {
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) {
      cart.splice(idx, 1);
    }
    saveCart(cart);
  }
}

function removeFromCart(productId, variantId) {
  let cart = getCart();
  cart = cart.filter(i => !(i.productId === productId && i.variantId === variantId));
  saveCart(cart);
  showToast('Item removed from cart', 'info');
}

function getCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, shipping, total, count };
}

function updateBadges() {
  const cartTotals = getCartTotals();
  const wishlist = getWishlist();

  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = cartTotals.count;
    b.style.display = cartTotals.count > 0 ? 'flex' : 'none';
  });

  document.querySelectorAll('.wishlist-badge').forEach(b => {
    b.textContent = wishlist.length;
    b.style.display = wishlist.length > 0 ? 'flex' : 'none';
  });
}

// === CART DRAWER UI ===
function openCartDrawer() {
  renderCartDrawer();
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

function renderCartDrawer() {
  const body = document.getElementById('cart-drawer-items');
  const footer = document.getElementById('cart-drawer-footer');
  if (!body) return;

  const cart = getCart();
  const totals = getCartTotals();

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p style="font-weight: 600; margin-bottom: 8px;">Your cart is empty</p>
        <p style="font-size: 0.85rem; margin-bottom: 20px;">Add items to your cart to checkout.</p>
        <a href="shop.html" class="btn btn-primary btn-sm" onclick="closeCartDrawer()">Start Shopping</a>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.flavor ? item.flavor + ' | ' : ''}${item.size || ''}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="updateCartQty('${item.productId}', '${item.variantId}', -1)">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.productId}', '${item.variantId}', 1)">+</button>
          <button class="cart-remove-btn" onclick="removeFromCart('${item.productId}', '${item.variantId}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('drawer-subtotal');
  const shippingEl = document.getElementById('drawer-shipping');
  const totalEl = document.getElementById('drawer-total');

  if (subtotalEl) subtotalEl.textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
  if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`;
  if (totalEl) totalEl.textContent = `₹${totals.total.toLocaleString('en-IN')}`;
}

// === SEARCH MODAL ===
function openSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) {
    modal.classList.add('open');
    const input = document.getElementById('search-input-modal');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
  }
}

function closeSearchModal() {
  const modal = document.getElementById('search-modal');
  if (modal) modal.classList.remove('open');
}

let searchTimer;
function handleSearchInput(e) {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  const resultsContainer = document.getElementById('search-results-modal');
  if (!resultsContainer) return;

  if (q.length < 2) {
    resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">Type at least 2 characters to search...</div>';
    return;
  }

  resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center;"><div class="loading-spinner"></div></div>';

  searchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();

      if (!data.success || !data.products.length) {
        resultsContainer.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No products found for "${q}"</div>`;
        return;
      }

      resultsContainer.innerHTML = data.products.map(p => {
        const img = getProductImage(p);
        const priceDisplay = (p.priceNotConfigured || p.basePrice === 0) 
          ? '<span style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Price not configured</span>'
          : `₹${p.basePrice.toLocaleString('en-IN')}`;
        return `
          <a href="product.html?slug=${p.slug}" class="search-result-item" onclick="closeSearchModal()">
            <img src="${img}" alt="${p.name}" class="search-result-img" style="object-fit: contain; padding: 4px;">
            <div class="search-result-info">
              <div class="search-result-name">${p.name}</div>
              <div class="search-result-brand">${p.brand}</div>
            </div>
            <div class="search-result-price">${priceDisplay}</div>
          </a>
        `;
      }).join('');
    } catch {
      resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: #DC2626;">Error loading search results</div>';
    }
  }, 250);
}

// === MOBILE MENU ===
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// === DOM INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateNavAuth();
  updateBadges();

  // Scroll listener for sticky header
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
  });

  // Search input binding
  const searchInput = document.getElementById('search-input-modal');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }
});

// === GLOBAL NAVIGATION HELPER (Back & Home) ===
function goBack() {
  if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

// === STOCK NOTIFICATION MODAL ===
function openNotifyModal(productId, productName) {
  let modal = document.getElementById('notify-stock-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'notify-stock-modal';
    modal.className = 'notify-modal-overlay';
    modal.innerHTML = `
      <div class="notify-modal">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <h3 style="font-size: 1.15rem; font-weight: 800;" data-i18n="notify_modal_title">Get Notified When Available</h3>
          <button onclick="closeNotifyModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 18px;" id="notify-modal-product-name"></p>
        <form onsubmit="handleNotifySubmit(event)">
          <input type="hidden" id="notify-product-id">
          <div class="form-group">
            <label class="form-label">Your Email Address</label>
            <input type="email" id="notify-email-input" class="form-control" placeholder="name@example.com" required>
          </div>
          <button type="submit" class="btn btn-primary w-full" id="notify-submit-btn" data-i18n="notify_btn_submit">Notify Me</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('notify-product-id').value = productId;
  document.getElementById('notify-modal-product-name').textContent = `We will alert you as soon as "${productName}" is back in stock.`;
  modal.classList.add('active');
  setTimeout(() => document.getElementById('notify-email-input')?.focus(), 100);
}

function closeNotifyModal() {
  const modal = document.getElementById('notify-stock-modal');
  if (modal) modal.classList.remove('active');
}

async function handleNotifySubmit(e) {
  e.preventDefault();
  const productId = document.getElementById('notify-product-id').value;
  const email = document.getElementById('notify-email-input').value.trim();
  const btn = document.getElementById('notify-submit-btn');

  btn.disabled = true;
  btn.textContent = 'Subscribing...';

  try {
    const res = await fetch(`${API_BASE}/products/notify-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, email })
    });
    const data = await res.json();
    closeNotifyModal();
    showToast(data.message || 'Notification alert set!', 'success');
  } catch {
    closeNotifyModal();
    showToast('Notification alert registered!', 'success');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Notify Me';
  }
}

// === BUTTON MICRO-INTERACTION FEEDBACK ===
function triggerCartButtonSuccess(btn) {
  if (!btn || btn.dataset.animating) return;
  btn.dataset.animating = 'true';
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('btn-cart-success');
  btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;">✓ Added</span>`;
  if (typeof window.triggerCartBounce === 'function') {
    window.triggerCartBounce();
  }
  setTimeout(() => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    btn.classList.remove('btn-cart-success');
    delete btn.dataset.animating;
  }, 1200);
}

// === QUICK ADD TO CART HELPER ===
async function quickAddToCart(productId, btn = null) {
  try {
    let p = window.productCache?.[productId];
    if (!p) {
      const res = await fetch(`${API_BASE}/products?limit=50`);
      const data = await res.json();
      if (data.products) {
        p = data.products.find(item => item._id === productId);
      }
    }
    if (p) {
      const stock = p.stock !== undefined ? p.stock : (p.variants?.[0]?.stock ?? 25);
      if (stock === 0) {
        openNotifyModal(p._id, p.name);
        return;
      }
      addToCart(p, p.variants?.[0] || null, 1);
      if (btn) {
        triggerCartButtonSuccess(btn);
      }
    }
  } catch (err) {
    console.error('Error in quickAddToCart:', err);
  }
}

// === PRODUCT COMPARISON MANAGER ===
window.toggleCompare = function(productId, productName) {
  let compareList = [];
  try {
    const raw = localStorage.getItem('proteinx_compare_list');
    if (raw) compareList = JSON.parse(raw);
  } catch (e) {
    compareList = [];
  }

  const idx = compareList.indexOf(productId);
  if (idx > -1) {
    compareList.splice(idx, 1);
    localStorage.setItem('proteinx_compare_list', JSON.stringify(compareList));
    showToast(`${productName || 'Product'} removed from comparison`, 'info');
  } else {
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 products at a time.', 'warning');
      return;
    }
    compareList.push(productId);
    localStorage.setItem('proteinx_compare_list', JSON.stringify(compareList));
    showToast(`"${productName || 'Product'}" added to comparison! <a href="compare.html" style="color:var(--brand);font-weight:700;text-decoration:underline;margin-left:4px;">Compare Now →</a>`, 'success');
  }
};

// === RECENTLY VIEWED ===
const RECENTLY_VIEWED_KEY = 'proteinx_recently_viewed';
const MAX_RECENTLY_VIEWED = 8;

function addToRecentlyViewed(product) {
  if (!product || !product._id) return;
  try {
    let items = getRecentlyViewed();
    // Remove duplicate
    items = items.filter(p => p._id !== product._id);
    // Add to front
    items.unshift({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      image: getProductImage(product),
      basePrice: product.basePrice,
      rating: product.rating,
      viewedAt: Date.now()
    });
    // Trim to max
    items = items.slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
  } catch (e) { console.warn('addToRecentlyViewed error:', e); }
}

function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// === CONTEXT-AWARE WHATSAPP SUPPORT ===
function getWhatsAppContextMessage() {
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);

  // 1. Product Detail Page
  if (path.includes('product.html')) {
    const prodTitle = document.getElementById('product-title')?.textContent?.trim() ||
                      document.getElementById('product-name')?.textContent?.trim() ||
                      document.querySelector('.product-title')?.textContent?.trim() ||
                      document.querySelector('h1')?.textContent?.trim();
    if (prodTitle) {
      return `Hello, I need help regarding ${prodTitle}.`;
    }
    const slug = params.get('slug') || params.get('id');
    if (slug) {
      return `Hello, I need help regarding product: ${slug}.`;
    }
    return `Hello, I have a question about this product.`;
  }

  // 2. Order Details / Tracking / Account Page
  if (path.includes('tracking.html') || path.includes('account.html') || path.includes('orders.html')) {
    const orderId = params.get('id') || params.get('orderId') || params.get('order');
    if (orderId) {
      return `Hello, I need help regarding Order #${orderId}.`;
    }
    return `Hello, I need help regarding my order status.`;
  }

  // 3. Cart / Checkout Page
  if (path.includes('cart.html') || path.includes('checkout.html')) {
    return `Hello, I need assistance with my cart and checkout.`;
  }

  // 4. Default / General Store Inquiry
  return `Hello, I have an inquiry regarding NUTRATEIN supplements.`;
}

function injectWhatsAppButton() {
  if (document.getElementById('whatsapp-float')) return;
  fetch('/api/settings').then(r => r.json()).then(data => {
    const settings = data.settings || {};
    const rawNum = settings.whatsappNumber;
    // Hide button if disabled in admin or no number configured
    if (settings.whatsappEnabled === false || !rawNum || !rawNum.trim() || rawNum.trim() === '0') {
      const existing = document.getElementById('whatsapp-float');
      if (existing) existing.remove();
      return;
    }
    let num = (rawNum || '').replace(/[^0-9]/g, '');
    if (num.length === 10) num = '91' + num;
    if (!num) num = '919321598094';

    const message = getWhatsAppContextMessage();
    const btn = document.createElement('a');
    btn.id = 'whatsapp-float';
    btn.className = 'whatsapp-float';
    btn.href = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.title = 'Chat with us on WhatsApp';
    btn.setAttribute('aria-label', 'Chat with us on WhatsApp');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      <span class="whatsapp-label">Chat with us</span>
    `;
    
    // Update dynamically before click
    btn.addEventListener('click', () => {
      const liveMsg = getWhatsAppContextMessage();
      btn.href = `https://wa.me/${num}?text=${encodeURIComponent(liveMsg)}`;
    });
    
    document.body.appendChild(btn);
  }).catch(() => {
    // Do not inject button if settings call fails
  });
}

// === FITNESS VIDEO CONTROLS ===
window.toggleFitnessVideo = function() {
  const video = document.getElementById('fitness-lifestyle-video');
  const btn = document.getElementById('fitness-video-btn');
  if (!video) return;
  if (video.paused) {
    video.play();
    if (btn) {
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        <span>Pause Video</span>
      `;
    }
  } else {
    video.pause();
    if (btn) {
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
        <span>Play Video</span>
      `;
    }
  }
};

// === COMPACT HEADER ON SCROLL ===
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// === DESKTOP CUSTOM CURSOR ===
function initCustomCursor() {
  if (window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1023px)').matches) {
    return;
  }
  let dot = document.querySelector('.cursor-dot');
  let ring = document.querySelector('.cursor-ring');

  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
  }
  if (!ring) {
    ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);
  }

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let isVisible = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isVisible) {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '0.6';
    }
  });

  document.addEventListener('mouseleave', () => {
    isVisible = false;
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  function renderCursor() {
    if (isVisible) {
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      // Smooth trailing ring lerp
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
    }
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Hover triggers for links, buttons, cards
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, input, select, textarea, .btn, .product-card, .clickable');
    if (target) {
      if (target.closest('.product-card')) {
        ring.classList.add('cursor-product');
      } else {
        ring.classList.add('cursor-hover');
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, input, select, textarea, .btn, .product-card, .clickable');
    if (target) {
      ring.classList.remove('cursor-hover', 'cursor-product');
    }
  });
}

// === SCROLL REVEAL OBSERVER ===
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// === MOBILE BOTTOM NAVIGATION ===
function injectMobileBottomNav() {
  if (document.getElementById('mobile-bottom-nav')) return;
  const currentPath = window.location.pathname;
  const isActive = (path) => currentPath.includes(path) ? 'active' : '';
  const user = getUser();
  const cartCount = (() => {
    try { const c = JSON.parse(localStorage.getItem('proteinx_cart') || '[]'); return c.reduce((s, i) => s + (i.quantity || 1), 0); } catch { return 0; }
  })();
  const wishCount = (() => {
    try { const w = JSON.parse(localStorage.getItem('proteinx_wishlist') || '[]'); return w.length; } catch { return 0; }
  })();

  const nav = document.createElement('div');
  nav.id = 'mobile-bottom-nav';
  nav.className = 'mobile-bottom-nav';
  nav.innerHTML = `
    <div class="mobile-bottom-nav-inner">
      <a href="index.html" class="mobile-nav-item ${isActive('index') || currentPath === '/' ? 'active' : ''}">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span>Home</span>
      </a>
      <a href="shop.html" class="mobile-nav-item ${isActive('shop') ? 'active' : ''}">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <span>Shop</span>
      </a>
      <a href="wishlist.html" class="mobile-nav-item ${isActive('wishlist') ? 'active' : ''}">
        ${wishCount > 0 ? `<span class="mobile-nav-badge">${wishCount}</span>` : ''}
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        <span>Wishlist</span>
      </a>
      <button class="mobile-nav-item ${isActive('cart') ? 'active' : ''}" onclick="typeof openCartDrawer === 'function' ? openCartDrawer() : window.location.href = 'cart.html'">
        ${cartCount > 0 ? `<span class="mobile-nav-badge">${cartCount}</span>` : ''}
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        <span>Cart</span>
      </button>
      <a href="${user ? 'account.html' : 'login.html'}" class="mobile-nav-item ${isActive('account') ? 'active' : ''}">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span>${user ? user.name.split(' ')[0] : 'Account'}</span>
      </a>
    </div>
  `;
  document.body.appendChild(nav);
}

// === PWA SERVICE WORKER REGISTRATION ===
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.warn('SW registration failed:', err));
    });
  }
}

// === NEWSLETTER SUBSCRIPTION HANDLER ===
async function handleNewsletterSubmit(event, form) {
  if (event) event.preventDefault();
  if (!form) return;
  const input = form.querySelector('input[type="email"]');
  const btn = form.querySelector('button[type="submit"]');
  if (!input || !input.value.trim()) return;

  const email = input.value.trim();
  const originalBtnText = btn ? btn.innerHTML : 'Subscribe';

  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = 'Subscribing...';
    }

    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || '🎉 Subscribed! Check your email for your 10% discount code.', 'success');
      form.reset();
    } else {
      showToast(data.message || 'Could not subscribe. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Newsletter error:', err);
    showToast('Subscription request failed. Please try again later.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  }
}
window.handleNewsletterSubmit = handleNewsletterSubmit;

// === AUTO-INJECT ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  // Customer pages
  if (!window.location.pathname.includes('/admin')) {
    injectWhatsAppButton();
    injectMobileBottomNav();
    registerServiceWorker();
    initCustomCursor();
    initScrollReveal();
    initHeaderScroll();
  }
});
