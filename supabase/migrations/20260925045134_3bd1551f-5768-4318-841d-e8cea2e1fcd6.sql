CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('gym','dsa','system_design','vqar','project','application')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date, category)
);
GRANT SELECT, INSERT, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activity" ON public.activity_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own activity" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own activity" ON public.activity_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);