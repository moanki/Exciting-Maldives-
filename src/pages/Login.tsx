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
          navigate('/agent');
        }
      }
    } catch (err: any) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-[#f5f2ed]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif mb-2 text-brand-ink">Agent Portal</h2>
            <p className="text-gray-500 text-sm uppercase tracking-widest font-medium font-sans">Welcome back to Exciting Maldives</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 border border-red-100 font-sans">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 font-sans">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-teal/20 font-sans"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-ink text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center justify-center gap-2 font-sans"
            >
              {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold font-sans">
              <span className="bg-white px-4 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full border border-gray-200 text-brand-ink py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-sans"
          >
            <Chrome size={18} /> Google Account
          </button>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                localStorage.setItem('demo_mode', 'agent');
                window.location.href = '/agent';
              }}
              className="bg-brand-teal/10 text-brand-teal py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all font-sans"
            >
              Demo Agent
            </button>
            <button 
              onClick={() => {
                localStorage.setItem('demo_mode', 'admin');
                window.location.href = '/admin';
              }}
              className="bg-brand-ink/10 text-brand-ink py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-ink hover:text-white transition-all font-sans"
            >
              Demo Admin
            </button>
          </div>

          <p className="mt-10 text-center text-xs text-gray-400 uppercase tracking-widest leading-relaxed font-sans">
            By logging in, you agree to our <br />
            <a href="/legal" className="text-brand-ink hover:underline">Terms of Service</a> and <a href="/legal" className="text-brand-ink hover:underline">Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
