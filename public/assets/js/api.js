const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

function apiGet(path) { return request(path, { method: 'GET' }); }
function apiPost(path, body) { return request(path, { method: 'POST', body: JSON.stringify(body) }); }
function apiPut(path, body) { return request(path, { method: 'PATCH', body: JSON.stringify(body) }); }
function apiDelete(path) { return request(path, { method: 'DELETE' }); }

export {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};