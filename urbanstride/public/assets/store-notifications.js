// Store Notifications & Custom Themed Popups (UrbanStride & TechCart)
(function () {
  if (typeof window === 'undefined') return;

  function ensureModalContainer() {
    let container = document.getElementById('store-notification-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'store-notification-root';
      document.body.appendChild(container);
    }
    return container;
  }

  window.showStoreModal = function ({
    title = 'Notice',
    message = '',
    type = 'info', // 'info' | 'success' | 'warning' | 'error' | 'confirm'
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm = null,
    onCancel = null,
  } = {}) {
    const container = ensureModalContainer();

    const isConfirm = type === 'confirm';
    let iconHtml = '';
    if (type === 'success') {
      iconHtml = `<div style="width:40px;height:40px;border-radius:12px;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;"><i class="fa-regular fa-circle-check"></i></div>`;
    } else if (type === 'warning') {
      iconHtml = `<div style="width:40px;height:40px;border-radius:12px;background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;"><i class="fa-regular fa-triangle-exclamation"></i></div>`;
    } else if (type === 'error') {
      iconHtml = `<div style="width:40px;height:40px;border-radius:12px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;"><i class="fa-regular fa-circle-xmark"></i></div>`;
    } else if (type === 'confirm') {
      iconHtml = `<div style="width:40px;height:40px;border-radius:12px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;"><i class="fa-regular fa-shield-exclamation"></i></div>`;
    } else {
      iconHtml = `<div style="width:40px;height:40px;border-radius:12px;background:rgba(37,99,235,0.1);color:#3b82f6;border:1px solid rgba(37,99,235,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;"><i class="fa-regular fa-circle-info"></i></div>`;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: storeFadeIn 0.15s ease-out;
    `;

    overlay.innerHTML = `
      <div style="
        background: #0f141d;
        color: #ffffff;
        border: 1px solid #22314a;
        border-radius: 18px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.8);
        width: 100%;
        max-width: 440px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        font-family: inherit;
      ">
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          ${iconHtml}
          <div style="flex: 1; min-width: 0;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">${title}</h3>
            <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5; color: #94a3b8; white-space: pre-line;">${message}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
          ${
            isConfirm
              ? `<button id="store-modal-cancel" style="padding: 9px 16px; border-radius: 10px; font-size: 12px; font-weight: 600; background: transparent; border: 1px solid #334155; color: #cbd5e1; cursor: pointer; transition: all 0.15s;">${cancelText}</button>`
              : ''
          }
          <button id="store-modal-confirm" style="padding: 9px 20px; border-radius: 10px; font-size: 12px; font-weight: 600; background: #2563eb; border: none; color: #ffffff; cursor: pointer; transition: all 0.15s;">${confirmText}</button>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    const cleanup = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const confirmBtn = overlay.querySelector('#store-modal-confirm');
    const cancelBtn = overlay.querySelector('#store-modal-cancel');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cleanup();
        if (onCancel) onCancel();
      });
    }
  };

  // Themed replacement for alert() in storefront pages
  window.alert = function (msg) {
    let type = 'info';
    let title = 'Store Notification';
    const text = String(msg || '');

    if (text.includes('🎉') || text.toLowerCase().includes('success') || text.toLowerCase().includes('subscribed')) {
      type = 'success';
      title = 'Success';
    } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
      type = 'error';
      title = 'Error';
    } else if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('required')) {
      type = 'warning';
      title = 'Attention Required';
    }

    window.showStoreModal({
      title,
      message: text.replace(/^[🎉✅⚠️❌ℹ️🔒📍]\s*/, ''),
      type,
    });
  };
})();
