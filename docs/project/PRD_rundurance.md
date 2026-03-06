# Product Requirements Document (PRD)

## Rundurance — AI-Powered Coach Management Platform

**Version:** 1.1
**Date:** 2026-03-05
**Status:** Draft

---

## 1. Overview

### 1.1 Product Vision

Rundurance is an all-in-one web platform that eliminates coach burnout by automating workout data analysis, centralizing athlete management, and providing a premium progress portal — so coaches can scale their business without sacrificing personalization.

### 1.2 Problem Statement

High-performance endurance coaches spend ~70% of their time on data analysis and administrative tasks (manual feedback, billing, session review) and only ~30% actually coaching. Existing tools like TrainingPeaks provide raw data but no interpretation layer. This leads to:

- Mental fatigue from manual, one-by-one feedback delivery
- Lack of personalization at scale
- Disorganized financial management that stalls business growth
- Repetitive Excel/spreadsheet workflows with poor data interpretation

### 1.3 Product Goals

1. Reduce non-coaching time for the coach by ≥50%
2. Automate AI-generated workout feedback aligned to the coach's personal criteria
3. Centralize athlete management, training plans, and billing in one platform
4. Provide athletes with a motivating, self-service progress portal

---

## 2. Target Users

### Primary User: The Coach

**Persona: Mauricio**

- Age: 25–30 | Location: Medellín, Colombia
- Occupation: Running coach (10K, 21K, Marathon)
- Trains athletes with 100% individualized plans (his core value promise)
- Has strong technical criteria for metrics (cadence, power, HRV, pace)
- Currently overwhelmed by one-by-one analysis and manual audio feedback
- Goal: Automate the repetitive without losing his technical standard

**Target Segment:** Personal trainers, endurance academies (running, cycling, triathlon), and fitness coaches looking to scale without sacrificing analysis quality.

### Secondary User: The Athlete

- Needs visibility into their own training history and progress
- Wants to understand feedback, not just receive it
- Motivated by visual progress tracking and clear goal alignment

---

## 3. User Stories

### Coach

| ID  | As a coach, I want to...                                          | So that...                                                |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| C1  | Upload a .FIT file for a completed workout                        | The system processes and stores all metrics automatically |
| C2  | View a summary dashboard of all my athletes                       | I can quickly identify who needs attention                |
| C3  | Receive AI-generated feedback on each workout                     | I don't have to write manual analysis one-by-one          |
| C4  | Create and assign training plans with .ZWO files                  | Athletes have structured sessions to follow               |
| C5  | See ATL/CTL/TSB (Forma/Fatiga) charts per athlete                 | I can detect overtraining or underload risk early         |
| C6  | Get alerts for missed sessions, overtraining, or overdue payments | I don't miss critical events across my roster             |
| C7  | Manage billing and payment status per athlete                     | I keep my finances organized without a separate tool      |
| C8  | Customize AI feedback parameters to match my coaching criteria    | Feedback sounds like me, not a generic bot                |

| C10 | Export financial reports as PDF | I can share or archive billing records easily |
| C11 | See a competition countdown for each athlete on the dashboard | I know which athletes have races coming up soon |
| C12 | Set and update the training plan status for each athlete | I have a quick visual of where each athlete stands |

### Athlete

| ID  | As an athlete, I want to...                       | So that...                                |
| --- | ------------------------------------------------- | ----------------------------------------- |
| A1  | See my completed workout history with key metrics | I understand my progress over time        |
| A2  | Read my coach's feedback after each session       | I know what to improve and feel supported |
| A3  | View my upcoming planned workouts                 | I know what to do each day                |
| A4  | See my fitness/fatigue trend (CTL/ATL/TSB)        | I understand my training load visually    |

---

## 4. Functional Requirements

### 4.1 Authentication & Roles

- **FR-01:** Coaches log in with email + password (JWT-based auth)
- **FR-02:** Athletes may optionally have login access (nullable password in schema)
- **FR-03:** Role-based access: `coach`, `admin`; athlete portal is read-only

### 4.2 Athlete Management

- **FR-04:** Coach can create, edit, and deactivate athlete profiles
- **FR-05:** Each athlete is linked to one trainer
- **FR-06:** Athlete profile includes: name, document, email, birth date
- **FR-06b:** Each athlete profile includes an optional **next competition date** field
- **FR-06c:** Athlete profile displays a **training plan status block** showing current plan state: `pendiente`, `cargado`, `completado`, or `programado`

### 4.3 Training Plan Management

- **FR-07:** Coach creates workout plans with category (Resistencia, Velocidad, Fuerza, Recuperación), dates, and description
- **FR-08:** Plans contain individual planned sessions (`planned_workout`) with scheduled date, name, description, optional `.ZWO` file (stored in S3), planned duration and distance
- **FR-09:** Coach can upload `.ZWO` structured workout files per session

### 4.4 .FIT File Upload & Processing

<!-- - **FR-10:** Coach uploads a `.FIT` file for a completed workout -->

- **FR-11:** System parses the `.FIT` file and extracts all metrics (see Data Model §6)
- **FR-12:** Parsed metrics are stored in `completed_workout` and `completed_workout_lap`
- **FR-13:** Raw `.FIT` file is stored in S3; GPS track data is discarded from DB
- **FR-14:** System attempts to match the completed workout to a planned session by date

### 4.5 AI Feedback

- **FR-15:** After a `.FIT` file is processed, an n8n workflow triggers AI analysis
- **FR-16:** AI generates feedback text based on workout metrics + coach-defined parameters
- **FR-17:** Feedback is stored in `workout_feedback` with `source = 'ai'`
- **FR-18:** Coach can add or override feedback manually (`source = 'coach'`)
- **FR-19:** Coach can configure their AI agent's analysis criteria (tone, focus metrics, thresholds)

### 4.6 Coach Dashboard

- **FR-20:** Dashboard shows all active athletes with key status indicators
- **FR-21:** Active alerts displayed: overtraining (`sobrentrenamiento`), missed sessions (`sesion_perdida`), overdue payments (`pago_vencido`), and upcoming competition countdown (`competencia_proxima`)
- **FR-21b:** Dashboard shows a **competition countdown** for each athlete with a `next_competition_date` set — displaying days remaining until their nearest race
- **FR-22:** Per-athlete view shows: recent workouts, upcoming plan, ATL/CTL/TSB trend chart, payment status
- **FR-23:** ATL/CTL/TSB data sourced from weekly `athlete_fitness_snapshot` table
- **FR-23:** Coach can select with a checkbox if he already upload a workout per athlete just to have a visual reference of it

### 4.7 Athlete Portal

- **FR-24:** Athlete views their own workout history, metrics, and feedback
- **FR-25:** Athlete sees their upcoming planned sessions
- **FR-26:** Athlete can view their CTL/ATL/TSB trend chart
- **FR-27:** Athlete cannot edit any data; portal is read-only

### 4.8 Financial Management

- **FR-28:** Coach creates payment records per athlete with amount, due date, and notes
- **FR-29:** Payment statuses: `pendiente`, `pagado`, `vencido`
- **FR-30:** Coach marks payments as paid (sets `paid_at` timestamp)
- **FR-31:** Finance view shows all athletes' billing status at a glance; all financial operations are accessible from this single view
- **FR-32:** Payment grace period logic:
  - Days 0–5 after `due_date` without `paid_at` → status remains `pendiente`
  - After 5 days without `paid_at` → status auto-transitions to `vencido`
- **FR-33:** System sends a **WhatsApp notification** to athletes whose payments are in `pendiente` state (within the 5-day grace window) as a reminder
- **FR-34:** Coach can export financial reports as **PDF** from the Finance view

---

## 5. Non-Functional Requirements

| ID     | Requirement                                                                   |
| ------ | ----------------------------------------------------------------------------- |
| NFR-01 | The app must be responsive (mobile + desktop)                                 |
| NFR-02 | .FIT file upload must complete processing in < 30 seconds                     |
| NFR-03 | AI feedback generation must complete in < 60 seconds of upload                |
| NFR-04 | All athlete data must be isolated per trainer (no cross-trainer data leakage) |
| NFR-05 | Passwords stored as hashed values only (bcrypt or equivalent)                 |
| NFR-06 | .FIT and .ZWO files stored in AWS S3; only S3 keys stored in DB               |
| NFR-07 | Platform must support at least 50 concurrent athletes per coach at launch     |

---

## 6. Data Model Summary

Based on the confirmed PostgreSQL schema:

| Table                      | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `trainer`                  | Coach accounts and roles                                  |
| `athlete`                  | Athletes linked to a trainer                              |
| `workout_category`         | Plan categories (Resistencia, Velocidad, etc.)            |
| `workout_plan`             | Training blocks assigned to an athlete                    |
| `planned_workout`          | Individual sessions within a plan (.ZWO support)          |
| `completed_workout`        | Executed sessions from .FIT file upload with full metrics |
| `completed_workout_lap`    | Per-lap breakdown of completed workouts                   |
| `workout_feedback`         | AI or coach-written feedback per session                  |
| `athlete_fitness_snapshot` | Weekly ATL/CTL/TSB snapshots per athlete                  |
| `athlete_alert`            | Active alerts for the coach dashboard                     |
| `payment`                  | Monthly billing tracking per athlete                      |

**Key metrics stored per completed workout:** duration, distance, avg/max heart rate, avg pace, cadence, total ascent, training load, calories, aerobic/anaerobic training effect, RPE, Stryd power, vertical oscillation, stance time, step length, vertical ratio.

---

## 7. Technical Architecture

### Stack

| Layer                         | Technology                                        |
| ----------------------------- | ------------------------------------------------- |
| Frontend                      | HTML5, CSS3, Tailwind, Boostrap icons, Vanilla JS |
| Backend                       | Node.js + Express                                 |
| Database                      | PostgreSQL                                        |
| Automation / AI Orchestration | n8n (webhooks, ETL, AI agent triggers)            |
| File Storage                  | AWS S3 (.FIT, .ZWO)                               |
| .FIT Parser                   | `fit-file-parser` (Node.js)                       |

### Data Flow

```
Athlete's Garmin/Device
    ↓ exports .FIT file
Coach uploads .FIT to Rundurance
    ↓
Backend parses .FIT → stores metrics in PostgreSQL
    ↓
n8n webhook triggered → AI agent analyzes metrics
    ↓
AI feedback stored → visible to coach + athlete
```

### TrainingPeaks Integration

- TrainingPeaks API is restricted (requires partner registration + OAuth 2.0)
- **Current approach:** Manual `.FIT` / `.TCX` export from TrainingPeaks or Garmin Connect

---

## 8. Features & Scope

### MVP (v1.0) — In Scope

- [x] Coach authentication and profile
- [x] Athlete CRUD management
- [x] Workout plan creation with planned sessions + .ZWO upload
- [x] .FIT file upload and automatic metric parsing
- [x] Per-workout and per-lap data storage
- [x] AI feedback generation via n8n pipeline
- [x] Coach dashboard with athlete overview and alerts
- [x] ATL/CTL/TSB chart visualization
- [x] Athlete read-only portal
- [x] Payment/billing management
- [x] Payment 5-day grace period logic (`pendiente` → `vencido`)
- [x] WhatsApp payment reminder notifications (via n8n)
- [x] PDF export for financial reports
- [x] Competition countdown alert per athlete
- [x] Training plan status block on athlete profile (`pendiente`, `cargado`, `completado`, `programado`)

---

## 9. Success Metrics

| Metric                                  | Target                                    |
| --------------------------------------- | ----------------------------------------- |
| Time spent on manual analysis per coach | Reduced by ≥50%                           |
| Feedback delivery time per session      | < 60 seconds (AI) vs. hours (manual)      |
| Coach NPS                               | ≥ 8/10 after 30 days                      |
| Athletes with portal login              | ≥70% activation rate                      |
| Overdue payment detection               | 100% auto-flagged before manual follow-up |

---

## 10. Assumptions & Constraints

- Coaches export `.FIT` files manually from Garmin Connect or TrainingPeaks (no auto-sync at launch)
- All users are Spanish-speaking (Colombian market initially)
- n8n is self-hosted and managed by the team
- AWS S3 costs are acceptable at current scale
- Athletes use Garmin devices as primary data source (Stryd as optional power meter); Garmin represents ~80–90% of all workout data
- WhatsApp notifications are delivered via n8n automation (no direct WhatsApp Business API integration at launch)
