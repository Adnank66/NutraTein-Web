/**
 * PROTEINX — Interactive Features Module
 * Build Your Stack, Comparison Matrix, AI Recommendations, Protein Calculator, Order Tracking
 */

// ==========================================
// 1. BUILD YOUR STACK (BUNDLE BUILDER)
// ==========================================
let stackSelected = {};

async function initStackBuilder() {
  const container = document.getElementById('stack-categories-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/products?limit=30`);
    const data = await res.json();
    if (!data.success) return;

    const products = data.products;
    const catMap = {
      'whey-protein': 'Protein Powder',
      'creatine': 'Creatine Strength',
      'pre-workout': 'Pre-Workout Energy',
      'vitamins': 'Daily Vitamins',
      'accessories': 'Gym Shaker / Accessories'
    };

    container.innerHTML = Object.entries(catMap).map(([slug, title], idx) => {
      const catProducts = products.filter(p => p.category?.slug === slug || p.category === slug);
      if (!catProducts.length) return '';

      return `
        <div class="card" style="margin-bottom: 24px; padding: 24px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h3 style="font-size: 1.15rem; font-weight: 800;">Step ${idx + 1}: Select ${title}</h3>
            <span class="badge badge-brand">${catProducts.length} Options</span>
          </div>
          <div class="grid-3" style="gap: 16px;">
            ${catProducts.slice(0, 3).map(p => {
              const img = typeof getProductImage === 'function' ? getProductImage(p) : ((p.images && p.images[0] ? p.images[0].url : '') || '/assets/images/Createin Monohydrate.jpeg');
              return `
                <div class="card stack-item-card" id="stack-item-${p._id}" style="padding: 14px; cursor: pointer; transition: all 0.2s;" onclick="toggleStackItem('${slug}', '${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.basePrice}, '${img}')">
                  <img src="${img}" alt="${p.name}" style="aspect-ratio: 1; object-fit: contain; padding: 6px; border-radius: var(--radius-sm); margin-bottom: 10px;" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
                  <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${p.name}</div>
                  <div style="font-weight: 800; color: var(--brand); font-size: 0.95rem;">₹${p.basePrice.toLocaleString('en-IN')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    updateStackSummary();
  } catch (err) {
    console.error('Stack builder error:', err);
  }
}

function toggleStackItem(catSlug, id, name, price, image) {
  if (stackSelected[catSlug] && stackSelected[catSlug].id === id) {
    delete stackSelected[catSlug];
  } else {
    stackSelected[catSlug] = { id, name, price, image };
  }

  // Update visual selection borders
  document.querySelectorAll('.stack-item-card').forEach(el => {
    el.style.borderColor = 'var(--border)';
    el.style.background = 'var(--card-bg)';
  });

  Object.values(stackSelected).forEach(item => {
    const el = document.getElementById(`stack-item-${item.id}`);
    if (el) {
      el.style.borderColor = 'var(--brand)';
      el.style.background = 'var(--brand-light)';
    }
  });

  updateStackSummary();
}

function updateStackSummary() {
  const items = Object.values(stackSelected);
  const countEl = document.getElementById('stack-selected-count');
  const listEl = document.getElementById('stack-selected-list');
  const subtotalEl = document.getElementById('stack-subtotal');
  const discountEl = document.getElementById('stack-discount');
  const totalEl = document.getElementById('stack-total');
  const addBtn = document.getElementById('add-stack-to-cart-btn');

  if (countEl) countEl.textContent = `${items.length} items selected`;

  if (listEl) {
    if (items.length === 0) {
      listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 12px 0;">No supplements selected yet. Choose from above steps!</div>';
    } else {
      listEl.innerHTML = items.map(it => `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
          <span>${it.name}</span>
          <span style="font-weight: 700;">₹${it.price.toLocaleString('en-IN')}</span>
        </div>
      `).join('');
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.price, 0);
  const discount = Math.round(subtotal * 0.15); // 15% Stack discount
  const finalTotal = subtotal - discount;

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (discountEl) discountEl.textContent = `-₹${discount.toLocaleString('en-IN')}`;
  if (totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

  if (addBtn) {
    addBtn.disabled = items.length < 2;
    addBtn.textContent = items.length < 2 ? 'Select at least 2 items' : `Add Stack to Cart (Save ₹${discount})`;
  }
}

function addStackToCart() {
  const items = Object.values(stackSelected);
  if (items.length < 2) return;

  const cart = getCart();
  items.forEach(it => {
    const discountedPrice = Math.round(it.price * 0.85); // 15% off
    cart.push({
      productId: it.id,
      variantId: 'bundle',
      name: `${it.name} (Stack Bundle - 15% OFF)`,
      brand: 'PROTEINX',
      price: discountedPrice,
      quantity: 1,
      image: it.image,
      flavor: 'Bundle Pack',
      size: 'Standard'
    });
  });

  saveCart(cart);
  showToast('Supplement stack added to cart with 15% discount!', 'success');
  openCartDrawer();
}

// ==========================================
// 2. LIVE PRODUCT COMPARISON
// ==========================================
let allComparisonProducts = [];
let selectedCompareIds = [];

async function initComparisonPage() {
  const select1 = document.getElementById('compare-select-1');
  const select2 = document.getElementById('compare-select-2');
  const select3 = document.getElementById('compare-select-3');
  if (!select1 || !select2) return;

  try {
    const res = await fetch(`${API_BASE}/products?limit=50`);
    const data = await res.json();
    if (!data.success) return;

    allComparisonProducts = data.products;
    const options = allComparisonProducts.map(p => `<option value="${p._id}">${p.name} (₹${p.basePrice})</option>`).join('');

    select1.innerHTML = '<option value="">Select Product 1</option>' + options;
    select2.innerHTML = '<option value="">Select Product 2</option>' + options;
    if (select3) select3.innerHTML = '<option value="">Select Product 3 (Optional)</option>' + options;

    let savedCompare = [];
    try {
      const raw = localStorage.getItem('proteinx_compare_list');
      if (raw) savedCompare = JSON.parse(raw);
    } catch(e) {}

    if (savedCompare && savedCompare.length >= 2) {
      select1.value = savedCompare[0] || '';
      select2.value = savedCompare[1] || '';
      if (select3 && savedCompare[2]) select3.value = savedCompare[2];
      renderComparisonTable();
    } else if (allComparisonProducts.length >= 2) {
      select1.value = allComparisonProducts[0]._id;
      select2.value = allComparisonProducts[1]._id;
      renderComparisonTable();
    }

    select1.addEventListener('change', renderComparisonTable);
    select2.addEventListener('change', renderComparisonTable);
    if (select3) select3.addEventListener('change', renderComparisonTable);
  } catch (err) {
    console.error('Comparison error:', err);
  }
}

window.clearComparison = function() {
  localStorage.removeItem('proteinx_compare_list');
  const select1 = document.getElementById('compare-select-1');
  const select2 = document.getElementById('compare-select-2');
  const select3 = document.getElementById('compare-select-3');
  if (select1) select1.value = '';
  if (select2) select2.value = '';
  if (select3) select3.value = '';
  renderComparisonTable();
  if (typeof showToast === 'function') {
    showToast('✓ Comparison cleared', 'info');
  }
};

function renderComparisonTable() {
  const s1 = document.getElementById('compare-select-1')?.value;
  const s2 = document.getElementById('compare-select-2')?.value;
  const s3 = document.getElementById('compare-select-3')?.value;

  const selected = [s1, s2, s3].filter(Boolean).map(id => allComparisonProducts.find(p => p._id === id)).filter(Boolean);
  const container = document.getElementById('comparison-table-content');
  if (!container) return;

  if (selected.length < 2) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Please select at least 2 products to compare.</p>';
    return;
  }

  // Calculate winners for badges
  let maxProtein = -1, maxProteinId = null;
  let minPrice = Infinity, minPriceId = null;
  let maxRating = -1, maxRatingId = null;

  selected.forEach(p => {
    const prot = parseFloat(p.nutrition?.protein || 0);
    if (prot > maxProtein) { maxProtein = prot; maxProteinId = p._id; }
    if (p.basePrice < minPrice) { minPrice = p.basePrice; minPriceId = p._id; }
    if (p.rating > maxRating) { maxRating = p.rating; maxRatingId = p._id; }
  });

  container.innerHTML = `
    <div class="compare-container">
      <table class="compare-table">
        <tbody>
          <tr>
            <th>Product</th>
            ${selected.map(p => {
              const badges = [];
              if (p._id === maxProteinId && maxProtein > 0) badges.push('<span class="compare-highlight-badge compare-best-protein">🏆 Best Protein (' + maxProtein + 'g)</span>');
              if (p._id === minPriceId) badges.push('<span class="compare-highlight-badge compare-best-value">💰 Best Value</span>');
              if (p._id === maxRatingId) badges.push('<span class="compare-highlight-badge compare-best-rating">⭐ Top Rated (' + p.rating.toFixed(1) + '★)</span>');
              return `
                <td>
                  <img src="${typeof getProductImage === 'function' ? getProductImage(p) : (p.images?.[0]?.url || '/assets/images/Createin Monohydrate.jpeg')}" alt="${p.name}" class="compare-product-img" style="object-fit: contain; padding: 4px;" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
                  <div class="compare-product-name">${p.name}</div>
                  <div style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 6px;">${p.brand}</div>
                  <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                    ${badges.join('')}
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
          <tr>
            <th>Price</th>
            ${selected.map(p => `
              <td class="${p._id === minPriceId ? 'compare-highlight-cell' : ''}">
                <div class="compare-product-price">₹${p.basePrice.toLocaleString('en-IN')}</div>
                ${p.mrp > p.basePrice ? `<div class="original-price">₹${p.mrp.toLocaleString('en-IN')}</div><span class="badge badge-green" style="font-size:0.75rem; margin-top:2px;">SAVE ${p.discountPercent}%</span>` : ''}
              </td>
            `).join('')}
          </tr>
          <tr>
            <th>Protein / Serving</th>
            ${selected.map(p => `
              <td class="${p._id === maxProteinId ? 'compare-highlight-cell' : ''}">
                <strong style="font-size: 1.05rem; color: ${p._id === maxProteinId ? 'var(--brand)' : 'inherit'};">
                  ${p.nutrition?.protein ? p.nutrition.protein + 'g' : 'N/A'}
                </strong>
                ${p.nutrition?.servingSize ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Serving: ${p.nutrition.servingSize}</div>` : ''}
              </td>
            `).join('')}
          </tr>
          <tr>
            <th>Calories / Serving</th>
            ${selected.map(p => `<td><strong>${p.nutrition?.calories || 'N/A'}</strong> kcal</td>`).join('')}
          </tr>
          <tr>
            <th>Customer Rating</th>
            ${selected.map(p => `
              <td class="${p._id === maxRatingId ? 'compare-highlight-cell' : ''}">
                <div class="compare-stars">${renderStars(p.rating)}</div>
                <strong style="font-size: 0.9rem;">${p.rating.toFixed(1)} / 5</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">(${p.reviewCount} reviews)</div>
              </td>
            `).join('')}
          </tr>
          <tr>
            <th>Stock Status</th>
            ${selected.map(p => {
              const stock = p.stock !== undefined ? p.stock : 25;
              if (stock === 0) return '<td><span class="stock-badge out-of-stock">✕ Out of Stock</span></td>';
              if (stock <= 10) return '<td><span class="stock-badge low-stock">⚡ Only ' + stock + ' left</span></td>';
              return '<td><span class="stock-badge in-stock">✓ In Stock</span></td>';
            }).join('')}
          </tr>
          <tr>
            <th>Category</th>
            ${selected.map(p => `<td>${p.category?.name || 'Supplements'}</td>`).join('')}
          </tr>
          <tr>
            <th>Action</th>
            ${selected.map(p => `
              <td>
                <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                  ${(p.stock !== undefined ? p.stock : 25) > 0 ? `
                    <button class="btn btn-primary btn-sm w-full" onclick="quickAddToCart('${p._id}')">Add to Cart</button>
                  ` : `
                    <button class="btn btn-notify btn-sm w-full" onclick="openNotifyModal('${p._id}', '${escapeHtml(p.name)}')">Notify Me</button>
                  `}
                  <a href="product.html?slug=${p.slug}" class="btn btn-secondary btn-sm w-full">View Details</a>
                </div>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ==========================================
// 3. AI PRODUCT RECOMMENDATION
// ==========================================
async function getRecommendations(e) {
  if (e) e.preventDefault();
  const goal = document.getElementById('rec-goal')?.value || 'muscle_gain';
  const experience = document.getElementById('rec-experience')?.value || 'intermediate';
  const preference = document.getElementById('rec-preference')?.value || 'whey';
  const dietary = document.getElementById('rec-dietary')?.value || 'all';
  const budget = document.getElementById('rec-budget')?.value || '5000';

  const resultsDiv = document.getElementById('recommendations-results');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><p style="margin-top: 10px; color: var(--text-muted);">Finding personalized supplements...</p></div>';

  try {
    const res = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, experience, preference, dietary, maxBudget: budget })
    });
    const data = await res.json();

    if (!data.success || !data.recommendations.length) {
      resultsDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 30px;">No exact matches found. Try adjusting your budget or preferences.</p>';
      return;
    }

    resultsDiv.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 1.25rem; font-weight: 800;">Recommended For You</h3>
        <p style="color: var(--text-muted); font-size: 0.875rem;">Based on your goal (${goal.replace('_', ' ')}) & dietary preference:</p>
      </div>
      <div class="grid-3" style="gap: 20px;">
        ${data.recommendations.map(p => {
          const img = typeof getProductImage === 'function' ? getProductImage(p) : ((p.images && p.images[0] ? p.images[0].url : '') || '/assets/images/Createin Monohydrate.jpeg');
          window.productCache[p._id] = p;
          return `
            <div class="card" style="display: flex; flex-direction: column;">
              <img src="${img}" alt="${p.name}" style="aspect-ratio: 1; object-fit: contain; padding: 8px; border-radius: var(--radius-sm); margin-bottom: 12px;" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">${p.brand}</div>
              <h4 style="font-size: 0.95rem; margin: 4px 0 8px;">${p.name}</h4>
              <div style="font-size: 0.8125rem; color: #065F46; background: #D1FAE5; padding: 6px 10px; border-radius: var(--radius-sm); margin-bottom: 12px; line-height: 1.4;">
                💡 ${p.reason || 'Ideal match for your goals.'}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border);">
                <span style="font-size: 1.1rem; font-weight: 800; color: var(--brand);">₹${p.basePrice.toLocaleString('en-IN')}</span>
                <button class="btn btn-primary btn-sm" onclick="quickAddToCart('${p._id}')">Add to Cart</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    resultsDiv.innerHTML = '<p style="color: #DC2626; text-align: center;">Failed to generate recommendations.</p>';
  }
}

// ==========================================
// 4. PROTEIN CALCULATOR
// ==========================================
function calculateProtein(e) {
  if (e) e.preventDefault();
  const weight = parseFloat(document.getElementById('calc-weight')?.value) || 70;
  const activity = document.getElementById('calc-activity')?.value || 'moderate';
  const goal = document.getElementById('calc-goal')?.value || 'maintain';

  // Multipliers in g/kg
  let baseMultiplier = 1.4;
  if (activity === 'sedentary') baseMultiplier = 1.0;
  else if (activity === 'moderate') baseMultiplier = 1.6;
  else if (activity === 'active') baseMultiplier = 2.0;

  if (goal === 'muscle_gain') baseMultiplier += 0.4;
  else if (goal === 'fat_loss') baseMultiplier += 0.2;

  const minGram = Math.round(weight * (baseMultiplier - 0.2));
  const maxGram = Math.round(weight * (baseMultiplier + 0.2));
  const scoops = Math.round((minGram * 0.4) / 25);

  const resultDiv = document.getElementById('calc-result');
  if (resultDiv) {
    resultDiv.innerHTML = `
      <div class="card" style="background: var(--brand-light); border-color: var(--brand); padding: 24px; text-align: center;">
        <div style="font-size: 0.875rem; font-weight: 700; color: var(--brand-dark); text-transform: uppercase;">Your Daily Protein Target</div>
        <div style="font-size: 2.5rem; font-weight: 900; color: var(--brand); margin: 6px 0;">${minGram} - ${maxGram}g</div>
        <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px;">
          To reach your goal at ${weight}kg with ${activity} activity, aim for ~${minGram}g daily. You can cover ~${scoops * 25}g from <strong>${scoops} scoop(s) of PROTEINX Whey</strong>!
        </p>
        <a href="shop.html?category=whey-protein" class="btn btn-primary btn-sm">Shop Matching Protein</a>
      </div>
    `;
  }
}

// ==========================================
// 5. ORDER TRACKING TIMELINE
// ==========================================
async function trackOrder(e) {
  if (e) e.preventDefault();
  const orderNumber = document.getElementById('track-order-id')?.value.trim();
  const contact = document.getElementById('track-contact')?.value.trim();

  const container = document.getElementById('track-result-container');
  if (!container) return;

  if (!orderNumber || !contact) {
    showToast('Please enter both Order ID and Email/Phone', 'error');
    return;
  }

  container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&contact=${encodeURIComponent(contact)}`);
    const data = await res.json();

    if (!data.success || !data.order) {
      container.innerHTML = `<div style="text-align: center; color: #DC2626; padding: 30px;">Order not found. Please check your details.</div>`;
      return;
    }

    const o = data.order;
    const stages = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIdx = stages.indexOf(o.status);

    container.innerHTML = `
      <div class="card" style="padding: 28px; margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 1.25rem;">Order #${o.orderNumber}</h3>
            <div style="color: var(--text-muted); font-size: 0.85rem;">Placed on ${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <span class="badge badge-brand" style="font-size: 0.85rem; padding: 6px 14px;">${o.status}</span>
        </div>

        <!-- Tracking Timeline -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; position: relative; padding: 0 10px;">
          <div style="position: absolute; top: 15px; left: 30px; right: 30px; height: 3px; background: var(--border); z-index: 1;"></div>
          ${stages.map((st, i) => {
            const done = i <= currentIdx;
            return `
              <div style="display: flex; flex-direction: column; align-items: center; z-index: 2; position: relative;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${done ? 'var(--brand)' : 'var(--bg-3)'}; color: ${done ? '#fff' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; border: 3px solid var(--bg);">
                  ${done ? '✓' : i + 1}
                </div>
                <div style="font-size: 0.75rem; font-weight: 700; margin-top: 6px; color: ${done ? 'var(--text-primary)' : 'var(--text-muted)'};">${st}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Shipping & Logistics Details -->
        <div style="background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.85rem;">
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">EXPECTED DELIVERY</div>
            <strong style="color: var(--brand); font-size: 0.95rem;">${o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Standard 3-5 Days'}</strong>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${o.deliveryTimeWindow || '10:00 AM - 06:00 PM'}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">CARRIER & TRACKING</div>
            <strong>${o.shippingProvider || 'BlueDart Express'}</strong>
            <div style="font-family: monospace; color: var(--brand); font-size: 0.8rem;">${o.trackingNumber || 'TRK-PENDING'}</div>
          </div>
          <div>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">TAX INVOICE</div>
            <strong style="font-family: monospace; font-size: 0.85rem;">${o.invoiceNumber || 'PX-INV-2026-N/A'}</strong>
            <div>
              <a href="account.html" style="font-size: 0.75rem; color: var(--brand); text-decoration: underline;">Download in Account</a>
            </div>
          </div>
        </div>

        ${o.deliveryNotes ? `<div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 10px 14px; font-size: 0.825rem; color: #92400E; margin-bottom: 16px;"><strong>Delivery Note:</strong> ${o.deliveryNotes}</div>` : ''}

        <!-- Order Items -->
        <h4 style="margin-bottom: 12px; font-size: 1rem;">Items in this order:</h4>
        ${o.items.map(it => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 0.9rem;">
            <div>
              <strong>${it.productName}</strong>
              <div style="color: var(--text-muted); font-size: 0.8rem;">${it.flavor ? it.flavor + ' | ' : ''}${it.size ? it.size + ' | ' : ''}Qty: ${it.quantity}</div>
            </div>
            <span>₹${(it.price * it.quantity).toLocaleString('en-IN')}</span>
          </div>
        `).join('')}

        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; margin-top: 16px;">
          <span>Total Amount:</span>
          <span style="color: var(--brand);">₹${o.totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    `;
  } catch {
    container.innerHTML = '<div style="color: #DC2626; text-align: center; padding: 30px;">Failed to fetch tracking details.</div>';
  }
}
