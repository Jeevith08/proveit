-- ============================================================
-- Prove It — Complete Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- or via: supabase db push (after setting up supabase CLI)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 0. Helper trigger function (shared by all tables)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- 1. profiles
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id       uuid        PRIMARY KEY,
  name          text        CHECK (char_length(name) BETWEEN 1 AND 100),
  college       text        CHECK (char_length(college) BETWEEN 1 AND 160),
  passout_year  integer     CHECK (passout_year BETWEEN 2000 AND 2100),
  goal          text        CHECK (char_length(goal) BETWEEN 1 AND 500),
  tagline       text        CHECK (char_length(tagline) BETWEEN 1 AND 180),
  passion       text        CHECK (char_length(passion) BETWEEN 1 AND 300),
  dream         text        CHECK (char_length(dream) BETWEEN 1 AND 500),
  date_of_birth date,
  resume_path   text        CHECK (resume_path IS NULL OR char_length(resume_path) <= 500),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "profiles: own insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles: own update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles: own delete" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────
-- 2. activity_logs  (streaks & badges)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  log_date   date        NOT NULL,
  category   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date, category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs: own select" ON public.activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "activity_logs: own insert" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_logs: own update" ON public.activity_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_logs: own delete" ON public.activity_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS activity_logs_user_idx ON public.activity_logs (user_id);

-- ──────────────────────────────────────────────────────────────
-- 3. daily_tasks
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid(),
  log_date   date        NOT NULL DEFAULT current_date,
  title      text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  status     text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'completed', 'missed')),
  reason     text        CHECK (char_length(reason) <= 180),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date, title)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_tasks: own select" ON public.daily_tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "daily_tasks: own insert" ON public.daily_tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_tasks: own update" ON public.daily_tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_tasks: own delete" ON public.daily_tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_daily_tasks
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS daily_tasks_user_idx ON public.daily_tasks (user_id);

-- ──────────────────────────────────────────────────────────────
-- 4. college_checkins
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.college_checkins (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid(),
  log_date   date        NOT NULL DEFAULT current_date,
  attended   boolean     NOT NULL,
  reason     text        CHECK (char_length(reason) <= 180),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_checkins TO authenticated;
GRANT ALL ON public.college_checkins TO service_role;
ALTER TABLE public.college_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "college_checkins: own select" ON public.college_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "college_checkins: own insert" ON public.college_checkins
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "college_checkins: own update" ON public.college_checkins
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "college_checkins: own delete" ON public.college_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_college_checkins
  BEFORE UPDATE ON public.college_checkins
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS college_checkins_user_idx ON public.college_checkins (user_id);

-- ──────────────────────────────────────────────────────────────
-- 5. learning_sessions
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL DEFAULT auth.uid(),
  log_date   date           NOT NULL DEFAULT current_date,
  track      text           NOT NULL
               CHECK (track IN ('DSA', 'System Design', 'VQAR', 'Domain Learning')),
  topic      text           NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 120),
  hours      numeric(4, 1)  NOT NULL CHECK (hours > 0 AND hours <= 24),
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_sessions TO authenticated;
GRANT ALL ON public.learning_sessions TO service_role;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_sessions: own select" ON public.learning_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "learning_sessions: own insert" ON public.learning_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_sessions: own update" ON public.learning_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_sessions: own delete" ON public.learning_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_learning_sessions
  BEFORE UPDATE ON public.learning_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS learning_sessions_user_idx ON public.learning_sessions (user_id);

-- ──────────────────────────────────────────────────────────────
-- 6. projects
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL DEFAULT auth.uid(),
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text        CHECK (char_length(description) <= 300),
  status      text        NOT NULL DEFAULT 'planning'
                CHECK (status IN ('planning', 'building', 'completed', 'live')),
  link        text        CHECK (char_length(link) <= 300),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: own select" ON public.projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "projects: own insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects: own update" ON public.projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects: own delete" ON public.projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS projects_user_idx ON public.projects (user_id);

-- ──────────────────────────────────────────────────────────────
-- 7. job_applications
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_applications (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL DEFAULT auth.uid(),
  company          text        NOT NULL CHECK (char_length(company) BETWEEN 1 AND 100),
  role             text        NOT NULL CHECK (char_length(role) BETWEEN 1 AND 100),
  stage            text        NOT NULL DEFAULT 'Applied'
                     CHECK (stage IN ('Shortlisted', 'Applied', 'Interview', 'Offer', 'Selected', 'Rejected')),
  round            text,
  reason           text,
  rejection_reason text,
  applied_on       date        NOT NULL DEFAULT current_date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_applications: own select" ON public.job_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "job_applications: own insert" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_applications: own update" ON public.job_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "job_applications: own delete" ON public.job_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_job_applications
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS job_applications_user_idx ON public.job_applications (user_id);

-- ──────────────────────────────────────────────────────────────
-- 8. monthly_goals
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monthly_goals (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid(),
  month      date        NOT NULL DEFAULT date_trunc('month', current_date)::date,
  title      text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  target     integer     NOT NULL CHECK (target > 0 AND target <= 10000),
  progress   integer     NOT NULL DEFAULT 0 CHECK (progress >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_goals TO authenticated;
GRANT ALL ON public.monthly_goals TO service_role;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_goals: own select" ON public.monthly_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "monthly_goals: own insert" ON public.monthly_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_goals: own update" ON public.monthly_goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_goals: own delete" ON public.monthly_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE TRIGGER touch_monthly_goals
  BEFORE UPDATE ON public.monthly_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS monthly_goals_user_idx ON public.monthly_goals (user_id);

-- ──────────────────────────────────────────────────────────────
-- 9. Realtime — subscribe to live changes on all tables
-- ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.daily_tasks,
  public.college_checkins,
  public.learning_sessions,
  public.projects,
  public.job_applications,
  public.monthly_goals,
  public.activity_logs;

-- ──────────────────────────────────────────────────────────────
-- 10. Storage bucket for resumes (run once)
-- ──────────────────────────────────────────────────────────────
-- Uncomment if the 'resumes' bucket does not exist yet:
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('resumes', 'resumes', false)
--   ON CONFLICT DO NOTHING;

CREATE POLICY "resumes: own view" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resumes: own upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resumes: own replace" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "resumes: own remove" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
