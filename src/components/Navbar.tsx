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
    { label: 'Resorts', path: '/resorts' },
    { label: 'Map', path: '/map' },
    { label: 'Info', path: '/tourist-info' }
  ];

  const logo = settings.logos?.primary;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-navy/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              {logo ? (
                <img src={logo} alt="Exciting Maldives" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    {/* Recreated Shell Icon from Brand Guidelines */}
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                      <defs>
                        <linearGradient id="brandGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3fabb6" />
                          <stop offset="100%" stopColor="#d9af89" />
                        </linearGradient>
                      </defs>
                      <path d="M50 85 C50 85 20 75 10 50 C10 25 30 15 50 15 C70 15 90 25 90 50 C80 75 50 85 50 85 Z" fill="none" stroke="url(#brandGradient)" strokeWidth="0.5" opacity="0.2" />
                      <g fill="url(#brandGradient)">
                        <path d="M50 80 L45 30 A25 25 0 0 1 55 30 Z" />
                        <path d="M50 80 L30 35 A30 30 0 0 1 40 28 Z" transform="rotate(-15 50 80)" />
                        <path d="M50 80 L15 45 A35 35 0 0 1 25 35 Z" transform="rotate(-35 50 80)" />
                        <path d="M50 80 L70 35 A30 30 0 0 0 60 28 Z" transform="rotate(15 50 80)" />
                        <path d="M50 80 L85 45 A35 35 0 0 0 75 35 Z" transform="rotate(35 50 80)" />
                      </g>
                    </svg>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-xl font-serif font-bold tracking-[0.1em] text-brand-navy uppercase">
                      Exciting
                    </span>
                    <span className="text-[10px] font-sans font-bold tracking-[0.5em] text-brand-teal uppercase ml-0.5">
                      Maldives
                    </span>
                  </div>
                </>
              )}
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
              <a 
                href="https://b2b.excitingmv.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-navy text-white px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-brand-teal transition-all shadow-sm"
              >
                Partner Login
              </a>
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
              <a href="https://b2b.excitingmv.com/" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-base font-medium text-brand-teal">Partner Login</a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
