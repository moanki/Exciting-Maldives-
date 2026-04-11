import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { getSiteSettings } from './lib/settings';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const ResortSearch = lazy(() => import('./pages/ResortSearch'));
const ResortDetail = lazy(() => import('./pages/ResortDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const TouristInfo = lazy(() => import('./pages/TouristInfo'));
const MaldivesMap = lazy(() => import('./pages/MaldivesMap'));
const Legal = lazy(() => import('./pages/Legal'));
const CustomPage = lazy(() => import('./pages/CustomPage'));
const BecomePartner = lazy(() => import('./pages/BecomePartner'));
const ProtectedResources = lazy(() => import('./pages/ProtectedResources'));
const Test3D = lazy(() => import('./pages/Test3D'));

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import { ProtectedRoute } from './components/ProtectedRoute';

import { motion, AnimatePresence } from 'motion/react';

function AppContent({ user, settings, loadingSettings }: { user: User | null, settings: any, loadingSettings: boolean }) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin');

  const isPageActive = (slug: string) => {
    return settings.builtin_pages_status?.[slug] !== false;
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans relative">
      <Navbar user={user} settings={settings} />
      <main className="relative">
        <Suspense fallback={null}>
          <Routes>
            {isPageActive('home') && <Route path="/" element={<Home settings={settings} />} />}
            {isPageActive('resorts') && <Route path="/resorts" element={<ResortSearch />} />}
            {isPageActive('resorts') && <Route path="/resorts/:id" element={<ResortDetail />} />}
            {isPageActive('tourist-info') && <Route path="/tourist-info" element={<TouristInfo settings={settings} />} />}
            {isPageActive('tourist-info') && <Route path="/guide" element={<TouristInfo settings={settings} />} />}
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
              element={
                <ProtectedRoute permission="resorts.read">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route for inactive pages */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      {!isDashboard && <Footer settings={settings} />}
      {!isDashboard && <ChatWidget settings={settings} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      const settingsData = await getSiteSettings(isPreview);
      setSettings(settingsData);
      setLoadingSettings(false);
    };
    fetchSettings();

    // Check for Demo Mode
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode) {
      const mockUser = {
        id: 'demo-id',
        email: 'demo@example.com',
        user_metadata: { full_name: 'Demo Admin' }
      } as any;
      setUser(mockUser);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <AppContent user={user} settings={settings} loadingSettings={loadingSettings} />
    </Router>
  );
}

