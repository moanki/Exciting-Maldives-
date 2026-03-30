import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { getSiteSettings } from './lib/settings';

// Pages
import Home from './pages/Home';
import ResortSearch from './pages/ResortSearch';
import ResortDetail from './pages/ResortDetail';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import TouristInfo from './pages/TouristInfo';
import MaldivesMap from './pages/MaldivesMap';
import Legal from './pages/Legal';
import CustomPage from './pages/CustomPage';
import BecomePartner from './pages/BecomePartner';
import ProtectedResources from './pages/ProtectedResources';
import Test3D from './pages/Test3D';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

function AppContent({ user, role }: { user: User | null, role: string | null }) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsData = await getSiteSettings();
      setSettings(settingsData);
    };
    fetchSettings();
  }, [location.pathname]);

  const isPageActive = (slug: string) => {
    return settings.builtin_pages_status?.[slug] !== false;
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans">
      <Navbar user={user} role={role} />
      <main>
        <Routes>
          {isPageActive('') && <Route path="/" element={<Home />} />}
          {isPageActive('resorts') && <Route path="/resorts" element={<ResortSearch />} />}
          {isPageActive('resorts') && <Route path="/resorts/:id" element={<ResortDetail />} />}
          {isPageActive('tourist-info') && <Route path="/tourist-info" element={<TouristInfo />} />}
          {isPageActive('map') && <Route path="/map" element={<MaldivesMap />} />}
          {isPageActive('legal') && <Route path="/legal" element={<Legal />} />}
          <Route path="/p/:slug" element={<CustomPage />} />
          {isPageActive('become-partner') && <Route path="/become-partner" element={<BecomePartner />} />}
          {isPageActive('login') && <Route path="/login" element={<Login />} />}
          <Route path="/test-3d" element={<Test3D />} />
          <Route path="/resources/:id" element={<ProtectedResources />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin/*" 
            element={['super_admin', 'sales', 'content_manager'].includes(role || '') ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          
          {/* Fallback route for inactive pages */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      {!isDashboard && <ChatWidget />}
    </div>
  );
}

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
        user_metadata: { full_name: 'Demo Admin' }
      } as any;
      setUser(mockUser);
      setRole('super_admin');
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
          setRole('partner');
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
      <AppContent user={user} role={role} />
    </Router>
  );
}
