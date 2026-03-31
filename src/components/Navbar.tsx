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
    { label: 'Destinations', path: '/destinations' },
    { label: 'Experiences', path: '/experiences' },
    { label: 'Packages', path: '/packages' },
    { label: 'Resorts', path: '/resorts' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  const logo = settings.logos?.primary;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-navy/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              {logo ? (
                <img 
                  src={logo} 
                  alt="Exciting Maldives" 
                  className={`h-16 w-auto object-contain transition-opacity duration-500 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`} 
                  onLoad={() => setLogoLoaded(true)}
                  referrerPolicy="no-referrer" 
                />
              ) : null}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item: any, idx: number) => (
              <Link 
                key={idx} 
                to={item.path} 
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-navy hover:text-brand-teal transition-colors"
              >
                {item.label}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center space-x-6">
                {['super_admin', 'sales', 'content_manager'].includes(role || '') && (
                  <Link to="/admin" className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-teal">Admin</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-brand-paper transition-colors text-brand-navy"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login"
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-navy hover:text-brand-teal transition-colors"
                >
                  Admin Login
                </Link>
                <a 
                  href="https://b2b.excitingmv.com/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-navy text-white px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-teal transition-all shadow-sm"
                >
                  Partner Login
                </a>
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
