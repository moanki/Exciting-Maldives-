import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, Chrome } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      const user = data.user;
      if (user) {
        // Check if admin
        const { data: adminData } = await supabase
          .from('users')
          .select('role')
          .eq('uid', user.id)
          .single();

        if (adminData) {
          navigate('/admin');
        } else {
          setError('Access denied. Admin only.');
        }
      }
    } catch (err: any) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-brand-paper">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-brand-navy/5"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif mb-2 text-brand-navy">Admin Login</h2>
            <p className="text-brand-navy/50 text-[10px] uppercase tracking-[0.3em] font-bold font-sans">Welcome back to Exciting Maldives</p>
          </div>

          {error && (
            <div className="bg-brand-coral/10 text-brand-coral p-4 rounded-xl text-sm mb-6 border border-brand-coral/10 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-2 font-sans">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30" size={18} />
                <input 
                  type="email" 
                  required
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-4 bg-brand-paper/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans text-brand-navy"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-2 font-sans">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30" size={18} />
                <input 
                  type="password" 
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-4 py-4 bg-brand-paper/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans text-brand-navy"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-navy text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center justify-center gap-2 font-sans shadow-lg shadow-brand-navy/10"
            >
              {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-navy/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold font-sans">
              <span className="bg-white px-4 text-brand-navy/30">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full border border-brand-navy/10 text-brand-navy py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-paper transition-all flex items-center justify-center gap-2 font-sans"
          >
            <Chrome size={18} /> Google Account
          </button>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => {
                localStorage.setItem('demo_mode', 'admin');
                window.location.href = '/admin';
              }}
              className="bg-brand-navy/10 text-brand-navy py-3 px-8 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy hover:text-white transition-all font-sans"
            >
              Demo Admin
            </button>
          </div>

          <p className="mt-10 text-center text-[10px] text-brand-navy/40 uppercase tracking-widest leading-relaxed font-sans">
            By logging in, you agree to our <br />
            <a href="/legal" className="text-brand-navy hover:underline">Terms of Service</a> and <a href="/legal" className="text-brand-navy hover:underline">Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
