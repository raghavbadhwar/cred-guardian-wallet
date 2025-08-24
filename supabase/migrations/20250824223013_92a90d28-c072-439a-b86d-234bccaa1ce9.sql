
-- DigiLocker connections: store per-user OAuth tokens and metadata
create table if not exists public.digilocker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject_id text,                               -- DigiLocker user identifier (e.g., uid)
  token_type text not null default 'Bearer',
  access_token text not null,                    -- store encrypted from edge function
  refresh_token text,                            -- store encrypted from edge function
  scope text,
  expires_at timestamptz not null,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional helpful indexes
create index if not exists idx_digilocker_connections_user on public.digilocker_connections(user_id);
create index if not exists idx_digilocker_connections_subject on public.digilocker_connections(subject_id);

-- Keep updated_at fresh
drop trigger if exists trg_digilocker_connections_updated_at on public.digilocker_connections;
create trigger trg_digilocker_connections_updated_at
before update on public.digilocker_connections
for each row execute function public.update_updated_at_column();

-- Enable RLS and restrict to record owner
alter table public.digilocker_connections enable row level security;

drop policy if exists "Select own digilocker connections" on public.digilocker_connections;
create policy "Select own digilocker connections"
on public.digilocker_connections
for select
using (auth.uid() = user_id);

drop policy if exists "Insert own digilocker connections" on public.digilocker_connections;
create policy "Insert own digilocker connections"
on public.digilocker_connections
for insert
with check (auth.uid() = user_id);

drop policy if exists "Update own digilocker connections" on public.digilocker_connections;
create policy "Update own digilocker connections"
on public.digilocker_connections
for update
using (auth.uid() = user_id);

drop policy if exists "Delete own digilocker connections" on public.digilocker_connections;
create policy "Delete own digilocker connections"
on public.digilocker_connections
for delete
using (auth.uid() = user_id);


-- Track imported DigiLocker documents to dedupe and audit
create table if not exists public.digilocker_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  doc_id text not null,                          -- DigiLocker document id / URI
  doc_type text,                                 -- e.g., 'edu:mark_sheet', 'id:aadhaar_masked'
  title text,
  issuer text,
  issued_at timestamptz,
  raw_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Prevent duplicates per user for the same DigiLocker document
create unique index if not exists uq_digilocker_imports_user_doc
on public.digilocker_imports(user_id, doc_id);

create index if not exists idx_digilocker_imports_user on public.digilocker_imports(user_id);

-- Enable RLS and restrict to record owner
alter table public.digilocker_imports enable row level security;

drop policy if exists "Select own digilocker imports" on public.digilocker_imports;
create policy "Select own digilocker imports"
on public.digilocker_imports
for select
using (auth.uid() = user_id);

drop policy if exists "Insert own digilocker imports" on public.digilocker_imports;
create policy "Insert own digilocker imports"
on public.digilocker_imports
for insert
with check (auth.uid() = user_id);

drop policy if exists "Delete own digilocker imports" on public.digilocker_imports;
create policy "Delete own digilocker imports"
on public.digilocker_imports
for delete
using (auth.uid() = user_id);
