(function(){
  const {api, toast, ensureLoggedIn, detectRole, logout, clearFieldErrors, setFieldError, applyFieldErrors, getFieldErrorsFromPayload} = window.App;

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

    function open(t, html, okText='Save', handler=null, opts={}){
      title.textContent = t;
      body.innerHTML = html;
      ok.textContent = okText;
      onOk = handler;
      // Reset/hide cancel depending on use-case
      if(cancel){
        const autoHide = (String(okText).toLowerCase() === 'close');
        const hide = (opts && typeof opts.hideCancel !== 'undefined') ? opts.hideCancel : autoHide;
        cancel.style.display = hide ? 'none' : '';
      
        cancel.textContent = (opts && opts.cancelText) ? String(opts.cancelText) : 'Cancel';
        }
      bd.style.display = 'flex';
    }
    function close(){
      bd.style.display='none';
      onOk=null;
      // restore cancel for next opens
      if(cancel) cancel.style.display = '';
    }
    cancel?.addEventListener('click', close);
    bd?.addEventListener('click', (e)=>{ if(e.target===bd) close(); });
    ok?.addEventListener('click', async ()=>{
      if(!onOk) return close();
      try{
        ok.disabled = true;
        // If handler returns false (or {close:false}), keep modal open.
        const result = await onOk();
        if (result === false || (result && result.close === false)) return;
        close();
      }catch(e){
        // Keep setupModal generic. Callers should handle 404 or other domain-specific
        // conditions themselves.
        if(e && e.status === 404){
          toast('Not found.', 'danger');
          return;
        }

        // If backend returned field-level validation errors (Spring map), show them inline.
        const fe = getFieldErrorsFromPayload && getFieldErrorsFromPayload(e && e.data);
        if(fe){
          applyFieldErrors(body, fe);
          toast('Please fix the highlighted fields.', 'danger');
          return;
        }

        toast(e.message || 'Error', 'danger');
      }finally{
        ok.disabled = false;
      }
    });

    return {open, close};
  }

  function money(x){
    if(x===null || x===undefined) return '—';
    return new Intl.NumberFormat(undefined, {style:'currency', currency:'USD'}).format(Number(x));
  }

  function fmtDate(s){
    return window.App.formatDateTime(s);
  }


  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  }

  let _managerUsersMap = null;
  async function getManagerUsersMap(){
    if(_managerUsersMap) return _managerUsersMap;
    const map = new Map();
    let page = 0;
    const size = 200;
    while(true){
      const res = await api(`/api/manager/users?page=${page}&size=${size}`);
      const rows = res.content || [];
      rows.forEach(u => map.set(u.id, u.fullName));
      if(res.last || rows.length < size) break;
      page++;
      if(page > 50) break;
    }
    _managerUsersMap = map;
    return map;
  }

  async function initDashboard(){
    const modal = setupModal();

    const totalStockEl = document.getElementById('totalStock');
    const lowCountEl = document.getElementById('lowCount');
    const pendingCountEl = document.getElementById('pendingCount');
    const recentCountEl = document.getElementById('recentCount');

    const btn = document.getElementById('refreshMgr');
    const cards = Array.from(document.querySelectorAll('.dash-card'));

    const titleEl = document.getElementById('dashDetailTitle');
    const subEl = document.getElementById('dashDetailSub');
    const actionsEl = document.getElementById('dashDetailActions');
    const bodyEl = document.getElementById('dashDetailBody');

    let currentView = null;

    function setActive(view){
      cards.forEach(c=>c.classList.toggle('active', c.dataset.view === view));
    }

    function renderTable(headCells, bodyRowsHtml){
      return ` <div class="table-wrap"> <table> <thead><tr>${headCells.map(h=>`<th>${h}</th>`).join('')}</tr></thead> <tbody>${bodyRowsHtml}</tbody> </table> </div> `;
    }

    function renderEmpty(msg){
      return `<div class="empty">${esc(msg)}</div>`;
    }

    async function loadCounts(){
      try{
        const total = await api('/api/manager/products/total-stock');
        totalStockEl.textContent = total;
      }catch(e){ totalStockEl.textContent = '—'; }

      try{
        const low = await api('/api/manager/products/low-stock');
        lowCountEl.textContent = (low || []).length;
      }catch(e){ lowCountEl.textContent = '—'; }

      try{
        const page = await api('/api/purchase-orders/manager/pending?page=0&size=1');
        pendingCountEl.textContent = page?.totalElements ?? '—';
      }catch(e){ pendingCountEl.textContent = '—'; }

      try{
        const recent = await api('/api/manager/orders/recent');
        recentCountEl.textContent = (recent || []).length;
      }catch(e){ recentCountEl.textContent = '—'; }
    }

    async function showStock(){
      titleEl.textContent = 'Products (quick view)';
      subEl.textContent = 'Quick overview of products. Use the Products page to manage items.';
      actionsEl.innerHTML = `<a class="btn ghost" href="/manager/products.html">Open Products</a>`;

      let rows = [];
      try{
        const res = await api('/api/products?page=0&size=30&sort=price');
        rows = res?.content || [];
      }catch(e){
        if(e && e.status === 404) rows = [];
        else throw e;
      }

      if(rows.length === 0){
        bodyEl.innerHTML = renderEmpty('No products found.');
        bodyEl._dashProductsList = [];
        return;
      }

      bodyEl._dashProductsList = rows;
      bodyEl.innerHTML = renderTable(
        ['ID','Name','Price','Stock status','Actions'],
        rows.map(p=>{
          const s = String(p.stockStatus || '').toUpperCase();
          const badge = (s === 'IN_STOCK') ? 'ok' : (s === 'LOW_STOCK' ? 'warn' : 'danger');
          return `<tr>
            <td>#${p.id}</td>
            <td>${esc(p.name||'')}</td>
            <td>${money(p.price)}</td>
            <td><span class="badge ${badge}">${esc(p.stockStatus||'—')}</span></td>
            <td><button class="btn ghost" data-action="prod" data-id="${p.id}">View</button></td>
          </tr>`;
        }).join('')
      );
    }

    async function showLowStock(){
      titleEl.textContent = 'Low stock products';
      subEl.textContent = 'Items that are below or near the minimum stock.';
      actionsEl.innerHTML = `<a class="btn ghost" href="/manager/low-stock.html">Open Low Stock</a>`;

      let rows = [];
      try{
        rows = await api('/api/manager/products/low-stock');
      }catch(e){
        if(e && e.status === 404) rows = [];
        else throw e;
      }

      if(!rows || rows.length === 0){
        bodyEl.innerHTML = renderEmpty('No low stock items.');
        bodyEl._dashLowList = [];
        return;
      }

      bodyEl._dashLowList = rows;
      bodyEl.innerHTML = renderTable(
        ['ID','Name','Supplier','Stock','Min','Reorder','Actions'],
        rows.map(p=>`<tr>
          <td>#${p.id}</td>
          <td>${esc(p.name||'')}</td>
          <td>${esc(p.supplierName||'—')}</td>
          <td>${p.stock ?? '—'}</td>
          <td>${p.minStock ?? '—'}</td>
          <td>${p.reOrderQuantity ?? '—'}</td>
          <td><button class="btn ghost" data-action="low" data-id="${p.id}">View</button></td>
        </tr>`).join('')
      );
    }

    async function showPOList(){
      titleEl.textContent = 'Pending purchase orders';
      subEl.textContent = 'Recent pending purchase orders (quick view).';
      actionsEl.innerHTML = `<a class="btn ghost" href="/manager/purchase-orders.html">Open Purchase Orders</a>`;

      let rows = [];
      try{
        const res = await api('/api/purchase-orders/manager/pending?page=0&size=10');
        rows = res?.content || [];
      }catch(e){
        if(e && e.status === 404) rows = [];
        else throw e;
      }

      if(rows.length === 0){
        bodyEl.innerHTML = renderEmpty('No pending purchase orders.');
        bodyEl._dashPOList = [];
        return;
      }

      bodyEl._dashPOList = rows;
      bodyEl.innerHTML = renderTable(
        ['ID','Supplier','Status','Created','Actions'],
        rows.map(po=>{
          const status = String(po.status || '—');
          const canReceive = String(status).toUpperCase() === 'PENDING';
          return `<tr>
            <td>#${po.id}</td>
            <td>${esc(po.supplier?.name || '—')}</td>
            <td><span class="badge ${canReceive ? 'warn' : 'ok'}">${esc(status)}</span></td>
            <td>${fmtDate(po.createdAt)}</td>
            <td>
              <button class="btn ghost" data-action="po-view" data-id="${po.id}">Details</button>
              ${canReceive ? `<button class="btn" data-action="po-receive" data-id="${po.id}">Receive</button>` : ''}
            </td>
          </tr>`;
        }).join('')
      );
    }

    async function showOrdersList(){
      titleEl.textContent = 'Recent orders';
      subEl.textContent = 'Latest orders placed by customers (quick view).';
      actionsEl.innerHTML = `<a class="btn ghost" href="/manager/recent-orders.html">Open Recent Orders</a>`;

      let rows = [];
      try{
        rows = await api('/api/manager/orders/recent');
      }catch(e){
        if(e && e.status === 404) rows = [];
        else throw e;
      }

      rows = (rows || []).slice(0, 10);

      if(rows.length === 0){
        bodyEl.innerHTML = renderEmpty('No recent orders.');
        bodyEl._dashOrdersList = [];
        return;
      }

      bodyEl._dashOrdersList = rows;
      bodyEl.innerHTML = renderTable(
        ['ID','Customer','Total','Status','Created','Actions'],
        rows.map(o=>{
          const status = String(o.status || '—');
          const badge = String(status).toUpperCase() === 'CANCELLED' ? 'danger' : 'ok';
          return `<tr>
            <td>#${o.id}</td>
            <td>${o.userId ? ('#' + o.userId) : '—'}</td>
            <td>${money(o.totalPrice)}</td>
            <td><span class="badge ${badge}">${esc(status)}</span></td>
            <td>${fmtDate(o.createdAt)}</td>
            <td>
              <button class="btn ghost" data-action="ord-view" data-id="${o.id}">Details</button>
              <button class="btn danger" data-action="ord-cancel" data-id="${o.id}">Cancel</button>
            </td>
          </tr>`;
        }).join('')
      );
    }

    async function showPODetails(id){
      const po = await api('/api/purchase-orders/' + id);
      const items = po.items || [];
      modal.open(
        'Purchase Order #' + po.id,
        ` <div class="row one">
            <div><b>Supplier:</b> ${esc(po.supplier?.name || '—')}</div>
            <div><b>Status:</b> ${esc(po.status || '—')}</div>
            <div><b>Created:</b> ${fmtDate(po.createdAt)}</div>
          </div>
          <div class="table-wrap" style="margin-top:12px">
            <table>
              <thead><tr><th>Product</th><th>Qty</th></tr></thead>
              <tbody>
                ${items.map(it=>`<tr><td>${esc(it.product?.name || '')}</td><td>${it.quantity ?? '—'}</td></tr>`).join('')}
              </tbody>
            </table>
          </div> `,
        'Close',
        null,
        {hideCancel:true}
      );
    }

    async function showOrderDetails(id){
      const o = await api('/api/manager/orders/' + id);
      modal.open(
        'Order #' + o.id,
        ` <div class="row one">
            <div><b>Customer ID:</b> ${o.userId ? ('#' + o.userId) : '—'}</div>
            <div><b>Status:</b> ${esc(o.status || '—')}</div>
            <div><b>Total:</b> ${money(o.totalPrice)}</div>
            <div><b>Created:</b> ${fmtDate(o.createdAt)}</div>
            <div><b>Payment Ref:</b> ${o.paymentReference ?? '—'}</div>
          </div>
          <div class="table-wrap" style="margin-top:12px">
            <table>
              <thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${(o.items || []).map(it=>`<tr>
                  <td>${esc(it.productName || '')}</td>
                  <td>${money(it.unitPrice)}</td>
                  <td>${it.quantity ?? '—'}</td>
                  <td>${money(it.subTotal)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div> `,
        'Close',
        null,
        {hideCancel:true}
      );
    }

    async function show(view){
      currentView = view;
      setActive(view);
      bodyEl.innerHTML = renderEmpty('Loading…');
      try{
        if(view === 'stock') await showStock();
        else if(view === 'low') await showLowStock();
        else if(view === 'po') await showPOList();
        else if(view === 'orders') await showOrdersList();
      }catch(e){
        bodyEl.innerHTML = renderEmpty(e.message || 'Error');
        throw e;
      }
    }

    bodyEl?.addEventListener('click', async (e)=>{
      const b = e.target.closest('button[data-action]');
      if(!b) return;

      const action = b.getAttribute('data-action');
      const id = b.getAttribute('data-id');

      try{
        if(action === 'prod'){
          const list = bodyEl._dashProductsList || [];
          const p = list.find(x=>String(x.id) === String(id));
          if(!p) return toast('Not found.', 'danger');
          const s = String(p.stockStatus || '').toUpperCase();
          const badge = (s === 'IN_STOCK') ? 'ok' : (s === 'LOW_STOCK' ? 'warn' : 'danger');
          modal.open(
            'Product Details',
            ` <div class="row one">
                <div><b>ID:</b> #${p.id}</div>
                <div><b>${esc(p.name || '')}</b></div>
                <div>Price: ${money(p.price)}</div>
                <div>Stock Status: <span class="badge ${badge}">${esc(p.stockStatus || '—')}</span></div>
                <div>Product Status: <b>${esc(p.status || '—')}</b></div>
                <div><b>Description</b><div>${esc(p.description || '—')}</div></div>
              </div> `,
            'Close',
            null,
            {hideCancel:true}
          );
          return;
        }

        if(action === 'low'){
          const list = bodyEl._dashLowList || [];
          const p = list.find(x=>String(x.id) === String(id));
          if(!p) return toast('Not found.', 'danger');
          modal.open(
            'Low Stock Product',
            ` <div class="row one">
                <div><b>${esc(p.name || '')}</b></div>
                <div>Supplier: ${esc(p.supplierName || '—')}</div>
                <div>Stock: ${p.stock ?? '—'} / Min: ${p.minStock ?? '—'}</div>
                <div>Reorder Qty: ${p.reOrderQuantity ?? '—'}</div>
              </div> `,
            'Close',
            null,
            {hideCancel:true}
          );
          return;
        }

        if(action === 'po-view'){
          await showPODetails(id);
          return;
        }

        if(action === 'po-receive'){
          await api('/api/purchase-orders/' + id + '/receive', {method:'POST'});
          toast('Purchase order received', 'ok');
          await loadCounts();
          await show('po');
          return;
        }

        if(action === 'ord-view'){
          await showOrderDetails(id);
          return;
        }

        if(action === 'ord-cancel'){
          const list = bodyEl._dashOrdersList || [];
          const known = list.find(o => String(o.id) === String(id));
          const rowStatus = (b.closest('tr')?.querySelector('.badge')?.textContent || '').trim();
          const status = (known?.status || rowStatus || '').toUpperCase();
          if(status === 'CANCELLED'){
            toast('Order is already cancelled.', 'danger');
            return;
          }
          await api('/api/orders/' + id, {method:'DELETE'});
          toast('Order cancelled', 'ok');
          await loadCounts();
          await show('orders');
        }
      }catch(err){
        toast(err.message || 'Error', 'danger');
      }
    });

    btn?.addEventListener('click', async ()=>{
      btn.disabled = true;
      try{
        await loadCounts();
        if(currentView) await show(currentView);
        toast('Refreshed', 'ok');
      }finally{
        btn.disabled = false;
      }
    });

    cards.forEach(c=>{
      c.addEventListener('click', ()=>show(c.dataset.view));
    });

    await loadCounts();
    await show('stock');
  }

async function initProducts(){
    const modal = setupModal();
    const listEl = document.getElementById('productsTable');
    const pager = document.getElementById('productsPager');
    const notFoundEl = document.getElementById('notFoundMsg');

    const qName = document.getElementById('qName');
    const qCat = document.getElementById('qCat');
    const qMin = document.getElementById('qMin');
    const qMax = document.getElementById('qMax');

    let page = 0;
    let size = 10;

    let categoriesCache = null; // [{id,name,...}]
    let baseKey = null;        // cache key for category/min/max
    let baseList = [];         // products from backend after category/min/max filtering
    let filteredList = [];     // after fuzzy productName filtering

    function showNotFound(show){
      if(!notFoundEl) return;
      notFoundEl.style.display = show ? 'block' : 'none';
    }

    function escapeHtml(s){
      return String(s ?? '').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
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
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,
            dp[i][j-1] + 1,
            dp[i-1][j-1] + cost
          );
        }
      }
      return dp[m][n];
    }

    function fuzzyTokenMatch(text, query){
      const t = norm(text);
      const q = norm(query);
      if(!q) return true;
      const tokens = q.split(' ').filter(Boolean);
      if(tokens.length===0) return true;

      const words = t.split(' ').filter(Boolean);

      return tokens.every(tok=>{
        if(t.includes(tok)) return true;
        // tolerate small typos
        const thr = tok.length <= 4 ? 1 : (tok.length <= 7 ? 2 : 3);
        // compare against each word in the text
        for(const w of words){
          if(levenshtein(tok, w) <= thr) return true;
        }
        // fallback: compare against full text for short queries
        if(t.length <= 20 && levenshtein(tok, t) <= thr) return true;
        return false;
      });
    }

    async function ensureCategories(){
      if(categoriesCache) return categoriesCache;
      try{ categoriesCache = await api('/api/categories'); }
      catch(e){ categoriesCache = []; }
      return categoriesCache;
    }

    function bestCategoryName(input){
      const q = norm(input);
      if(!q) return null;
      if(!categoriesCache || categoriesCache.length===0) return input; // fallback

      // exact / substring first
      for(const c of categoriesCache){
        const n = norm(c.name);
        if(n === q) return c.name;
        if(n.includes(q)) return c.name;
      }

      // fuzzy best score
      let best = null;
      let bestScore = Infinity;
      for(const c of categoriesCache){
        const n = norm(c.name);
        const scoreFull = levenshtein(q, n);
        let score = scoreFull;
        for(const w of n.split(' ')) score = Math.min(score, levenshtein(q, w));
        if(score < bestScore){
          bestScore = score;
          best = c.name;
        }
      }
      const thr = q.length <= 4 ? 1 : (q.length <= 7 ? 2 : 3);
      return (best && bestScore <= thr) ? best : null;
    }

    async function fetchBaseList(force=false){
      await ensureCategories();

      const min = qMin.value !== '' ? Number(qMin.value) : null;
      const max = qMax.value !== '' ? Number(qMax.value) : null;

      const _scope = qMin.closest('section') || document;
      clearFieldErrors(_scope);
      if(min !== null && max !== null && !Number.isNaN(min) && !Number.isNaN(max) && min > max){
        setFieldError(qMin, 'Min price must be less than or equal to Max price.', {scope:_scope});
        setFieldError(qMax, 'Max price must be greater than or equal to Min price.', {scope:_scope});
        toast('Please fix the highlighted price filter fields.', 'danger');
        return;
      }


      const catInput = (qCat.value || '').trim();
      let catParam = null;
      if(catInput){
        catParam = bestCategoryName(catInput);
        if(!catParam){
          baseKey = null;
          baseList = [];
          filteredList = [];
          render();
          showNotFound(true);
          return;
        }
      }

      const key = JSON.stringify({catParam, min, max});
      if(!force && key === baseKey) return;
      baseKey = key;

      const params = new URLSearchParams();
      params.set('size','200');
      params.set('sort','price');
      if(catParam) params.set('categoryName', catParam);
      if(min !== null && !Number.isNaN(min)) params.set('minPrice', String(min));
      if(max !== null && !Number.isNaN(max)) params.set('maxPrice', String(max));

      baseList = [];
      let p = 0;
      while(true){
        params.set('page', String(p));
        let res;
        try{
          res = await api('/api/products?' + params.toString());
        }catch(e){
          // Backend may return 404 when no results match filters.
          if(e && e.status === 404){
            baseList = [];
            filteredList = [];
            page = 0;
            render();
            showNotFound(true);
            return;
          }
          throw e;
        }
        const rows = res.content || [];
        baseList = baseList.concat(rows);
        const totalPages = res.totalPages ?? 1;
        if(res.last || p >= totalPages - 1) break;
        p += 1;
        // safety
        if(p > 30) break;
      }
    }

    function applyNameFilter(){
      const nameQ = (qName.value || '').trim();
      if(!nameQ){
        filteredList = baseList.slice();
      }else{
        filteredList = baseList.filter(p=>fuzzyTokenMatch(p.name || '', nameQ));
      }
      page = 0;
    }

    function arrayPagerHtml(totalPages){
      const prev = page>0 ? `<button class="btn ghost" data-p="${page-1}">Prev</button>` : '';
      const next = page<totalPages-1 ? `<button class="btn ghost" data-p="${page+1}">Next</button>` : '';
      return `<div style="display:flex; gap:10px; align-items:center;"> ${prev} <div style="font-weight:900">Page ${page+1} / ${totalPages}</div> ${next} </div>`;
    }

    function render(){
      showNotFound(false);

      const anySearchText = ((qName.value||'').trim() || (qCat.value||'').trim() || String(qMin.value||'').trim() || String(qMax.value||'').trim());
      if(anySearchText && filteredList.length === 0) showNotFound(true);

      if(filteredList.length === 0){
        listEl.innerHTML = `<tr><td colspan="5">No results</td></tr>`;
        pager.innerHTML = '';
        return;
      }

      const totalPages = Math.max(1, Math.ceil(filteredList.length / size));
      if(page >= totalPages) page = totalPages - 1;

      const slice = filteredList.slice(page*size, page*size + size);

      listEl.innerHTML = slice.map(r=>{
        const badge = r.stockStatus === 'IN_STOCK' ? 'ok' : (r.stockStatus === 'LOW_STOCK' ? 'warn' : 'danger');
        return `<tr> <td>#${r.id}</td> <td>${escapeHtml(r.name||'')}</td> <td>${money(r.price)}</td> <td><span class="badge ${badge}">${r.stockStatus}</span></td> <td> <button class="btn ghost" data-action="view" data-id="${r.id}">View</button> <button class="btn" data-action="edit" data-id="${r.id}">Update</button> </td> </tr>`;
      }).join('');

      pager.innerHTML = arrayPagerHtml(totalPages);
    }

    function debounce(fn, ms){
      let t = null;
      return (...args)=>{
        clearTimeout(t);
        t = setTimeout(()=>fn(...args), ms);
      };
    }

    const runFullSearch = debounce(async ()=>{
      try{
        listEl.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
        await fetchBaseList();
        applyNameFilter();
        render();
      }catch(e){
        if(e && e.status === 404){
          baseList = [];
          filteredList = [];
          page = 0;
          render();
          showNotFound(true);
          return;
        }
        toast(e.message || 'Error', 'danger');
      }
    }, 250);

    const runNameOnly = debounce(()=>{
      applyNameFilter();
      render();
    }, 150);

    // live search
    qName?.addEventListener('input', runNameOnly);
    qCat?.addEventListener('input', runFullSearch);
    qMin?.addEventListener('input', runFullSearch);
    qMax?.addEventListener('input', runFullSearch);

    // Search button: force refresh from server (category/min/max)
    document.getElementById('btnSearch')?.addEventListener('click', async ()=>{
      baseKey = null;
      await runFullSearch();
    });

    // paging click
    pager.addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-p]');
      if(!b) return;
      page = Number(b.getAttribute('data-p'));
      render();
    });

    document.getElementById('btnCreate')?.addEventListener('click', async ()=>{
      // load categories/suppliers for selects
      let cats=[], sups=[];
      try{ cats = await api('/api/categories'); }catch(e){ toast('Cannot load categories', 'danger'); }
      try{ sups = await api('/api/suppliers'); }catch(e){ toast('Cannot load suppliers', 'danger'); }
      modal.open('Create New Product', ` <div class="row"> <div><label>Name</label><input id="pName" placeholder="Product name"/></div> <div><label>Price</label><input id="pPrice" type="number" step="0.01" placeholder="0"/></div> </div> <div class="row"> <div><label>Category</label><select id="pCat">${cats.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}</select></div> <div><label>Supplier</label><select id="pSup">${sups.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></div> </div> <div class="row"> <div><label>Stock</label><input id="pStock" type="number" value="0"/></div> <div><label>Min Stock</label><input id="pMin" type="number" value="0"/></div> </div> <div class="row"> <div><label>Status</label><select id="pStatus"> <option value="ACTIVE">ACTIVE</option> <option value="INACTIVE">INACTIVE</option> </select></div> <div><label>Description</label><input id="pDesc" placeholder="(optional)"/></div> </div> `, 'Create', async ()=>{
        const scope = document.getElementById('modalBody') || document;
        clearFieldErrors(scope);

        const nameEl = document.getElementById('pName');
        const descEl = document.getElementById('pDesc');
        const priceEl = document.getElementById('pPrice');
        const catEl = document.getElementById('pCat');
        const supEl = document.getElementById('pSup');
        const stockEl = document.getElementById('pStock');
        const minEl = document.getElementById('pMin');
        const statusEl = document.getElementById('pStatus');

        const payload = {
          name: (nameEl?.value || '').trim(),
          description: (descEl?.value || '').trim() || null,
          price: Number(priceEl?.value),
          categoryId: Number(catEl?.value),
          supplierId: Number(supEl?.value),
          stock: Number(stockEl?.value),
          minStock: Number(minEl?.value),
          status: statusEl?.value
        };

        let valid = true;
        if(!payload.name){
          setFieldError(nameEl, 'Name is required.', {scope});
          valid = false;
        }
        if(Number.isNaN(payload.price) || payload.price < 0){
          setFieldError(priceEl, 'Price must be a valid non-negative number.', {scope});
          valid = false;
        }
        if(Number.isNaN(payload.categoryId)){
          setFieldError(catEl, 'Please select a category.', {scope});
          valid = false;
        }
        if(Number.isNaN(payload.supplierId)){
          setFieldError(supEl, 'Please select a supplier.', {scope});
          valid = false;
        }
        if(Number.isNaN(payload.stock) || payload.stock < 0){
          setFieldError(stockEl, 'Stock must be a valid non-negative number.', {scope});
          valid = false;
        }
        if(Number.isNaN(payload.minStock) || payload.minStock < 0){
          setFieldError(minEl, 'Min stock must be a valid non-negative number.', {scope});
          valid = false;
        }
        if(!Number.isNaN(payload.stock) && !Number.isNaN(payload.minStock) && payload.minStock > payload.stock){
          setFieldError(minEl, 'Min stock cannot be greater than Stock.', {scope});
          setFieldError(stockEl, 'Stock must be greater than or equal to Min stock.', {scope});
          valid = false;
        }

        if(!valid){
          toast('Please fix the highlighted fields.', 'danger');
          return {close:false};
        }

        try{
          await api('/api/products', {method:'POST', body: JSON.stringify(payload)});
          toast('Product created', 'ok');
          baseKey = null;
          await runFullSearch();
          return {close:true};
        }catch(e){
          const fe = getFieldErrorsFromPayload(e.data);
          if(fe){
            applyFieldErrors(scope, fe, {
              name: '#pName',
              description: '#pDesc',
              price: '#pPrice',
              categoryId: '#pCat',
              supplierId: '#pSup',
              stock: '#pStock',
              minStock: '#pMin',
              status: '#pStatus'
            });
            toast('Please fix the highlighted fields.', 'danger');
            return {close:false};
          }
          toast(e.message || 'Error', 'danger');
          return {close:false};
        }
      });
    });

    listEl.addEventListener('click', async (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if(action === 'view'){
        const p = await api('/api/products/' + id);
        const badge = p.stockStatus === 'IN_STOCK' ? 'ok' : (p.stockStatus === 'LOW_STOCK' ? 'warn' : 'danger');
        modal.open('Product Details', ` <div class="row one"> <div style="font-size:18px"><b>${escapeHtml(p.name)}</b></div> <div>Price: ${money(p.price)}</div> <div>Stock Status: <span class="badge ${badge}">${escapeHtml(p.stockStatus)}</span></div> <div>Product Status: <b>${escapeHtml(p.status || '—')}</b></div> <div style="margin-top:10px"><b>Description</b></div> <div class="muted" style="white-space:pre-wrap">${escapeHtml(p.description || '—')}</div> </div> `, 'Close', null, {hideCancel:true});
      }
      if(action === 'edit'){
        modal.open('Update Product', ` <div class="row"> <div><label>Price</label><input id="uPrice" type="number" step="0.01" placeholder="leave empty"/></div> <div><label>Min Stock</label><input id="uMin" type="number" placeholder="leave empty"/></div> </div> <div class="row one"> <div><label>Product Status</label> <select id="uStatus"> <option value="">(no change)</option> <option value="ACTIVE">ACTIVE</option> <option value="INACTIVE">INACTIVE</option> </select> </div> </div> `, 'Update', async ()=>{
          const scope = document.getElementById('modalBody') || document;
          clearFieldErrors(scope);

          const priceEl = document.getElementById('uPrice');
          const minEl = document.getElementById('uMin');
          const statusEl = document.getElementById('uStatus');

          const priceVal = priceEl?.value ?? '';
          const minVal = minEl?.value ?? '';
          const statusVal = statusEl?.value ?? '';

          const payload = {};
          let valid = true;

          if(priceVal !== ''){
            const p = Number(priceVal);
            if(Number.isNaN(p) || p < 0){
              setFieldError(priceEl, 'Price must be a valid non-negative number.', {scope});
              valid = false;
            }else{
              payload.price = p;
            }
          }

          if(minVal !== ''){
            const m = Number(minVal);
            if(Number.isNaN(m) || m < 0){
              setFieldError(minEl, 'Min stock must be a valid non-negative number.', {scope});
              valid = false;
            }else{
              payload.minStock = m;
            }
          }

          if(statusVal !== '') payload.status = statusVal;

          if(!valid){
            toast('Please fix the highlighted fields.', 'danger');
            return {close:false};
          }

          try{
            await api('/api/products/' + id, {method:'PUT', body: JSON.stringify(payload)});
            toast('Product updated', 'ok');
            baseKey = null;
            await runFullSearch();
            return {close:true};
          }catch(e){
            const fe = getFieldErrorsFromPayload(e.data);
            if(fe){
              applyFieldErrors(scope, fe, {
                price: '#uPrice',
                minStock: '#uMin',
                status: '#uStatus'
              });
              toast('Please fix the highlighted fields.', 'danger');
              return {close:false};
            }
            toast(e.message || 'Error', 'danger');
            return {close:false};
          }
        });
      }
    });

    // initial load
    listEl.innerHTML = `<tr><td colspan="5">Loading…</td></tr>`;
    await fetchBaseList(true);
    applyNameFilter();
    render();
  }

  async function initLowStock(){
    const tbody = document.getElementById('lowTable');
    const modal = setupModal();
    const low = await api('/api/manager/products/low-stock');
    tbody.innerHTML = low.map(p=>`<tr> <td>#${p.id}</td><td>${esc(p.name)}</td><td>${esc(p.supplierName||'')}</td> <td>${money(p.price)}</td><td>${p.stock}</td><td>${p.minStock}</td><td>${p.reOrderQuantity}</td> <td><span class="badge warn">${p.status}</span></td> <td><button class="btn ghost" data-id="${p.id}">View</button></td> </tr>`).join('');

    tbody.addEventListener('click', async (e)=>{
      const b = e.target.closest('button[data-id]');
      if(!b) return;
      const id = b.getAttribute('data-id');
      const p = low.find(x=>String(x.id)===String(id));
      if(!p) return;
      modal.open('Low Stock Product', ` <div class="row one"> <div><b>${esc(p.name)}</b></div> <div>Supplier: ${esc(p.supplierName||'')}</div> <div>Stock: ${p.stock} / Min: ${p.minStock}</div> <div>Reorder Qty: ${p.reOrderQuantity}</div> </div> `, 'Close', async ()=>{});
      document.getElementById('modalOk').textContent='Close';
    });

    function esc(s){
      return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
    }
  }

  async function initPurchaseOrders(){
    const modal = setupModal();
    const tbody = document.getElementById('poTable');
    const pager = document.getElementById('poPager');

    let page = 0;
    let size = 10;

    async function load(p=page){
      page = p;
      const res = await api(`/api/purchase-orders/manager/pending?page=${page}&size=${size}`);
      const rows = res.content || [];
      tbody.innerHTML = rows.map(o=>`<tr> <td>#${o.id}</td> <td>${escapeHtml(o.supplier?.name||'')}</td> <td>${o.status}</td> <td>${fmtDate(o.createdAt)}</td> <td> <button class="btn ghost" data-action="view" data-id="${o.id}">Details</button> <button class="btn ok" data-action="receive" data-id="${o.id}">Receive</button> </td> </tr>`).join('');
      pager.innerHTML = renderPager(res);
    }

    function renderPager(pg){
      const cur = pg.number ?? 0;
      const total = pg.totalPages ?? 1;
      return `<div style="display:flex; gap:10px; align-items:center;"> ${cur>0?`<button class="btn ghost" data-p="${cur-1}">Prev</button>`:''} <div style="font-weight:900">Page ${cur+1} / ${total}</div> ${cur<total-1?`<button class="btn ghost" data-p="${cur+1}">Next</button>`:''} </div>`;
    }

    pager.addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-p]');
      if(!b) return;
      load(Number(b.getAttribute('data-p')));
    });

    document.getElementById('btnCreatePO')?.addEventListener('click', async ()=>{
      let suppliers=[], productsPage=null;
      try{ suppliers = await api('/api/suppliers'); }catch(e){ toast('Cannot load suppliers', 'danger'); }
      try{ productsPage = await api('/api/products?page=0&size=50'); }catch(e){ toast('Cannot load products', 'danger'); }
      const products = (productsPage && productsPage.content) ? productsPage.content : [];

      // helpers for searchable selects
      function fillOptions(selectEl, list, getId, getLabel){
        selectEl.innerHTML = list.map(x=>`<option value="${getId(x)}">${escapeHtml(getLabel(x))}</option>`).join('');
      }
      function filterList(list, q, getLabel){
        const s = String(q||'').trim().toLowerCase();
        if(!s) return list;
        return list.filter(x=>String(getLabel(x)||'').toLowerCase().includes(s));
      }

      modal.open('Create Purchase Order', ` <div class="row one"> <div><label>Supplier</label> <input id="poSupSearch" type="text" placeholder="Search supplier" style="margin-bottom:8px"/> <div id="poSupNF" style="display:none; color:#b00020; font-weight:900; margin:-2px 0 8px">Not Found</div> <select id="poSup"></select> </div> </div> <div class="row one" style="margin-top:10px"> <div class="sub">Add items (Product + Quantity). You can add multiple rows.</div> </div> <div id="poItems"></div> <div style="display:flex; gap:10px; margin-top:10px"> <button type="button" class="btn ghost" id="poAddRow">+ Add item</button> <button type="button" class="btn secondary" id="poClearRows">Clear</button> </div> `, 'Create', async ()=>{
        const supId = Number(document.getElementById('poSup').value);
        const rows = Array.from(document.querySelectorAll('.po-row'));
        const items = rows.map(r=>{
          const pid = Number(r.querySelector('select').value);
          const qty = Number(r.querySelector('input[type="number"]').value);
          return {purchaseOrderId: 0, productId: pid, quantity: qty};
        }).filter(x=>x.productId && x.quantity);
        if(items.length===0) throw new Error('Add at least one item');
        await api('/api/purchase-orders', {method:'POST', body: JSON.stringify({supplierId: supId, items})});
        toast('Purchase order created', 'ok');
        await load(0);
      });

      // init searchable supplier select
      const supSelect = document.getElementById('poSup');
      const supSearch = document.getElementById('poSupSearch');
      const supNF = document.getElementById('poSupNF');
      fillOptions(supSelect, suppliers, s=>s.id, s=>s.name);
      supSearch?.addEventListener('input', ()=>{
        const filtered = filterList(suppliers, supSearch.value, s=>s.name);
        fillOptions(supSelect, filtered, s=>s.id, s=>s.name);
        supNF.style.display = filtered.length ? 'none' : 'block';
      });

      const poItems = document.getElementById('poItems');
      function addRow(){
        const div = document.createElement('div');
        div.className = 'row po-row';
        div.innerHTML = ` <div> <label>Product</label> <input type="text" placeholder="Search product" style="margin-bottom:8px"/> <div class="poNF" style="display:none; color:#b00020; font-weight:900; margin:-2px 0 8px">Not Found</div> <select></select> </div> <div><label>Qty</label><input type="number" value="1" min="1"/></div> `;
        const sel = div.querySelector('select');
        const search = div.querySelector('input[type="text"]');
        const nf = div.querySelector('.poNF');
        fillOptions(sel, products, p=>p.id, p=>p.name);
        search?.addEventListener('input', ()=>{
          const filtered = filterList(products, search.value, p=>p.name);
          fillOptions(sel, filtered, p=>p.id, p=>p.name);
          nf.style.display = filtered.length ? 'none' : 'block';
        });
        poItems.appendChild(div);
      }
      document.getElementById('poAddRow')?.addEventListener('click', addRow);
      document.getElementById('poClearRows')?.addEventListener('click', ()=>{poItems.innerHTML='';});
      addRow();
    });

    tbody.addEventListener('click', async (e)=>{
      const b = e.target.closest('button[data-action]');
      if(!b) return;
      const id = b.getAttribute('data-id');
      const action = b.getAttribute('data-action');
      if(action==='view'){
        const po = await api('/api/purchase-orders/' + id);
        const items = po.items || [];
        modal.open('Purchase Order #' + po.id, ` <div class="row one"> <div><b>Supplier:</b> ${escapeHtml(po.supplier?.name||'')}</div> <div><b>Status:</b> ${po.status}</div> <div><b>Created:</b> ${fmtDate(po.createdAt)}</div> </div> <div class="table-wrap" style="margin-top:12px"> <table> <thead><tr><th>Product</th><th>Qty</th></tr></thead> <tbody> ${items.map(it=>`<tr><td>${escapeHtml(it.product?.name||'')}</td><td>${it.quantity}</td></tr>`).join('')} </tbody> </table> </div> `, 'Close', null, {hideCancel:true});
      }
      if(action==='receive'){
        await api('/api/purchase-orders/' + id + '/receive', {method:'POST'});
        toast('Purchase order received', 'ok');
        await load(page);
      }
    });

    function escapeHtml(s){
      return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
    }

    await load(0);
  }

  async function initRecentOrders(){
    const modal = setupModal();
    const tbody = document.getElementById('recentTable');
    // We intentionally show Customer ID (not name) in this page.
    // Keep this call out to avoid unnecessary requests.
    const orders = await api('/api/manager/orders/recent');
    const ordersById = new Map((orders || []).map(o => [String(o.id), o]));
    tbody.innerHTML = orders.map(o=>`<tr> <td>#${o.id}</td> <td>#${o.userId}</td> <td>${money(o.totalPrice)}</td> <td><span class="badge ${o.status==='CANCELLED'?'danger':'ok'}">${o.status}</span></td> <td>${fmtDate(o.createdAt)}</td> <td> <button class="btn ghost" data-action="view" data-id="${o.id}">Details</button> <button class="btn danger" data-action="cancel" data-id="${o.id}">Cancel</button> </td> </tr>`).join('');

    tbody.addEventListener('click', async (e)=>{
      const b = e.target.closest('button[data-action]');
      if(!b) return;
      const id = b.getAttribute('data-id');
      const action = b.getAttribute('data-action');
      if(action==='view'){
        // Store managers cannot access the CUSTOMER-only /api/orders/{id} endpoint.
        // Use the manager-scoped endpoint that returns the same OrderResponseDto.
        const o = await api('/api/manager/orders/' + id);
        modal.open('Order #' + o.id, ` <div class="row one"> <div><b>Customer ID:</b> ${o.userId ? ("#" + o.userId) : "—"}</div> <div><b>Status:</b> ${o.status}</div> <div><b>Total:</b> ${money(o.totalPrice)}</div> <div><b>Created:</b> ${fmtDate(o.createdAt)}</div> <div><b>Payment Ref:</b> ${o.paymentReference ?? '—'}</div> </div> <div class="table-wrap" style="margin-top:12px"> <table> <thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Subtotal</th></tr></thead> <tbody> ${(o.items||[]).map(it=>`<tr> <td>${it.productName}</td> <td>${money(it.unitPrice)}</td> <td>${it.quantity}</td> <td>${money(it.subTotal)}</td> </tr>`).join('')} </tbody> </table> </div> `, 'Close', null, {hideCancel:true});
      }
      if(action==='cancel'){
        const known = ordersById.get(String(id));
        const rowStatus = (b.closest('tr')?.querySelector('.badge')?.textContent || '').trim();
        const status = (known?.status || rowStatus || '').toUpperCase();
        if(status === 'CANCELLED'){
          toast('Order is already cancelled.', 'danger');
          return;
        }

        await api('/api/orders/' + id, {method:'DELETE'});
        toast('Order cancelled', 'ok');
        // refresh
        window.location.reload();
      }
    });
  }

  async function initCustomers(){
    const tbody = document.getElementById('customersTable');
    const pager = document.getElementById('customersPager');
    let page = 0;
    let size = 10;

    async function load(p=page){
      page = p;
      const res = await api(`/api/manager/users?page=${page}&size=${size}`);
      const rows = res.content || [];
      tbody.innerHTML = rows.map(u=>`<tr> <td>#${u.id}</td> <td>${esc(u.fullName)}</td> <td>${esc(u.email||'')}</td> <td>${(u.roles||[]).map(r=>`<span class="badge ok">${r.name}</span>`).join(' ')}</td> </tr>`).join('');

      pager.innerHTML = `<div style="display:flex; gap:10px; align-items:center;"> ${(res.number??0)>0?`<button class="btn ghost" data-p="${(res.number??0)-1}">Prev</button>`:''} <div style="font-weight:900">Page ${(res.number??0)+1} / ${(res.totalPages??1)}</div> ${(res.number??0)<(res.totalPages??1)-1?`<button class="btn ghost" data-p="${(res.number??0)+1}">Next</button>`:''} </div>`;
    }

    pager.addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-p]');
      if(!b) return;
      load(Number(b.getAttribute('data-p')));
    });

    function esc(s){
      return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
    }

    await load(0);
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    ensureLoggedIn();
    const role = await detectRole();
    if(role !== 'STORE_MANAGER') return window.location.href = '/index.html';

    setActiveNav();
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    const path = window.location.pathname;
    try{
      if(path.endsWith('/dashboard.html')) await initDashboard();
      else if(path.endsWith('/products.html')) await initProducts();
      else if(path.endsWith('/low-stock.html')) await initLowStock();
      else if(path.endsWith('/purchase-orders.html')) await initPurchaseOrders();
      else if(path.endsWith('/recent-orders.html')) await initRecentOrders();
      else if(path.endsWith('/customers.html')) await initCustomers();
    }catch(e){
      toast(e.message || 'Error', 'danger');
    }
  });
})();