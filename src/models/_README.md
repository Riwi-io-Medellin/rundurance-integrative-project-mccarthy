# models/ — Database Queries

Models are the **only** layer that talks to PostgreSQL. Each model file contains functions that run SQL queries and return the results.

## What a Model Does (Always the Same Pattern)

```javascript
async function findById(athleteId) {
  const { rows } = await db.query(
    'SELECT * FROM athlete WHERE athlete_id = $1',
    [athleteId]
  );
  return rows[0] ?? null;
}
```

Every model function follows these steps:
1. Call `db.query(sql, params)` — runs the SQL query
2. Destructure `{ rows }` — PostgreSQL always returns an object with a `rows` array
3. Return the data — either `rows` (array), `rows[0]` (single object), or `rows[0] ?? null`

## Key Concept: Parameterized Queries ($1, $2, ...)

**NEVER** do this (SQL injection vulnerability):
```javascript
// BAD — a hacker could send malicious input
db.query(`SELECT * FROM athlete WHERE email = '${email}'`);
```

**ALWAYS** do this:
```javascript
// GOOD — PostgreSQL safely escapes the value
db.query('SELECT * FROM athlete WHERE email = $1', [email]);
```

The `$1` is a placeholder. The actual value comes from the array `[email]`. PostgreSQL handles escaping so hackers can't inject SQL.

## Common SQL Operations

| Operation | SQL | Returns |
|-----------|-----|---------|
| Get all | `SELECT * FROM table WHERE condition` | `rows` (array) |
| Get one | `SELECT * FROM table WHERE id = $1` | `rows[0] ?? null` |
| Create | `INSERT INTO table (...) VALUES ($1,$2) RETURNING *` | `rows[0]` (the new row) |
| Update | `UPDATE table SET col=$1 WHERE id=$2 RETURNING *` | `rows[0]` (the updated row) |
| Soft delete | `UPDATE table SET is_active=FALSE WHERE id=$1` | `rows[0]` |

The `RETURNING *` at the end makes PostgreSQL return the row it just created/updated, so you can send it back to the frontend.

## Connection to Other Folders

```
models/ uses:
  └── db/connection.js → the database connection pool

models/ is used by:
  └── controllers/     → controllers call model functions to get/save data
```

## Files in This Folder

| File | Table(s) | Status |
|------|----------|--------|
| userModel.js | `trainer` | DONE — findByEmail, createTrainer |
| workoutModel.js | `completed_workout`, `completed_workout_lap`, `workout_feedback`, `planned_workout` | DONE |
| athleteModel.js | `athlete` | TODO — CRUD operations |
| financeModel.js | `payment` | TODO — payment operations + grace period logic |

## Where to Find Table Definitions

All columns and types are defined in `docs/database/schema.sql`. Always check it before writing a query to know the exact column names and types.
