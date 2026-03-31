import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSiteSettings } from '../lib/settings';

interface NavbarProps {
  user: User | null;
  role: string | null;
}

export default function Navbar({ user, role }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [logoLoaded, setLogoLoaded] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchSettings = async () => {
      const isPreview = searchParams.get('preview') === 'true';
      const settingsData = await getSiteSettings(isPreview);
      setSettings(settingsData);
    };
    fetchSettings();
  }, [searchParams]);

  const handleLogout = async () => {
    localStorage.removeItem('demo_mode');
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload(); // Force reload to clear state
  };

  const navItems = settings.navbar || [
    { label: 'Home', path: '/' },
    { label: 'Resorts', path: '/resorts' },
    { label: 'Experiences', path: '/experiences' },
    { label: 'Platform', path: '/#platform' },
    { label: 'About', path: '/#about' }
  ];

  const logo = settings.logos?.primary;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-brand-navy/5">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              {logo ? (
                <img 
                  src={logo} 
                  alt="Exciting Maldives" 
                  className={`h-10 w-auto object-contain transition-all duration-700 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`} 
                  onLoad={() => setLogoLoaded(true)}
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <span className="text-xl font-serif tracking-tighter text-brand-navy">Exciting Maldives</span>
              )}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item: any, idx: number) => (
              <Link 
                key={idx} 
                to={item.path} 
                className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy/60 hover:text-brand-teal transition-all duration-300 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-teal transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-6 pl-6 border-l border-brand-navy/10">
                {['super_admin', 'sales', 'content_manager'].includes(role || '') && (
                  <Link to="/admin" className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal hover:opacity-80 transition-opacity">Admin</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2.5 rounded-full hover:bg-brand-paper transition-all duration-300 text-brand-navy/40 hover:text-brand-navy"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-8 pl-8 border-l border-brand-navy/10">
                <Link 
                  to="/login"
                  className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-navy/40 hover:text-brand-navy transition-all duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/become-partner"
                  className="bg-brand-navy text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-brand-teal transition-all duration-500 shadow-xl shadow-brand-navy/10"
                >
                  Partner With Us
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item: any, idx: number) => (
              <Link 
                key={idx} 
                to={item.path} 
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-teal"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                {['super_admin', 'sales', 'content_manager'].includes(role || '') && <Link to="/admin" className="block px-3 py-2 text-base font-medium text-brand-teal">Admin</Link>}
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-brand-teal">Admin Login</Link>
                <a href="https://b2b.excitingmv.com/" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-base font-medium text-brand-teal">Partner Login</a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
