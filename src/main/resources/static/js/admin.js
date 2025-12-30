(function(){
  const App = window.App;
  if(!App) return;

  const { api, toast, ensureLoggedIn, detectRole, logout, clearFieldErrors, setFieldError, applyFieldErrors, getFieldErrorsFromPayload } = App;

  // Get element by id (supports fallback ids)
  const el = (...ids) => {
    for (const id of ids) {
      const node = document.getElementById(id);
      if (node) return node;
    }
    return null;
  };

  function setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav a').forEach(a => {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
  }

  function setupModal() {
    const bd = el('modalBackdrop');
    const title = el('modalTitle');
    const body = el('modalBody');
    const ok = el('modalOk');
    const cancel = el('modalCancel');
    let onOk = null;

    function open(t, html, okText = 'Save', handler = null, opts = {}) {
      if (!bd || !title || !body || !ok) return;
      title.textContent = t;
      body.innerHTML = html;
      ok.textContent = okText;
      onOk = handler;

      // Hide cancel button for view-only dialogs
      const autoHide = (String(okText).toLowerCase() === 'close');
      const hide = (opts && typeof opts.hideCancel !== 'undefined') ? opts.hideCancel : autoHide;
      if (cancel) cancel.style.display = hide ? 'none' : '';

        cancel.textContent = (opts && opts.cancelText) ? String(opts.cancelText) : 'Cancel';
        bd.style.display = 'flex';
    }

    function close() {
      if (!bd) return;
      bd.style.display = 'none';
      onOk = null;
    }

    cancel?.addEventListener('click', close);
    bd?.addEventListener('click', (e) => { if (e.target === bd) close(); });
    ok?.addEventListener('click', async () => {
      if (!onOk) return close();
      ok.disabled = true;
      try {
        // If handler returns false (or {close:false}), keep modal open.
        const result = await onOk();
        if (result === false || (result && result.close === false)) return;
        close();
      }
      catch (e) {
        const fe = getFieldErrorsFromPayload && getFieldErrorsFromPayload(e && e.data);
        if(fe){
          applyFieldErrors(body, fe);
          toast('Please fix the highlighted fields.', 'danger');
        }else{
          toast(e?.message || 'Error', 'danger');
        }
      }
      finally { ok.disabled = false; }
    });

    return { open, close };
  }

  async function loadOverview() {
    const data = await api('/api/admin/overview');

    // Pretty formatting helpers (dashboard only)
    const nf = new Intl.NumberFormat();
    const asNum = (v) => {
      if (v === null || typeof v === 'undefined') return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return null;
        const cleaned = s.replace(/[^0-9.-]/g, '');
        const num = Number(cleaned);
        return Number.isFinite(num) ? num : null;
      }
      return null;
    };
    const fmt = (v) => {
      if (v === null || typeof v === 'undefined') return '—';
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return '—';
        // keep currency/format if user already sees it
        if (/[\$€£]/.test(s)) return s;
        const num = asNum(s);
        return (num !== null) ? nf.format(num) : s;
      }
      if (typeof v === 'number') return nf.format(v);
      return String(v);
    };
    const setText = (id, value) => {
      const node = el(id);
      if (node) node.textContent = fmt(value);
      return !!node;
    };

    const users = data?.users || {};
    const inv = data?.inventory || {};
    const orders = data?.orders || {};
    const suppliers = data?.suppliers || {};
    const revenue = data?.revenue || {};
    const alerts = data?.alerts || {};

    // UsersStatsDto: totalUsers, customers, storeManagers, admins
    setText('ovUsers', users.totalUsers);
    setText('ovUsersAdmins', users.admins);
    setText('ovUsersManagers', users.storeManagers);
    setText('ovUsersCustomers', users.customers);
    // legacy meta
    el('ovUsersMeta') && (el('ovUsersMeta').textContent = `Admins: ${fmt(users.admins)} • Managers: ${fmt(users.storeManagers)} • Customers: ${fmt(users.customers)}`);

    // InventoryStatsDto: totalProducts, activeProducts, inactiveProducts, lowStockProducts, outOfStockProducts
    setText('ovProducts', inv.totalProducts);
    setText('ovProductsActive', inv.activeProducts);
    setText('ovProductsInactive', inv.inactiveProducts);
    setText('ovProductsLow', inv.lowStockProducts);
    setText('ovProductsOut', inv.outOfStockProducts);
    el('ovProductsMeta') && (el('ovProductsMeta').textContent = `Active: ${fmt(inv.activeProducts)} • Low: ${fmt(inv.lowStockProducts)} • Out: ${fmt(inv.outOfStockProducts)} • Inactive: ${fmt(inv.inactiveProducts)}`);

    // OrderStatsDto: totalOrders, confirmedOrders, cancelledOrders, deliveredOrders, todayOrders
    setText('ovOrders', orders.totalOrders);
    setText('ovOrdersConfirmed', orders.confirmedOrders);
    setText('ovOrdersDelivered', orders.deliveredOrders);
    setText('ovOrdersCancelled', orders.cancelledOrders);
    setText('ovOrdersToday', orders.todayOrders);
    el('ovOrdersMeta') && (el('ovOrdersMeta').textContent = `Confirmed: ${fmt(orders.confirmedOrders)} • Delivered: ${fmt(orders.deliveredOrders)} • Cancelled: ${fmt(orders.cancelledOrders)} • Today: ${fmt(orders.todayOrders)}`);

    // SupplierStatsDto: totalSuppliers, pendingPurchaseOrders, receivedPurchaseOrders
    setText('ovSuppliers', suppliers.totalSuppliers);
    setText('ovSuppliersTotal', suppliers.totalSuppliers);
    // Purchase orders (card)
    const pendingPO = suppliers.pendingPurchaseOrders;
    const receivedPO = suppliers.receivedPurchaseOrders;
    setText('ovPOPending', pendingPO);
    setText('ovPOReceived', receivedPO);
    // total purchase orders = pending + received (if numeric)
    const poTotal = (asNum(pendingPO) ?? 0) + (asNum(receivedPO) ?? 0);
    if (el('ovPurchaseOrders')) {
      el('ovPurchaseOrders').textContent = (pendingPO == null && receivedPO == null) ? '—' : nf.format(poTotal);
    }
    el('ovSuppliersMeta') && (el('ovSuppliersMeta').textContent = `Pending PO: ${fmt(pendingPO)} • Received PO: ${fmt(receivedPO)}`);

    // RevenueStatsDto: totalRevenue, todayRevenue, refundedAmount
    setText('ovRevenue', revenue.totalRevenue);
    setText('ovRevenueToday', revenue.todayRevenue);
    setText('ovRevenueRefunded', revenue.refundedAmount);
    el('ovRevenueMeta') && (el('ovRevenueMeta').textContent = `Today: ${fmt(revenue.todayRevenue)} • Refunded: ${fmt(revenue.refundedAmount)}`);

    // AlertStatsDto: lowStockAlerts, outOfStockAlerts
    const lowA = alerts.lowStockAlerts ?? 0;
    const outA = alerts.outOfStockAlerts ?? 0;
    setText('ovAlertsLow', lowA);
    setText('ovAlertsOut', outA);
    setText('ovAlerts', (asNum(lowA) ?? 0) + (asNum(outA) ?? 0));
    el('ovAlertsMeta') && (el('ovAlertsMeta').textContent = `Low stock: ${fmt(lowA)} • Out of stock: ${fmt(outA)}`);
  }

  async function usersPage(modal) {
    const tbody = el('usersTbody', 'usersBody');
    if (!tbody) return;

    let page = 0;
    let totalPages = 1;

    const sizeInput = el('usersPageSize');
    const reloadBtn = el('usersReload');
    const prevBtn = el('usersPrev');
    const nextBtn = el('usersNext');
    const pager = el('usersPager');

    async function load(p = 0) {
      const size = Math.max(1, Math.min(100, parseInt(sizeInput?.value || '10', 10)));
      const res = await api(`/api/admin/users?page=${p}&size=${size}`);
      page = res.number ?? 0;
      totalPages = res.totalPages ?? 1;

      tbody.innerHTML = '';
      (res.content || []).forEach(u => {
        const tr = document.createElement('tr');
        const roles = (u.roles || []).map(r => r.name).join(', ');
        tr.innerHTML = ` <td>${u.id ?? ''}</td> <td>${u.fullName ?? ''}</td> <td>${u.email ?? ''}</td> <td>${roles}</td> <td> <button class="btn ghost" data-action="reset" data-id="${u.id}" data-name="${u.fullName ?? ''}">Reset Password</button> </td> `;
        tbody.appendChild(tr);
      });

      if (pager) pager.textContent = `Page ${page + 1} / ${totalPages}`;
      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= totalPages - 1;
    }


    // Row actions (delegation)
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const userId = btn.dataset.id;
      const name = btn.dataset.name || '';
      if (action === 'reset') {
        modal.open(`Reset Password`, ` <div class="row one"><div class="sub">User: <b>${name}</b> (ID: ${userId})</div></div> <div class="row"><div><label>New Password</label><input id="rp_pass1" type="password" placeholder="e.g. Test@1234"/></div> <div><label>Confirm Password</label><input id="rp_pass2" type="password" placeholder="repeat password"/></div></div> <div class="sub" style="margin-top:8px;opacity:.85">Password must be 8-25 chars and include uppercase, lowercase, number and special character.</div> `, 'Reset', async () => {
          const p1 = document.getElementById('rp_pass1')?.value || '';
          const p2 = document.getElementById('rp_pass2')?.value || '';
          if (!p1 || !p2) { toast('Please enter password and confirm it', 'warn'); return false; }
          if (p1 !== p2) { toast('Passwords do not match', 'warn'); return false; }
          await api(`/api/admin/users/${userId}/password`, { method: 'PATCH', body: JSON.stringify({ password: p1 }) });
          toast('Password reset successfully', 'ok');
        });
      }
    });

    prevBtn?.addEventListener('click', () => load(page - 1));
    nextBtn?.addEventListener('click', () => load(page + 1));
    reloadBtn?.addEventListener('click', () => load(page));
    sizeInput?.addEventListener('change', () => load(0));

    const btnCreateManager = el('btnCreateManager');
    btnCreateManager?.addEventListener('click', () => {
      modal.open('Create New Manager', ` <div class="row one"><label>Full Name</label><input id="m_fullName" placeholder="full name"/></div> <div class="row"><div><label>Email</label><input id="m_email" placeholder="email"/></div> <div><label>Password</label><input id="m_password" type="password" placeholder="Password e.g. Test@1234"/></div></div> <div class="row one"><label>Confirm Password</label><input id="m_password2" type="password" placeholder="confirm password"/></div> <div class="sub" style="margin-top:8px;opacity:.85">Password must be 8-25 chars and include uppercase, lowercase, and a number. Also include a special character like @.</div> `, 'Create', async () => {
        const fullNameEl = el('m_fullName');
        const emailEl = el('m_email');
        const passEl = el('m_password');
        const pass2El = el('m_password2');
        [fullNameEl, emailEl, passEl, pass2El].forEach(x => x?.classList.remove('is-invalid'));

        const p1 = passEl?.value || '';
        const p2 = pass2El?.value || '';
        if (!p1 || !p2) {
          if (!p1) passEl?.classList.add('is-invalid');
          if (!p2) pass2El?.classList.add('is-invalid');
          toast('Please enter password and confirm it', 'warn');
          return false;
        }
        if (p1 !== p2) {
          passEl?.classList.add('is-invalid');
          pass2El?.classList.add('is-invalid');
          toast('Passwords do not match', 'warn');
          return false;
        }

        const payload = {
          fullName: (fullNameEl?.value || '').trim(),
          email: (emailEl?.value || '').trim().toLowerCase(),
          password: p1
        };

        try {
          await api('/api/users/manager', { method: 'POST', body: JSON.stringify(payload) });
          toast('Manager created', 'ok');
          await load(0);
        } catch (ex) {
          const data = ex?.data;
          // Preferred error formats:
          // 1) {message, field}
          // 2) {email: '...', password: '...', fullName: '...'}
          if (data && typeof data === 'object') {
            if (data.field === 'email') emailEl?.classList.add('is-invalid');
            if (typeof data.email === 'string') emailEl?.classList.add('is-invalid');
            if (typeof data.password === 'string') passEl?.classList.add('is-invalid');
            if (typeof data.fullName === 'string') fullNameEl?.classList.add('is-invalid');
          }
          throw ex;
        }
      });

      // Normalize email while typing
      const emailEl = el('m_email');
      emailEl?.addEventListener('input', () => {
        const s = emailEl.selectionStart, e = emailEl.selectionEnd;
        const next = (emailEl.value || '').toLowerCase();
        if (emailEl.value !== next) {
          emailEl.value = next;
          try { emailEl.setSelectionRange(s, e); } catch(_) {}
        }
        emailEl.classList.remove('is-invalid');
      });
      el('m_fullName')?.addEventListener('input', () => el('m_fullName')?.classList.remove('is-invalid'));
      el('m_password')?.addEventListener('input', () => el('m_password')?.classList.remove('is-invalid'));
      el('m_password2')?.addEventListener('input', () => el('m_password2')?.classList.remove('is-invalid'));
    });

    const btnCreateAdmin = el('btnCreateAdmin');
    btnCreateAdmin?.addEventListener('click', () => {
      modal.open('Create New Admin', ` <div class="row one"><label>Full Name</label><input id="a_fullName" placeholder="full name"/></div> <div class="row"><div><label>Email</label><input id="a_email" placeholder="email"/></div> <div><label>Password</label><input id="a_password" type="password" placeholder="Password e.g. Test@1234"/></div></div> <div class="row one"><label>Confirm Password</label><input id="a_password2" type="password" placeholder="confirm password"/></div> <div class="sub" style="margin-top:8px;opacity:.85">Password must be 8-25 chars and include uppercase, lowercase, and a number. Also include a special character like @.</div> `, 'Create', async () => {
        const fullNameEl = el('a_fullName');
        const emailEl = el('a_email');
        const passEl = el('a_password');
        const pass2El = el('a_password2');
        [fullNameEl, emailEl, passEl, pass2El].forEach(x => x?.classList.remove('is-invalid'));

        const p1 = passEl?.value || '';
        const p2 = pass2El?.value || '';
        if (!p1 || !p2) {
          if (!p1) passEl?.classList.add('is-invalid');
          if (!p2) pass2El?.classList.add('is-invalid');
          toast('Please enter password and confirm it', 'warn');
          return false;
        }
        if (p1 !== p2) {
          passEl?.classList.add('is-invalid');
          pass2El?.classList.add('is-invalid');
          toast('Passwords do not match', 'warn');
          return false;
        }

        const payload = {
          fullName: (fullNameEl?.value || '').trim(),
          email: (emailEl?.value || '').trim().toLowerCase(),
          password: p1
        };

        try {
          await api('/api/admin', { method: 'POST', body: JSON.stringify(payload) });
          toast('Admin created', 'ok');
          await load(0);
        } catch (ex) {
          const data = ex?.data;
          if (data && typeof data === 'object') {
            if (data.field === 'email') emailEl?.classList.add('is-invalid');
            if (typeof data.email === 'string') emailEl?.classList.add('is-invalid');
            if (typeof data.password === 'string') passEl?.classList.add('is-invalid');
            if (typeof data.fullName === 'string') fullNameEl?.classList.add('is-invalid');
          }
          throw ex;
        }
      });

      const emailEl = el('a_email');
      emailEl?.addEventListener('input', () => {
        const s = emailEl.selectionStart, e = emailEl.selectionEnd;
        const next = (emailEl.value || '').toLowerCase();
        if (emailEl.value !== next) {
          emailEl.value = next;
          try { emailEl.setSelectionRange(s, e); } catch(_) {}
        }
        emailEl.classList.remove('is-invalid');
      });
      el('a_fullName')?.addEventListener('input', () => el('a_fullName')?.classList.remove('is-invalid'));
      el('a_password')?.addEventListener('input', () => el('a_password')?.classList.remove('is-invalid'));
      el('a_password2')?.addEventListener('input', () => el('a_password2')?.classList.remove('is-invalid'));
    });

    await load(0);
  }

  async function categoriesPage(modal) {
    const tbody = el('categoriesTbody', 'catBody');
    if (!tbody) return;

    async function load() {
      const cats = await api('/api/categories');
      tbody.innerHTML = '';
      (cats || []).forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.id ?? ''}</td><td>${c.name ?? ''}</td><td>${c.description || ''}</td>`;
        tbody.appendChild(tr);
      });
    }

    el('btnCreateCategory', 'btnAddCategory')?.addEventListener('click', () => {
      modal.open('Create New Category', ` <div class="row one"><label>Name</label><input id="c_name" placeholder="Category name"/></div> <div class="row one"><label>Description</label><textarea id="c_desc" rows="4" placeholder="Description (optional)"></textarea></div> `, 'Add', async () => {
        const payload = {
          name: el('c_name').value.trim(),
          description: el('c_desc').value.trim()
        };
        await api('/api/categories', { method: 'POST', body: JSON.stringify(payload) });
        toast('Category created', 'ok');
        await load();
      });
    });

    await load();
  }

  async function suppliersPage(modal) {
    const tbody = el('suppliersTbody', 'supBody');
    if (!tbody) return;

    async function load() {
      const items = await api('/api/suppliers');
      tbody.innerHTML = '';
      (items || []).forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.id ?? ''}</td><td>${s.name ?? ''}</td><td>${s.email ?? ''}</td><td>${s.phone ?? ''}</td><td>${s.address || ''}</td>`;
        tbody.appendChild(tr);
      });
    }

    el('btnCreateSupplier', 'btnAddSupplier')?.addEventListener('click', () => {
      modal.open('Create New Supplier', ` <div class="row one"><label>Name</label><input id="s_name" placeholder="Supplier name"/></div> <div class="row"><div><label>Email</label><input id="s_email" placeholder="email@example.com"/></div> <div><label>Phone</label><input id="s_phone" placeholder="+9627XXXXXXXX"/></div></div> <div class="row one"><label>Address</label><input id="s_address" placeholder="Address"/></div> `, 'Add', async () => {
        const payload = {
          name: el('s_name').value.trim(),
          email: el('s_email').value.trim(),
          phone: el('s_phone').value.trim(),
          address: el('s_address').value.trim()
        };
        await api('/api/suppliers', { method: 'POST', body: JSON.stringify(payload) });
        toast('Supplier created', 'ok');
        await load();
      });
    });

    await load();
  }

  async function rolesPage(modal) {
    const tbody = el('rolesTbody', 'rolesBody');
    if (!tbody) return;

    let roleMap = new Map(); // name -> id

    async function loadRoles() {
      const roles = await api('/api/roles');
      tbody.innerHTML = '';
      roleMap = new Map();
      (roles || []).forEach(r => {
        roleMap.set(String(r.name || '').toUpperCase(), r.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.id ?? ''}</td><td>${r.name ?? ''}</td>`;
        tbody.appendChild(tr);
      });
    }

    el('btnCreateRole', 'btnAddRole')?.addEventListener('click', () => {
      modal.open('Add Role', ` <div class="row one"><label>Role name</label><input id="r_name" placeholder="ADMIN / STORE_MANAGER / CUSTOMER"/></div> `, 'Add', async () => {
        const name = el('r_name').value.trim();
        if (!name) { toast('Role name is required', 'warn'); return false; }
        await api('/api/roles', { method: 'POST', body: JSON.stringify({ name }) });
        toast('Role added', 'ok');
        await loadRoles();
      });
    });

    function parseRoleIds(inputRaw) {
      const raw = (inputRaw || '').trim();
      if (!raw) return { ids: [], unknown: [] };
      const tokens = raw.split(',').map(s => s.trim()).filter(Boolean);
      const ids = [];
      const unknown = [];
      tokens.forEach(t => {
        // allow numeric ids too
        if (/^\d+$/.test(t)) {
          ids.push(Number(t));
          return;
        }
        const id = roleMap.get(String(t).toUpperCase());
        if (id != null) ids.push(id);
        else unknown.push(t);
      });
      return { ids, unknown };
    }

    async function updateRoles(mode) {
      const userId = el('roleUserId', 'userId')?.value?.trim();
      const roleNamesRaw = el('roleNames')?.value?.trim();
      const resultBox = el('roleUpdateResult');

      if (!userId) return toast('User ID is required', 'warn');
      if (!roleNamesRaw) return toast('Enter role names (comma separated)', 'warn');

      const { ids, unknown } = parseRoleIds(roleNamesRaw);
      if (unknown.length) toast(`Unknown roles: ${unknown.join(', ')}`, 'warn');
      if (!ids.length) return toast('No valid roles found', 'warn');

      const payload = mode === 'add'
        ? { addRoleIds: ids, removeRoleIds: [] }
        : { addRoleIds: [], removeRoleIds: ids };

      const updated = await api(`/api/roles/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (resultBox) {
        const names = (updated?.roles || []).map(r => r.name).join(', ');
        resultBox.textContent = `Updated roles: ${names}`;
      }
      toast(mode === 'add' ? 'Roles added' : 'Roles removed', 'ok');
    }

    el('btnAddUserRoles')?.addEventListener('click', () => updateRoles('add'));
    el('btnRemoveUserRoles')?.addEventListener('click', () => updateRoles('remove'));

    await loadRoles();
  }

  async function init() {
    ensureLoggedIn();
    const role = await detectRole();
    if (role !== 'ADMIN') return (window.location.href = '/index.html');

    setActiveNav();
    el('logoutBtn')?.addEventListener('click', logout);

    const modal = setupModal();
    const p = window.location.pathname;

    if (p.endsWith('/dashboard.html')) {
      const refreshBtn = el('refreshOverview');
      refreshBtn?.addEventListener('click', async (ev) => {
        ev?.preventDefault?.();
        if (refreshBtn) refreshBtn.disabled = true;
        try { await loadOverview(); toast('Refreshed', 'ok'); }
        catch (e) { toast(e?.message || 'Error', 'danger'); }
        finally { if (refreshBtn) refreshBtn.disabled = false; }
      });
      await loadOverview();
    } else if (p.endsWith('/users.html')) {
      await usersPage(modal);
    } else if (p.endsWith('/categories.html')) {
      await categoriesPage(modal);
    } else if (p.endsWith('/suppliers.html')) {
      await suppliersPage(modal);
    } else if (p.endsWith('/roles.html')) {
      await rolesPage(modal);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    init().catch(e => toast(e?.message || 'Error', 'danger'));
  });
})();