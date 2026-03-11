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

**Rundurance** is a web platform for running coaches. It allows create personalize feedbacks, monitoring athlete performance metrics, and tracking his finances.

### Key Features

- **Athlete management** - registration, profiles, and individual tracking
- **Training plans** - upload and link `.ZWO` (Zwift) and `.FIT` (Garmin) files
- **Workout analysis** - parse binary `.FIT` files into JSON with heart rate, cadence, laps, and training load metrics
- **Automated pipeline** - `.FIT` uploaded -> S3 -> n8n -> AI feedback -> coach alert
- **Finances** - athlete payment tracking
- **Coach dashboard** - compliance %, last session, alert status, fatigue/form

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
├── public/                      # Static files
│   ├── index.html               # Public landing page
│   ├── login.html               # Authentication
│   ├── athlete.html             # Coach dashboard: athletes
│   ├── finance.html             # Coach dashboard: finances
│   └── assets/
│       ├── images/              # Logo, favicon, athlete photos
│       ├── js/                  # Per-page vanilla JS (fetch API)
│       └── css/                 # Custom styles
└── src/
    ├── controllers/             # Route handlers (delegate to models)
    │   ├── authController.js
    │   ├── athleteController.js
    │   ├── financeController.js
    │   └── workoutController.js
    ├── models/                  # SQL queries via pg pool
    │   ├── userModel.js
    │   ├── athleteModel.js
    │   ├── financeModel.js
    │   └── workoutModel.js
    ├── routes/                  # Express routers
    │   ├── auth.js              # /api/auth
    │   ├── athletes.js          # /api/athletes
    │   ├── finances.js          # /api/finances
    │   └── workouts.js          # /api/workouts
    ├── services/
    │   ├── fitParser.js         # .FIT binary -> JSON
    │   ├── s3.js                # Upload/retrieve S3 files
    │   └── n8n.js               # Trigger n8n webhook
    ├── middleware/
    │   └── auth.js              # JWT verification
    └── db/
        └── connection.js        # pg Pool singleton
```

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

## API Endpoints

| Method | Route                        | Description                         | Auth |
| ------ | ---------------------------- | ----------------------------------- | ---- |
| POST   | `/api/auth/register`         | Register a coach                    | No   |
| POST   | `/api/auth/login`            | Login -> JWT                        | No   |
| GET    | `/api/athletes`              | List coach's athletes               | JWT  |
| POST   | `/api/athletes`              | Create athlete                      | JWT  |
| GET    | `/api/athletes/:id`          | Athlete profile                     | JWT  |
| GET    | `/api/workouts/athlete/:id`  | Workouts for an athlete             | JWT  |
| POST   | `/api/workouts/upload`       | Upload `.FIT` file -> S3 + DB + n8n | JWT  |
| POST   | `/api/workouts/:id/feedback` | Save n8n feedback                   | JWT  |

---

## Supported Data Formats

- **`.FIT`** - Garmin binary activity files (HR, GPS, cadence, training load)
- **`.ZWO`** - Zwift XML workout files (structured intervals, pace zones, power %)
- **JSON** - `.FIT` parser output for DB/API storage

---

## License

MIT
