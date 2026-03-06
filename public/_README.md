# public/ — Frontend (What the User Sees)

Everything inside `public/` is sent directly to the browser. This is the **client-side** code — HTML pages, images, and (eventually) JavaScript files.

## Folder Structure

```
public/
├── pages/              → HTML pages (the screens the user sees)
│   ├── index.html      → Landing page (public, no login needed)
│   ├── login.html      → Login form
│   ├── dashboard.html  → Coach's main view (athletes overview, alerts)
│   ├── atletas.html    → Athlete management (create, edit, list)
│   ├── app.html        → Athlete portal (read-only view for athletes)
│   ├── progreso.html   → Progress/fitness charts (ATL/CTL/TSB)
│   ├── finance.html    → Payment tracking and billing
│   └── configuracion.html → Settings
└── assets/
    └── images/         → Logo, favicon, decorative images
```

## How Frontend Connects to Backend

The HTML pages use **JavaScript `fetch()`** to call the backend API:

```javascript
// Example: get all athletes from the backend
const token = localStorage.getItem('token');
const res = await fetch('/api/athletes', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const athletes = await res.json();
```

Key concepts:
1. **Login stores a token:** When the coach logs in, the backend returns a JWT token. The frontend saves it in `localStorage`.
2. **Every request sends the token:** Protected endpoints need the `Authorization: Bearer <token>` header.
3. **Frontend reads JSON, updates HTML:** The backend returns data as JSON. JavaScript receives it and modifies the page (inserting table rows, updating text, etc).

## How Express Serves These Files

In `server.js`:
```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

This line tells Express: "serve everything in `public/` as static files." So `public/pages/login.html` is accessible at `http://localhost:3000/pages/login.html`.

## Tech Stack

- **HTML** — page structure
- **Tailwind CSS** (loaded from CDN) — styling with utility classes like `class="text-sm font-bold bg-white"`
- **Bootstrap Icons** (loaded from CDN) — icons like `<i class="bi bi-people"></i>`
- **Vanilla JavaScript** — no React, no Vue, just plain JS with `fetch()` for API calls

## Connection to Backend

```
public/ (browser)  ←→  src/ (server)

pages/login.html    →  POST /api/auth/login
pages/atletas.html  →  GET/POST/PUT/DELETE /api/athletes
pages/dashboard.html → GET /api/athletes (+ future: alerts, fitness data)
pages/finance.html  →  GET/POST/PUT /api/finances
```

The frontend and backend are completely separate. They only communicate through HTTP requests (fetch calls) and JSON responses.
