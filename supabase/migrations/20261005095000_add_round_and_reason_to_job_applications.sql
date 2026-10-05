-- Migration: Add round, reason, and rejection_reason columns to job_applications
-- Also update check constraint to allow 'Selected' and 'Rejected' alongside 'Shortlisted', 'Applied', 'Interview', 'Offer'

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS round text,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update the stage check constraint
ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_stage_check;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_stage_check
  CHECK (stage IN ('Shortlisted', 'Applied', 'Interview', 'Offer', 'Selected', 'Rejected'));
