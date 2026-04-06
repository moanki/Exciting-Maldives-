import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import { Menu, X, User as UserIcon, LogOut, ChevronRight } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { getSiteSettings } from '../lib/settings';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: User | null;
  role: string | null;
  settings: any;
}

const Navbar = memo(function Navbar({ user, role, settings }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('demo_mode');
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload(); // Force reload to clear state
  };

  const safeArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  };

  const navItems = safeArray(settings.navbar).length > 0 ? safeArray(settings.navbar) : [
    { label: 'Home', path: '/' },
    { label: 'Resorts', path: '/resorts' },
    { label: 'Experiences', path: '/experiences' },
    { label: 'Platform', path: '/#platform' },
    { label: 'About', path: '/#about' }
  ];

  const logo = settings.logos?.primary || 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=200';
  const whiteLogo = settings.logos?.white || logo;
  const isTransparent = isHome && !scrolled;
  const activeLogo = isTransparent ? whiteLogo : logo;
  const textColorClass = scrolled ? 'text-brand-navy' : (isTransparent ? 'text-white' : 'text-brand-navy');
  const textHoverClass = scrolled ? 'hover:text-brand-teal' : (isTransparent ? 'hover:text-white/80' : 'hover:text-brand-teal');

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${!isTransparent ? 'bg-white/80 backdrop-blur-xl border-b border-brand-navy/5 py-0' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex justify-between h-24">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <img 
                src={activeLogo} 
                alt="Exciting Maldives" 
                className={`h-20 w-auto object-contain transition-all duration-700 ${logoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${isTransparent && !settings.logos?.white ? 'brightness-0 invert' : ''}`} 
                onLoad={() => setLogoLoaded(true)}
                onError={() => setLogoLoaded(true)}
                referrerPolicy="no-referrer" 
              />
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
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white border-b border-brand-navy/5 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              <div className="space-y-4">
                {navItems.map((item: any, idx: number) => (
                  <Link 
                    key={idx} 
                    to={item.path} 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-lg font-serif text-brand-navy group-hover:text-brand-teal transition-colors">
                      {item.label}
                    </span>
                    <ChevronRight size={16} className="text-brand-navy/20 group-hover:text-brand-teal transition-colors" />
                  </Link>
                ))}
              </div>

              <div className="pt-6 border-t border-brand-navy/5 space-y-4">
                {user ? (
                  <div className="space-y-4">
                    {['super_admin', 'sales', 'content_manager'].includes(role || '') && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsOpen(false)}
                        className="block w-full py-4 text-center rounded-2xl bg-brand-teal/10 text-brand-teal font-bold uppercase tracking-widest text-[10px]"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }} 
                      className="block w-full py-4 text-center rounded-2xl bg-brand-navy/5 text-brand-navy/60 font-bold uppercase tracking-widest text-[10px]"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link 
                      to="/become-partner"
                      onClick={() => setIsOpen(false)}
                      className="block w-full py-4 text-center rounded-2xl bg-brand-navy text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-brand-navy/10"
                    >
                      Partner With Us
                    </Link>
                    <div className="grid grid-cols-2 gap-4">
                      <Link 
                        to="/login" 
                        onClick={() => setIsOpen(false)}
                        className="py-3 text-center rounded-xl border border-brand-navy/10 text-brand-navy/60 font-bold uppercase tracking-widest text-[8px]"
                      >
                        Admin Login
                      </Link>
                      <a 
                        href="https://b2b.excitingmv.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="py-3 text-center rounded-xl border border-brand-navy/10 text-brand-teal font-bold uppercase tracking-widest text-[8px]"
                      >
                        Partner Login
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});

export default Navbar;
