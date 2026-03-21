import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { LayoutDashboard, Hotel, FileText, MessageSquare, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { Link, Routes, Route } from 'react-router-dom';

export default function AgentDashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    confirmedRequests: 0,
    pendingRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUser(session.user);

      const { data: requests, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('agent_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (requests) {
        setRecentRequests(requests);
      }

      // Simple stats
      const { data: allData } = await supabase
        .from('booking_requests')
        .select('status')
        .eq('agent_id', session.user.id);
      
      if (allData) {
        setStats({
          totalRequests: allData.length,
          confirmedRequests: allData.filter(d => d.status === 'confirmed').length,
          pendingRequests: allData.filter(d => d.status === 'new' || d.status === 'in_progress').length
        });
      }

      setLoading(false);
    };

    fetchAgentData();
  }, []);

  if (loading) return <div className="p-12 text-center font-serif italic text-brand-navy">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-brand-paper/10 min-h-screen">
      <Routes>
        <Route path="/" element={<DashboardOverview stats={stats} recentRequests={recentRequests} user={user} />} />
        <Route path="/requests" element={<AgentRequests />} />
        <Route path="/resources" element={<AgentResources />} />
      </Routes>
    </div>
  );
}

function DashboardOverview({ stats, recentRequests, user }: any) {
  return (
    <>
      <div className="mb-12">
        <h1 className="text-4xl font-serif mb-2 text-brand-navy">Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Agent'}</h1>
        <p className="text-brand-navy/50 text-[10px] uppercase tracking-[0.3em] font-bold font-sans">Your B2B Travel Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
          <div className="bg-brand-teal/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-brand-teal">
            <FileText size={24} />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Total Requests</p>
          <p className="text-4xl font-serif text-brand-navy">{stats.totalRequests}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
          <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-green-600">
            <CheckCircle size={24} />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Confirmed</p>
          <p className="text-4xl font-serif text-brand-navy">{stats.confirmedRequests}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
          <div className="bg-brand-coral/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-brand-coral">
            <Clock size={24} />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Pending</p>
          <p className="text-4xl font-serif text-brand-navy">{stats.pendingRequests}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif text-brand-navy">Recent <span className="italic text-brand-teal">Requests</span></h2>
            <Link to="/agent/requests" className="text-[10px] font-bold uppercase tracking-widest text-brand-teal font-sans hover:text-brand-navy transition-colors">View All</Link>
          </div>
          
          <div className="space-y-4">
            {recentRequests.length > 0 ? recentRequests.map((req: any) => (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-brand-navy/5 shadow-sm flex items-center justify-between hover:border-brand-teal/20 transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="bg-brand-paper w-14 h-14 rounded-xl flex items-center justify-center text-brand-teal">
                    <Hotel size={24} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-brand-navy">{req.resort_name}</h3>
                    <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold font-sans">{req.room_type} • {req.guests} Guests</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 font-sans ${
                    req.status === 'confirmed' ? 'bg-green-50 text-green-600' : 
                    req.status === 'cancelled' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-beige/20 text-brand-beige'
                  }`}>
                    {req.status.replace('_', ' ')}
                  </span>
                  <p className="text-[10px] text-brand-navy/30 font-bold uppercase tracking-widest font-sans">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-brand-navy/10 text-center">
                <p className="text-brand-navy/30 uppercase tracking-widest text-[10px] font-bold font-sans">No requests yet</p>
                <Link to="/resorts" className="mt-4 inline-block text-brand-teal font-bold text-[10px] uppercase tracking-widest font-sans hover:text-brand-navy transition-colors">Start Browsing</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Resources */}
        <div className="space-y-8">
          <div className="bg-brand-navy text-white p-8 rounded-3xl shadow-2xl shadow-brand-navy/20">
            <h3 className="text-xl font-serif mb-6">Quick <span className="italic text-brand-beige">Actions</span></h3>
            <div className="space-y-4">
              <Link to="/resorts" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Search Resorts</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-brand-beige" />
              </Link>
              <Link to="/agent/resources" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Sales Resources</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-brand-beige" />
              </Link>
              <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Contact Sales</span>
                <MessageSquare size={16} className="group-hover:translate-x-1 transition-transform text-brand-beige" />
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
            <h3 className="text-xl font-serif mb-6 text-brand-navy">Latest Resources</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 hover:bg-brand-paper rounded-xl transition-all cursor-pointer group">
                <div className="bg-brand-coral/10 p-2 rounded-lg text-brand-coral group-hover:bg-brand-coral group-hover:text-white transition-all">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest font-sans text-brand-navy">Rate Sheet 2026</p>
                  <p className="text-[10px] text-brand-navy/30 font-sans">PDF • 2.4 MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 hover:bg-brand-paper rounded-xl transition-all cursor-pointer group">
                <div className="bg-brand-teal/10 p-2 rounded-lg text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest font-sans text-brand-navy">Summer Offers</p>
                  <p className="text-[10px] text-brand-navy/30 font-sans">PPTX • 12.1 MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AgentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .eq('agent_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setRequests(data);
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  if (loading) return <div className="p-12 text-center font-serif italic text-brand-navy">Loading requests...</div>;

  return (
    <div>
      <div className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif mb-2 text-brand-navy">Booking Requests</h1>
          <p className="text-brand-navy/50 text-[10px] uppercase tracking-[0.3em] font-bold font-sans">Manage your resort bookings</p>
        </div>
        <Link to="/resorts" className="bg-brand-teal text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all font-sans shadow-lg shadow-brand-teal/20">
          New Booking
        </Link>
      </div>

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-6">
              <div className="bg-brand-paper w-16 h-16 rounded-2xl flex items-center justify-center text-brand-teal">
                <Hotel size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-brand-navy">{req.resort_name}</h3>
                <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold font-sans">
                  {req.check_in} - {req.check_out} • {req.guests} Guests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[10px] text-brand-navy/30 uppercase tracking-widest font-bold mb-1 font-sans">Status</p>
                <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans ${
                  req.status === 'confirmed' ? 'bg-green-50 text-green-600' : 
                  req.status === 'cancelled' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-beige/20 text-brand-beige'
                }`}>
                  {req.status.replace('_', ' ')}
                </span>
              </div>
              <button className="bg-brand-navy text-white p-3 rounded-full hover:bg-brand-teal transition-colors shadow-lg shadow-brand-navy/10">
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setResources(data);
      }
      setLoading(false);
    };
    fetchResources();
  }, []);

  if (loading) return <div className="p-12 text-center font-serif italic text-brand-navy">Loading resources...</div>;

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-serif mb-2 text-brand-navy">Sales Resources</h1>
        <p className="text-brand-navy/50 text-[10px] uppercase tracking-[0.3em] font-bold font-sans">Download rate sheets, presentations, and media kits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {resources.map(res => (
          <div key={res.id} className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all group">
            <div className="bg-brand-paper w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all">
              <FileText size={28} />
            </div>
            <h3 className="text-xl font-serif text-brand-navy mb-2">{res.title}</h3>
            <p className="text-[10px] text-brand-navy/30 uppercase tracking-widest font-bold mb-6 font-sans">{res.type} • {res.size}</p>
            <button className="w-full bg-brand-navy text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all font-sans shadow-lg shadow-brand-navy/10">
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
