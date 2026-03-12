require('dotenv').config();
const API_BASE = '/api';


async function request(path, options = {}) {
    //prueva token 
  const token = TEST_TOKEN || localStorage.getItem('token','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cmFpbmVyX2lkIjozLCJlbWFpbCI6ImFkbWluQG1haWwuY29tIiwicm9sZSI6ImNvYWNoIiwiaWF0IjoxNzczMjQwNzI4LCJleHAiOjE3NzM4NDU1Mjh9.hjRLY9zI8saZdX4v6IXTg8IytzaGjLGNNs0bsHqcWR0') || '';

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // prueba token
      Authorization: token ? `Bearer ${token}` : undefined,
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