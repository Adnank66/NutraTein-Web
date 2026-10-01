/**
 * PROTEINX — Admin Dashboard Enhanced Functions
 * Sales chart, top products, recent activity, enhanced KPI cards
 */

// Override/enhance the core loadAdminDashboard with new KPI cards
async function loadAdminDashboard() {
  if (!checkAdminAuth()) return;

  const statsGrid = document.getElementById('admin-stats-grid');
  const alertContainer = document.getElementById('dashboard-delayed-alert');

  try {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to load dashboard');

    const s = data.stats;

    // ── Delayed Orders Alert ──────────────────────────────
    if (alertContainer) {
      if ((s.delayedOrders || 0) > 0) {
        alertContainer.classList.remove('hidden');
        alertContainer.innerHTML = `
          <div class="delayed-alert-icon">⚠️</div>
          <div style="flex:1;">
            <div class="delayed-alert-title">Attention: ${s.delayedOrders} Order(s) Have Exceeded Expected Delivery Date!</div>
            <div class="delayed-alert-desc">Immediate action required. Review shipment tracking and update customers.</div>
          </div>
          <a href="shipping.html" class="btn btn-sm btn-primary" style="background:#E11D48;border:none;">Manage Delayed Shipments →</a>
        `;
      } else {
        alertContainer.classList.add('hidden');
      }
    }

    // ── Enhanced KPI Cards ────────────────────────────────
    if (statsGrid) {
      const cards = [
        {
          icon: '₹', iconBg: 'rgba(235,94,40,0.1)', iconColor: 'var(--brand)',
          val: `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`,
          label: 'Total Revenue',
          sub: s.todayRevenue ? `Today: ₹${(s.todayRevenue || 0).toLocaleString('en-IN')}` : '',
          border: ''
        },
        {
          icon: '📦', iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366F1',
          val: `${s.totalOrders || 0}`,
          label: 'Total Orders',
          sub: `${s.completedOrders || 0} Delivered`,
          border: ''
        },
        {
          icon: '⏳', iconBg: '#FEF3C7', iconColor: '#92400E',
          val: `${s.pendingOrders || 0}`,
          label: 'Pending Orders',
          sub: '', border: ''
        },
        {
          icon: '👥', iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10B981',
          val: `${s.totalCustomers || 0}`,
          label: 'Total Customers',
          sub: '', border: '',
          link: 'customers.html'
        },
        {
          icon: '📊', iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366F1',
          val: s.avgOrderValue ? `₹${s.avgOrderValue.toLocaleString('en-IN')}` : '—',
          label: 'Avg. Order Value',
          sub: '', border: ''
        },
        {
          icon: '📦', iconBg: 'rgba(235,94,40,0.1)', iconColor: 'var(--brand)',
          val: `${s.totalProducts || 0}`,
          label: 'Total Products',
          sub: '', border: ''
        },
        {
          icon: '⚠️', iconBg: '#FEF3C7', iconColor: '#D97706',
          val: `${s.lowStockCount || 0}`,
          label: 'Low Stock Items',
          sub: `${s.outOfStockCount || 0} Out of Stock`,
          border: (s.lowStockCount || 0) > 0 ? '4px solid #D97706' : ''
        },
        {
          icon: '⭐', iconBg: '#FEF3C7', iconColor: '#92400E',
          val: `${s.pendingReviews || 0} Pending`,
          label: 'Reviews',
          sub: `${s.totalReviews || 0} total`,
          link: 'reviews.html',
          border: (s.pendingReviews || 0) > 0 ? '4px solid #D97706' : ''
        },
        {
          icon: '🔄', iconBg: '#EDE9FE', iconColor: '#5B21B6',
          val: `${s.pendingReturns || 0}`,
          label: 'Pending Returns',
          sub: '', link: 'returns.html',
          border: (s.pendingReturns || 0) > 0 ? '4px solid #7C3AED' : ''
        },
        {
          icon: '🏷️', iconBg: '#D1FAE5', iconColor: '#065F46',
          val: `${s.activeCoupons || 0}`,
          label: 'Active Coupons',
          sub: '', link: 'coupons.html', border: ''
        },
        {
          icon: '⚡', iconBg: '#FEF3C7', iconColor: '#92400E',
          val: `${s.activeFlashSales || 0}`,
          label: 'Active Flash Sales',
          sub: '', link: 'flash-sales.html', border: ''
        },
        {
          icon: '🚚', iconBg: '#FFE4E6', iconColor: '#E11D48',
          val: `${s.delayedOrders || 0}`,
          label: 'Delayed Shipments',
          sub: '', link: 'shipping.html',
          border: (s.delayedOrders || 0) > 0 ? '4px solid #E11D48' : ''
        },
        {
          icon: '📧', iconBg: 'rgba(235,94,40,0.1)', iconColor: 'var(--brand)',
          val: `${s.emailsSentToday || 0} Sent`,
          label: 'Emails Today',
          sub: `${s.emailsFailed || 0} failed`,
          link: 'email.html', border: ''
        }
      ];

      statsGrid.innerHTML = cards.map(c => `
        <div class="stat-card${c.border ? ' stat-card-row' : ''}" style="${c.border ? 'border-left:' + c.border + ';' : ''}">
          <div class="stat-icon" style="background:${c.iconBg};color:${c.iconColor};">${c.icon}</div>
          <div>
            <div class="stat-val">${c.val}</div>
            <div class="stat-label">
              ${c.link ? `<a href="${c.link}" style="color:inherit;text-decoration:none;">${c.label} →</a>` : c.label}
            </div>
            ${c.sub ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${c.sub}</div>` : ''}
          </div>
        </div>
      `).join('');
    }

    // ── Load dependent sections ───────────────────────────
    loadSalesChart(document.getElementById('chart-period-select')?.value || '7d');
    loadOrderPipeline(s);
    loadTopProducts();
    loadRecentActivity();
    loadAdminOrdersTable(6);
    if (typeof loadInventoryAlerts === 'function') loadInventoryAlerts();

  } catch (err) {
    console.error('Dashboard load error:', err);
    if (statsGrid) {
      statsGrid.innerHTML = `<div class="stat-card" style="grid-column:1/-1;text-align:center;padding:32px;color:#DC2626;">
        ⚠️ Failed to load dashboard: ${err.message}
        <br><button class="btn btn-primary btn-sm" onclick="loadAdminDashboard()" style="margin-top:12px;">Retry</button>
      </div>`;
    }
  }
}
window.loadAdminDashboard = loadAdminDashboard;

// ── Sales Chart (SVG bar chart) ────────────────────────────────
async function loadSalesChart(period = '7d') {
  const container = document.getElementById('sales-chart-container');
  const label = document.getElementById('chart-total-label');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:70px 0;"><div class="loading-spinner"></div></div>';

  try {
    const res = await fetch(`${API_BASE}/analytics/sales-chart?period=${period}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const { labels, revenue, summary } = data;
    if (label) {
      label.textContent = `Total: ₹${(summary.totalRevenue || 0).toLocaleString('en-IN')} | ${summary.totalOrders || 0} orders`;
    }

    if (!labels.length) {
      container.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--text-muted);">No sales data for this period.</div>';
      return;
    }

    const maxRev = Math.max(...revenue, 1);
    const chartH = 160;
    const chartW = 100; // percent per bar
    const barCount = labels.length;
    const barW = Math.max(2, Math.min(28, Math.floor(600 / barCount) - 4));
    const gap = Math.max(1, Math.floor(600 / barCount) - barW);

    // Build SVG
    let svgBars = '';
    let svgLabels = '';
    const totalW = barCount * (barW + gap);

    labels.forEach((lbl, i) => {
      const barH = revenue[i] > 0 ? Math.max(3, Math.round((revenue[i] / maxRev) * (chartH - 20))) : 2;
      const x = i * (barW + gap);
      const y = chartH - barH - 20;
      const isMax = revenue[i] === maxRev && revenue[i] > 0;
      const color = isMax ? 'var(--brand)' : 'rgba(235,94,40,0.45)';
      svgBars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${color}" class="chart-bar">
        <title>${lbl}: ₹${revenue[i].toLocaleString('en-IN')}</title>
      </rect>`;
      if (revenue[i] > 0) {
        svgBars += `<text x="${x + barW/2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="var(--text-muted)">${revenue[i] >= 1000 ? '₹' + Math.round(revenue[i]/1000) + 'k' : ''}</text>`;
      }
      if (barCount <= 15) {
        const shortLbl = lbl.length > 6 ? lbl.slice(0, 5) : lbl;
        svgLabels += `<text x="${x + barW/2}" y="${chartH - 4}" text-anchor="middle" font-size="9" fill="var(--text-muted)">${shortLbl}</text>`;
      }
    });

    container.innerHTML = `
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <svg viewBox="0 0 ${Math.max(totalW, 400)} ${chartH}" preserveAspectRatio="none" style="width:100%;height:${chartH}px;display:block;">
          ${svgBars}
          ${svgLabels}
        </svg>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:60px 0;color:#DC2626;">Failed to load chart: ${err.message}</div>`;
  }
}
window.loadSalesChart = loadSalesChart;
window.switchChartPeriod = function(period) { loadSalesChart(period); };

// ── Order Pipeline Visualization ───────────────────────────────
function loadOrderPipeline(stats) {
  const container = document.getElementById('order-pipeline-container');
  if (!container) return;

  const pipeline = [
    { label: 'Pending',     count: stats.pendingOrders || 0,      color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Delivered',   count: stats.completedOrders || 0,    color: '#10B981', bg: '#D1FAE5' },
    { label: 'Cancelled',   count: stats.cancelledOrders || 0,    color: '#EF4444', bg: '#FEE2E2' },
    { label: 'Delayed',     count: stats.delayedOrders || 0,      color: '#E11D48', bg: '#FFE4E6' },
    { label: 'Returns',     count: stats.pendingReturns || 0,     color: '#8B5CF6', bg: '#EDE9FE' },
  ];

  const total = Math.max(stats.totalOrders || 1, 1);

  container.innerHTML = pipeline.map(p => {
    const pct = p.count > 0 ? Math.round((p.count / total) * 100) : 0;
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:700;margin-bottom:4px;">
          <span style="color:var(--text-secondary);">${p.label}</span>
          <span style="color:${p.color};">${p.count} <span style="color:var(--text-muted);font-weight:400;">(${pct}%)</span></span>
        </div>
        <div style="background:var(--bg-2);border-radius:99px;height:8px;overflow:hidden;">
          <div style="width:${Math.max(pct, p.count > 0 ? 2 : 0)}%;height:100%;background:${p.color};border-radius:99px;transition:width 0.6s ease;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Top Products ───────────────────────────────────────────────
async function loadTopProducts() {
  const container = document.getElementById('top-products-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/analytics/product-performance`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const top = (data.rankings?.topBestSellers || []).slice(0, 5);
    if (!top.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">No product data available.</div>';
      return;
    }

    container.innerHTML = top.map((p, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i < top.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}">
        <div style="width:28px;height:28px;background:var(--brand-light);color:var(--brand);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;flex-shrink:0;">${i+1}</div>
        <img src="${p.image || 'https://placehold.co/40x40/F1F5F9/475569?text=PX'}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" onerror="this.src='https://placehold.co/40x40/F1F5F9/475569?text=PX'">
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.82rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">${p.unitsSold || 0} sold • ${p.stockStatus}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:0.85rem;font-weight:800;color:var(--brand);">₹${(p.revenue || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#DC2626;">Failed to load: ${err.message}</div>`;
  }
}

// ── Recent Activity ────────────────────────────────────────────
async function loadRecentActivity() {
  const container = document.getElementById('recent-activity-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/activity-logs?limit=8`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const logs = data.logs || [];
    if (!logs.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);">No recent activity yet.</div>';
      return;
    }

    const moduleColors = {
      ORDERS: '#F59E0B', PRODUCTS: '#10B981', COUPONS: '#6366F1',
      SHIPPING: '#3B82F6', EMAIL: '#8B5CF6', BANNERS: '#EC4899', DEFAULT: 'var(--brand)'
    };

    container.innerHTML = `<div style="max-height:260px;overflow-y:auto;">` +
      logs.map(log => {
        const color = moduleColors[log.module] || moduleColors.DEFAULT;
        const time = new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;margin-top:5px;"></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.78rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${log.description || log.action}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">${log.admin || 'Admin'} • ${time}</div>
          </div>
        </div>`;
      }).join('') +
    `</div>`;

  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#DC2626;">Failed to load activity: ${err.message}</div>`;
  }
}

// Responsive: collapse charts row on mobile
(function() {
  function adjustLayout() {
    var chartsRow = document.getElementById('charts-row');
    var bottomRow = document.getElementById('bottom-row');
    if (!chartsRow && !bottomRow) return;
    var mobile = window.innerWidth < 768;
    if (chartsRow) chartsRow.style.gridTemplateColumns = mobile ? '1fr' : '1fr 1fr';
    if (bottomRow) bottomRow.style.gridTemplateColumns = mobile ? '1fr' : '1fr 1fr';
  }
  window.addEventListener('resize', adjustLayout);
  document.addEventListener('DOMContentLoaded', adjustLayout);
})();
