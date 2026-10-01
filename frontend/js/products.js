/**
 * PROTEINX — Products & Shop Module
 * Listing, Filtering, Single Product Details, Variant Selection, Reviews
 */

// Generate Star Rating HTML
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// Skeleton card generator
function renderSkeletonCards(count = 8) {
  return Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line medium"></div>
        <div class="skeleton skeleton-line full"></div>
        <div class="skeleton skeleton-price"></div>
      </div>
    </div>
  `).join('');
}

// Safe escape HTML helper
window.escapeHtml = window.escapeHtml || function(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

// Generate Product Card HTML
function createProductCard(p) {
  const img = typeof getProductImage === 'function' ? getProductImage(p) : ((p.images && p.images[0] && (p.images[0].url || p.images[0])) || p.image || '/assets/images/Createin Monohydrate.jpeg');
  const wishlisted = isInWishlist(p._id);

  const stock = p.stock !== undefined ? p.stock : (p.variants && p.variants[0] ? p.variants[0].stock : 25);
  const threshold = p.lowStockThreshold || 10;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= threshold;
  const isFlashSale = window.activeFlashSaleProductIds && window.activeFlashSaleProductIds.has(p._id);
  const isPriceUnconfigured = Boolean(p.priceNotConfigured || p.basePrice === 0);

  return `
    <div class="product-card card-hover-lift ${isOutOfStock ? 'out-of-stock-card' : ''}" data-id="${p._id}">
      <a href="product.html?slug=${p.slug}" class="product-card-image-wrap">
        <img src="${img}" alt="${p.name}" class="product-card-image" loading="lazy" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
        <div class="product-card-badges">
          ${isFlashSale ? '<span class="badge badge-brand" style="background:linear-gradient(135deg,#FF4E00,#E86C1A);color:#fff;">⚡ FLASH SALE</span>' : ''}
          ${isOutOfStock ? '<span class="badge badge-out-stock" data-i18n="out_of_stock">OUT OF STOCK</span>' : ''}
          ${!isOutOfStock && !isFlashSale && p.isBestSeller ? '<span class="badge badge-brand" data-i18n="bestseller">BESTSELLER</span>' : ''}
          ${!isOutOfStock && !isPriceUnconfigured && p.discountPercent > 0 ? `<span class="badge badge-green">${p.discountPercent}% OFF</span>` : ''}
          ${!isOutOfStock && p.isNew ? '<span class="badge badge-dark" data-i18n="new">NEW</span>' : ''}
        </div>
      </a>

      <div class="product-card-actions">
        <button class="product-action-btn ${wishlisted ? 'wishlisted' : ''}" title="Wishlist" onclick="toggleWishlistFromBtn(this, '${p._id}')">
          <svg fill="${wishlisted ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
        <button class="product-action-btn" title="Compare" onclick="toggleCompare('${p._id}', '${escapeHtml(p.name)}')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </button>
        <button class="product-action-btn" title="Quick View" onclick="openQuickView('${p.slug}')">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
      </div>

      <div class="product-card-body">
        <div class="product-card-brand">${p.brand || 'NUTRATEIN'}</div>
        <a href="product.html?slug=${p.slug}" class="product-card-name" title="${p.name}">${p.name}</a>
        
        <div class="product-card-rating">
          <span class="stars">${renderStars(p.rating || 4.5)}</span>
          <span class="rating-text">${(p.rating || 4.5).toFixed(1)} (${p.reviewCount || 0})</span>
        </div>

        <div class="stock-badge-wrap">
          ${isLowStock ? `<span class="stock-alert-low">⚡ Only ${stock} left in stock</span>` : ''}
          ${isOutOfStock ? `<span class="stock-alert-out">Currently Unavailable</span>` : ''}
          ${!isLowStock && !isOutOfStock ? `<span class="stock-alert-in">✓ In Stock</span>` : ''}
        </div>

        <div class="product-card-pricing">
          ${isPriceUnconfigured ? `
            <span class="price-current" style="color: var(--text-muted); font-size: 0.88rem; font-style: italic;">Price not configured</span>
          ` : `
            <span class="price-current">₹${p.basePrice.toLocaleString('en-IN')}</span>
            ${p.mrp > p.basePrice ? `<span class="price-mrp">₹${p.mrp.toLocaleString('en-IN')}</span>` : ''}
            ${p.discountPercent > 0 ? `<span class="price-discount">${p.discountPercent}% off</span>` : ''}
          `}
        </div>

        ${isOutOfStock 
          ? `<button class="btn-cart btn-notify" onclick="openNotifyModal('${p._id}', '${escapeHtml(p.name)}')">
              🔔 <span data-i18n="notify_me">Notify Me</span>
            </button>`
          : isPriceUnconfigured
            ? `<a href="product.html?slug=${p.slug}" class="btn-cart" style="background: var(--bg-2); color: var(--text-primary); border: 1px solid var(--border); text-align: center; justify-content: center; text-decoration: none;">
                <span>View Details</span>
              </a>`
            : `<button class="btn-cart btn-glow btn-shimmer" onclick="quickAddToCart('${p._id}', this)">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <span data-i18n="add_to_cart">Add to Cart</span>
              </button>`
        }
      </div>
    </div>
  `;
}

// Helper to toggle wishlist from card button
window.productCache = {};
function toggleWishlistFromBtn(btn, productId) {
  const p = window.productCache[productId];
  if (p) {
    toggleWishlist(p);
    const inWish = isInWishlist(productId);
    btn.classList.toggle('wishlisted', inWish);
    btn.querySelector('svg').setAttribute('fill', inWish ? 'currentColor' : 'none');
    if (inWish && typeof window.triggerWishlistPop === 'function') {
      window.triggerWishlistPop(btn);
    }
  }
}

// Button micro-interaction feedback
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

// Quick Add to Cart
function quickAddToCart(productId, btn = null) {
  const p = window.productCache[productId];
  if (p) {
    const variant = p.variants && p.variants.length ? p.variants[0] : null;
    addToCart(p, variant, 1);
    if (btn) {
      triggerCartButtonSuccess(btn);
    }
  }
}

// === QUICK VIEW MODAL ===
async function openQuickView(slug) {
  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'search-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="search-box" style="max-width: 720px; padding: 24px; position: relative;">
      <button onclick="closeQuickView()" style="position: absolute; right: 16px; top: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
      <div id="quick-view-content" style="display: flex; align-items: center; justify-content: center; min-height: 200px;">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;
  modal.classList.add('open');

  try {
    const res = await fetch(`${API_BASE}/products/${slug}`);
    const data = await res.json();
    if (!data.success) throw new Error();

    const p = data.product;
    window.productCache[p._id] = p;
    const img = typeof getProductImage === 'function' ? getProductImage(p) : ((p.images && p.images[0] ? p.images[0].url : '') || '/assets/images/Createin Monohydrate.jpeg');
    const isPriceUnconfigured = Boolean(p.priceNotConfigured || p.basePrice === 0);

    document.getElementById('quick-view-content').innerHTML = `
      <div class="grid-2" style="gap: 24px; width: 100%;">
        <div style="aspect-ratio: 1; background: var(--bg-2); border-radius: var(--radius); overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <img src="${img}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: contain; padding: 12px;" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
        </div>
        <div style="display: flex; flex-direction: column;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">${p.brand}</div>
          <h2 style="font-size: 1.25rem; margin: 6px 0 10px;">${p.name}</h2>
          <div style="margin-bottom: 12px;">
            <span class="stars">${renderStars(p.rating)}</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);"> ${p.rating.toFixed(1)} (${p.reviewCount} reviews)</span>
          </div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--brand); margin-bottom: 14px;">
            ${isPriceUnconfigured ? `
              <span style="color: var(--text-muted); font-size: 1.05rem; font-style: italic;">Price not configured</span>
            ` : `
              ₹${p.basePrice.toLocaleString('en-IN')}
              ${p.mrp > p.basePrice ? `<span style="font-size: 0.95rem; color: var(--text-muted); text-decoration: line-through; margin-left: 8px;">₹${p.mrp.toLocaleString('en-IN')}</span>` : ''}
            `}
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">${p.shortDescription || (p.description ? p.description.slice(0, 160) + '...' : '')}</p>
          <div style="display: flex; gap: 10px; margin-top: auto;">
            ${isPriceUnconfigured 
              ? `<a href="product.html?slug=${p.slug}" class="btn btn-primary w-full" style="text-align: center; text-decoration: none;">View Full Details</a>`
              : `<button class="btn btn-primary w-full" onclick="quickAddToCart('${p._id}'); closeQuickView();">Add to Cart</button>
                 <a href="product.html?slug=${p.slug}" class="btn btn-secondary" style="white-space: nowrap;">View Full Details</a>`
            }
          </div>
        </div>
      </div>
    `;
  } catch {
    document.getElementById('quick-view-content').innerHTML = '<p style="color: #DC2626;">Error loading product details</p>';
  }
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) modal.classList.remove('open');
}

// === SHOP PAGE CONTROLLER ===
async function initShopPage() {
  const grid = document.getElementById('shop-products-grid');
  if (!grid) return;

  // Pre-fetch active flash sale product IDs
  window.activeFlashSaleProductIds = new Set();
  try {
    const fsRes = await fetch(`${API_BASE}/flash-sales/active`);
    const fsData = await fsRes.json();
    if (fsData.success && fsData.sales) {
      fsData.sales.forEach(sale => {
        (sale.products || []).forEach(pid => window.activeFlashSaleProductIds.add(pid));
      });
    }
  } catch {}

  const urlParams = new URLSearchParams(window.location.search);
  let category = urlParams.get('category') || '';
  let sort = urlParams.get('sort') || 'popular';
  let page = parseInt(urlParams.get('page')) || 1;
  let minPrice = urlParams.get('minPrice') || '';
  let maxPrice = urlParams.get('maxPrice') || '';

  // Setup category pills
  document.querySelectorAll('.filter-cat-btn').forEach(btn => {
    if (btn.dataset.category === category) btn.classList.add('active');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      category = btn.dataset.category;
      document.querySelectorAll('.filter-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      page = 1;
      fetchAndRenderShopProducts();
    });
  });

  // Setup sort change
  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.value = sort;
    sortSelect.addEventListener('change', (e) => {
      sort = e.target.value;
      page = 1;
      fetchAndRenderShopProducts();
    });
  }

  async function fetchAndRenderShopProducts() {
    grid.innerHTML = renderSkeletonCards(8);

    try {
      let query = `?page=${page}&limit=12&sort=${sort}`;
      if (category) query += `&category=${category}`;
      if (minPrice) query += `&minPrice=${minPrice}`;
      if (maxPrice) query += `&maxPrice=${maxPrice}`;

      const res = await fetch(`${API_BASE}/products${query}`);
      const data = await res.json();

      if (!data.success || !data.products.length) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">📦</div>
            <h3 style="margin-bottom: 6px;">No products found</h3>
            <p style="color: var(--text-muted);">Try adjusting your category or filter selection.</p>
          </div>
        `;
        renderPagination(0, 1);
        return;
      }

      data.products.forEach(p => { window.productCache[p._id] = p; });
      grid.innerHTML = data.products.map(createProductCard).join('');
      renderPagination(data.pages, data.page);

      const countEl = document.getElementById('shop-products-count');
      if (countEl) countEl.textContent = `Showing ${data.products.length} of ${data.total} products`;
    } catch {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #DC2626; padding: 40px;">Failed to load products. Check server connection.</div>';
    }
  }

  function renderPagination(totalPages, currentPage) {
    const pag = document.getElementById('shop-pagination');
    if (!pag) return;
    if (totalPages <= 1) {
      pag.innerHTML = '';
      return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changeShopPage(${i})">${i}</button>`;
    }
    pag.innerHTML = html;
  }

  window.changeShopPage = (p) => {
    page = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchAndRenderShopProducts();
  };

  window.clearAllShopFilters = () => {
    category = '';
    sort = 'popular';
    page = 1;
    minPrice = '';
    maxPrice = '';

    document.querySelectorAll('.filter-cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === '');
    });

    if (sortSelect) sortSelect.value = 'popular';

    try {
      history.pushState(null, '', window.location.pathname);
    } catch {}

    fetchAndRenderShopProducts();
    if (typeof showToast === 'function') {
      showToast('✓ Filters cleared', 'info');
    }
  };

  fetchAndRenderShopProducts();
}

// === LOAD BEST PRODUCTS (ALGORITHMIC RANKING) ===
async function loadBestProducts(containerId = 'best-products-grid') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 30px;"><div class="loading-spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/products/best?limit=4`);
    const data = await res.json();

    if (data.success && data.products && data.products.length > 0) {
      data.products.forEach(p => { window.productCache[p._id] = p; });
      container.innerHTML = data.products.map(createProductCard).join('');
      if (typeof applyTranslations === 'function') applyTranslations();
    } else {
      container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">No products found.</div>';
    }
  } catch (err) {
    console.error('Failed to load best products:', err);
    container.innerHTML = '';
  }
}

// === LOAD RECOMMENDED PRODUCTS ===
async function loadRecommendedProducts(containerId = 'recommended-products-grid', goal = 'muscle_gain') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 30px;"><div class="loading-spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    });
    const data = await res.json();

    if (data.success && data.recommendations && data.recommendations.length > 0) {
      data.recommendations.forEach(p => { window.productCache[p._id] = p; });
      container.innerHTML = data.recommendations.map(createProductCard).join('');
      if (typeof applyTranslations === 'function') applyTranslations();
    } else {
      container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">No recommendations available.</div>';
    }
  } catch (err) {
    console.error('Failed to load recommended products:', err);
    container.innerHTML = '';
  }
}

