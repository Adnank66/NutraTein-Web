/**
 * PROTEINX — Advanced Admin Panel Controller
 * Handles Coupons, Orders, Shipping, Analytics, Invoices, Activity Logs & Clear All
 */

window.API_BASE = window.API_BASE || ((typeof window !== 'undefined' && window.location && window.location.port === '5000') 
  ? '/api' 
  : 'http://localhost:5000/api');
var API_BASE = window.API_BASE;

function getToken() {
  return localStorage.getItem('nutratein_token') || localStorage.getItem('proteinx_token') || localStorage.getItem('token') || '';
}

function getUser() {
  try {
    const raw = localStorage.getItem('nutratein_user') || localStorage.getItem('proteinx_user') || localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// User-friendly Session Expired Modal Handler (Requirement 10)
function handleSessionExpired() {
  if (document.getElementById('session-expired-modal')) return;

  const inAdmin = window.location.pathname.includes('/admin');
  const loginUrl = inAdmin ? 'login.html' : 'login.html';

  const modal = document.createElement('div');
  modal.id = 'session-expired-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;';

  modal.innerHTML = `
    <div style="background:var(--card-bg, #ffffff);border-radius:16px;padding:32px 28px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.25);border:1px solid var(--border, #e2e8f0);">
      <div style="width:56px;height:56px;margin:0 auto 16px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;">🔒</div>
      <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:8px;color:var(--text-primary, #0f172a);">Session Expired</h3>
      <p style="color:var(--text-secondary, #475569);font-size:0.9rem;line-height:1.5;margin-bottom:24px;">Your admin session has expired. Please log in again.</p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button onclick="localStorage.removeItem('proteinx_token');localStorage.removeItem('token');window.location.href='${loginUrl}';" style="background:var(--brand, #EB5E28);color:white;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:0.9rem;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(235,94,40,0.3);">
          🔑 Login Again
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
window.handleSessionExpired = handleSessionExpired;

// Safe authenticated fetch wrapper with automatic 401 handling
async function adminFetch(url, options = {}) {
  const token = getToken();
  options.headers = options.headers || {};
  if (token && !options.headers['Authorization']) {
    options.headers['Authorization'] = 'Bearer ' + token;
  }
  try {
    const res = await fetch(url, options);
    if (res.status === 401) {
      handleSessionExpired();
    }
    return res;
  } catch (err) {
    throw err;
  }
}
window.adminFetch = adminFetch;
window.fetchWithAuth = adminFetch;

let _adminAuthChecking = false;
async function ensureAdminAuth() {
  const token = getToken();
  const user = getUser();

  // Already authenticated as admin
  if (token && user && user.role === 'admin') {
    const userDisplay = document.getElementById('admin-user-display');
    if (userDisplay && user.name) userDisplay.textContent = user.name;
    return true;
  }

  // Not authenticated — redirect to dedicated admin login page
  if (!_adminAuthChecking) {
    _adminAuthChecking = true;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'login.html') {
      window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
    }
  }
  return false;
}

function checkAdminAuth() {
  const token = getToken();
  const user = getUser();
  if (!token || !user || user.role !== 'admin') {
    ensureAdminAuth().then(ok => {
      if (ok) {
        if (document.getElementById('admin-stats-grid') && typeof loadAdminDashboard === 'function') loadAdminDashboard();
        if (document.getElementById('admin-orders-page-tbody') && typeof loadAdminOrders === 'function') loadAdminOrders();
        if (document.getElementById('admin-coupons-tbody') && typeof loadAdminCoupons === 'function') loadAdminCoupons();
        if (document.getElementById('admin-shipping-tbody') && typeof loadAdminShipping === 'function') loadAdminShipping();
        if (document.getElementById('admin-invoices-tbody') && typeof loadAdminInvoices === 'function') loadAdminInvoices();
        if (document.getElementById('ai-funnel-container') && typeof loadAiRecommendations === 'function') loadAiRecommendations();
        if (document.getElementById('admin-logs-tbody') && typeof loadAdminLogs === 'function') loadAdminLogs();
        if (document.getElementById('admin-products-tbody') && typeof loadAdminProductsTable === 'function') loadAdminProductsTable();
        if (document.getElementById('banners-tbody') && typeof loadBanners === 'function') loadBanners();
        if (document.getElementById('flash-sales-table-container') && typeof loadFlashSalesPage === 'function') loadFlashSalesPage();
        if (document.getElementById('returns-table-container') && typeof loadReturnsPage === 'function') loadReturnsPage();
        if (document.getElementById('s-phone') && typeof loadSettings === 'function') loadSettings();
      }
    });
    return false;
  }
  const userDisplay = document.getElementById('admin-user-display');
  if (userDisplay && user.name) {
    userDisplay.textContent = user.name;
  }
  return true;
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase().replace(/_/g, '_');
  const label = (status || '').replace(/_/g, ' ');
  return `<span class="status-pill ${s}">${label}</span>`;
}

// ── CLEAR ALL SYSTEM ──────────────────────────────────────────
function clearAllFilters(context) {
  if (context === 'orders') {
    const search = document.getElementById('orders-search');
    const status = document.getElementById('orders-status-filter');
    const delayed = document.getElementById('orders-delayed-filter');
    const dateRange = document.getElementById('orders-date-filter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (delayed) delayed.checked = false;
    if (dateRange) dateRange.value = 'all';
    loadAdminOrders();
  } else if (context === 'coupons') {
    const search = document.getElementById('coupons-search');
    const status = document.getElementById('coupons-status-filter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    loadAdminCoupons();
  } else if (context === 'shipping') {
    const search = document.getElementById('shipping-search');
    const status = document.getElementById('shipping-status-filter');
    const delayed = document.getElementById('shipping-delayed-only');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (delayed) delayed.checked = false;
    loadAdminShipping();
  } else if (context === 'invoices') {
    const search = document.getElementById('invoices-search');
    const status = document.getElementById('invoices-status-filter');
    const dateRange = document.getElementById('invoices-date-filter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (dateRange) dateRange.value = 'all';
    loadAdminInvoices();
  } else if (context === 'activity') {
    const search = document.getElementById('logs-search');
    const module = document.getElementById('logs-module-filter');
    const dateRange = document.getElementById('logs-date-filter');
    if (search) search.value = '';
    if (module) module.value = 'all';
    if (dateRange) dateRange.value = 'all';
    loadAdminLogs();
  } else if (context === 'analytics') {
    const perfDate = document.getElementById('perf-date-filter');
    const profitDate = document.getElementById('profit-date-filter');
    if (perfDate) perfDate.value = 'all';
    if (profitDate) profitDate.value = 'all';
    loadProductPerformance();
    loadProfitReports();
  } else if (context === 'customers') {
    const search = document.getElementById('cust-search') || document.getElementById('customers-search');
    const status = document.getElementById('cust-status-filter') || document.getElementById('customers-status-filter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (typeof clearCustomerFilters === 'function') clearCustomerFilters();
    else if (typeof filterCustomers === 'function') filterCustomers();
    else if (typeof loadCustomersPage === 'function') loadCustomersPage();
    if (typeof loadAdminCustomers === 'function') loadAdminCustomers();
  } else if (context === 'reviews') {
    const search = document.getElementById('reviews-search');
    const status = document.getElementById('reviews-status');
    const rating = document.getElementById('reviews-rating');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (rating) rating.value = '0';
    if (typeof clearReviewFilters === 'function') clearReviewFilters();
    else if (typeof filterReviews === 'function') filterReviews();
    else if (typeof loadReviewsPage === 'function') loadReviewsPage();
  } else if (context === 'media') {
    const search = document.getElementById('media-search');
    if (search) search.value = '';
    if (typeof loadMedia === 'function') loadMedia();
  } else if (context === 'returns') {
    const search = document.getElementById('returns-search');
    const status = document.getElementById('returns-status-filter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (typeof loadReturnsPage === 'function') loadReturnsPage();
  } else if (context === 'flash-sales') {
    const search = document.getElementById('flash-sales-search');
    const status = document.getElementById('flash-sales-status-filter');
    if (search) search.value = '';
    if (status) status.value = 'all';
    if (typeof loadFlashSalesPage === 'function') loadFlashSalesPage();
  } else if (context === 'products') {
    const search = document.getElementById('products-search');
    const category = document.getElementById('products-category-filter');
    if (search) search.value = '';
    if (category) category.value = 'all';
    if (typeof loadAdminProductsTable === 'function') loadAdminProductsTable();
  } else if (context === 'banners') {
    if (typeof loadBanners === 'function') loadBanners();
  } else if (context === 'videos') {
    if (typeof loadVideosPage === 'function') loadVideosPage();
  } else if (context === 'email-logs') {
    const status = document.getElementById('email-logs-status-filter');
    if (status) status.value = 'all';
    if (typeof loadEmailLogs === 'function') loadEmailLogs();
  }

  if (typeof showToast === 'function') {
    showToast('✓ All filters cleared', 'info');
  }
}
window.clearAllFilters = clearAllFilters;

// ── GENUINE CLEAR DATA MODAL & ACTIONS ────────────────────────
let currentClearContext = null;

function openClearDataModal(context) {
  currentClearContext = context;
  const isCritical = ['orders', 'customers'].includes(context);
  
  const contextTitles = {
    orders: 'Orders',
    customers: 'Customer Accounts',
    coupons: 'Discount Coupons',
    reviews: 'Customer Reviews',
    activity: 'Audit Logs',
    media: 'Media Files',
    banners: 'Promotional Banners',
    shipping: 'Shipping Records'
  };
  const title = contextTitles[context] || 'Records';

  let filterDesc = 'matching your active search and filter criteria';
  if (context === 'orders') {
    const s = document.getElementById('orders-status-filter')?.value;
    if (s && s !== 'all') filterDesc += ` (Status: ${s})`;
  } else if (context === 'coupons') {
    const s = document.getElementById('coupons-status-filter')?.value;
    if (s && s !== 'all') filterDesc += ` (Status: ${s})`;
  } else if (context === 'customers') {
    const s = document.getElementById('cust-status-filter')?.value;
    if (s && s !== 'all') filterDesc += ` (Status: ${s})`;
  }

  let modalEl = document.getElementById('admin-clear-data-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'admin-clear-data-modal';
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px);">
      <div style="background:var(--bg-card, #1e293b);border-radius:14px;width:100%;max-width:500px;border:1px solid #ef4444;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);overflow:hidden;animation:fadeIn 0.2s ease;">
        <div style="background:linear-gradient(135deg, #dc2626, #b91c1c);color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:1.1rem;display:flex;align-items:center;gap:8px;font-weight:800;">
            <span>⚠️</span> Clear ${title} from Database
          </h3>
          <button onclick="closeClearDataModal()" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;line-height:1;">&times;</button>
        </div>
        <div style="padding:22px;color:var(--text-primary, #e2e8f0);font-size:0.9rem;">
          <div style="background:#ef444418;border-left:4px solid #ef4444;padding:12px 14px;border-radius:6px;margin-bottom:18px;color:#fca5a5;line-height:1.5;">
            <strong>Warning:</strong> This is a permanent database operation. Cleared data cannot be automatically restored.
          </div>

          <label style="font-weight:700;margin-bottom:10px;display:block;">Select Scope:</label>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:var(--bg-2, #0f172a);padding:10px 14px;border-radius:8px;border:1px solid var(--border-color, #334155);">
              <input type="radio" name="clear-scope" value="filtered" checked>
              <div>
                <strong>Clear Current Filtered Results</strong>
                <div style="font-size:0.75rem;color:var(--text-muted, #94a3b8);">${filterDesc}</div>
              </div>
            </label>
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;background:var(--bg-2, #0f172a);padding:10px 14px;border-radius:8px;border:1px solid var(--border-color, #334155);">
              <input type="radio" name="clear-scope" value="all">
              <div>
                <strong>Clear ALL ${title}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted, #94a3b8);">Permanently clear entire database collection for this module</div>
              </div>
            </label>
          </div>

          ${isCritical ? `
            <div style="margin-bottom:18px;">
              <label style="font-weight:700;display:block;margin-bottom:6px;color:#ef4444;">Safety Confirmation:</label>
              <p style="margin:0 0 8px 0;font-size:0.825rem;color:var(--text-secondary, #94a3b8);">
                Type <strong style="color:#fff;background:#dc2626;padding:2px 6px;border-radius:4px;letter-spacing:1px;">CLEAR</strong> below to confirm deletion:
              </p>
              <input type="text" id="clear-safety-input" class="form-control" placeholder="Type CLEAR" oninput="validateClearInput(this.value)" autocomplete="off" style="width:100%;text-transform:uppercase;font-weight:700;letter-spacing:1.5px;padding:10px 12px;">
            </div>
          ` : ''}

          <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;">
            <button class="btn btn-secondary btn-sm" onclick="closeClearDataModal()" style="padding:8px 16px;">Cancel</button>
            <button id="btn-execute-clear-data" class="btn btn-danger btn-sm" onclick="executeClearData('${context}')" ${isCritical ? 'disabled' : ''} style="background:#dc2626;color:#fff;border:none;padding:8px 18px;font-weight:700;opacity:${isCritical ? '0.5' : '1'};cursor:${isCritical ? 'not-allowed' : 'pointer'};">
              🗑️ Permanently Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function validateClearInput(val) {
  const btn = document.getElementById('btn-execute-clear-data');
  if (!btn) return;
  if (val && val.trim().toUpperCase() === 'CLEAR') {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  } else {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }
}

function closeClearDataModal() {
  const modalEl = document.getElementById('admin-clear-data-modal');
  if (modalEl) modalEl.innerHTML = '';
  currentClearContext = null;
}

async function executeClearData(context) {
  const btn = document.getElementById('btn-execute-clear-data');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner" style="width:14px;height:14px;display:inline-block;"></div> Clearing...';
  }

  const scope = document.querySelector('input[name="clear-scope"]:checked')?.value || 'filtered';

  let endpoint = '';
  let payload = { scope };

  if (context === 'orders') {
    endpoint = `${API_BASE}/orders/bulk-clear`;
    payload.status = document.getElementById('orders-status-filter')?.value || 'all';
    payload.search = document.getElementById('orders-search')?.value || '';
    payload.dateRange = document.getElementById('orders-date-filter')?.value || 'all';
  } else if (context === 'customers') {
    endpoint = `${API_BASE}/auth/users/bulk-clear`;
    payload.status = document.getElementById('cust-status-filter')?.value || 'all';
  } else if (context === 'coupons') {
    endpoint = `${API_BASE}/coupons/bulk-clear`;
    payload.status = document.getElementById('coupons-status-filter')?.value || 'all';
  } else if (context === 'reviews') {
    endpoint = `${API_BASE}/reviews/bulk-clear`;
    payload.status = document.getElementById('reviews-status')?.value || 'all';
  } else if (context === 'activity') {
    endpoint = `${API_BASE}/activity-logs/bulk-clear`;
    payload.module = document.getElementById('logs-module-filter')?.value || 'all';
    payload.dateRange = document.getElementById('logs-date-filter')?.value || 'all';
  } else if (context === 'media') {
    endpoint = `${API_BASE}/media/bulk-clear`;
  } else if (context === 'banners') {
    endpoint = `${API_BASE}/banners/bulk-clear`;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Records cleared successfully from database.', 'success');
      }
      closeClearDataModal();

      // Trigger re-render of active table & stats
      if (context === 'orders' && typeof loadAdminOrders === 'function') loadAdminOrders();
      else if (context === 'customers' && typeof filterCustomers === 'function') filterCustomers();
      else if (context === 'customers' && typeof loadAdminCustomers === 'function') loadAdminCustomers();
      else if (context === 'coupons' && typeof loadAdminCoupons === 'function') loadAdminCoupons();
      else if (context === 'reviews' && typeof loadReviewsPage === 'function') loadReviewsPage();
      else if (context === 'reviews' && typeof filterReviews === 'function') filterReviews();
      else if (context === 'activity' && typeof loadAdminLogs === 'function') loadAdminLogs();
      else if (context === 'media' && typeof loadMedia === 'function') loadMedia();
      else if (context === 'banners' && typeof loadBanners === 'function') loadBanners();
      
      if (typeof loadAdminDashboard === 'function') loadAdminDashboard();
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Failed to clear data.', 'error');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Permanently Clear';
      }
    }
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast('Error executing clear: ' + err.message, 'error');
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Permanently Clear';
    }
  }
}

window.openClearDataModal = openClearDataModal;
window.closeClearDataModal = closeClearDataModal;
window.validateClearInput = validateClearInput;
window.executeClearData = executeClearData;

// ── 1. DASHBOARD OVERVIEW ────────────────────────────────────
async function loadAdminDashboard() {
  if (!checkAdminAuth()) return;

  const statsContainer = document.getElementById('admin-stats-grid');
  const alertContainer = document.getElementById('dashboard-delayed-alert');

  try {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) return;

    const s = data.stats;
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon" style="background:#ecfdf5; color:#059669;">₹</div>
          <div>
            <div class="stat-val">₹${(s.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#eff6ff; color:#2563eb;">🛒</div>
          <div>
            <div class="stat-val">${s.totalOrders || 0}</div>
            <div class="stat-label">Orders (${s.completedOrders || 0} Delivered)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f5f3ff; color:#7c3aed;">👥</div>
          <div>
            <div class="stat-val">${s.totalCustomers || 0}</div>
            <div class="stat-label"><a href="customers.html" style="color:inherit;text-decoration:none;">Customers →</a></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7; color:#d97706;">📦</div>
          <div>
            <div class="stat-val">${s.totalProducts || 0}</div>
            <div class="stat-label"><a href="products.html" style="color:inherit;text-decoration:none;">Products →</a></div>
          </div>
        </div>
        <div class="stat-card" style="${(s.lowStockCount || 0) > 0 ? 'border-left: 4px solid #dc2626;' : ''}">
          <div class="stat-icon" style="background:#fee2e2; color:#dc2626;">⚠️</div>
          <div>
            <div class="stat-val" style="color:${(s.lowStockCount || 0) > 0 ? '#dc2626' : 'inherit'};">${s.lowStockCount || 0}</div>
            <div class="stat-label">Low Stock (${s.outOfStockCount || 0} Out)</div>
          </div>
        </div>
        <div class="stat-card" style="${(s.pendingOrders || 0) > 0 ? 'border-left: 4px solid #ea580c;' : ''}">
          <div class="stat-icon" style="background:#ffedd5; color:#ea580c;">⏳</div>
          <div>
            <div class="stat-val" style="color:${(s.pendingOrders || 0) > 0 ? '#ea580c' : 'inherit'};">${s.pendingOrders || 0}</div>
            <div class="stat-label"><a href="orders.html" style="color:inherit;text-decoration:none;">Pending Orders →</a></div>
          </div>
        </div>
      `;
    }

    if (alertContainer) {
      if (s.delayedOrders > 0) {
        alertContainer.classList.remove('hidden');
        alertContainer.innerHTML = `
          <div class="delayed-alert-icon">⚠️</div>
          <div style="flex: 1;">
            <div class="delayed-alert-title">Attention: ${s.delayedOrders} Order(s) Have Exceeded Expected Delivery Date!</div>
            <div class="delayed-alert-desc">Immediate action required. Review shipment tracking and update customers.</div>
          </div>
          <a href="shipping.html" class="btn btn-sm btn-primary" style="background: #E11D48; border: none;">Manage Delayed Shipments →</a>
        `;
      } else {
        alertContainer.classList.add('hidden');
      }
    }

    loadAdminOrdersTable(6);
    if (typeof loadInventoryAlerts === 'function') {
      loadInventoryAlerts();
    }
    if (typeof loadRecentCustomers === 'function') {
      loadRecentCustomers();
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

async function loadAdminOrdersTable(limit = 6) {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/orders?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success || !data.orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">No recent orders found</td></tr>';
      return;
    }

    tbody.innerHTML = data.orders.slice(0, limit).map(o => `
      <tr>
        <td>
          <strong>${o.orderNumber}</strong>
          ${o.isDelayed ? '<br><span class="delayed-tag">⚠️ DELAYED</span>' : ''}
        </td>
        <td>${o.shippingAddress?.fullName || o.user?.name || 'Customer'}<br><span style="font-size:0.75rem; color:var(--text-muted);">${o.shippingAddress?.city || ''}</span></td>
        <td>${o.items?.length || 0} items</td>
        <td><strong>₹${(o.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td>${o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openOrderDetailsModal('${o._id}')">View</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #DC2626;">Error loading recent orders</td></tr>';
  }
}

async function loadRecentCustomers(limit = 5) {
  const container = document.getElementById('recent-customers-container');
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    const users = (data.users || data.customers || []).filter(u => u.role !== 'admin');
    if (!users.length) {
      container.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center;">No recent customers</div>';
      return;
    }
    const recent = users.slice(0, limit);
    container.innerHTML = recent.map(u => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:50%;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">
            ${(u.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-weight:700;font-size:0.88rem;">${u.name || 'Customer'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${u.email || ''}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem;padding:2px 8px;border-radius:12px;background:#DCFCE7;color:#15803D;font-weight:700;">${u.orderCount !== undefined ? u.orderCount : 1} Orders</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="color:var(--text-muted);padding:14px;text-align:center;">Customers list ready</div>`;
  }
}

// ── 2. COUPON / DISCOUNT MANAGER ─────────────────────────────
async function loadAdminCoupons() {
  if (!checkAdminAuth()) return;

  const tbody = document.getElementById('admin-coupons-tbody');
  const statsContainer = document.getElementById('coupons-stats-row');
  if (!tbody) return;

  const search = document.getElementById('coupons-search')?.value || '';
  const status = document.getElementById('coupons-status-filter')?.value || 'all';

  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;"><div class="loading-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/coupons?search=${encodeURIComponent(search)}&status=${status}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (statsContainer && data.stats) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">🏷️</div>
          <div><div class="stat-val">${data.stats.totalCoupons}</div><div class="stat-label">Total Coupons</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#D1FAE5; color:#065F46;">✅</div>
          <div><div class="stat-val">${data.stats.activeCount}</div><div class="stat-label">Active Coupons</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#FEE2E2; color:#991B1B;">⏰</div>
          <div><div class="stat-val">${data.stats.expiredCount}</div><div class="stat-label">Expired Coupons</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div><div class="stat-val">₹${(data.stats.totalDiscountGenerated || 0).toLocaleString('en-IN')}</div><div class="stat-label">Total Discount Given</div></div>
        </div>
      `;
    }

    if (!data.coupons.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No coupons match your criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = data.coupons.map(c => {
      const isExp = c.computedStatus === 'EXPIRED';
      const isAct = c.computedStatus === 'ACTIVE';
      const statusClass = isAct ? 'active' : isExp ? 'expired' : 'inactive';

      return `
        <tr>
          <td>
            <strong style="font-family:monospace; font-size:0.95rem; color:var(--brand);">${c.code}</strong>
            <br><span style="font-size:0.75rem; color:var(--text-muted);">${c.description || 'No description'}</span>
          </td>
          <td>
            <strong>${c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}</strong>
            ${c.maxDiscount ? `<br><span style="font-size:0.75rem; color:var(--text-muted);">Max ₹${c.maxDiscount}</span>` : ''}
          </td>
          <td>₹${(c.minOrderValue || 0).toLocaleString('en-IN')}</td>
          <td>
            <strong>${c.usedCount || 0}</strong> ${c.usageLimit ? `/ ${c.usageLimit}` : 'uses'}
            <br><span style="font-size:0.75rem; color:var(--text-muted);">₹${(c.totalDiscountGenerated || 0).toLocaleString('en-IN')} saved</span>
          </td>
          <td>
            <span style="font-size:0.75rem;">
              ${c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN') : 'Immediate'} to
              <br><strong>${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'No Expiry'}</strong>
            </span>
          </td>
          <td>
            <span class="status-pill ${statusClass}">${c.computedStatus}</span>
          </td>
          <td>
            <button class="btn btn-sm ${c.isActive ? 'btn-secondary' : 'btn-primary'}" onclick="toggleCouponStatus('${c._id}')">
              ${c.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-ghost btn-sm" onclick="openEditCouponModal('${c._id}')" title="Edit">✏️</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteCoupon('${c._id}', '${c.code}')" style="color:#DC2626;" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#DC2626; padding:20px;">Failed to load coupons: ${err.message}</td></tr>`;
  }
}

async function toggleCouponStatus(id) {
  try {
    const res = await fetch(`${API_BASE}/coupons/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminCoupons();
    } else {
      showToast(data.message || 'Failed to toggle coupon', 'error');
    }
  } catch {
    showToast('Network error toggling coupon', 'error');
  }
}

async function deleteCoupon(id, code) {
  if (!confirm(`Are you sure you want to delete coupon "${code}"? This cannot be undone.`)) return;

  try {
    const res = await fetch(`${API_BASE}/coupons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Coupon ${code} deleted.`, 'success');
      loadAdminCoupons();
    } else {
      showToast(data.message || 'Failed to delete coupon', 'error');
    }
  } catch {
    showToast('Network error deleting coupon', 'error');
  }
}

function openCreateCouponModal() {
  document.getElementById('coupon-modal-title').textContent = 'Create New Coupon';
  document.getElementById('coupon-form').reset();
  document.getElementById('coupon-edit-id').value = '';
  document.getElementById('coupon-is-active').checked = true;
  document.getElementById('coupon-modal').classList.add('active');
}

async function openEditCouponModal(id) {
  try {
    const res = await fetch(`${API_BASE}/coupons`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    const coupon = data.coupons.find(c => c._id === id);
    if (!coupon) return showToast('Coupon not found', 'error');

    document.getElementById('coupon-modal-title').textContent = `Edit Coupon: ${coupon.code}`;
    document.getElementById('coupon-edit-id').value = coupon._id;
    document.getElementById('coupon-code').value = coupon.code;
    document.getElementById('coupon-desc').value = coupon.description || '';
    document.getElementById('coupon-type').value = coupon.discountType;
    document.getElementById('coupon-value').value = coupon.discountValue;
    document.getElementById('coupon-min-order').value = coupon.minOrderValue || 0;
    document.getElementById('coupon-max-disc').value = coupon.maxDiscount || '';
    document.getElementById('coupon-usage-limit').value = coupon.usageLimit || '';
    document.getElementById('coupon-cust-limit').value = coupon.perCustomerLimit || 1;
    if (coupon.startDate) {
      document.getElementById('coupon-start-date').value = new Date(coupon.startDate).toISOString().slice(0, 10);
    }
    if (coupon.expiresAt) {
      document.getElementById('coupon-expiry-date').value = new Date(coupon.expiresAt).toISOString().slice(0, 10);
    }
    document.getElementById('coupon-is-active').checked = coupon.isActive;
    document.getElementById('coupon-modal').classList.add('active');
  } catch {
    showToast('Failed to fetch coupon details', 'error');
  }
}

async function saveCouponForm(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('coupon-edit-id').value;
  const payload = {
    code: document.getElementById('coupon-code').value.trim().toUpperCase(),
    description: document.getElementById('coupon-desc').value.trim(),
    discountType: document.getElementById('coupon-type').value,
    discountValue: Number(document.getElementById('coupon-value').value),
    minOrderValue: Number(document.getElementById('coupon-min-order').value) || 0,
    maxDiscount: document.getElementById('coupon-max-disc').value ? Number(document.getElementById('coupon-max-disc').value) : null,
    usageLimit: document.getElementById('coupon-usage-limit').value ? Number(document.getElementById('coupon-usage-limit').value) : null,
    perCustomerLimit: Number(document.getElementById('coupon-cust-limit').value) || 1,
    startDate: document.getElementById('coupon-start-date').value || new Date(),
    expiresAt: document.getElementById('coupon-expiry-date').value || null,
    isActive: document.getElementById('coupon-is-active').checked
  };

  const url = id ? `${API_BASE}/coupons/${id}` : `${API_BASE}/coupons`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Coupon updated successfully' : 'Coupon created successfully', 'success');
      document.getElementById('coupon-modal').classList.remove('active');
      loadAdminCoupons();
    } else {
      showToast(data.message || 'Error saving coupon', 'error');
    }
  } catch (err) {
    showToast('Server connection failed', 'error');
  }
}

// ── 3. ORDER MANAGEMENT & 10 STATUSES ─────────────────────────
async function loadAdminOrders() {
  if (!checkAdminAuth()) return;

  const tbody = document.getElementById('admin-orders-page-tbody');
  const statsContainer = document.getElementById('orders-stats-row');
  if (!tbody) return;

  const search = document.getElementById('orders-search')?.value || '';
  const status = document.getElementById('orders-status-filter')?.value || 'all';
  const delayed = document.getElementById('orders-delayed-filter')?.checked ? 'true' : 'false';
  const dateRange = document.getElementById('orders-date-filter')?.value || 'all';

  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;"><div class="loading-spinner"></div></td></tr>';

  try {
    const url = `${API_BASE}/orders?search=${encodeURIComponent(search)}&status=${status}&delayed=${delayed}&dateRange=${dateRange}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (statsContainer && data.stats) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">📑</div>
          <div><div class="stat-val">${data.stats.totalOrders}</div><div class="stat-label">Total Orders</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#FEF3C7; color:#92400E;">⏳</div>
          <div><div class="stat-val">${data.stats.pendingCount}</div><div class="stat-label">Pending / Processing</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#D1FAE5; color:#065F46;">🚚</div>
          <div><div class="stat-val">${data.stats.deliveredCount}</div><div class="stat-label">Delivered Orders</div></div>
        </div>
        <div class="stat-card" style="border-left:4px solid #E11D48;">
          <div class="stat-icon" style="background:#FFE4E6; color:#E11D48;">⚠️</div>
          <div><div class="stat-val" style="color:#E11D48;">${data.stats.delayedCount}</div><div class="stat-label">Delayed Shipments</div></div>
        </div>
      `;
    }

    if (!data.orders.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No orders match your filter criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = data.orders.map(o => `
      <tr>
        <td>
          <strong style="color:var(--text-primary);">${o.orderNumber}</strong>
          ${o.isDelayed ? '<br><span class="delayed-tag">⚠️ DELAYED</span>' : ''}
        </td>
        <td>
          <a href="javascript:void(0)" onclick="openInvoiceModal('${o._id}')" style="font-family:monospace; font-weight:700; color:var(--brand); font-size:0.8rem;">
            ${o.invoiceNumber || 'PX-INV-2026-N/A'}
          </a>
        </td>
        <td>
          <strong>${o.shippingAddress?.fullName || o.user?.name || 'Customer'}</strong>
          <br><span style="font-size:0.75rem; color:var(--text-muted);">${o.shippingAddress?.city || ''}, ${o.shippingAddress?.state || ''}</span>
        </td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
        <td><strong>₹${(o.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
        <td>${getStatusBadge(o.status)}</td>
        <td>
          <select class="form-control" style="padding:4px 8px; font-size:0.78rem; width:130px;" onchange="updateOrderStatusInline('${o._id}', this.value)">
            <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="CONFIRMED" ${o.status === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED</option>
            <option value="PROCESSING" ${o.status === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
            <option value="PACKED" ${o.status === 'PACKED' ? 'selected' : ''}>PACKED</option>
            <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
            <option value="OUT_FOR_DELIVERY" ${o.status === 'OUT_FOR_DELIVERY' ? 'selected' : ''}>OUT FOR DELIV</option>
            <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
            <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
            <option value="RETURNED" ${o.status === 'RETURNED' ? 'selected' : ''}>RETURNED</option>
            <option value="REFUNDED" ${o.status === 'REFUNDED' ? 'selected' : ''}>REFUNDED</option>
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openOrderDetailsModal('${o._id}')">Details</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#DC2626; padding:20px;">Error loading orders: ${err.message}</td></tr>`;
  }
}

async function updateOrderStatusInline(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status: newStatus, comment: `Admin quick-updated status to ${newStatus}` })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order status updated to ${newStatus}`, 'success');
      loadAdminOrders();
    } else {
      showToast(data.message || 'Status update failed', 'error');
    }
  } catch {
    showToast('Failed to connect to server', 'error');
  }
}

async function openOrderDetailsModal(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const o = data.order;

    const modal = document.getElementById('order-details-modal');
    if (!modal) return;

    document.getElementById('od-modal-order-number').textContent = o.orderNumber;
    document.getElementById('od-modal-invoice-number').textContent = o.invoiceNumber || 'PX-INV-2026-N/A';
    document.getElementById('od-modal-status-badge').innerHTML = getStatusBadge(o.status);
    document.getElementById('od-modal-date').textContent = new Date(o.createdAt).toLocaleString('en-IN');
    
    // Customer Info
    document.getElementById('od-modal-customer-name').textContent = o.shippingAddress?.fullName || o.user?.name || 'Customer';
    document.getElementById('od-modal-customer-email').textContent = o.user?.email || 'N/A';
    document.getElementById('od-modal-customer-phone').textContent = o.shippingAddress?.phone || o.user?.phone || 'N/A';
    document.getElementById('od-modal-customer-address').textContent = `${o.shippingAddress?.addressLine || ''}, ${o.shippingAddress?.city || ''}, ${o.shippingAddress?.state || ''} - ${o.shippingAddress?.postalCode || ''}`;

    // Shipping Info
    document.getElementById('od-modal-carrier').textContent = o.shippingProvider || 'BlueDart Express';
    document.getElementById('od-modal-tracking').textContent = o.trackingNumber || 'N/A';
    document.getElementById('od-modal-exp-delivery').textContent = o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Not Set';
    document.getElementById('od-modal-window').textContent = o.deliveryTimeWindow || 'Standard';

    // Items List
    const itemsTbody = document.getElementById('od-modal-items-tbody');
    itemsTbody.innerHTML = (o.items || []).map(item => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${item.productImage || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=80'}" style="width:36px; height:36px; border-radius:4px; object-fit:cover;">
            <div>
              <strong>${item.productName}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">${item.flavor ? item.flavor + ' | ' : ''}${item.size || ''}</div>
            </div>
          </div>
        </td>
        <td>${item.quantity}</td>
        <td>₹${(item.price || 0).toLocaleString('en-IN')}</td>
        <td><strong>₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</strong></td>
      </tr>
    `).join('');

    // Pricing Breakdown
    document.getElementById('od-modal-subtotal').textContent = `₹${(o.subtotal || 0).toLocaleString('en-IN')}`;
    document.getElementById('od-modal-discount').textContent = o.discountAmount ? `-₹${o.discountAmount.toLocaleString('en-IN')} (${o.couponCode || 'Coupon'})` : '₹0';
    document.getElementById('od-modal-tax').textContent = `₹${(o.taxAmount || Math.round(o.subtotal * 0.05)).toLocaleString('en-IN')}`;
    document.getElementById('od-modal-shipping').textContent = o.shippingAmount ? `₹${o.shippingAmount}` : 'FREE';
    document.getElementById('od-modal-total').textContent = `₹${(o.totalAmount || 0).toLocaleString('en-IN')}`;
    
    // Refund banner if refunded
    const refundBox = document.getElementById('od-modal-refund-info');
    if (o.refundAmount && o.refundAmount > 0) {
      refundBox.style.display = 'block';
      refundBox.innerHTML = `
        <div style="background:#FFF1F2; border:1px solid #FECDD3; border-radius:8px; padding:12px; color:#9F1239; font-size:0.85rem;">
          <strong>💸 Refund Processed:</strong> ₹${o.refundAmount.toLocaleString('en-IN')} on ${new Date(o.refundedAt).toLocaleDateString('en-IN')}
          <br>Reason: ${o.refundReason || 'Customer requested'}
        </div>
      `;
    } else {
      refundBox.style.display = 'none';
    }

    // Timeline History
    const timelineContainer = document.getElementById('od-modal-timeline');
    timelineContainer.innerHTML = (o.history || []).map(h => `
      <div class="timeline-item">
        <div class="timeline-time">${new Date(h.changedAt).toLocaleString('en-IN')} • Changed by: <strong>${h.changedBy || 'SYSTEM'}</strong></div>
        <div class="timeline-title">${getStatusBadge(h.status)}</div>
        <div class="timeline-comment">${h.comment || ''}</div>
      </div>
    `).join('');

    // Set action targets
    document.getElementById('od-btn-set-shipping').onclick = () => {
      modal.classList.remove('active');
      openShippingModal(o._id);
    };
    document.getElementById('od-btn-refund').onclick = () => {
      openRefundModal(o._id, o.totalAmount);
    };
    document.getElementById('od-btn-invoice').onclick = () => {
      modal.classList.remove('active');
      openInvoiceModal(o._id);
    };

    modal.classList.add('active');
  } catch (err) {
    showToast(`Failed to load order details: ${err.message}`, 'error');
  }
}

// ── 4. SHIPPING & DELIVERY MANAGEMENT ─────────────────────────
async function loadAdminShipping() {
  if (!checkAdminAuth()) return;

  const tbody = document.getElementById('admin-shipping-tbody');
  const alertContainer = document.getElementById('shipping-delayed-banner');
  const statsContainer = document.getElementById('shipping-stats-row');
  if (!tbody) return;

  const search = document.getElementById('shipping-search')?.value || '';
  const status = document.getElementById('shipping-status-filter')?.value || 'all';
  const delayedOnly = document.getElementById('shipping-delayed-only')?.checked ? 'true' : 'false';

  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;"><div class="loading-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/orders?search=${encodeURIComponent(search)}&status=${status}&delayed=${delayedOnly}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const orders = data.orders || [];
    const delayedCount = orders.filter(o => o.isDelayed).length;
    const inTransit = orders.filter(o => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">🚚</div>
          <div><div class="stat-val">${inTransit}</div><div class="stat-label">In Transit / Out for Delivery</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#D1FAE5; color:#065F46;">✅</div>
          <div><div class="stat-val">${delivered}</div><div class="stat-label">Delivered Successfully</div></div>
        </div>
        <div class="stat-card" style="border-left:4px solid #E11D48;">
          <div class="stat-icon" style="background:#FFE4E6; color:#E11D48;">⚠️</div>
          <div><div class="stat-val" style="color:#E11D48;">${delayedCount}</div><div class="stat-label">Delayed Beyond Expected Date</div></div>
        </div>
      `;
    }

    if (alertContainer) {
      if (delayedCount > 0) {
        alertContainer.classList.remove('hidden');
        alertContainer.innerHTML = `
          <div class="delayed-alert-icon">⚠️</div>
          <div>
            <div class="delayed-alert-title">Delayed Delivery Alert (${delayedCount} order${delayedCount > 1 ? 's' : ''})</div>
            <div class="delayed-alert-desc">The current date has surpassed the expected delivery date for these orders. Please verify tracking or reschedule delivery with the carrier.</div>
          </div>
        `;
      } else {
        alertContainer.classList.add('hidden');
      }
    }

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px; color:var(--text-muted);">No shipping records found.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td>
          <strong>${o.orderNumber}</strong>
          ${o.isDelayed ? '<br><span class="delayed-tag">⚠️ DELAYED</span>' : ''}
        </td>
        <td>
          <strong>${o.shippingAddress?.fullName || o.user?.name || 'Customer'}</strong>
          <br><span style="font-size:0.75rem; color:var(--text-muted);">${o.shippingAddress?.city || ''}</span>
        </td>
        <td>
          <strong>${o.shippingProvider || 'BlueDart'}</strong>
          <br><span style="font-size:0.75rem; font-family:monospace; color:var(--brand);">${o.trackingNumber || 'TRK-N/A'}</span>
        </td>
        <td>
          ${o.expectedDeliveryDate ? `<strong>${new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN')}</strong>` : '<span style="color:var(--text-muted);">Not Set</span>'}
          <br><span style="font-size:0.75rem; color:var(--text-muted);">${o.deliveryTimeWindow || '10 AM - 6 PM'}</span>
        </td>
        <td>${o.actualDeliveryDate ? new Date(o.actualDeliveryDate).toLocaleDateString('en-IN') : '<span style="color:var(--text-muted);">Pending</span>'}</td>
        <td>${getStatusBadge(o.status)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="openShippingModal('${o._id}')">Set Dates</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#DC2626; padding:20px;">Failed to load shipping data: ${err.message}</td></tr>`;
  }
}

async function openShippingModal(orderId) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const o = data.order;

    document.getElementById('ship-modal-order-id').value = o._id;
    document.getElementById('ship-modal-order-title').textContent = `Shipping Management: ${o.orderNumber}`;
    document.getElementById('ship-modal-carrier').value = o.shippingProvider || 'BlueDart Express';
    document.getElementById('ship-modal-tracking').value = o.trackingNumber || '';
    document.getElementById('ship-modal-window').value = o.deliveryTimeWindow || '10:00 AM - 02:00 PM';
    document.getElementById('ship-modal-notes').value = o.deliveryNotes || '';

    if (o.expectedShippingDate) {
      document.getElementById('ship-modal-exp-ship').value = new Date(o.expectedShippingDate).toISOString().slice(0, 10);
    } else {
      document.getElementById('ship-modal-exp-ship').value = new Date().toISOString().slice(0, 10);
    }

    if (o.expectedDeliveryDate) {
      document.getElementById('ship-modal-exp-del').value = new Date(o.expectedDeliveryDate).toISOString().slice(0, 10);
    } else {
      const future = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      document.getElementById('ship-modal-exp-del').value = future.toISOString().slice(0, 10);
    }

    if (o.actualDeliveryDate) {
      document.getElementById('ship-modal-act-del').value = new Date(o.actualDeliveryDate).toISOString().slice(0, 10);
    } else {
      document.getElementById('ship-modal-act-del').value = '';
    }

    document.getElementById('ship-modal-created-at').value = o.createdAt;
    document.getElementById('shipping-modal').classList.add('active');
  } catch (err) {
    showToast('Failed to open shipping details', 'error');
  }
}

async function saveShippingModal(e) {
  if (e) e.preventDefault();
  const orderId = document.getElementById('ship-modal-order-id').value;
  const expShip = document.getElementById('ship-modal-exp-ship').value;
  const expDel = document.getElementById('ship-modal-exp-del').value;
  const actDel = document.getElementById('ship-modal-act-del').value;
  const createdAt = document.getElementById('ship-modal-created-at').value;

  if (expDel && createdAt && new Date(expDel) < new Date(new Date(createdAt).setHours(0,0,0,0))) {
    showToast('Expected Delivery Date cannot be earlier than order creation date!', 'error');
    return;
  }
  if (expShip && expDel && new Date(expShip) > new Date(expDel)) {
    showToast('Expected Shipping Date cannot be later than Expected Delivery Date!', 'error');
    return;
  }

  const payload = {
    shippingProvider: document.getElementById('ship-modal-carrier').value,
    trackingNumber: document.getElementById('ship-modal-tracking').value.trim(),
    deliveryTimeWindow: document.getElementById('ship-modal-window').value,
    expectedShippingDate: expShip || null,
    expectedDeliveryDate: expDel || null,
    actualDeliveryDate: actDel || null,
    deliveryNotes: document.getElementById('ship-modal-notes').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/shipping`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Shipping details updated successfully!', 'success');
      document.getElementById('shipping-modal').classList.remove('active');
      loadAdminShipping();
    } else {
      showToast(data.message || 'Validation error updating shipping', 'error');
    }
  } catch {
    showToast('Network error saving shipping', 'error');
  }
}

function openRefundModal(orderId, maxAmount) {
  const reason = prompt(`Enter refund reason for Order (Max refund: ₹${maxAmount}):`);
  if (reason === null) return;
  const amount = prompt(`Enter refund amount in ₹ (Up to ₹${maxAmount}):`, maxAmount);
  if (!amount) return;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > maxAmount) {
    showToast('Invalid refund amount', 'error');
    return;
  }

  processRefund(orderId, numAmount, reason || 'Customer requested refund');
}

async function processRefund(orderId, amount, reason) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ refundAmount: amount, refundReason: reason })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      const detailsModal = document.getElementById('order-details-modal');
      if (detailsModal) detailsModal.classList.remove('active');
      loadAdminOrders();
    } else {
      showToast(data.message || 'Failed to process refund', 'error');
    }
  } catch {
    showToast('Network error processing refund', 'error');
  }
}

// ── 5. INVOICE MANAGEMENT ─────────────────────────────────────
async function loadAdminInvoices() {
  if (!checkAdminAuth()) return;

  const tbody = document.getElementById('admin-invoices-tbody');
  const statsContainer = document.getElementById('invoices-stats-row');
  if (!tbody) return;

  const search = document.getElementById('invoices-search')?.value || '';
  const status = document.getElementById('invoices-status-filter')?.value || 'all';
  const dateRange = document.getElementById('invoices-date-filter')?.value || 'all';

  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;"><div class="loading-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/invoices?search=${encodeURIComponent(search)}&status=${status}&dateRange=${dateRange}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (statsContainer && data.stats) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div><div class="stat-val">${data.stats.totalInvoices}</div><div class="stat-label">Invoices Generated</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">₹</div>
          <div><div class="stat-val">₹${(data.stats.totalBilled || 0).toLocaleString('en-IN')}</div><div class="stat-label">Total Invoiced Amount</div></div>
        </div>
      `;
    }

    if (!data.invoices.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">No invoices found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.invoices.map(inv => `
      <tr>
        <td><strong style="font-family:monospace; color:var(--brand);">${inv.invoiceNumber}</strong></td>
        <td>${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
        <td><strong>${inv.orderNumber}</strong></td>
        <td>${inv.customerName}<br><span style="font-size:0.75rem; color:var(--text-muted);">${inv.customerEmail}</span></td>
        <td><strong>₹${(inv.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
        <td><span class="status-pill ${inv.paymentStatus === 'PAID' ? 'active' : 'pending'}">${inv.paymentStatus} (${inv.paymentMethod})</span></td>
        <td>${getStatusBadge(inv.orderStatus)}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="openInvoiceModal('${inv.orderId}')">View</button>
            <button class="btn btn-ghost btn-sm" onclick="openInvoiceModal('${inv.orderId}', true)">🖨️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#DC2626; padding:20px;">Error loading invoices: ${err.message}</td></tr>`;
  }
}

async function openInvoiceModal(orderIdOrNumber, autoPrint = false) {
  try {
    const res = await fetch(`${API_BASE}/invoices/${orderIdOrNumber}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const inv = data.invoice;

    const sheet = document.getElementById('invoice-render-sheet');
    if (!sheet) return;

    sheet.innerHTML = `
      <div class="invoice-brand-row">
        <div>
          <div style="font-size:1.8rem; font-weight:900; color:#EB5E28; letter-spacing:1px;">PROTEIN<span style="color:#0F172A;">X</span></div>
          <div style="font-size:0.85rem; font-weight:700; color:#0F172A; margin-top:2px;">${inv.company.name}</div>
          <div style="font-size:0.75rem; color:#64748B; max-width:320px; margin-top:4px;">${inv.company.address}</div>
          <div style="font-size:0.75rem; color:#475569; margin-top:4px;">
            <strong>GSTIN:</strong> ${inv.company.gstin} | <strong>PAN:</strong> ${inv.company.pan}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.3rem; font-weight:900; text-transform:uppercase; color:#0F172A;">TAX INVOICE</div>
          <div style="font-family:monospace; font-size:1rem; font-weight:800; color:#EB5E28; margin-top:4px;">${inv.invoiceNumber}</div>
          <div style="font-size:0.8rem; color:#64748B; margin-top:4px;">Date: <strong>${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</strong></div>
          <div style="font-size:0.8rem; color:#64748B;">Order: <strong>${inv.orderNumber}</strong></div>
          <div style="font-size:0.8rem; color:#64748B;">Payment: <strong>${inv.paymentMethod} (${inv.paymentStatus})</strong></div>
        </div>
      </div>

      <div class="invoice-meta-grid">
        <div style="background:#F8FAFC; padding:12px 16px; border-radius:8px; border:1px solid #E2E8F0;">
          <div style="font-size:0.75rem; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:6px;">BILLED TO / SHIP TO:</div>
          <div style="font-size:0.95rem; font-weight:800; color:#0F172A;">${inv.customer.name}</div>
          <div style="color:#475569; margin-top:2px;">${inv.customer.shippingAddress.addressLine}</div>
          <div style="color:#475569;">${inv.customer.shippingAddress.city}, ${inv.customer.shippingAddress.state} - ${inv.customer.shippingAddress.postalCode}</div>
          <div style="color:#475569; margin-top:4px;"><strong>Phone:</strong> ${inv.customer.phone} | <strong>Email:</strong> ${inv.customer.email}</div>
        </div>
        <div style="background:#F8FAFC; padding:12px 16px; border-radius:8px; border:1px solid #E2E8F0;">
          <div style="font-size:0.75rem; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:6px;">LOGISTICS DETAILS:</div>
          <div><strong>Carrier:</strong> ${inv.shipping.provider}</div>
          <div><strong>Tracking Number:</strong> ${inv.shipping.trackingNumber}</div>
          <div><strong>Delivery Window:</strong> ${inv.shipping.deliveryTimeWindow}</div>
          <div><strong>Expected Delivery:</strong> ${inv.shipping.expectedDeliveryDate ? new Date(inv.shipping.expectedDeliveryDate).toLocaleDateString('en-IN') : 'Standard'}</div>
        </div>
      </div>

      <table class="data-table" style="margin-bottom:16px;">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Size / Flavor</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Taxable Value</th>
            <th style="text-align:right;">GST (5%)</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items.map(item => `
            <tr>
              <td><strong>${item.productName}</strong></td>
              <td>${item.size} / ${item.flavor}</td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
              <td style="text-align:right;">₹${item.taxableValue.toLocaleString('en-IN')}</td>
              <td style="text-align:right;">₹${item.taxAmount.toLocaleString('en-IN')}</td>
              <td style="text-align:right;"><strong>₹${item.total.toLocaleString('en-IN')}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-size:0.75rem; color:#64748B; max-width:320px; line-height:1.5;">
          ${inv.notes}
          <br><br>
          <strong>Authorized Signatory:</strong>
          <div style="margin-top:20px; border-bottom:1px solid #CBD5E1; width:180px;"></div>
          NUTRATEIN NUTRITION INDIA PVT. LTD.
        </div>

        <div class="invoice-pricing-summary">
          <div class="row"><span>Subtotal:</span><strong>₹${inv.pricing.subtotal.toLocaleString('en-IN')}</strong></div>
          ${inv.pricing.discountAmount > 0 ? `<div class="row" style="color:#16A34A;"><span>Discount (${inv.pricing.couponCode || 'Coupon'}):</span><strong>-₹${inv.pricing.discountAmount.toLocaleString('en-IN')}</strong></div>` : ''}
          <div class="row"><span>GST (5% Included):</span><strong>₹${inv.pricing.taxAmount.toLocaleString('en-IN')}</strong></div>
          <div class="row"><span>Shipping Charges:</span><strong>${inv.pricing.shippingAmount > 0 ? `₹${inv.pricing.shippingAmount}` : 'FREE'}</strong></div>
          <div class="row grand-total"><span>Grand Total:</span><span style="color:#EB5E28;">₹${inv.pricing.totalAmount.toLocaleString('en-IN')}</span></div>
          ${inv.pricing.refundAmount > 0 ? `<div class="row" style="color:#DC2626; margin-top:4px;"><span>Refund Issued:</span><strong>-₹${inv.pricing.refundAmount.toLocaleString('en-IN')}</strong></div><div class="row" style="font-weight:700;"><span>Net Paid:</span><strong>₹${inv.pricing.netPaid.toLocaleString('en-IN')}</strong></div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('invoice-modal').classList.add('active');

    if (autoPrint) {
      setTimeout(() => { window.print(); }, 400);
    }
  } catch (err) {
    showToast(`Failed to open invoice: ${err.message}`, 'error');
  }
}

// ── 6. ANALYTICS & ADVANCED REPORTS ───────────────────────────
function switchAnalyticsTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const btn = document.getElementById(`tab-btn-${tabName}`);
  const pane = document.getElementById(`tab-pane-${tabName}`);
  if (btn) btn.classList.add('active');
  if (pane) pane.classList.add('active');

  if (tabName === 'ai') loadAiRecommendations();
  else if (tabName === 'products') loadProductPerformance();
  else if (tabName === 'profit') loadProfitReports();
}

async function loadAiRecommendations() {
  if (!checkAdminAuth()) return;

  const funnelContainer = document.getElementById('ai-funnel-container');
  const pairsContainer = document.getElementById('ai-pairs-tbody');
  if (!funnelContainer) return;

  funnelContainer.innerHTML = '<div style="text-align:center; padding:20px;"><div class="loading-spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/analytics/ai-recommendations`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const f = data.funnel;
    const r = f.rates;

    funnelContainer.innerHTML = `
      <div class="funnel-step">
        <div class="funnel-bar" style="width: 100%;"></div>
        <div class="funnel-content">
          <div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Stage 1: Impressions</div>
            <div style="font-size:1.3rem; font-weight:900;">${f.impressions.toLocaleString('en-IN')}</div>
          </div>
          <span class="status-pill info">Catalog Exposure 100%</span>
        </div>
      </div>

      <div class="funnel-step">
        <div class="funnel-bar" style="width: ${Math.max(10, Math.min(100, r.clickThroughRate * 3))}%;"></div>
        <div class="funnel-content">
          <div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Stage 2: Clicks</div>
            <div style="font-size:1.3rem; font-weight:900;">${f.clicks.toLocaleString('en-IN')}</div>
          </div>
          <span class="status-pill warning">CTR: ${r.clickThroughRate}%</span>
        </div>
      </div>

      <div class="funnel-step">
        <div class="funnel-bar" style="width: ${Math.max(8, Math.min(100, r.cartAddRate * 2))}%;"></div>
        <div class="funnel-content">
          <div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Stage 3: Cart Additions</div>
            <div style="font-size:1.3rem; font-weight:900;">${f.cartAdds.toLocaleString('en-IN')}</div>
          </div>
          <span class="status-pill processing">Cart Add Rate: ${r.cartAddRate}%</span>
        </div>
      </div>

      <div class="funnel-step">
        <div class="funnel-bar" style="width: ${Math.max(6, Math.min(100, r.purchaseConversionRate * 1.5))}%;"></div>
        <div class="funnel-content">
          <div>
            <div style="font-size:0.8rem; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Stage 4: Purchases Completed</div>
            <div style="font-size:1.3rem; font-weight:900;">${f.purchases.toLocaleString('en-IN')} orders</div>
          </div>
          <span class="status-pill success">Cart-to-Order: ${r.purchaseConversionRate}%</span>
        </div>
      </div>

      <div class="card" style="padding:16px 20px; background:var(--brand-light); border:1px solid var(--brand); margin-top:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.85rem; font-weight:800; color:var(--brand);">Total Revenue Driven By Recommendations</div>
          <div style="font-size:1.6rem; font-weight:900; color:var(--text-primary); margin-top:2px;">₹${(f.revenue || 0).toLocaleString('en-IN')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.8rem; color:var(--text-muted);">Overall End-to-End Conversion</div>
          <div style="font-size:1.2rem; font-weight:800; color:#065F46;">${r.overallConversionRate}%</div>
        </div>
      </div>
    `;

    if (pairsContainer) {
      pairsContainer.innerHTML = (data.topPairs || []).map(p => `
        <tr>
          <td><strong>${p.productA}</strong></td>
          <td><span style="color:var(--brand); font-weight:700;">+</span> <strong>${p.productB}</strong></td>
          <td>${p.pairingsCount} times</td>
          <td><span class="status-pill success">${p.conversionRate}% Conv</span></td>
          <td><strong style="color:var(--brand);">${p.synergyScore}/100</strong></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    funnelContainer.innerHTML = `<p style="color:#DC2626;">Error loading AI recommendations: ${err.message}</p>`;
  }
}

async function loadProductPerformance() {
  if (!checkAdminAuth()) return;

  const tbody = document.getElementById('perf-products-tbody');
  const rankingsContainer = document.getElementById('perf-rankings-grid');
  if (!tbody) return;

  const dateRange = document.getElementById('perf-date-filter')?.value || 'all';
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px;"><div class="loading-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/analytics/product-performance?dateRange=${dateRange}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (rankingsContainer && data.rankings) {
      const r = data.rankings;
      rankingsContainer.innerHTML = `
        <div class="card" style="padding:16px;">
          <h4 style="font-size:0.9rem; font-weight:800; color:var(--brand); margin-bottom:10px;">🏆 Top Best Sellers (Revenue)</h4>
          <ol style="padding-left:18px; font-size:0.825rem; line-height:1.6;">
            ${r.topBestSellers.map(p => `<li><strong>${p.name}</strong> - ₹${p.revenue.toLocaleString('en-IN')}</li>`).join('')}
          </ol>
        </div>
        <div class="card" style="padding:16px;">
          <h4 style="font-size:0.9rem; font-weight:800; color:#3B82F6; margin-bottom:10px;">👀 Most Viewed Products</h4>
          <ol style="padding-left:18px; font-size:0.825rem; line-height:1.6;">
            ${r.topMostViewed.map(p => `<li><strong>${p.name}</strong> - ${p.views} views</li>`).join('')}
          </ol>
        </div>
        <div class="card" style="padding:16px;">
          <h4 style="font-size:0.9rem; font-weight:800; color:#10B981; margin-bottom:10px;">🎯 High-Conversion Products</h4>
          <ol style="padding-left:18px; font-size:0.825rem; line-height:1.6;">
            ${r.topHighConversion.map(p => `<li><strong>${p.name}</strong> - ${p.conversionRate}% conv</li>`).join('')}
          </ol>
        </div>
        <div class="card" style="padding:16px;">
          <h4 style="font-size:0.9rem; font-weight:800; color:#F59E0B; margin-bottom:10px;">⚠️ Low-Performing Items</h4>
          <ol style="padding-left:18px; font-size:0.825rem; line-height:1.6;">
            ${r.topLowPerforming.map(p => `<li><strong>${p.name}</strong> - ${p.unitsSold} units</li>`).join('')}
          </ol>
        </div>
        <div class="card" style="padding:16px;">
          <h4 style="font-size:0.9rem; font-weight:800; color:#EF4444; margin-bottom:10px;">🔄 Highest Returns / Refunds</h4>
          <ol style="padding-left:18px; font-size:0.825rem; line-height:1.6;">
            ${r.topHighestReturns.map(p => `<li><strong>${p.name}</strong> - ${p.returnRate}% return</li>`).join('')}
          </ol>
        </div>
        <div class="card" style="padding:16px;">
          <h4 style="font-size:0.9rem; font-weight:800; color:#8B5CF6; margin-bottom:10px;">⚡ Fast-Moving Catalog</h4>
          <ol style="padding-left:18px; font-size:0.825rem; line-height:1.6;">
            ${r.fastMoving.map(p => `<li><strong>${p.name}</strong> - ${p.unitsSold} sold</li>`).join('')}
          </ol>
        </div>
      `;
    }

    tbody.innerHTML = (data.products || []).map(p => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${p.image}" style="width:32px; height:32px; border-radius:4px; object-fit:cover;">
            <div>
              <strong>${p.name}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">${p.category}</div>
            </div>
          </div>
        </td>
        <td>${p.views}</td>
        <td>${p.ordersCount}</td>
        <td><strong>${p.unitsSold}</strong></td>
        <td><strong>₹${p.revenue.toLocaleString('en-IN')}</strong></td>
        <td><span class="status-pill ${p.conversionRate >= 15 ? 'success' : 'info'}">${p.conversionRate}%</span></td>
        <td><span class="status-pill ${p.stockStatus === 'In Stock' ? 'active' : 'expired'}">${p.stock} units</span></td>
        <td>${p.returnRate}%</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#DC2626; padding:20px;">Failed to load product performance: ${err.message}</td></tr>`;
  }
}

async function loadProfitReports() {
  if (!checkAdminAuth()) return;

  const statsContainer = document.getElementById('profit-stats-grid');
  const tbody = document.getElementById('profit-categories-tbody');
  const noticeContainer = document.getElementById('profit-cost-notice');
  if (!statsContainer) return;

  const dateRange = document.getElementById('profit-date-filter')?.value || 'all';
  statsContainer.innerHTML = '<div style="text-align:center; padding:20px;"><div class="loading-spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/analytics/profit-reports?dateRange=${dateRange}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    const r = data.report;

    if (noticeContainer) {
      if (r.fallbackNotice) {
        noticeContainer.style.display = 'block';
        noticeContainer.textContent = r.fallbackNotice;
      } else {
        noticeContainer.style.display = 'none';
      }
    }

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div>
          <div class="stat-val">₹${r.grossRevenue.toLocaleString('en-IN')}</div>
          <div class="stat-label">Gross Revenue</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF3C7; color:#92400E;">🏷️</div>
        <div>
          <div class="stat-val">-₹${r.totalDiscounts.toLocaleString('en-IN')}</div>
          <div class="stat-label">Total Discounts Given</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FFE4E6; color:#E11D48;">💸</div>
        <div>
          <div class="stat-val">-₹${r.totalRefunds.toLocaleString('en-IN')}</div>
          <div class="stat-label">Refunds Issued</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#F1F5F9; color:#475569;">🏭</div>
        <div>
          <div class="stat-val">₹${r.totalProductCost.toLocaleString('en-IN')}</div>
          <div class="stat-label">Total Product Cost</div>
        </div>
      </div>
      <div class="stat-card" style="border: 2px solid #10B981; background: #ECFDF5;">
        <div class="stat-icon" style="background:#10B981; color:#FFFFFF;">📈</div>
        <div>
          <div class="stat-val" style="color:#065F46;">₹${r.estimatedProfit.toLocaleString('en-IN')}</div>
          <div class="stat-label" style="color:#047857; font-weight:700;">Estimated Profit (Formula Applied)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5; color:#065F46;">📊</div>
        <div>
          <div class="stat-val">${r.profitMargin}%</div>
          <div class="stat-label">Net Profit Margin</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🛒</div>
        <div>
          <div class="stat-val">₹${r.averageOrderValue.toLocaleString('en-IN')}</div>
          <div class="stat-label">Average Order Value (AOV)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚚</div>
        <div>
          <div class="stat-val">₹${r.totalShipping.toLocaleString('en-IN')}</div>
          <div class="stat-label">Shipping Collected</div>
        </div>
      </div>
    `;

    if (tbody && r.categoryBreakdown) {
      tbody.innerHTML = r.categoryBreakdown.map(cat => `
        <tr>
          <td><strong>${cat.category}</strong></td>
          <td>${cat.unitsSold} units</td>
          <td>₹${cat.grossRevenue.toLocaleString('en-IN')}</td>
          <td>₹${cat.productCost.toLocaleString('en-IN')}</td>
          <td><strong style="color:#065F46;">₹${cat.estimatedProfit.toLocaleString('en-IN')}</strong></td>
          <td><span class="status-pill success">${cat.profitMargin}%</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    statsContainer.innerHTML = `<p style="color:#DC2626;">Failed to load profit reports: ${err.message}</p>`;
  }
}

function exportProfitReportCsv() {
  const dateRange = document.getElementById('profit-date-filter')?.value || 'all';
  window.open(`${API_BASE}/analytics/profit-reports?dateRange=${dateRange}&format=csv`, '_blank');
}

// ── 7. ADMIN ACTIVITY LOG (AUDIT TRAIL) ────────────────────────
async function loadAdminLogs() {
  if (!checkAdminAuth()) return;

  const tbody = document.getElementById('admin-logs-tbody');
  const statsContainer = document.getElementById('logs-stats-row');
  if (!tbody) return;

  const search = document.getElementById('logs-search')?.value || '';
  const module = document.getElementById('logs-module-filter')?.value || 'all';
  const dateRange = document.getElementById('logs-date-filter')?.value || 'all';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;"><div class="loading-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API_BASE}/activity-logs?search=${encodeURIComponent(search)}&module=${module}&dateRange=${dateRange}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (statsContainer && data.moduleCounts) {
      const mc = data.moduleCounts;
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-icon">🕵️</div>
          <div><div class="stat-val">${data.totalCount}</div><div class="stat-label">Audit Entries (Read-Only)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div><div class="stat-val">${mc.ORDERS || 0}</div><div class="stat-label">Order Modifications</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏷️</div>
          <div><div class="stat-val">${mc.COUPONS || 0}</div><div class="stat-label">Coupon Actions</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚚</div>
          <div><div class="stat-val">${mc.SHIPPING || 0}</div><div class="stat-label">Shipping Updates</div></div>
        </div>
      `;
    }

    if (!data.logs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">No activity logs found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.logs.map(log => `
      <tr>
        <td>${new Date(log.createdAt).toLocaleString('en-IN')}</td>
        <td><strong>${log.admin}</strong><br><span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${log.ip}</span></td>
        <td><span class="status-pill info">${log.module}</span></td>
        <td><strong style="font-size:0.8rem; font-family:monospace;">${log.action}</strong></td>
        <td>${log.description}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="alert('${JSON.stringify(log.details || {}).replace(/'/g, "\\'")}')">Details</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#DC2626; padding:20px;">Failed to load logs: ${err.message}</td></tr>`;
  }
}

// ── PRODUCT STOCK & INVENTORY ALERTS (PRESERVED) ──────────────
async function loadInventoryAlerts(containerId = 'admin-inventory-alerts') {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/products/inventory/alerts`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) return;

    const low = data.alerts?.lowStock || [];
    const out = data.alerts?.outOfStock || [];
    const allAlerts = [...out, ...low];

    if (allAlerts.length === 0) {
      container.innerHTML = `
        <div style="padding: 14px; background: rgba(5, 150, 105, 0.08); border-radius: 8px; border: 1px solid #10B981; color: #065F46; font-size: 0.875rem;">
          ✅ <strong>All items well-stocked!</strong> No products currently below reorder threshold.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Restock Action</th>
            </tr>
          </thead>
          <tbody>
            ${allAlerts.map(p => {
              const isOut = (p.stock || 0) === 0;
              return `
                <tr>
                  <td>
                    <strong>${p.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">${p.brand || 'NUTRATEIN'}</span>
                  </td>
                  <td>
                    <span class="status-pill ${isOut ? 'danger' : 'warning'}">
                      ${isOut ? 'Out of Stock' : `Low Stock (${p.stock} left)`}
                    </span>
                  </td>
                  <td><strong>${p.stock || 0} units</strong></td>
                  <td>${p.lowStockThreshold || 5} units</td>
                  <td>
                    <div style="display:flex; gap:6px; align-items:center;">
                      <input type="number" id="restock-input-${p._id}" value="${Math.max(25, (p.lowStockThreshold || 5) * 5)}" min="1" style="width:70px;" class="form-control">
                      <button class="btn btn-primary btn-sm" onclick="quickRestockProduct('${p._id}', '${p.name.replace(/'/g, "\\'")}')">Restock</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p style="color: #DC2626;">Failed to load inventory alerts.</p>';
  }
}

async function quickRestockProduct(productId, productName) {
  const input = document.getElementById(`restock-input-${productId}`);
  const newStock = input ? parseInt(input.value, 10) : 30;

  try {
    const res = await fetch(`${API_BASE}/products/${productId}/stock`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ stock: newStock })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Restocked ${productName} to ${newStock} units!`, 'success');
      loadInventoryAlerts();
    } else {
      showToast(data.message || 'Failed to update stock', 'error');
    }
  } catch {
    showToast('Failed to connect to server', 'error');
  }
}

let adminProductsList = [];
let currentManagingProduct = null;
let currentScanResults = null;

// ── HELPER: Safe String Escaping ────────────────────────────────
function safeEscape(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = window.escapeHtml || safeEscape;

let activePreviewVariantIndex = 0;

// ── LOAD ADMIN PRODUCTS TABLE ───────────────────────────────────
async function loadAdminProductsTable() {
  if (!checkAdminAuth()) return;
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const search = document.getElementById('products-search')?.value?.trim() || '';
  const category = document.getElementById('products-category-filter')?.value || 'all';

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px;"><div class="loading-spinner"></div></td></tr>';

  try {
    let url = `${API_BASE}/products?limit=200&includeInactive=true`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    adminProductsList = data.products || [];

    if (!data.success || !adminProductsList.length) {
      const msg = search || (category && category !== 'all')
        ? `No products match your filters. <button class="btn btn-secondary btn-sm" onclick="clearAllFilters('products')" style="margin-left:8px;">Clear Filters</button>`
        : 'No products found in catalog. Click "➕ Add Product" above to create one!';
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">${msg}</td></tr>`;
      return;
    }

    tbody.innerHTML = adminProductsList.map(p => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const totalStock = variants.length > 0 
        ? variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) 
        : (p.stock || 0);

      const isOut = totalStock === 0;
      const isLow = totalStock > 0 && totalStock <= (p.lowStockThreshold || 10);
      const stockBadge = isOut 
        ? '<span class="status-pill danger">Out of Stock (0)</span>'
        : (isLow ? `<span class="status-pill warning">Low Stock (${totalStock})</span>` : `<span class="status-pill success">In Stock (${totalStock})</span>`);
      
      const images = Array.isArray(p.images) ? p.images : [];
      const primaryImg = images.find(im => im.isPrimary) || images[0];
      const imgUrl = (primaryImg && primaryImg.url) ? primaryImg.url : (p.image || '/assets/products/nutratein-placeholder.svg');
      const imgCount = images.length || (p.image ? 1 : 0);
      const catName = p.category ? (p.category.name || p.category) : 'Supplements';

      // Sizing / Variants Chips
      let variantsHtml = '';
      if (variants.length > 0) {
        variantsHtml = variants.map(v => {
          const vLabel = v.weight || v.size || v.name || 'Default';
          const title = `${v.flavor ? v.flavor + ' • ' : ''}${v.servings ? v.servings + ' serv • ' : ''}MRP: ₹${v.mrp || v.originalPrice || 'N/A'} • Stock: ${v.stock ?? 0}`;
          return `<span class="variant-chip" title="${safeEscape(title)}">${safeEscape(vLabel)}: ₹${(v.price || 0).toLocaleString('en-IN')}</span>`;
        }).join(' ');
        variantsHtml += `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;">${variants.length} variant${variants.length > 1 ? 's' : ''}</div>`;
      } else {
        variantsHtml = `<span style="font-size:0.75rem;color:var(--text-muted);">Standard (Single size)</span>`;
      }

      // Price Range Display
      let priceDisplay = '';
      if (variants.length > 1) {
        const prices = variants.map(v => Number(v.price) || 0).filter(pr => pr > 0);
        if (prices.length > 0) {
          const minP = Math.min(...prices);
          const maxP = Math.max(...prices);
          priceDisplay = minP === maxP
            ? `<strong>₹${minP.toLocaleString('en-IN')}</strong>`
            : `<strong>₹${minP.toLocaleString('en-IN')} – ₹${maxP.toLocaleString('en-IN')}</strong>`;
        } else {
          priceDisplay = `<strong>₹${(p.basePrice || p.price || 0).toLocaleString('en-IN')}</strong>`;
        }
      } else if (variants.length === 1) {
        const v = variants[0];
        priceDisplay = `<strong>₹${(v.price || p.basePrice || 0).toLocaleString('en-IN')}</strong>`;
        if (v.mrp && v.mrp > v.price) {
          priceDisplay += ` <span style="font-size:0.74rem;color:var(--text-muted);text-decoration:line-through;">₹${v.mrp.toLocaleString('en-IN')}</span>`;
        }
      } else {
        const pVal = p.basePrice || p.price || 0;
        priceDisplay = `<strong>₹${pVal.toLocaleString('en-IN')}</strong>`;
        if (p.mrp && p.mrp > pVal) {
          priceDisplay += ` <span style="font-size:0.74rem;color:var(--text-muted);text-decoration:line-through;">₹${p.mrp.toLocaleString('en-IN')}</span>`;
        }
      }

      // Status pill & tags
      const isAct = p.status ? (p.status === 'active') : (p.isActive !== false);
      const statusClass = p.status === 'draft' ? 'warning' : (isAct ? 'active' : 'inactive');
      const statusLabel = p.status === 'draft' ? 'Draft' : (isAct ? 'Active' : 'Hidden');

      const badgesHtml = [
        p.isFeatured ? '<span style="background:#fef3c7;color:#b45309;font-size:0.65rem;font-weight:800;padding:1px 5px;border-radius:4px;">⭐ Featured</span>' : '',
        p.isBestSeller ? '<span style="background:#fee2e2;color:#b91c1c;font-size:0.65rem;font-weight:800;padding:1px 5px;border-radius:4px;">🔥 Best Seller</span>' : '',
        p.badge ? `<span style="background:rgba(235,94,40,0.12);color:var(--brand);font-size:0.65rem;font-weight:800;padding:1px 5px;border-radius:4px;">${safeEscape(p.badge)}</span>` : ''
      ].filter(Boolean).join(' ');

      return `
        <tr>
          <!-- Product Name & Metadata -->
          <td>
            <div>
              <div style="font-weight:800;font-size:0.92rem;color:var(--text-primary);cursor:pointer;" onclick="openProductEditorModal('${p._id}')" title="Click to edit">
                ${safeEscape(p.name)}
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                ${safeEscape(p.brand || 'NUTRATEIN')} • <span style="background:var(--bg-2); padding:1px 5px; border-radius:4px; font-size:0.7rem; font-weight:600;">${safeEscape(catName)}</span>
              </div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">
                ${badgesHtml}
                <span style="font-size:0.7rem; color:var(--text-secondary);">SKU: <code>${safeEscape(p.sku || 'N/A')}</code></span>
              </div>
            </div>
          </td>

          <!-- Image with thumbnail & count badge -->
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="position:relative; width:48px; height:48px; border-radius:8px; overflow:hidden; border:1px solid var(--border); background:var(--bg-2); cursor:pointer;" onclick="openProductEditorModal('${p._id}')" title="Click to edit product">
                <img src="${imgUrl}" alt="${safeEscape(p.name)}" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='/assets/products/nutratein-placeholder.svg'">
              </div>
              <span style="font-size:0.72rem; color:var(--brand); font-weight:700; background:rgba(217,101,30,0.1); padding:2px 6px; border-radius:10px; cursor:pointer;" onclick="openProductImageModal('${p._id}')" title="Manage images">
                📷 ${imgCount}
              </span>
            </div>
          </td>

          <!-- Sizing & Variants -->
          <td>${variantsHtml}</td>

          <!-- Price -->
          <td>${priceDisplay}</td>

          <!-- Stock -->
          <td>${stockBadge}</td>

          <!-- Status -->
          <td>
            <span class="status-pill ${statusClass}" style="cursor:pointer;" onclick="toggleProductActive('${p._id}', ${isAct})" title="Click to toggle status">
              ${statusLabel}
            </span>
          </td>

          <!-- Actions -->
          <td>
            <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" style="font-size:0.72rem; padding:3px 8px; font-weight:700;" onclick="openProductEditorModal('${p._id}')" title="Edit product and variants">
                ✏️ Edit
              </button>
              <button class="btn btn-secondary btn-sm" style="font-size:0.72rem; padding:3px 7px;" onclick="duplicateProduct('${p._id}', '${safeEscape(p.name)}')" title="Duplicate product as draft">
                📋 Copy
              </button>
              <button class="btn btn-secondary btn-sm" style="font-size:0.72rem; padding:3px 6px;" onclick="openProductImageModal('${p._id}')" title="Manage gallery & images">
                🖼️
              </button>
              <button class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:none;border-radius:4px;font-size:0.72rem;padding:3px 6px;cursor:pointer;" onclick="deleteProduct('${p._id}', '${safeEscape(p.name)}')" title="Delete product">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#DC2626; padding:20px;">Error loading products: ${err.message}</td></tr>`;
  }
}

// ── PRODUCT ACTIVE TOGGLE ───────────────────────────────────────
async function toggleProductActive(productId, currentActive) {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Status updated', 'success');
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Failed to toggle status', 'error');
    }
  } catch (e) {
    showToast('Failed to toggle product status: ' + e.message, 'error');
  }
}

// ── PRODUCT DUPLICATION ─────────────────────────────────────────
async function duplicateProduct(productId, productName) {
  if (!confirm(`Duplicate "${productName}" as a new draft product?`)) return;
  try {
    showToast(`Duplicating ${productName}...`, 'info');
    const res = await fetch(`${API_BASE}/products/${productId}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Product duplicated as draft: "${data.product?.name || productName}"`, 'success');
      loadAdminProductsTable();
      if (data.product?._id) {
        openProductEditorModal(data.product._id);
      }
    } else {
      showToast(data.message || 'Failed to duplicate product', 'error');
    }
  } catch (err) {
    showToast('Error duplicating product: ' + err.message, 'error');
  }
}

// ── PRODUCT DELETION ────────────────────────────────────────────
async function deleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) return;
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast(`"${productName}" deleted successfully.`, 'success');
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Failed to delete product', 'error');
    }
  } catch (err) {
    showToast('Error deleting product: ' + err.message, 'error');
  }
}

// ── OPEN PRODUCT EDITOR MODAL (ADD / EDIT) ───────────────────────
function openProductEditorModal(productId = null) {
  const modal = document.getElementById('product-editor-modal');
  if (!modal) return;

  activePreviewVariantIndex = 0;
  const titleEl = document.getElementById('product-modal-title');
  const tbody = document.getElementById('variant-rows-tbody');
  tbody.innerHTML = '';

  if (productId) {
    // EDIT MODE
    const p = adminProductsList.find(item => item._id === productId);
    if (!p) {
      showToast('Product not found in current list', 'error');
      return;
    }

    titleEl.innerHTML = `<span>✏️</span> Edit Product: ${safeEscape(p.name)}`;
    document.getElementById('prod-edit-id').value = p._id;
    document.getElementById('prod-edit-name').value = p.name || '';
    document.getElementById('prod-edit-brand').value = p.brand || 'NUTRATEIN';
    
    const catSelect = document.getElementById('prod-edit-category');
    const catName = p.category ? (p.category.name || p.category) : 'Whey Protein';
    catSelect.value = catName;

    document.getElementById('prod-edit-subcategory').value = p.subcategory || '';
    document.getElementById('prod-edit-status').value = p.status || (p.isActive ? 'active' : 'inactive');
    document.getElementById('prod-edit-badge').value = p.badge || '';
    document.getElementById('prod-edit-is-featured').checked = Boolean(p.isFeatured);
    document.getElementById('prod-edit-is-bestseller').checked = Boolean(p.isBestSeller);
    document.getElementById('prod-edit-short-desc').value = p.shortDescription || p.name || '';
    document.getElementById('prod-edit-desc').value = p.description || p.name || '';
    
    const primaryImg = (p.images && p.images.find(im => im.isPrimary)) || (p.images && p.images[0]);
    document.getElementById('prod-edit-image-url').value = (primaryImg && primaryImg.url) || p.image || '';

    // Populate variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      p.variants.forEach(v => addVariantRow(v));
    } else {
      addVariantRow({
        weight: '100g',
        flavor: 'Unflavored',
        servings: 32,
        mrp: p.mrp || Math.round((p.basePrice || 699) * 1.3),
        price: p.basePrice || p.price || 699,
        discount: p.discountPercent || 30,
        stock: p.stock || 50,
        sku: p.sku || ''
      });
    }
  } else {
    // ADD NEW PRODUCT MODE
    titleEl.innerHTML = `<span>⚡</span> Add New Product`;
    document.getElementById('prod-edit-id').value = '';
    document.getElementById('prod-edit-name').value = '';
    document.getElementById('prod-edit-brand').value = 'NUTRATEIN';
    document.getElementById('prod-edit-category').value = 'Whey Protein';
    document.getElementById('prod-edit-subcategory').value = '';
    document.getElementById('prod-edit-status').value = 'active';
    document.getElementById('prod-edit-badge').value = '';
    document.getElementById('prod-edit-is-featured').checked = false;
    document.getElementById('prod-edit-is-bestseller').checked = false;
    document.getElementById('prod-edit-short-desc').value = '';
    document.getElementById('prod-edit-desc').value = '';
    document.getElementById('prod-edit-image-url').value = '/assets/products/nutratein-placeholder.svg';

    // Default variant row
    addVariantRow({
      weight: '100g',
      flavor: 'Unflavored',
      servings: 32,
      mrp: 999,
      price: 699,
      discount: 30,
      stock: 50,
      sku: ''
    });
  }

  modal.style.display = 'flex';
  updateLive3DCardPreview();
}

// ── CLOSE PRODUCT EDITOR MODAL ──────────────────────────────────
function closeProductEditorModal() {
  const modal = document.getElementById('product-editor-modal');
  if (modal) modal.style.display = 'none';
}

// ── ADD VARIANT ROW ─────────────────────────────────────────────
function addVariantRow(v = null) {
  const tbody = document.getElementById('variant-rows-tbody');
  if (!tbody) return;

  const weight = v?.weight || v?.size || '';
  const flavor = v?.flavor || 'Unflavored';
  const servings = v?.servings ?? '';
  const mrp = v?.mrp || v?.originalPrice || '';
  const price = v?.price || '';
  let discount = v?.discount || v?.discountPercent || '';
  if (!discount && mrp && price && Number(mrp) > Number(price)) {
    discount = Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100);
  }
  const stock = v?.stock ?? 50;
  const sku = v?.sku || '';

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <input type="text" class="variant-input var-weight" value="${safeEscape(weight)}" placeholder="e.g. 100g" required oninput="handleVariantRowInput(this)">
    </td>
    <td>
      <input type="text" class="variant-input var-flavor" value="${safeEscape(flavor)}" placeholder="Flavor" oninput="handleVariantRowInput(this)">
    </td>
    <td>
      <input type="number" class="variant-input var-servings" value="${servings}" min="0" placeholder="32" oninput="handleVariantRowInput(this)">
    </td>
    <td>
      <input type="number" class="variant-input var-mrp" value="${mrp}" min="0" placeholder="999" required oninput="handleVariantRowInput(this)">
    </td>
    <td>
      <input type="number" class="variant-input var-price" value="${price}" min="0" placeholder="699" required oninput="handleVariantRowInput(this)">
    </td>
    <td>
      <input type="text" class="variant-input var-discount" value="${discount ? discount + '%' : ''}" readonly style="background:var(--bg-2);color:var(--brand);font-weight:800;text-align:center;">
    </td>
    <td>
      <input type="number" class="variant-input var-stock" value="${stock}" min="0" placeholder="50" required oninput="handleVariantRowInput(this)">
    </td>
    <td>
      <input type="text" class="variant-input var-sku" value="${safeEscape(sku)}" placeholder="AUTO" oninput="handleVariantRowInput(this)">
    </td>
    <td style="text-align:center;">
      <button type="button" class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:none;border-radius:4px;padding:3px 6px;cursor:pointer;" onclick="removeVariantRow(this)" title="Remove variant">✕</button>
    </td>
  `;
  tbody.appendChild(tr);
  updateLive3DCardPreview();
}

// ── REMOVE VARIANT ROW ──────────────────────────────────────────
function removeVariantRow(btn) {
  const tbody = document.getElementById('variant-rows-tbody');
  if (!tbody) return;
  if (tbody.querySelectorAll('tr').length <= 1) {
    showToast('At least one variant/size is required.', 'error');
    return;
  }
  btn.closest('tr').remove();
  if (activePreviewVariantIndex >= tbody.querySelectorAll('tr').length) {
    activePreviewVariantIndex = 0;
  }
  updateLive3DCardPreview();
}

// ── HANDLE VARIANT INPUT (CALCULATE DISCOUNT & REFRESH 3D CARD) ───
function handleVariantRowInput(input) {
  const tr = input.closest('tr');
  if (tr) {
    const mrp = Number(tr.querySelector('.var-mrp')?.value) || 0;
    const price = Number(tr.querySelector('.var-price')?.value) || 0;
    const discountInput = tr.querySelector('.var-discount');
    if (discountInput) {
      if (mrp > 0 && price > 0 && mrp > price) {
        const disc = Math.round(((mrp - price) / mrp) * 100);
        discountInput.value = disc + '%';
      } else {
        discountInput.value = '0%';
      }
    }
  }
  updateLive3DCardPreview();
}

// ── SET ACTIVE PREVIEW VARIANT (CLICKABLE PILLS ON 3D CARD) ──────
function setActivePreviewVariant(idx) {
  activePreviewVariantIndex = idx;
  updateLive3DCardPreview();
}
window.setActivePreviewVariant = setActivePreviewVariant;

// ── LIVE 3D PRODUCT CARD PREVIEW ─────────────────────────────────
function updateLive3DCardPreview() {
  const name = document.getElementById('prod-edit-name')?.value?.trim() || 'Product Name';
  const category = document.getElementById('prod-edit-category')?.value || 'Whey Protein';
  const shortDesc = document.getElementById('prod-edit-short-desc')?.value?.trim() || 'Premium fitness supplement engineered for maximum performance.';
  const imageUrl = document.getElementById('prod-edit-image-url')?.value?.trim() || '/assets/products/nutratein-placeholder.svg';
  const customBadge = document.getElementById('prod-edit-badge')?.value || '';
  const isBestSeller = document.getElementById('prod-edit-is-bestseller')?.checked;

  // Title, category, desc, image
  const titleEl = document.getElementById('preview-title');
  if (titleEl) titleEl.textContent = name;

  const catEl = document.getElementById('preview-category');
  if (catEl) catEl.textContent = category.toUpperCase();

  const descEl = document.getElementById('preview-short-desc');
  if (descEl) descEl.textContent = shortDesc;

  const imgEl = document.getElementById('preview-img');
  if (imgEl) imgEl.src = imageUrl;

  const tagBadgeEl = document.getElementById('preview-tag-badge');
  if (tagBadgeEl) {
    tagBadgeEl.style.display = isBestSeller ? 'inline-block' : 'none';
  }

  // Parse variants from table rows
  const rows = Array.from(document.querySelectorAll('#variant-rows-tbody tr'));
  const variants = rows.map(r => {
    const mrp = Number(r.querySelector('.var-mrp')?.value) || 0;
    const price = Number(r.querySelector('.var-price')?.value) || 0;
    const servings = Number(r.querySelector('.var-servings')?.value) || 0;
    const stock = Number(r.querySelector('.var-stock')?.value) || 0;
    const weight = r.querySelector('.var-weight')?.value?.trim() || 'Standard';
    const flavor = r.querySelector('.var-flavor')?.value?.trim() || 'Unflavored';
    const discStr = r.querySelector('.var-discount')?.value || '';
    const discount = parseInt(discStr) || (mrp > price && mrp > 0 ? Math.round(((mrp - price)/mrp)*100) : 0);
    return { weight, flavor, servings, mrp, price, discount, stock };
  });

  // Render pills in 3D Card
  const pillsContainer = document.getElementById('preview-variants-container');
  if (pillsContainer) {
    if (variants.length > 0) {
      if (activePreviewVariantIndex >= variants.length) activePreviewVariantIndex = 0;
      pillsContainer.innerHTML = variants.map((v, idx) => `
        <button type="button" class="admin-preview-pill ${idx === activePreviewVariantIndex ? 'active' : ''}" onclick="setActivePreviewVariant(${idx})">
          ${safeEscape(v.weight)}
        </button>
      `).join('');
    } else {
      pillsContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-muted);">No variants added</span>';
    }
  }

  // Active variant details
  const activeVariant = variants[activePreviewVariantIndex] || variants[0] || { price: 699, mrp: 999, servings: 32, stock: 50, discount: 30 };
  
  const priceEl = document.getElementById('preview-price');
  if (priceEl) priceEl.textContent = `₹${(activeVariant.price || 0).toLocaleString('en-IN')}`;

  const mrpEl = document.getElementById('preview-mrp');
  if (mrpEl) mrpEl.textContent = (activeVariant.mrp && activeVariant.mrp > activeVariant.price) ? `₹${activeVariant.mrp.toLocaleString('en-IN')}` : '';

  const badgeEl = document.getElementById('preview-badge');
  if (badgeEl) {
    if (customBadge) {
      badgeEl.textContent = customBadge;
      badgeEl.style.display = 'inline-block';
    } else if (activeVariant.discount > 0) {
      badgeEl.textContent = `${activeVariant.discount}% OFF`;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  const servingsEl = document.getElementById('preview-servings-info');
  if (servingsEl) {
    if (activeVariant.servings > 0 && activeVariant.price > 0) {
      const perServ = (activeVariant.price / activeVariant.servings).toFixed(1);
      servingsEl.textContent = `${activeVariant.servings} Servings • ₹${perServ}/serving`;
      servingsEl.style.display = 'block';
    } else if (activeVariant.flavor && activeVariant.flavor !== 'Unflavored') {
      servingsEl.textContent = `Flavor: ${activeVariant.flavor}`;
      servingsEl.style.display = 'block';
    } else {
      servingsEl.style.display = 'none';
    }
  }

  const stockEl = document.getElementById('preview-stock-status');
  if (stockEl) {
    if (activeVariant.stock > 0) {
      stockEl.textContent = `✓ In Stock (${activeVariant.stock})`;
      stockEl.style.color = '#059669';
      stockEl.style.background = '#d1fae5';
    } else {
      stockEl.textContent = `✕ Out of Stock`;
      stockEl.style.color = '#dc2626';
      stockEl.style.background = '#fee2e2';
    }
  }
}

// ── LOCAL FILE UPLOAD FROM COMPUTER (SAVES TO /public/assets/products/)
async function handleProductModalFileUpload(file) {
  if (!file) return;
  showToast(`Uploading ${file.name}...`, 'info');

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API_BASE}/products/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.url) {
      document.getElementById('prod-edit-image-url').value = data.url;
      updateLive3DCardPreview();
      showToast('Image uploaded and applied to preview!', 'success');
    } else {
      showToast(data.message || 'Image upload failed', 'error');
    }
  } catch (err) {
    showToast('Upload error: ' + err.message, 'error');
  }
}

// ── OPEN ASSET PICKER FOR PRODUCT EDITOR ────────────────────────
async function openAssetPickerForEditor() {
  showToast('Loading project assets...', 'info');
  try {
    const res = await fetch(`${API_BASE}/products/scan-assets`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    const assets = (data.matched || []).concat(data.unmatched || []);

    if (!assets.length) {
      showToast('No asset files found in project folders.', 'info');
      return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:10010;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px);';
    modal.innerHTML = `
      <div style="background:var(--card-bg);border-radius:16px;padding:24px;width:100%;max-width:680px;max-height:82vh;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,0.3);">
        <div class="flex-between" style="margin-bottom:14px;border-bottom:1px solid var(--border);padding-bottom:10px;">
          <h4 style="margin:0;font-size:1.1rem;font-weight:800;">📁 Select Local Asset for Product</h4>
          <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-top:10px;">
          ${assets.map(a => `
            <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;cursor:pointer;background:var(--bg-2);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'" onclick="selectAssetForEditor('${a.url}')">
              <div style="height:90px;background:#f8fafc;display:flex;align-items:center;justify-content:center;padding:4px;">
                <img src="${a.url}" style="max-height:100%;max-width:100%;object-fit:contain;">
              </div>
              <div style="padding:6px 8px;font-size:0.7rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${safeEscape(a.filename)}">
                ${safeEscape(a.filename)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    window.selectAssetForEditor = (url) => {
      document.getElementById('prod-edit-image-url').value = url;
      updateLive3DCardPreview();
      showToast('Asset selected and preview updated!', 'success');
      modal.remove();
    };

    document.body.appendChild(modal);
  } catch (err) {
    showToast('Failed to load assets: ' + err.message, 'error');
  }
}

// ── SAVE PRODUCT & VARIANTS FORM (ADD OR UPDATE) ─────────────────
async function handleProductEditorSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('prod-edit-id')?.value?.trim();
  const name = document.getElementById('prod-edit-name')?.value?.trim();
  const brand = document.getElementById('prod-edit-brand')?.value?.trim() || 'NUTRATEIN';
  const category = document.getElementById('prod-edit-category')?.value;
  const subcategory = document.getElementById('prod-edit-subcategory')?.value?.trim() || '';
  const status = document.getElementById('prod-edit-status')?.value || 'active';
  const badge = document.getElementById('prod-edit-badge')?.value || '';
  const isFeatured = document.getElementById('prod-edit-is-featured')?.checked;
  const isBestSeller = document.getElementById('prod-edit-is-bestseller')?.checked;
  const shortDescription = document.getElementById('prod-edit-short-desc')?.value?.trim() || name;
  const description = document.getElementById('prod-edit-desc')?.value?.trim() || name;
  const imageUrl = document.getElementById('prod-edit-image-url')?.value?.trim() || '/assets/products/nutratein-placeholder.svg';

  if (!name) {
    showToast('Product name is required.', 'error');
    return;
  }

  // Parse variants
  const rows = Array.from(document.querySelectorAll('#variant-rows-tbody tr'));
  if (rows.length === 0) {
    showToast('Please add at least one product variant/size.', 'error');
    return;
  }

  const variants = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const weight = r.querySelector('.var-weight')?.value?.trim();
    const flavor = r.querySelector('.var-flavor')?.value?.trim() || 'Unflavored';
    const servings = Number(r.querySelector('.var-servings')?.value) || 0;
    const mrp = Number(r.querySelector('.var-mrp')?.value) || 0;
    const price = Number(r.querySelector('.var-price')?.value) || 0;
    const stock = Number(r.querySelector('.var-stock')?.value) || 0;
    const sku = r.querySelector('.var-sku')?.value?.trim() || '';

    if (!weight) {
      showToast(`Variant #${i + 1}: Size/weight is required.`, 'error');
      return;
    }
    if (!price || price <= 0) {
      showToast(`Variant #${i + 1}: Valid selling price is required.`, 'error');
      return;
    }

    const discount = (mrp > price && mrp > 0) ? Math.round(((mrp - price) / mrp) * 100) : 0;
    variants.push({
      id: `v_${i + 1}`,
      name: `${weight} ${flavor !== 'Unflavored' ? flavor : ''}`.trim(),
      weight,
      size: weight,
      flavor,
      servings,
      mrp: mrp || Math.round(price * 1.3),
      originalPrice: mrp || Math.round(price * 1.3),
      price,
      discount,
      discountPercent: discount,
      stock,
      sku: sku || `${name.slice(0, 3).toUpperCase()}-${weight.toUpperCase().replace(/\s+/g, '')}`,
      isDefault: i === 0,
      isActive: true
    });
  }

  // Determine base prices & stock
  const prices = variants.map(v => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  const images = [{
    url: imageUrl,
    alt: `${name} - Primary`,
    isPrimary: true,
    sortOrder: 0
  }];

  const payload = {
    name,
    brand,
    category,
    subcategory,
    status,
    isActive: status === 'active',
    badge: badge || undefined,
    isFeatured,
    isBestSeller,
    shortDescription,
    description,
    image: imageUrl,
    images,
    variants,
    basePrice: minPrice,
    price: minPrice,
    minPrice,
    maxPrice,
    mrp: variants[0]?.mrp || Math.round(minPrice * 1.3),
    stock: totalStock,
    totalStock
  };

  const btn = document.getElementById('btn-save-product');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Saving...';
  }

  try {
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(id ? `"${name}" updated successfully!` : `"${name}" created successfully!`, 'success');
      closeProductEditorModal();
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Failed to save product', 'error');
    }
  } catch (err) {
    showToast('Error saving product: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span> Save Product & Variants';
    }
  }
}

// ── PRODUCT IMAGE MANAGER MODAL ─────────────────────────────────
function openProductImageModal(productId) {
  const product = adminProductsList.find(p => p._id === productId);
  if (!product) return;
  currentManagingProduct = JSON.parse(JSON.stringify(product));
  if (!currentManagingProduct.images || !Array.isArray(currentManagingProduct.images)) {
    currentManagingProduct.images = [];
    if (currentManagingProduct.image) {
      currentManagingProduct.images.push({ url: currentManagingProduct.image, alt: 'Front Product Image', isPrimary: true, sortOrder: 0 });
    }
  }

  document.getElementById('pim-product-title').textContent = currentManagingProduct.name;
  document.getElementById('pim-product-meta').textContent = `${currentManagingProduct.brand || 'NUTRATEIN'} • SKU: ${currentManagingProduct.sku || 'N/A'} • Price: ₹${(currentManagingProduct.basePrice || 0).toLocaleString('en-IN')}`;
  renderProductGalleryGrid();
  document.getElementById('product-image-modal').style.display = 'flex';
}

function closeProductImageModal() {
  document.getElementById('product-image-modal').style.display = 'none';
  currentManagingProduct = null;
}

function renderProductGalleryGrid() {
  const grid = document.getElementById('pim-gallery-grid');
  const countSpan = document.getElementById('pim-images-count');
  if (!currentManagingProduct) return;

  const images = currentManagingProduct.images || [];
  countSpan.textContent = images.length;

  if (!images.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--text-muted);">No images assigned yet. Upload or select one above!</div>';
    return;
  }

  grid.innerHTML = images.map((im, idx) => {
    const isPrimary = im.isPrimary || idx === 0;
    return `
      <div style="background:var(--bg-2);border:2px solid ${isPrimary ? 'var(--brand)' : 'var(--border)'};border-radius:10px;overflow:hidden;position:relative;display:flex;flex-direction:column;">
        <div style="height:110px;position:relative;background:#000;cursor:pointer;" onclick="window.open('${im.url}', '_blank')">
          <img src="${im.url}" alt="${im.alt || ''}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://placehold.co/140x110?text=Error'">
          ${isPrimary ? '<span style="position:absolute;top:6px;left:6px;background:var(--brand);color:#fff;font-size:0.65rem;font-weight:800;padding:2px 6px;border-radius:6px;">★ MAIN</span>' : ''}
        </div>
        <div style="padding:8px;display:flex;flex-direction:column;gap:6px;flex:1;justify-content:space-between;">
          <div style="font-size:0.7rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${im.alt || 'Product Image'}">
            ${im.alt || (isPrimary ? 'Main Image' : `Gallery #${idx + 1}`)}
          </div>
          <div style="display:flex;gap:4px;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:2px;">
              <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 5px;font-size:0.68rem;" onclick="reorderProductImage(${idx}, -1)" ${idx === 0 ? 'disabled' : ''}>◀</button>
              <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 5px;font-size:0.68rem;" onclick="reorderProductImage(${idx}, 1)" ${idx === images.length - 1 ? 'disabled' : ''}>▶</button>
            </div>
            ${!isPrimary ? `<button type="button" class="btn btn-secondary btn-sm" style="font-size:0.68rem;padding:2px 6px;" onclick="setProductMainImage(${idx})">Set Main</button>` : ''}
            <button type="button" class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:none;border-radius:4px;padding:2px 6px;font-size:0.68rem;cursor:pointer;" onclick="deleteProductImage(${idx})" title="Delete image">🗑</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setProductMainImage(index) {
  if (!currentManagingProduct || !currentManagingProduct.images[index]) return;
  currentManagingProduct.images.forEach((im, i) => {
    im.isPrimary = (i === index);
  });
  // Move primary image to first slot
  const [primary] = currentManagingProduct.images.splice(index, 1);
  currentManagingProduct.images.unshift(primary);
  renderProductGalleryGrid();
}

function reorderProductImage(index, delta) {
  if (!currentManagingProduct) return;
  const target = index + delta;
  if (target < 0 || target >= currentManagingProduct.images.length) return;
  const temp = currentManagingProduct.images[index];
  currentManagingProduct.images[index] = currentManagingProduct.images[target];
  currentManagingProduct.images[target] = temp;
  currentManagingProduct.images.forEach((im, idx) => im.sortOrder = idx);
  renderProductGalleryGrid();
}

function deleteProductImage(index) {
  if (!currentManagingProduct) return;
  currentManagingProduct.images.splice(index, 1);
  if (currentManagingProduct.images.length > 0 && !currentManagingProduct.images.some(im => im.isPrimary)) {
    currentManagingProduct.images[0].isPrimary = true;
  }
  renderProductGalleryGrid();
}

async function handleProductImageUpload(file) {
  if (!file || !currentManagingProduct) return;
  showToast(`Uploading ${file.name}...`, 'info');
  const formData = new FormData();
  formData.append('image', file);
  formData.append('isPrimary', currentManagingProduct.images.length === 0 ? 'true' : 'false');
  formData.append('sortOrder', currentManagingProduct.images.length);

  try {
    const res = await fetch(`${API_BASE}/products/${currentManagingProduct._id}/images/upload`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.file) {
      currentManagingProduct.images.push(data.file);
      renderProductGalleryGrid();
      showToast('Image uploaded and added to gallery!', 'success');
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Upload failed', 'error');
    }
  } catch (err) {
    showToast('Upload error: ' + err.message, 'error');
  }
}

async function openAssetPickerForProduct() {
  showToast('Scanning available asset library...', 'info');
  try {
    const res = await fetch(`${API_BASE}/products/scan-assets`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const data = await res.json();
    const assets = (data.matched || []).concat(data.unmatched || []);

    if (!assets.length) {
      showToast('No asset files found in scan folders.', 'info');
      return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:10005;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="background:var(--card-bg);border-radius:14px;padding:20px;width:100%;max-width:600px;max-height:80vh;overflow-y:auto;">
        <div class="flex-between" style="margin-bottom:12px;">
          <h4 style="margin:0;font-size:1.1rem;font-weight:800;">Select Asset from Library</h4>
          <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;">&times;</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:10px;">
          ${assets.map(a => `
            <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;cursor:pointer;background:var(--bg-2);" onclick="selectAssetForProduct('${a.url}', '${escapeHtml(a.filename)}')">
              <img src="${a.url}" style="width:100%;height:80px;object-fit:cover;">
              <div style="padding:6px;font-size:0.68rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.filename}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    window.selectAssetForProduct = (url, name) => {
      if (currentManagingProduct) {
        currentManagingProduct.images.push({
          url,
          alt: name,
          isPrimary: currentManagingProduct.images.length === 0,
          sortOrder: currentManagingProduct.images.length
        });
        renderProductGalleryGrid();
        showToast(`Added ${name} to product!`, 'success');
      }
      modal.remove();
    };
    document.body.appendChild(modal);
  } catch (err) {
    showToast('Failed to scan assets: ' + err.message, 'error');
  }
}

async function saveProductGalleryChanges() {
  if (!currentManagingProduct) return;
  try {
    const res = await fetch(`${API_BASE}/products/${currentManagingProduct._id}/images`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify({ images: currentManagingProduct.images })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Gallery changes saved successfully!', 'success');
      closeProductImageModal();
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Failed to save gallery changes', 'error');
    }
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  }
}

// ── AUTOMATIC ASSET SCANNER MODAL & ACTIONS ─────────────────────
function openAssetScannerModal() {
  document.getElementById('asset-scanner-modal').style.display = 'flex';
  runAssetScan();
}

function closeAssetScannerModal() {
  document.getElementById('asset-scanner-modal').style.display = 'none';
  currentScanResults = null;
}

async function runAssetScan() {
  const loading = document.getElementById('scanner-loading');
  const content = document.getElementById('scanner-content');
  loading.style.display = 'block';
  content.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/products/scan-assets`, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Asset scan failed');

    currentScanResults = data;
    renderAssetScanResults(data);
  } catch (err) {
    showToast('Scan error: ' + err.message, 'error');
    document.getElementById('scanner-matched-list').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  } finally {
    loading.style.display = 'none';
    content.style.display = 'block';
  }
}

function renderAssetScanResults(data) {
  document.getElementById('scan-stat-total').textContent = data.totalDetected || 0;
  document.getElementById('scan-stat-matched').textContent = data.matchedCount || 0;
  document.getElementById('scan-stat-unmatched').textContent = data.unmatchedCount || 0;

  const matchedList = document.getElementById('scanner-matched-list');
  const unmatchedList = document.getElementById('scanner-unmatched-list');
  const products = data.productsList || [];

  // 1. Render Matched Items
  if (!data.matched || !data.matched.length) {
    matchedList.innerHTML = '<div style="color:var(--text-muted);padding:14px;text-align:center;font-size:0.85rem;">No automatic matches found. Check unmatched images below.</div>';
  } else {
    matchedList.innerHTML = data.matched.map((m, idx) => {
      const options = products.map(p => `
        <option value="${p._id}" ${p._id === m.match.productId ? 'selected' : ''}>
          ${p.name} (₹${p.basePrice || 'N/A'})
        </option>
      `).join('');

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-2);border-radius:6px;margin-bottom:6px;">
          <img src="${m.url}" alt="${m.filename}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">
          <div style="flex:1;min-width:180px;">
            <div style="font-weight:700;font-size:0.85rem;color:var(--text-primary);">${m.filename}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">
              Role: <strong>${m.galleryRole}</strong> • Category: <strong>${m.detectedCategory}</strong> • Current Price: <strong>₹${m.match.currentPrice} (preserved)</strong>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.75rem;font-weight:700;color:#059669;">✓ Match:</span>
            <select id="match-select-${idx}" class="form-control" style="font-size:0.78rem;padding:4px 8px;width:240px;" data-file="${m.filename}" data-url="${m.url}">
              ${options}
            </select>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Render Unmatched Items
  if (!data.unmatched || !data.unmatched.length) {
    unmatchedList.innerHTML = '<div style="color:var(--text-muted);padding:14px;text-align:center;font-size:0.85rem;">All scanned images matched to catalog products!</div>';
  } else {
    unmatchedList.innerHTML = data.unmatched.map((u, idx) => {
      const options = `<option value="">-- Assign to Existing Product --</option>` + products.map(p => `
        <option value="${p._id}">${p.name}</option>
      `).join('');

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:8px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-2);border-radius:6px;margin-bottom:6px;">
          <img src="${u.url}" alt="${u.filename}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">
          <div style="flex:1;min-width:160px;">
            <div style="font-weight:700;font-size:0.85rem;color:#d97706;">⚠️ ${u.filename}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">Suggested Category: <strong>${u.detectedCategory}</strong></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <select id="unmatch-select-${idx}" class="form-control" style="font-size:0.78rem;padding:4px 8px;width:200px;" data-file="${u.filename}" data-url="${u.url}" data-cat="${u.detectedCategory}">
              ${options}
            </select>
            <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.72rem;padding:4px 8px;white-space:nowrap;" onclick="createSafeProductFromUnmatched(${idx})">
              + Safe Create (Price Unset)
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function createSafeProductFromUnmatched(idx) {
  if (!currentScanResults || !currentScanResults.unmatched[idx]) return;
  const item = currentScanResults.unmatched[idx];
  const name = prompt(`Enter product title to register safely:`, item.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
  if (!name || !name.trim()) return;

  const select = document.getElementById(`unmatch-select-${idx}`);
  if (select) {
    const opt = document.createElement('option');
    opt.value = '__NEW__:' + name.trim();
    opt.textContent = `[NEW] ${name.trim()} (Price not configured)`;
    opt.selected = true;
    select.appendChild(opt);
    showToast(`Queued safe creation for: ${name.trim()}`, 'info');
  }
}

async function applyAssetScannerMatches() {
  if (!currentScanResults) return;
  const btn = document.getElementById('btn-apply-matches');
  btn.disabled = true;
  btn.textContent = 'Applying...';

  const matchesPayload = [];

  // Collect from matched list
  (currentScanResults.matched || []).forEach((m, idx) => {
    const select = document.getElementById(`match-select-${idx}`);
    const selectedPid = select ? select.value : m.match.productId;
    if (selectedPid) {
      matchesPayload.push({
        filename: m.filename,
        url: m.url,
        productId: selectedPid,
        galleryRole: m.galleryRole || 'main',
        sortOrder: m.sortOrder || 0,
        isPrimary: m.galleryRole === 'main'
      });
    }
  });

  // Collect from unmatched list
  (currentScanResults.unmatched || []).forEach((u, idx) => {
    const select = document.getElementById(`unmatch-select-${idx}`);
    if (select && select.value) {
      if (select.value.startsWith('__NEW__:')) {
        const newName = select.value.replace('__NEW__:', '');
        matchesPayload.push({
          filename: u.filename,
          url: u.url,
          isNew: true,
          newName,
          categoryName: u.detectedCategory || 'Supplements',
          galleryRole: 'main',
          isPrimary: true
        });
      } else {
        matchesPayload.push({
          filename: u.filename,
          url: u.url,
          productId: select.value,
          galleryRole: 'main',
          isPrimary: true
        });
      }
    }
  });

  if (!matchesPayload.length) {
    showToast('No matches to apply.', 'error');
    btn.disabled = false;
    btn.textContent = '✓ Apply Image Matches';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/products/apply-asset-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ matches: matchesPayload })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      closeAssetScannerModal();
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Failed to apply matches', 'error');
    }
  } catch (err) {
    showToast('Error applying matches: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✓ Apply Image Matches';
  }
}

async function editProductBarcode(productId, currentBarcode, productName) {
  const newBarcode = prompt(`Enter barcode for "${productName}":`, currentBarcode || '');
  if (newBarcode === null) return;
  if (!newBarcode.trim()) {
    showToast('Barcode cannot be empty', 'error');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/products/${productId}/barcode`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ barcode: newBarcode.trim() })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Updated barcode for ${productName}!`, 'success');
      loadAdminProductsTable();
    } else {
      showToast(data.message || 'Failed to update barcode', 'error');
    }
  } catch {
    showToast('Error updating barcode', 'error');
  }
}

// ── HELPER: Empty State & Error State Renderers ────────────────────
function renderEmptyState(message, icon = '📭', actionHtml = '') {
  return `
    <tr><td colspan="20">
      <div style="text-align:center; padding:48px 24px; color:var(--text-muted);">
        <div style="font-size:3rem; margin-bottom:12px; opacity:0.6;">${icon}</div>
        <div style="font-size:1rem; font-weight:600; margin-bottom:8px; color:var(--text-secondary);">${message}</div>
        ${actionHtml ? `<div style="margin-top:12px;">${actionHtml}</div>` : ''}
      </div>
    </td></tr>`;
}
window.renderEmptyState = renderEmptyState;

function renderErrorState(message, retryFn = '') {
  const retryBtn = retryFn ? `<button class="btn btn-secondary btn-sm" onclick="${retryFn}" style="margin-top:12px;">↺ Retry</button>` : '';
  return `
    <tr><td colspan="20">
      <div style="text-align:center; padding:40px 24px;">
        <div style="font-size:2.5rem; margin-bottom:12px;">⚠️</div>
        <div style="font-size:0.9rem; color:#DC2626; font-weight:600;">${message}</div>
        ${retryBtn}
      </div>
    </td></tr>`;
}
window.renderErrorState = renderErrorState;

// Unified logout function
function logout() {
  localStorage.removeItem('proteinx_token');
  localStorage.removeItem('proteinx_user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
window.logout = logout;

