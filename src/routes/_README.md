# routes/ — URL Mapping

Routes are the **entry point** for every API request. They answer one question: **"When someone calls this URL, which function should run?"**

## How It Works

```javascript
// This says: when someone calls GET /api/athletes, run controller.getAll
router.get('/', auth, controller.getAll);
```

Each route has three parts:
1. **HTTP method** — `get`, `post`, `put`, `delete`
2. **Path** — the URL after `/api/athletes` (e.g., `/:id` means `/api/athletes/5`)
3. **Handler(s)** — middleware and/or controller function to run

## Connection to Other Folders

```
routes/ uses:
  ├── middleware/auth.js  → to protect routes (only logged-in users)
  └── controllers/        → to handle the actual logic
```

## Files in This Folder

| File | Base URL | Status |
|------|----------|--------|
| auth.js | `/api/auth` | DONE — register, login |
| workouts.js | `/api/workouts` | DONE — upload .FIT, save feedback, get by athlete |
| athletes.js | `/api/athletes` | TODO — CRUD for athletes |
| finances.js | `/api/finances` | TODO — payment management |

## How Routes Are Mounted

In `server.js`, each router is "mounted" at a base path:

```javascript
app.use('/api/auth',     authRouter);      // auth.js handles everything under /api/auth
app.use('/api/athletes', athletesRouter);   // athletes.js handles everything under /api/athletes
```

So if `athletes.js` defines `router.get('/:id', ...)`, the full URL is `/api/athletes/:id`.

## The `auth` Middleware

When you see `auth` before the controller, it means that route is **protected**:

```javascript
router.get('/', auth, controller.getAll);   // needs token
router.post('/login', controller.login);     // no auth needed (user is logging in!)
```

The `auth` middleware checks the JWT token. If valid, it adds `req.trainer` with the coach's info. If not, it returns 401 (unauthorized).
