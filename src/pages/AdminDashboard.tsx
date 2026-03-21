import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Hotel, Users, FileText, MessageSquare, Settings, Plus, Search, Check, X, Edit2, Trash2, Upload, Palette, Image, Globe, Link2, Phone, Mail, MapPin, Instagram, Linkedin, Facebook, Twitter, Play, Eye, Send, History, RefreshCw, Database, Shield, LogOut, Palmtree, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { extractResortDataFromPDF } from '../services/ai';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-brand-paper/10">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy text-white p-6 flex flex-col shadow-2xl">
        <div className="mb-12">
          <h2 className="text-xl font-serif font-bold tracking-[0.2em] text-brand-beige">ADMIN CENTER</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarLink to="/admin" icon={<LayoutDashboard size={18} />} label="Overview" active={location.pathname === '/admin'} />
          <SidebarLink to="/admin/resorts" icon={<Hotel size={18} />} label="Resorts" active={location.pathname.startsWith('/admin/resorts')} />
          <SidebarLink to="/admin/bookings" icon={<FileText size={18} />} label="Bookings" active={location.pathname.startsWith('/admin/bookings')} />
          <SidebarLink to="/admin/partners" icon={<Users size={18} />} label="Partner Management" active={location.pathname.startsWith('/admin/partners')} />
          <SidebarLink to="/admin/customization" icon={<Palette size={18} />} label="Page Customization" active={location.pathname.startsWith('/admin/customization')} />
          <SidebarLink to="/admin/resources" icon={<Settings size={18} />} label="Resources" active={location.pathname.startsWith('/admin/resources')} />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-brand-navy/5 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-paper rounded-xl flex items-center justify-center text-brand-teal">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Admin Control Center</h2>
              <p className="text-[10px] text-brand-navy/40 font-medium">System Management & Content Control</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-brand-navy">Administrator</span>
              <span className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Super Admin</span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('demo_mode');
                supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="p-3 bg-brand-paper rounded-xl text-brand-navy/40 hover:text-brand-coral hover:bg-brand-coral/5 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10 bg-brand-paper/30">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/resorts" element={<AdminResorts />} />
            <Route path="/bookings" element={<AdminBookings />} />
            <Route path="/partners" element={<AdminPartners />} />
            <Route path="/customization" element={<AdminPageCustomization />} />
            <Route path="/resources" element={<AdminResources />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AdminResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setResources(data);
      }
    };
    fetchResources();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Resource Library</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-teal/20"
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
}

function SidebarLink({ to, icon, label, active }: any) {
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans ${
        active ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </Link>
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
            title: 'The Art of Maldivian Luxury',
            subtitle: 'Bespoke Destination Management for Travel Professionals',
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
            { label: 'Resorts', path: '/resorts' },
            { label: 'Map', path: '/map' },
            { label: 'Info', path: '/tourist-info' }
          ]
        },
        {
          key: 'footer:published',
          value: {
            contact: { email: 'info@excitingmaldives.com', phone: '+960 123 4567', address: 'Male, Maldives' },
            social: { instagram: '', linkedin: '', facebook: '', twitter: '' },
            important_links: [{ label: 'Resorts', path: '/resorts' }],
            legal_links: [{ label: 'Privacy Policy', path: '/legal' }]
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
                  alert('SQL copied to clipboard!');
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
  const [loading, setLoading] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);

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
        // Pre-fill form with extracted data (simplified for demo)
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

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Resort Management</h1>
        <div className="flex gap-4">
          <label className="cursor-pointer bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-teal/20">
            <Upload size={16} /> {aiProcessing ? 'AI Extracting...' : 'AI Upload PDF'}
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={aiProcessing} />
          </label>
          <button 
            onClick={() => setIsAdding(true)}
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
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans ${resort.is_featured ? 'bg-brand-beige/20 text-brand-beige' : 'bg-brand-paper text-brand-navy/30'}`}>
                    {resort.is_featured ? 'Featured' : 'Standard'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"><Edit2 size={16} /></button>
                    <button className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"><Trash2 size={16} /></button>
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

function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setBookings(data);
      }
    };
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('booking_requests')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-serif mb-10 text-brand-navy">Booking Requests</h1>
      <div className="space-y-4">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 flex items-center justify-between hover:shadow-2xl transition-all">
            <div className="flex items-center gap-6">
              <div className="bg-brand-paper p-4 rounded-2xl text-brand-teal">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-brand-navy">{booking.resort_name}</h3>
                <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold font-sans">
                  {booking.check_in} - {booking.check_out} • {booking.guests} Guests • {booking.room_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={booking.status}
                onChange={(e) => updateStatus(booking.id, e.target.value)}
                className="bg-brand-paper border-none rounded-xl text-[10px] font-bold uppercase tracking-widest px-4 py-2 focus:ring-0 font-sans text-brand-navy"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="bg-brand-navy text-white p-2 rounded-full hover:bg-brand-teal transition-colors shadow-lg shadow-brand-navy/10">
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
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
        <h1 className="text-3xl font-serif text-brand-navy">Partner Management</h1>
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shadow-brand-navy/10"
        >
          <Upload size={14} />
          Download All (CSV)
        </button>
      </div>
      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-paper border-b border-brand-navy/5">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Partner / Company</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Contact Details</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Status</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {partners.map(partner => (
              <tr key={partner.id} className="hover:bg-brand-paper/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-brand-navy font-sans">{partner.full_name}</div>
                  <div className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest mt-1">{partner.company_name}</div>
                  {partner.website && (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-teal hover:underline mt-1 block font-sans">
                      {partner.website}
                    </a>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-brand-navy/60 font-sans text-sm">
                    <Mail size={12} className="text-brand-teal" />
                    {partner.email}
                  </div>
                  <div className="flex items-center gap-2 text-brand-navy/60 font-sans text-sm mt-1">
                    <Phone size={12} className="text-brand-teal" />
                    {partner.phone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans ${
                    partner.status === 'active' ? 'bg-green-50 text-green-600' : 
                    partner.status === 'pending' ? 'bg-brand-beige/20 text-brand-beige' : 'bg-brand-coral/10 text-brand-coral'
                  }`}>
                    {partner.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {partner.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(partner.id, 'active')}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => updateStatus(partner.id, partner.status === 'active' ? 'deactivated' : 'active')}
                      className="p-2 text-brand-coral hover:bg-brand-coral/10 rounded-lg transition-all"
                      title={partner.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {partner.status === 'active' ? <X size={16} /> : <Check size={16} />}
                    </button>
                    <button 
                      onClick={() => downloadIndividual(partner)}
                      className="p-2 text-brand-navy/40 hover:text-brand-teal rounded-lg transition-all"
                      title="Download Details"
                    >
                      <Upload size={16} />
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

function AdminPageCustomization() {
  const [activeTab, setActiveTab] = useState('nav');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resorts, setResorts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchResorts();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      
      if (error) {
        // If table doesn't exist (PGRST205), we just return defaults silently
        if (error.code !== 'PGRST205') {
          console.error('Error fetching settings:', error);
        }
        setSettings({
          navbar: [{ label: 'Resorts', path: '/resorts' }, { label: 'Map', path: '/map' }, { label: 'Info', path: '/tourist-info' }],
          hero: { title: 'The Art of Maldivian Luxury', subtitle: 'Bespoke Destination Management for Travel Professionals', banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080', banner_type: 'image' },
          introduction: { title: 'Bespoke Destination Management', summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships.' },
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
            { label: 'Resorts', path: '/resorts' },
            { label: 'Map', path: '/map' },
            { label: 'Info', path: '/tourist-info' }
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
    const { data } = await supabase.from('resorts').select('id, name');
    if (data) setResorts(data);
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
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: `${key}:draft`, value }, { onConflict: 'key' });
    
    if (!error) {
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
        alert('Website published successfully!');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish. Please try again.');
    }
    setPublishing(false);
  };

  const revertHistory = async (key: string, historyItem: any) => {
    if (confirm('Are you sure you want to revert to this version? This will overwrite your current draft.')) {
      await saveSetting(key, historyItem.value);
      setShowHistory(false);
    }
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
        alert(`Storage bucket "${bucket}" not found. Please click "Copy SQL" at the top of the dashboard and run it in your Supabase SQL Editor to create the required tables and buckets.`);
      } else {
        alert(`Upload error: ${uploadError.message}`);
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

      <div className="flex gap-2 mb-8 bg-brand-paper/50 p-1 rounded-2xl w-fit">
        {[
          { id: 'nav', label: 'Nav & Logo', icon: <Globe size={14} /> },
          { id: 'pages', label: 'Custom Pages', icon: <FileText size={14} /> },
          { id: 'hero', label: 'Hero & Intro', icon: <Image size={14} /> },
          { id: 'why', label: 'Why Us', icon: <Check size={14} /> },
          { id: 'retreats', label: 'Featured Retreats', icon: <Hotel size={14} /> },
          { id: 'footer', label: 'Footer', icon: <Settings size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white text-brand-teal shadow-sm' : 'text-brand-navy/40 hover:text-brand-navy'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
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
                  {(settings.navbar || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-brand-paper/30 p-4 rounded-2xl">
                      <div className="flex-1">
                        <TextInput 
                          label="Page" 
                          value={item.label} 
                          onChange={(val) => {
                            const newNav = [...settings.navbar];
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
                            const newNav = [...settings.navbar];
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
                          {(settings.custom_pages || []).map((p: any) => (
                            <option key={p.slug} value={`/${p.slug}`}>
                              {p.title} (/{p.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const newNav = settings.navbar.filter((_: any, i: number) => i !== idx);
                          saveSetting('navbar', newNav);
                        }}
                        className="mt-6 p-2 text-brand-coral hover:bg-brand-coral/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => saveSetting('navbar', [...(settings.navbar || []), { label: 'New Item', path: '/' }])}
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
              <h3 className="text-xl font-serif text-brand-navy mb-6">Custom Pages</h3>
              {(settings.custom_pages || []).map((page: any, idx: number) => (
                <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group">
                  <button 
                    onClick={() => {
                      const newPages = settings.custom_pages.filter((_: any, i: number) => i !== idx);
                      saveSetting('custom_pages', newPages);
                    }}
                    className="absolute top-4 right-4 p-2 text-brand-coral opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput 
                      label="Page Title" 
                      value={page.title} 
                      onChange={(val) => {
                        const newPages = [...settings.custom_pages];
                        newPages[idx].title = val;
                        saveSetting('custom_pages', newPages);
                      }} 
                    />
                    <TextInput 
                      label="Slug (e.g. about-us)" 
                      value={page.slug} 
                      onChange={(val) => {
                        const newPages = [...settings.custom_pages];
                        newPages[idx].slug = val.toLowerCase().replace(/ /g, '-');
                        saveSetting('custom_pages', newPages);
                      }} 
                    />
                  </div>
                  <TextAreaInput 
                    label="Page Content (HTML/Text)" 
                    value={page.content} 
                    onChange={(val) => {
                      const newPages = [...settings.custom_pages];
                      newPages[idx].content = val;
                      saveSetting('custom_pages', newPages);
                    }} 
                  />
                </div>
              ))}
              <button 
                onClick={() => saveSetting('custom_pages', [...(settings.custom_pages || []), { title: 'New Page', slug: 'new-page', content: '' }])}
                className="w-full py-6 border-2 border-dashed border-brand-navy/10 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Create New Page
              </button>
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
                  <TextAreaInput 
                    label="Subtitle" 
                    value={settings.hero?.subtitle} 
                    onChange={(val) => saveSetting('hero', { ...settings.hero, subtitle: val })} 
                  />
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
              {(settings.why_us || []).map((pillar: any, idx: number) => (
                <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group">
                  <button 
                    onClick={() => {
                      const newPillars = settings.why_us.filter((_: any, i: number) => i !== idx);
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
                      const newPillars = [...settings.why_us];
                      newPillars[idx].title = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                  <TextAreaInput 
                    label="Pillar Description" 
                    value={pillar.description} 
                    onChange={(val) => {
                      const newPillars = [...settings.why_us];
                      newPillars[idx].description = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                </div>
              ))}
              <button 
                onClick={() => saveSetting('why_us', [...(settings.why_us || []), { title: 'New Pillar', description: '' }])}
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
                  const isFeatured = (settings.featured_retreats || []).includes(resort.id);
                  return (
                    <button
                      key={resort.id}
                      onClick={() => {
                        const current = settings.featured_retreats || [];
                        const next = isFeatured 
                          ? current.filter((id: string) => id !== resort.id)
                          : [...current, resort.id];
                        saveSetting('featured_retreats', next);
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isFeatured ? 'bg-brand-teal/5 border-brand-teal text-brand-teal' : 'bg-white border-brand-navy/5 text-brand-navy/60 hover:border-brand-navy/20'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest font-sans">{resort.name}</span>
                      {isFeatured ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {activeTab === 'footer' && (
            <div className="space-y-8">
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
                      {(settings.footer?.important_links || []).map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <TextInput value={link.label} onChange={(val) => {
                            const newLinks = [...settings.footer.important_links];
                            newLinks[idx].label = val;
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} />
                          <TextInput value={link.path} onChange={(val) => {
                            const newLinks = [...settings.footer.important_links];
                            newLinks[idx].path = val;
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} />
                          <button onClick={() => {
                            const newLinks = settings.footer.important_links.filter((_: any, i: number) => i !== idx);
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} className="p-2 text-brand-coral"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => saveSetting('footer', { ...settings.footer, important_links: [...(settings.footer?.important_links || []), { label: 'New Link', path: '/' }] })} className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">+ Add Link</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30 mb-4">Legal & Media</h4>
                    <div className="space-y-4">
                      {(settings.footer?.legal_links || []).map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <TextInput value={link.label} onChange={(val) => {
                            const newLinks = [...settings.footer.legal_links];
                            newLinks[idx].label = val;
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} />
                          <TextInput value={link.path} onChange={(val) => {
                            const newLinks = [...settings.footer.legal_links];
                            newLinks[idx].path = val;
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} />
                          <button onClick={() => {
                            const newLinks = settings.footer.legal_links.filter((_: any, i: number) => i !== idx);
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} className="p-2 text-brand-coral"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => saveSetting('footer', { ...settings.footer, legal_links: [...(settings.footer?.legal_links || []), { label: 'New Link', path: '/' }] })} className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">+ Add Link</button>
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
