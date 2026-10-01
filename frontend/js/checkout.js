/**
 * PROTEINX — Checkout & Order Flow Module
 * Shipping Address, Order Summary, Coupon Validation, Place Order
 */

let appliedCoupon = null;

function initCheckoutPage() {
  const container = document.getElementById('checkout-page-container');
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // Pre-fill user details if logged in
  const user = getUser();
  if (user) {
    const nameInput = document.getElementById('ship-name');
    const phoneInput = document.getElementById('ship-phone');
    if (nameInput) nameInput.value = user.name || '';
    if (phoneInput) phoneInput.value = user.phone || '';

    if (user.addresses && user.addresses.length) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      if (document.getElementById('ship-house')) document.getElementById('ship-house').value = def.houseFlat || '';
      if (document.getElementById('ship-street')) document.getElementById('ship-street').value = def.street || '';
      if (document.getElementById('ship-city')) document.getElementById('ship-city').value = def.city || '';
      if (document.getElementById('ship-state')) document.getElementById('ship-state').value = def.state || '';
      if (document.getElementById('ship-pincode')) document.getElementById('ship-pincode').value = def.pincode || '';
    }
  }

  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const itemsContainer = document.getElementById('checkout-items-list');
  if (!itemsContainer) return;

  const cart = getCart();
  const totals = getCartTotals();

  itemsContainer.innerHTML = cart.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.875rem;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <img src="${item.image || '/assets/images/Createin Monohydrate.jpeg'}" alt="${item.name}" style="width: 44px; height: 44px; object-fit: contain; padding: 2px; background: var(--bg-2); border-radius: var(--radius-sm);" onerror="this.src='/assets/images/Createin Monohydrate.jpeg'">
        <div>
          <div style="font-weight: 600;">${item.name}</div>
          <div style="color: var(--text-muted); font-size: 0.8rem;">Qty: ${item.quantity} ${item.flavor ? '| ' + item.flavor : ''}</div>
        </div>
      </div>
      <span style="font-weight: 700;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>
  `).join('');

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENT') {
      discountAmount = Math.round((totals.subtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount) discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const finalTotal = Math.max(0, totals.subtotal - discountAmount + totals.shipping);

  const subtotalEl = document.getElementById('checkout-subtotal');
  const shippingEl = document.getElementById('checkout-shipping');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountEl = document.getElementById('checkout-discount');
  const totalEl = document.getElementById('checkout-total');

  if (subtotalEl) subtotalEl.textContent = `₹${totals.subtotal.toLocaleString('en-IN')}`;
  if (shippingEl) shippingEl.textContent = totals.shipping === 0 ? 'FREE' : `₹${totals.shipping}`;
  
  if (discountRow && discountEl) {
    if (discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-₹${discountAmount.toLocaleString('en-IN')}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
}

async function applyCoupon() {
  const input = document.getElementById('coupon-input');
  const msg = document.getElementById('coupon-msg');
  if (!input || !msg) return;

  const code = input.value.trim().toUpperCase();
  if (!code) return;

  const totals = getCartTotals();
  msg.innerHTML = '<span style="color: var(--text-muted);">Validating coupon...</span>';

  try {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderTotal: totals.subtotal })
    });
    const data = await res.json();

    if (data.success) {
      appliedCoupon = data.coupon;
      appliedCoupon.discountAmount = data.discountAmount;
      msg.innerHTML = `<span style="color: #065F46; font-weight: 600;">✓ Coupon applied: ₹${data.discountAmount} discount</span>`;
      renderCheckoutSummary();
    } else {
      appliedCoupon = null;
      msg.innerHTML = `<span style="color: #DC2626;">${data.message || 'Invalid coupon code'}</span>`;
      renderCheckoutSummary();
    }
  } catch {
    msg.innerHTML = '<span style="color: #DC2626;">Failed to validate coupon</span>';
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const name = document.getElementById('ship-name').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const houseFlat = document.getElementById('ship-house').value.trim();
  const street = document.getElementById('ship-street').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const state = document.getElementById('ship-state').value.trim();
  const pincode = document.getElementById('ship-pincode').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD';

  if (!name || !phone || !houseFlat || !street || !city || !state || !pincode) {
    showToast('Please fill all delivery address fields', 'error');
    return;
  }

  const cart = getCart();
  const token = getToken();

  if (!token) {
    showToast('Please log in or register to place your order', 'info');
    setTimeout(() => { window.location.href = 'login.html?redirect=checkout.html'; }, 1000);
    return;
  }

  const btn = document.getElementById('place-order-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner" style="width: 18px; height: 18px;"></div> Placing Order...';
  }

  try {
    const payload = {
      items: cart,
      shippingAddress: { name, phone, houseFlat, street, city, state, pincode },
      paymentMethod,
      couponCode: appliedCoupon ? appliedCoupon.code : ''
    };

    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success && data.order) {
      // Clear cart
      localStorage.removeItem('proteinx_cart');
      updateBadges();

      showToast('Order placed successfully!', 'success');
      setTimeout(() => {
        window.location.href = `tracking.html?orderId=${data.order.orderNumber}`;
      }, 1000);
    } else {
      showToast(data.message || 'Failed to place order', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Place Order';
      }
    }
  } catch (err) {
    showToast('Error placing order. Please try again.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  }
}
