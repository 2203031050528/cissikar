-- 1. Create custom users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  roll_number text unique,
  name text not null,
  role text not null check (role in ('student', 'admin')),
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS if you need, or disable RLS for direct reads:
alter table public.users disable row level security;

-- 2. Insert Test Admin User (Password is 'password123')
insert into public.users (email, name, role, password_hash)
values (
  'admin@test.com',
  'System Administrator',
  'admin',
  '$2b$10$EPYt1gA5/9k.0K.1X5v/Eu7R5n7bY4gBf5D1bJ9D6O0iP8cO5sKOC'
) on conflict (email) do nothing;

-- 3. Insert Test Student User (Password is 'password123', Roll Number is '20261004')
insert into public.users (roll_number, name, role, password_hash)
values (
  '20261004',
  'Sarah Jenkins',
  'student',
  '$2b$10$EPYt1gA5/9k.0K.1X5v/Eu7R5n7bY4gBf5D1bJ9D6O0iP8cO5sKOC'
) on conflict (roll_number) do nothing;
