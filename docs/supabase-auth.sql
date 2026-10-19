-- Brew Coffee application user/profile table.
-- This table is intended to be associated with Supabase Auth's auth.users table
-- and will support future branch-specific authorization and Row Level Security.

create extension if not exists citext;

create type public.app_role as enum ('owner', 'admin', 'branch');

create table if not exists public.app_users (
  uuid uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  role public.app_role not null default 'branch',
  branch_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branch_role_requires_branch_id
    check (
      (role = 'branch' and branch_id is not null) or role in ('owner', 'admin')
    )
);

create index if not exists app_users_email_idx on public.app_users (email);
create index if not exists app_users_role_idx on public.app_users (role);
create index if not exists app_users_branch_idx on public.app_users (branch_id);

alter table public.app_users enable row level security;

create policy "Users can read their own profile"
  on public.app_users
  for select
  using (auth.uid() = uuid);

create policy "Owners can manage all profiles"
  on public.app_users
  for all
  using (
    exists (
      select 1
      from public.app_users as owner_profile
      where owner_profile.uuid = auth.uid()
        and owner_profile.role = 'owner'
    )
  );

-- Future branch-level authorization can be enforced with policies such as:
--   using (auth.uid() = uuid or branch_id = current_setting('app.branch_id', true))
-- and by storing the branch association in the same table.
