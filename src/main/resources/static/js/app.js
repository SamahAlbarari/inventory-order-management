(function(){
  const TOKEN_KEY = 'inventory.jwt';
  const ROLE_KEY = 'inventory.role';
  const EMAIL_KEY = 'inventory.email';
  const NAME_KEY = 'inventory.name';

  function getToken(){ return localStorage.getItem(TOKEN_KEY); }

  function base64UrlDecode(str){
    str = (str || '').replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(str), c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch (e) {
      try { return atob(str); } catch (e2) { return null; }
    }
  }

  function parseJwt(token){
    try {
      const parts = String(token||'').split('.');
      if (parts.length < 2) return null;
      const json = base64UrlDecode(parts[1]);
      return json ? JSON.parse(json) : null;
    } catch (e) { return null; }
  }

  function getEmail(){ return localStorage.getItem(EMAIL_KEY); }
  function setEmail(v){ if(v) localStorage.setItem(EMAIL_KEY, v); }
  function getName(){ return localStorage.getItem(NAME_KEY); }
  function setName(v){ if(v) localStorage.setItem(NAME_KEY, v); }

  function setToken(t){
    localStorage.setItem(TOKEN_KEY, t);
    const payload = parseJwt(t) || {};
    const email = payload.sub || payload.email;
    const name = payload.name || payload.fullName;
    if (email) setEmail(String(email));
    if (name) setName(String(name));
  }

  function clearToken(){
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(NAME_KEY);
  }
  function getRole(){ return localStorage.getItem(ROLE_KEY); }
  function setRole(r){ localStorage.setItem(ROLE_KEY, r); }

  async function api(path, options={}){
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
    const token = getToken();
    if(token) headers.set('Authorization', 'Bearer ' + token);

    const res = await fetch(path, {...options, headers});
    const ct = res.headers.get('content-type') || '';
    let data = null;
    if(ct.includes('application/json')){
      try{ data = await res.json(); }catch(e){ data = null; }
    }else{
      try{ data = await res.text(); }catch(e){ data = null; }
    }

    if(!res.ok){
      // Build a human-friendly message. Never surface raw HTTP codes like "HTTP 404".
      const extract = (payload) => {
        if (!payload) return null;
        if (typeof payload === 'string') {
          const s = payload.trim();
          // Avoid generic server strings that are not helpful to users.
          if (!s) return null;
          if (/^http\s*\d{3}$/i.test(s)) return null;
          if (/internal server error/i.test(s)) return null;
          return s;
        }
        if (typeof payload === 'object') {
          const msg = payload.message || payload.error || payload.details || payload.title;
          if (typeof msg === 'string' && msg.trim()) return msg.trim();

          // Common validation payload shapes
          const errors = payload.errors || payload.fieldErrors || payload.violations;
          if (Array.isArray(errors) && errors.length) {
            const parts = errors
              .map(e => (e && (e.message || e.defaultMessage || e.errorMessage || e.msg)) ? String(e.message || e.defaultMessage || e.errorMessage || e.msg) : null)
              .filter(Boolean);
            if (parts.length) return parts.join(' | ');
          }

          // Last resort: join simple string fields
          const entries = Object.entries(payload)
            .filter(([k,v]) => typeof v === 'string' && v.trim().length)
            .map(([k,v]) => `${k}: ${v}`);
          if (entries.length) return entries.join(' | ');
        }
        return null;
      };

      const fallback = (status) => {
        switch (status) {
          case 400: return 'Invalid input. Please check the fields and try again.';
          case 401: return 'Your session has expired. Please log in again.';
          case 403: return 'Access denied.';
          case 404: return 'Not found.';
          case 409: return 'This action conflicts with existing data. Please refresh and try again.';
          case 422: return 'Some fields are not valid. Please review your input.';
          default:
            if (status >= 500) return 'Server error. Please try again.';
            return 'Something went wrong. Please try again.';
        }
      };

      const msg = extract(data) || fallback(res.status);
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      err.path = path;
      throw err;
    }
    return data;
  }

  function toast(msg, kind='warn'){
    // kind: 'ok' | 'danger' | 'warn'
    const k = (kind === 'error') ? 'danger' : (kind === 'success' ? 'ok' : (kind || 'warn'));
    let host = document.querySelector('.toast');
    if(!host){
      host = document.createElement('div');
      host.className = 'toast';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'item ' + k;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=>{ el.remove(); }, 3800);
  }

  
  // ---------------------------------------------------------------------------
  // Inline field errors (Front-End only)
  // - Adds a red highlight on the problematic field
  // - Shows a small themed message next to the field
  // Used across the site for clearer validation feedback.
  // ---------------------------------------------------------------------------
  function _resolveEl(elOrSelector, scope=document){
    if(!elOrSelector) return null;
    if(typeof elOrSelector === 'string') return scope.querySelector(elOrSelector) || document.querySelector(elOrSelector);
    return elOrSelector;
  }

  function clearFieldErrors(scope=document){
    const root = scope || document;
    root.querySelectorAll('.field-error').forEach(n=>n.remove());
    root.querySelectorAll('.input-error, .is-invalid').forEach(el=>{
      el.classList.remove('input-error');
      el.classList.remove('is-invalid');
      try{ el.removeAttribute('aria-invalid'); }catch(_){}
    });
  }

  function setFieldError(elOrSelector, message, opts={}){
    const scope = opts.scope || document;
    const el = _resolveEl(elOrSelector, scope);
    if(!el) return false;

    // Remove any previous error for this element
    const parent = el.parentElement || el;
    const existing = parent.querySelector(':scope > .field-error');
    if(existing) existing.remove();

    el.classList.add('input-error');
    // keep compatibility with any existing invalid styling
    el.classList.add('is-invalid');
    try{ el.setAttribute('aria-invalid','true'); }catch(_){}

    const msg = document.createElement('div');
    msg.className = 'field-error';
    msg.textContent = message || 'Invalid value.';
    // Place error right after the field
    if(el.nextSibling){
      el.parentNode.insertBefore(msg, el.nextSibling);
    }else{
      el.parentNode.appendChild(msg);
    }

    // Clear on input/change
    const clear = ()=>{
      el.classList.remove('input-error');
      el.classList.remove('is-invalid');
      try{ el.removeAttribute('aria-invalid'); }catch(_){}
      if(msg && msg.parentNode) msg.remove();
      el.removeEventListener('input', clear);
      el.removeEventListener('change', clear);
    };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);

    return true;
  }

  function getFieldErrorsFromPayload(payload){
    if(!payload || typeof payload !== 'object') return null;

    // Spring validation handler returns a map: { fieldName: "message", ... }
    const entries = Object.entries(payload);
    if(entries.length && entries.every(([k,v]) => typeof v === 'string')){
      return payload;
    }

    // Other common shapes: {fieldErrors:{...}} or {errors:[{field,message}]}
    if(payload.fieldErrors && typeof payload.fieldErrors === 'object'){
      return payload.fieldErrors;
    }
    if(Array.isArray(payload.errors)){
      const map = {};
      payload.errors.forEach(e=>{
        const f = e && (e.field || e.name || e.path);
        const m = e && (e.message || e.defaultMessage || e.errorMessage || e.msg);
        if(f && m) map[f] = m;
      });
      return Object.keys(map).length ? map : null;
    }
    return null;
  }

  function applyFieldErrors(scope, fieldErrors, mapping={}){
    const root = scope || document;
    if(!fieldErrors) return 0;
    let applied = 0;

    for(const [field, message] of Object.entries(fieldErrors)){
      let el = null;

      const mapSel = mapping && mapping[field];
      if(mapSel){
        el = _resolveEl(mapSel, root);
      }
      if(!el){
        // heuristic: try name/id/data-field
        el = root.querySelector(`[name="${field}"], #${field}, [data-field="${field}"]`);
      }
      if(el){
        if(setFieldError(el, message, {scope: root})) applied++;
      }
    }
    return applied;
  }


  function ensureLoggedIn(){
    if(!getToken()) window.location.href = '/login.html';
  }

  async function detectRole(force=false){
    if(!force){
      const r = getRole();
      if(r) return r;
    }

    const token = getToken();
    const payload = parseJwt(token) || {};
    const roles = Array.isArray(payload.roles) ? payload.roles.map(String) : [];

    // Precedence: ADMIN > STORE_MANAGER > CUSTOMER
    const pick = roles.includes('ADMIN') ? 'ADMIN'
      : roles.includes('STORE_MANAGER') ? 'STORE_MANAGER'
      : roles.includes('CUSTOMER') ? 'CUSTOMER'
      : null;

    if (pick) {
      setRole(pick);
      return pick;
    }

    // Fallback for older tokens (kept for compatibility)
    try{ await api('/api/admin/overview'); setRole('ADMIN'); return 'ADMIN'; }catch(e){}
    try{ await api('/api/manager/products/total-stock'); setRole('STORE_MANAGER'); return 'STORE_MANAGER'; }catch(e){}
    try{ await api('/api/customer/orders?page=0&size=1'); setRole('CUSTOMER'); return 'CUSTOMER'; }catch(e){}
    return null;
  }

  function ensureFooter(){
    // inject CSS if missing
    const hasCss = Array.from(document.styleSheets || []).some(ss => (ss.href || '').includes('/css/nova-footer.css'))
      || !!document.querySelector('link[href="/css/nova-footer.css"]');
    if (!hasCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/nova-footer.css';
      document.head.appendChild(link);
    }

    // If footer already exists, just mark the body and exit.
    const existing = document.getElementById('novaFooter');
    if (existing) {
      document.body.classList.add('nova-has-footer');
      return;
    }

    const footer = document.createElement('footer');
    footer.id = 'novaFooter';
    footer.className = 'nova-footer';
    footer.innerHTML = `
      <div class="inner">
        <div class="center">© ${new Date().getFullYear()} <strong>NOVA</strong> • <a href="mailto:novateam@nova.com">novateam@nova.com</a></div>
      </div>
    `;

    document.body.appendChild(footer);
    document.body.classList.add('nova-has-footer');
  }

  function logout(){ clearToken(); window.location.href = '/login.html'; }

  function applyUserToUI(){
    const name = getName();
    const email = getEmail();
    const role = getRole();

    const targets = ['adminName','managerName','customerName','displayName'];
    targets.forEach(id => {
      const node = document.getElementById(id);
      if (node && name) node.textContent = name;
    });

    const userbox = document.getElementById('userbox');
    if (userbox) {
      const top = name || email || '';
      const bottom = [email && name ? email : null, role].filter(Boolean).join(' • ');
      if (top && bottom) userbox.innerHTML = `<div style="font-weight:700;">${top}</div><div style="opacity:.75;font-size:12px;margin-top:2px;">${bottom}</div>`;
      else if (top) userbox.textContent = top;
      else if (bottom) userbox.textContent = bottom;
    }
  }

  // Cart (Customer)
  const CART_KEY = 'inventory.cart';
  function getCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items||[])); }
  function addToCart(item){
    const cart = getCart();
    const i = cart.findIndex(x=>x.productId===item.productId);
    if(i>=0) cart[i].quantity = Math.min(50, (cart[i].quantity||1) + (item.quantity||1));
    else cart.push({productId:item.productId, name:item.name||'', price:item.price||0, quantity:item.quantity||1});
    saveCart(cart);
    toast('Added to cart', 'ok');
  }
  function updateCartQty(productId, qty){
    const cart = getCart();
    const i = cart.findIndex(x=>x.productId===productId);
    if(i>=0){
      cart[i].quantity = Math.max(1, Math.min(50, qty));
      saveCart(cart);
    }
  }
  function removeFromCart(productId){
    saveCart(getCart().filter(x=>x.productId!==productId));
  }
  function clearCart(){ saveCart([]); }

  
  // Date/Time formatting (handles backend ISO strings with microseconds/nanoseconds)
  function _normalizeIso(str){
    str = String(str || '').trim();
    // Replace space separator with 'T' (e.g., "2025-12-21 19:33:19")
    str = str.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');

    // Trim fractional seconds to milliseconds (JS Date supports up to 3 digits)
    // Examples:
    // 2025-12-21T19:33:19.942194   -> 2025-12-21T19:33:19.942
    // 2025-12-21T19:33:19.942194Z -> 2025-12-21T19:33:19.942Z
    str = str.replace(/(\.\d{3})\d+(?=(Z|[+-]\d{2}:?\d{2})?$)/, '$1');
    return str;
  }

  function parseBackendDate(input){
    if(!input) return null;
    if(input instanceof Date) return input;
    const s = _normalizeIso(input);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDateTime(input, options){
    const d = parseBackendDate(input);
    if(!d) return (input == null || input === '') ? '—' : String(input);
    const opts = Object.assign({
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }, options || {});
    try{
      return new Intl.DateTimeFormat(undefined, opts).format(d);
    }catch(e){
      // Fallback
      return d.toLocaleString();
    }
  }

  function formatDate(input, options){
    const d = parseBackendDate(input);
    if(!d) return (input == null || input === '') ? '—' : String(input);
    const opts = Object.assign({
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }, options || {});
    try{
      return new Intl.DateTimeFormat(undefined, opts).format(d);
    }catch(e){
      return d.toLocaleDateString();
    }
  }

  // ---------------------------------------------------------------------------
  // Password visibility toggles (Front-End only)
  // Adds a small Show/Hide button next to any <input type="password">,
  // including inputs added later (e.g., inside modals).
  // ---------------------------------------------------------------------------
  function _ensurePasswordToggleStyles(){
    if (document.getElementById('pwToggleStyles')) return;
    const style = document.createElement('style');
    style.id = 'pwToggleStyles';
    style.textContent = `
      .pw-toggle-wrap{position:relative;display:inline-block;vertical-align:top;max-width:100%;}
      .pw-toggle-wrap > input{width:100%;padding-right:44px;box-sizing:border-box;}
      .pw-toggle-btn{
        position:absolute;right:12px;top:50%;transform:translateY(-50%);
        width:28px;height:28px;padding:0;margin:0;border:0;background:transparent;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;opacity:.75;color:rgba(234,242,255,.72);
      }
      .pw-toggle-btn:hover{opacity:1;}
      .pw-toggle-btn:focus{outline:2px solid rgba(59,130,246,.55);outline-offset:2px;border-radius:10px;}
      .pw-toggle-btn svg{width:18px;height:18px;display:block;fill:currentColor;}
    
    `;
    document.head.appendChild(style);
  }

  function _applyPasswordToggleToInput(input){
    if (!input || input.nodeType !== 1) return;
    if ((input.getAttribute('type') || '').toLowerCase() !== 'password') return;
    if (input.dataset && input.dataset.pwToggleApplied === '1') return;
    if (input.closest && input.closest('.pw-toggle-wrap')) {
      // If already wrapped, just mark it.
      if (input.dataset) input.dataset.pwToggleApplied = '1';
      return;
    }

    const parent = input.parentNode;
    if (!parent) return;

    const wrap = document.createElement('div');
    wrap.className = 'pw-toggle-wrap';
    // Make wrapper match the input's rendered width so the eye stays *inside* the white field
    try {
      const r = input.getBoundingClientRect();
      if (r && r.width) {
        wrap.style.width = r.width + 'px';
      }
      wrap.style.maxWidth = '100%';
    } catch (_) {}
    parent.insertBefore(wrap, input);
    wrap.appendChild(input);

    
    // Fill the wrapper (wrapper already matches the original input width)
    try { input.style.width = '100%'; } catch (_) {} 
const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pw-toggle-btn';

    const _eyeOpenSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>`;
    const _eyeSlashSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.3 3.7 3.7 2.3 21.7 20.3 20.3 21.7l-2.2-2.2c-1.7.9-3.7 1.5-6.1 1.5-7 0-10-7-10-7 1.2-2.7 3-4.7 5.3-5.9L2.3 3.7zm7.5 7.5A4.9 4.9 0 0 0 12 17c.9 0 1.8-.2 2.6-.6l-4.8-4.8zm2.8-2.8 4.8 4.8c.4-.8.6-1.7.6-2.6a5 5 0 0 0-5-5c-.9 0-1.8.2-2.6.6z"/><path d="M12 5c-1.3 0-2.4.2-3.5.6l1.8 1.8c.5-.2 1.1-.3 1.7-.3a5 5 0 0 1 5 5c0 .6-.1 1.2-.3 1.7l2.2 2.2c1.7-1.2 3-3 3.8-5 0 0-3-7-10-7z"/></svg>`;

    function _setPwIcon(isVisible){
      // When visible, show "eye-slash" (clicking will hide next).
      btn.innerHTML = isVisible ? _eyeSlashSvg : _eyeOpenSvg;
      btn.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
      btn.setAttribute('title', isVisible ? 'Hide' : 'Show');
    }
    _setPwIcon(false);

    btn.addEventListener('click', () => {
      const isHidden = (input.getAttribute('type') || '').toLowerCase() === 'password';
      // If hidden -> make visible (type=text)
      input.setAttribute('type', isHidden ? 'text' : 'password');
      _setPwIcon(isHidden);
      try {
        input.focus();
        const len = (input.value || '').length;
        input.setSelectionRange(len, len);
      } catch (_) {}
    });

    wrap.appendChild(btn);
    if (input.dataset) input.dataset.pwToggleApplied = '1';
  }

  function _enhancePasswordInputs(root){
    const scope = root && root.querySelectorAll ? root : document;
    const inputs = scope.querySelectorAll('input[type="password"]');
    inputs.forEach(_applyPasswordToggleToInput);
  }

  function initPasswordToggles(){
    _ensurePasswordToggleStyles();
    _enhancePasswordInputs(document);

    // Watch for dynamically-inserted password fields (e.g., modal content).
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes || []) {
          if (!node || node.nodeType !== 1) continue;
          if (node.matches && node.matches('input[type="password"]')) {
            _applyPasswordToggleToInput(node);
          }
          _enhancePasswordInputs(node);
        }
      }
    });
    try {
      obs.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

window.addEventListener('DOMContentLoaded', () => {
    ensureFooter();
    applyUserToUI();
    initPasswordToggles();
  });

  window.App = {
    api, toast, ensureLoggedIn, detectRole,
    formatDateTime, formatDate, parseBackendDate,
    getToken, setToken, clearToken,
    getRole, setRole,
    getEmail, setEmail,
    getName, setName,
    parseJwt, applyUserToUI, ensureFooter, logout,
    clearFieldErrors, setFieldError, applyFieldErrors, getFieldErrorsFromPayload,
    getCart, saveCart, addToCart, updateCartQty, removeFromCart, clearCart
  };
})();
