# Prove It — Database Queries, Page by Page

Every table is private: row-level security only lets you read or change rows where `user_id = auth.uid()`.
Every page listed below also **subscribes live** (realtime) to its tables, so changes from another tab or device show up at once.
`:me` = your user id, `:today` = today's date (YYYY-MM-DD), `:month` = first day of this month.

---

## 0. Tables (schema)

```sql
CREATE TABLE public.profiles (user_id uuid PRIMARY KEY, name text, college text, passout_year int, goal text,
  tagline text, passion text, dream text, date_of_birth date, resume_path text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE public.activity_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  log_date date NOT NULL, category text NOT NULL, created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, log_date, category));

CREATE TABLE public.daily_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  log_date date NOT NULL DEFAULT current_date, title text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','missed')),
  reason text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, log_date, title));

CREATE TABLE public.college_checkins (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  log_date date NOT NULL DEFAULT current_date, attended boolean NOT NULL, reason text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), UNIQUE (user_id, log_date));

CREATE TABLE public.learning_sessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  log_date date NOT NULL DEFAULT current_date,
  track text NOT NULL CHECK (track IN ('DSA','System Design','VQAR','Domain Learning')),
  topic text NOT NULL, hours numeric(4,1) NOT NULL CHECK (hours > 0 AND hours <= 24),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE public.projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, description text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','building','completed','live')),
  link text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE public.job_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  company text NOT NULL, role text NOT NULL,
  stage text NOT NULL DEFAULT 'Applied' CHECK (stage IN ('Shortlisted','Applied','Interview','Offer','Selected','Rejected')),
  round text, reason text, rejection_reason text,
  applied_on date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

CREATE TABLE public.monthly_goals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
  month date NOT NULL DEFAULT date_trunc('month', current_date)::date, title text NOT NULL,
  target int NOT NULL CHECK (target > 0), progress int NOT NULL DEFAULT 0 CHECK (progress >= 0),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- Realtime + security on every table
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tasks, public.college_checkins, public.learning_sessions,
  public.projects, public.job_applications, public.monthly_goals, public.activity_logs;
-- Each table: ENABLE ROW LEVEL SECURITY + policies "auth.uid() = user_id" for select/insert/update/delete.
```

---

## 1. Auth gate (every signed-in page)

```sql
SELECT user_id FROM profiles WHERE user_id = :me LIMIT 1;   -- no profile → go to Profile setup
```

## 2. Dashboard (`/`)

```sql
-- Load (all live)
SELECT * FROM daily_tasks       WHERE user_id = :me ORDER BY created_at DESC;   -- today's checklist
SELECT * FROM college_checkins  WHERE user_id = :me ORDER BY created_at DESC;   -- college Yes/No
SELECT * FROM learning_sessions WHERE user_id = :me ORDER BY created_at DESC;   -- "Learning today"
SELECT * FROM projects          WHERE user_id = :me ORDER BY created_at DESC;   -- active projects
SELECT * FROM job_applications  WHERE user_id = :me ORDER BY created_at DESC;   -- daily application
SELECT * FROM monthly_goals     WHERE user_id = :me ORDER BY created_at DESC;   -- monthly momentum
SELECT log_date, category FROM activity_logs WHERE user_id = :me;                -- streaks

-- Tick Yes / No / add mission / save missed reason
INSERT INTO daily_tasks (user_id, log_date, title, status, reason)
VALUES (:me, :today, 'DSA', 'missed', 'Exam prep')
ON CONFLICT (user_id, log_date, title) DO UPDATE SET status = EXCLUDED.status, reason = EXCLUDED.reason;

-- Streak log when a task is ticked Yes / un-ticked
INSERT INTO activity_logs (user_id, log_date, category) VALUES (:me, :today, 'dsa') ON CONFLICT DO NOTHING;
DELETE FROM activity_logs WHERE user_id = :me AND log_date = :today AND category = 'dsa';

-- College check-in
INSERT INTO college_checkins (user_id, log_date, attended, reason) VALUES (:me, :today, false, 'Fever')
ON CONFLICT (user_id, log_date) DO UPDATE SET attended = EXCLUDED.attended, reason = EXCLUDED.reason;

-- "Mark today's application" (streak board)
INSERT INTO activity_logs (user_id, log_date, category) VALUES (:me, :today, 'application') ON CONFLICT DO NOTHING;
```

## 3. History (`/history`)

```sql
SELECT * FROM daily_tasks       WHERE user_id = :me;   -- completed / missed + reasons per date
SELECT * FROM learning_sessions WHERE user_id = :me;   -- hours per date
SELECT * FROM monthly_goals     WHERE user_id = :me;   -- month progress
SELECT log_date, category FROM activity_logs WHERE user_id = :me;  -- streak up to selected date
```

## 4. Learning (`/learning`)

```sql
SELECT * FROM learning_sessions WHERE user_id = :me ORDER BY log_date DESC;
INSERT INTO learning_sessions (user_id, log_date, track, topic, hours) VALUES (:me, :today, 'DSA', 'Graphs – BFS', 2);
DELETE FROM learning_sessions WHERE id = :id AND user_id = :me;
```

## 5. Projects (`/projects`)

```sql
SELECT * FROM projects WHERE user_id = :me ORDER BY created_at DESC;
INSERT INTO projects (user_id, name, description, link) VALUES (:me, 'Prove It', 'Personal tracker', 'https://...');
UPDATE projects SET status = 'live' WHERE id = :id AND user_id = :me;
DELETE FROM projects WHERE id = :id AND user_id = :me;
```

## 6. Applications (`/applications`)

```sql
SELECT * FROM job_applications WHERE user_id = :me ORDER BY created_at DESC;
INSERT INTO job_applications (user_id, company, role, stage, applied_on) VALUES (:me, 'Zoho', 'SDE Intern', 'Applied', :today);
UPDATE job_applications SET stage = 'Interview' WHERE id = :id AND user_id = :me;
DELETE FROM job_applications WHERE id = :id AND user_id = :me;
```

## 7. Monthly Goals (`/monthly-goals`)

```sql
SELECT * FROM monthly_goals WHERE user_id = :me ORDER BY created_at DESC;   -- page filters month = :month
INSERT INTO monthly_goals (user_id, month, title, target) VALUES (:me, :month, 'Solve 60 DSA problems', 60);
UPDATE monthly_goals SET progress = progress + 1 WHERE id = :id AND user_id = :me;   -- + / − buttons
DELETE FROM monthly_goals WHERE id = :id AND user_id = :me;
```

## 8. Achievements (`/achievements`)

```sql
SELECT log_date, category FROM activity_logs WHERE user_id = :me;   -- streaks & badges (3/7/14/30/60/100 days)
INSERT INTO activity_logs (user_id, log_date, category) VALUES (:me, :today, 'application') ON CONFLICT DO NOTHING;
DELETE FROM activity_logs WHERE user_id = :me AND log_date = :today AND category = 'application';
```

## 9. Profile (`/profile`)

```sql
SELECT * FROM profiles WHERE user_id = :me;
INSERT INTO profiles (user_id, name, college, ...) VALUES (:me, ...)
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, college = EXCLUDED.college, ...;
SELECT log_date FROM activity_logs WHERE user_id = :me;   -- yearly heatmap
-- Resume: private file storage "resumes/<user_id>/resume.pdf" (not SQL)
```

## 10. Reminders (`/reminders`)

No database queries — reminder times and on/off switches are stored in this browser only.
