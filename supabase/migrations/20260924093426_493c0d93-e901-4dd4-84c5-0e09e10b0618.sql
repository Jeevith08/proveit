ALTER TABLE public.profiles DROP CONSTRAINT profiles_college_check, DROP CONSTRAINT profiles_dream_check, DROP CONSTRAINT profiles_goal_check, DROP CONSTRAINT profiles_name_check, DROP CONSTRAINT profiles_passion_check, DROP CONSTRAINT profiles_tagline_check;
ALTER TABLE public.profiles
 ADD CONSTRAINT profiles_college_check CHECK (college IS NULL OR char_length(college) <= 160),
 ADD CONSTRAINT profiles_dream_check CHECK (dream IS NULL OR char_length(dream) <= 500),
 ADD CONSTRAINT profiles_goal_check CHECK (goal IS NULL OR char_length(goal) <= 500),
 ADD CONSTRAINT profiles_name_check CHECK (name IS NULL OR char_length(name) <= 100),
 ADD CONSTRAINT profiles_passion_check CHECK (passion IS NULL OR char_length(passion) <= 300),
 ADD CONSTRAINT profiles_tagline_check CHECK (tagline IS NULL OR char_length(tagline) <= 180);