-- ==========================================================
-- 🏫 CampusMate AI — Supabase Database Setup Script
-- Run this script inside the SQL Editor of your Supabase Project.
-- ==========================================================

-- 1. Create the public students table
create table if not exists public.students (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) on public.students
alter table public.students enable row level security;

-- 3. Create policies for Row Level Security
-- Allow students to read only their own profile
create policy "Allow students to read their own profile"
  on public.students for select
  using (auth.uid() = auth_user_id);

-- Allow students to update only their own profile
create policy "Allow students to update their own profile"
  on public.students for update
  using (auth.uid() = auth_user_id);

-- Allow profile creation during sign-up
create policy "Allow public inserts for registration"
  on public.students for insert
  with check (true);

-- 4. Automate updated_at updates
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_updated_at
  before update on public.students
  for each row
  execute function public.handle_updated_at();
