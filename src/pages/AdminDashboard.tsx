import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Hotel, Users, FileText, MessageSquare, Settings, Plus, Search, Check, X, Edit2, Trash2, Upload, Palette, Image, Globe, Link2, Phone, Mail, MapPin, Instagram, Linkedin, Facebook, Twitter, Play, Eye, Send } from 'lucide-react';
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
      <main className="flex-1 p-10 overflow-y-auto">
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

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('resorts').select('id').limit(1);
        if (error) {
          setConnectionStatus('failed');
          setErrorMsg(error.message);
        } else {
          setConnectionStatus('success');
        }
      } catch (err: any) {
        setConnectionStatus('failed');
        setErrorMsg(err.message);
      }
    };
    testConnection();
  }, []);

  const seedData = async () => {
    setSeeding(true);
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
      },
      {
        name: "One&Only Reethi Rah",
        atoll: "North Malé Atoll",
        location: "Reethi Rah",
        description: "A jewel among a string of coral atolls, lagoons and white sands. Experience pure luxury.",
        category: "Ultra-Luxury",
        transfer_type: "Luxury Yacht",
        meal_plans: ["Bed & Breakfast"],
        room_types: [{ name: "Beach Villa", max_guests: 3, size: "135sqm" }],
        highlights: ["Privacy", "Thirteen Beaches", "World-class Spa"],
        images: ["https://picsum.photos/seed/oneonly/1200/800"],
        is_featured: true
      },
      {
        name: "Velaa Private Island",
        atoll: "Noonu Atoll",
        location: "Velaa Island",
        description: "The ultimate island escape, Velaa Private Island was born from the passion to create a truly private luxury retreat.",
        category: "Ultra-Luxury",
        transfer_type: "Seaplane",
        meal_plans: ["Bed & Breakfast"],
        room_types: [{ name: "Beach Pool Villa", max_guests: 2, size: "287sqm" }],
        highlights: ["Golf Course", "Snow Room", "Private Submarine"],
        images: ["https://picsum.photos/seed/velaa/1200/800"],
        is_featured: false
      },
      {
        name: "Joali Maldives",
        atoll: "Raa Atoll",
        location: "Muravandhoo Island",
        description: "The first art-immersive resort in the Maldives, Joali is a wonderland of creativity and luxury.",
        category: "Ultra-Luxury",
        transfer_type: "Seaplane",
        meal_plans: ["Bed & Breakfast", "Half Board"],
        room_types: [{ name: "Luxury Beach Villa", max_guests: 2, size: "108sqm" }],
        highlights: ["Art Studio", "Manta Treehouse", "Sustainable Luxury"],
        images: ["https://picsum.photos/seed/joali/1200/800"],
        is_featured: false
      },
      {
        name: "Cheval Blanc Randheli",
        atoll: "Noonu Atoll",
        location: "Randheli Island",
        description: "An intimate and contemporary haven designed by Jean-Michel Gathy.",
        category: "Ultra-Luxury",
        transfer_type: "Custom Seaplane",
        meal_plans: ["Bed & Breakfast"],
        room_types: [{ name: "Island Villa", max_guests: 2, size: "240sqm" }],
        highlights: ["Designer Interiors", "Culinary Excellence", "Private Butler"],
        images: ["https://picsum.photos/seed/cheval/1200/800"],
        is_featured: false
      },
      {
        name: "Four Seasons Landaa Giraavaru",
        atoll: "Baa Atoll",
        location: "Landaa Giraavaru",
        description: "A natural UNESCO Biosphere Reserve wilderness where luxury meets conservation.",
        category: "Luxury",
        transfer_type: "Seaplane",
        meal_plans: ["Bed & Breakfast", "Half Board", "Full Board"],
        room_types: [{ name: "Ocean Villa", max_guests: 3, size: "139sqm" }],
        highlights: ["Manta Ray Research", "Ayurvedic Spa", "Turtle Rehab"],
        images: ["https://picsum.photos/seed/fourseasons/1200/800"],
        is_featured: false
      },
      {
        name: "Six Senses Laamu",
        atoll: "Laamu Atoll",
        location: "Olhuveli Island",
        description: "The only resort in the Laamu Atoll, deep in the Indian Ocean.",
        category: "Luxury",
        transfer_type: "Domestic Flight + Boat",
        meal_plans: ["Bed & Breakfast", "Half Board"],
        room_types: [{ name: "Lagoon Water Villa", max_guests: 2, size: "108sqm" }],
        highlights: ["Sustainability", "Surfing", "Outdoor Cinema"],
        images: ["https://picsum.photos/seed/sixsenses/1200/800"],
        is_featured: false
      },
      {
        name: "Amilla Maldives",
        atoll: "Baa Atoll",
        location: "Finolhas",
        description: "A stylish, contemporary resort offering a unique 'island home' experience.",
        category: "Luxury",
        transfer_type: "Seaplane",
        meal_plans: ["Bed & Breakfast", "Half Board", "Full Board", "All Inclusive"],
        room_types: [{ name: "Treetop Villa", max_guests: 2, size: "220sqm" }],
        highlights: ["Treetop Villas", "Wellness Lab", "Glamping"],
        images: ["https://picsum.photos/seed/amilla/1200/800"],
        is_featured: false
      },
      {
        name: "Patina Maldives",
        atoll: "North Malé Atoll",
        location: "Fari Islands",
        description: "A sophisticated sanctuary for the next generation of travelers.",
        category: "Luxury",
        transfer_type: "Speedboat",
        meal_plans: ["Bed & Breakfast", "Half Board"],
        room_types: [{ name: "One Bedroom Villa", max_guests: 2, size: "170sqm" }],
        highlights: ["Fari Marina Village", "James Turrell Skyspace", "Plant-based Dining"],
        images: ["https://picsum.photos/seed/patina/1200/800"],
        is_featured: false
      }
    ];

    try {
      const { data: resorts, error: resortError } = await supabase.from('resorts').insert(sampleResorts).select();
      if (resortError) throw resortError;

      // Seed some demo requests
      if (resorts && resorts.length > 0) {
        setSeedStatus('Seeding booking requests...');
        const demoRequests = [
          {
            agent_id: 'demo-id',
            resort_id: resorts[0].id,
            resort_name: resorts[0].name,
            check_in: '2026-06-01',
            check_out: '2026-06-08',
            guests: 2,
            room_type: "Crusoe Villa",
            status: 'confirmed'
          },
          {
            agent_id: 'demo-id',
            resort_id: resorts[1].id,
            resort_name: resorts[1].name,
            check_in: '2026-07-15',
            check_out: '2026-07-22',
            guests: 2,
            room_type: "Villa Suite",
            status: 'in_progress'
          }
        ];
        const { error: bookingError } = await supabase.from('booking_requests').insert(demoRequests);
        if (bookingError) throw bookingError;
      }

      setSeedStatus('Seeding site settings...');
      const initialSettings = [
        {
          key: 'logos',
          value: {
            primary: 'https://ais-pre-y3ndb5ovco74k3lwrzfovr-197064912503.asia-east1.run.app/logo-primary.png',
            white: 'https://ais-pre-y3ndb5ovco74k3lwrzfovr-197064912503.asia-east1.run.app/logo-white.png',
            black: 'https://ais-pre-y3ndb5ovco74k3lwrzfovr-197064912503.asia-east1.run.app/logo-black.png'
          }
        },
        {
          key: 'navbar',
          value: [
            { label: 'Home', path: '/' },
            { label: 'Resorts', path: '/resorts' },
            { label: 'About Us', path: '/about' },
            { label: 'Contact', path: '/contact' }
          ]
        },
        {
          key: 'hero',
          value: {
            title: 'EXPERIENCE THE EXTRAORDINARY',
            subtitle: 'Curated Luxury Escapes in the Heart of the Maldives'
          }
        },
        {
          key: 'introduction',
          value: {
            title: 'YOUR MALDIVES EXPERTS',
            summary: 'With over a decade of experience in luxury travel, Exciting Maldives brings you the most exclusive resorts and personalized service in the worlds most beautiful destination.'
          }
        },
        {
          key: 'why_us',
          value: [
            { title: 'EXPERT KNOWLEDGE', description: 'Our team has personally visited and vetted every resort we recommend.' },
            { title: 'EXCLUSIVE OFFERS', description: 'Access special rates and perks not available anywhere else.' },
            { title: 'PERSONAL SERVICE', description: 'Dedicated travel consultants to handle every detail of your journey.' }
          ]
        },
        {
          key: 'partner',
          value: {
            title: 'BECOME A PARTNER',
            summary: 'Join our network of elite travel partners and gain access to the best of the Maldives.',
            partner_url: '/become-partner',
            guide_url: '/tourist-info'
          }
        },
        {
          key: 'footer',
          value: {
            contact: {
              email: 'hello@excitingmaldives.com',
              phone: '+960 123 4567',
              address: 'H. Malé, Republic of Maldives'
            },
            social: {
              instagram: 'https://instagram.com/excitingmaldives',
              linkedin: 'https://linkedin.com/company/excitingmaldives',
              facebook: 'https://facebook.com/excitingmaldives'
            }
          }
        }
      ];

      for (const setting of initialSettings) {
        await supabase.from('site_settings').upsert(setting, { onConflict: 'key' });
      }

      setSeedStatus('Success! Sample data seeded.');
      setTimeout(() => setSeedStatus(null), 5000);
    } catch (err: any) {
      console.error('Seeding failed:', err.message);
      setSeedStatus('Error: ' + err.message);
    } finally {
      setSeeding(false);
    }
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
        <div className="flex gap-4 items-center">
          {seedStatus && (
            <div className={`text-[10px] font-bold uppercase tracking-widest font-sans ${
              seedStatus.startsWith('Error') ? 'text-brand-coral' : 
              seedStatus.startsWith('Success') ? 'text-green-600' : 'text-brand-teal animate-pulse'
            }`}>
              {seedStatus}
            </div>
          )}
          {connectionStatus === 'failed' && (
            <div className="text-[10px] text-brand-coral font-sans max-w-xs truncate" title={errorMsg}>
              {errorMsg}
            </div>
          )}
          <button 
            onClick={seedData}
            disabled={seeding || connectionStatus !== 'success'}
            className="bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all disabled:opacity-50 font-sans shadow-lg shadow-brand-teal/20"
          >
            {seeding ? 'Seeding...' : 'Seed Sample Data'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard label="Total Resorts" value="42" />
        <StatCard label="Active Partners" value="156" />
        <StatCard label="New Requests" value="12" />
        <StatCard label="Active Chats" value="5" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
      <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/30 mb-1 font-sans">{label}</p>
      <p className="text-3xl font-serif text-brand-navy">{value}</p>
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
        .from('agents')
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
      .from('agents')
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

  useEffect(() => {
    fetchSettings();
    fetchResorts();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('site_settings').select('*');
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
      
      // Apply defaults for missing critical sections
      const finalSettings = {
        hero: {
          title: 'The Art of Maldivian Luxury',
          subtitle: 'Bespoke Destination Management for Travel Professionals',
          banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
          banner_type: 'image',
          ...settingsMap.hero
        },
        introduction: {
          title: 'Bespoke Destination Management',
          summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships. We offer tailored, high-end travel solutions that highlight the beauty and culture of the Maldives, ensuring our partners can deliver unforgettable and seamless experiences to their clients.',
          ...settingsMap.introduction
        },
        ...settingsMap
      };

      setSettings(finalSettings);
    }
    setLoading(false);
  };

  const fetchResorts = async () => {
    const { data } = await supabase.from('resorts').select('id, name');
    if (data) setResorts(data);
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
        const publishPromises = draftData.map(draft => {
          const publishedKey = draft.key.replace(':draft', ':published');
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

  const handlePreview = () => {
    window.open(`${window.location.origin}/?preview=true`, '_blank');
  };

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('site-assets')
      .upload(filePath, file);

    if (uploadError) {
      // If bucket doesn't exist, we might need to handle it, but for now assume it does
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('site-assets')
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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5"
        >
          {activeTab === 'nav' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Navigation Items</h3>
                <div className="space-y-4">
                  {(settings.navbar || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-brand-paper/30 p-4 rounded-2xl">
                      <TextInput 
                        label="Label" 
                        value={item.label} 
                        onChange={(val) => {
                          const newNav = [...settings.navbar];
                          newNav[idx].label = val;
                          saveSetting('navbar', newNav);
                        }} 
                      />
                      <TextInput 
                        label="Path" 
                        value={item.path} 
                        onChange={(val) => {
                          const newNav = [...settings.navbar];
                          newNav[idx].path = val;
                          saveSetting('navbar', newNav);
                        }} 
                      />
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
                    value={settings.footer?.contact?.email} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...settings.footer.contact, email: val } })} 
                    icon={<Mail size={14} />}
                  />
                  <TextInput 
                    label="Phone" 
                    value={settings.footer?.contact?.phone} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...settings.footer.contact, phone: val } })} 
                    icon={<Phone size={14} />}
                  />
                  <TextInput 
                    label="Address" 
                    value={settings.footer?.contact?.address} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...settings.footer.contact, address: val } })} 
                    icon={<MapPin size={14} />}
                  />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <TextInput 
                    label="Instagram" 
                    value={settings.footer?.social?.instagram} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...settings.footer.social, instagram: val } })} 
                    icon={<Instagram size={14} />}
                  />
                  <TextInput 
                    label="LinkedIn" 
                    value={settings.footer?.social?.linkedin} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...settings.footer.social, linkedin: val } })} 
                    icon={<Linkedin size={14} />}
                  />
                  <TextInput 
                    label="Facebook" 
                    value={settings.footer?.social?.facebook} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...settings.footer.social, facebook: val } })} 
                    icon={<Facebook size={14} />}
                  />
                  <TextInput 
                    label="Twitter" 
                    value={settings.footer?.social?.twitter} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...settings.footer.social, twitter: val } })} 
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
