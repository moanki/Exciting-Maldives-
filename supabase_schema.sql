-- Supabase Schema for Exciting Maldives

-- 1. Profiles (Admins)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text check (role in ('admin', 'superadmin')) default 'admin',
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.1 Resort Media
create table if not exists public.resort_media (
  id uuid default gen_random_uuid() primary key,
  resort_id uuid references public.resorts on delete cascade,
  category text not null, -- hero, aerial, villa, dining, spa, activity, map
  subcategory text,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.1.1 Import Batches
create table if not exists public.import_batches (
  id uuid default gen_random_uuid() primary key,
  resort_id uuid references public.resorts on delete cascade,
  source_type text not null, -- 'google_drive', 'dropbox', 'zip', 'local'
  processed_count integer default 0,
  duplicate_count integer default 0,
  skipped_count integer default 0,
  imported_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Newsletter Submissions
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
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.resorts enable row level security;
alter table public.resort_media enable row level security;
alter table public.resort_documents enable row level security;
alter table public.booking_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.resources enable row level security;
alter table public.messages enable row level security;
alter table public.newsletter_submissions enable row level security;
alter table public.import_batches enable row level security;

-- RLS Policies
create policy "Admins can read all newsletter submissions" on public.newsletter_submissions for select using (auth.uid() in (select id from public.profiles));
create policy "Public can insert newsletter submissions" on public.newsletter_submissions for insert with check (true);

-- Import Batches: Admins can manage
create policy "Admins can manage import batches" on public.import_batches for all using (auth.uid() in (select id from public.profiles));

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
create policy "Public can read resources" on public.resources for select using (true);
create policy "Admins can manage resources" on public.resources for all using (auth.uid() in (select id from public.profiles));

-- Messages: Users can read/insert own chat messages, Admins can read all
create policy "Users can manage own messages" on public.messages for all using (chat_id = auth.uid()::text or chat_id = 'guest_' || auth.uid()::text);
create policy "Admins can read all messages" on public.messages for select using (auth.uid() in (select id from public.profiles));
create policy "Public can insert messages" on public.messages for insert with check (true);
