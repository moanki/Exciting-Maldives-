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
  seo_summary text,
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
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_import_batch' and table_name = 'resort_media') then
    alter table public.resort_media add constraint fk_import_batch foreign key (import_batch_id) references public.import_batches(id);
  end if;
end $$;

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


-- 11. RBAC System
create or replace function public.has_permission(permission_key text)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on ur.role_id = r.id
    where ur.user_id = auth.uid() and r.key = 'super_admin'
  ) or exists (
    select 1 from public.role_permissions rp
    join public.permissions p on rp.permission_id = p.id
    join public.user_roles ur on rp.role_id = ur.role_id
    where ur.user_id = auth.uid()
    and p.key = permission_key
  );
$$;

create table if not exists public.roles (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  label text not null,
  description text,
  is_system boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.permissions (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  label text not null,
  description text,
  module text not null,
  action text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.role_permissions (
  id uuid default gen_random_uuid() primary key,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(role_id, permission_id)
);

create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role_id)
);

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action_key text not null,
  entity_type text,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- RBAC Policies
drop policy if exists "Admins can read roles" on public.roles;
create policy "Admins can read roles" on public.roles for select using (public.has_permission('roles.read') or auth.role() = 'authenticated');
drop policy if exists "Admins can manage roles" on public.roles;
create policy "Admins can manage roles" on public.roles for all using (public.has_permission('roles.manage'));

drop policy if exists "Admins can read permissions" on public.permissions;
create policy "Admins can read permissions" on public.permissions for select using (public.has_permission('permissions.read') or auth.role() = 'authenticated');

drop policy if exists "Admins can read role permissions" on public.role_permissions;
create policy "Admins can read role permissions" on public.role_permissions for select using (public.has_permission('roles.read') or auth.role() = 'authenticated');
drop policy if exists "Admins can manage role permissions" on public.role_permissions;
create policy "Admins can manage role permissions" on public.role_permissions for all using (public.has_permission('roles.manage'));

drop policy if exists "Admins can read user roles" on public.user_roles;
create policy "Admins can read user roles" on public.user_roles for select using (public.has_permission('users.read') or auth.uid() = user_id);
drop policy if exists "Admins can manage user roles" on public.user_roles;
create policy "Admins can manage user roles" on public.user_roles for all using (public.has_permission('users.manage'));

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs" on public.audit_logs for select using (public.has_permission('audit_logs.read'));
drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;
create policy "Authenticated users can insert audit logs" on public.audit_logs for insert with check (auth.uid() is not null);

-- Seed Data
insert into public.roles (key, label, description, is_system) values
('super_admin', 'Super Admin', 'Full system control', true),
('admin', 'Admin', 'Operational administrator', true),
('developer', 'Developer', 'Technical maintainer', true),
('content_manager', 'Content Manager', 'Content/editorial operator', true),
('security', 'Security', 'Security/governance oversight', true)
on conflict (key) do nothing;

insert into public.permissions (key, label, description, module, action) values
('resorts.read', 'Read Resorts', 'Read resorts', 'resorts', 'read'),
('resorts.create', 'Create Resorts', 'Create resorts', 'resorts', 'create'),
('resorts.update', 'Update Resorts', 'Update resorts', 'resorts', 'update'),
('resorts.delete', 'Delete Resorts', 'Delete resorts', 'resorts', 'delete'),
('resorts.publish', 'Publish Resorts', 'Publish resorts', 'resorts', 'publish'),
('resorts.import', 'Import Resorts', 'Import resorts', 'resorts', 'import'),
('resorts.media.manage', 'Manage Resort Media', 'Manage resort media', 'resorts', 'media.manage'),
('site_content.read', 'Read Site Content', 'Read site content', 'site_content', 'read'),
('site_content.update', 'Update Site Content', 'Update site content', 'site_content', 'update'),
('site_content.publish', 'Publish Site Content', 'Publish site content', 'site_content', 'publish'),
('resources.read', 'Read Resources', 'Read resources', 'resources', 'read'),
('resources.create', 'Create Resources', 'Create resources', 'resources', 'create'),
('resources.update', 'Update Resources', 'Update resources', 'resources', 'update'),
('resources.delete', 'Delete Resources', 'Delete resources', 'resources', 'delete'),
('resources.protected.manage', 'Manage Protected Resources', 'Manage protected resources', 'resources', 'protected.manage'),
('resources.access.manage', 'Manage Resource Access', 'Manage resource access', 'resources', 'access.manage'),
('newsletter.read', 'Read Newsletter', 'Read newsletter', 'newsletter', 'read'),
('newsletter.export', 'Export Newsletter', 'Export newsletter', 'newsletter', 'export'),
('newsletter.manage', 'Manage Newsletter', 'Manage newsletter', 'newsletter', 'manage'),
('chat.read', 'Read Chat', 'Read chat', 'chat', 'read'),
('chat.reply', 'Reply Chat', 'Reply chat', 'chat', 'reply'),
('chat.assign', 'Assign Chat', 'Assign chat', 'chat', 'assign'),
('chat.resolve', 'Resolve Chat', 'Resolve chat', 'chat', 'resolve'),
('chat.export', 'Export Chat', 'Export chat', 'chat', 'export'),
('analytics.read', 'Read Analytics', 'Read analytics', 'analytics', 'read'),
('analytics.export', 'Export Analytics', 'Export analytics', 'analytics', 'export'),
('imports.read', 'Read Imports', 'Read imports', 'imports', 'read'),
('imports.create', 'Create Imports', 'Create imports', 'imports', 'create'),
('imports.review', 'Review Imports', 'Review imports', 'imports', 'review'),
('imports.publish', 'Publish Imports', 'Publish imports', 'imports', 'publish'),
('imports.delete', 'Delete Imports', 'Delete imports', 'imports', 'delete'),
('settings.read', 'Read Settings', 'Read settings', 'settings', 'read'),
('settings.update', 'Update Settings', 'Update settings', 'settings', 'update'),
('integrations.read', 'Read Integrations', 'Read integrations', 'integrations', 'read'),
('integrations.update', 'Update Integrations', 'Update integrations', 'integrations', 'update'),
('audit_logs.read', 'Read Audit Logs', 'Read audit logs', 'audit_logs', 'read'),
('security.read', 'Read Security', 'Read security', 'security', 'read'),
('security.manage', 'Manage Security', 'Manage security', 'security', 'manage'),
('users.read', 'Read Users', 'Read users', 'users', 'read'),
('users.manage', 'Manage Users', 'Manage users', 'users', 'manage'),
('roles.read', 'Read Roles', 'Read roles', 'roles', 'read'),
('roles.manage', 'Manage Roles', 'Manage roles', 'roles', 'manage'),
('permissions.read', 'Read Permissions', 'Read permissions', 'permissions', 'read')
on conflict (key) do nothing;

-- Role-Permission Mappings
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'admin'
and p.key in ('resorts.read', 'resorts.create', 'resorts.update', 'resorts.delete', 'resorts.publish', 'resorts.import', 'resorts.media.manage', 'site_content.read', 'site_content.update', 'site_content.publish', 'resources.read', 'resources.create', 'resources.update', 'resources.delete', 'resources.protected.manage', 'resources.access.manage', 'newsletter.read', 'newsletter.export', 'newsletter.manage', 'chat.read', 'chat.reply', 'chat.assign', 'chat.resolve', 'chat.export', 'analytics.read', 'imports.read', 'imports.create', 'imports.review', 'imports.publish', 'settings.read', 'users.read', 'roles.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'developer'
and p.key in ('imports.read', 'imports.create', 'imports.review', 'settings.read', 'integrations.read', 'integrations.update', 'analytics.read', 'security.read', 'audit_logs.read', 'users.read', 'roles.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'content_manager'
and p.key in ('resorts.read', 'resorts.create', 'resorts.update', 'resorts.media.manage', 'site_content.read', 'site_content.update', 'site_content.publish', 'imports.read', 'imports.create', 'imports.review', 'resources.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'security'
and p.key in ('audit_logs.read', 'security.read', 'security.manage', 'users.read', 'roles.read', 'permissions.read', 'settings.read', 'imports.read')
on conflict do nothing;

-- Migration Script
do $$
declare
  r record;
  role_id_uuid uuid;
begin
  for r in select id, role from public.profiles where role is not null loop
    select id into role_id_uuid from public.roles where key = case 
      when r.role = 'superadmin' then 'super_admin'
      when r.role = 'admin' then 'admin'
      when r.role = 'content_manager' then 'content_manager'
      else 'admin' -- Default fallback
    end;
    
    if role_id_uuid is not null then
      insert into public.user_roles (user_id, role_id) values (r.id, role_id_uuid) on conflict do nothing;
    end if;
  end loop;
end $$;

-- Bootstrap Super Admin Trigger
-- This trigger ensures monk.eemoan@gmail.com is always a super admin
create or replace function public.handle_auth_user_created()
returns trigger as $$
declare
  super_admin_role_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email;

  -- Assign Super Admin role if email matches
  if new.email = 'monk.eemoan@gmail.com' then
    select id into super_admin_role_id from public.roles where key = 'super_admin';
    if super_admin_role_id is not null then
      insert into public.user_roles (user_id, role_id)
      values (new.id, super_admin_role_id)
      on conflict (user_id, role_id) do nothing;
      
      -- Update legacy role field for compatibility
      update public.profiles set role = 'superadmin' where id = new.id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

-- Also handle existing user if they already have a profile but no role
do $$
declare
  target_user_id uuid;
  super_admin_role_id uuid;
begin
  select id into target_user_id from auth.users where email = 'monk.eemoan@gmail.com';
  select id into super_admin_role_id from public.roles where key = 'super_admin';
  
  if target_user_id is not null and super_admin_role_id is not null then
    -- Ensure profile exists
    insert into public.profiles (id, email)
    values (target_user_id, 'monk.eemoan@gmail.com')
    on conflict (id) do nothing;

    -- Assign role
    insert into public.user_roles (user_id, role_id)
    values (target_user_id, super_admin_role_id)
    on conflict (user_id, role_id) do nothing;
    
    update public.profiles set role = 'superadmin' where id = target_user_id;
  end if;
end $$;

-- RLS Policies
drop policy if exists "Admins can read all newsletter submissions" on public.newsletter_submissions;
create policy "Admins can read all newsletter submissions" on public.newsletter_submissions for select using (public.has_permission('newsletter.read'));
drop policy if exists "Public can insert newsletter submissions" on public.newsletter_submissions;
create policy "Public can insert newsletter submissions" on public.newsletter_submissions for insert with check (true);

-- Import Batches: Admins can manage
drop policy if exists "Admins can manage import batches" on public.import_batches;
create policy "Admins can read import batches" on public.import_batches 
  for select using (public.has_permission('imports.read'));
create policy "Admins can insert import batches" on public.import_batches 
  for insert with check (public.has_permission('imports.create'));
create policy "Admins can update import batches" on public.import_batches 
  for update using (public.has_permission('imports.review')) with check (public.has_permission('imports.review'));
create policy "Admins can delete import batches" on public.import_batches 
  for delete using (public.has_permission('imports.delete'));

-- Resort Staging: Admins can manage
drop policy if exists "Admins can manage resort staging" on public.resort_staging;
create policy "Admins can read resort staging" on public.resort_staging 
  for select using (public.has_permission('imports.read'));
create policy "Admins can insert resort staging" on public.resort_staging 
  for insert with check (public.has_permission('imports.create'));
create policy "Admins can update resort staging" on public.resort_staging 
  for update using (public.has_permission('imports.review')) with check (public.has_permission('imports.review'));
create policy "Admins can delete resort staging" on public.resort_staging 
  for delete using (public.has_permission('imports.delete'));

-- Media Staging: Admins can manage
drop policy if exists "Admins can manage media staging" on public.media_staging;
create policy "Admins can read media staging" on public.media_staging 
  for select using (public.has_permission('imports.read'));
create policy "Admins can insert media staging" on public.media_staging 
  for insert with check (public.has_permission('imports.create') or public.has_permission('resorts.media.manage'));
create policy "Admins can update media staging" on public.media_staging 
  for update using (public.has_permission('imports.review')) with check (public.has_permission('imports.review'));
create policy "Admins can delete media staging" on public.media_staging 
  for delete using (public.has_permission('imports.delete'));

-- RLS Policies

-- Profiles: Admins can read all, users can read own
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles for select using (public.has_permission('users.read'));
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Agents: Admins can read all, users can read own
drop policy if exists "Admins can read all agents" on public.agents;
create policy "Admins can read all agents" on public.agents for select using (public.has_permission('users.read'));
drop policy if exists "Users can read own agent profile" on public.agents;
create policy "Users can read own agent profile" on public.agents for select using (auth.uid() = id);
drop policy if exists "Public can insert agent profile" on public.agents;
create policy "Public can insert agent profile" on public.agents for insert with check (true);

-- Resorts: Public can read, Admins can manage
drop policy if exists "Public can read resorts" on public.resorts;
create policy "Public can read resorts" on public.resorts for select using (status = 'published');
drop policy if exists "Admins can manage resorts" on public.resorts;
create policy "Admins can manage resorts" on public.resorts for all using (public.has_permission('resorts.read') or public.has_permission('resorts.create') or public.has_permission('resorts.update') or public.has_permission('resorts.delete'));

-- Resort Media: Public can read, Admins can manage
drop policy if exists "Public can read resort media" on public.resort_media;
create policy "Public can read resort media" on public.resort_media for select using (true);
drop policy if exists "Admins can manage resort media" on public.resort_media;
create policy "Admins can manage resort media" on public.resort_media for all using (public.has_permission('resorts.media.manage'));

-- Resort Documents: Public can read, Admins can manage
drop policy if exists "Public can read resort documents" on public.resort_documents;
create policy "Public can read resort documents" on public.resort_documents for select using (true);
drop policy if exists "Admins can manage resort documents" on public.resort_documents;
create policy "Admins can manage resort documents" on public.resort_documents for all using (public.has_permission('resorts.read'));

-- Booking Requests: Admins can read all, Agents can read/insert own
drop policy if exists "Admins can read all bookings" on public.booking_requests;
create policy "Admins can read all bookings" on public.booking_requests for select using (public.has_permission('analytics.read'));
drop policy if exists "Agents can manage own bookings" on public.booking_requests;
create policy "Agents can manage own bookings" on public.booking_requests for all using (auth.uid() = agent_id);

-- Site Settings: Public can read, Admins can manage
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select using (true);
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings for all using (public.has_permission('settings.update'));

-- Resources: Public can read, Admins can manage
drop policy if exists "Public can read resources" on public.resources;
create policy "Public can read resources" on public.resources for select using (not is_protected);
drop policy if exists "Agents can read granted resources" on public.resources;
create policy "Agents can read granted resources" on public.resources for select using (
  id in (select resource_id from public.resource_access_requests where agent_id = auth.uid() and status = 'granted')
);
drop policy if exists "Admins can manage resources" on public.resources;
create policy "Admins can manage resources" on public.resources for all using (public.has_permission('resources.update'));

-- Protected Resources: Admins can manage, Public can view metadata (if they have the link)
drop policy if exists "Public can view protected resources metadata" on public.protected_resources;
create policy "Public can view protected resources metadata" on public.protected_resources for select using (true);
drop policy if exists "Admins can manage protected resources" on public.protected_resources;
create policy "Admins can manage protected resources" on public.protected_resources for all using (public.has_permission('resources.protected.manage'));

-- Resource Access Requests (Old Protected Resources)
drop policy if exists "Admins can manage resource requests" on public.resource_access_requests;
create policy "Admins can manage resource requests" on public.resource_access_requests for all using (public.has_permission('resources.access.manage'));
drop policy if exists "Agents can view own resource requests" on public.resource_access_requests;
create policy "Agents can view own resource requests" on public.resource_access_requests for select using (agent_id = auth.uid());
drop policy if exists "Agents can request resources" on public.resource_access_requests;
create policy "Agents can request resources" on public.resource_access_requests for insert with check (agent_id = auth.uid());

-- Messages: Users can manage own, Admins can read all, Guests can manage by chat_id
drop policy if exists "Users can manage own messages" on public.messages;
create policy "Users can manage own messages" on public.messages for all using (
  (auth.uid() is not null and (chat_id = auth.uid()::text or sender_id = auth.uid())) or
  (auth.uid() is null and chat_id like 'guest_%')
);
drop policy if exists "Admins can manage all messages" on public.messages;
create policy "Admins can manage all messages" on public.messages for all using (public.has_permission('chat.read'));
drop policy if exists "Public can insert messages" on public.messages;
create policy "Public can insert messages" on public.messages for insert with check (true);
