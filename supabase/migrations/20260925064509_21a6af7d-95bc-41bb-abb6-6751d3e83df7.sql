create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;

create table public.daily_tasks (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), log_date date not null default current_date, title text not null check (char_length(title) between 1 and 80), status text not null default 'pending' check (status in ('pending','completed','missed')), reason text check (char_length(reason) <= 180), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, log_date, title));
create table public.college_checkins (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), log_date date not null default current_date, attended boolean not null, reason text check (char_length(reason) <= 180), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, log_date));
create table public.learning_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), log_date date not null default current_date, track text not null check (track in ('DSA','System Design','VQAR','Domain Learning')), topic text not null check (char_length(topic) between 1 and 120), hours numeric(4,1) not null check (hours > 0 and hours <= 24), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.projects (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), name text not null check (char_length(name) between 1 and 100), description text check (char_length(description) <= 300), status text not null default 'planning' check (status in ('planning','building','completed','live')), link text check (char_length(link) <= 300), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.job_applications (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), company text not null check (char_length(company) between 1 and 100), role text not null check (char_length(role) between 1 and 100), stage text not null default 'Applied' check (stage in ('Shortlisted','Applied','Interview','Offer')), applied_on date not null default current_date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.monthly_goals (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), month date not null default date_trunc('month', current_date)::date, title text not null check (char_length(title) between 1 and 100), target integer not null check (target > 0 and target <= 10000), progress integer not null default 0 check (progress >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());

do $$ declare t text; begin
  foreach t in array array['daily_tasks','college_checkins','learning_sessions','projects','job_applications','monthly_goals'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Own rows select" on public.%I for select to authenticated using (auth.uid() = user_id)', t);
    execute format('create policy "Own rows insert" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy "Own rows update" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "Own rows delete" on public.%I for delete to authenticated using (auth.uid() = user_id)', t);
    execute format('create trigger touch_%s before update on public.%I for each row execute function public.touch_updated_at()', t, t);
    execute format('create index %s_user_idx on public.%I (user_id)', t, t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end $$;
alter publication supabase_realtime add table public.activity_logs;