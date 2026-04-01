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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHome = window.location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const isTransparent = isHome && !scrolled;
  const textColorClass = isTransparent ? 'text-white' : 'text-brand-navy';
  const textHoverClass = isTransparent ? 'hover:text-white/80' : 'hover:text-brand-teal';

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${!isTransparent ? 'bg-white/80 backdrop-blur-xl border-b border-brand-navy/5 py-0' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              {logo ? (
                <img 
                  src={logo} 
                  alt="Exciting Maldives" 
                  className={`h-20 w-auto object-contain transition-all duration-700 ${logoLoaded ? 'opacity-100' : 'opacity-0'} ${isTransparent ? 'brightness-0 invert' : ''}`} 
                  onLoad={() => setLogoLoaded(true)}
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <span className={`text-xl font-serif tracking-tighter ${textColorClass}`}>Exciting Maldives</span>
              )}
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item: any, idx: number) => (
              <Link 
                key={idx} 
                to={item.path} 
                className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 relative group ${isTransparent ? 'text-white/80 hover:text-white' : 'text-brand-navy/60 hover:text-brand-teal'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isTransparent ? 'bg-white' : 'bg-brand-teal'}`}></span>
              </Link>
            ))}
            
            {user ? (
              <div className={`flex items-center space-x-6 pl-6 border-l ${isTransparent ? 'border-white/20' : 'border-brand-navy/10'}`}>
                {['super_admin', 'sales', 'content_manager'].includes(role || '') && (
                  <Link to="/admin" className={`text-[10px] font-bold uppercase tracking-[0.3em] hover:opacity-80 transition-opacity ${isTransparent ? 'text-white' : 'text-brand-teal'}`}>Admin</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className={`p-2.5 rounded-full transition-all duration-300 ${isTransparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-brand-navy/40 hover:text-brand-navy hover:bg-brand-paper'}`}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className={`flex items-center space-x-8 pl-8 border-l ${isTransparent ? 'border-white/20' : 'border-brand-navy/10'}`}>
                <Link 
                  to="/login"
                  className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 ${isTransparent ? 'text-white/80 hover:text-white' : 'text-brand-navy/40 hover:text-brand-navy'}`}
                >
                  Login
                </Link>
                <Link 
                  to="/become-partner"
                  className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 shadow-xl ${isTransparent ? 'bg-white text-brand-navy hover:bg-white/90 shadow-black/10' : 'bg-brand-navy text-white hover:bg-brand-teal shadow-brand-navy/10'}`}
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
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'}`}
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
