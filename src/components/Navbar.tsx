import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import { Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  user: User | null;
  role: string | null;
}

export default function Navbar({ user, role }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('demo_mode');
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload(); // Force reload to clear state
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#1a1a1a]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Stylized seashell/scallop symbol in teal gradient */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                  <defs>
                    <linearGradient id="shellGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#008080" />
                      <stop offset="100%" stopColor="#20b2aa" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M50 10 C30 10 10 30 10 50 C10 70 30 90 50 90 C70 90 90 70 90 50 C90 30 70 10 50 10 Z M50 80 C35 80 20 65 20 50 C20 35 35 20 50 20 C65 20 80 35 80 50 C80 65 65 80 50 80 Z" 
                    fill="url(#shellGradient)" 
                  />
                  <path 
                    d="M50 25 C40 25 30 35 30 50 C30 65 40 75 50 75 C60 75 70 65 70 50 C70 35 60 25 50 25 Z" 
                    fill="url(#shellGradient)" 
                    opacity="0.6"
                  />
                </svg>
              </div>
              <span className="text-xl font-serif font-bold tracking-tighter text-brand-ink">
                EXCITING<span className="text-brand-teal">ING</span> MALDIVES
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/resorts" className="text-sm font-medium uppercase tracking-widest hover:text-brand-teal transition-colors">Resorts</Link>
            <Link to="/map" className="text-sm font-medium uppercase tracking-widest hover:text-brand-teal transition-colors">Map</Link>
            <Link to="/tourist-info" className="text-sm font-medium uppercase tracking-widest hover:text-brand-teal transition-colors">Info</Link>
            
            {user ? (
              <div className="flex items-center space-x-6">
                {role === 'agent' && (
                  <Link to="/agent" className="text-sm font-medium uppercase tracking-widest text-brand-teal">Agent Portal</Link>
                )}
                {['super_admin', 'sales', 'content_manager'].includes(role || '') && (
                  <Link to="/admin" className="text-sm font-medium uppercase tracking-widest text-brand-teal">Admin</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-brand-ink text-white px-6 py-2 rounded-full text-sm font-medium uppercase tracking-widest hover:bg-brand-teal transition-colors"
              >
                Agent Login
              </Link>
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
            <Link to="/resorts" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#5A5A40]">Resorts</Link>
            <Link to="/map" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#5A5A40]">Map</Link>
            <Link to="/tourist-info" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#5A5A40]">Info</Link>
            {user ? (
              <>
                {role === 'agent' && <Link to="/agent" className="block px-3 py-2 text-base font-medium text-[#5A5A40]">Agent Portal</Link>}
                {['super_admin', 'sales', 'content_manager'].includes(role || '') && <Link to="/admin" className="block px-3 py-2 text-base font-medium text-[#5A5A40]">Admin</Link>}
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700">Logout</button>
              </>
            ) : (
              <Link to="/login" className="block px-3 py-2 text-base font-medium text-[#5A5A40]">Agent Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
