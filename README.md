<div align="center">
  <br />
  <a href="https://youtu.be/rOpEN1JDaD0?si=WfOjLV57WfR9x6QK" target="_blank">
    <img src="./public/assets/images/hero_readme.png" alt="Rundurance Banner" width="600">
  </a>
  <br />

  <h1>Rundurance</h1>
  <p><strong>A coaching platform for running coaches</strong></p>

  <div>
    <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Amazon_S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white" alt="Amazon S3" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white" alt="n8n" />
  </div>
</div>

---

## Description

**Rundurance** is a web platform for running coaches. It enables athlete management, training plan uploads, workout analysis via `.FIT` file parsing, and financial tracking. The project is architected for simplicity and maintainability.

### Key Features

- **Athlete management** - registration, profiles, and individual tracking
- **Coach profiles** - registration, profile management, password change
- **Training plans** - upload and link `.ZWO` (Zwift) and `.FIT` (Garmin) files to athletes
- **Workout analysis** - parse binary `.FIT` files into JSON with heart rate, cadence, laps, and training load metrics
- **Automated pipeline** - `.FIT` uploaded → S3 → n8n → AI feedback → coach alert
- **Financial tracking** - athlete payment records and due date alerts

---

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Frontend     | HTML5, CSS3, Vanilla JavaScript            |
| Styles       | Tailwind CSS (CDN) + Bootstrap Icons (CDN) |
| Backend      | Node.js + Express.js                       |
| Database     | PostgreSQL 16 (`pg`)                       |
| Storage      | Amazon S3 (`@aws-sdk/client-s3`)           |
| Automation   | n8n (webhook for AI feedback)              |
| Auth         | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| File uploads | multer (memoryStorage) + fit-file-parser   |

---

## Project Structure

```
rundurance/
├── server.js                    # Express entry point (port 3000)
├── docs/
│   └── database/
│       ├── schema.sql           # PostgreSQL 16 schema
│       └── migration_001_simplify.sql  # Simplification migration
├── public/                      # Static frontend files
│   ├── pages/
│   │   ├── login.html
│   │   ├── dashboard.html       # Coach overview
│   │   ├── atletas.html         # Athlete management
│   │   ├── finanzas.html        # Financial tracking
│   │   ├── configuracion.html   # Profile settings
│   │   └── progreso.html        # Progress tracking
│   └── assets/
│       ├── images/              # Logo, icons
│       ├── js/                  # Per-page vanilla JS (fetch API)
│       │   ├── api.js           # Auth & HTTP utilities
│       │   ├── login.js
│       │   ├── dashboard.js
│       │   ├── atletas.js
│       │   ├── finanzas.js
│       │   ├── configuracion.js
│       │   └── progreso.js
│       └── css/                 # Custom styles
└── src/
    ├── controllers/             # Route handlers (delegate to models)
    │   ├── authController.js
    │   ├── athleteController.js
    │   ├── financeController.js
    │   └── workoutController.js
    ├── models/                  # SQL queries via pg pool
    │   ├── userModel.js         # Trainer CRUD
    │   ├── athleteModel.js      # Athlete CRUD
    │   ├── financeModel.js      # Payment tracking
    │   └── workoutModel.js      # Workout upload & analysis
    ├── routes/                  # Express routers (all protected by JWT)
    │   ├── auth.js              # /api/auth
    │   ├── athletes.js          # /api/athletes
    │   ├── finances.js          # /api/finances
    │   └── workouts.js          # /api/workouts
    ├── services/
    │   ├── fitParser.js         # .FIT binary → JSON parsing
    │   ├── s3.js                # S3 upload/retrieval
    │   └── n8n.js               # n8n webhook triggers
    ├── middleware/
    │   └── auth.js              # JWT verification
    └── db/
        └── connection.js        # pg Pool singleton
```

---

## Database Schema

### Core Tables

| Table                   | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `trainer`               | Coaches (role: 'coach' or 'admin'); has `phone`, `email`   |
| `athlete`               | Athletes managed by trainer; soft-deleted via `is_active`  |
| `workout_plan`          | Training blocks assigned to an athlete                     |
| `planned_workout`       | Individual sessions within a plan (links to `.ZWO` files)  |
| `completed_workout`     | Executed sessions from `.FIT` uploads (aggregated metrics) |
| `completed_workout_lap` | Per-lap breakdown from completed workouts                  |
| `workout_feedback`      | AI or coach feedback on completed sessions                 |
| `payment`               | Monthly fee tracking; statuses: 'pendiente', 'pagado'      |

### Design Notes

- **Soft deletes**: `trainer.is_active` and `athlete.is_active` default to `TRUE`; set to `FALSE` to deactivate instead of deleting records
- **Parameterized queries**: All SQL uses `$1, $2, ...` placeholders to prevent SQL injection

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <https://github.com/Riwi-io-Medellin/rundurance-integrative-project-mccarthy>
cd rundurance-integrative-project-mccarthy
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```env
PORT=3000

# PostgreSQL
DATABASE_URL=postgres://user:password@host:5432/runduranceDB

# JWT
JWT_SECRET=your_strong_random_secret_here

# Amazon S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET=your-bucket-name

# n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/rundurance
```

### 3. Initialize the database

Run `schema.sql` against your PostgreSQL instance.

### 4. Start the server

```bash
npm run dev    # Development (nodemon, hot reload)
npm start      # Production
```

---

## Development Notes

### Architecture & Simplicity

This project is architected for clarity and maintainability. Key decisions:

- **Vanilla JavaScript frontend** - No build step, no framework overhead. ES6 modules via `<script type="module">`.
- **Tailwind CSS + Bootstrap Icons** - Loaded via CDN. No CSS preprocessing.
- **MVC pattern** - Routes → Controllers → Models → SQL. Clear separation of concerns.
- **Minimal dependencies** - Core libraries only: `pg`, `bcryptjs`, `jsonwebtoken`, `multer`, `@aws-sdk/client-s3`, `fit-file-parser`.

### Commands

```bash
npm install        # Install dependencies
npm run dev        # Start with nodemon (hot reload) — development
npm start          # Start with node — production
```

---

## Supported Data Formats

- **`.FIT`** - Garmin binary activity files (HR, GPS, cadence, training load)
- **`.ZWO`** - Zwift XML workout files (structured intervals, pace zones, power %)
- **JSON** - `.FIT` parser output for DB/API storage

---

## License

MIT
