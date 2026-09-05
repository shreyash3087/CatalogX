/**
 * CatalogX Storefront Google Identity SDK Integration
 * ====================================================
 * Official Google Identity Services SDK for merchant storefronts.
 */

(function () {
  function getUser() {
    try {
      const stored = localStorage.getItem('catalogx_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: 'Guest User',
      email: 'guest@catalogx.ai',
      avatar: '',
      isLoggedIn: false
    };
  }

  function setUser(user) {
    try {
      localStorage.setItem('catalogx_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('catalogx_user_changed', { detail: user }));
    } catch (e) {}
    renderAuthPill();
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  function getClientId() {
    return localStorage.getItem('catalogx_google_client_id') || '';
  }

  window.openStoreGoogleAuth = function () {
    let modal = document.getElementById('store-google-modal');
    if (!modal) {
      createModal();
      modal = document.getElementById('store-google-modal');
    }
    renderModalContent();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    initGsiButton();
  };

  window.closeStoreGoogleAuth = function () {
    const modal = document.getElementById('store-google-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  function initGsiButton() {
    const clientId = getClientId();
    const btnContainer = document.getElementById('store-gsi-btn-container');
    if (!btnContainer || !clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response && response.credential) {
            const data = parseJwt(response.credential);
            if (data) {
              setUser({
                name: data.name || data.given_name || 'Google User',
                email: data.email || '',
                avatar: data.picture || '',
                isLoggedIn: true
              });
              closeStoreGoogleAuth();
            }
          }
        }
      });

      window.google.accounts.id.renderButton(btnContainer, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
      });
    } catch (err) {
      console.warn('GSI storefront init:', err);
    }
  }

  function renderAuthPill() {
    const user = getUser();
    const mounts = document.querySelectorAll('.store-google-auth-mount');

    mounts.forEach(mount => {
      if (user.isLoggedIn) {
        mount.innerHTML = `
          <button onclick="openStoreGoogleAuth()" class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs group">
            ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.outerHTML='<div class=\\'w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]\\'>${(user.name||'U').charAt(0).toUpperCase()}</div>'" class="w-5 h-5 rounded-full object-cover border border-emerald-500/80">` : `<div class="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">${(user.name||'U').charAt(0).toUpperCase()}</div>`}
            <span class="max-w-[100px] truncate hidden sm:inline">${user.name}</span>
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </button>
        `;
      } else {
        mount.innerHTML = `
          <button onclick="openStoreGoogleAuth()" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Sign in</span>
          </button>
        `;
      }
    });
  }

  function createModal() {
    const modalHtml = `
      <div id="store-google-modal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/70 backdrop-blur-xs p-4">
        <div class="bg-[#0f141d] border border-[#22314a] text-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs">
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold">Google Cloud Identity</h3>
                <p class="text-[10px] text-slate-400">OAuth 2.0 Official Sign-in</p>
              </div>
            </div>
            <button onclick="closeStoreGoogleAuth()" class="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <i class="fa-regular fa-xmark text-base"></i>
            </button>
          </div>

          <div id="store-google-modal-body" class="space-y-4"></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function renderModalContent() {
    const user = getUser();
    const clientId = getClientId();
    const body = document.getElementById('store-google-modal-body');
    if (!body) return;

    if (user.isLoggedIn) {
      body.innerHTML = `
        <div class="flex items-center gap-3.5 p-3.5 bg-[#141b27] border border-[#22314a] rounded-xl">
          ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.outerHTML='<div class=\\'w-11 h-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base\\'>${(user.name||'U').charAt(0).toUpperCase()}</div>'" class="w-11 h-11 rounded-full object-cover border border-emerald-500">` : `<div class="w-11 h-11 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">${(user.name||'U').charAt(0).toUpperCase()}</div>`}
          <div>
            <div class="text-sm font-bold text-white">${user.name}</div>
            <div class="text-xs text-slate-400">${user.email}</div>
            <div class="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Connected
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button onclick="window.storeGoogleLogout()" class="flex-1 py-2 px-3 rounded-xl border border-red-900/50 bg-red-950/30 text-red-400 font-bold text-xs hover:bg-red-900/40 cursor-pointer">
            Sign Out
          </button>
          <button onclick="closeStoreGoogleAuth()" class="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer">
            Done
          </button>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="flex flex-col items-center justify-center py-2 space-y-3">
          <div id="store-gsi-btn-container" class="min-h-[44px]"></div>
          ${!clientId ? `<p class="text-[11px] text-amber-400 text-center">⚠️ Paste your Google OAuth Client ID below to activate official Sign-in button.</p>` : ''}
        </div>

        <form onsubmit="window.storeSaveClientId(event)" class="space-y-2 pt-2 border-t border-slate-800">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Google OAuth Client ID</label>
            <span class="text-[10px] font-mono text-slate-500">Cloud Console</span>
          </div>
          <input id="store-client-id-input" type="text" value="${clientId}" placeholder="e.g. 12345-xxxx.apps.googleusercontent.com" class="w-full px-3 py-2 text-xs rounded-xl bg-[#141b27] border border-[#22314a] text-white font-mono focus:outline-none focus:border-blue-500">
          <button type="submit" class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer mt-1">
            Save & Connect Google
          </button>
        </form>
      `;
    }
  }

  window.storeSaveClientId = function (e) {
    e.preventDefault();
    const val = document.getElementById('store-client-id-input')?.value.trim() || '';
    localStorage.setItem('catalogx_google_client_id', val);
    alert('✅ Google Client ID saved! Initializing Google Sign-in...');
    renderModalContent();
    initGsiButton();
  };

  window.storeGoogleLogout = function () {
    setUser({
      name: 'Guest User',
      email: 'guest@catalogx.ai',
      avatar: '',
      isLoggedIn: false
    });
    closeStoreGoogleAuth();
  };

  // Load Google Identity Script dynamically if not present
  if (!document.getElementById('google-gsi-script')) {
    const s = document.createElement('script');
    s.id = 'google-gsi-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  window.addEventListener('DOMContentLoaded', renderAuthPill);
  window.addEventListener('catalogx_user_changed', renderAuthPill);
})();
