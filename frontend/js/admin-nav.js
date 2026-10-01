/**
 * PROTEINX Admin Navigation Injector
 * Injects consistent sidebar into every admin page.
 * Auto-detects current page and marks the active nav item.
 * Shows live notification badges (pending orders, reviews, returns).
 */
(function () {
  'use strict';

  var ADMIN_NAV_ITEMS = [
    { label: 'Dashboard',     icon: '📊', href: 'index.html',        id: 'index' },
    { label: 'Products',      icon: '📦', href: 'products.html',     id: 'products' },
    { label: 'Orders',        icon: '🛒', href: 'orders.html',       id: 'orders',       badge: 'pending-orders' },
    { label: 'Customers',     icon: '👥', href: 'customers.html',    id: 'customers' },
    { label: 'Reviews',       icon: '⭐', href: 'reviews.html',      id: 'reviews',      badge: 'pending-reviews' },
    { label: 'Coupons',       icon: '🏷️',  href: 'coupons.html',     id: 'coupons' },
    { label: 'Flash Sales',   icon: '⚡', href: 'flash-sales.html',  id: 'flash-sales' },
    { label: 'Returns',       icon: '🔄', href: 'returns.html',      id: 'returns',      badge: 'pending-returns' },
    { label: 'Banners',       icon: '🖼️',  href: 'banners.html',     id: 'banners' },
    { label: 'Videos',        icon: '🎥', href: 'videos.html',       id: 'videos' },
    { label: 'Analytics',     icon: '📈', href: 'analytics.html',    id: 'analytics' },
    { label: 'Invoices',      icon: '🧾', href: 'invoices.html',     id: 'invoices' },
    { label: 'Shipping',      icon: '🚚', href: 'shipping.html',     id: 'shipping' },
    { label: 'Email',         icon: '📧', href: 'email.html',        id: 'email' },
    { label: 'CMS Pages',     icon: '📝', href: 'cms.html',          id: 'cms' },
    { label: 'Media',         icon: '🖼️',  href: 'media.html',       id: 'media' },
    { label: 'Roles & Staff', icon: '🛡️',  href: 'roles.html',       id: 'roles' },
    { label: 'Backup',        icon: '💾', href: 'backup.html',       id: 'backup' },
    { label: 'Settings',      icon: '⚙️',  href: 'settings.html',    id: 'settings' },
    { label: 'Activity Log',  icon: '📋', href: 'activity-log.html', id: 'activity-log' }
  ];

  function getCurrentPageId() {
    var path = window.location.pathname;
    var file = path.split('/').pop().replace('.html', '') || 'index';
    return file;
  }

  function buildSidebarHTML(currentId) {
    var navItems = ADMIN_NAV_ITEMS.map(function(item) {
      var isActive = item.id === currentId || (currentId === '' && item.id === 'index');
      var badgeHtml = item.badge ? '<span class="admin-nav-badge hidden" id="nav-badge-' + item.badge + '"></span>' : '';
      return '<a href="' + item.href + '" class="admin-nav-item' + (isActive ? ' active' : '') + '" data-page="' + item.id + '">' +
        '<span class="nav-icon">' + item.icon + '</span>' +
        '<span class="nav-label">' + item.label + '</span>' +
        badgeHtml +
        '</a>';
    }).join('');

    return '<div class="admin-brand">' +
      '<a href="../index.html" class="logo" style="text-decoration:none;">' +
        '<div class="logo-icon">X</div>' +
        'PROTEIN<span>X</span>' +
      '</a>' +
      '<div class="admin-console-label">ADMIN CONSOLE</div>' +
    '</div>' +
    '<nav class="admin-nav" id="admin-nav-menu">' + navItems + '</nav>' +
    '<div class="admin-sidebar-footer">' +
      '<a href="../index.html" class="admin-sidebar-store-link">🌐 View Store</a>' +
      '<button class="btn btn-secondary btn-sm" style="width:100%;margin-top:8px;" onclick="adminLogout()">🚪 Logout</button>' +
    '</div>';
  }

  function injectSidebar() {
    var sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;
    var currentId = getCurrentPageId();
    sidebar.innerHTML = buildSidebarHTML(currentId);
  }

  function updateUserDisplay() {
    var el = document.getElementById('admin-user-display');
    if (!el) return;
    try {
      var raw = localStorage.getItem('proteinx_user') || localStorage.getItem('user');
      var user = raw ? JSON.parse(raw) : null;
      if (user && user.name) el.textContent = user.name;
    } catch(e) {}
  }

  function loadNotificationBadges() {
    var token = localStorage.getItem('proteinx_token') || localStorage.getItem('token') || '';
    if (!token) return;
    var apiBase = window.API_BASE || ((typeof window !== 'undefined' && window.location && window.location.port === '5000') ? '/api' : 'http://localhost:5000/api');
    fetch(apiBase + '/analytics/dashboard', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function(r){ return r.json(); }).then(function(data) {
      if (!data.success) return;
      var s = data.stats;
      function setBadge(id, val) {
        var el = document.getElementById('nav-badge-' + id);
        if (!el) return;
        if (val > 0) { el.textContent = val > 99 ? '99+' : val; el.classList.remove('hidden'); }
        else { el.classList.add('hidden'); }
      }
      setBadge('pending-orders', s.pendingOrders || 0);
      setBadge('pending-reviews', s.pendingReviews || 0);
      setBadge('pending-returns', s.pendingReturns || 0);
    }).catch(function(){});
  }

  function bindHamburger() {
    var btns = document.querySelectorAll('.hamburger');
    var sidebar = document.getElementById('admin-sidebar');
    if (!sidebar) return;

    var backdrop = document.getElementById('admin-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'admin-backdrop';
      backdrop.className = 'admin-backdrop';
      document.body.appendChild(backdrop);
    }

    function toggleSidebar() {
      var isOpen = sidebar.classList.toggle('open');
      backdrop.classList.toggle('active', isOpen);
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    }

    btns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
      });
    });

    backdrop.addEventListener('click', closeSidebar);

    sidebar.addEventListener('click', function(e) {
      if (e.target.closest('.admin-nav-item') || e.target.closest('.admin-nav-link')) {
        if (window.innerWidth <= 1024) {
          closeSidebar();
        }
      }
    });
  }

  window.adminLogout = function() {
    ['proteinx_token','proteinx_user','token','user'].forEach(function(k){ localStorage.removeItem(k); });
    window.location.href = 'login.html';
  };
  if (!window.logout) { window.logout = window.adminLogout; }

  document.addEventListener('DOMContentLoaded', function() {
    injectSidebar();
    updateUserDisplay();
    bindHamburger();
    setTimeout(loadNotificationBadges, 1500);
  });
})();
