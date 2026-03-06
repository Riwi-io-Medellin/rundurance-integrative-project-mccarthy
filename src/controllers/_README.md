# controllers/ — Request Handlers (The Brain)

Controllers are the **brain** of each request. They receive the HTTP request, decide what to do, call the model, and send back the response.

## What a Controller Does (Always the Same Pattern)

```javascript
async function create(req, res) {
  try {
    // 1. Extract data from the request
    const { first_name, last_name } = req.body;

    // 2. Validate (return 400 if something is wrong)
    if (!first_name) return res.status(400).json({ error: 'Nombre requerido' });

    // 3. Call the model (database operation)
    const athlete = await athleteModel.create({ first_name, last_name, ... });

    // 4. Return the result as JSON
    return res.status(201).json(athlete);
  } catch (err) {
    // 5. If anything breaks, return 500
    console.error('Error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
```

## Where Data Comes From in `req`

| Property | What it contains | Example |
|----------|-----------------|---------|
| `req.body` | JSON data sent by the frontend (POST/PUT) | `{ "first_name": "Juan", "email": "juan@mail.com" }` |
| `req.params` | Values from the URL path | `/api/athletes/:id` → `req.params.id = "5"` |
| `req.query` | Values from the URL query string | `?limit=10` → `req.query.limit = "10"` |
| `req.trainer` | Logged-in coach info (set by auth middleware) | `{ trainer_id: 1, email: "coach@mail.com", role: "coach" }` |
| `req.files` | Uploaded files (set by multer middleware) | The .FIT file buffer |

## HTTP Status Codes Used

| Code | Meaning | When to use |
|------|---------|------------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (something was created) |
| 400 | Bad Request | Missing or invalid input |
| 401 | Unauthorized | No token or invalid token |
| 404 | Not Found | ID doesn't exist in database |
| 409 | Conflict | Duplicate email/document |
| 500 | Server Error | Something broke (catch block) |

## Connection to Other Folders

```
controllers/ uses:
  ├── models/     → to read/write data from the database
  └── services/   → for specialized tasks (S3, .FIT parsing, n8n)

controllers/ is used by:
  └── routes/     → routes call controller functions
```

## Files in This Folder

| File | Status | What it handles |
|------|--------|----------------|
| authController.js | DONE | Register and login (creates JWT tokens) |
| workoutController.js | DONE | Upload .FIT files, save feedback, list workouts |
| athleteController.js | TODO | Create, read, update, deactivate athletes |
| financeController.js | TODO | Create payments, list payments, mark as paid |
