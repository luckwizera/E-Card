(() => {
  const api = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: response.status, data });
    return data;
  };

  function showLogin() {
    if (document.getElementById('authOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.innerHTML = `<div class="auth-panel"><div class="brand-mark">E</div><h2>Welcome to E-Card</h2><p>Sign in to access your school conduct workspace.</p><form id="loginForm"><label>Email<input id="loginEmail" type="email" autocomplete="username" required></label><label>Password<input id="loginPassword" type="password" autocomplete="current-password" required></label><div id="loginError" class="auth-error" role="alert"></div><button class="btn btn-primary" type="submit">Sign in</button></form></div>`;
    document.body.appendChild(overlay);
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const error = document.getElementById('loginError');
      error.textContent = '';
      try {
        const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }) });
        overlay.remove();
        const roleButton = document.querySelector(`.role-btn[data-role="${data.user.role}"]`);
        if (roleButton && !roleButton.classList.contains('active')) roleButton.click();
      } catch (err) { error.textContent = err.message; }
    });
  }

  window.addEventListener('load', async () => {
    if (window.location.protocol === 'file:') return;
    try { await api('/api/auth/me'); } catch (error) { if (error.status === 401) showLogin(); }
  });
})();
