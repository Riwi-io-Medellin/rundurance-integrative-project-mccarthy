# db/ — Database Connection

This folder has one file: `connection.js`. It creates and exports the **connection pool** to PostgreSQL.

## What is a Connection Pool?

Instead of opening a new database connection for every query (slow), a pool keeps several connections open and reuses them. Think of it like a team of waiters — instead of hiring a new waiter for each table, you have a team that takes turns.

## How It Works

```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

- Reads `DATABASE_URL` from the `.env` file
- Format: `postgres://user:password@host:5432/database_name`
- Exports a `query` function that all models use

## How Models Use It

Every model imports this file and calls `db.query()`:

```javascript
const db = require('../db/connection');

const { rows } = await db.query('SELECT * FROM athlete WHERE athlete_id = $1', [id]);
```

## Connection to Other Folders

```
db/connection.js is used by:
  └── models/ → every model file imports db to run queries
```

This is the ONLY file that connects to PostgreSQL. No other file should create database connections.
