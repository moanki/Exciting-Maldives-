import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, Chrome } from 'lucide-react';
import { canAccessAdmin } from '../lib/rbac';

// Admin Login Page
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSeedButton, setShowSeedButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if roles table is empty to show seed button for bootstrap user
    async function checkRoles() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === 'monk.eemoan@gmail.com') {
        const { data } = await supabase.from('roles').select('id').limit(1);
        if (!data || data.length === 0) {
          setShowSeedButton(true);
        }
      }
    }
    checkRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        console.log('User signed in:', user.email, user.id);
        
        // Bootstrap super admin profile if email matches
        // The database trigger will handle the user_roles assignment
        if (user.email === 'monk.eemoan@gmail.com') {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!existingProfile) {
            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              full_name: 'Super Admin'
            });
          }

          // Also ensure user_roles entry
          console.log('Ensuring super_admin role for user (auth change):', user.id);
          const { data: rolesList, error: roleError } = await supabase.from('roles').select('id').eq('key', 'super_admin');
          const roles = rolesList?.[0];
          
          if (roleError) {
            console.error('Error fetching super_admin role:', roleError);
          } else if (!roles) {
            console.warn('The "super_admin" role was not found in the database.');
          } else {
            const { error: insertError } = await supabase.from('user_roles').insert({
              user_id: user.id,
              role_id: roles.id
            });
            if (insertError) {
              if (insertError.code === '23505') {
                console.log('User already has super_admin role');
              } else {
                console.error('Error assigning super_admin role:', insertError);
              }
            } else {
              console.log('Successfully assigned super_admin role');
            }
          }
        }

        const hasAdminAccess = await canAccessAdmin(user.id);
        if (hasAdminAccess) {
          navigate('/admin');
        } else if (event === 'SIGNED_IN') {
          setError('Access denied. Admin only.');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const handleSeedDatabase = async () => {
    setLoading(true);
    try {
      // 1. Insert Roles
      const { data: roles, error: rolesError } = await supabase.from('roles').insert([
        { key: 'super_admin', label: 'Super Admin', description: 'Full system control', is_system: true },
        { key: 'admin', label: 'Admin', description: 'Operational administrator', is_system: true },
        { key: 'developer', label: 'Developer', description: 'Technical maintainer', is_system: true },
        { key: 'content_manager', label: 'Content Manager', description: 'Content/editorial operator', is_system: true },
        { key: 'security', label: 'Security', description: 'Security/governance oversight', is_system: true }
      ]).select();

      if (rolesError) throw rolesError;

      // 2. Insert Permissions (Basic set)
      const { data: perms, error: permsError } = await supabase.from('permissions').insert([
        { key: 'resorts.read', label: 'Read Resorts', description: 'Read resorts', module: 'resorts', action: 'read' },
        { key: 'users.read', label: 'Read Users', description: 'Read users', module: 'users', action: 'read' },
        { key: 'roles.read', label: 'Read Roles', description: 'Read roles', module: 'roles', action: 'read' },
        { key: 'settings.read', label: 'Read Settings', description: 'Read settings', module: 'settings', action: 'read' }
      ]).select();

      if (permsError) throw permsError;

      // 3. Map Super Admin to all permissions
      if (roles && perms) {
        const superAdmin = roles.find(r => r.key === 'super_admin');
        if (superAdmin) {
          const mappings = perms.map(p => ({ role_id: superAdmin.id, permission_id: p.id }));
          await supabase.from('role_permissions').insert(mappings);
        }
      }

      setShowSeedButton(false);
      alert('Database seeded successfully! Please log in again.');
      window.location.reload();
    } catch (err: any) {
      console.error('Seeding failed:', err);
      setError('Seeding failed: ' + err.message);
    } finally {
      setLoading(false);
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
        // Bootstrap super admin profile if email matches
        // The database trigger will handle the user_roles assignment
        if (user.email === 'monk.eemoan@gmail.com') {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!existingProfile) {
            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              full_name: 'Super Admin'
            });
          }

          // Also ensure user_roles entry
          console.log('Ensuring super_admin role for user (email login):', user.id);
          const { data: rolesList, error: roleError } = await supabase.from('roles').select('id').eq('key', 'super_admin');
          const roles = rolesList?.[0];
          
          if (roleError) {
            console.error('Error fetching super_admin role:', roleError);
          } else if (!roles) {
            console.warn('The "super_admin" role was not found in the database.');
          } else {
            const { error: insertError } = await supabase.from('user_roles').insert({
              user_id: user.id,
              role_id: roles.id
            });
            if (insertError) {
              if (insertError.code === '23505') {
                console.log('User already has super_admin role');
              } else {
                console.error('Error assigning super_admin role:', insertError);
              }
            } else {
              console.log('Successfully assigned super_admin role');
            }
          }
        }

        // Check if admin using RBAC
        const hasAdminAccess = await canAccessAdmin(user.id);

        if (hasAdminAccess) {
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

          {showSeedButton && (
            <div className="mb-8 p-6 bg-brand-teal/5 border border-brand-teal/20 rounded-2xl text-center">
              <p className="text-xs text-brand-navy/60 mb-4 font-sans">
                The database appears to be unseeded. As the bootstrap user, you can initialize the core RBAC roles and permissions.
              </p>
              <button 
                onClick={handleSeedDatabase}
                disabled={loading}
                className="w-full bg-brand-teal text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-brand-navy transition-all text-[10px] font-sans"
              >
                {loading ? 'Seeding...' : 'Emergency Seed Database'}
              </button>
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
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-brand-navy/10 text-brand-navy py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-paper transition-all flex items-center justify-center gap-2 font-sans"
          >
            <Chrome size={18} /> Google Account
          </button>

          <div className="mt-8 flex justify-center">
            <button 
              type="button"
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
