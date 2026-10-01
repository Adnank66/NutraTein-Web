/**
 * PROTEINX — Single Product Detail Page
 * Image Gallery, Variant Picker, Pincode Checker, Reviews, Tabs
 */

let currentProduct = null;
let selectedVariant = null;

async function initProductDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    window.location.href = 'shop.html';
    return;
  }

  const container = document.getElementById('product-detail-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/products/${slug}`);
    const data = await res.json();

    if (!data.success || !data.product) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Product Not Found</div>
          <p class="empty-state-text">The product you are looking for does not exist or has been removed.</p>
          <a href="shop.html" class="btn btn-primary">Back to Shop</a>
        </div>
      `;
      return;
    }

    currentProduct = data.product;
    window.productCache[currentProduct._id] = currentProduct;
    selectedVariant = currentProduct.variants && currentProduct.variants.length ? currentProduct.variants[0] : null;

    // Check if product is in an active flash sale
    let flashSaleInfo = null;
    try {
      const fsRes = await fetch(`${API_BASE}/flash-sales/${currentProduct._id}/price`);
      const fsData = await fsRes.json();
      if (fsData.success && fsData.onSale) {
        flashSaleInfo = fsData;
      }
    } catch {}

    renderProductDetail(data.product, data.reviews || [], flashSaleInfo);
    trackRecentlyViewed(data.product);
  } catch {
    container.innerHTML = '<div style="text-align: center; color: #DC2626; padding: 60px;">Error loading product information.</div>';
  }
}

function renderProductDetail(p, reviews, flashSale) {
  const container = document.getElementById('product-detail-container');
  const img = typeof getProductImage === 'function' ? getProductImage(p) : ((p.images && p.images[0] ? (p.images[0].url || p.images[0]) : '') || '/assets/images/Createin Monohydrate.jpeg');
  let price = selectedVariant ? selectedVariant.price : p.basePrice;
  if (flashSale && flashSale.onSale) {
    price = flashSale.salePrice;
  }

  const isPriceUnconfigured = Boolean(p.priceNotConfigured || p.basePrice === 0 || price === 0);
  const stock = selectedVariant ? (selectedVariant.stock ?? p.stock ?? 25) : (p.stock ?? 25);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;

  container.innerHTML = `
    <!-- Page Navigation Bar -->
    <div class="page-nav-bar">
      <div class="page-nav-left">
        <button class="btn-nav-back" onclick="goBack()">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span data-i18n="btn_back">Back</span>
        </button>
        <a href="index.html" class="btn-nav-home">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span data-i18n="btn_home">Home</span>
        </a>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <a href="index.html">Home</a>
      <span class="breadcrumb-sep">/</span>
      <a href="shop.html">Shop</a>
      <span class="breadcrumb-sep">/</span>
      <a href="shop.html?category=${p.category?.slug || ''}">${p.category?.name || 'Supplements'}</a>
      <span class="breadcrumb-sep">/</span>
      <span>${p.name}</span>
    </div>

    <!-- Product Main Grid -->
    <div class="grid-2" style="gap: 40px; align-items: start; margin-top: 16px;">
      <!-- Gallery Column -->
      <div class="product-gallery-wrap">
        <div class="product-main-img-box" style="position: relative; background: var(--bg-2); border-radius: var(--radius-lg); overflow: hidden; aspect-ratio: 1; border: 1px solid var(--border); margin-bottom: 14px; cursor: zoom-in; display: flex; align-items: center; justify-content: center;" onclick="openImageZoomModal()">
          <img id="main-product-img" src="${img}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: contain; padding: 16px; transition: opacity 0.2s ease, transform 0.25s ease;" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
          <button class="gallery-zoom-hint" title="Click to zoom image" onclick="event.stopPropagation(); openImageZoomModal();" style="position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.65); color: #fff; border: none; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); font-size: 1.1rem;">
            🔍
          </button>
        </div>
        ${p.images && p.images.length > 1 ? `
          <div id="gallery-thumbs" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px;">
            ${p.images.map((im, i) => {
              const url = typeof im === 'string' ? im : (im.url || '');
              const alt = typeof im === 'string' ? p.name : (im.alt || p.name);
              return `
                <img src="${url}" alt="${alt}" class="gallery-thumb-img ${i === 0 ? 'active' : ''}" onclick="changeMainImage('${url}', ${i})" style="width: 72px; height: 72px; object-fit: contain; padding: 4px; background: var(--bg-2); border-radius: var(--radius-sm); border: 2px solid ${i === 0 ? 'var(--brand)' : 'var(--border)'}; cursor: pointer; transition: border-color 0.2s, transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info Column -->
      <div>
        <div style="font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">${p.brand}</div>
        <h1 style="font-size: clamp(1.4rem, 3vw, 2rem); margin: 8px 0 12px; font-weight: 800;">${p.name}</h1>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <span class="stars">${renderStars(p.rating)}</span>
          <span style="font-size: 0.9rem; font-weight: 600;">${p.rating.toFixed(1)}</span>
          <span style="color: var(--text-muted); font-size: 0.85rem;">(${p.reviewCount} customer reviews)</span>
        </div>

        <!-- Live Stock Indicator -->
        <div style="margin-bottom: 16px; display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
          ${flashSale && flashSale.onSale ? `
            <span class="flash-sale-badge" style="background:linear-gradient(135deg,#FF4E00,#E86C1A); color:#fff; padding:5px 12px; font-size:0.8rem; font-weight:800;">
              ⚡ ${flashSale.saleName || 'FLASH SALE'} (${flashSale.discountValue}${flashSale.discountType === 'PERCENT' ? '%' : '₹'} OFF)
            </span>
          ` : ''}
          ${isLowStock ? `<span class="stock-alert-low">⚡ Low Stock: Only ${stock} units remaining!</span>` : ''}
          ${isOutOfStock ? `<span class="stock-alert-out">Currently Out of Stock</span>` : ''}
          ${!isLowStock && !isOutOfStock ? `<span class="stock-alert-in">✓ In Stock (Ready to dispatch)</span>` : ''}
        </div>

        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px;">
          ${isPriceUnconfigured ? `
            <span id="detail-price" style="font-size: 1.5rem; font-weight: 800; color: var(--text-muted); font-style: italic;">
              Price not configured
            </span>
          ` : `
            <span id="detail-price" style="font-size: 1.8rem; font-weight: 900; color: ${flashSale && flashSale.onSale ? '#FF4E00' : 'var(--brand)'};">
              ₹${price.toLocaleString('en-IN')}
            </span>
            ${flashSale && flashSale.onSale ? `
              <span style="font-size: 1.15rem; color: var(--text-muted); text-decoration: line-through;">₹${(p.basePrice).toLocaleString('en-IN')}</span>
              <span class="badge badge-primary" style="font-size: 0.8rem;">FLASH DEAL</span>
            ` : (p.mrp > price ? `
              <span style="font-size: 1.1rem; color: var(--text-muted); text-decoration: line-through;">₹${p.mrp.toLocaleString('en-IN')}</span>
              <span class="badge badge-green" style="font-size: 0.8rem;">SAVE ${p.discountPercent}%</span>
            ` : '')}
          `}
        </div>

        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">${p.shortDescription || p.description}</p>

        <!-- Variants -->
        ${p.variants && p.variants.length ? `
          <div style="margin-bottom: 24px;">
            <label class="form-label" style="margin-bottom: 10px;">Select Flavor / Size:</label>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${p.variants.map((v, i) => `
                <button class="btn btn-secondary btn-sm variant-pill ${i === 0 ? 'active' : ''}" style="${i === 0 ? 'border-color: var(--brand); color: var(--brand); background: var(--brand-light);' : ''}" onclick="selectVariantByIndex(${i}, this)">
                  ${v.flavor ? v.flavor : ''} ${v.size ? `(${v.size})` : ''} — ₹${v.price.toLocaleString('en-IN')}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Add to Cart & Wishlist Actions -->
        <div style="display: flex; gap: 12px; margin-bottom: 14px;">
          ${isPriceUnconfigured ? `
            <a href="https://wa.me/919321598094?text=${encodeURIComponent('Hi! I would like to inquire about pricing and availability for ' + p.name)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-lg" style="flex: 1; display: flex; align-items: center; justify-content: center; text-decoration: none;">
              Request Price / Contact Us
            </a>
          ` : (!isOutOfStock ? `
            <div style="display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--bg); padding: 4px;">
              <button onclick="changeDetailQty(-1)" style="width: 32px; height: 32px; background: none; border: none; font-size: 1.1rem; cursor: pointer; font-weight: 700;">-</button>
              <input type="text" id="detail-qty-input" value="1" readonly style="width: 36px; text-align: center; border: none; font-weight: 700; background: transparent;">
              <button onclick="changeDetailQty(1)" style="width: 32px; height: 32px; background: none; border: none; font-size: 1.1rem; cursor: pointer; font-weight: 700;">+</button>
            </div>
            <button class="btn btn-primary btn-lg" style="flex: 1;" onclick="addDetailToCart()">
              Add to Cart
            </button>
          ` : `
            <button class="btn btn-notify btn-lg" style="flex: 1;" onclick="openNotifyModal('${p._id}', '${escapeHtml(p.name)}')">
              🔔 Notify Me When Available
            </button>
          `)}
          <button class="btn btn-secondary btn-icon" title="Wishlist" onclick="toggleWishlist(currentProduct)">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </button>
        </div>

        <!-- WhatsApp Product Inquiry Button -->
        <div style="margin-bottom: 24px;">
          <a href="https://wa.me/919321598094?text=${encodeURIComponent('Hi! I am interested in ' + p.name + ' and would like to know more.')}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm w-full" style="display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; border-color:#25D366; color:#065F46; background:rgba(37,211,102,0.08);">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Ask Questions via WhatsApp
          </a>
        </div>

        <!-- Pincode Delivery Checker -->
        <div class="card" style="padding: 18px; margin-bottom: 24px; background: var(--bg-2);">
          <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Check Delivery & COD Availability
          </label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="pincode-input" class="form-control" placeholder="Enter 6-digit Pincode" maxlength="6" style="padding: 8px 12px; font-size: 0.875rem;">
            <button class="btn btn-dark btn-sm" onclick="checkPincode()">CHECK</button>
          </div>
          <div id="pincode-result" style="margin-top: 10px; font-size: 0.8125rem;"></div>
        </div>

        <!-- Trust Badges -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; border-top: 1px solid var(--border); padding-top: 18px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted);">
            <span>🛡️</span> 100% Genuine & Lab Tested
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted);">
            <span>🚚</span> Free Delivery Above ₹999
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted);">
            <span>💳</span> Cash on Delivery Available
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted);">
            <span>🔄</span> 7-Day Easy Return Policy
          </div>
        </div>
      </div>
    </div>

    <!-- Product Tabs: Nutrition, Ingredients, Usage, Reviews -->
    <div style="margin-top: 60px;">
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--border); overflow-x: auto;">
        <button class="tab-btn active" onclick="switchProductTab('description', this)" style="padding: 12px 20px; font-weight: 700; font-size: 0.95rem; border: none; background: none; cursor: pointer; color: var(--brand); border-bottom: 2px solid var(--brand); margin-bottom: -2px;">Description</button>
        <button class="tab-btn" onclick="switchProductTab('nutrition', this)" style="padding: 12px 20px; font-weight: 600; font-size: 0.95rem; border: none; background: none; cursor: pointer; color: var(--text-muted);">Nutrition Facts</button>
        <button class="tab-btn" onclick="switchProductTab('usage', this)" style="padding: 12px 20px; font-weight: 600; font-size: 0.95rem; border: none; background: none; cursor: pointer; color: var(--text-muted);">How to Use</button>
        <button class="tab-btn" onclick="switchProductTab('reviews', this)" style="padding: 12px 20px; font-weight: 600; font-size: 0.95rem; border: none; background: none; cursor: pointer; color: var(--text-muted);">Reviews (${reviews.length})</button>
      </div>

      <div id="tab-description" class="tab-panel" style="padding: 30px 0; font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary);">
        <p style="white-space: pre-line;">${p.description}</p>
      </div>

      <div id="tab-nutrition" class="tab-panel hidden" style="padding: 30px 0;">
        ${p.nutrition ? `
          <div style="max-width: 440px; border: 2px solid var(--border); border-radius: var(--radius); padding: 20px; background: var(--bg-2);">
            <h3 style="font-size: 1.25rem; font-weight: 900; border-bottom: 6px solid var(--text-primary); padding-bottom: 6px;">Nutrition Facts</h3>
            <div style="font-size: 0.875rem; border-bottom: 1px solid var(--border); padding: 6px 0;">Serving Size: <strong>${p.nutrition.servingSize || '30g'}</strong></div>
            <div style="font-size: 1.2rem; font-weight: 900; border-bottom: 4px solid var(--text-primary); padding: 8px 0;">Calories: ${p.nutrition.calories || 120}</div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 0.9rem;">
              <span><strong>Protein</strong></span> <strong>${p.nutrition.protein || 24}g</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 0.9rem;">
              <span>Total Carbohydrates</span> <span>${p.nutrition.carbohydrates || 2}g</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 0.9rem;">
              <span>Total Fat</span> <span>${p.nutrition.fat || 1}g</span>
            </div>
            ${p.nutrition.bcaa ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 0.9rem;">
                <span>BCAAs</span> <span>${p.nutrition.bcaa}</span>
              </div>
            ` : ''}
          </div>
        ` : '<p style="color: var(--text-muted);">Nutritional facts will be updated soon for this product.</p>'}
      </div>

      <div id="tab-usage" class="tab-panel hidden" style="padding: 30px 0; font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary);">
        <p>${p.howToUse || 'Mix 1 rounded scoop with 200-250 ml of cold water or skimmed milk in a shaker bottle. Shake well for 20-30 seconds until completely dissolved. Consume immediately post-workout or as directed by your healthcare professional.'}</p>
      </div>

      <div id="tab-reviews" class="tab-panel hidden" style="padding: 30px 0;">
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Customer Reviews</h3>
          ${reviews.length ? reviews.map(r => `
            <div class="card" style="padding: 16px; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong>${r.user?.name || 'Verified Buyer'}</strong>
                <span class="stars">${renderStars(r.rating)}</span>
              </div>
              <div style="font-size: 0.9rem; font-weight: 700; margin-bottom: 4px;">${r.title || ''}</div>
              <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">${r.body}</p>
            </div>
          `).join('') : '<p style="color: var(--text-muted);">No reviews yet. Be the first to review this product!</p>'}
        </div>
      </div>
    </div>
  `;
  initGalleryTouchSwipe();
}

let currentGalleryIndex = 0;

function changeMainImage(url, idx = 0) {
  currentGalleryIndex = idx;
  const main = document.getElementById('main-product-img');
  if (main) {
    main.style.opacity = '0.5';
    main.src = url;
    setTimeout(() => { main.style.opacity = '1'; }, 80);
  }
  document.querySelectorAll('.gallery-thumb-img').forEach((t, i) => {
    t.style.borderColor = (i === idx) ? 'var(--brand)' : 'var(--border)';
    t.classList.toggle('active', i === idx);
  });
}

function openImageZoomModal() {
  const main = document.getElementById('main-product-img');
  if (!main) return;
  let modal = document.getElementById('image-zoom-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'image-zoom-modal';
    modal.className = 'image-zoom-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <button class="image-zoom-close" onclick="closeImageZoomModal()" title="Close full screen zoom">&times;</button>
    <img src="${main.src}" alt="${currentProduct?.name || 'Product'}" onclick="event.stopPropagation()">
  `;
  modal.onclick = (e) => {
    if (e.target === modal || e.target.classList.contains('image-zoom-close')) {
      closeImageZoomModal();
    }
  };
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeImageZoomModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeImageZoomModal() {
  const modal = document.getElementById('image-zoom-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function initGalleryTouchSwipe() {
  const box = document.querySelector('.product-main-img-box');
  if (!box || !currentProduct?.images?.length) return;
  let startX = 0;
  box.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 35) {
      const imgs = currentProduct.images;
      if (diff < 0) {
        // swipe left -> next
        const nextIdx = (currentGalleryIndex + 1) % imgs.length;
        changeMainImage(imgs[nextIdx].url, nextIdx);
      } else {
        // swipe right -> prev
        const prevIdx = (currentGalleryIndex - 1 + imgs.length) % imgs.length;
        changeMainImage(imgs[prevIdx].url, prevIdx);
      }
    }
  }, { passive: true });
}

function selectVariantByIndex(idx, btn) {
  if (!currentProduct || !currentProduct.variants) return;
  selectedVariant = currentProduct.variants[idx];

  document.querySelectorAll('.variant-pill').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.color = 'var(--text-primary)';
    b.style.background = 'var(--bg)';
  });
  btn.style.borderColor = 'var(--brand)';
  btn.style.color = 'var(--brand)';
  btn.style.background = 'var(--brand-light)';

  const priceEl = document.getElementById('detail-price');
  if (priceEl && selectedVariant) {
    priceEl.textContent = `₹${selectedVariant.price.toLocaleString('en-IN')}`;
  }
}

function changeDetailQty(delta) {
  const input = document.getElementById('detail-qty-input');
  if (!input) return;
  let val = parseInt(input.value) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
}

function addDetailToCart() {
  if (!currentProduct) return;
  const input = document.getElementById('detail-qty-input');
  const qty = parseInt(input?.value) || 1;
  addToCart(currentProduct, selectedVariant, qty);
}

function switchProductTab(tabName, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.style.color = 'var(--text-muted)';
    b.style.borderBottom = 'none';
  });

  const panel = document.getElementById(`tab-${tabName}`);
  if (panel) panel.classList.remove('hidden');

  btn.classList.add('active');
  btn.style.color = 'var(--brand)';
  btn.style.borderBottom = '2px solid var(--brand)';
}

async function checkPincode() {
  const input = document.getElementById('pincode-input');
  const result = document.getElementById('pincode-result');
  if (!input || !result) return;

  const pin = input.value.trim();
  if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    result.innerHTML = '<span style="color: #DC2626;">Please enter a valid 6-digit pincode</span>';
    return;
  }

  result.innerHTML = '<div class="loading-spinner" style="width: 18px; height: 18px;"></div> Checking...';

  try {
    const res = await fetch(`${API_BASE}/pincode/check?pincode=${pin}`);
    const data = await res.json();

    if (data.available) {
      result.innerHTML = `
        <div style="color: #065F46; font-weight: 600;">✓ Delivery Available to ${pin}</div>
        <div style="color: var(--text-muted); margin-top: 2px;">Estimated delivery by <strong>${data.estimatedDelivery}</strong></div>
        <div style="color: var(--text-secondary); margin-top: 2px;">Shipping: ${data.shippingCharge === 0 ? 'FREE' : '₹' + data.shippingCharge} | COD: ${data.cod ? 'Available' : 'Prepaid Only'}</div>
      `;
    } else {
      result.innerHTML = '<span style="color: #DC2626;">✕ Delivery is not available to this pincode</span>';
    }
  } catch {
    result.innerHTML = '<span style="color: #DC2626;">Error checking pincode availability.</span>';
  }
}

// Track recently viewed products in localStorage
function trackRecentlyViewed(product) {
  try {
    let list = JSON.parse(localStorage.getItem('proteinx_recent') || '[]');
    list = list.filter(p => p._id !== product._id);
    list.unshift({
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
    if (list.length > 6) list.pop();
    localStorage.setItem('proteinx_recent', JSON.stringify(list));
  } catch {}

  // Also update the unified recently viewed store (used by account.html)
  if (typeof addToRecentlyViewed === 'function') {
    addToRecentlyViewed(product);
  }
}
