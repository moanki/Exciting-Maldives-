-- RBAC System Migration

-- 1. Create Tables
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
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role_id)
);

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
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

-- 2. Seed Data
-- Roles
insert into public.roles (key, label, description, is_system) values
('super_admin', 'Super Admin', 'Full system control', true),
('admin', 'Admin', 'Operational administrator', true),
('developer', 'Developer', 'Technical maintainer', true),
('content_manager', 'Content Manager', 'Content/editorial operator', true),
('security', 'Security', 'Security/governance oversight', true)
on conflict (key) do nothing;

-- Permissions (Simplified for brevity, will expand)
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

-- 3. Role-Permission Mappings (Simplified)
-- Super Admin gets everything
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'super_admin'
on conflict do nothing;

-- Admin
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'admin'
and p.key in ('resorts.read', 'resorts.create', 'resorts.update', 'resorts.delete', 'resorts.publish', 'resorts.import', 'resorts.media.manage', 'site_content.read', 'site_content.update', 'site_content.publish', 'resources.read', 'resources.create', 'resources.update', 'resources.delete', 'resources.protected.manage', 'resources.access.manage', 'newsletter.read', 'newsletter.export', 'newsletter.manage', 'chat.read', 'chat.reply', 'chat.assign', 'chat.resolve', 'chat.export', 'analytics.read', 'imports.read', 'imports.create', 'imports.review', 'imports.publish', 'settings.read', 'users.read', 'roles.read')
on conflict do nothing;

-- Developer
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'developer'
and p.key in ('imports.read', 'imports.create', 'imports.review', 'settings.read', 'integrations.read', 'integrations.update', 'analytics.read', 'security.read', 'audit_logs.read', 'users.read', 'roles.read')
on conflict do nothing;

-- Content Manager
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'content_manager'
and p.key in ('resorts.read', 'resorts.create', 'resorts.update', 'resorts.media.manage', 'site_content.read', 'site_content.update', 'site_content.publish', 'imports.read', 'imports.create', 'imports.review', 'resources.read')
on conflict do nothing;

-- Security
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r, public.permissions p
where r.key = 'security'
and p.key in ('audit_logs.read', 'security.read', 'security.manage', 'users.read', 'roles.read', 'permissions.read', 'settings.read', 'imports.read')
on conflict do nothing;

-- 4. Migration Script
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
