(function(){
  const {api, toast, ensureLoggedIn, detectRole, logout, formatDateTime, getCart, addToCart, updateCartQty, removeFromCart, clearCart, clearFieldErrors, setFieldError, applyFieldErrors, getFieldErrorsFromPayload} = window.App;

  function setActiveNav(){
    const path = window.location.pathname;
    document.querySelectorAll('.nav a').forEach(a=>{
      if(a.getAttribute('href')===path) a.classList.add('active');
    });
  }

  function setupModal(){
    const bd = document.getElementById('modalBackdrop');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const ok = document.getElementById('modalOk');
    const cancel = document.getElementById('modalCancel');
    let onOk = null;

    function open(t, html, okText = 'OK', handler = null, opts = {}) {
      title.textContent = t;
      body.innerHTML = html;
      ok.textContent = okText;
      onOk = handler;
      
      // Hide cancel button for view-only dialogs
      const autoHide = (String(okText).toLowerCase() === 'close');
      const hide = (opts && typeof opts.hideCancel !== 'undefined') ? opts.hideCancel : autoHide;
      if (cancel) {
        cancel.style.display = hide ? 'none' : '';
        // allow overriding the cancel button label (e.g., Close)
        cancel.textContent = (opts && opts.cancelText) ? String(opts.cancelText) : 'Cancel';
      }
      bd.style.display = 'flex';
    }
    function close(){ bd.style.display='none'; onOk=null; }
    cancel?.addEventListener('click', close);
    bd?.addEventListener('click', (e)=>{ if(e.target===bd) close(); });
    ok?.addEventListener('click', async ()=>{
      if(!onOk) return close();
      try{
        ok.disabled = true;
        const result = await onOk();
        if (result === false || (result && result.close === false)) return;
        close();
      }catch(err){
        const fe = getFieldErrorsFromPayload && getFieldErrorsFromPayload(err && err.data);
        if(fe){
          applyFieldErrors(body, fe);
          toast('Please fix the highlighted fields.', 'danger');
          return;
        }
        toast(err.message || 'Error', 'danger');
      }finally{
        ok.disabled = false;
      }
    });
    return {open, close};
  }

  function money(n){
    const x = Number(n||0);
    return x.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
  }

  // caches for fuzzy search
  let custCategoriesCache = null;
  let custBaseKey = null;
  let custBaseProducts = [];

  async function loadProducts(page=0){
    const grid = document.getElementById('custProductsGrid');
    if(!grid) return;

    const notFoundEl = document.getElementById('custNotFoundMsg');
    const pager = document.getElementById('custProductsPager');

    const productNameRaw = document.getElementById('fProductName')?.value?.trim() || '';
    const categoryRaw = document.getElementById('fCategory')?.value?.trim() || '';
    const minRaw = document.getElementById('fMin')?.value?.trim() || '';
    const maxRaw = document.getElementById('fMax')?.value?.trim() || '';

    const _scope = document.getElementById('customerProducts') || document;
    // Clear any old inline errors around the filter area
    clearFieldErrors(_scope);

    const min = minRaw !== '' ? Number(minRaw) : null;
    const max = maxRaw !== '' ? Number(maxRaw) : null;
    if(min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max){
      const minEl = document.getElementById('fMin');
      const maxEl = document.getElementById('fMax');
      setFieldError(minEl, 'Min price must be less than or equal to Max price.', {scope:_scope});
      setFieldError(maxEl, 'Max price must be greater than or equal to Min price.', {scope:_scope});
      toast('Please fix the highlighted price filter fields.', 'danger');
      return;
    }


    function showNotFound(show){
      if(notFoundEl) notFoundEl.style.display = show ? 'block' : 'none';
    }

    function norm(s){
      return String(s ?? '').toLowerCase().trim().replace(/\s+/g,' ');
    }

    function levenshtein(a,b){
      a = norm(a); b = norm(b);
      const m = a.length, n = b.length;
      if(m===0) return n;
      if(n===0) return m;
      const dp = Array.from({length:m+1}, ()=>new Array(n+1).fill(0));
      for(let i=0;i<=m;i++) dp[i][0]=i;
      for(let j=0;j<=n;j++) dp[0][j]=j;
      for(let i=1;i<=m;i++){
        for(let j=1;j<=n;j++){
          const cost = a[i-1]===b[j-1] ? 0 : 1;
          dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost);
        }
      }
      return dp[m][n];
    }

    function fuzzyTokenMatch(text, query){
      const t = norm(text);
      const q = norm(query);
      if(!q) return true;
      const tokens = q.split(' ').filter(Boolean);
      const words = t.split(' ').filter(Boolean);
      return tokens.every(tok=>{
        if(t.includes(tok)) return true;
        const thr = tok.length <= 4 ? 1 : (tok.length <= 7 ? 2 : 3);
        for(const w of words){
          if(levenshtein(tok, w) <= thr) return true;
        }
        if(t.length <= 20 && levenshtein(tok, t) <= thr) return true;
        return false;
      });
    }

    async function ensureCategories(){
      if(custCategoriesCache) return custCategoriesCache;
      try{ custCategoriesCache = await api('/api/categories'); }
      catch(e){ custCategoriesCache = []; }
      return custCategoriesCache;
    }

    function bestCategoryName(input){
      const q = norm(input);
      if(!q) return null;
      if(!custCategoriesCache || custCategoriesCache.length===0) return input;

      for(const c of custCategoriesCache){
        const n = norm(c.name);
        if(n === q) return c.name;
        if(n.includes(q)) return c.name;
      }

      let best = null;
      let bestScore = Infinity;
      for(const c of custCategoriesCache){
        const n = norm(c.name);
        let score = levenshtein(q, n);
        for(const w of n.split(' ')) score = Math.min(score, levenshtein(q, w));
        if(score < bestScore){ bestScore = score; best = c.name; }
      }
      const thr = q.length <= 4 ? 1 : (q.length <= 7 ? 2 : 3);
      return (best && bestScore <= thr) ? best : null;
    }

    function pagerLocalHtml(cur,total){
      return ` <div style="display:flex; gap:10px; align-items:center"> <button class="btn ghost" data-prev ${cur===0?'disabled':''}>Prev</button> <div style="font-weight:900">Page ${cur+1} / ${total}</div> <button class="btn ghost" data-next ${cur===total-1?'disabled':''}>Next</button> </div> `;
    }

    const minPrice = minRaw ? Number(minRaw) : null;
    const maxPrice = maxRaw ? Number(maxRaw) : null;

    showNotFound(false);

    grid.innerHTML = '<div class="card" style="grid-column: span 12">Loading...</div>';
    if(pager) pager.innerHTML = '';

    try{
      await ensureCategories();

      let catParam = null;
      if(categoryRaw){
        catParam = bestCategoryName(categoryRaw);
        if(!catParam){
          custBaseKey = null;
          custBaseProducts = [];
          showNotFound(true);
          grid.innerHTML = '<div class="card" style="grid-column: span 12">No products found.</div>';
          return;
        }
      }

      const key = JSON.stringify({catParam, minPrice, maxPrice});
      if(key !== custBaseKey){
        custBaseKey = key;
        custBaseProducts = [];

        const params = new URLSearchParams();
        params.set('size','200');
        params.set('sort','price');
        if(catParam) params.set('categoryName', catParam);
        if(minPrice !== null && !Number.isNaN(minPrice)) params.set('minPrice', String(minPrice));
        if(maxPrice !== null && !Number.isNaN(maxPrice)) params.set('maxPrice', String(maxPrice));

        let p = 0;
        while(true){
          params.set('page', String(p));
          const pageData = await api('/api/products?'+params.toString());
          custBaseProducts = custBaseProducts.concat(pageData.content || []);
          const totalPages = pageData.totalPages ?? 1;
          if(pageData.last || p >= totalPages - 1) break;
          p += 1;
          if(p > 30) break;
        }
      }

      let filtered = custBaseProducts;
      if(productNameRaw){
        filtered = custBaseProducts.filter(p=>fuzzyTokenMatch(p.name || '', productNameRaw));
      }

      const pageSize = 12;
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const cur = Math.min(Math.max(0, page), totalPages - 1);
      const slice = filtered.slice(cur*pageSize, cur*pageSize + pageSize);

      if(filtered.length === 0){
        showNotFound(!!(productNameRaw||categoryRaw));
        grid.innerHTML = '<div class="card" style="grid-column: span 12">No products found.</div>';
        if(pager) pager.innerHTML = '';
        return;
      }

      grid.innerHTML = slice.map(p=>{
        const badge = p.stockStatus === 'OUT_OF_STOCK' ? 'danger' : (p.stockStatus === 'LOW_STOCK' ? 'warn' : 'ok');
        return ` <div class="card" style="grid-column: span 3"> <div class="k">${escapeHtml(p.name||'')}</div> <div class="m">$${money(p.price)}</div> <div style="margin-top:10px"> <span class="badge ${badge}">${p.stockStatus}</span> </div> <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap"> <button class="btn ghost" data-view="${p.id}">Details</button> <button class="btn" data-add="${p.id}" data-name="${escapeAttr(p.name||'')}" data-price="${p.price||0}" data-stock="${escapeHtml(p.stockStatus||'')}">Add</button> </div> </div> `;
      }).join('');

      grid.querySelectorAll('[data-add]').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const stock = (btn.getAttribute('data-stock')||'').toUpperCase();
          if(stock === 'OUT_OF_STOCK'){
            toast('Out of stock.', 'danger');
            return;
          }
          const id = Number(btn.getAttribute('data-add'));
          const name = btn.getAttribute('data-name') || '';
          const price = Number(btn.getAttribute('data-price')||0);
          addToCart({productId:id, name, price, quantity:1});
        });
      });

const modal = setupModal();
      grid.querySelectorAll('[data-view]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const id = Number(btn.getAttribute('data-view'));
          try{
            const p = await api('/api/products/'+id);
                        const badge = (String(p.stockStatus||'').toUpperCase() === 'IN_STOCK') ? 'ok'
              : ((String(p.stockStatus||'').toUpperCase() === 'LOW_STOCK') ? 'warn' : 'danger');

            modal.open('Product Details', `
              <div class="row one">
                <div><b>ID:</b> #${escapeHtml(p.id)}</div>
                <div><b>Name:</b> ${escapeHtml(p.name || '')}</div>
                <div><b>Price:</b> $${escapeHtml(Number(p.price || 0).toFixed(2))}</div>
                <div><b>Stock status:</b> <span class="badge ${badge}">${escapeHtml(p.stockStatus || '')}</span></div>
                <div><b>Description</b><div>${escapeHtml(p.description || '—')}</div></div>
              </div>
            `, 'Add', async ()=>{
              const status = String(p.stockStatus || '').toUpperCase();
              if(status === 'OUT_OF_STOCK'){
                throw new Error('Out of stock.');
              }
              addToCart({ productId: Number(p.id), name: p.name || '', price: Number(p.price || 0), quantity: 1 });
              toast('Added to cart.', 'ok');
            }, { hideCancel: false, cancelText: 'Close' });
}catch(err){ toast(err.message,'danger'); }
        });
      });

      if(pager){
        pager.innerHTML = pagerLocalHtml(cur, totalPages);
        pager.querySelector('[data-prev]')?.addEventListener('click', ()=>loadProducts(Math.max(0, cur-1)));
        pager.querySelector('[data-next]')?.addEventListener('click', ()=>loadProducts(Math.min(totalPages-1, cur+1)));
      }

    }catch(err){
      showNotFound(false);
      grid.innerHTML = `<div class="card" style="grid-column: span 12">${escapeHtml(err.message||'Error')}</div>`;
      if(pager) pager.innerHTML = '';
    }
  }

  function escapeHtml(s){
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  }
  function escapeAttr(s){
    return String(s).replaceAll('"','&quot;').replaceAll("'","&#39;");
  }
  function pagerHtml(p){
    return ` <div style="display:flex; gap:10px; align-items:center"> <button class="btn ghost" data-prev ${p.first?'disabled':''}>Prev</button> <div style="font-weight:900">Page ${p.number+1} / ${p.totalPages}</div> <button class="btn ghost" data-next ${p.last?'disabled':''}>Next</button> </div> `;
  }

  function renderCart(){
    const host = document.getElementById('cartTable');
    if(!host) return;
    const items = getCart();
    const total = items.reduce((a,x)=> a + (Number(x.price||0) * Number(x.quantity||1)), 0);
    document.getElementById('cartTotal').textContent = '$'+money(total);

    if(items.length===0){
      host.innerHTML = '<div class="card">Cart is empty.</div>';
      return;
    }

    host.innerHTML = ` <div class="table-wrap"> <table> <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead> <tbody> ${items.map(i=>` <tr> <td>${escapeHtml(i.name||('Product #'+i.productId))}</td> <td>$${money((() => { const q = Number(i.quantity) || 0; const unit = Number((i.unitPrice ?? i.price ?? (i.subTotal && q ? (i.subTotal / q) : 0)) || 0); return unit * q; })())}</td> <td><input type="number" min="1" max="50" value="${i.quantity}" style="width:90px" data-qty="${i.productId}"></td> <td>$${money(Number(i.price||0)*Number(i.quantity||1))}</td> <td><button class="btn danger" data-del="${i.productId}">Remove</button></td> </tr> `).join('')} </tbody> </table> </div> `;

    host.querySelectorAll('[data-qty]').forEach(inp=>{
      inp.addEventListener('change', ()=>{
        const id = Number(inp.getAttribute('data-qty'));
        updateCartQty(id, Number(inp.value||1));
        renderCart();
      });
    });
    host.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        removeFromCart(Number(btn.getAttribute('data-del')));
        renderCart();
      });
    });
  }

  async function placeOrder(){
    const items = getCart();
    if(items.length===0){ toast('Cart is empty','warn'); return; }
    const payload = { items: items.map(i=>({productId: i.productId, quantity: i.quantity})) };
    try{
      await api('/api/orders', {method:'POST', body: JSON.stringify(payload)});
      clearCart();
      toast('Order placed','ok');
      window.location.href = '/customer/orders.html';
    }catch(err){ toast(err.message || 'Failed to place order','danger'); }
  }

  async function loadOrders(page=0){
    const host = document.getElementById('ordersTable');
    if(!host) return;
    host.innerHTML = '<div class="card">Loading...</div>';
    try{
      const pageData = await api(`/api/customer/orders?page=${page}&size=10&sort=id,desc`);
      const raw = pageData.content || [];
      // Hide cancelled orders from customer list (manager still sees them as CANCELLED)
      const items = raw.filter(o => !['CANCELLED','CANCELED'].includes(String(o?.status||'').toUpperCase()));
      if(items.length===0){
        // If this page only has cancelled orders, try previous page
        if(pageData.number > 0){ await loadOrders(pageData.number-1); return; }
        host.innerHTML = '<div class="card">No active orders.</div>';
        return;
      }
      host.innerHTML = ` <div class="table-wrap"><table> <thead><tr><th>ID</th><th>Status</th><th>Total</th><th>Created</th><th>Items</th><th></th></tr></thead> <tbody> ${items.map(o=>` <tr> <td>${o.id}</td> <td>${escapeHtml(o.status)}</td> <td>$${money(o.totalPrice)}</td> <td>${escapeHtml(formatDateTime(o.createdAt))}</td> <td>${(o.items||[]).length}</td> <td style="display:flex; gap:8px; flex-wrap:wrap"> <button class="btn ghost" data-view="${o.id}">View</button> <button class="btn danger" data-cancel="${o.id}">Cancel</button> </td> </tr> `).join('')} </tbody> </table></div> <div style="margin-top:12px" id="ordersPager">${pagerHtml(pageData)}</div> `;
      const modal = setupModal();
      host.querySelectorAll('[data-view]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const id = Number(btn.getAttribute('data-view'));
          try{
            const o = await api('/api/orders/'+id);
            modal.open('Order #'+id, ` <div class="row one"> <div><b>Status:</b> ${escapeHtml(o.status)}</div> <div><b>Total:</b> $${money(o.totalPrice)}</div> <div><b>Created:</b> ${escapeHtml(formatDateTime(o.createdAt))}</div> <div style="margin-top:10px"><b>Items</b></div> <div class="table-wrap"><table> <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead> <tbody> ${(o.items||[]).map(i=>`<tr><td>${escapeHtml(i.productName||'')}</td><td>${i.quantity}</td><td>$${money((() => { const q = Number(i.quantity) || 0; const unit = Number((i.unitPrice ?? i.price ?? (i.subTotal && q ? (i.subTotal / q) : 0)) || 0); return unit * q; })())}</td></tr>`).join('')} </tbody> </table></div> </div> `, 'Close', null);
          }catch(err){ toast(err.message,'danger'); }
        });
      });
      host.querySelectorAll('[data-cancel]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const id = Number(btn.getAttribute('data-cancel'));
          try{
            await api('/api/orders/'+id, {method:'DELETE'});
            toast('Order cancelled','ok');
            loadOrders(pageData.number);
          }catch(err){ toast(err.message,'danger'); }
        });
      });
      document.querySelector('#ordersPager [data-prev]')?.addEventListener('click', ()=>loadOrders(Math.max(0, pageData.number-1)));
      document.querySelector('#ordersPager [data-next]')?.addEventListener('click', ()=>loadOrders(Math.min(pageData.totalPages-1, pageData.number+1)));
    }catch(err){ host.innerHTML = `<div class="card">${escapeHtml(err.message||'Error')}</div>`; }
  }

  async function init(){
    ensureLoggedIn();
    const role = await detectRole();
    if(role!=='CUSTOMER') window.location.href = '/index.html';
    setActiveNav();
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    const path = window.location.pathname;
    if(path.endsWith('/customer/products.html')){
      const deb = (fn, ms)=>{ let t=null; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); }; };
      const run = deb(()=>loadProducts(0), 220);

      document.getElementById('custSearchBtn')?.addEventListener('click', ()=>{ custBaseKey = null; loadProducts(0); });
      document.getElementById('custClearBtn')?.addEventListener('click', ()=>{
        ['fProductName','fCategory','fMin','fMax'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
        custBaseKey = null;
        loadProducts(0);
      });

      ['fProductName','fCategory','fMin','fMax'].forEach(id=>{
        document.getElementById(id)?.addEventListener('input', run);
      });

      loadProducts(0);
    }
    if(path.endsWith('/customer/cart.html')){
      renderCart();
      document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder);
      document.getElementById('clearCartBtn')?.addEventListener('click', ()=>{ clearCart(); renderCart(); toast('Cart cleared','ok'); });
    }
    if(path.endsWith('/customer/orders.html')){
      loadOrders(0);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
