# src/ — Backend (Server-Side Code)

Everything inside `src/` runs on the **server** (Node.js). The user never sees this code directly — it processes requests and talks to the database.

## Folder Structure

```
src/
├── routes/        → Step 1: Receives the HTTP request (the URL)
├── middleware/     → Step 1.5: Checks if the user is logged in (JWT token)
├── controllers/   → Step 2: Processes the request (validates, decides what to do)
├── models/        → Step 3: Talks to the PostgreSQL database (SQL queries)
├── services/      → Helper tools (file parsing, S3 uploads, webhooks)
└── db/            → Database connection setup
```

## How They Connect (The Request Journey)

When someone calls `GET /api/athletes`, this is what happens step by step:

```
1. server.js          → Express receives the request
2. routes/athletes.js  → Matches "/api/athletes" to a controller function
3. middleware/auth.js   → Checks the JWT token (is the user logged in?)
4. controllers/athleteController.js → Validates input, calls the model
5. models/athleteModel.js           → Runs SQL query against PostgreSQL
6. controllers/athleteController.js → Gets the data back, sends JSON response
```

The data flows DOWN (request) and then back UP (response). Each layer has ONE job:
- **Routes** = "which URL goes to which function?"
- **Middleware** = "is this request allowed?"
- **Controllers** = "what do I do with this request?"
- **Models** = "what data do I need from the database?"
- **Services** = "I need help with something specific (S3, .FIT files, n8n)"

## Key Concept: Why Separate Layers?

If you put everything in one file, it becomes impossible to maintain. By separating:
- You can change how the database works (model) without touching the request handling (controller)
- You can add new routes without rewriting business logic
- Multiple routes can reuse the same model function
