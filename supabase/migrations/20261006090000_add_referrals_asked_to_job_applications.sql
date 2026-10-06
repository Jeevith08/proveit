-- Migration: Add referrals_asked column to job_applications
-- Tracks how many referrals the candidate has requested for this application

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS referrals_asked integer DEFAULT 0;
