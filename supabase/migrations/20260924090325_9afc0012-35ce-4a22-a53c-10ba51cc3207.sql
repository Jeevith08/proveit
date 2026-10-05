CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  college text NOT NULL CHECK (char_length(college) BETWEEN 1 AND 160),
  passout_year integer NOT NULL CHECK (passout_year BETWEEN 2000 AND 2100),
  goal text NOT NULL CHECK (char_length(goal) BETWEEN 1 AND 500),
  tagline text NOT NULL CHECK (char_length(tagline) BETWEEN 1 AND 180),
  passion text NOT NULL CHECK (char_length(passion) BETWEEN 1 AND 300),
  dream text NOT NULL CHECK (char_length(dream) BETWEEN 1 AND 500),
  date_of_birth date NOT NULL,
  resume_path text CHECK (resume_path IS NULL OR char_length(resume_path) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profiles_updated_at();

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can replace their own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can remove their own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);