import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

// Pages
import PublicHome from './pages/PublicHome';
import ResortSearch from './pages/ResortSearch';
import ResortDetail from './pages/ResortDetail';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import TouristInfo from './pages/TouristInfo';
import MaldivesMap from './pages/MaldivesMap';
import Legal from './pages/Legal';

// Components
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for Demo Mode
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode) {
      const mockUser = {
        id: 'demo-id',
        email: 'demo@example.com',
        user_metadata: { full_name: demoMode === 'admin' ? 'Demo Admin' : 'Demo Agent' }
      } as any;
      setUser(mockUser);
      setRole(demoMode === 'admin' ? 'super_admin' : 'agent');
      setLoading(false);
      return;
    }

    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('resorts').select('id').limit(1);
        if (error) {
          console.error('Supabase connection test failed:', error.message);
        } else {
          console.log('Supabase connection successful!');
        }
      } catch (err) {
        console.error('Unexpected error during Supabase connection test:', err);
      }
    };
    checkConnection();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserRole(currentUser.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Check if profile (for admin roles)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileData) {
        setRole(profileData.role);
      } else {
        // Check if agent
        const { data: agentData } = await supabase
          .from('agents')
          .select('status')
          .eq('id', userId)
          .single();

        if (agentData) {
          setRole('agent');
        } else {
          setRole(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-serif italic text-2xl animate-pulse">Exciting Maldives...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans">
        <Navbar user={user} role={role} />
        <main>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/resorts" element={<ResortSearch />} />
            <Route path="/resorts/:id" element={<ResortDetail />} />
            <Route path="/tourist-info" element={<TouristInfo />} />
            <Route path="/map" element={<MaldivesMap />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/agent/*" 
              element={role === 'agent' ? <AgentDashboard /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/*" 
              element={['super_admin', 'sales', 'content_manager'].includes(role || '') ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        <ChatWidget />
      </div>
    </Router>
  );
}
