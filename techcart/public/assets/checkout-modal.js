/**
 * CatalogX Storefront Instant Checkout Modal
 * ===========================================
 * Handles human shipping address collection before launching Razorpay payment.
 * Auto-fills from CatalogX user profile if available.
 */

(function () {
  function getProfile() {
    try {
      const stored = localStorage.getItem('catalogx_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: 'Shreyas',
      email: 'shreyas@agentic.ai',
      phone: '+91 98765 43210',
      delivery_address: {
        street: 'Flat 402, Skyline Residency, 100ft Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560038',
        country: 'India',
      }
    };
  }

  let pendingOrderData = null;

  window.openStoreCheckoutModal = function (product, size, color) {
    pendingOrderData = { product, size, color };
    let modal = document.getElementById('storefront-checkout-modal');
    if (!modal) {
      createCheckoutModal();
      modal = document.getElementById('storefront-checkout-modal');
    }
    populateModalFields(product, size);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.closeStoreCheckoutModal = function () {
    const modal = document.getElementById('storefront-checkout-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  function createCheckoutModal() {
    const modalHtml = `
      <div id="storefront-checkout-modal" class="fixed inset-0 z-[120] hidden items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
        <div class="bg-[#0f141d] border border-[#22314a] text-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm">
                <i class="fa-regular fa-truck-fast"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold">Delivery & Shipping Address</h3>
                <p class="text-[10px] text-slate-400">Razorpay Direct Checkout Fulfillment</p>
              </div>
            </div>
            <button onclick="closeStoreCheckoutModal()" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <i class="fa-regular fa-xmark text-base"></i>
            </button>
          </div>

          <!-- Product Summary Bar -->
          <div id="storefront-checkout-summary" class="flex items-center justify-between p-3 rounded-xl bg-[#141b27] border border-[#22314a] text-xs">
            <!-- Injected dynamically -->
          </div>

          <!-- Form -->
          <form onsubmit="window.handleStorefrontCheckoutSubmit(event)" class="space-y-3">
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Full Name</label>
                <input id="sf-name" type="text" required class="w-full px-3 py-2 rounded-xl bg-[#141b27] border border-[#22314a] text-white focus:outline-none focus:border-blue-500">
              </div>
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input id="sf-phone" type="text" required class="w-full px-3 py-2 rounded-xl bg-[#141b27] border border-[#22314a] text-white focus:outline-none focus:border-blue-500">
              </div>
              <div class="col-span-2">
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">Street Address</label>
                <input id="sf-street" type="text" required class="w-full px-3 py-2 rounded-xl bg-[#141b27] border border-[#22314a] text-white focus:outline-none focus:border-blue-500">
              </div>
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">City</label>
                <input id="sf-city" type="text" required class="w-full px-3 py-2 rounded-xl bg-[#141b27] border border-[#22314a] text-white focus:outline-none focus:border-blue-500">
              </div>
              <div>
                <label class="text-[11px] font-semibold text-slate-300 block mb-1">PIN Code</label>
                <input id="sf-postal" type="text" required class="w-full px-3 py-2 rounded-xl bg-[#141b27] border border-[#22314a] text-white focus:outline-none focus:border-blue-500">
              </div>
            </div>

            <div class="flex gap-2 pt-3">
              <button type="button" onclick="closeStoreCheckoutModal()" class="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-white/5 cursor-pointer">
                Cancel
              </button>
              <button id="sf-pay-btn" type="submit" class="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5">
                <span>Proceed to Payment</span>
                <i class="fa-regular fa-arrow-right text-xs"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function populateModalFields(product, size) {
    const prof = getProfile();
    const sumEl = document.getElementById('storefront-checkout-summary');
    if (sumEl && product) {
      sumEl.innerHTML = `
        <div class="flex items-center gap-2.5">
          <img src="${product.image_url || ''}" class="w-8 h-8 rounded-lg object-cover bg-white/10" alt="">
          <div>
            <div class="font-bold text-white">${product.name}</div>
            <div class="text-[10px] text-slate-400">${size ? `Size: UK ${size}` : 'Standard Edition'}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold text-emerald-400 text-sm">₹${((product.price_paise || 0) / 100).toLocaleString('en-IN')}</div>
          <div class="text-[10px] text-slate-400">Free Express Delivery</div>
        </div>
      `;
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('sf-name', prof.name);
    setVal('sf-phone', prof.phone || '+91 98765 43210');
    setVal('sf-street', prof.delivery_address?.street || 'Flat 402, Skyline Residency, Indiranagar');
    setVal('sf-city', prof.delivery_address?.city || 'Bengaluru');
    setVal('sf-postal', prof.delivery_address?.postal_code || '560038');
  }

  window.handleStorefrontCheckoutSubmit = async function (e) {
    e.preventDefault();
    if (!pendingOrderData || !pendingOrderData.product) return;

    const btn = document.getElementById('sf-pay-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-regular fa-spinner fa-spin"></i> Initializing Razorpay...`;
    }

    const customer = {
      name: document.getElementById('sf-name')?.value.trim() || 'Customer',
      email: 'customer@catalogx.ai',
      phone: document.getElementById('sf-phone')?.value.trim() || '+91 98765 43210',
    };

    const shipping_address = {
      street: document.getElementById('sf-street')?.value.trim() || 'Indiranagar',
      city: document.getElementById('sf-city')?.value.trim() || 'Bengaluru',
      state: 'Karnataka',
      postal_code: document.getElementById('sf-postal')?.value.trim() || '560038',
      country: 'India',
    };

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: pendingOrderData.product.id,
          size: pendingOrderData.size,
          quantity: 1,
          customer,
          shipping_address,
          buyer_agent_id: 'web_storefront_manual',
        }),
      });

      const order = await orderRes.json();
      if (!order.razorpay_order_id) {
        throw new Error(order.error || 'Failed to initialize order');
      }

      closeStoreCheckoutModal();

      const options = {
        key: order.razorpay_key_id || 'rzp_test_TSjdfOWmYoGtxa',
        amount: order.product.price_paise,
        currency: 'INR',
        name: document.title || 'Merchant Store',
        description: `${pendingOrderData.product.name} ${pendingOrderData.size ? `(UK ${pendingOrderData.size})` : ''}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        notes: {
          shipping_street: shipping_address.street,
          shipping_city: shipping_address.city,
          shipping_postal_code: shipping_address.postal_code,
        },
        handler: function (response) {
          if (window.showStoreModal) {
            window.showStoreModal({
              title: 'Payment Successful',
              message: `Payment ID: ${response.razorpay_payment_id}\nOrder ID: ${response.razorpay_order_id}\n\nYour order has been recorded and will be dispatched to ${shipping_address.street}, ${shipping_address.city}!`,
              type: 'success',
              confirmText: 'Continue Shopping',
              onConfirm: () => window.location.reload(),
            });
          } else {
            alert(`Payment Successful!\nPayment ID: ${response.razorpay_payment_id}\nOrder ID: ${response.razorpay_order_id}`);
            window.location.reload();
          }
        },
        theme: {
          color: '#2563EB',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      if (window.showStoreModal) {
        window.showStoreModal({
          title: 'Checkout Error',
          message: err.message || 'Payment initiation failed',
          type: 'error',
        });
      } else {
        alert(`Checkout error: ${err.message}`);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Proceed to Payment</span><i class="fa-regular fa-arrow-right text-xs"></i>`;
      }
    }
  };
})();
