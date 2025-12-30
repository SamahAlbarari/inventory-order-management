(() => {
  const form = document.getElementById('loginForm');
  const err = document.getElementById('err');
  const uEl = document.getElementById('email');
  const pEl = document.getElementById('password');

  const { clearFieldErrors, setFieldError } = window.App || {};

  function clearInvalid(){
    uEl.classList.remove('is-invalid');
    pEl.classList.remove('is-invalid');
  }
  function setInvalid(){
    uEl.classList.add('is-invalid');
    pEl.classList.add('is-invalid');
  }
  function setMsg(msg, kind='danger'){
    err.textContent = msg || '';
    err.classList.remove('danger','ok','warn','info');
    if(msg) err.classList.add(kind);
  }

  [uEl, pEl].forEach(el => {
    el.addEventListener('input', () => {
      clearInvalid();
      if (err.textContent) setMsg('');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    clearInvalid();

    // Normalize email so login is not affected by casing or leading/trailing spaces
    const email = (uEl.value || '').trim().toLowerCase();
    const password = pEl.value || '';

    if (!email || !password) {
      setMsg('Please enter the missing fields.', 'danger');
      setInvalid();
      if(setFieldError){
        if(!email) setFieldError(uEl, 'Email is required.', {scope: form});
        if(!password) setFieldError(pEl, 'Password is required.', {scope: form});
      }
      return;
    }

    try {
      const res = await App.api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Backend returns { accessToken, tokenType } (or similar)
      const token = res.accessToken || res.token || res.jwt || res.access_token;
      if (!token) throw new Error('Login succeeded but token was missing in response');

      App.setToken(token);
      await App.detectRole(true);
      window.location.href = '/index.html';
    } catch (ex) {
      const status = ex && ex.status;
      if (status === 401 || status === 403) {
        setMsg('Incorrect email or password.');
      } else {
        setMsg(ex && ex.message ? ex.message : 'Login failed');
      }
      setInvalid();
    }
  });
})();