-- =====================================================
-- Rundurance - PostgreSQL Schema
-- =====================================================

-- -----------------------------------------------------
-- trainer
-- Coaches who use the platform to manage athletes
-- -----------------------------------------------------
CREATE TABLE trainer (
  trainer_id    SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  document      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'coach', -- 'coach', 'admin'
  phone         VARCHAR(30),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------
-- athlete
-- Athletes managed by a trainer
-- -----------------------------------------------------
CREATE TABLE athlete (
  athlete_id    SERIAL PRIMARY KEY,
  trainer_id    INT          NOT NULL REFERENCES trainer(trainer_id),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  document      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255),           -- nullable: athlete may not log in
  birth_date    DATE,
  phone         VARCHAR(30),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------
-- workout_plan
-- A training block assigned to an athlete by a trainer
-- -----------------------------------------------------
CREATE TABLE workout_plan (
  workout_plan_id     SERIAL PRIMARY KEY,
  athlete_id          INT          NOT NULL REFERENCES athlete(athlete_id),
  trainer_id          INT          NOT NULL REFERENCES trainer(trainer_id),
  name                VARCHAR(200) NOT NULL,
  description         TEXT,
  start_date          DATE         NOT NULL,
  end_date            DATE,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------
-- planned_workout
-- Individual sessions within a plan (can have a .ZWO file)
-- -----------------------------------------------------
CREATE TABLE planned_workout (
  planned_workout_id  SERIAL PRIMARY KEY,
  workout_plan_id     INT          NOT NULL REFERENCES workout_plan(workout_plan_id),
  scheduled_date      DATE         NOT NULL,
  name                VARCHAR(200),
  description         TEXT,
  zwo_s3_key          VARCHAR(500),           -- path to .ZWO file in S3
  planned_duration_s  INT,                    -- planned duration in seconds
  planned_distance_m  NUMERIC(10, 2),         -- planned distance in meters
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------
-- completed_workout
-- An executed session uploaded as a .FIT file.
-- Links back to planned_workout when matched by date.
-- -----------------------------------------------------
CREATE TABLE completed_workout (
  completed_workout_id       SERIAL PRIMARY KEY,
  athlete_id                 INT           NOT NULL REFERENCES athlete(athlete_id),
  planned_workout_id         INT           REFERENCES planned_workout(planned_workout_id), -- nullable: may be unplanned
  executed_at                TIMESTAMPTZ   NOT NULL,
  fit_s3_key                 VARCHAR(500),              -- path to .FIT file in S3
  -- Core metrics
  duration_s                 INT,                       -- actual duration in seconds
  distance_m                 NUMERIC(10, 2),            -- actual distance in meters
  avg_heart_rate_bpm         INT,
  max_heart_rate_bpm         INT,
  avg_pace_sec_per_km        INT,                       -- pace as seconds/km
  avg_cadence_spm            INT,                       -- steps per minute
  total_ascent_m             NUMERIC(6, 3),
  training_load              NUMERIC(12, 2),            -- Garmin training_load_peak raw value
  total_calories             INT,
  -- Training quality
  aerobic_training_effect    NUMERIC(3, 1),             -- 0.0–5.0
  anaerobic_training_effect  NUMERIC(3, 1),             -- 0.0–5.0
  workout_rpe                INT,                       -- 1–10 perceived exertion
  workout_feel               INT,                       -- Garmin feel score
  -- Stryd running power
  avg_power_w                INT,
  max_power_w                INT,
  avg_form_power_w           INT,
  -- Running dynamics
  avg_vertical_oscillation_mm NUMERIC(5, 1),
  avg_stance_time_ms          NUMERIC(6, 1),
  avg_step_length_mm          NUMERIC(7, 1),
  avg_vertical_ratio          NUMERIC(4, 2),
  status                     VARCHAR(20)   NOT NULL DEFAULT 'completed', -- 'completed', 'partial', 'skipped'
  created_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------
-- completed_workout_lap
-- Per-lap breakdown of a completed workout.
-- GPS records are discarded — raw .FIT stays in S3.
-- -----------------------------------------------------
CREATE TABLE completed_workout_lap (
  lap_id                      SERIAL PRIMARY KEY,
  completed_workout_id        INT           NOT NULL REFERENCES completed_workout(completed_workout_id),
  lap_number                  INT           NOT NULL,
  start_time                  TIMESTAMPTZ,
  total_distance_m            NUMERIC(10, 2),
  duration_s                  NUMERIC(10, 3),
  avg_speed_km_h              NUMERIC(6, 2),
  total_calories              INT,
  avg_heart_rate_bpm          INT,
  max_heart_rate_bpm          INT,
  avg_cadence_spm             INT,
  avg_power_w                 INT,                       -- Stryd lap power
  avg_form_power_w            INT,
  total_ascent_m              NUMERIC(6, 3),
  avg_vertical_oscillation_mm NUMERIC(5, 1),
  avg_stance_time_ms          NUMERIC(6, 1),
  intensity                   VARCHAR(20),               -- 'active', 'warmup', 'cooldown'
  lap_trigger                 VARCHAR(20)                -- 'distance', 'manual', 'time'
);


-- -----------------------------------------------------
-- workout_feedback
-- AI-generated or coach-written feedback on a completed session.
-- Triggered via n8n → S3 → AI pipeline.
-- -----------------------------------------------------
CREATE TABLE workout_feedback (
  workout_feedback_id  SERIAL PRIMARY KEY,
  completed_workout_id INT         NOT NULL REFERENCES completed_workout(completed_workout_id),
  trainer_id           INT         REFERENCES trainer(trainer_id), -- nullable: AI feedback has no trainer
  source               VARCHAR(20) NOT NULL DEFAULT 'ai',          -- 'ai', 'coach'
  feedback             TEXT        NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------
-- payment
-- Monthly fee tracking per athlete. Powers finance.html.
-- Statuses: 'pendiente', 'pagado', 'vencido'
-- -----------------------------------------------------
CREATE TABLE payment (
  payment_id  SERIAL PRIMARY KEY,
  athlete_id  INT           NOT NULL REFERENCES athlete(athlete_id),
  trainer_id  INT           NOT NULL REFERENCES trainer(trainer_id),
  amount      NUMERIC(12, 2) NOT NULL,
  due_date    DATE           NOT NULL,
  paid_at     TIMESTAMPTZ,                    -- null if not yet paid
  status      VARCHAR(20)    NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'vencido'
  notes       TEXT,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
