# MVC Architecture — Why We Built Rundurance This Way

## What is MVC?

MVC stands for **Model - View - Controller**. It's a way to organize code by splitting it into three responsibilities:

| Layer          | Responsibility                                                           | In Rundurance                |
| -------------- | ------------------------------------------------------------------------ | ---------------------------- |
| **Model**      | Talks to the database                                                    | `src/models/`                |
| **View**       | What the user sees                                                       | `public/pages/` (HTML files) |
| **Controller** | Connects the two — receives requests, processes logic, returns responses | `src/controllers/`           |

Think of it like a restaurant:

- **Model** = the kitchen (prepares the food / data)
- **View** = the table and plate (how the food is presented to the customer)
- **Controller** = the waiter (takes the order, brings it to the kitchen, delivers the food back)

The customer (browser) never goes into the kitchen (database). The waiter (controller) handles everything in between.

---

## Why MVC? Why Not Just One Big File?

Imagine you put everything in `server.js` — routes, database queries, validation, HTML responses — all in 2,000 lines. Now imagine:

- Dev 1 needs to change how athletes are saved to the database
- Dev 2 needs to change the athletes HTML page
- Dev 3 needs to add a new route for finances

All three would be editing the **same file** at the **same time**. Merge conflicts everywhere. Nobody knows where anything is. One typo breaks everything.

With MVC, each developer works on a **different file** with a **clear scope**:

```
Dev 1 → src/models/athleteModel.js      (only database queries)
Dev 2 → public/pages/atletas.html        (only the HTML page)
Dev 3 → src/routes/finances.js           (only the URL mapping)
         src/controllers/financeController.js (only the logic)
         src/models/financeModel.js       (only the queries)
```

No conflicts. Clear boundaries. Each file has ONE job.

---

## The Full Request Lifecycle

Let's trace what happens when a coach opens the Athletes page and the browser calls `GET /api/athletes`:

```
BROWSER (public/pages/atletas.html)
  │
  │  JavaScript runs: fetch('/api/athletes', { headers: { Authorization: 'Bearer xxx' } })
  │
  ▼
SERVER (server.js)
  │
  │  Express receives the request
  │  Matches /api/athletes → athletesRouter
  │
  ▼
ROUTE (src/routes/athletes.js)
  │
  │  router.get('/', auth, controller.getAll)
  │  First runs 'auth' middleware, then runs 'controller.getAll'
  │
  ▼
MIDDLEWARE (src/middleware/auth.js)
  │
  │  Reads the Authorization header
  │  Verifies the JWT token
  │  Sets req.trainer = { trainer_id: 1, email: '...', role: 'coach' }
  │  Calls next() → continues to controller
  │
  ▼
CONTROLLER (src/controllers/athleteController.js)
  │
  │  async function getAll(req, res) {
  │    const trainerId = req.trainer.trainer_id;   // who is asking?
  │    const athletes = await athleteModel.findAllByTrainer(trainerId);
  │    return res.json(athletes);                   // send JSON back
  │  }
  │
  ▼
MODEL (src/models/athleteModel.js)
  │
  │  async function findAllByTrainer(trainerId) {
  │    const { rows } = await db.query(
  │      'SELECT * FROM athlete WHERE trainer_id = $1 AND is_active = TRUE',
  │      [trainerId]
  │    );
  │    return rows;
  │  }
  │
  ▼
DATABASE (PostgreSQL)
  │
  │  Runs the SQL query
  │  Returns rows: [{ athlete_id: 1, first_name: 'Juan', ... }, ...]
  │
  ▼
... then the data travels back UP the chain:

  MODEL returns rows → CONTROLLER receives them → sends res.json(athletes) → BROWSER receives JSON

BROWSER (public/pages/atletas.html)
  │
  │  const athletes = await res.json();
  │  // Loop through athletes, create HTML table rows, display on page
```

---

## Why We Added Extra Layers Beyond MVC

Pure MVC only has three layers. Rundurance adds a few more because real projects need them:

### Routes (`src/routes/`)

In classic MVC, the controller handles URL matching too. We separate it because:

- Routes are easy to read at a glance ("what endpoints exist?")
- You can add/remove endpoints without touching business logic
- Multiple routes can point to the same controller function

### Middleware (`src/middleware/`)

Code that runs **before** the controller on multiple routes. Without middleware, you'd copy-paste the JWT verification code into every single controller function. With middleware, you write it once and reuse it:

```javascript
// Without middleware (BAD — repeated code in every controller)
async function getAll(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // ... now do the actual work
}

// With middleware (GOOD — auth runs before controller, once)
router.get("/", auth, controller.getAll);
// By the time getAll runs, req.trainer already exists
```

### Services (`src/services/`)

Specialized tools that aren't database queries and aren't request handlers. They solve a specific technical problem:

- **fitParser** — knows how to read binary .FIT files from Garmin watches
- **s3** — knows how to upload/download files from Amazon S3
- **n8n** — knows how to call the AI feedback webhook

Without services, the workout controller would be 300+ lines long with .FIT parsing logic, S3 upload logic, and webhook logic all mixed together. By extracting them into services, the controller stays clean and focused:

```javascript
// Controller stays simple — delegates to services
const { summary, laps } = await parseFit(file.buffer); // service
const fitS3Key = await uploadFitFile(buffer, athleteId); // service
triggerFeedback(athlete, summary, laps, fitS3Key, id); // service
```

### Database Connection (`src/db/`)

A single place that manages the PostgreSQL connection pool. Every model imports it. This means:

- If we change the database URL, we change ONE file
- If we switch from PostgreSQL to another database, we change ONE file
- Models don't need to know HOW to connect — they just call `db.query()`

---

## The Folder Map (How Everything Connects)

```
server.js                          ← App entry point. Starts Express, mounts routes.
│
├── src/
│   ├── routes/                    ← URL → function mapping
│   │   ├── auth.js                    POST /api/auth/register, /login
│   │   ├── workouts.js                POST /api/workouts/upload, /:id/feedback
│   │   ├── athletes.js                GET/POST/PUT/DELETE /api/athletes
│   │   └── finances.js                GET/POST/PUT /api/finances
│   │
│   ├── middleware/                 ← Runs between route and controller
│   │   └── auth.js                    Verifies JWT, sets req.trainer
│   │
│   ├── controllers/               ← Request handlers (the brain)
│   │   ├── authController.js          Register, login
│   │   ├── workoutController.js       Upload .FIT, save feedback, list workouts
│   │   ├── athleteController.js       CRUD athletes (TODO)
│   │   └── financeController.js       Payment management (TODO)
│   │
│   ├── models/                    ← Database queries (SQL)
│   │   ├── userModel.js               Trainer queries (findByEmail, create)
│   │   ├── workoutModel.js            Workout/lap/feedback queries
│   │   ├── athleteModel.js            Athlete queries (TODO)
│   │   └── financeModel.js            Payment queries (TODO)
│   │
│   ├── services/                  ← External system integrations
│   │   ├── fitParser.js               Binary .FIT → JSON
│   │   ├── s3.js                      AWS S3 upload/download
│   │   └── n8n.js                     AI feedback webhook
│   │
│   └── db/                        ← Database connection
│       └── connection.js              PostgreSQL pool
│
└── public/                        ← Frontend (served to browser)
    ├── pages/                     ← HTML screens
    │   ├── index.html                 Landing page
    │   ├── login.html                 Login form
    │   ├── dashboard.html             Coach overview
    │   ├── atletas.html               Athlete management
    │   ├── finance.html               Billing/payments
    │   ├── progreso.html              Fitness charts
    │   ├── app.html                   Athlete portal
    │   └── configuracion.html         Settings
    └── assets/
        └── images/                    Logo, favicon
```

---

## The Golden Rules

1. **Models never touch `req` or `res`.** They receive plain data (a number, a string, an object) and return plain data. They don't know about HTTP.

2. **Controllers never write SQL.** They call model functions. If you need a new query, add it to the model.

3. **Routes never contain logic.** They're just one line: connect a URL to a controller function (with optional middleware).

4. **Services never touch the database.** They handle external tools (S3, n8n, file parsing). If a service needs database data, the controller should fetch it first and pass it in.

5. **Frontend never calls the database.** It uses `fetch()` to call API endpoints. The backend is the only thing that talks to PostgreSQL.

---

## How to Add a New Feature (Step by Step)

Let's say you need to add "list payments for an athlete." Follow this order:

**Step 1: Model** — Write the SQL query

```javascript
// src/models/financeModel.js
async function findByAthlete(athleteId) {
  const { rows } = await db.query(
    "SELECT * FROM payment WHERE athlete_id = $1 ORDER BY due_date DESC",
    [athleteId],
  );
  return rows;
}
```

**Step 2: Controller** — Handle the request, call the model

```javascript
// src/controllers/financeController.js
async function getByAthlete(req, res) {
  try {
    const athleteId = parseInt(req.params.athleteId, 10);
    const payments = await financeModel.findByAthlete(athleteId);
    return res.json(payments);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Error al obtener pagos" });
  }
}
```

**Step 3: Route** — Connect the URL

```javascript
// src/routes/finances.js
router.get("/athlete/:athleteId", auth, controller.getByAthlete);
```

**Step 4: Frontend** — Call the API and display

```javascript
// Inside public/pages/finance.html <script>
const res = await apiFetch("/api/finances/athlete/5");
const payments = await res.json();
// Build HTML table rows from payments array
```

Always build **bottom-up**: Model first (can test with Postman), then Controller, then Route, then Frontend. Each layer builds on the one below it.
