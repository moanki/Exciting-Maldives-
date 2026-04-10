-- Supabase Schema for Exciting Maldives

-- 1. Profiles (Admins)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('admin', 'superadmin', 'sales', 'content_manager')) default 'admin',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Agents (Partners)
create table if not exists public.agents (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  company_name text not null,
  country text not null,
  website text,
  phone text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Resorts
create table if not exists public.resorts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  atoll text not null,
  category text not null,
  transfer_type text not null,
  description text,
  images text[], -- Deprecated: Use resort_media table
  highlights text[],
  meal_plans text[],
  room_types jsonb[], -- Array of room type objects
  status text check (status in ('draft', 'reviewed', 'published')) default 'draft',
  location text,
  banner_url text,
  resort_url text,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.0.1 Resort Media Categories
create table if not exists public.resort_media_categories (
  id uuid primary key default gen_random_uuid(),
  resort_id uuid not null references public.resorts(id) on delete cascade,
  key text not null,
  label text not null,
  sort_order integer default 0,
  parent_category_id uuid references public.resort_media_categories(id) on delete set null,
  is_system boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(resort_id, key)
);

-- 3.1 Resort Media
create table if not exists public.resort_media (
  id uuid default gen_random_uuid() primary key,
  resort_id uuid references public.resorts on delete cascade,
  category text not null, -- hero, aerial, villa, dining, spa, activity, map (Legacy)
  category_id uuid references public.resort_media_categories(id) on delete set null,
  subcategory text,
  room_type_name text,
  asset_family text default 'gallery' check (asset_family in ('hero','gallery','thumb','document')),
  source_type text,
  source_url text,
  import_batch_id uuid, -- references public.import_batches added below
  original_filename text,
  sort_order integer default 0,
  alt_text text,
  is_featured boolean default false,
  is_hero boolean default false,
  storage_path text not null,
  width integer,
  height integer,
  status text check (status in ('pending', 'active', 'archived')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.1.1 Import Batches
create table if not exists public.import_batches (
  id uuid default gen_random_uuid() primary key,
  batch_type text not null, -- 'resort_pdf_import', 'media_import', 'mixed_import'
  source_type text not null, -- 'local_upload', 'zip', 'folder', 'google_drive', 'dropbox', 'scrape'
  source_ref text, -- e.g., folder ID, URL
  status text not null check (status in ('ingested', 'reviewing', 'partially_approved', 'approved', 'published', 'failed', 'rolled_back')) default 'ingested',
  created_by uuid references auth.users(id) on delete set null,
  summary_json jsonb default '{}'::jsonb,
  error_log_json jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.1.2 Resort Staging
create table if not exists public.resort_staging (
  id uuid default gen_random_uuid() primary key,
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  extracted_json jsonb, -- Raw data from AI
  normalized_json jsonb, -- Mapped data for resorts table
  confidence_score numeric,
  duplicate_candidate_resort_id uuid references public.resorts(id) on delete set null,
  review_status text not null check (review_status in ('pending', 'approved', 'rejected', 'edited')) default 'pending',
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.1.3 Media Staging
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
  reviewed_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key to resort_media
alter table public.resort_media add constraint fk_import_batch foreign key (import_batch_id) references public.import_batches(id);

-- 3.2 Resort Documents
create table if not exists public.resort_documents (
  id uuid default gen_random_uuid() primary key,
  resort_id uuid references public.resorts on delete cascade,
  title text not null,
  storage_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Booking Requests
create table if not exists public.booking_requests (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references auth.users on delete set null,
  resort_id uuid references public.resorts on delete set null,
  resort_name text not null,
  check_in date not null,
  check_out date not null,
  guests integer not null,
  room_type text not null,
  notes text,
  status text check (status in ('new', 'processing', 'confirmed', 'cancelled')) default 'new',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Site Settings (Page Customization)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Resources (Library)
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null,
  type text not null, -- e.g., 'PDF', 'Image'
  size text,
  file_url text not null,
  is_protected boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. PROTECTED RESOURCES (PASSWORD PROTECTED)
-- Rename old table if it exists to avoid conflict
do $$ 
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'protected_resources') then
    if not exists (select from pg_attribute where attrelid = 'public.protected_resources'::regclass and attname = 'passwords') then
      alter table public.protected_resources rename to resource_access_requests;
    end if;
  end if;
end $$;

create table if not exists public.protected_resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  file_url text not null,
  passwords text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Messages (Live Chat)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null, -- Can be guest_id or user_id
  sender_id uuid references auth.users(id) on delete set null,
  sender_type text check (sender_type in ('user', 'admin', 'guest')) not null,
  sender_name text,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Newsletter Submissions
create table if not exists public.newsletter_submissions (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  agency_name text not null,
  country text not null,
  phone text not null,
  email text not null,
  primary_market text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.resorts enable row level security;
alter table public.resort_media enable row level security;
alter table public.resort_documents enable row level security;
alter table public.booking_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.resources enable row level security;
alter table public.protected_resources enable row level security;
alter table public.messages enable row level security;
alter table public.newsletter_submissions enable row level security;
alter table public.import_batches enable row level security;
alter table public.resort_staging enable row level security;
alter table public.media_staging enable row level security;
alter table public.resource_access_requests enable row level security;

-- 10. Seed default categories for all resorts
insert into public.resort_media_categories (resort_id, key, label, sort_order, is_system)
select
  r.id,
  c.key,
  c.label,
  c.sort_order,
  true
from public.resorts r
cross join (
  values
    ('main_hero', 'Main Hero', 1),
    ('overview', 'Overview', 2),
    ('room_types', 'Room Types', 3),
    ('spa', 'Spa', 4),
    ('restaurants', 'Restaurants', 5),
    ('facilities', 'Facilities', 6),
    ('activities', 'Activities', 7),
    ('beaches', 'Beaches', 8),
    ('maps', 'Maps / Floor Plans', 9),
    ('logos', 'Logos', 10),
    ('uncategorized', 'Uncategorized', 99)
) as c(key, label, sort_order)
on conflict (resort_id, key) do nothing;

-- 11. Backfill old media into the new category model
update public.resort_media m
set category_id = c.id
from public.resort_media_categories c
where c.resort_id = m.resort_id
  and c.key = case
    when m.category = 'banner' then 'main_hero'
    when m.category = 'rooms' then 'room_types'
    when m.category = 'dining' then 'restaurants'
    when m.category = 'spa' then 'spa'
    when m.category = 'activities' then 'activities'
    when m.category = 'maps' then 'maps'
    when m.category = 'logos' then 'logos'
    else 'uncategorized'
  end
  and m.category_id is null;

-- 12. Add indexes
create index if not exists idx_resort_media_resort_id on public.resort_media(resort_id);
create index if not exists idx_resort_media_category_id on public.resort_media(category_id);
create index if not exists idx_resort_media_is_hero on public.resort_media(is_hero);
create index if not exists idx_resort_media_sort_order on public.resort_media(sort_order);
create index if not exists idx_resort_media_categories_resort_id on public.resort_media_categories(resort_id);

-- RLS Policies
create policy "Admins can read all newsletter submissions" on public.newsletter_submissions for select using (auth.uid() in (select id from public.profiles));
create policy "Public can insert newsletter submissions" on public.newsletter_submissions for insert with check (true);

-- Import Batches: Admins can manage
create policy "Admins can manage import batches" on public.import_batches 
  for all using (auth.uid() in (select id from public.profiles where role in ('admin', 'superadmin', 'content_manager')));

-- Resort Staging: Admins can manage
create policy "Admins can manage resort staging" on public.resort_staging 
  for all using (auth.uid() in (select id from public.profiles where role in ('admin', 'superadmin', 'content_manager')));

-- Media Staging: Admins can manage
create policy "Admins can manage media staging" on public.media_staging 
  for all using (auth.uid() in (select id from public.profiles where role in ('admin', 'superadmin', 'content_manager')));

-- RLS Policies

-- Profiles: Admins can read all, users can read own
create policy "Admins can read all profiles" on public.profiles for select using (auth.uid() in (select id from public.profiles));
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);

-- Agents: Admins can read all, users can read own
create policy "Admins can read all agents" on public.agents for select using (auth.uid() in (select id from public.profiles));
create policy "Users can read own agent profile" on public.agents for select using (auth.uid() = id);
create policy "Public can insert agent profile" on public.agents for insert with check (true);

-- Resorts: Public can read, Admins can manage
create policy "Public can read resorts" on public.resorts for select using (status = 'published');
create policy "Admins can manage resorts" on public.resorts for all using (auth.uid() in (select id from public.profiles));

-- Resort Media: Public can read, Admins can manage
create policy "Public can read resort media" on public.resort_media for select using (true);
create policy "Admins can manage resort media" on public.resort_media for all using (auth.uid() in (select id from public.profiles));

-- Resort Documents: Public can read, Admins can manage
create policy "Public can read resort documents" on public.resort_documents for select using (true);
create policy "Admins can manage resort documents" on public.resort_documents for all using (auth.uid() in (select id from public.profiles));

-- Booking Requests: Admins can read all, Agents can read/insert own
create policy "Admins can read all bookings" on public.booking_requests for select using (auth.uid() in (select id from public.profiles));
create policy "Agents can manage own bookings" on public.booking_requests for all using (auth.uid() = agent_id);

-- Site Settings: Public can read, Admins can manage
create policy "Public can read site settings" on public.site_settings for select using (true);
create policy "Admins can manage site settings" on public.site_settings for all using (auth.uid() in (select id from public.profiles));

-- Resources: Public can read, Admins can manage
create policy "Public can read resources" on public.resources for select using (not is_protected);
create policy "Agents can read granted resources" on public.resources for select using (
  id in (select resource_id from public.resource_access_requests where agent_id = auth.uid() and status = 'granted')
);
create policy "Admins can manage resources" on public.resources for all using (auth.uid() in (select id from public.profiles));

-- Protected Resources: Admins can manage, Public can view metadata (if they have the link)
create policy "Public can view protected resources metadata" on public.protected_resources for select using (true);
create policy "Admins can manage protected resources" on public.protected_resources for all using (auth.uid() in (select id from public.profiles where role in ('superadmin', 'admin', 'content_manager')));

-- Resource Access Requests (Old Protected Resources)
create policy "Admins can manage resource requests" on public.resource_access_requests for all using (auth.uid() in (select id from public.profiles));
create policy "Agents can view own resource requests" on public.resource_access_requests for select using (agent_id = auth.uid());
create policy "Agents can request resources" on public.resource_access_requests for insert with check (agent_id = auth.uid());

-- Messages: Users can manage own, Admins can read all, Guests can manage by chat_id
create policy "Users can manage own messages" on public.messages for all using (
  (auth.uid() is not null and (chat_id = auth.uid()::text or sender_id = auth.uid())) or
  (auth.uid() is null and chat_id like 'guest_%')
);
create policy "Admins can manage all messages" on public.messages for all using (auth.uid() in (select id from public.profiles));
create policy "Public can insert messages" on public.messages for insert with check (true);
