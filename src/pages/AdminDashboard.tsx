import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Hotel, Users, FileText, MessageSquare, Settings, Plus, Search, Check, X, Edit2, Trash2, Upload, Palette, Image, Globe, Link2, Phone, Mail, MapPin, Instagram, Linkedin, Facebook, Twitter, Play, Eye, Send, History, RefreshCw, Database, Shield, LogOut, Palmtree, Calendar, AlertCircle, Gem, Zap, Menu, Handshake } from 'lucide-react';
import { supabase } from '../supabase';
import { extractResortDataFromPDF } from '../services/content';
import { motion, AnimatePresence } from 'motion/react';

/**
 * AdminDashboard Component
 * 
 * The central management hub for the application. 
 * Provides interfaces for resort management, booking tracking, partner requests,
 * and site-wide customization.
 * 
 * Architecture:
 * - Uses React Router for internal navigation within the admin panel.
 * - Integrates with Supabase for real-time data management.
 * - Implements secure data processing for document uploads.
 */
export default function AdminDashboard() {
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-brand-paper/10 relative">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-brand-navy text-white rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-brand-navy text-white p-6 flex flex-col shadow-2xl z-40
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-12 mt-12 md:mt-0">
          <h2 className="text-xl font-serif font-bold tracking-[0.2em] text-brand-beige">ADMIN CENTER</h2>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto">
          <SidebarLink to="/admin" icon={<LayoutDashboard size={18} />} label="Overview" active={location.pathname === '/admin'} onClick={() => setIsMobileMenuOpen(false)} />
          <SidebarLink to="/admin/resorts" icon={<Hotel size={18} />} label="Resorts" active={location.pathname.startsWith('/admin/resorts')} onClick={() => setIsMobileMenuOpen(false)} />
          <SidebarLink to="/admin/partners" icon={<Users size={18} />} label="Partners" active={location.pathname.startsWith('/admin/partners')} onClick={() => setIsMobileMenuOpen(false)} />
          <SidebarLink to="/admin/chats" icon={<MessageSquare size={18} />} label="Live Chat" active={location.pathname.startsWith('/admin/chats')} onClick={() => setIsMobileMenuOpen(false)} />
          <SidebarLink to="/admin/page-manager" icon={<Palette size={18} />} label="Page Manager" active={location.pathname.startsWith('/admin/page-manager')} onClick={() => setIsMobileMenuOpen(false)} />
          <SidebarLink to="/admin/password-manager" icon={<Shield size={18} />} label="Password Manager" active={location.pathname.startsWith('/admin/password-manager')} onClick={() => setIsMobileMenuOpen(false)} />
          <SidebarLink to="/admin/resources" icon={<Settings size={18} />} label="Resources" active={location.pathname.startsWith('/admin/resources')} onClick={() => setIsMobileMenuOpen(false)} />
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="h-20 bg-white border-b border-brand-navy/5 flex items-center justify-between px-4 md:px-10 shrink-0 ml-12 md:ml-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex w-10 h-10 bg-brand-paper rounded-xl items-center justify-center text-brand-teal">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-bold text-brand-navy uppercase tracking-widest">Admin Control Center</h2>
              <p className="hidden md:block text-[10px] text-brand-navy/40 font-medium">System Management & Content Control</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-brand-navy">Administrator</span>
              <span className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Super Admin</span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('demo_mode');
                supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="p-2 md:p-3 bg-brand-paper rounded-xl text-brand-navy/40 hover:text-brand-coral hover:bg-brand-coral/5 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-brand-paper/30">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/resorts" element={<AdminResorts />} />
            <Route path="/partners" element={<AdminPartners />} />
            <Route path="/chats" element={<AdminChats />} />
            <Route path="/page-manager" element={<AdminPageManager />} />
            <Route path="/password-manager" element={<AdminPasswordManager />} />
            <Route path="/resources" element={<AdminResources />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AdminPasswordManager() {
  const [resources, setResources] = useState<any[]>([]);
  const [isAddingProtected, setIsAddingProtected] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase.from('protected_resources').select('*');
      if (data) setResources(data);
    };
    fetchResources();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Password Manager</h1>
        <button 
          onClick={() => setIsAddingProtected(true)}
          className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
        >
          <Plus size={16} /> Add Protected Resource
        </button>
      </div>
      
      {isAddingProtected && (
        <ProtectedResourceModal 
          onClose={() => setIsAddingProtected(false)} 
          onAdd={() => {
            setIsAddingProtected(false);
            const fetchResources = async () => {
              const { data } = await supabase.from('protected_resources').select('*');
              if (data) setResources(data);
            };
            fetchResources();
          }} 
        />
      )}

      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-paper border-b border-brand-navy/5">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Title</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Password</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">File URL</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {resources.map(resource => (
              <tr key={resource.id} className="hover:bg-brand-paper/50 transition-colors">
                <td className="px-6 py-4 font-medium text-brand-navy font-sans">{resource.title}</td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">{resource.passwords?.join(', ') || resource.password}</td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">
                  {resource.file_url ? (
                    <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">View File</a>
                  ) : 'No file'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"><Edit2 size={16} /></button>
                    <button 
                      onClick={async () => {
                        const { error } = await supabase.from('protected_resources').delete().eq('id', resource.id);
                        if (!error) {
                          const { data } = await supabase.from('protected_resources').select('*');
                          if (data) setResources(data);
                        }
                      }}
                      className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [protectedResources, setProtectedResources] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingProtected, setIsAddingProtected] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const { data: resData } = await supabase.from('resources').select('*');
      const { data: protData } = await supabase.from('protected_resources').select('*');
      
      if (resData) setResources(resData);
      if (protData) setProtectedResources(protData);
    };
    fetchResources();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Resource Library</h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-teal/20"
          >
            <Plus size={16} /> Add Resource
          </button>
          <button 
            onClick={() => setIsAddingProtected(true)}
            className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
          >
            <Plus size={16} /> Add Protected Resource
          </button>
        </div>
      </div>

      {isAddingProtected && (
        <ProtectedResourceModal 
          onClose={() => setIsAddingProtected(false)} 
          onAdd={() => {
            setIsAddingProtected(false);
            // Re-fetch resources
            const fetchResources = async () => {
              const { data: protData } = await supabase.from('protected_resources').select('*');
              if (protData) setProtectedResources(protData);
            };
            fetchResources();
          }} 
        />
      )}

      <h2 className="text-xl font-serif text-brand-navy mb-6">Public Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {resources.map(resource => (
          <div key={resource.id} className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all">
            <div className="bg-brand-paper w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-brand-teal">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-serif text-brand-navy mb-2">{resource.title}</h3>
            <p className="text-[10px] text-brand-navy/30 uppercase tracking-widest font-bold mb-4 font-sans">{resource.type}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-brand-navy/30 font-bold font-sans">{resource.size}</span>
              <div className="flex gap-2">
                <button className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"><Edit2 size={16} /></button>
                <button className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-serif text-brand-navy mb-6">Protected Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {protectedResources.map(resource => (
          <div key={resource.id} className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all">
            <div className="bg-brand-paper w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-brand-teal">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-serif text-brand-navy mb-2">{resource.title}</h3>
            <p className="text-[10px] text-brand-navy/30 uppercase tracking-widest font-bold mb-4 font-sans">Protected</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-brand-navy/30 font-bold font-sans">{resource.passwords?.length || 0} Passwords</span>
              <div className="flex gap-2">
                <button className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"><Edit2 size={16} /></button>
                <button 
                  onClick={async () => {
                    const { error } = await supabase.from('protected_resources').delete().eq('id', resource.id);
                    if (!error) {
                      const { data } = await supabase.from('protected_resources').select('*');
                      if (data) setProtectedResources(data);
                    }
                  }}
                  className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label, active, onClick }: any) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans ${
        active ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function ProtectedResourceModal({ onClose, onAdd }: any) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [passwords, setPasswords] = useState('');

  const handleSubmit = async () => {
    if (!title || !file || !passwords) return;
    
    // Upload file
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from('documents')
      .upload(`protected/${fileName}`, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(`protected/${fileName}`);

    // Save to DB
    const { error } = await supabase
      .from('protected_resources')
      .insert({
        title,
        file_url: publicUrl,
        passwords: passwords.split(',').map(p => p.trim())
      });
    
    if (!error) {
      onAdd();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl">
        <h3 className="text-xl font-serif text-brand-navy mb-6">Add Protected Resource</h3>
        <div className="space-y-4">
          <TextInput label="Title" value={title} onChange={setTitle} />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm font-sans" />
          </div>
          <TextInput label="Passwords (comma separated)" value={passwords} onChange={setPasswords} />
          <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-brand-paper rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-navy/10 transition-all">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all">Add Resource</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOverview() {
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [stats, setStats] = useState({
    totalResorts: 0,
    activePartners: 0,
    newRequests: 0,
    activeChats: 0
  });

  const schemaSql = `-- Supabase Schema for Exciting Maldives

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

-- 2.5 Partner Requests (Public Form Submissions)
create table if not exists public.partner_requests (
  id uuid default gen_random_uuid() primary key,
  email text not null,
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
  images text[],
  highlights text[],
  meal_plans text[],
  room_types jsonb[],
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

-- 5. Site Settings
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Resources
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null,
  type text not null,
  size text,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6.5 Protected Resources
create table if not exists public.protected_resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  file_url text not null,
  passwords text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Messages
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id text not null,
  text text not null,
  sender_id uuid references auth.users on delete set null,
  sender_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Storage Buckets
insert into storage.buckets (id, name, public) values 
  ('site-assets', 'site-assets', true),
  ('resort-images', 'resort-images', true),
  ('documents', 'documents', true)
on conflict do nothing;

create policy "Public Access site-assets" on storage.objects for select using (bucket_id = 'site-assets');
create policy "Admin Insert site-assets" on storage.objects for insert with check (bucket_id = 'site-assets');
create policy "Admin Update site-assets" on storage.objects for update using (bucket_id = 'site-assets');
create policy "Admin Delete site-assets" on storage.objects for delete using (bucket_id = 'site-assets');

create policy "Public Access resort-images" on storage.objects for select using (bucket_id = 'resort-images');
create policy "Admin Insert resort-images" on storage.objects for insert with check (bucket_id = 'resort-images');
create policy "Admin Update resort-images" on storage.objects for update using (bucket_id = 'resort-images');
create policy "Admin Delete resort-images" on storage.objects for delete using (bucket_id = 'resort-images');

create policy "Public Access documents" on storage.objects for select using (bucket_id = 'documents');
create policy "Admin Insert documents" on storage.objects for insert with check (bucket_id = 'documents');
create policy "Admin Update documents" on storage.objects for update using (bucket_id = 'documents');
create policy "Admin Delete documents" on storage.objects for delete using (bucket_id = 'documents');

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.partner_requests enable row level security;
alter table public.resorts enable row level security;
alter table public.booking_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.resources enable row level security;
alter table public.messages enable row level security;

-- RLS Policies (Simplified for setup)
create policy "Public read site_settings" on public.site_settings for select using (true);
create policy "Admin manage site_settings" on public.site_settings for all using (true);
create policy "Public read resorts" on public.resorts for select using (true);
create policy "Admin manage resorts" on public.resorts for all using (true);
create policy "Public insert partner_requests" on public.partner_requests for insert with check (true);
create policy "Admin manage partner_requests" on public.partner_requests for all using (true);
create policy "Public insert agents" on public.agents for insert with check (true);
create policy "Admin manage agents" on public.agents for all using (true);
create policy "Agents read own record" on public.agents for select using (auth.uid() = id);
create policy "Public read profiles" on public.profiles for select using (true);

create policy "Public manage messages" on public.messages for all using (true);

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;`;

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('resorts').select('id').limit(1);
        if (error) {
          setConnectionStatus('failed');
          setErrorMsg(error.message);
          if (error.message.includes('site_settings') || error.message.includes('resorts')) {
            setShowSql(true);
          }
        } else {
          setConnectionStatus('success');
        }
      } catch (err: any) {
        setConnectionStatus('failed');
        setErrorMsg(err.message);
      }
    };
    testConnection();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: resortsCount } = await supabase.from('resorts').select('*', { count: 'exact', head: true });
      const { count: partnersCount } = await supabase.from('partner_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: requestsCount } = await supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      setStats({
        totalResorts: resortsCount || 0,
        activePartners: partnersCount || 0,
        newRequests: requestsCount || 0,
        activeChats: 5
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      setSeedStatus('Seeding resorts...');
      const sampleResorts = [
        {
          name: "Soneva Fushi",
          atoll: "Baa Atoll",
          location: "Kunfunadhoo Island",
          description: "The original desert island hideaway in the Maldives. Soneva Fushi is located in the Baa Atoll UNESCO Biosphere Reserve.",
          category: "Ultra-Luxury",
          transfer_type: "Seaplane",
          meal_plans: ["Bed & Breakfast", "Half Board", "Full Board"],
          room_types: [{ name: "Crusoe Villa", max_guests: 2, size: "235sqm" }],
          highlights: ["Eco-friendly", "Private Cinema", "Observatory"],
          images: ["https://picsum.photos/seed/soneva/1200/800"],
          is_featured: true
        },
        {
          name: "Gili Lankanfushi",
          atoll: "North Malé Atoll",
          location: "Lankanfushi Island",
          description: "An eco-friendly resort that combines rustic chic with ultimate luxury. All villas are overwater.",
          category: "Ultra-Luxury",
          transfer_type: "Speedboat",
          meal_plans: ["Bed & Breakfast", "Half Board"],
          room_types: [{ name: "Villa Suite", max_guests: 2, size: "210sqm" }],
          highlights: ["Overwater Villas", "No News, No Shoes", "Private Reserve"],
          images: ["https://picsum.photos/seed/gili/1200/800"],
          is_featured: true
        }
      ];

      await supabase.from('resorts').upsert(sampleResorts, { onConflict: 'name' });

      setSeedStatus('Seeding site settings...');
      const initialSettings = [
        {
          key: 'hero:published',
          value: {
            title: 'The B2B Gateway to Luxury Travel in the Maldives',
            subtitle: 'A destination management and digital distribution platform connecting global travel professionals with the Maldives’ most exceptional resorts and experiences.',
            banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
            banner_type: 'image'
          }
        },
        {
          key: 'introduction:published',
          value: {
            title: 'Bespoke Destination Management',
            summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships. We offer tailored, high-end travel solutions that highlight the beauty and culture of the Maldives, ensuring our partners can deliver unforgettable and seamless experiences to their clients.'
          }
        },
        {
          key: 'navbar:published',
          value: [
            { label: 'Home', path: '/' },
            { label: 'Resorts', path: '/resorts' },
            { label: 'Experiences', path: '/experiences' },
            { label: 'Platform', path: '/platform' },
            { label: 'About', path: '/about' }
          ]
        },
        {
          key: 'footer:published',
          value: {
            contact: { email: 'info@excitingmaldives.com', phone: '+960 123 4567', address: 'Male, Maldives' },
            social: { instagram: '', linkedin: '', facebook: '', twitter: '' },
            important_links: [
              { label: 'Resorts', path: '/resorts' },
              { label: 'Experiences', path: '/experiences' },
              { label: 'Platform', path: '/platform' }
            ],
            legal_links: [
              { label: 'Privacy Policy', path: '/legal' },
              { label: 'Terms of Service', path: '/terms' }
            ]
          }
        }
      ];

      await supabase.from('site_settings').upsert(initialSettings, { onConflict: 'key' });

      setSeedStatus('Seeding booking requests...');
      const sampleRequests = [
        {
          resort_name: "Soneva Fushi",
          guest_name: "John Doe",
          email: "john@example.com",
          check_in: new Date().toISOString(),
          check_out: new Date(Date.now() + 86400000 * 7).toISOString(),
          status: 'pending'
        }
      ];

      await supabase.from('booking_requests').upsert(sampleRequests);

      setSeedStatus('Success! Data seeded.');
      fetchStats();
    } catch (err: any) {
      setSeedStatus(`Error: ${err.message}`);
    }
    setSeeding(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-serif text-brand-navy">System Overview</h1>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans flex items-center gap-2 ${
            connectionStatus === 'success' ? 'bg-green-50 text-green-600' : 
            connectionStatus === 'failed' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-paper text-brand-navy/30'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'success' ? 'bg-green-500' : 
              connectionStatus === 'failed' ? 'bg-brand-coral' : 'bg-brand-navy/20 animate-pulse'
            }`} />
            Supabase: {connectionStatus === 'success' ? 'Connected' : connectionStatus === 'failed' ? 'Error' : 'Testing...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={<Palmtree className="text-brand-teal" />} 
          label="Total Resorts" 
          value={stats.totalResorts} 
          color="teal"
        />
        <StatCard 
          icon={<Users className="text-brand-navy" />} 
          label="Active Partners" 
          value={stats.activePartners} 
          color="navy"
        />
        <StatCard 
          icon={<Calendar className="text-brand-coral" />} 
          label="New Requests" 
          value={stats.newRequests} 
          color="coral"
        />
        <StatCard 
          icon={<MessageSquare className="text-brand-teal" />} 
          label="Active Chats" 
          value={stats.activeChats} 
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
          <h3 className="text-xl font-serif text-brand-navy mb-6">Database Management</h3>
          <div className="space-y-6">
            <div className="p-6 bg-brand-paper/50 rounded-3xl border border-brand-navy/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-4 font-sans">Quick Actions</h4>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={seedData}
                  disabled={seeding}
                  className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all disabled:opacity-50 flex items-center gap-2 font-sans"
                >
                  {seeding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Database size={16} />}
                  Seed Sample Data
                </button>
                <button 
                  onClick={() => setShowSql(!showSql)}
                  className="border border-brand-navy/10 text-brand-navy px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-paper transition-all font-sans"
                >
                  {showSql ? 'Hide SQL Schema' : 'View SQL Schema'}
                </button>
              </div>
              {seedStatus && (
                <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest font-sans ${seedStatus.includes('Error') ? 'text-brand-coral' : 'text-brand-teal'}`}>
                  {seedStatus}
                </p>
              )}
            </div>

            {connectionStatus === 'failed' && (
              <div className="p-6 bg-brand-coral/5 rounded-3xl border border-brand-coral/10">
                <div className="flex items-start gap-3 text-brand-coral mb-4">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold font-sans">Connection Error</h4>
                    <p className="text-xs font-sans opacity-80 mt-1">{errorMsg}</p>
                  </div>
                </div>
                <p className="text-[10px] font-sans text-brand-navy/60 leading-relaxed">
                  This error usually means the required tables haven't been created in your Supabase project yet. 
                  Please copy the SQL schema below and run it in the <strong>SQL Editor</strong> of your Supabase dashboard.
                </p>
              </div>
            )}
          </div>
        </div>

        {showSql && (
          <div className="bg-brand-navy p-8 rounded-[40px] text-white overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif">SQL Schema</h3>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(schemaSql);
                  console.log('SQL copied to clipboard!');
                }}
                className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all font-sans"
              >
                Copy SQL
              </button>
            </div>
            <pre className="text-[10px] font-mono bg-black/20 p-6 rounded-3xl overflow-auto flex-1 max-h-[400px] scrollbar-thin scrollbar-thumb-white/10">
              {schemaSql}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    teal: 'text-brand-teal bg-brand-teal/5',
    navy: 'text-brand-navy bg-brand-navy/5',
    coral: 'text-brand-coral bg-brand-coral/5'
  };

  return (
    <div className="bg-white p-8 rounded-[40px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.navy}`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-navy/30 mb-2 font-sans">{label}</p>
      <p className="text-4xl font-serif text-brand-navy">{value}</p>
    </div>
  );
}

function AdminResorts() {
  const [resorts, setResorts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingResort, setEditingResort] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    atoll: '',
    location: '',
    category: '',
    transfer_type: '',
    description: '',
    images: '',
    highlights: '',
    meal_plans: '',
    is_featured: false
  });

  useEffect(() => {
    fetchResorts();
  }, []);

  const fetchResorts = async () => {
    const { data, error } = await supabase
      .from('resorts')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) {
      setResorts(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const extracted = await extractResortDataFromPDF(base64);
        const { error } = await supabase
          .from('resorts')
          .insert({
            ...extracted,
            is_featured: false
          });
        
        if (error) throw error;
        fetchResorts();
        setIsAdding(false);
      } catch (err) {
        console.error('AI Extraction failed:', err);
      } finally {
        setAiProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingResort) {
        const { error } = await supabase
          .from('resorts')
          .update({
            ...formData,
            images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
            highlights: formData.highlights.split(',').map(s => s.trim()).filter(Boolean),
            meal_plans: formData.meal_plans.split(',').map(s => s.trim()).filter(Boolean),
          })
          .eq('id', editingResort.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resorts')
          .insert({
            ...formData,
            images: formData.images.split(',').map(s => s.trim()).filter(Boolean),
            highlights: formData.highlights.split(',').map(s => s.trim()).filter(Boolean),
            meal_plans: formData.meal_plans.split(',').map(s => s.trim()).filter(Boolean),
          });
        if (error) throw error;
      }
      
      setEditingResort(null);
      setIsAdding(false);
      setFormData({ name: '', atoll: '', location: '', category: '', transfer_type: '', description: '', images: '', highlights: '', meal_plans: '', is_featured: false });
      fetchResorts();
    } catch (error: any) {
      console.error('Error saving resort:', error.message);
      // In a real app, use a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // In a real app, use a custom modal for confirmation instead of window.confirm
    // For now, we'll just delete it directly to avoid iframe blocking issues
    try {
      const { error } = await supabase.from('resorts').delete().eq('id', id);
      if (error) throw error;
      fetchResorts();
    } catch (error: any) {
      console.error('Error deleting resort:', error.message);
    }
  };

  const startEdit = (resort: any) => {
    setEditingResort(resort);
    setFormData({
      name: resort.name || '',
      atoll: resort.atoll || '',
      location: resort.location || '',
      category: resort.category || '',
      transfer_type: resort.transfer_type || '',
      description: resort.description || '',
      images: (resort.images || []).join(', '),
      highlights: (resort.highlights || []).join(', '),
      meal_plans: (resort.meal_plans || []).join(', '),
      is_featured: resort.is_featured || false
    });
    setIsAdding(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Resort Management</h1>
        <div className="flex gap-4">
          <label className="cursor-pointer bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-teal/20">
            <Upload size={16} /> {aiProcessing ? 'Processing...' : 'Smart Upload PDF'}
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={aiProcessing} />
          </label>
          <button 
            onClick={() => {
              setEditingResort(null);
              setFormData({ name: '', atoll: '', location: '', category: '', transfer_type: '', description: '', images: '', highlights: '', meal_plans: '', is_featured: false });
              setIsAdding(true);
            }}
            className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
          >
            <Plus size={16} /> Manual Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-paper border-b border-brand-navy/5">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Resort Name</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Atoll</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Category</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Status</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {resorts.map(resort => (
              <tr key={resort.id} className="hover:bg-brand-paper/50 transition-colors">
                <td className="px-6 py-4 font-medium text-brand-navy font-sans">{resort.name}</td>
                <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 font-sans">{resort.atoll}</td>
                <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 font-sans">{resort.category}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={async () => {
                      const { error } = await supabase
                        .from('resorts')
                        .update({ is_featured: !resort.is_featured })
                        .eq('id', resort.id);
                      if (!error) fetchResorts();
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans ${resort.is_featured ? 'bg-brand-beige/20 text-brand-beige' : 'bg-brand-paper text-brand-navy/30'}`}
                  >
                    {resort.is_featured ? 'Featured' : 'Standard'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(resort)} className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(resort.id)} className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-12">
                <h2 className="text-3xl font-serif text-brand-navy mb-8">{editingResort ? 'Edit Resort' : 'Add New Resort'}</h2>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <TextInput label="Resort Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} placeholder="e.g. Soneva Jani" />
                    <TextInput label="Atoll" value={formData.atoll} onChange={(v) => setFormData({...formData, atoll: v})} placeholder="e.g. Noonu Atoll" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <TextInput label="Location" value={formData.location} onChange={(v) => setFormData({...formData, location: v})} placeholder="e.g. Medhufaru Island" />
                    <TextInput label="Category" value={formData.category} onChange={(v) => setFormData({...formData, category: v})} placeholder="e.g. Ultra-Luxury" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <TextInput label="Transfer Type" value={formData.transfer_type} onChange={(v) => setFormData({...formData, transfer_type: v})} placeholder="e.g. Seaplane" />
                    <TextInput label="Meal Plans (comma separated)" value={formData.meal_plans} onChange={(v) => setFormData({...formData, meal_plans: v})} placeholder="e.g. Bed & Breakfast, Half Board" />
                  </div>
                  <TextInput label="Image URLs (comma separated)" value={formData.images} onChange={(v) => setFormData({...formData, images: v})} placeholder="https://..." />
                  <TextInput label="Highlights (comma separated)" value={formData.highlights} onChange={(v) => setFormData({...formData, highlights: v})} placeholder="e.g. Overwater Villas, Spa" />
                  <TextAreaInput label="Description" value={formData.description} onChange={(v) => setFormData({...formData, description: v})} placeholder="Brief overview of the resort..." />
                  
                  <div className="flex justify-end gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-navy transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-brand-navy text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-xl shadow-brand-navy/20"
                    >
                      {editingResort ? 'Update Resort' : 'Add Resort'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function AdminPartners() {
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setPartners(data);
      }
    };
    fetchPartners();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('partner_requests')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setPartners(partners.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const downloadCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Website', 'Status', 'Created At'];
    const rows = partners.map(p => [
      p.full_name,
      p.email,
      p.phone,
      p.company_name,
      p.website,
      p.status,
      p.created_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'partner_requests.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadIndividual = (partner: any) => {
    const content = `
PARTNER REQUEST DETAILS
-----------------------
Full Name: ${partner.full_name}
Email: ${partner.email}
Phone: ${partner.phone}
Company: ${partner.company_name}
Website: ${partner.website || 'N/A'}
Status: ${partner.status}
Submitted At: ${new Date(partner.created_at).toLocaleString()}

Message:
${partner.message || 'No message provided.'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `request_${partner.full_name.replace(/ /g, '_')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Partner Requests</h1>
        <button 
          onClick={downloadCSV}
          className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
        >
          Download CSV
        </button>
      </div>
      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-paper border-b border-brand-navy/5">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Name</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Company</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Status</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Date</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {partners.map(partner => (
              <tr key={partner.id} className="hover:bg-brand-paper/50 transition-colors">
                <td className="px-6 py-4 font-medium text-brand-navy font-sans">
                  {partner.full_name}
                  <div className="text-xs text-brand-navy/60 font-normal">{partner.email}</div>
                </td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">{partner.company_name}</td>
                <td className="px-6 py-4">
                  <select 
                    value={partner.status}
                    onChange={(e) => updateStatus(partner.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-sans border-0 outline-none ${
                      partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                      partner.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">{new Date(partner.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => downloadIndividual(partner)}
                    className="text-brand-teal hover:text-brand-navy text-xs font-bold uppercase tracking-widest font-sans"
                  >
                    Download Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminChats() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    
    // Subscribe to ALL messages to update chat list in real-time
    const channel = supabase
      .channel('admin_chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      
      const channel = supabase
        .channel(`chat:${selectedChat}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${selectedChat}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChats = async () => {
    const { data } = await supabase
      .from('messages')
      .select('chat_id, sender_name, created_at')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Group by chat_id and get latest
      const uniqueChats = data.reduce((acc: any[], curr: any) => {
        if (!acc.find(c => c.chat_id === curr.chat_id)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      setChats(uniqueChats);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    const messageData = {
      chat_id: selectedChat,
      text: inputText,
      sender_id: null, // Admin sender
      sender_name: 'Admin Support',
    };

    const { error } = await supabase.from('messages').insert(messageData);
    if (!error) setInputText('');
  };

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6">
      {/* Chat List */}
      <div className="w-80 bg-white rounded-[32px] border border-brand-navy/5 shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-brand-navy/5 bg-brand-paper/30">
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Active Conversations</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.chat_id}
              onClick={() => setSelectedChat(chat.chat_id)}
              className={`w-full p-6 text-left border-b border-brand-navy/5 transition-all hover:bg-brand-paper/50 ${selectedChat === chat.chat_id ? 'bg-brand-paper border-l-4 border-l-brand-teal' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold text-brand-navy">{chat.sender_name}</span>
                <span className="text-[10px] text-brand-navy/30 font-medium">{new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold">ID: {chat.chat_id.slice(0, 8)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white rounded-[32px] border border-brand-navy/5 shadow-xl overflow-hidden flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-6 border-b border-brand-navy/5 bg-brand-paper/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">{chats.find(c => c.chat_id === selectedChat)?.sender_name || 'Visitor'}</h3>
                  <p className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-brand-paper/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_name === 'Admin Support' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-sans ${
                    msg.sender_name === 'Admin Support' 
                      ? 'bg-brand-navy text-white rounded-tr-none shadow-lg' 
                      : 'bg-white text-brand-navy rounded-tl-none shadow-md border border-brand-navy/5'
                  }`}>
                    {msg.text}
                    <div className={`text-[8px] mt-2 opacity-50 ${msg.sender_name === 'Admin Support' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-brand-navy/5 flex gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-brand-paper/50 border-none rounded-2xl px-6 py-4 text-sm font-sans focus:ring-2 focus:ring-brand-teal/20 transition-all"
              />
              <button type="submit" className="bg-brand-teal text-white p-4 rounded-2xl hover:bg-brand-navy transition-all shadow-lg shadow-brand-teal/20">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-navy/20">
            <MessageSquare size={64} className="mb-4 opacity-10" />
            <p className="text-sm font-serif italic">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPageManager() {
  const [activeTab, setActiveTab] = useState('nav');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resorts, setResorts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const safeArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  };

  useEffect(() => {
    fetchSettings();
    fetchResorts();
  }, []);

  const fetchSettings = async () => {
    try {
      console.log('Fetching site settings...');
      if (!supabase) {
        console.error('Supabase client is not initialized!');
        return;
      }
      const { data, error } = await supabase.from('site_settings').select('*');
      
      if (error) {
        console.error('Supabase error fetching settings:', error);
        // If table doesn't exist (PGRST205), we just return defaults silently
        if (error.code !== 'PGRST205') {
          console.error('Error fetching settings:', error);
        }
        setSettings({
          navbar: [{ label: 'Resorts', path: '/resorts' }, { label: 'Map', path: '/map' }, { label: 'Info', path: '/tourist-info' }],
          hero: { title: 'The Art of Maldivian Luxury', subtitle: 'Bespoke Destination Management for Travel Professionals', banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080', banner_type: 'image' },
          introduction: { title: 'Bespoke Destination Management', summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships.' },
          ceo_message: { name: 'CEO Name', message: '', photo_url: '' },
          our_story: { title: 'Our Story', content: '' },
          awards: { title: 'Prestigious Awards', summary: '', items: [] },
          ctas: { partner_title: 'Become a Partner', partner_btn: 'Request Form', guide_title: 'Travel Guide', guide_btn: 'View Guide' },
          whatsapp: { enabled: false, number: '' },
          why_us: [
            { title: 'Authentic Connections', description: 'We focus on fostering genuine relationships with our B2B partners by understanding their needs and providing personalized solutions.' },
            { title: 'Curated Luxury', description: 'Our strategy centers on curating unique luxury experiences that showcase the beauty and culture of the Maldives.' },
            { title: 'Streamlined Collaboration', description: 'We aim to enhance collaboration that simplify the booking process and improve communication, ensuring seamless service delivery.' },
            { title: 'Tailored Support', description: 'We offer dedicated support to our partners, providing them with the insights and resources needed to effectively promote our offerings.' }
          ],
          footer: { contact: { email: 'info@excitingmaldives.com' }, social: {}, important_links: [], legal_links: [] },
          custom_pages: []
        });
        setLoading(false);
        return;
      }
      console.log('Settings fetched successfully:', data);
      if (data) {
        // Load published settings first
        const publishedSettings = data.filter((s: any) => s.key.endsWith(':published'));
        const settingsMap = publishedSettings.reduce((acc: any, curr: any) => {
          const key = curr.key.replace(':published', '');
          acc[key] = curr.value;
          return acc;
        }, {});

        // Overlay draft settings
        const draftSettings = data.filter((s: any) => s.key.endsWith(':draft'));
        draftSettings.forEach((s: any) => {
          const key = s.key.replace(':draft', '');
          settingsMap[key] = s.value;
        });
        
        // Apply defaults for missing critical sections to ensure UI is populated
        const finalSettings = {
          navbar: [
            { label: 'Home', path: '/' },
            { label: 'Resorts', path: '/resorts' },
            { label: 'Experiences', path: '/experiences' },
            { label: 'Platform', path: '/platform' },
            { label: 'About', path: '/about' }
          ],
          logos: {
            primary: '',
            white: '',
            black: ''
          },
          hero: {
            title: 'The Art of Maldivian Luxury',
            subtitle: 'Bespoke Destination Management for Travel Professionals',
            banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
            banner_type: 'image'
          },
          introduction: {
            title: 'Bespoke Destination Management',
            summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships. We offer tailored, high-end travel solutions that highlight the beauty and culture of the Maldives, ensuring our partners can deliver unforgettable and seamless experiences to their clients.'
          },
          ceo_message: {
            name: 'CEO Name',
            message: 'Welcome to Exciting Maldives. We are dedicated to providing the best Maldivian experiences.',
            photo_url: ''
          },
          our_story: {
            title: 'Our Story',
            content: 'Exciting Maldives began with a vision to showcase the true beauty of our islands...'
          },
          awards: {
            title: 'Prestigious Awards',
            summary: 'Recognized for excellence in luxury travel and destination management.',
            items: []
          },
          ctas: {
            partner_title: 'Become a Partner',
            partner_btn: 'Request Form',
            guide_title: 'Travel Guide',
            guide_btn: 'View Guide'
          },
          whatsapp: {
            enabled: false,
            number: ''
          },
          why_us: [
            { title: 'Local Expertise', description: 'Deeply rooted in the Maldives with unparalleled local knowledge.' },
            { title: 'Bespoke Service', description: 'Tailored experiences designed for the most discerning travelers.' },
            { title: 'B2B Focus', description: 'Dedicated support for our travel industry partners.' }
          ],
          footer: {
            contact: { email: 'info@excitingmaldives.com', phone: '+960 123 4567', address: 'Male, Maldives' },
            social: { instagram: '', linkedin: '', facebook: '', twitter: '' },
            important_links: [{ label: 'Resorts', path: '/resorts' }],
            legal_links: [{ label: 'Privacy Policy', path: '/legal' }]
          },
          custom_pages: [],
          ...settingsMap
        };

        setSettings(finalSettings);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Fallback to defaults if table missing or error
      setSettings({
        navbar: [{ label: 'Resorts', path: '/resorts' }, { label: 'Map', path: '/map' }, { label: 'Info', path: '/tourist-info' }],
        hero: { title: 'The Art of Maldivian Luxury', subtitle: 'Bespoke Destination Management for Travel Professionals', banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080', banner_type: 'image' },
        introduction: { title: 'Bespoke Destination Management', summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships.' },
        why_us: [{ title: 'Local Expertise', description: 'Deeply rooted in the Maldives.' }],
        footer: { contact: { email: 'info@excitingmaldives.com' }, social: {}, important_links: [], legal_links: [] },
        custom_pages: []
      });
    }
    setLoading(false);
  };

  const fetchResorts = async () => {
    const { data } = await supabase.from('resorts').select('id, name, is_featured');
    if (data) setResorts(data);
  };

  const toggleFeatured = async (resort: any) => {
    const { error } = await supabase
      .from('resorts')
      .update({ is_featured: !resort.is_featured })
      .eq('id', resort.id);
    
    if (!error) {
      fetchResorts();
    }
  };

  const fetchHistory = async (key: string) => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', `history:${key}`)
      .single();
    
    if (data && data.value) {
      setHistory(data.value);
    } else {
      setHistory([]);
    }
    setShowHistory(true);
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    // Save draft
    const { error: draftError } = await supabase
      .from('site_settings')
      .upsert({ key: `${key}:draft`, value }, { onConflict: 'key' });
    
    // Auto-publish for immediate reflection on homepage
    const { error: pubError } = await supabase
      .from('site_settings')
      .upsert({ key: `${key}:published`, value }, { onConflict: 'key' });
    
    if (!draftError && !pubError) {
      setSettings({ ...settings, [key]: value });
    }
    setSaving(false);
  };

  const publishSettings = async () => {
    setPublishing(true);
    try {
      // Get all draft settings
      const { data: draftData } = await supabase
        .from('site_settings')
        .select('*')
        .like('key', '%:draft');

      if (draftData) {
        const publishPromises = draftData.map(async (draft) => {
          const key = draft.key.replace(':draft', '');
          const publishedKey = `${key}:published`;
          
          // 1. Get current published to add to history
          const { data: currentPublished } = await supabase
            .from('site_settings')
            .select('*')
            .eq('key', publishedKey)
            .maybeSingle();
          
          if (currentPublished) {
            const historyKey = `history:${key}`;
            const { data: currentHistory } = await supabase
              .from('site_settings')
              .select('*')
              .eq('key', historyKey)
              .maybeSingle();
            
            const historyList = currentHistory?.value || [];
            const newHistory = [{
              timestamp: new Date().toISOString(),
              value: currentPublished.value,
              id: Math.random().toString(36).substr(2, 9)
            }, ...historyList].slice(0, 10); // Keep last 10

            await supabase
              .from('site_settings')
              .upsert({ key: historyKey, value: newHistory }, { onConflict: 'key' });
          }

          // 2. Publish new value
          return supabase
            .from('site_settings')
            .upsert({ key: publishedKey, value: draft.value }, { onConflict: 'key' });
        });
        
        await Promise.all(publishPromises);
        console.log('Website published successfully!');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      console.error('Failed to publish. Please try again.');
    }
    setPublishing(false);
  };

  const revertHistory = async (key: string, historyItem: any) => {
    // In a real app, use a custom modal for confirmation instead of window.confirm
    // For now, we'll just revert it directly to avoid iframe blocking issues
    await saveSetting(key, historyItem.value);
    setShowHistory(false);
  };

  const handlePreview = () => {
    window.open(`${window.location.origin}/?preview=true`, '_blank');
  };

  const uploadFile = async (file: File, path: string, bucket: string = 'site-assets') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message.includes('Bucket not found')) {
        console.error(`Storage bucket "${bucket}" not found. Please click "Copy SQL" at the top of the dashboard and run it in your Supabase SQL Editor to create the required tables and buckets.`);
      } else {
        console.error(`Upload error: ${uploadError.message}`);
      }
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div></div>;

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif text-brand-navy">Page Customization</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mt-2">Manage your website content and appearance</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePreview}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-brand-navy/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-paper transition-all"
          >
            <Eye size={14} />
            Preview
          </button>
          <button 
            onClick={publishSettings}
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shadow-brand-navy/10 disabled:opacity-50"
          >
            {publishing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Publish to Website
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-brand-paper/50 p-1 rounded-2xl w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'nav', label: 'Nav & Logo', icon: <Globe size={14} /> },
            { id: 'pages', label: 'Pages', icon: <FileText size={14} /> },
            { id: 'hero', label: 'Hero & Intro', icon: <Image size={14} /> },
            { id: 'ceo', label: 'CEO Message', icon: <Users size={14} /> },
            { id: 'story', label: 'Our Story', icon: <FileText size={14} /> },
            { id: 'excellence', label: 'Excellence', icon: <Zap size={14} /> },
            { id: 'market', label: 'Markets', icon: <Globe size={14} /> },
            { id: 'services', label: 'Services', icon: <Handshake size={14} /> },
            { id: 'awards', label: 'Awards', icon: <Gem size={14} /> },
            { id: 'why', label: 'Why Us', icon: <Check size={14} /> },
            { id: 'retreats', label: 'Retreats', icon: <Hotel size={14} /> },
            { id: 'ctas', label: 'CTAs', icon: <Zap size={14} /> },
            { id: 'footer', label: 'Footer', icon: <Settings size={14} /> },
            { id: 'whatsapp', label: 'WhatsApp', icon: <Phone size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-brand-teal shadow-sm' : 'text-brand-navy/40 hover:text-brand-navy'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => fetchHistory(activeTab)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-teal transition-all"
        >
          <History size={14} />
          View History & Revert
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5"
        >
          {/* History Overlay */}
          {showHistory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/20 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-brand-navy/5 flex justify-between items-center">
                  <h3 className="text-xl font-serif text-brand-navy">Version History: {activeTab}</h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-brand-paper rounded-full transition-all"><X size={20} /></button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-brand-navy/40 text-sm font-sans italic">No history found for this section.</p>
                      <p className="text-[10px] text-brand-navy/20 uppercase tracking-widest font-bold mt-2">History is created when you publish changes</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-brand-paper/30 rounded-2xl border border-brand-navy/5">
                        <div>
                          <p className="text-xs font-bold text-brand-navy">{new Date(item.timestamp).toLocaleString()}</p>
                          <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold mt-1">Published Version</p>
                        </div>
                        <button 
                          onClick={() => revertHistory(activeTab, item)}
                          className="px-4 py-2 bg-brand-navy text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all"
                        >
                          Revert
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
          {activeTab === 'nav' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Navigation Items</h3>
                <div className="space-y-4">
                  {safeArray(settings.navbar).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-brand-paper/30 p-4 rounded-2xl">
                      <div className="flex-1">
                        <TextInput 
                          label="Page" 
                          value={item.label} 
                          onChange={(val) => {
                            const newNav = [...safeArray(settings.navbar)];
                            newNav[idx].label = val;
                            saveSetting('navbar', newNav);
                          }} 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">
                          Path
                        </label>
                        <select
                          value={item.path}
                          onChange={(e) => {
                            const newNav = [...safeArray(settings.navbar)];
                            newNav[idx].path = e.target.value;
                            saveSetting('navbar', newNav);
                          }}
                          className="w-full bg-white border border-brand-navy/10 rounded-xl px-4 py-3 text-sm font-sans text-brand-navy focus:outline-none focus:border-brand-teal transition-all"
                        >
                          <option value="/">Home (/)</option>
                          <option value="/resorts">Resorts (/resorts)</option>
                          <option value="/map">Map (/map)</option>
                          <option value="/tourist-info">Tourist Info (/tourist-info)</option>
                          <option value="/become-partner">Become a Partner (/become-partner)</option>
                          {safeArray(settings.custom_pages).map((p: any) => (
                            <option key={p.slug} value={`/${p.slug}`}>
                              {p.title} (/{p.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const newNav = safeArray(settings.navbar).filter((_: any, i: number) => i !== idx);
                          saveSetting('navbar', newNav);
                        }}
                        className="mt-6 p-2 text-brand-coral hover:bg-brand-coral/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => saveSetting('navbar', [...safeArray(settings.navbar), { label: 'New Item', path: '/' }])}
                    className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Navigation Item
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Website Logos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LogoInput 
                    label="Primary Logo" 
                    value={settings.logos?.primary} 
                    onUpload={async (file: File) => {
                      const url = await uploadFile(file, 'logos');
                      if (url) saveSetting('logos', { ...settings.logos, primary: url });
                    }}
                    onChange={(val: string) => saveSetting('logos', { ...settings.logos, primary: val })} 
                  />
                  <LogoInput 
                    label="White Logo" 
                    value={settings.logos?.white} 
                    onUpload={async (file: File) => {
                      const url = await uploadFile(file, 'logos');
                      if (url) saveSetting('logos', { ...settings.logos, white: url });
                    }}
                    onChange={(val: string) => saveSetting('logos', { ...settings.logos, white: val })} 
                  />
                  <LogoInput 
                    label="Black Logo" 
                    value={settings.logos?.black} 
                    onUpload={async (file: File) => {
                      const url = await uploadFile(file, 'logos');
                      if (url) saveSetting('logos', { ...settings.logos, black: url });
                    }}
                    onChange={(val: string) => saveSetting('logos', { ...settings.logos, black: val })} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif text-brand-navy">Page Manager</h3>
                <button 
                  onClick={() => saveSetting('custom_pages', [...safeArray(settings.custom_pages), { title: 'New Page', slug: 'new-page', content: '', status: 'active' }])}
                  className="py-3 px-6 bg-brand-navy text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Add New Page
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-brand-navy/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-navy/10 bg-brand-paper/30">
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Page Name</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Path</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Status</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: 'Home', slug: '', isBuiltIn: true },
                      { title: 'Resorts', slug: 'resorts', isBuiltIn: true },
                      { title: 'Tourist Info', slug: 'tourist-info', isBuiltIn: true },
                      { title: 'Map', slug: 'map', isBuiltIn: true },
                      { title: 'Legal', slug: 'legal', isBuiltIn: true },
                      { title: 'Become Partner', slug: 'become-partner', isBuiltIn: true },
                      { title: 'Login', slug: 'login', isBuiltIn: true },
                      ...safeArray(settings.custom_pages).map((p: any, i: number) => ({ ...p, isBuiltIn: false, originalIndex: i }))
                    ].map((page: any, idx: number) => {
                      const isActive = page.isBuiltIn 
                        ? (settings.builtin_pages_status?.[page.slug] !== false)
                        : (page.status !== 'inactive');
                      
                      return (
                        <tr key={idx} className="border-b border-brand-navy/5 hover:bg-brand-paper/10">
                          <td className="py-4 px-6 text-sm font-sans text-brand-navy flex items-center gap-2">
                            {page.title}
                            {page.isBuiltIn && <span className="text-[10px] bg-brand-navy/5 text-brand-navy/50 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Built-in</span>}
                          </td>
                          <td className="py-4 px-6 text-sm font-sans text-brand-navy">/{page.slug}</td>
                          <td className="py-4 px-6 text-sm font-sans text-brand-navy">
                            <button 
                              onClick={() => {
                                if (page.isBuiltIn) {
                                  const currentStatus = settings.builtin_pages_status || {};
                                  saveSetting('builtin_pages_status', {
                                    ...currentStatus,
                                    [page.slug]: !isActive
                                  });
                                } else {
                                  const newPages = [...safeArray(settings.custom_pages)];
                                  newPages[page.originalIndex].status = isActive ? 'inactive' : 'active';
                                  saveSetting('custom_pages', newPages);
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20'}`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-4 px-6 flex gap-2">
                            {!page.isBuiltIn && (
                              <>
                                <button 
                                  onClick={() => {
                                    console.log('Edit page', page);
                                  }}
                                  className="text-brand-teal hover:text-brand-teal/80 text-sm font-bold uppercase tracking-widest"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    const newPages = safeArray(settings.custom_pages).filter((_: any, i: number) => i !== page.originalIndex);
                                    saveSetting('custom_pages', newPages);
                                  }}
                                  className="text-brand-coral hover:text-brand-coral/80 text-sm font-bold uppercase tracking-widest"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Hero Banner</h3>
                <div className="space-y-6">
                  <BannerInput 
                    label="Banner Media (Image or Video)"
                    value={settings.hero?.banner_url}
                    type={settings.hero?.banner_type || 'image'}
                    onUpload={async (file: File) => {
                      const url = await uploadFile(file, 'banners');
                      if (url) {
                        const type = file.type.startsWith('video/') ? 'video' : 'image';
                        saveSetting('hero', { ...settings.hero, banner_url: url, banner_type: type });
                      }
                    }}
                    onChange={(val: string) => saveSetting('hero', { ...settings.hero, banner_url: val })}
                  />
                  <TextInput 
                    label="Main Title" 
                    value={settings.hero?.title} 
                    onChange={(val) => saveSetting('hero', { ...settings.hero, title: val })} 
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Title Color</label>
                      <input
                        type="color"
                        value={settings.hero?.title_color || '#ffffff'}
                        onChange={(e) => saveSetting('hero', { ...settings.hero, title_color: e.target.value })}
                        className="w-full h-12 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Explore Button Color</label>
                      <input
                        type="color"
                        value={settings.hero?.button_color || '#008080'}
                        onChange={(e) => saveSetting('hero', { ...settings.hero, button_color: e.target.value })}
                        className="w-full h-12 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                  <TextAreaInput 
                    label="Subtitle" 
                    value={settings.hero?.subtitle} 
                    onChange={(val) => saveSetting('hero', { ...settings.hero, subtitle: val })} 
                  />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Title Font</label>
                    <select
                      value={settings.hero?.title_font || 'font-serif'}
                      onChange={(e) => saveSetting('hero', { ...settings.hero, title_font: e.target.value })}
                      className="w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm font-sans text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all"
                    >
                      <option value="font-serif">Serif (Elegant)</option>
                      <option value="font-sans">Sans (Modern)</option>
                      <option value="font-mono">Mono (Technical)</option>
                      <option value="font-display">Display (Bold)</option>
                    </select>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Introduction Section</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Intro Title" 
                    value={settings.introduction?.title} 
                    onChange={(val) => saveSetting('introduction', { ...settings.introduction, title: val })} 
                  />
                  <TextAreaInput 
                    label="Intro Summary" 
                    value={settings.introduction?.summary} 
                    onChange={(val) => saveSetting('introduction', { ...settings.introduction, summary: val })} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'why' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-brand-navy">Why Us Pillars</h3>
                <button 
                  onClick={() => {
                    const defaultPillars = [
                      {
                        title: "Authentic Connections",
                        description: "We focus on fostering genuine relationships with our B2B partners by understanding their needs and providing personalized solutions."
                      },
                      {
                        title: "Curated Luxury",
                        description: "Our strategy centers on curating unique luxury experiences that showcase the beauty and culture of the Maldives."
                      },
                      {
                        title: "Streamlined Collaboration",
                        description: "We aim to enhance collaboration that simplify the booking process and improve communication, ensuring seamless service delivery."
                      },
                      {
                        title: "Tailored Support",
                        description: "We offer dedicated support to our partners, providing them with the insights and resources needed to effectively promote our offerings."
                      }
                    ];
                    saveSetting('why_us', defaultPillars);
                  }}
                  className="text-[10px] font-bold text-brand-teal uppercase tracking-widest hover:underline"
                >
                  Reset to Defaults
                </button>
              </div>
              {safeArray(settings.why_us).map((pillar: any, idx: number) => (
                <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group">
                  <button 
                    onClick={() => {
                      const newPillars = safeArray(settings.why_us).filter((_: any, i: number) => i !== idx);
                      saveSetting('why_us', newPillars);
                    }}
                    className="absolute top-4 right-4 p-2 text-brand-coral opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <TextInput 
                    label="Pillar Title" 
                    value={pillar.title} 
                    onChange={(val) => {
                      const newPillars = [...safeArray(settings.why_us)];
                      newPillars[idx].title = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                  <TextAreaInput 
                    label="Pillar Description" 
                    value={pillar.description} 
                    onChange={(val) => {
                      const newPillars = [...safeArray(settings.why_us)];
                      newPillars[idx].description = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                </div>
              ))}
              <button 
                onClick={() => saveSetting('why_us', [...safeArray(settings.why_us), { title: 'New Pillar', description: '' }])}
                className="w-full py-6 border-2 border-dashed border-brand-navy/10 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Pillar
              </button>
            </div>
          )}

          {activeTab === 'retreats' && (
            <div className="space-y-6">
              <h3 className="text-xl font-serif text-brand-navy mb-6">Featured Resorts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resorts.map(resort => {
                  return (
                    <button
                      key={resort.id}
                      onClick={() => toggleFeatured(resort)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        resort.is_featured ? 'bg-brand-teal/5 border-brand-teal text-brand-teal' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:border-brand-navy/20'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest font-sans">{resort.name}</span>
                      {resort.is_featured ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {activeTab === 'excellence' && (
            <div className="space-y-8">
              <h3 className="text-xl font-serif text-brand-navy">Platform Excellence</h3>
              <div className="space-y-6">
                {safeArray(settings.platform_excellence).map((item: any, idx: number) => (
                  <div key={idx} className="p-6 bg-brand-paper/30 rounded-2xl space-y-4">
                    <TextInput 
                      label="Title" 
                      value={item.title} 
                      onChange={(val) => {
                        const newItems = [...safeArray(settings.platform_excellence)];
                        newItems[idx].title = val;
                        saveSetting('platform_excellence', newItems);
                      }} 
                    />
                    <TextAreaInput 
                      label="Description" 
                      value={item.description} 
                      onChange={(val) => {
                        const newItems = [...safeArray(settings.platform_excellence)];
                        newItems[idx].description = val;
                        saveSetting('platform_excellence', newItems);
                      }} 
                    />
                    <button 
                      onClick={() => {
                        const newItems = safeArray(settings.platform_excellence).filter((_: any, i: number) => i !== idx);
                        saveSetting('platform_excellence', newItems);
                      }}
                      className="text-brand-coral text-[10px] font-bold uppercase tracking-widest"
                    >
                      Remove Item
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('platform_excellence', [...safeArray(settings.platform_excellence), { title: 'New Feature', description: '' }])}
                  className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Excellence Feature
                </button>
              </div>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="space-y-8">
              <h3 className="text-xl font-serif text-brand-navy">Global Markets</h3>
              <div className="space-y-6">
                {safeArray(settings.global_markets).map((item: any, idx: number) => (
                  <div key={idx} className="p-6 bg-brand-paper/30 rounded-2xl space-y-4">
                    <TextInput 
                      label="Market Name" 
                      value={item.name} 
                      onChange={(val) => {
                        const newItems = [...safeArray(settings.global_markets)];
                        newItems[idx].name = val;
                        saveSetting('global_markets', newItems);
                      }} 
                    />
                    <TextAreaInput 
                      label="Description" 
                      value={item.description} 
                      onChange={(val) => {
                        const newItems = [...safeArray(settings.global_markets)];
                        newItems[idx].description = val;
                        saveSetting('global_markets', newItems);
                      }} 
                    />
                    <button 
                      onClick={() => {
                        const newItems = safeArray(settings.global_markets).filter((_: any, i: number) => i !== idx);
                        saveSetting('global_markets', newItems);
                      }}
                      className="text-brand-coral text-[10px] font-bold uppercase tracking-widest"
                    >
                      Remove Market
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('global_markets', [...safeArray(settings.global_markets), { name: 'New Market', description: '' }])}
                  className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Global Market
                </button>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8">
              <h3 className="text-xl font-serif text-brand-navy">DMC Services</h3>
              <div className="space-y-6">
                {safeArray(settings.services).map((item: any, idx: number) => (
                  <div key={idx} className="p-6 bg-brand-paper/30 rounded-2xl space-y-4">
                    <TextInput 
                      label="Service Title" 
                      value={item.title} 
                      onChange={(val) => {
                        const newItems = [...safeArray(settings.services)];
                        newItems[idx].title = val;
                        saveSetting('services', newItems);
                      }} 
                    />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">Icon</label>
                      <select
                        value={item.icon}
                        onChange={(e) => {
                          const newItems = [...safeArray(settings.services)];
                          newItems[idx].icon = e.target.value;
                          saveSetting('services', newItems);
                        }}
                        className="w-full bg-white border border-brand-navy/10 rounded-xl px-4 py-3 text-sm font-sans text-brand-navy focus:outline-none focus:border-brand-teal transition-all"
                      >
                        <option value="Hotel">Hotel</option>
                        <option value="Plane">Plane</option>
                        <option value="UserCheck">UserCheck</option>
                        <option value="Calendar">Calendar</option>
                        <option value="Smile">Smile</option>
                        <option value="Zap">Zap</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => {
                        const newItems = safeArray(settings.services).filter((_: any, i: number) => i !== idx);
                        saveSetting('services', newItems);
                      }}
                      className="text-brand-coral text-[10px] font-bold uppercase tracking-widest"
                    >
                      Remove Service
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('services', [...safeArray(settings.services), { title: 'New Service', icon: 'Zap' }])}
                  className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add DMC Service
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ceo' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">CEO's Message</h3>
                <div className="space-y-6">
                  <LogoInput 
                    label="CEO Photo" 
                    value={settings.ceo_message?.photo_url} 
                    onUpload={async (file: File) => {
                      const url = await uploadFile(file, 'ceo');
                      if (url) saveSetting('ceo_message', { ...settings.ceo_message, photo_url: url });
                    }}
                    onChange={(val: string) => saveSetting('ceo_message', { ...settings.ceo_message, photo_url: val })} 
                  />
                  <TextInput 
                    label="CEO Name" 
                    value={settings.ceo_message?.name} 
                    onChange={(val) => saveSetting('ceo_message', { ...settings.ceo_message, name: val })} 
                  />
                  <TextAreaInput 
                    label="Message" 
                    value={settings.ceo_message?.message} 
                    onChange={(val) => saveSetting('ceo_message', { ...settings.ceo_message, message: val })} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Our Story</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Section Title" 
                    value={settings.our_story?.title} 
                    onChange={(val) => saveSetting('our_story', { ...settings.our_story, title: val })} 
                  />
                  <TextAreaInput 
                    label="Story Content" 
                    value={settings.our_story?.content} 
                    onChange={(val) => saveSetting('our_story', { ...settings.our_story, content: val })} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'awards' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Prestigious Awards</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Section Title" 
                    value={settings.awards?.title} 
                    onChange={(val) => saveSetting('awards', { ...settings.awards, title: val })} 
                  />
                  <TextAreaInput 
                    label="Summary" 
                    value={settings.awards?.summary} 
                    onChange={(val) => saveSetting('awards', { ...settings.awards, summary: val })} 
                  />
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Award Badges & Logos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {safeArray(settings.awards?.items).map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={item.url} alt="Award" className="w-full aspect-square object-contain bg-brand-paper rounded-2xl p-4" />
                          <button 
                            onClick={() => {
                              const newItems = safeArray(settings.awards?.items).filter((_: any, i: number) => i !== idx);
                              saveSetting('awards', { ...settings.awards, items: newItems });
                            }}
                            className="absolute top-2 right-2 p-1 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadFile(file, 'awards');
                              if (url) {
                                const newItems = [...safeArray(settings.awards?.items), { url }];
                                saveSetting('awards', { ...settings.awards, items: newItems });
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-2xl flex flex-col items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={24} />
                        <span className="text-[8px] font-bold uppercase tracking-widest mt-2">Add Award</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ctas' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Call to Action Sections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-brand-paper/30 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Become a Partner</h4>
                    <TextInput 
                      label="Title" 
                      value={settings.ctas?.partner_title} 
                      onChange={(val) => saveSetting('ctas', { ...settings.ctas, partner_title: val })} 
                    />
                    <TextInput 
                      label="Button Text" 
                      value={settings.ctas?.partner_btn} 
                      onChange={(val) => saveSetting('ctas', { ...settings.ctas, partner_btn: val })} 
                    />
                  </div>
                  <div className="p-6 bg-brand-paper/30 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Travel Guide</h4>
                    <TextInput 
                      label="Title" 
                      value={settings.ctas?.guide_title} 
                      onChange={(val) => saveSetting('ctas', { ...settings.ctas, guide_title: val })} 
                    />
                    <TextInput 
                      label="Button Text" 
                      value={settings.ctas?.guide_btn} 
                      onChange={(val) => saveSetting('ctas', { ...settings.ctas, guide_btn: val })} 
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">WhatsApp Integration</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-6 bg-brand-paper/30 rounded-3xl">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-brand-navy">Enable WhatsApp Button</h4>
                      <p className="text-xs text-brand-navy/40">Show a WhatsApp floating button on the website</p>
                    </div>
                    <button 
                      onClick={() => saveSetting('whatsapp', { ...settings.whatsapp, enabled: !settings.whatsapp?.enabled })}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.whatsapp?.enabled ? 'bg-brand-teal' : 'bg-brand-navy/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.whatsapp?.enabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <TextInput 
                    label="WhatsApp Number (with country code, e.g., 9601234567)" 
                    value={settings.whatsapp?.number} 
                    onChange={(val) => saveSetting('whatsapp', { ...settings.whatsapp, number: val })} 
                    icon={<Phone size={14} />}
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Memberships & Footer Awards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Membership Logos</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {safeArray(settings.footer?.memberships).map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={item.url} alt="Membership" className="w-full aspect-square object-contain bg-brand-paper rounded-xl p-2" />
                          <button 
                            onClick={() => {
                              const newItems = safeArray(settings.footer?.memberships).filter((_: any, i: number) => i !== idx);
                              saveSetting('footer', { ...settings.footer, memberships: newItems });
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadFile(file, 'footer');
                              if (url) {
                                const newItems = [...safeArray(settings.footer?.memberships || []), { url }];
                                saveSetting('footer', { ...settings.footer, memberships: newItems });
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Award Badges</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {safeArray(settings.footer?.awards).map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={item.url} alt="Award" className="w-full aspect-square object-contain bg-brand-paper rounded-xl p-2" />
                          <button 
                            onClick={() => {
                              const newItems = safeArray(settings.footer?.awards).filter((_: any, i: number) => i !== idx);
                              saveSetting('footer', { ...settings.footer, awards: newItems });
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await uploadFile(file, 'footer');
                              if (url) {
                                const newItems = [...safeArray(settings.footer?.awards || []), { url }];
                                saveSetting('footer', { ...settings.footer, awards: newItems });
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TextInput 
                    label="Email" 
                    value={settings.footer?.contact?.email || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...(settings.footer?.contact || {}), email: val } })} 
                    icon={<Mail size={14} />}
                  />
                  <TextInput 
                    label="Phone" 
                    value={settings.footer?.contact?.phone || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...(settings.footer?.contact || {}), phone: val } })} 
                    icon={<Phone size={14} />}
                  />
                  <TextInput 
                    label="Address" 
                    value={settings.footer?.contact?.address || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...(settings.footer?.contact || {}), address: val } })} 
                    icon={<MapPin size={14} />}
                  />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <TextInput 
                    label="Instagram" 
                    value={settings.footer?.social?.instagram || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), instagram: val } })} 
                    icon={<Instagram size={14} />}
                  />
                  <TextInput 
                    label="LinkedIn" 
                    value={settings.footer?.social?.linkedin || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), linkedin: val } })} 
                    icon={<Linkedin size={14} />}
                  />
                  <TextInput 
                    label="Facebook" 
                    value={settings.footer?.social?.facebook || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), facebook: val } })} 
                    icon={<Facebook size={14} />}
                  />
                  <TextInput 
                    label="Twitter" 
                    value={settings.footer?.social?.twitter || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), twitter: val } })} 
                    icon={<Twitter size={14} />}
                  />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Footer Link Columns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30 mb-4">Important Links</h4>
                    <div className="space-y-4">
                      {safeArray(settings.footer?.important_links).map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <TextInput value={link.label} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.important_links)];
                            newLinks[idx].label = val;
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} />
                          <TextInput value={link.path} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.important_links)];
                            newLinks[idx].path = val;
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} />
                          <button onClick={() => {
                            const newLinks = safeArray(settings.footer?.important_links).filter((_: any, i: number) => i !== idx);
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} className="p-2 text-brand-coral"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => saveSetting('footer', { ...settings.footer, important_links: [...safeArray(settings.footer?.important_links), { label: 'New Link', path: '/' }] })} className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">+ Add Link</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30 mb-4">Legal & Media</h4>
                    <div className="space-y-4">
                      {safeArray(settings.footer?.legal_links).map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <TextInput value={link.label} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.legal_links)];
                            newLinks[idx].label = val;
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} />
                          <TextInput value={link.path} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.legal_links)];
                            newLinks[idx].path = val;
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} />
                          <button onClick={() => {
                            const newLinks = safeArray(settings.footer?.legal_links).filter((_: any, i: number) => i !== idx);
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} className="p-2 text-brand-coral"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => saveSetting('footer', { ...settings.footer, legal_links: [...safeArray(settings.footer?.legal_links), { label: 'New Link', path: '/' }] })} className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">+ Add Link</button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TextInput({ label, value, onChange, icon }: any) {
  return (
    <div className="flex-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30">{icon}</div>}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
}

function TextAreaInput({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy resize-none"
      />
    </div>
  );
}

function LogoInput({ label, value, onUpload, onChange }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-brand-paper/30 p-4 rounded-2xl">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-4 font-sans">{label}</label>
      <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center h-24 overflow-hidden border border-brand-navy/5 relative group">
        {value ? (
          <img src={value} alt={label} className="max-h-full object-contain" referrerPolicy="no-referrer" />
        ) : (
          <div className="text-brand-navy/10"><Image size={32} /></div>
        )}
        <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white rounded-full text-brand-navy hover:bg-brand-teal hover:text-white transition-all"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <input
        type="text"
        placeholder="Logo URL"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border-none rounded-lg px-3 py-2 text-[10px] focus:ring-1 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy"
      />
    </div>
  );
}

function BannerInput({ label, value, type, onUpload, onChange }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-brand-paper/30 p-6 rounded-3xl">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-4 font-sans">{label}</label>
      <div className="bg-white rounded-2xl mb-4 flex items-center justify-center aspect-video overflow-hidden border border-brand-navy/5 relative group">
        {value ? (
          type === 'video' ? (
            <video src={value} className="w-full h-full object-cover" controls />
          ) : (
            <img src={value} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          )
        ) : (
          <div className="text-brand-navy/10"><Image size={48} /></div>
        )}
        <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-teal hover:text-white transition-all"
          >
            <Upload size={14} />
            Upload File
          </button>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <input
        type="text"
        placeholder="Media URL"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy"
      />
    </div>
  );
}
