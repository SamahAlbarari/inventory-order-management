(() => {
  const form = document.getElementById('registerForm');
  const err = document.getElementById('err');

  const nEl = document.getElementById('fullName');
  const eEl = document.getElementById('email');
  const pEl = document.getElementById('password');
  const cEl = document.getElementById('confirmPassword');

  const { clearFieldErrors, setFieldError } = window.App || {};

  function clearInvalid(){
    [nEl, eEl, pEl, cEl].forEach(x => x.classList.remove('is-invalid'));
  }
  function setInvalid(...els){
    els.forEach(x => x.classList.add('is-invalid'));
  }
  function setMsg(msg, kind='danger'){
    err.textContent = msg || '';
    err.classList.remove('danger','ok','warn','info');
    if(msg) err.classList.add(kind);
  }

  [nEl, eEl, pEl, cEl].forEach(el => {
    el.addEventListener('input', () => {
      clearInvalid();
      if (err.textContent) setMsg('');
    });
  });

  // Email is case-insensitive, normalize for consistency
  eEl.addEventListener('input', () => {
    const start = eEl.selectionStart;
    const end = eEl.selectionEnd;
    const next = (eEl.value || '').toLowerCase();
    if (eEl.value !== next) {
      eEl.value = next;
      try { eEl.setSelectionRange(start, end); } catch(_) {}
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    clearInvalid();
    if(clearFieldErrors) clearFieldErrors(form);

    const fullName = (nEl.value || '').trim();
    const email = (eEl.value || '').trim().toLowerCase();
    const password = pEl.value || '';
    const confirmPassword = cEl.value || '';

    if (!fullName || !email || !password || !confirmPassword) {
      setMsg('Please fill in the missing fields.', 'danger');
      setInvalid(nEl, eEl, pEl, cEl);
      if(setFieldError){
        if(!fullName) setFieldError(nEl, 'Full name is required.', {scope: form});
        if(!email) setFieldError(eEl, 'Email is required.', {scope: form});
        if(!password) setFieldError(pEl, 'Password is required.', {scope: form});
        if(!confirmPassword) setFieldError(cEl, 'Please confirm your password.', {scope: form});
      }
      return;
    }

    if (password !== confirmPassword) {
      setMsg('Passwords do not match. Please re-enter them.', 'danger');
      setInvalid(pEl, cEl);
      if(setFieldError){
        setFieldError(pEl, 'Password and confirmation must match.', {scope: form});
        setFieldError(cEl, 'Password and confirmation must match.', {scope: form});
      }
      return;
    }

    try {
      await App.api('/api/auth/users/customer', {
        method: 'POST',
        body: JSON.stringify({ email, fullName, password })
      });

      App.toast('Account created. Please login.', 'ok');
      window.location.href = '/login.html';
    } catch (ex) {
      const data = ex && ex.data;
      if (data && typeof data === 'object') {
        if (data.message) setMsg(data.message);

        // Single field error: { field, message }
        if (data.field) {
          if (data.field === 'email') setInvalid(eEl);
          return;
        }

        // Validation map (400): { fieldName: 'message', ... }
        const keys = Object.keys(data);
        const hasMap = keys.some(k => typeof data[k] === 'string');
        if (hasMap) {
          if (data.email) setInvalid(eEl);
          if (data.fullName) setInvalid(nEl);
          if (data.password) setInvalid(pEl);

          if(setFieldError){
            if (data.email) setFieldError(eEl, String(data.email), {scope: form});
            if (data.fullName) setFieldError(nEl, String(data.fullName), {scope: form});
            if (data.password) setFieldError(pEl, String(data.password), {scope: form});
          }

          if (!err.textContent) {
            const firstKey = keys.find(k => typeof data[k] === 'string' && String(data[k]).trim().length);
            if (firstKey) setMsg(String(data[firstKey]));
          }
          return;
        }
      }

      setMsg(ex && ex.message ? ex.message : 'Register failed');
    }
  });
})();
