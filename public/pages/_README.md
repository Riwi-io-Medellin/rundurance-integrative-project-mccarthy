# pages/ — HTML Screens

Each file is one screen of the application. They all share the same layout pattern: sidebar navigation on the left, main content on the right.

## Page Map

| Page | Who uses it | Needs login? | Backend endpoints it calls |
|------|------------|-------------|--------------------------|
| index.html | Everyone | No | None (static landing page) |
| login.html | Coach | No | `POST /api/auth/login` |
| dashboard.html | Coach | Yes | `GET /api/athletes`, alerts, fitness data |
| atletas.html | Coach | Yes | `GET/POST/PUT/DELETE /api/athletes` |
| finance.html | Coach | Yes | `GET/POST/PUT /api/finances` |
| progreso.html | Coach | Yes | `GET /api/workouts/athlete/:id`, fitness snapshots |
| configuracion.html | Coach | Yes | Future: coach profile settings |
| app.html | Athlete | Yes | `GET /api/workouts/athlete/:id` (read-only) |

## Current State

All pages have the **HTML structure and Tailwind styling** already built. What's missing is the **JavaScript** that connects them to the backend API.

## What Each Page Needs (JavaScript)

Every protected page needs this at the top of its `<script>`:

```javascript
// 1. Check if user is logged in
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// 2. Helper to make authenticated API calls
async function apiFetch(url, options = {}) {
  options.headers = {
    ...options.headers,
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
  return res;
}
```

Then each page loads its specific data:
- **atletas.html** → calls `apiFetch('/api/athletes')` and fills the table
- **finance.html** → calls `apiFetch('/api/finances')` and fills the payment list
- **dashboard.html** → calls multiple endpoints to build the overview

## Shared Layout

All pages (except index.html and login.html) share a **sidebar** with navigation links:
- Dashboard, Atletas, Finanzas, Reportes, Configuracion
- Coach profile at the bottom

Currently the sidebar has hardcoded coach name. Eventually it should read from the JWT token or a profile endpoint.
