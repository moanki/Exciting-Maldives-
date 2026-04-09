-- Safe and Idempotent Migration for Bulk Import System
-- This migration adds the necessary tables and columns without dropping existing data.

-- 1. Import Batches
create table if not exists public.import_batches (
  id uuid default gen_random_uuid() primary key,
  batch_type text not null, -- 'resort_pdf_import', 'media_import', 'mixed_import'
  source_type text not null, -- 'local_upload', 'zip', 'folder', 'google_drive', 'dropbox', 'scrape'
  source_ref text, -- e.g., folder ID, URL
  status text not null check (status in ('ingested', 'reviewing', 'partially_approved', 'approved', 'published', 'failed', 'rolled_back')) default 'ingested',
  created_by uuid references auth.users(id) on delete set null,
  summary_json jsonb default '{}'::jsonb,
  error_log_json jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Resort Staging
create table if not exists public.resort_staging (
  id uuid default gen_random_uuid() primary key,
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  extracted_json jsonb, -- Raw data from AI
  normalized_json jsonb, -- Mapped data for resorts table
  confidence_score numeric,
  duplicate_candidate_resort_id uuid references public.resorts(id) on delete set null,
  review_status text not null check (review_status in ('pending', 'approved', 'rejected', 'edited')) default 'pending',
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Media Staging
create table if not exists public.media_staging (
  id uuid default gen_random_uuid() primary key,
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  resort_staging_id uuid references public.resort_staging(id) on delete cascade,
  target_resort_id uuid references public.resorts(id) on delete set null,
  original_filename text,
  original_url text,
  staged_storage_path text,
  inferred_category_key text,
  inferred_subcategory text,
  inferred_room_type_name text,
  reviewer_override_category_key text,
  reviewer_override_subcategory text,
  reviewer_override_room_type_name text,
  confidence_score numeric,
  duplicate_candidate_media_id uuid references public.resort_media(id) on delete set null,
  sha256 text,
  phash text,
  width integer,
  height integer,
  bytes bigint,
  review_status text not null check (review_status in ('pending', 'approved', 'rejected', 'edited')) default 'pending',
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add published_at column to staging if it doesn't exist (for idempotency)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='resort_staging' and column_name='published_at') then
    alter table public.resort_staging add column published_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='media_staging' and column_name='published_at') then
    alter table public.media_staging add column published_at timestamptz;
  end if;
end $$;

-- Enable RLS
alter table public.import_batches enable row level security;
alter table public.resort_staging enable row level security;
alter table public.media_staging enable row level security;

-- Drop old broad policies if they exist
drop policy if exists "Admins can manage import batches" on public.import_batches;
drop policy if exists "Admins can manage resort staging" on public.resort_staging;
drop policy if exists "Admins can manage media staging" on public.media_staging;

-- 4. Restrictive Policies
-- Only users with admin/superadmin/content_manager roles in profiles can manage staging
create policy "Admins can manage import batches" on public.import_batches 
  for all using (auth.uid() in (select id from public.profiles where role in ('admin', 'superadmin', 'content_manager')));

create policy "Admins can manage resort staging" on public.resort_staging 
  for all using (auth.uid() in (select id from public.profiles where role in ('admin', 'superadmin', 'content_manager')));

create policy "Admins can manage media staging" on public.media_staging 
  for all using (auth.uid() in (select id from public.profiles where role in ('admin', 'superadmin', 'content_manager')));

-- 5. Indexes
create index if not exists idx_resort_staging_batch_id on public.resort_staging(import_batch_id);
create index if not exists idx_media_staging_batch_id on public.media_staging(import_batch_id);
create index if not exists idx_media_staging_resort_staging_id on public.media_staging(resort_staging_id);
create index if not exists idx_media_staging_target_resort_id on public.media_staging(target_resort_id);
create index if not exists idx_import_batches_status on public.import_batches(status);
create index if not exists idx_resort_staging_status on public.resort_staging(review_status);
create index if not exists idx_media_staging_status on public.media_staging(review_status);

-- 6. Feature Flag in Site Settings
-- Ensure the setting exists in site_settings if the table exists
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'site_settings') then
    insert into public.site_settings (key, value, description)
    values ('bulk_import_enabled', 'true', 'Enable the bulk resort and media import workflow')
    on conflict (key) do nothing;
  end if;
end $$;
