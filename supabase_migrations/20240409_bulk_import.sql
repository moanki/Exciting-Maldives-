-- Refined Import Batch and Staging System

-- Drop existing if needed (be careful with data, but this is a dev phase)
drop table if exists public.media_staging;
drop table if exists public.resort_staging;
drop table if exists public.import_batches cascade;

-- 1. Import Batches
create table public.import_batches (
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
create table public.resort_staging (
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
create table public.media_staging (
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

-- Enable RLS
alter table public.import_batches enable row level security;
alter table public.resort_staging enable row level security;
alter table public.media_staging enable row level security;

-- Policies
create policy "Admins can manage import batches" on public.import_batches for all using (auth.uid() in (select id from public.profiles));
create policy "Admins can manage resort staging" on public.resort_staging for all using (auth.uid() in (select id from public.profiles));
create policy "Admins can manage media staging" on public.media_staging for all using (auth.uid() in (select id from public.profiles));

-- Indexes
create index idx_resort_staging_batch_id on public.resort_staging(import_batch_id);
create index idx_media_staging_batch_id on public.media_staging(import_batch_id);
create index idx_media_staging_resort_staging_id on public.media_staging(resort_staging_id);
create index idx_media_staging_target_resort_id on public.media_staging(target_resort_id);
create index idx_import_batches_status on public.import_batches(status);
