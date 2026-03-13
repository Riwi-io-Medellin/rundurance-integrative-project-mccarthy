const API_BASE = '/api';

async function request(path, options = {}) {
  const token = sessionStorage.getItem('token');
  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), 15000);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      signal: abort.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
    throw new Error('Error de conexión. Revisa tu red.');
  }
  clearTimeout(timeoutId);

  if (res.status === 401 && !path.startsWith('/auth/')) {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

function apiGet(path) { return request(path, { method: 'GET' }); }
function apiPost(path, body) { return request(path, { method: 'POST', body: JSON.stringify(body) }); }
function apiPut(path, body) { return request(path, { method: 'PUT', body: JSON.stringify(body) }); }
function apiPatch(path, body) { return request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
function apiDelete(path) { return request(path, { method: 'DELETE' }); }

function checkAuth() {
  if (!sessionStorage.getItem('token')) {
    window.location.href = 'login.html';
  }
}

function loadSidebar() {
  const raw = sessionStorage.getItem('trainer');
  if (!raw) return;
  try {
    const trainer = JSON.parse(raw);
    const el = document.getElementById('sidebar-name');
    if (el && trainer.first_name) {
      el.textContent = `${trainer.first_name} ${trainer.last_name || ''}`.trim();
    }
  } catch {
    // ignore
  }
}

export {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  checkAuth,
  loadSidebar,
};