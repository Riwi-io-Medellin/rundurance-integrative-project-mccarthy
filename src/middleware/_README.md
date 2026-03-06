# middleware/ — Request Interceptors

Middleware runs **between** the route and the controller. It can inspect, modify, or reject a request before it reaches the controller.

## How It Works

```
Request → Route → [Middleware] → Controller
                      ↑
              If token is invalid,
              the request STOPS here
              and returns 401 error
```

## File: auth.js

This is the only middleware in the project. It does:

1. Reads the `Authorization` header from the request
2. Expects format: `Bearer eyJhbGciOi...` (the JWT token)
3. Verifies the token using `JWT_SECRET` from `.env`
4. If valid: adds `req.trainer` object with `{ trainer_id, email, role }` and calls `next()` to continue
5. If invalid/missing: returns `401 Unauthorized` and the request stops

## Why This Matters

After `auth` runs, every controller can access `req.trainer.trainer_id` to know **which coach** is making the request. This is how we ensure coaches only see their own athletes and payments — we filter by `trainer_id` in every query.

## Connection to Other Folders

```
middleware/auth.js is used by:
  ├── routes/athletes.js  → protects all athlete endpoints
  ├── routes/workouts.js  → protects upload and listing (but NOT the n8n feedback callback)
  └── routes/finances.js  → protects all finance endpoints
```

Note: The `POST /api/workouts/:id/feedback` route does NOT use auth — because n8n (an external service) calls it, and n8n doesn't have a JWT token.
