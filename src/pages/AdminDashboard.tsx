import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useParams, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Hotel, Users, FileText, MessageSquare, Settings, Plus, Search, Check, X, Edit2, Trash2, Upload, Palette, Image, Globe, Link2, Phone, Mail, MapPin, Instagram, Linkedin, Facebook, Play, Eye, EyeOff, Send, History, RefreshCw, Database, Shield, LogOut, Palmtree, Calendar, AlertCircle, Gem, Zap, Menu, Handshake, CheckCircle2, UserCheck, ChevronDown, ChevronRight, Copy, Layers, Loader2, Sparkles, Save, Download } from 'lucide-react';
import { supabase } from '../supabase';
import { getSiteSettings, clearSettingsCache } from '../lib/settings';
import { extractResortDataFromPDF } from '../services/content';
import { AdminImportBatches } from '../components/ImportWorkflow';
import { UserAccessManagement } from '../components/admin/rbac/UserAccessManagement';
import { RoleManagement } from '../components/admin/rbac/RoleManagement';
import { PermissionMatrix } from '../components/admin/rbac/PermissionMatrix';
import { usePermissions } from '../hooks/usePermissions';
import { logAuditAction, getUserRoleLabels } from '../lib/rbac';
import { importService } from '../services/importService';
import { motion, AnimatePresence } from 'motion/react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ResortEditForm } from '../components/ResortEditForm';
import { ErrorBoundary } from '../components/ErrorBoundary';

export async function uploadFile(file: File, path: string, bucket: string = 'site-assets', setUploadProgress?: (p: number | null) => void, showNotification?: (msg: string) => void) {
  if (setUploadProgress) setUploadProgress(0);
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    if (setUploadProgress) setUploadProgress(null);
    console.error('Upload error:', uploadError);
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error(`Storage bucket "${bucket}" not found. Please click "Copy SQL" at the top of the dashboard and run it in your Supabase SQL Editor to create the required tables and buckets.`);
    } else {
      throw new Error(`Upload error: ${uploadError.message}`);
    }
  }

  if (setUploadProgress) setUploadProgress(null);
  if (showNotification) showNotification('Uploaded Successfully');

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadResortFile(file: File, resortName: string, category: string, setUploadProgress?: (p: number | null) => void, showNotification?: (msg: string) => void, isStaging: boolean = false) {
  if (setUploadProgress) setUploadProgress(0);
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const baseDir = isStaging ? 'staging/resorts' : 'resorts';
  const filePath = `${baseDir}/${resortName.toLowerCase().replace(/\s+/g, '-')}/${category.toLowerCase().replace(/\s+/g, '-')}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file);

  if (uploadError) {
    if (setUploadProgress) setUploadProgress(null);
    console.error('Upload error:', uploadError);
    throw new Error(uploadError.message || 'Upload failed');
  }

  if (setUploadProgress) setUploadProgress(null);
  if (showNotification) showNotification('Uploaded Successfully');

  const { data: { publicUrl } } = supabase.storage
    .from('site-assets')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * AdminDashboard Component
 * 
 * The central management hub for the application. 
 * Provides interfaces for resort management, booking tracking, partner requests,
 * and site-wide customization.
 * 
 * Architecture:
 * - Uses React Router for internal navigation within the admin panel.
 * - Integrates with Supabase for real-time data management.
 * - Implements secure data processing for document uploads.
 */
export default function AdminDashboard() {
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [roleLabels, setRoleLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);
        
        try {
          const labels = await getUserRoleLabels(user.id);
          setRoleLabels(labels);

          // Auto-migration logic: If user has legacy role but no RBAC roles
          if (profileData?.role && (!labels || labels.length === 0)) {
            console.log('Attempting auto-migration for user:', user.email);
            const roleKey = profileData.role === 'superadmin' ? 'super_admin' : profileData.role;
            const { data: roleObj } = await supabase
              .from('roles')
              .select('id')
              .eq('key', roleKey)
              .maybeSingle();
            
            if (roleObj) {
              await supabase.from('user_roles').insert({
                user_id: user.id,
                role_id: roleObj.id
              });
              const newLabels = await getUserRoleLabels(user.id);
              setRoleLabels(newLabels);
            }
          }
        } catch (e) {
          console.warn('RBAC tables might be missing, skipping auto-migration.');
        }
      }
    };
    fetchUser();
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSiteContentOpen, setIsSiteContentOpen] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean>(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const s = await getSiteSettings();
      setSettings(s);
    };
    fetchSettings();
  }, []);

  const bulkImportEnabled = settings.bulk_import_enabled === 'true';

  useEffect(() => {
    const fetchAiStatus = async () => {
      try {
        const response = await fetch('/api/ai/status');
        const data = await response.json();
        setAiConfigured(data.configured);
      } catch (err) {
        console.error('Failed to fetch AI status:', err);
      }
    };
    fetchAiStatus();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex min-h-screen bg-brand-paper/10 relative">
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-brand-teal text-white px-6 py-3 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest">
          {notification}
        </div>
      )}
      {uploadProgress !== null && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-brand-paper border-t-brand-teal rounded-full animate-spin" />
            <p className="text-brand-navy font-bold uppercase tracking-widest">{Math.round(uploadProgress)}% Uploading...</p>
          </div>
        </div>
      )}
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-brand-navy text-white rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-brand-navy text-white p-6 flex flex-col shadow-2xl z-40
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-12 mt-12 md:mt-0">
          <h2 className="text-xl font-serif font-bold tracking-[0.2em] text-brand-beige">ADMIN CENTER</h2>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto">
          <SidebarLink to="/admin" icon={<LayoutDashboard size={18} />} label="Overview" active={location.pathname === '/admin'} onClick={() => setIsMobileMenuOpen(false)} />
          {hasPermission('resorts.read') && (
            <SidebarLink to="/admin/resorts" icon={<Hotel size={18} />} label="Resorts" active={location.pathname.startsWith('/admin/resorts')} onClick={() => setIsMobileMenuOpen(false)} />
          )}
          {bulkImportEnabled && hasPermission('imports.read') && (
            <SidebarLink to="/admin/imports" icon={<Layers size={18} />} label="Import Batches" active={location.pathname.startsWith('/admin/imports')} onClick={() => setIsMobileMenuOpen(false)} />
          )}
          {hasPermission('users.read') && (
            <SidebarLink to="/admin/partners" icon={<Users size={18} />} label="Partners" active={location.pathname.startsWith('/admin/partners')} onClick={() => setIsMobileMenuOpen(false)} />
          )}
          {hasPermission('chat.read') && (
            <SidebarLink to="/admin/chats" icon={<MessageSquare size={18} />} label="Live Chat" active={location.pathname.startsWith('/admin/chats')} onClick={() => setIsMobileMenuOpen(false)} />
          )}
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-brand-beige/50">Content & Settings</p>
          </div>
          
          {/* Site Content Accordion */}
          {hasPermission('site_content.read') && (
            <div>
              <button 
                onClick={() => setIsSiteContentOpen(!isSiteContentOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-sans ${
                  location.pathname.includes('/page-manager') ? 'bg-brand-teal/10 text-brand-teal' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Site Content</span>
                </div>
                {isSiteContentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              <AnimatePresence>
                {isSiteContentOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-11 pr-4 py-2 space-y-4">
                      {/* Global Settings */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-brand-beige/40 mb-2">Global Settings</p>
                        <div className="space-y-1">
                          <SubSidebarLink to="/admin/page-manager/nav" label="Nav & Logo" active={location.pathname === '/admin/page-manager/nav'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/footer" label="Footer" active={location.pathname === '/admin/page-manager/footer'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/whatsapp" label="WhatsApp" active={location.pathname === '/admin/page-manager/whatsapp'} onClick={() => setIsMobileMenuOpen(false)} />
                        </div>
                      </div>
                      
                      {/* Home Page Sections */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-brand-beige/40 mb-2">Home Page Sections</p>
                        <div className="space-y-1">
                          <SubSidebarLink to="/admin/page-manager/hero" label="Hero & Intro" active={location.pathname === '/admin/page-manager/hero'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/stats" label="Expertise Stats" active={location.pathname === '/admin/page-manager/stats'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/ceo" label="CEO Message" active={location.pathname === '/admin/page-manager/ceo'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/story" label="Our Story" active={location.pathname === '/admin/page-manager/story'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/markets" label="Global Markets" active={location.pathname === '/admin/page-manager/markets'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/newsletter_markets" label="Newsletter Markets" active={location.pathname === '/admin/page-manager/newsletter_markets'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/services" label="Services" active={location.pathname === '/admin/page-manager/services'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/awards" label="Awards" active={location.pathname === '/admin/page-manager/awards'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/trust" label="Trust Indicators" active={location.pathname === '/admin/page-manager/trust'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/why-us" label="Why Us & Excellence" active={location.pathname === '/admin/page-manager/why-us'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/ctas" label="CTAs" active={location.pathname === '/admin/page-manager/ctas'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/system" label="System & DB" active={location.pathname === '/admin/page-manager/system'} onClick={() => setIsMobileMenuOpen(false)} />
                        </div>
                      </div>

                      {/* Pages & Content */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-brand-beige/40 mb-2">Pages & Content</p>
                        <div className="space-y-1">
                          <SubSidebarLink to="/admin/page-manager/pages" label="Custom Pages" active={location.pathname === '/admin/page-manager/pages'} onClick={() => setIsMobileMenuOpen(false)} />
                          <SubSidebarLink to="/admin/page-manager/guide" label="Travel Guide" active={location.pathname === '/admin/page-manager/guide'} onClick={() => setIsMobileMenuOpen(false)} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {hasPermission('newsletter.read') && (
            <SidebarLink to="/admin/newsletter" icon={<Mail size={18} />} label="Newsletter" active={location.pathname.startsWith('/admin/newsletter')} onClick={() => setIsMobileMenuOpen(false)} />
          )}
          {hasPermission('resources.protected.manage') && (
            <SidebarLink to="/admin/password-manager" icon={<Shield size={18} />} label="Password Manager" active={location.pathname.startsWith('/admin/password-manager')} onClick={() => setIsMobileMenuOpen(false)} />
          )}
          {hasPermission('resources.read') && (
            <SidebarLink to="/admin/resources" icon={<Settings size={18} />} label="Resources" active={location.pathname.startsWith('/admin/resources')} onClick={() => setIsMobileMenuOpen(false)} />
          )}

          {/* RBAC Management */}
          {(hasPermission('users.read') || hasPermission('roles.read') || hasPermission('permissions.read')) && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-brand-beige/50">Access Control</p>
              </div>
              {hasPermission('users.read') && (
                <SidebarLink to="/admin/users" icon={<UserCheck size={18} />} label="User Access" active={location.pathname.startsWith('/admin/users')} onClick={() => setIsMobileMenuOpen(false)} />
              )}
              {hasPermission('roles.read') && (
                <SidebarLink to="/admin/roles" icon={<Shield size={18} />} label="Roles" active={location.pathname.startsWith('/admin/roles')} onClick={() => setIsMobileMenuOpen(false)} />
              )}
              {hasPermission('permissions.read') && (
                <SidebarLink to="/admin/permissions" icon={<Database size={18} />} label="Permissions" active={location.pathname.startsWith('/admin/permissions')} onClick={() => setIsMobileMenuOpen(false)} />
              )}
            </>
          )}
          <div className="pt-8 mt-auto border-t border-white/10">
            <p className="px-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-brand-beige/30">System Status</p>
            <div className="px-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest text-white/40">Gemini (Pro)</span>
                <div className={`w-2 h-2 rounded-full ${aiConfigured ? 'bg-brand-teal shadow-[0_0_8px_rgba(0,128,128,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="h-20 bg-white border-b border-brand-navy/5 flex items-center justify-between px-4 md:px-10 shrink-0 ml-12 md:ml-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex w-10 h-10 bg-brand-paper rounded-xl items-center justify-center text-brand-teal">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-bold text-brand-navy uppercase tracking-widest">Admin Control Center</h2>
              <p className="hidden md:block text-[10px] text-brand-navy/40 font-medium">System Management & Content Control</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-brand-navy">{profile?.full_name || 'Administrator'}</span>
                <span className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">
                  {roleLabels.length > 0 ? roleLabels.join(', ') : 'Admin'}
                </span>
              </div>
            <button 
              onClick={() => {
                localStorage.removeItem('demo_mode');
                supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="p-2 md:p-3 bg-brand-paper rounded-xl text-brand-navy/40 hover:text-brand-coral hover:bg-brand-coral/5 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-brand-paper/30 relative">
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            {hasPermission('resorts.read') && (
              <Route path="/resorts" element={<AdminResorts showNotification={showNotification} setUploadProgress={setUploadProgress} bulkImportEnabled={bulkImportEnabled} />} />
            )}
            {bulkImportEnabled && hasPermission('imports.read') && (
              <Route path="/imports" element={<AdminImportBatches />} />
            )}
            {hasPermission('users.read') && (
              <Route path="/partners" element={<AdminPartners />} />
            )}
            {hasPermission('chat.read') && (
              <Route path="/chats" element={<AdminChats />} />
            )}
            {hasPermission('site_content.read') && (
              <>
                <Route path="/page-manager/:tab" element={<AdminPageManager showNotification={showNotification} setUploadProgress={setUploadProgress} />} />
                <Route path="/page-manager" element={<AdminPageManager showNotification={showNotification} setUploadProgress={setUploadProgress} />} />
              </>
            )}
            {hasPermission('newsletter.read') && (
              <Route path="/newsletter" element={<AdminNewsletter />} />
            )}
            {hasPermission('resources.protected.manage') && (
              <Route path="/password-manager" element={<AdminPasswordManager showNotification={showNotification} setUploadProgress={setUploadProgress} />} />
            )}
            {hasPermission('resources.read') && (
              <Route path="/resources" element={<AdminResources showNotification={showNotification} setUploadProgress={setUploadProgress} />} />
            )}
            
            {/* RBAC Routes */}
            {hasPermission('users.read') && (
              <Route path="/users" element={<UserAccessManagement />} />
            )}
            {hasPermission('roles.read') && (
              <Route path="/roles" element={<RoleManagement />} />
            )}
            {hasPermission('permissions.read') && (
              <Route path="/permissions" element={<PermissionMatrix />} />
            )}
            
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AdminPasswordManager({ showNotification, setUploadProgress }: { showNotification: (msg: string) => void, setUploadProgress: (p: number | null) => void }) {
  const [resources, setResources] = useState<any[]>([]);
  const [isAddingProtected, setIsAddingProtected] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase.from('protected_resources').select('*');
      if (data) setResources(data);
    };
    fetchResources();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Password Manager</h1>
        <button 
          onClick={() => setIsAddingProtected(true)}
          className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
        >
          <Plus size={16} /> Add Protected Resource
        </button>
      </div>
      
      {isAddingProtected && (
        <ProtectedResourceModal 
          showNotification={showNotification}
          setUploadProgress={setUploadProgress}
          onClose={() => setIsAddingProtected(false)} 
          onAdd={() => {
            setIsAddingProtected(false);
            const fetchResources = async () => {
              const { data } = await supabase.from('protected_resources').select('*');
              if (data) setResources(data);
            };
            fetchResources();
          }} 
        />
      )}

      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-brand-paper border-b border-brand-navy/5">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Title</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Password</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">File URL</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-paper">
              {resources.map(resource => (
                <tr key={resource.id} className="hover:bg-brand-paper/50 transition-colors">
                <td className="px-6 py-4 font-medium text-brand-navy font-sans">{resource.title}</td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">{resource.passwords?.join(', ') || resource.password}</td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">
                  {resource.file_url ? (
                    <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">View File</a>
                  ) : 'No file'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"><Edit2 size={16} /></button>
                    <button 
                      onClick={async () => {
                        const { error } = await supabase.from('protected_resources').delete().eq('id', resource.id);
                        if (!error) {
                          const { data } = await supabase.from('protected_resources').select('*');
                          if (data) setResources(data);
                        }
                      }}
                      className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function AdminNewsletter() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data } = await supabase.from('newsletter_submissions').select('*').order('created_at', { ascending: false });
      if (data) setSubmissions(data);
    };
    fetchSubmissions();
  }, []);

  const downloadCSV = () => {
    const headers = ['Full Name', 'Agency Name', 'Country', 'Phone', 'Email', 'Primary Market', 'Notes', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...submissions.map(s => [s.full_name, s.agency_name, s.country, s.phone, s.email, s.primary_market, s.notes, s.created_at].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter_submissions.csv';
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Newsletter Submissions</h1>
        <button onClick={downloadCSV} className="bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all">Download CSV</button>
      </div>
      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-brand-paper border-b border-brand-navy/5">
            <tr>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Name</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Agency</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Email</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Market</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {submissions.map(s => (
              <tr key={s.id}>
                <td className="px-6 py-4 font-sans text-sm">{s.full_name}</td>
                <td className="px-6 py-4 font-sans text-sm">{s.agency_name}</td>
                <td className="px-6 py-4 font-sans text-sm">{s.email}</td>
                <td className="px-6 py-4 font-sans text-sm">{s.primary_market}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminResources({ showNotification, setUploadProgress }: { showNotification: (msg: string) => void, setUploadProgress: (p: number | null) => void }) {
  const [resources, setResources] = useState<any[]>([]);
  const [protectedResources, setProtectedResources] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingProtected, setIsAddingProtected] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [editingProtected, setEditingProtected] = useState<any>(null);

  const fetchResources = async () => {
    const { data: resData } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    const { data: protData } = await supabase.from('protected_resources').select('*').order('created_at', { ascending: false });
    
    if (resData) setResources(resData);
    if (protData) setProtectedResources(protData);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Resource Library</h1>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-teal/20"
          >
            <Plus size={16} /> Add Resource
          </button>
          <button 
            onClick={() => setIsAddingProtected(true)}
            className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
          >
            <Plus size={16} /> Add Protected Resource
          </button>
        </div>
      </div>

      {(isAdding || editingResource) && (
        <ResourceModal 
          initialData={editingResource}
          showNotification={showNotification}
          setUploadProgress={setUploadProgress}
          onClose={() => {
            setIsAdding(false);
            setEditingResource(null);
          }} 
          onAdd={() => {
            setIsAdding(false);
            setEditingResource(null);
            fetchResources();
          }} 
        />
      )}

      {(isAddingProtected || editingProtected) && (
        <ProtectedResourceModal 
          initialData={editingProtected}
          showNotification={showNotification}
          setUploadProgress={setUploadProgress}
          onClose={() => {
            setIsAddingProtected(false);
            setEditingProtected(null);
          }} 
          onAdd={() => {
            setIsAddingProtected(false);
            setEditingProtected(null);
            fetchResources();
          }} 
        />
      )}

      <h2 className="text-xl font-serif text-brand-navy mb-6">Public Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {resources.map(resource => (
          <div key={resource.id} className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all">
            <div className="bg-brand-paper w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-brand-teal">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-serif text-brand-navy mb-2">{resource.title}</h3>
            <p className="text-[10px] text-brand-navy/30 uppercase tracking-widest font-bold mb-4 font-sans">{resource.type}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-brand-navy/30 font-bold font-sans">{resource.size}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingResource(resource)}
                  className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this resource?')) {
                      const { error } = await supabase.from('resources').delete().eq('id', resource.id);
                      if (!error) fetchResources();
                    }
                  }}
                  className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-serif text-brand-navy mb-6">Protected Resources</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {protectedResources.map(resource => (
          <div key={resource.id} className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all">
            <div className="bg-brand-paper w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-brand-teal">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-serif text-brand-navy mb-2">{resource.title}</h3>
            <p className="text-[10px] text-brand-navy/30 uppercase tracking-widest font-bold mb-4 font-sans">Protected</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-brand-navy/30 font-bold font-sans">{resource.passwords?.length || 0} Passwords</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingProtected(resource)}
                  className="p-2 text-brand-navy/30 hover:text-brand-teal transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this protected resource?')) {
                      const { error } = await supabase.from('protected_resources').delete().eq('id', resource.id);
                      if (!error) fetchResources();
                    }
                  }}
                  className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label, active, onClick }: any) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-sans ${
        active ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function SubSidebarLink({ to, label, active, onClick }: any) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`block px-3 py-2 rounded-lg transition-all font-sans text-[10px] uppercase tracking-widest ${
        active ? 'bg-brand-teal/20 text-brand-teal font-bold' : 'text-white/40 hover:text-white hover:bg-white/5 font-medium'
      }`}
    >
      {label}
    </Link>
  );
}

function ResourceModal({ onClose, onAdd, initialData, showNotification, setUploadProgress }: any) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState(initialData?.type || 'PDF');
  const [category, setCategory] = useState(initialData?.category || 'General');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || (!file && !initialData)) return;
    setLoading(true);
    
    try {
      let publicUrl = initialData?.file_url || '';

      if (file) {
        publicUrl = await uploadFile(file, 'documents/public', 'site-assets', setUploadProgress, showNotification);
      }

      // Save to DB
      const resourceData = {
        title,
        type,
        category,
        file_url: publicUrl,
        size: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : initialData?.size
      };

      const { error } = initialData 
        ? await supabase.from('resources').update(resourceData).eq('id', initialData.id)
        : await supabase.from('resources').insert(resourceData);
      
      if (error) throw error;

      onAdd();
      showNotification(initialData ? 'Resource updated' : 'Resource added');
      onClose();
    } catch (err: any) {
      console.error('Resource save error:', err);
      showNotification('Error: ' + (err.message || 'Failed to save resource'));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl">
        <h3 className="text-xl font-serif text-brand-navy mb-6">{initialData ? 'Edit Resource' : 'Add Resource'}</h3>
        <div className="space-y-4">
          <TextInput label="Title" value={title} onChange={setTitle} />
          <TextInput label="Category" value={category} onChange={setCategory} />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">File {initialData && '(Leave empty to keep current)'}</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm font-sans" />
          </div>
          <TextInput label="Type (e.g. PDF, DOCX)" value={type} onChange={setType} />
          <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-brand-paper rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-navy/10 transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 px-6 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all disabled:opacity-50">
              {loading ? 'Saving...' : (initialData ? 'Update Resource' : 'Add Resource')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedResourceModal({ onClose, onAdd, initialData, showNotification, setUploadProgress }: any) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [file, setFile] = useState<File | null>(null);
  const [passwords, setPasswords] = useState(initialData?.passwords?.join(', ') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || (!file && !initialData) || !passwords) return;
    setLoading(true);
    
    try {
      let publicUrl = initialData?.file_url || '';

      if (file) {
        publicUrl = await uploadFile(file, 'documents/protected', 'site-assets', setUploadProgress, showNotification);
      }

      // Save to DB
      const resourceData = {
        title,
        file_url: publicUrl,
        passwords: passwords.split(',').map(p => p.trim())
      };

      const { error } = initialData
        ? await supabase.from('protected_resources').update(resourceData).eq('id', initialData.id)
        : await supabase.from('protected_resources').insert(resourceData);
      
      if (error) throw error;

      onAdd();
      showNotification(initialData ? 'Protected resource updated' : 'Protected resource added');
      onClose();
    } catch (err: any) {
      console.error('Protected resource save error:', err);
      showNotification('Error: ' + (err.message || 'Failed to save protected resource'));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl">
        <h3 className="text-xl font-serif text-brand-navy mb-6">Add Protected Resource</h3>
        <div className="space-y-4">
          <TextInput label="Title" value={title} onChange={setTitle} />
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm font-sans" />
          </div>
          <div className="relative">
            <TextInput 
              label="Passwords (comma separated)" 
              value={passwords} 
              onChange={setPasswords} 
              type={showPassword ? 'text' : 'password'} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-brand-navy/30"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-brand-paper rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-navy/10 transition-all">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all">Add Resource</button>
          </div>
        </div>
      </div>
    </div>
  );
}



function AdminOverview() {
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [stats, setStats] = useState({
    totalResorts: 0,
    activePartners: 0,
    newRequests: 0,
    activeChats: 0
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('resorts').select('id').limit(1);
        if (error) {
          setConnectionStatus('failed');
          setErrorMsg(error.message);
          if (error.message.includes('site_settings') || error.message.includes('resorts')) {
            setShowSql(true);
          }
        } else {
          setConnectionStatus('success');
        }
      } catch (err: any) {
        setConnectionStatus('failed');
        setErrorMsg(err.message);
      }
    };
    testConnection();
    fetchStats();
  }, []);

  const [rbacStatus, setRbacStatus] = useState<{
    roles: boolean;
    permissions: boolean;
    role_permissions: boolean;
    user_roles: boolean;
    audit_logs: boolean;
  } | null>(null);

  useEffect(() => {
    const checkRbac = async () => {
      const tables = ['roles', 'permissions', 'role_permissions', 'user_roles', 'audit_logs'];
      const status: any = {};
      
      for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        status[table] = !error || error.code !== '42P01';
      }
      setRbacStatus(status);
    };
    checkRbac();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: resortsCount } = await supabase.from('resorts').select('*', { count: 'exact', head: true });
      const { count: partnersCount } = await supabase.from('partner_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      const { count: requestsCount } = await supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      setStats({
        totalResorts: resortsCount || 0,
        activePartners: partnersCount || 0,
        newRequests: requestsCount || 0,
        activeChats: 5
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const seedData = async () => {
    setSeeding(true);
    try {
      setSeedStatus('Seeding resorts...');
      const sampleResorts = [
        {
          name: "Soneva Fushi",
          atoll: "Baa Atoll",
          location: "Kunfunadhoo Island",
          description: "The original desert island hideaway in the Maldives. Soneva Fushi is located in the Baa Atoll UNESCO Biosphere Reserve.",
          category: "Ultra-Luxury",
          transfer_type: "Seaplane",
          meal_plans: ["Bed & Breakfast", "Half Board", "Full Board"],
          room_types: [{ name: "Crusoe Villa", max_guests: 2, size: "235sqm" }],
          highlights: ["Eco-friendly", "Private Cinema", "Observatory"],
          images: ["https://picsum.photos/seed/soneva/1200/800"],
          is_featured: true
        },
        {
          name: "Gili Lankanfushi",
          atoll: "North Malé Atoll",
          location: "Lankanfushi Island",
          description: "An eco-friendly resort that combines rustic chic with ultimate luxury. All villas are overwater.",
          category: "Ultra-Luxury",
          transfer_type: "Speedboat",
          meal_plans: ["Bed & Breakfast", "Half Board"],
          room_types: [{ name: "Villa Suite", max_guests: 2, size: "210sqm" }],
          highlights: ["Overwater Villas", "No News, No Shoes", "Private Reserve"],
          images: ["https://picsum.photos/seed/gili/1200/800"],
          is_featured: true
        }
      ];

      await supabase.from('resorts').upsert(sampleResorts, { onConflict: 'name' });

      setSeedStatus('Seeding site settings...');
      const initialSettings = [
        {
          key: 'hero:published',
          value: {
            title: 'The B2B Gateway to Luxury Travel in the Maldives',
            subtitle: 'A destination management and digital distribution platform connecting global travel professionals with the Maldives’ most exceptional resorts and experiences.',
            banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
            banner_type: 'image'
          }
        },
        {
          key: 'introduction:published',
          value: {
            title: 'Bespoke Destination Management',
            summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships. We offer tailored, high-end travel solutions that highlight the beauty and culture of the Maldives, ensuring our partners can deliver unforgettable and seamless experiences to their clients.'
          }
        },
        {
          key: 'navbar:published',
          value: [
            { label: 'Home', path: '/' },
            { label: 'Resorts', path: '/resorts' },
            { label: 'Experiences', path: '/experiences' },
            { label: 'Platform', path: '/platform' },
            { label: 'About', path: '/about' }
          ]
        },
        {
          key: 'footer:published',
          value: {
            contact: { email: 'info@excitingmaldives.com', phone: '+960 123 4567', address: 'Male, Maldives' },
            social: { instagram: '', linkedin: '', facebook: '', twitter: '' },
            important_links: [
              { label: 'Resorts', path: '/resorts' },
              { label: 'Experiences', path: '/experiences' },
              { label: 'Platform', path: '/platform' }
            ],
            legal_links: [
              { label: 'Privacy Policy', path: '/legal' },
              { label: 'Terms of Service', path: '/terms' }
            ]
          }
        }
      ];

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('site_settings').upsert(initialSettings, { onConflict: 'key' });
      if (user) await logAuditAction(user.id, 'settings.update', 'site_settings', null, null, { settings: initialSettings });

      setSeedStatus('Seeding booking requests...');
      const sampleRequests = [
        {
          resort_name: "Soneva Fushi",
          guest_name: "John Doe",
          email: "john@example.com",
          check_in: new Date().toISOString(),
          check_out: new Date(Date.now() + 86400000 * 7).toISOString(),
          status: 'pending'
        }
      ];

      await supabase.from('booking_requests').upsert(sampleRequests);

      setSeedStatus('Success! Data seeded.');
      fetchStats();
    } catch (err: any) {
      setSeedStatus(`Error: ${err.message}`);
    }
    setSeeding(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-serif text-brand-navy">System Overview</h1>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans flex items-center gap-2 ${
            connectionStatus === 'success' ? 'bg-green-50 text-green-600' : 
            connectionStatus === 'failed' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-paper text-brand-navy/30'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'success' ? 'bg-green-500' : 
              connectionStatus === 'failed' ? 'bg-brand-coral' : 'bg-brand-navy/20 animate-pulse'
            }`} />
            Supabase: {connectionStatus === 'success' ? 'Connected' : connectionStatus === 'failed' ? 'Error' : 'Testing...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={<Palmtree className="text-brand-teal" />} 
          label="Total Resorts" 
          value={stats.totalResorts} 
          color="teal"
        />
        <StatCard 
          icon={<Users className="text-brand-navy" />} 
          label="Active Partners" 
          value={stats.activePartners} 
          color="navy"
        />
        <StatCard 
          icon={<Calendar className="text-brand-coral" />} 
          label="New Requests" 
          value={stats.newRequests} 
          color="coral"
        />
        <StatCard 
          icon={<MessageSquare className="text-brand-teal" />} 
          label="Active Chats" 
          value={stats.activeChats} 
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
          <h3 className="text-xl font-serif text-brand-navy mb-6">Database Management</h3>
          <div className="space-y-6">
            {rbacStatus && Object.values(rbacStatus).some(v => !v) && (
              <div className="p-6 bg-brand-coral/5 rounded-3xl border border-brand-coral/10 mb-6">
                <div className="flex items-start gap-3 text-brand-coral mb-4">
                  <Shield size={20} className="shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold font-sans">RBAC System Incomplete</h4>
                    <p className="text-xs font-sans opacity-80 mt-1">Some RBAC tables are missing. The system is currently running in legacy fallback mode.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {Object.entries(rbacStatus).map(([table, exists]) => (
                    <div key={table} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${exists ? 'bg-green-500' : 'bg-brand-coral'}`} />
                      <span className="text-[9px] uppercase tracking-widest font-bold text-brand-navy/60">{table}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-sans text-brand-navy/60 leading-relaxed">
                  Please run the latest SQL migration to enable full Role-Based Access Control and Audit Logging.
                </p>
              </div>
            )}

            <div className="p-6 bg-brand-paper/50 rounded-3xl border border-brand-navy/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-4 font-sans">Quick Actions</h4>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={seedData}
                  disabled={seeding}
                  className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all disabled:opacity-50 flex items-center gap-2 font-sans"
                >
                  {seeding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Database size={16} />}
                  Seed Sample Data
                </button>
                <button 
                  onClick={() => setShowSql(!showSql)}
                  className="border border-brand-navy/10 text-brand-navy px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-paper transition-all font-sans"
                >
                  {showSql ? 'Hide SQL Schema' : 'View SQL Schema'}
                </button>
              </div>
              {seedStatus && (
                <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest font-sans ${seedStatus.includes('Error') ? 'text-brand-coral' : 'text-brand-teal'}`}>
                  {seedStatus}
                </p>
              )}
            </div>

            {connectionStatus === 'failed' && (
              <div className="p-6 bg-brand-coral/5 rounded-3xl border border-brand-coral/10">
                <div className="flex items-start gap-3 text-brand-coral mb-4">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold font-sans">Connection Error</h4>
                    <p className="text-xs font-sans opacity-80 mt-1">{errorMsg}</p>
                  </div>
                </div>
                <p className="text-[10px] font-sans text-brand-navy/60 leading-relaxed">
                  This error usually means the required tables haven't been created in your Supabase project yet. 
                  Please copy the SQL schema below and run it in the <strong>SQL Editor</strong> of your Supabase dashboard.
                </p>
              </div>
            )}
          </div>
        </div>

        {showSql && (
          <div className="bg-brand-navy p-8 rounded-[40px] text-white overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif">SQL Schema</h3>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('Schema is managed in supabase_schema.sql');
                  console.log('SQL copied to clipboard!');
                }}
                className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all font-sans"
              >
                Copy SQL
              </button>
            </div>
            <pre className="text-[10px] font-mono bg-black/20 p-6 rounded-3xl overflow-auto flex-1 max-h-[400px] scrollbar-thin scrollbar-thumb-white/10">
              Schema is managed in supabase_schema.sql
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    teal: 'text-brand-teal bg-brand-teal/5',
    navy: 'text-brand-navy bg-brand-navy/5',
    coral: 'text-brand-coral bg-brand-coral/5'
  };

  return (
    <div className="bg-white p-8 rounded-[40px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 hover:shadow-2xl transition-all group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.navy}`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-navy/30 mb-2 font-sans">{label}</p>
      <p className="text-4xl font-serif text-brand-navy">{value}</p>
    </div>
  );
}

function AdminResorts({ showNotification, setUploadProgress, bulkImportEnabled }: { showNotification: (msg: string) => void, setUploadProgress: (p: number | null) => void, bulkImportEnabled: boolean }) {
  const navigate = useNavigate();
  const [resorts, setResorts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingResort, setEditingResort] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [smartUploadProgress, setSmartUploadProgress] = useState<{
    total: number;
    current: number;
    completed: number;
    failed: number;
    status: string;
  } | null>(null);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    atoll: '',
    location: '',
    category: '',
    transfer_type: '',
    description: '',
    images: '',
    banner_url: '',
    resort_url: '',
    crawl: false,
    highlights: [] as string[],
    meal_plans: [] as string[],
    rooms: [] as string[],
    room_types: [] as any[],
    is_featured: false
  });

  useEffect(() => {
    fetchResorts();
  }, []);

  const fetchResorts = async () => {
    const { data, error } = await supabase
      .from('resorts')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) {
      setResorts(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAiProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 1. Create Batch using importService
      const batch = await importService.createBatch({
        batch_type: 'resort_pdf_import',
        source_type: 'local_upload'
      });
      const batchId = batch.id;

      setSmartUploadProgress({
        total: files.length,
        current: 0,
        completed: 0,
        failed: 0,
        status: 'Initializing batch...'
      });
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setSmartUploadProgress(prev => prev ? { 
          ...prev, 
          current: i + 1, 
          status: `Uploading ${file.name} to staging...` 
        } : null);
        
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
              const res = await fetch('/api/import/resort-pdf', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  batchId,
                  base64Data: base64,
                  filename: file.name
                })
              });
              
              if (!res.ok) throw new Error('Upload failed');

              setSmartUploadProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
            } catch (err) {
              console.error('Staging failed for file:', file.name, err);
              setSmartUploadProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
            } finally {
              resolve();
            }
          };
          reader.readAsDataURL(file);
        });
      }

      showNotification('Batch Ingested to Staging. Please review in Import Batches.');
      navigate('/admin/imports');
    } catch (err: any) {
      showNotification('Batch creation failed: ' + err.message);
    } finally {
      setAiProcessing(false);
      setTimeout(() => setSmartUploadProgress(null), 5000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingResort) {
        const { crawl, ...dataToSave } = formData;
        const { error } = await supabase
          .from('resorts')
          .update({
            ...dataToSave,
            images: typeof formData.images === 'string' ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : formData.images,
            highlights: formData.highlights,
            meal_plans: formData.meal_plans,
            description: formData.description,
            transfer_type: formData.transfer_type,
            rooms: formData.rooms,
            room_types: formData.room_types,
            category: formData.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingResort.id);
        if (error) throw error;
      } else {
        const { crawl, ...dataToSave } = formData;
        const { error } = await supabase
          .from('resorts')
          .insert({
            ...dataToSave,
            images: typeof formData.images === 'string' ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : formData.images,
            highlights: formData.highlights,
            meal_plans: formData.meal_plans,
            description: formData.description,
            transfer_type: formData.transfer_type,
            rooms: formData.rooms,
            room_types: formData.room_types,
            category: formData.category
          });
        if (error) throw error;
      }
      
      showNotification(`${formData.name} has been updated`);
      
      setEditingResort(null);
      setIsAdding(false);
      setFormData({ 
        name: '', 
        atoll: '', 
        location: '', 
        category: '', 
        transfer_type: '', 
        description: '', 
        images: '', 
        banner_url: '', 
        resort_url: '',
        highlights: [], 
        meal_plans: [], 
        rooms: [],
        is_featured: false, 
        crawl: false,
        room_types: [] 
      });
      fetchResorts();
    } catch (error: any) {
      console.error('Error saving resort:', error.message);
      showNotification(`Error updating resort: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // In a real app, use a custom modal for confirmation instead of window.confirm
    // For now, we'll just delete it directly to avoid iframe blocking issues
    try {
      const { error } = await supabase.from('resorts').delete().eq('id', id);
      if (error) throw error;
      fetchResorts();
    } catch (error: any) {
      console.error('Error deleting resort:', error.message);
    }
  };

  const [driveUrl, setDriveUrl] = useState('');
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveSyncSummary, setDriveSyncSummary] = useState<{
    total: number;
    new: number;
    skipped: number;
    failed: number;
    show: boolean;
  } | null>(null);

  useEffect(() => {
    const loadDriveUrl = async () => {
      try {
        const settings = await getSiteSettings(true);
        if (settings.google_drive_import_url) {
          setDriveUrl(settings.google_drive_import_url);
        } else {
          // Fallback to localStorage for backward compatibility
          const local = localStorage.getItem('admin_drive_url');
          if (local) setDriveUrl(local);
        }
      } catch (e) {
        console.error('Failed to load drive URL from settings:', e);
      }
    };
    loadDriveUrl();
  }, []);

  const handleSaveDriveUrl = async () => {
    if (!driveUrl) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to site_settings
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'google_drive_import_url:published', 
          value: driveUrl 
        }, { onConflict: 'key' });
      
      if (error) throw error;

      // Also save draft
      await supabase
        .from('site_settings')
        .upsert({ 
          key: 'google_drive_import_url:draft', 
          value: driveUrl 
        }, { onConflict: 'key' });

      localStorage.setItem('admin_drive_url', driveUrl);
      clearSettingsCache();
      showNotification('Google Drive folder URL saved to settings');
    } catch (e: any) {
      showNotification('Failed to save Drive URL: ' + e.message);
    }
  };

  const handleDriveUpload = async (skipDuplicates = false) => {
    if (!driveUrl) return;

    localStorage.setItem('admin_drive_url', driveUrl);

    setIsFetchingDrive(true);
    setAiProcessing(true);
    setDriveSyncSummary(null);
    
    let stats = { total: 0, new: 0, skipped: 0, failed: 0 };
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 1. Create Batch using importService
      const batch = await importService.createBatch({
        batch_type: 'resort_pdf_import',
        source_type: 'google_drive',
        source_ref: driveUrl
      });
      const batchId = batch.id;

      setSmartUploadProgress({
        total: 1,
        current: 0,
        completed: 0,
        failed: 0,
        status: 'Listing files from Google Drive...'
      });

      const listResponse = await fetch('/api/list-drive-pdfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: driveUrl }),
      });

      if (!listResponse.ok) {
        let errorMessage = 'Failed to list files from Google Drive';
        try {
          const errorData = await listResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const errorText = await listResponse.text();
          console.error('Non-JSON error response:', listResponse.status, errorText.substring(0, 200));
          errorMessage = `Server error (${listResponse.status}). The server might have crashed or timed out.`;
        }
        throw new Error(errorMessage);
      }

      const listData = await listResponse.json();
      const files = listData.files; // Array of { id, name }

      if (!files || files.length === 0) {
        throw new Error('No PDFs found in the provided Google Drive folder.');
      }

      stats.total = files.length;

      setSmartUploadProgress({
        total: files.length,
        current: 0,
        completed: 0,
        failed: 0,
        status: 'Processing PDFs to staging...'
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setSmartUploadProgress(prev => prev ? { 
          ...prev, 
          current: i + 1, 
          status: `Processing ${file.name} to staging (${i + 1} of ${files.length})...` 
        } : null);

        try {
          // Fetch the individual PDF
          const pdfResponse = await fetch('/api/fetch-drive-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: file.id }),
          });

          if (!pdfResponse.ok) {
            throw new Error(`Failed to download ${file.name}`);
          }

          const pdfData = await pdfResponse.json();
          const base64 = pdfData.base64;

          if (!base64) throw new Error(`Empty PDF data for ${file.name}`);

          const res = await fetch('/api/import/resort-pdf', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              batchId,
              base64Data: base64,
              filename: file.name,
              skipDuplicates
            })
          });
          
          if (!res.ok) throw new Error('Staging failed');

          const result = await res.json();
          if (result.skipped) {
            stats.skipped++;
          } else {
            stats.new++;
            setSmartUploadProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
          }
        } catch (err) {
          console.error(`Failed processing ${file.name}:`, err);
          stats.failed++;
          setSmartUploadProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
        }
      }
      
      setDriveSyncSummary({ ...stats, show: true });
      showNotification(skipDuplicates ? 'Google Drive sync completed' : 'Google Drive batch ingested to staging');
      
      if (!skipDuplicates) {
        navigate('/admin/imports');
      }
    } catch (error: any) {
      console.error('Drive fetch error:', error);
      showNotification(`Error: ${error.message}`);
      setSmartUploadProgress(null);
    } finally {
      setIsFetchingDrive(false);
      setAiProcessing(false);
    }
  };

  const startEdit = (resort: any) => {
    setEditingResort(resort);
    setFormData({
      name: resort.name || '',
      atoll: resort.atoll || '',
      location: resort.location || '',
      category: resort.category || '',
      transfer_type: resort.transfer_type || '',
      description: resort.description || '',
      images: (resort.images || []).join(', '),
      banner_url: resort.banner_url || '',
      resort_url: resort.resort_url || '',
      highlights: resort.highlights || [],
      meal_plans: resort.meal_plans || [],
      rooms: resort.rooms || [],
      is_featured: resort.is_featured || false,
      crawl: false,
      room_types: resort.room_types || []
    });
    setIsAdding(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Resort Management</h1>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Google Drive Import Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-white rounded-full pl-6 pr-2 py-1 shadow-lg border border-brand-navy/5">
              <div className="flex items-center gap-2 text-brand-navy/40">
                <Database size={16} />
                <input 
                  type="text" 
                  placeholder="Drive Folder URL/ID" 
                  className="text-[10px] font-bold uppercase tracking-widest outline-none border-none bg-transparent w-40"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  disabled={isFetchingDrive || aiProcessing}
                />
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSaveDriveUrl}
                  className="p-2 text-brand-navy/40 hover:text-brand-teal transition-colors"
                  title="Save Folder URL"
                >
                  <Save size={14} />
                </button>
                <button 
                  onClick={() => handleDriveUpload(false)}
                  disabled={!driveUrl || isFetchingDrive || aiProcessing}
                  className="px-4 py-2 bg-brand-navy text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isFetchingDrive ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                  Import
                </button>
                <button 
                  onClick={() => handleDriveUpload(true)}
                  disabled={!driveUrl || isFetchingDrive || aiProcessing}
                  className="px-4 py-2 bg-brand-teal text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isFetchingDrive ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  Sync
                </button>
              </div>
            </div>

            {driveSyncSummary?.show && (
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-brand-teal/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Sync Summary</h3>
                  <button onClick={() => setDriveSyncSummary(null)} className="text-brand-navy/20 hover:text-brand-navy">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-serif text-brand-navy">{driveSyncSummary.total}</div>
                    <div className="text-[8px] uppercase tracking-widest text-brand-navy/40">Total Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-serif text-brand-teal">{driveSyncSummary.new}</div>
                    <div className="text-[8px] uppercase tracking-widest text-brand-navy/40">New Staged</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-serif text-amber-500">{driveSyncSummary.skipped}</div>
                    <div className="text-[8px] uppercase tracking-widest text-brand-navy/40">Skipped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-serif text-red-500">{driveSyncSummary.failed}</div>
                    <div className="text-[8px] uppercase tracking-widest text-brand-navy/40">Failed</div>
                  </div>
                </div>
                {driveSyncSummary.new > 0 && (
                  <div className="mt-4 pt-3 border-t border-brand-navy/5">
                    <button 
                      onClick={() => navigate('/admin/imports')}
                      className="w-full py-2 bg-brand-navy text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-brand-navy/90 transition-all"
                    >
                      Review New Resorts
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {bulkImportEnabled && (
            <label className="cursor-pointer bg-brand-teal text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-teal/20">
              <Upload size={16} /> {aiProcessing && !isFetchingDrive ? 'Processing AI...' : 'Smart Upload PDF'}
              <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileUpload} disabled={aiProcessing || isFetchingDrive} />
            </label>
          )}
          <button 
            onClick={() => {
              setEditingResort(null);
              setFormData({ 
                name: '', 
                atoll: '', 
                location: '', 
                category: '', 
                transfer_type: '', 
                description: '', 
                images: '', 
                banner_url: '', 
                resort_url: '',
                crawl: false,
                highlights: [], 
                meal_plans: [], 
                rooms: [],
                is_featured: false, 
                room_types: [] 
              });
              setIsAdding(true);
            }}
            className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
          >
            <Plus size={16} /> Manual Add
          </button>
        </div>
      </div>

      {smartUploadProgress && (
        <div className="mb-8 bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal">
                <Zap size={16} className={aiProcessing ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Smart Upload Progress</h3>
                <p className="text-[10px] text-brand-navy/40 font-medium">{smartUploadProgress.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-brand-navy">{Math.round((smartUploadProgress.current / smartUploadProgress.total) * 100)}%</p>
              <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest">
                {smartUploadProgress.completed} Success / {smartUploadProgress.failed} Failed
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-brand-paper rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-teal"
              initial={{ width: 0 }}
              animate={{ width: `${(smartUploadProgress.current / smartUploadProgress.total) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-brand-paper border-b border-brand-navy/5">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Resort Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Atoll</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-paper">
              {resorts.map(resort => (
                <tr key={resort.id} className="hover:bg-brand-paper/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-navy font-sans">{resort.name}</td>
                  <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 font-sans">{resort.atoll}</td>
                  <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 font-sans">{resort.category}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={async () => {
                        const { error } = await supabase
                          .from('resorts')
                          .update({ is_featured: !resort.is_featured })
                          .eq('id', resort.id);
                        if (!error) fetchResorts();
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans ${resort.is_featured ? 'bg-brand-beige/20 text-brand-beige' : 'bg-brand-paper text-brand-navy/30'}`}
                    >
                      {resort.is_featured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(resort)} className="px-4 py-2 bg-brand-teal text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all">Edit</button>
                      <button onClick={() => handleDelete(resort.id)} className="p-2 text-brand-navy/30 hover:text-brand-coral transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-12 overflow-y-auto">
                <h2 className="text-3xl font-serif text-brand-navy mb-8">{editingResort ? 'Edit Resort' : 'Add New Resort'}</h2>
                <ErrorBoundary>
                  <ResortEditForm 
                    formData={formData}
                    setFormData={setFormData}
                    editingResort={editingResort}
                    handleSave={handleSave}
                    setIsAdding={setIsAdding}
                    showNotification={showNotification}
                    setUploadProgress={setUploadProgress}
                  />
                </ErrorBoundary>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function AdminPartners() {
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setPartners(data);
      }
    };
    fetchPartners();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('partner_requests')
      .update({ status })
      .eq('id', id);
    
    if (!error) {
      setPartners(partners.map(p => p.id === id ? { ...p, status } : p));
    }
  };

  const downloadCSV = () => {
    const headers = ['Full Name', 'Email', 'Phone', 'Company', 'Website', 'Status', 'Created At'];
    const rows = partners.map(p => [
      p.full_name,
      p.email,
      p.phone,
      p.company_name,
      p.website,
      p.status,
      p.created_at
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'partner_requests.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadIndividual = (partner: any) => {
    const content = `
PARTNER REQUEST DETAILS
-----------------------
Full Name: ${partner.full_name}
Email: ${partner.email}
Phone: ${partner.phone}
Company: ${partner.company_name}
Website: ${partner.website || 'N/A'}
Status: ${partner.status}
Submitted At: ${new Date(partner.created_at).toLocaleString()}

Message:
${partner.message || 'No message provided.'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `request_${partner.full_name.replace(/ /g, '_')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-serif text-brand-navy">Partner Requests</h1>
        <button 
          onClick={downloadCSV}
          className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
        >
          Download CSV
        </button>
      </div>
      <div className="bg-white rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-brand-paper border-b border-brand-navy/5">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Company</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-paper">
              {partners.map(partner => (
                <tr key={partner.id} className="hover:bg-brand-paper/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-brand-navy font-sans">
                    {partner.full_name}
                    <div className="text-xs text-brand-navy/60 font-normal">{partner.email}</div>
                </td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">{partner.company_name}</td>
                <td className="px-6 py-4">
                  <select 
                    value={partner.status}
                    onChange={(e) => updateStatus(partner.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-sans border-0 outline-none ${
                      partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                      partner.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-brand-navy/60 font-sans">{new Date(partner.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => downloadIndividual(partner)}
                    className="text-brand-teal hover:text-brand-navy text-xs font-bold uppercase tracking-widest font-sans"
                  >
                    Download Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function AdminChats() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    
    // Subscribe to ALL messages to update chat list in real-time
    const channel = supabase
      .channel('admin_chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      
      const channel = supabase
        .channel(`chat:${selectedChat}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${selectedChat}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchChats = async () => {
    const { data } = await supabase
      .from('messages')
      .select('chat_id, sender_name, created_at')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Group by chat_id and get latest
      const uniqueChats = data.reduce((acc: any[], curr: any) => {
        if (!acc.find(c => c.chat_id === curr.chat_id)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      setChats(uniqueChats);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    const messageData = {
      chat_id: selectedChat,
      content: inputText,
      sender_id: null, // Admin sender
      sender_type: 'admin',
      sender_name: 'Admin Support',
    };

    const { error } = await supabase.from('messages').insert(messageData);
    if (!error) setInputText('');
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col md:flex-row gap-6">
      {/* Chat List */}
      <div className={`w-full md:w-80 bg-white rounded-[32px] border border-brand-navy/5 shadow-xl overflow-hidden flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-brand-navy/5 bg-brand-paper/30">
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-widest">Active Conversations</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <button
              key={chat.chat_id}
              onClick={() => setSelectedChat(chat.chat_id)}
              className={`w-full p-6 text-left border-b border-brand-navy/5 transition-all hover:bg-brand-paper/50 ${selectedChat === chat.chat_id ? 'bg-brand-paper border-l-4 border-l-brand-teal' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold text-brand-navy">{chat.sender_name}</span>
                <span className="text-[10px] text-brand-navy/30 font-medium">{new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold">ID: {chat.chat_id.slice(0, 8)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 bg-white rounded-[32px] border border-brand-navy/5 shadow-xl overflow-hidden flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            <div className="p-4 md:p-6 border-b border-brand-navy/5 bg-brand-paper/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden p-2 bg-white rounded-full shadow-sm text-brand-navy"
                  onClick={() => setSelectedChat(null)}
                >
                  <X size={16} />
                </button>
                <div className="w-10 h-10 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy">{chats.find(c => c.chat_id === selectedChat)?.sender_name || 'Visitor'}</h3>
                  <p className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-brand-paper/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_name === 'Admin Support' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-sans ${
                    msg.sender_name === 'Admin Support' 
                      ? 'bg-brand-navy text-white rounded-tr-none shadow-lg' 
                      : 'bg-white text-brand-navy rounded-tl-none shadow-md border border-brand-navy/5'
                  }`}>
                    {msg.content}
                    <div className={`text-[8px] mt-2 opacity-50 ${msg.sender_name === 'Admin Support' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-brand-navy/5 flex gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-brand-paper/50 border-none rounded-2xl px-6 py-4 text-sm font-sans focus:ring-2 focus:ring-brand-teal/20 transition-all"
              />
              <button type="submit" className="bg-brand-teal text-white p-4 rounded-2xl hover:bg-brand-navy transition-all shadow-lg shadow-brand-teal/20">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-navy/20">
            <MessageSquare size={64} className="mb-4 opacity-10" />
            <p className="text-sm font-serif italic">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPageManager({ showNotification, setUploadProgress }: { showNotification: (msg: string) => void, setUploadProgress: (p: number | null) => void }) {
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState(tab || 'nav');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);
  const [settings, setSettings] = useState<any>({});
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resorts, setResorts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeMarket, setActiveMarket] = useState<any | null>(null);

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

  useEffect(() => {
    fetchSettings();
    fetchResorts();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await getSiteSettings(true);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResorts = async () => {
    const { data } = await supabase.from('resorts').select('id, name, is_featured, resort_media(id, category, storage_path, sort_order)');
    if (data) setResorts(data);
  };

  const toggleFeatured = async (resort: any) => {
    const { error } = await supabase
      .from('resorts')
      .update({ is_featured: !resort.is_featured })
      .eq('id', resort.id);
    
    if (!error) {
      fetchResorts();
    }
  };

  const fetchHistory = async (key: string) => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', `history:${key}`)
      .single();
    
    if (data && data.value) {
      setHistory(data.value);
    } else {
      setHistory([]);
    }
    setShowHistory(true);
  };

  const saveSetting = async (key: string, valueOrUpdater: any) => {
    setSaving(true);
    
    // Get the latest value
    const currentValue = settingsRef.current[key] || {};
    const newValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(currentValue) : valueOrUpdater;

    // Save draft
    const { error: draftError } = await supabase
      .from('site_settings')
      .upsert({ key: `${key}:draft`, value: newValue }, { onConflict: 'key' });
    
    // Auto-publish for immediate reflection on homepage
    const { error: pubError } = await supabase
      .from('site_settings')
      .upsert({ key: `${key}:published`, value: newValue }, { onConflict: 'key' });
    
    if (draftError) console.error('Error saving draft setting:', draftError);
    if (pubError) console.error('Error saving published setting:', pubError);
    
    if (!draftError && !pubError) {
      clearSettingsCache();
      setSettings(prev => ({ ...prev, [key]: newValue }));
      showNotification('Changes saved and published');
      
      // Audit log
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        logAuditAction(user.id, 'settings.update', 'site_settings', key, currentValue, newValue);
      }
    } else {
      showNotification('Error saving changes');
    }
    setSaving(false);
  };

  const publishSettings = async () => {
    setPublishing(true);
    try {
      // Get all draft settings
      const { data: draftData } = await supabase
        .from('site_settings')
        .select('*')
        .like('key', '%:draft');

      if (draftData) {
        const publishPromises = draftData.map(async (draft) => {
          const key = draft.key.replace(':draft', '');
          const publishedKey = `${key}:published`;
          
          // 1. Get current published to add to history
          const { data: currentPublished } = await supabase
            .from('site_settings')
            .select('*')
            .eq('key', publishedKey)
            .maybeSingle();
          
          if (currentPublished) {
            const historyKey = `history:${key}`;
            const { data: currentHistory } = await supabase
              .from('site_settings')
              .select('*')
              .eq('key', historyKey)
              .maybeSingle();
            
            const historyList = currentHistory?.value || [];
            const newHistory = [{
              timestamp: new Date().toISOString(),
              value: currentPublished.value,
              id: Math.random().toString(36).substr(2, 9)
            }, ...historyList].slice(0, 10); // Keep last 10

            await supabase
              .from('site_settings')
              .upsert({ key: historyKey, value: newHistory }, { onConflict: 'key' });
          }

          // 2. Publish new value
          return supabase
            .from('site_settings')
            .upsert({ key: publishedKey, value: draft.value }, { onConflict: 'key' });
        });
        
        await Promise.all(publishPromises);
        clearSettingsCache();
        showNotification('Published successfully');
        console.log('Website published successfully!');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      console.error('Failed to publish. Please try again.');
    }
    setPublishing(false);
  };

  const revertHistory = async (key: string, historyItem: any) => {
    // In a real app, use a custom modal for confirmation instead of window.confirm
    // For now, we'll just revert it directly to avoid iframe blocking issues
    await saveSetting(key, historyItem.value);
    setShowHistory(false);
  };

  const handlePreview = () => {
    window.open(`${window.location.origin}/?preview=true`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div></div>;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-serif text-brand-navy capitalize">{activeTab.replace('-', ' ')} Settings</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mt-2">Manage your website content and appearance</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handlePreview}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-brand-navy/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-paper transition-all"
          >
            <Eye size={14} />
            Preview
          </button>
          <button 
            onClick={publishSettings}
            disabled={publishing}
            className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shadow-brand-navy/10 disabled:opacity-50"
          >
            {publishing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Publish to Website
          </button>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button 
          onClick={() => fetchHistory(activeTab)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-teal transition-all"
        >
          <History size={14} />
          View History & Revert
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-brand-navy/5 shadow-xl shadow-brand-navy/5"
        >
          {/* History Overlay */}
          {showHistory && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/20 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-brand-navy/5 flex justify-between items-center">
                  <h3 className="text-xl font-serif text-brand-navy">Version History: {activeTab}</h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-brand-paper rounded-full transition-all"><X size={20} /></button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-brand-navy/40 text-sm font-sans italic">No history found for this section.</p>
                      <p className="text-[10px] text-brand-navy/20 uppercase tracking-widest font-bold mt-2">History is created when you publish changes</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-brand-paper/30 rounded-2xl border border-brand-navy/5">
                        <div>
                          <p className="text-xs font-bold text-brand-navy">{new Date(item.timestamp).toLocaleString()}</p>
                          <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold mt-1">Published Version</p>
                        </div>
                        <button 
                          onClick={() => revertHistory(activeTab, item)}
                          className="px-4 py-2 bg-brand-navy text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all"
                        >
                          Revert
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
          {activeTab === 'nav' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Navigation Items</h3>
                <div className="space-y-4">
                  {safeArray(settings.navbar).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-brand-paper/30 p-4 rounded-2xl">
                      <div className="flex-1">
                        <TextInput 
                          label="Page" 
                          value={item.label || ''} 
                          onChange={(val) => {
                            const newNav = [...safeArray(settings.navbar)];
                            newNav[idx].label = val;
                            saveSetting('navbar', newNav);
                          }} 
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">
                          Path
                        </label>
                        <select
                          value={item.path || '/'}
                          onChange={(e) => {
                            const newNav = [...safeArray(settings.navbar)];
                            newNav[idx].path = e.target.value;
                            saveSetting('navbar', newNav);
                          }}
                          className="w-full bg-white border border-brand-navy/10 rounded-xl px-4 py-3 text-sm font-sans text-brand-navy focus:outline-none focus:border-brand-teal transition-all"
                        >
                          <option value="/">Home (/)</option>
                          <option value="/resorts">Resorts (/resorts)</option>
                          <option value="/map">Map (/map)</option>
                          <option value="/tourist-info">Tourist Info (/tourist-info)</option>
                          <option value="/become-partner">Become a Partner (/become-partner)</option>
                          {safeArray(settings.custom_pages).map((p: any) => (
                            <option key={p.slug} value={`/${p.slug}`}>
                              {p.title} (/{p.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const newNav = safeArray(settings.navbar).filter((_: any, i: number) => i !== idx);
                          saveSetting('navbar', newNav);
                        }}
                        className="mt-6 p-2 text-brand-coral hover:bg-brand-coral/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => saveSetting('navbar', [...safeArray(settings.navbar), { label: 'New Item', path: '/' }])}
                    className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Navigation Item
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Website Logos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LogoInput 
                    label="Primary Logo" 
                    value={settings.logos?.primary || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'logos', 'site-assets', setUploadProgress, showNotification);
                        if (url) saveSetting('logos', (prev: any) => ({ ...prev, primary: url }));
                      } catch (err: any) {
                        showNotification(err.message);
                      }
                    }}
                    onChange={(val: string) => saveSetting('logos', (prev: any) => ({ ...prev, primary: val }))} 
                  />
                  <LogoInput 
                    label="White Logo" 
                    value={settings.logos?.white || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'logos', 'site-assets', setUploadProgress, showNotification);
                        if (url) saveSetting('logos', (prev: any) => ({ ...prev, white: url }));
                      } catch (err: any) {
                        showNotification(err.message);
                      }
                    }}
                    onChange={(val: string) => saveSetting('logos', (prev: any) => ({ ...prev, white: val }))} 
                  />
                  <LogoInput 
                    label="Black Logo" 
                    value={settings.logos?.black || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'logos', 'site-assets', setUploadProgress, showNotification);
                        if (url) saveSetting('logos', (prev: any) => ({ ...prev, black: url }));
                      } catch (err: any) {
                        showNotification(err.message);
                      }
                    }}
                    onChange={(val: string) => saveSetting('logos', (prev: any) => ({ ...prev, black: val }))} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif text-brand-navy">Page Manager</h3>
                <button 
                  onClick={() => saveSetting('custom_pages', [...safeArray(settings.custom_pages), { title: 'New Page', slug: 'new-page', content: '', status: 'active' }])}
                  className="py-3 px-6 bg-brand-navy text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> Add New Page
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-brand-navy/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-navy/10 bg-brand-paper/30">
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Page Name</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Path</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Status</th>
                      <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: 'Home', slug: '', isBuiltIn: true },
                      { title: 'Resorts', slug: 'resorts', isBuiltIn: true },
                      { title: 'Tourist Info', slug: 'tourist-info', isBuiltIn: true },
                      { title: 'Map', slug: 'map', isBuiltIn: true },
                      { title: 'Legal', slug: 'legal', isBuiltIn: true },
                      { title: 'Become Partner', slug: 'become-partner', isBuiltIn: true },
                      { title: 'Login', slug: 'login', isBuiltIn: true },
                      ...safeArray(settings.custom_pages).map((p: any, i: number) => ({ ...p, isBuiltIn: false, originalIndex: i }))
                    ].map((page: any, idx: number) => {
                      const isActive = page.isBuiltIn 
                        ? (settings.builtin_pages_status?.[page.slug] !== false)
                        : (page.status !== 'inactive');
                      
                      return (
                        <tr key={idx} className="border-b border-brand-navy/5 hover:bg-brand-paper/10">
                          <td className="py-4 px-6 text-sm font-sans text-brand-navy flex items-center gap-2">
                            {page.title}
                            {page.isBuiltIn && <span className="text-[10px] bg-brand-navy/5 text-brand-navy/50 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Built-in</span>}
                          </td>
                          <td className="py-4 px-6 text-sm font-sans text-brand-navy">/{page.slug}</td>
                          <td className="py-4 px-6 text-sm font-sans text-brand-navy">
                            <button 
                              onClick={() => {
                                if (page.isBuiltIn) {
                                  const currentStatus = settings.builtin_pages_status || {};
                                  saveSetting('builtin_pages_status', {
                                    ...currentStatus,
                                    [page.slug]: !isActive
                                  });
                                } else {
                                  const newPages = [...safeArray(settings.custom_pages)];
                                  newPages[page.originalIndex].status = isActive ? 'inactive' : 'active';
                                  saveSetting('custom_pages', newPages);
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-brand-coral/10 text-brand-coral hover:bg-brand-coral/20'}`}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-4 px-6 flex gap-2">
                            {!page.isBuiltIn && (
                              <>
                                <button 
                                  onClick={() => {
                                    console.log('Edit page', page);
                                  }}
                                  className="text-brand-teal hover:text-brand-teal/80 text-sm font-bold uppercase tracking-widest"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    const newPages = safeArray(settings.custom_pages).filter((_: any, i: number) => i !== page.originalIndex);
                                    saveSetting('custom_pages', newPages);
                                  }}
                                  className="text-brand-coral hover:text-brand-coral/80 text-sm font-bold uppercase tracking-widest"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-12">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Hero Banner</h3>
                <div className="space-y-6">
                  <BannerInput 
                    label="Banner Media (Image or Video)"
                    value={settings.hero?.banner_url || ''}
                    type={settings.hero?.banner_type || 'image'}
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'banners', 'site-assets', setUploadProgress, showNotification);
                        if (url) {
                          const type = file.type.startsWith('video/') ? 'video' : 'image';
                          saveSetting('hero', (prev: any) => ({ ...prev, banner_url: url, banner_type: type }));
                        }
                      } catch (err: any) {
                        showNotification(err.message);
                      }
                    }}
                    onChange={(val: string) => saveSetting('hero', (prev: any) => ({ ...prev, banner_url: val }))}
                  />
                  <TextInput 
                    label="Main Title" 
                    value={settings.hero?.title || ''} 
                    onChange={(val) => saveSetting('hero', (prev: any) => ({ ...prev, title: val }))} 
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Title Font Size (e.g., text-4xl, text-5xl)</label>
                      <select
                        value={settings.hero?.title_size || 'text-5xl md:text-7xl'}
                        onChange={(e) => saveSetting('hero', (prev: any) => ({ ...prev, title_size: e.target.value }))}
                        className="w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm font-sans text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all"
                      >
                        <option value="text-3xl md:text-5xl">Small (3xl-5xl)</option>
                        <option value="text-4xl md:text-6xl">Medium (4xl-6xl)</option>
                        <option value="text-5xl md:text-7xl">Large (5xl-7xl)</option>
                        <option value="text-6xl md:text-8xl">Extra Large (6xl-8xl)</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Title Color</label>
                      <input
                        type="color"
                        value={settings.hero?.title_color || '#ffffff'}
                        onChange={(e) => saveSetting('hero', (prev: any) => ({ ...prev, title_color: e.target.value }))}
                        className="w-full h-12 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Explore Button Color</label>
                      <input
                        type="color"
                        value={settings.hero?.button_color || '#008080'}
                        onChange={(e) => saveSetting('hero', (prev: any) => ({ ...prev, button_color: e.target.value }))}
                        className="w-full h-12 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                  <TextAreaInput 
                    label="Subtitle" 
                    value={settings.hero?.subtitle || ''} 
                    onChange={(val) => saveSetting('hero', (prev: any) => ({ ...prev, subtitle: val }))} 
                  />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">Title Font</label>
                    <select
                      value={settings.hero?.title_font || 'font-serif'}
                      onChange={(e) => saveSetting('hero', (prev: any) => ({ ...prev, title_font: e.target.value }))}
                      className="w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm font-sans text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all"
                    >
                      <option value="font-serif">Serif (Elegant)</option>
                      <option value="font-sans">Sans (Modern)</option>
                      <option value="font-mono">Mono (Technical)</option>
                      <option value="font-display">Display (Bold)</option>
                    </select>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Hero Partners Strip</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Partners Strip Title" 
                    value={settings.hero?.partners_title || 'Top Properties'} 
                    onChange={(val) => saveSetting('hero', (prev: any) => ({ ...prev, partners_title: val }))} 
                  />
                  <div className="space-y-4">
                    {safeArray(settings.hero_partners).map((partner: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-center bg-brand-paper/30 p-4 rounded-2xl">
                        <div className="flex-1">
                          <LogoInput 
                            label={`Partner Logo ${idx + 1}`}
                            value={partner.url || ''}
                            onUpload={async (file: File) => {
                              try {
                                const url = await uploadFile(file, 'partners', 'site-assets', setUploadProgress, showNotification);
                                if (url) {
                                  const newPartners = [...safeArray(settings.hero_partners)];
                                  newPartners[idx] = { ...newPartners[idx], url };
                                  saveSetting('hero_partners', newPartners);
                                }
                              } catch (err: any) {
                                showNotification(err.message);
                              }
                            }}
                            onChange={(val: string) => {
                              const newPartners = [...safeArray(settings.hero_partners)];
                              newPartners[idx] = { ...newPartners[idx], url: val };
                              saveSetting('hero_partners', newPartners);
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newPartners = safeArray(settings.hero_partners).filter((_: any, i: number) => i !== idx);
                            saveSetting('hero_partners', newPartners);
                          }}
                          className="p-3 text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => saveSetting('hero_partners', [...safeArray(settings.hero_partners), { url: '' }])}
                      className="w-full py-4 border-2 border-dashed border-brand-navy/20 rounded-2xl text-brand-navy/50 font-bold uppercase tracking-widest text-[10px] hover:border-brand-teal hover:text-brand-teal transition-all"
                    >
                      + Add Partner Logo
                    </button>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Introduction Section</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Intro Title" 
                    value={settings.introduction?.title || ''} 
                    onChange={(val) => saveSetting('introduction', { ...settings.introduction, title: val })} 
                  />
                  <TextAreaInput 
                    label="Intro Summary" 
                    value={settings.introduction?.summary || ''} 
                    onChange={(val) => saveSetting('introduction', { ...settings.introduction, summary: val })} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-xl font-serif text-brand-navy mb-6">Expertise Stats</h3>
              <div className="space-y-4">
                {safeArray(settings.expertise_stats).map((stat: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center bg-brand-paper/30 p-4 rounded-2xl">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <TextInput 
                        label="Value (e.g., 198+)" 
                        value={stat.value || ''} 
                        onChange={(val) => {
                          const newStats = [...safeArray(settings.expertise_stats)];
                          newStats[idx].value = val;
                          saveSetting('expertise_stats', newStats);
                        }} 
                      />
                      <TextInput 
                        label="Label (e.g., Resorts)" 
                        value={stat.label || ''} 
                        onChange={(val) => {
                          const newStats = [...safeArray(settings.expertise_stats)];
                          newStats[idx].label = val;
                          saveSetting('expertise_stats', newStats);
                        }} 
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newStats = safeArray(settings.expertise_stats).filter((_: any, i: number) => i !== idx);
                        saveSetting('expertise_stats', newStats);
                      }}
                      className="p-3 text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('expertise_stats', [...safeArray(settings.expertise_stats), { value: '0', label: 'New Stat' }])}
                  className="w-full py-4 border-2 border-dashed border-brand-navy/20 rounded-2xl text-brand-navy/50 font-bold uppercase tracking-widest text-[10px] hover:border-brand-teal hover:text-brand-teal transition-all"
                >
                  + Add Stat
                </button>
              </div>
            </div>
          )}

          {activeTab === 'trust' && (
            <div className="space-y-6">
              <h3 className="text-xl font-serif text-brand-navy mb-6">Trust Indicators</h3>
              <div className="space-y-4">
                {safeArray(settings.footer?.trust_indicators).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-4 bg-brand-paper/30 p-4 rounded-2xl">
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <TextInput 
                          label="Indicator Title" 
                          value={item.title || ''} 
                          onChange={(val) => {
                            const newItems = [...safeArray(settings.footer?.trust_indicators)];
                            newItems[idx] = { ...item, title: val };
                            saveSetting('footer', { ...settings.footer, trust_indicators: newItems });
                          }} 
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newItems = safeArray(settings.footer?.trust_indicators).filter((_: any, i: number) => i !== idx);
                          saveSetting('footer', { ...settings.footer, trust_indicators: newItems });
                        }}
                        className="mt-6 p-2 text-brand-coral hover:bg-brand-coral/10 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <TextInput 
                      label="Logo URL" 
                      value={item.logo || ''} 
                      onChange={(val) => {
                        const newItems = [...safeArray(settings.footer?.trust_indicators)];
                        newItems[idx] = { ...item, logo: val };
                        saveSetting('footer', { ...settings.footer, trust_indicators: newItems });
                      }} 
                    />
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('footer', { 
                    ...settings.footer, 
                    trust_indicators: [...safeArray(settings.footer?.trust_indicators), { title: 'New Indicator', logo: '' }] 
                  })}
                  className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Trust Indicator
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6">
              <h3 className="text-xl font-serif text-brand-navy mb-6">Maldives Travel Guide</h3>
              <div className="space-y-6">
                {safeArray(settings.travel_guide).map((post: any, idx: number) => (
                  <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group">
                    <button 
                      onClick={() => {
                        const newPosts = safeArray(settings.travel_guide).filter((_: any, i: number) => i !== idx);
                        saveSetting('travel_guide', newPosts);
                      }}
                      className="absolute top-4 right-4 p-2 text-brand-coral opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput label="Title" value={post.title || ''} onChange={(val) => {
                        const newPosts = [...safeArray(settings.travel_guide)];
                        newPosts[idx].title = val;
                        saveSetting('travel_guide', newPosts);
                      }} />
                      <TextInput label="Category" value={post.category || ''} onChange={(val) => {
                        const newPosts = [...safeArray(settings.travel_guide)];
                        newPosts[idx].category = val;
                        saveSetting('travel_guide', newPosts);
                      }} />
                    </div>
                    <TextAreaInput label="Description" value={post.description || ''} onChange={(val) => {
                      const newPosts = [...safeArray(settings.travel_guide)];
                      newPosts[idx].description = val;
                      saveSetting('travel_guide', newPosts);
                    }} />
                    <TextInput label="Link URL" value={post.link || ''} onChange={(val) => {
                      const newPosts = [...safeArray(settings.travel_guide)];
                      newPosts[idx].link = val;
                      saveSetting('travel_guide', newPosts);
                    }} />
                    <LogoInput 
                      label="Cover Image" 
                      value={post.img || ''} 
                      onUpload={async (file: File) => {
                        try {
                          const url = await uploadFile(file, 'guide', 'site-assets', setUploadProgress, showNotification);
                          if (url) {
                            const newPosts = [...safeArray(settings.travel_guide)];
                            newPosts[idx].img = url;
                            saveSetting('travel_guide', newPosts);
                          }
                        } catch (err: any) {
                          showNotification(err.message);
                        }
                      }}
                      onChange={(val: string) => {
                        const newPosts = [...safeArray(settings.travel_guide)];
                        newPosts[idx].img = val;
                        saveSetting('travel_guide', newPosts);
                      }} 
                    />
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('travel_guide', [...safeArray(settings.travel_guide), { title: 'New Guide', category: 'Travel', img: '', description: '', link: '' }])}
                  className="w-full py-6 border-2 border-dashed border-brand-navy/10 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Travel Guide
                </button>
              </div>
            </div>
          )}

          {activeTab === 'markets' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif text-brand-navy">Global Markets</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">Manage market presence and visualization</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {safeArray(settings.global_markets).map((market: any, idx: number) => (
                    <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group border border-brand-navy/5 hover:border-brand-teal/30 transition-all">
                      <button 
                        onClick={() => {
                          const newMarkets = safeArray(settings.global_markets).filter((_: any, i: number) => i !== idx);
                          saveSetting('global_markets', newMarkets);
                        }}
                        className="absolute top-4 right-4 p-2 text-brand-coral opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-coral/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      <TextInput 
                        label="Market Name" 
                        value={market.name || ''} 
                        onChange={(val) => {
                          const newMarkets = [...safeArray(settings.global_markets)];
                          newMarkets[idx].name = val;
                          saveSetting('global_markets', newMarkets);
                        }} 
                      />
                      <TextAreaInput 
                        label="Market Description" 
                        value={market.description || ''} 
                        onChange={(val) => {
                          const newMarkets = [...safeArray(settings.global_markets)];
                          newMarkets[idx].description = val;
                          saveSetting('global_markets', newMarkets);
                        }} 
                      />
                      <TextAreaInput 
                        label="Countries (Comma separated)" 
                        value={market.countries || ''} 
                        onChange={(val) => {
                          const newMarkets = [...safeArray(settings.global_markets)];
                          newMarkets[idx].countries = val;
                          saveSetting('global_markets', newMarkets);
                        }} 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                          label="Latitude" 
                          value={market.lat || ''} 
                          onChange={(val) => {
                            const newMarkets = [...safeArray(settings.global_markets)];
                            newMarkets[idx].lat = val;
                            saveSetting('global_markets', newMarkets);
                          }} 
                        />
                        <TextInput 
                          label="Longitude" 
                          value={market.lng || ''} 
                          onChange={(val) => {
                            const newMarkets = [...safeArray(settings.global_markets)];
                            newMarkets[idx].lng = val;
                            saveSetting('global_markets', newMarkets);
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => saveSetting('global_markets', [...safeArray(settings.global_markets), { name: 'New Market', description: '', countries: '', lat: '0', lng: '0' }])}
                    className="w-full py-6 border-2 border-dashed border-brand-navy/10 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add New Market
                  </button>
                </div>

                <div className="sticky top-8">
                  <div className="bg-brand-navy rounded-[32px] overflow-hidden h-[600px] relative shadow-2xl border border-brand-navy/10">
                    <Map
                      mapLib={maplibregl}
                      initialViewState={{
                        longitude: 20,
                        latitude: 20,
                        zoom: 1,
                        pitch: 0,
                        bearing: 0
                      }}
                      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                      interactive={true}
                      dragPan={true}
                      scrollZoom={true}
                      attributionControl={false}
                    >
                      {safeArray(settings.global_markets).map((market: any, i: number) => {
                        const lat = parseFloat(market.lat);
                        const lng = parseFloat(market.lng);
                        if (isNaN(lat) || isNaN(lng)) return null;

                        return (
                          <Marker
                            key={`admin-marker-${i}`}
                            longitude={lng}
                            latitude={lat}
                            anchor="bottom"
                            onClick={e => {
                              e.originalEvent.stopPropagation();
                              setActiveMarket(market);
                            }}
                          >
                            <div className="relative group cursor-pointer">
                              <div className="absolute -inset-4 bg-brand-teal/20 rounded-full blur-md animate-pulse"></div>
                              <div className="relative bg-brand-teal text-white p-2 rounded-full shadow-lg border-2 border-white/20 group-hover:scale-110 transition-transform">
                                <MapPin size={16} />
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-brand-navy text-white px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                {market.countries || market.name}
                              </div>
                            </div>
                          </Marker>
                        );
                      })}

                      {activeMarket && !isNaN(parseFloat(activeMarket.lat)) && !isNaN(parseFloat(activeMarket.lng)) && (
                        <Popup
                          longitude={parseFloat(activeMarket.lng)}
                          latitude={parseFloat(activeMarket.lat)}
                          anchor="top"
                          onClose={() => setActiveMarket(null)}
                          closeOnClick={false}
                          className="global-market-popup"
                          maxWidth="240px"
                        >
                          <div className="p-4 bg-white rounded-xl text-brand-navy shadow-xl">
                            <h3 className="font-serif text-lg mb-1">{activeMarket.name}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal mb-2">
                              {activeMarket.countries || 'No countries defined'}
                            </p>
                            <p className="text-[10px] text-brand-navy/60 leading-relaxed">
                              {activeMarket.description}
                            </p>
                          </div>
                        </Popup>
                      )}
                    </Map>
                    <div className="absolute bottom-6 left-6 right-6 bg-brand-navy/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Visualization Mode</p>
                      <p className="text-[10px] text-white/40">Showing market presence based on defined coordinates and country labels.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'why-us' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-brand-navy">Featured Retreats</h3>
              </div>
              <div className="bg-brand-paper/30 p-6 rounded-3xl space-y-4">
                <TextInput 
                  label="Featured Retreats Section Title" 
                  value={settings.featured_retreats_title || 'Featured Retreats'} 
                  onChange={(val) => saveSetting('featured_retreats_title', val)} 
                />
              </div>

              <div className="flex justify-between items-center mb-6 mt-12">
                <h3 className="text-xl font-serif text-brand-navy">Why Us Pillars</h3>
                <button 
                  onClick={() => {
                    const defaultPillars = [
                      {
                        title: "Authentic Connections",
                        description: "We focus on fostering genuine relationships with our B2B partners by understanding their needs and providing personalized solutions."
                      },
                      {
                        title: "Curated Luxury",
                        description: "Our strategy centers on curating unique luxury experiences that showcase the beauty and culture of the Maldives."
                      },
                      {
                        title: "Streamlined Collaboration",
                        description: "We aim to enhance collaboration that simplify the booking process and improve communication, ensuring seamless service delivery."
                      },
                      {
                        title: "Tailored Support",
                        description: "We offer dedicated support to our partners, providing them with the insights and resources needed to effectively promote our offerings."
                      }
                    ];
                    saveSetting('why_us', defaultPillars);
                  }}
                  className="text-[10px] font-bold text-brand-teal uppercase tracking-widest hover:underline"
                >
                  Reset to Defaults
                </button>
              </div>
              <div className="bg-brand-paper/30 p-6 rounded-3xl space-y-4">
                <TextInput 
                  label="Section Title" 
                  value={settings.why_us_title || 'Why Travel Designers Choose Us'} 
                  onChange={(val) => saveSetting('why_us_title', val)} 
                />
              </div>
              {safeArray(settings.why_us).map((pillar: any, idx: number) => (
                <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group">
                  <button 
                    onClick={() => {
                      const newPillars = safeArray(settings.why_us).filter((_: any, i: number) => i !== idx);
                      saveSetting('why_us', newPillars);
                    }}
                    className="absolute top-4 right-4 p-2 text-brand-coral opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <LogoInput 
                    label="Pillar Image" 
                    value={pillar.image_url || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'why-us', 'site-assets', setUploadProgress, showNotification);
                        const newPillars = [...safeArray(settings.why_us)];
                        newPillars[idx].image_url = url;
                        saveSetting('why_us', newPillars);
                      } catch (err) {
                        console.error('Upload error:', err);
                      }
                    }}
                    onChange={(val: string) => {
                      const newPillars = [...safeArray(settings.why_us)];
                      newPillars[idx].image_url = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                  <TextInput 
                    label="Pillar Title" 
                    value={pillar.title || ''} 
                    onChange={(val) => {
                      const newPillars = [...safeArray(settings.why_us)];
                      newPillars[idx].title = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                  <TextAreaInput 
                    label="Pillar Description" 
                    value={pillar.description || ''} 
                    onChange={(val) => {
                      const newPillars = [...safeArray(settings.why_us)];
                      newPillars[idx].description = val;
                      saveSetting('why_us', newPillars);
                    }} 
                  />
                </div>
              ))}
              <button 
                onClick={() => saveSetting('why_us', [...safeArray(settings.why_us), { title: 'New Pillar', description: '' }])}
                className="w-full py-6 border-2 border-dashed border-brand-navy/10 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Pillar
              </button>

              <div className="pt-12 mt-12 border-t border-brand-navy/10">
                <h3 className="text-xl font-serif text-brand-navy mb-6">Platform Excellence</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Main Title" 
                    value={settings.platform_excellence?.title || ''} 
                    onChange={(val) => saveSetting('platform_excellence', (prev: any) => ({ ...prev, title: val }))} 
                  />
                  <TextAreaInput 
                    label="Main Description" 
                    value={settings.platform_excellence?.description || ''} 
                    onChange={(val) => saveSetting('platform_excellence', (prev: any) => ({ ...prev, description: val }))} 
                  />
                  <LogoInput 
                    label="Main Image" 
                    value={settings.platform_excellence?.image_url || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'excellence', 'site-assets', setUploadProgress, showNotification);
                        saveSetting('platform_excellence', (prev: any) => ({ ...prev, image_url: url }));
                      } catch (err) {
                        console.error('Upload error:', err);
                      }
                    }}
                    onChange={(val: string) => saveSetting('platform_excellence', (prev: any) => ({ ...prev, image_url: val }))} 
                  />
                  <TextInput 
                    label="Floating Badge Text" 
                    value={settings.platform_excellence?.badge_text || ''} 
                    onChange={(val) => saveSetting('platform_excellence', (prev: any) => ({ ...prev, badge_text: val }))} 
                  />
                  
                  <div className="space-y-4 mt-8">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Carousel Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {safeArray(settings.platform_excellence?.images).map((imgUrl: string, idx: number) => (
                        <div key={idx} className="relative group aspect-video rounded-2xl overflow-hidden bg-brand-paper">
                          <img src={imgUrl} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => {
                              saveSetting('platform_excellence', (prev: any) => {
                                const newImages = safeArray(prev?.images).filter((_: any, i: number) => i !== idx);
                                return { ...prev, images: newImages };
                              });
                            }}
                            className="absolute top-2 right-2 p-2 bg-white/90 text-brand-coral rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await uploadFile(file, 'platform', 'site-assets', setUploadProgress, showNotification);
                                saveSetting('platform_excellence', (prev: any) => ({
                                  ...prev,
                                  images: [...safeArray(prev?.images), url]
                                }));
                              } catch (err) {
                                console.error('Upload error:', err);
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-video border-2 border-dashed border-brand-navy/20 rounded-2xl flex flex-col items-center justify-center text-brand-navy/40 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add Image</span>
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-serif text-brand-navy mt-8">Features</h4>
                  {safeArray(settings.platform_excellence?.features).map((item: any, idx: number) => (
                    <div key={idx} className="p-6 bg-brand-paper/30 rounded-2xl space-y-4 relative">
                      <button 
                        onClick={() => {
                          saveSetting('platform_excellence', (prev: any) => {
                            const newFeatures = safeArray(prev?.features).filter((_: any, i: number) => i !== idx);
                            return { ...prev, features: newFeatures };
                          });
                        }}
                        className="absolute top-4 right-4 p-2 bg-brand-coral/10 text-brand-coral rounded-full hover:bg-brand-coral hover:text-white transition-all"
                      >
                        <X size={14} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <TextInput 
                            label="Feature Title" 
                            value={item.title} 
                            onChange={(val) => {
                              saveSetting('platform_excellence', (prev: any) => {
                                const newFeatures = [...safeArray(prev?.features)];
                                newFeatures[idx] = { ...newFeatures[idx], title: val };
                                return { ...prev, features: newFeatures };
                              });
                            }} 
                          />
                          <TextAreaInput 
                            label="Feature Description" 
                            value={item.description} 
                            onChange={(val) => {
                              saveSetting('platform_excellence', (prev: any) => {
                                const newFeatures = [...safeArray(prev?.features)];
                                newFeatures[idx] = { ...newFeatures[idx], description: val };
                                return { ...prev, features: newFeatures };
                              });
                            }} 
                          />
                        </div>
                        <div>
                          <LogoInput 
                            label="Feature Icon/Image" 
                            value={item.icon_url || ''} 
                            onUpload={async (file: File) => {
                              try {
                                const url = await uploadFile(file, 'excellence-icons', 'site-assets', setUploadProgress, showNotification);
                                saveSetting('platform_excellence', (prev: any) => {
                                  const newFeatures = [...safeArray(prev?.features)];
                                  newFeatures[idx] = { ...newFeatures[idx], icon_url: url };
                                  return { ...prev, features: newFeatures };
                                });
                              } catch (err) {
                                console.error('Upload error:', err);
                              }
                            }}
                            onChange={(val: string) => {
                              saveSetting('platform_excellence', (prev: any) => {
                                const newFeatures = [...safeArray(prev?.features)];
                                newFeatures[idx] = { ...newFeatures[idx], icon_url: val };
                                return { ...prev, features: newFeatures };
                              });
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => saveSetting('platform_excellence', (prev: any) => ({ 
                      ...prev, 
                      features: [...safeArray(prev?.features), { title: 'New Feature', description: '' }] 
                    }))}
                    className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Excellence Feature
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-brand-navy">DMC Services</h3>
                <button 
                  onClick={() => {
                    const defaultServices = [
                      { title: "B2B Resort Bookings", icon: "Hotel", link: "/resorts" },
                      { title: "Seaplane & Transfers", icon: "Plane", link: "/transfers" },
                      { title: "VIP Meet & Greet", icon: "UserCheck", link: "/vip" },
                      { title: "Curated Experiences", icon: "Calendar", link: "/experiences" },
                      { title: "24/7 Concierge", icon: "Smile", link: "/concierge" },
                      { title: "Fast Track Services", icon: "Zap", link: "/fast-track" }
                    ];
                    saveSetting('services', defaultServices);
                  }}
                  className="text-[10px] font-bold text-brand-teal uppercase tracking-widest hover:underline"
                >
                  Reset to Defaults
                </button>
              </div>
              <div className="space-y-6">
                {safeArray(settings.services).map((service: any, idx: number) => (
                  <div key={idx} className="bg-brand-paper/30 p-6 rounded-3xl space-y-4 relative group">
                    <button 
                      onClick={() => {
                        const newServices = safeArray(settings.services).filter((_: any, i: number) => i !== idx);
                        saveSetting('services', newServices);
                      }}
                      className="absolute top-4 right-4 p-2 text-brand-coral opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <TextInput 
                        label="Service Title" 
                        value={service.title || ''} 
                        onChange={(val) => {
                          const newServices = [...safeArray(settings.services)];
                          newServices[idx].title = val;
                          saveSetting('services', newServices);
                        }} 
                      />
                      <TextInput 
                        label="Link URL" 
                        value={service.link || ''} 
                        onChange={(val) => {
                          const newServices = [...safeArray(settings.services)];
                          newServices[idx].link = val;
                          saveSetting('services', newServices);
                        }} 
                      />
                      <div>
                        <label className="block text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-2">Icon</label>
                        <select
                          value={service.icon || 'Hotel'}
                          onChange={(e) => {
                            const newServices = [...safeArray(settings.services)];
                            newServices[idx].icon = e.target.value;
                            saveSetting('services', newServices);
                          }}
                          className="w-full bg-white border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-teal transition-colors"
                        >
                          <option value="Hotel">Hotel</option>
                          <option value="Plane">Plane</option>
                          <option value="Ship">Ship</option>
                          <option value="UserCheck">User Check</option>
                          <option value="Calendar">Calendar</option>
                          <option value="Smile">Smile</option>
                          <option value="Zap">Zap</option>
                          <option value="Star">Star</option>
                          <option value="Users">Users</option>
                          <option value="Compass">Compass</option>
                          <option value="Map">Map</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => saveSetting('services', [...safeArray(settings.services), { title: 'New Service', icon: 'Hotel', link: '#' }])}
                  className="w-full py-6 border-2 border-dashed border-brand-navy/10 rounded-3xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Service
                </button>
              </div>
            </div>
          )}



          {activeTab === 'ceo' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">CEO's Message</h3>
                <div className="space-y-6">
                  <LogoInput 
                    label="CEO Photo" 
                    value={settings.ceo_message?.photo_url || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'ceo', 'site-assets', setUploadProgress, showNotification);
                        saveSetting('ceo_message', (prev: any) => ({ ...prev, photo_url: url }));
                      } catch (err) {
                        console.error('Upload error:', err);
                      }
                    }}
                    onChange={(val: string) => saveSetting('ceo_message', (prev: any) => ({ ...prev, photo_url: val }))} 
                  />
                  <TextInput 
                    label="CEO Name" 
                    value={settings.ceo_message?.name || ''} 
                    onChange={(val) => saveSetting('ceo_message', (prev: any) => ({ ...prev, name: val }))} 
                  />
                  <TextInput 
                    label="CEO Title" 
                    value={settings.ceo_message?.title || ''} 
                    onChange={(val) => saveSetting('ceo_message', (prev: any) => ({ ...prev, title: val }))} 
                  />
                  <TextInput 
                    label="Quote" 
                    value={settings.ceo_message?.quote || ''} 
                    onChange={(val) => saveSetting('ceo_message', (prev: any) => ({ ...prev, quote: val }))} 
                  />
                  <TextAreaInput 
                    label="Message" 
                    value={settings.ceo_message?.message || ''} 
                    onChange={(val) => saveSetting('ceo_message', (prev: any) => ({ ...prev, message: val }))} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'story' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Our Story</h3>
                <div className="space-y-6">
                  <LogoInput 
                    label="Story Photo" 
                    value={settings.our_story?.image_url || ''} 
                    onUpload={async (file: File) => {
                      try {
                        const url = await uploadFile(file, 'story', 'site-assets', setUploadProgress, showNotification);
                        saveSetting('our_story', (prev: any) => ({ ...prev, image_url: url }));
                      } catch (err) {
                        console.error('Upload error:', err);
                      }
                    }}
                    onChange={(val: string) => saveSetting('our_story', (prev: any) => ({ ...prev, image_url: val }))} 
                  />
                  <TextInput 
                    label="Section Title" 
                    value={settings.our_story?.title || ''} 
                    onChange={(val) => saveSetting('our_story', (prev: any) => ({ ...prev, title: val }))} 
                  />
                  <TextAreaInput 
                    label="Story Content" 
                    value={settings.our_story?.content || ''} 
                    onChange={(val) => saveSetting('our_story', (prev: any) => ({ ...prev, content: val }))} 
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'awards' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Prestigious Awards</h3>
                <div className="space-y-6">
                  <TextInput 
                    label="Section Title" 
                    value={settings.awards?.title || ''} 
                    onChange={(val) => saveSetting('awards', (prev: any) => ({ ...prev, title: val }))} 
                  />
                  <TextAreaInput 
                    label="Summary" 
                    value={settings.awards?.summary || ''} 
                    onChange={(val) => saveSetting('awards', (prev: any) => ({ ...prev, summary: val }))} 
                  />
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Award Badges & Logos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {safeArray(settings.awards?.items).map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={item.url} alt="Award" className="w-full aspect-square object-contain bg-brand-paper rounded-2xl p-4" />
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const url = await uploadFile(file, 'awards', 'site-assets', setUploadProgress, showNotification);
                                    saveSetting('awards', (prev: any) => {
                                      const newItems = [...safeArray(prev?.items)];
                                      newItems[idx] = { ...newItems[idx], url };
                                      return { ...prev, items: newItems };
                                    });
                                  } catch (err) {
                                    console.error('Upload error:', err);
                                  }
                                }
                              };
                              input.click();
                            }}
                            className="absolute top-2 left-2 p-2 bg-brand-teal text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              saveSetting('awards', (prev: any) => {
                                const newItems = safeArray(prev?.items).filter((_: any, i: number) => i !== idx);
                                return { ...prev, items: newItems };
                              });
                            }}
                            className="absolute top-2 right-2 p-2 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await uploadFile(file, 'awards', 'site-assets', setUploadProgress, showNotification);
                                saveSetting('awards', (prev: any) => ({
                                  ...prev,
                                  items: [...safeArray(prev?.items), { url }]
                                }));
                              } catch (err) {
                                console.error('Upload error:', err);
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-2xl flex flex-col items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={24} />
                        <span className="text-[8px] font-bold uppercase tracking-widest mt-2">Add Award</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ctas' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Call to Action Sections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-brand-paper/30 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Become a Partner</h4>
                    <TextInput 
                      label="Title" 
                      value={settings.ctas?.partner_title || ''} 
                      onChange={(val) => saveSetting('ctas', (prev: any) => ({ ...prev, partner_title: val }))} 
                    />
                    <TextInput 
                      label="Button Text" 
                      value={settings.ctas?.partner_btn || ''} 
                      onChange={(val) => saveSetting('ctas', (prev: any) => ({ ...prev, partner_btn: val }))} 
                    />
                  </div>
                  <div className="p-6 bg-brand-paper/30 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Travel Guide</h4>
                    <TextInput 
                      label="Title" 
                      value={settings.ctas?.guide_title || ''} 
                      onChange={(val) => saveSetting('ctas', (prev: any) => ({ ...prev, guide_title: val }))} 
                    />
                    <TextInput 
                      label="Button Text" 
                      value={settings.ctas?.guide_btn || ''} 
                      onChange={(val) => saveSetting('ctas', (prev: any) => ({ ...prev, guide_btn: val }))} 
                    />
                  </div>
                  <div className="p-6 bg-brand-paper/30 rounded-3xl space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Featured Retreats</h4>
                    <TextInput 
                      label="Title" 
                      value={settings.ctas?.retreats_title || ''} 
                      onChange={(val) => saveSetting('ctas', (prev: any) => ({ ...prev, retreats_title: val }))} 
                    />
                    <TextInput 
                      label="Button Text" 
                      value={settings.ctas?.retreats_btn || ''} 
                      onChange={(val) => saveSetting('ctas', (prev: any) => ({ ...prev, retreats_btn: val }))} 
                    />
                    <div className="pt-4">
                      <LogoInput 
                        label="CTA Background Image"
                        value={settings.ctas?.bg_image_url || ''}
                        onUpload={async (file: File) => {
                          try {
                            const url = await uploadFile(file, 'ctas', 'site-assets', setUploadProgress, showNotification);
                            saveSetting('ctas', (prev: any) => ({ ...prev, bg_image_url: url }));
                          } catch (err) {
                            console.error('Upload error:', err);
                          }
                        }}
                        onChange={(val: string) => saveSetting('ctas', (prev: any) => ({ ...prev, bg_image_url: val }))}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'resorts_management' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Resorts Photo Management</h3>
                <div className="space-y-6">
                  {resorts.map((resort: any) => (
                    <div key={resort.id} className="p-6 bg-brand-paper/30 rounded-2xl space-y-4">
                      <h4 className="text-sm font-bold text-brand-navy">{resort.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {safeArray(resort.resort_media).map((media: any) => (
                          <div key={media.id} className="relative group">
                            <img src={media.storage_path} alt={media.alt_text || "Resort"} className="w-full aspect-square object-cover rounded-xl" />
                            <button 
                              onClick={async () => {
                                const { error } = await supabase
                                  .from('resort_media')
                                  .delete()
                                  .eq('id', media.id);
                                if (!error) fetchResorts();
                              }}
                              className="absolute top-2 right-2 p-1 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.multiple = true;
                            input.onchange = async (e: any) => {
                              const files = e.target.files;
                              if (files) {
                                const newMedia = [];
                                for (let i = 0; i < files.length; i++) {
                                  try {
                                    const url = await uploadFile(files[i], 'resorts', 'site-assets', setUploadProgress, showNotification);
                                    if (url) {
                                      newMedia.push({ 
                                        resort_id: resort.id, 
                                        storage_path: url, 
                                        category: 'gallery',
                                        status: 'active'
                                      });
                                    }
                                  } catch (err: any) {
                                    showNotification('Upload failed: ' + err.message);
                                    // Continue with other files or stop?
                                  }
                                }
                                
                                if (newMedia.length > 0) {
                                  const { error } = await supabase
                                    .from('resort_media')
                                    .insert(newMedia);
                                  
                                  if (!error) {
                                    fetchResorts();
                                    showNotification(`Successfully added ${newMedia.length} photos`);
                                  } else {
                                    showNotification('Failed to save media records: ' + error.message);
                                  }
                                }
                              }
                            };
                            input.click();
                          }}
                          className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-xl flex flex-col items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                        >
                          <Plus size={24} />
                          <span className="text-[8px] font-bold uppercase tracking-widest mt-2">Add Photos</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'newsletter_markets' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Primary Markets</h3>
                <div className="bg-brand-paper/30 p-6 rounded-3xl space-y-4">
                  <p className="text-xs text-brand-navy/60 mb-4">Manage the primary markets available in the newsletter signup form.</p>
                  {safeArray(settings.primary_markets).map((market: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-4">
                      <input 
                        type="text" 
                        value={market} 
                        className="flex-1 bg-white border border-brand-navy/10 rounded-xl px-4 py-3 text-sm outline-none"
                        onChange={(e) => {
                          const newMarkets = [...safeArray(settings.primary_markets)];
                          newMarkets[idx] = e.target.value;
                          saveSetting('primary_markets', newMarkets);
                        }}
                      />
                      <button 
                        onClick={() => {
                          const newMarkets = safeArray(settings.primary_markets).filter((_: any, i: number) => i !== idx);
                          saveSetting('primary_markets', newMarkets);
                        }}
                        className="p-2 text-brand-coral hover:bg-brand-coral/10 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => saveSetting('primary_markets', [...safeArray(settings.primary_markets), 'New Market'])}
                    className="w-full py-4 border-2 border-dashed border-brand-navy/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 hover:border-brand-teal hover:text-brand-teal transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Market
                  </button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">WhatsApp Integration</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-6 bg-brand-paper/30 rounded-3xl">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-brand-navy">Enable WhatsApp Button</h4>
                      <p className="text-xs text-brand-navy/40">Show a WhatsApp floating button on the website</p>
                    </div>
                    <button 
                      onClick={() => saveSetting('whatsapp', { ...settings.whatsapp, enabled: !settings.whatsapp?.enabled })}
                      className={`w-12 h-6 rounded-full transition-all relative ${settings.whatsapp?.enabled ? 'bg-brand-teal' : 'bg-brand-navy/20'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.whatsapp?.enabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <TextInput 
                    label="WhatsApp Number (with country code, e.g., 9601234567)" 
                    value={settings.whatsapp?.number || ''} 
                    onChange={(val) => saveSetting('whatsapp', { ...settings.whatsapp, number: val })} 
                    icon={<Phone size={14} />}
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Memberships & Footer Awards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Membership Logos</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {safeArray(settings.footer?.memberships).map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={item.url} alt="Membership" className="w-full aspect-square object-contain bg-brand-paper rounded-xl p-2" />
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const url = await uploadFile(file, 'footer', 'site-assets', setUploadProgress, showNotification);
                                    const newItems = [...safeArray(settings.footer?.memberships)];
                                    newItems[idx] = { ...newItems[idx], url };
                                    saveSetting('footer', { ...settings.footer, memberships: newItems });
                                  } catch (err) {
                                    console.error('Upload error:', err);
                                  }
                                }
                              };
                              input.click();
                            }}
                            className="absolute -top-2 -left-2 p-1.5 bg-brand-teal text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              const newItems = safeArray(settings.footer?.memberships).filter((_: any, i: number) => i !== idx);
                              saveSetting('footer', { ...settings.footer, memberships: newItems });
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await uploadFile(file, 'footer', 'site-assets', setUploadProgress, showNotification);
                                const newItems = [...safeArray(settings.footer?.memberships || []), { url }];
                                saveSetting('footer', { ...settings.footer, memberships: newItems });
                              } catch (err) {
                                console.error('Upload error:', err);
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">Award Badges</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {safeArray(settings.footer?.awards).map((item: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img src={item.url} alt="Award" className="w-full aspect-square object-contain bg-brand-paper rounded-xl p-2" />
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const url = await uploadFile(file, 'footer', 'site-assets', setUploadProgress, showNotification);
                                    const newItems = [...safeArray(settings.footer?.awards)];
                                    newItems[idx] = { ...newItems[idx], url };
                                    saveSetting('footer', { ...settings.footer, awards: newItems });
                                  } catch (err) {
                                    console.error('Upload error:', err);
                                  }
                                }
                              };
                              input.click();
                            }}
                            className="absolute -top-2 -left-2 p-1.5 bg-brand-teal text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => {
                              const newItems = safeArray(settings.footer?.awards).filter((_: any, i: number) => i !== idx);
                              saveSetting('footer', { ...settings.footer, awards: newItems });
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-brand-coral text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await uploadFile(file, 'footer', 'site-assets', setUploadProgress, showNotification);
                                const newItems = [...safeArray(settings.footer?.awards || []), { url }];
                                saveSetting('footer', { ...settings.footer, awards: newItems });
                              } catch (err) {
                                console.error('Upload error:', err);
                              }
                            }
                          };
                          input.click();
                        }}
                        className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-xl flex items-center justify-center text-brand-navy/20 hover:border-brand-teal hover:text-brand-teal transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TextInput 
                    label="Email" 
                    value={settings.footer?.contact?.email || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...(settings.footer?.contact || {}), email: val } })} 
                    icon={<Mail size={14} />}
                  />
                  <TextInput 
                    label="Phone" 
                    value={settings.footer?.contact?.phone || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...(settings.footer?.contact || {}), phone: val } })} 
                    icon={<Phone size={14} />}
                  />
                  <TextInput 
                    label="Address" 
                    value={settings.footer?.contact?.address || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, contact: { ...(settings.footer?.contact || {}), address: val } })} 
                    icon={<MapPin size={14} />}
                  />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <TextInput 
                    label="Instagram" 
                    value={settings.footer?.social?.instagram || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), instagram: val } })} 
                    icon={<Instagram size={14} />}
                  />
                  <TextInput 
                    label="LinkedIn" 
                    value={settings.footer?.social?.linkedin || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), linkedin: val } })} 
                    icon={<Linkedin size={14} />}
                  />
                  <TextInput 
                    label="Facebook" 
                    value={settings.footer?.social?.facebook || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), facebook: val } })} 
                    icon={<Facebook size={14} />}
                  />
                  <TextInput 
                    label="X" 
                    value={settings.footer?.social?.twitter || ''} 
                    onChange={(val) => saveSetting('footer', { ...settings.footer, social: { ...(settings.footer?.social || {}), twitter: val } })} 
                    icon={<X size={14} />}
                  />
                </div>
              </section>
              <section>
                <h3 className="text-xl font-serif text-brand-navy mb-6">Footer Link Columns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30 mb-4">Important Links</h4>
                    <div className="space-y-4">
                      {safeArray(settings.footer?.important_links).map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <TextInput value={link.label} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.important_links)];
                            newLinks[idx].label = val;
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} />
                          <TextInput value={link.path} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.important_links)];
                            newLinks[idx].path = val;
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} />
                          <button onClick={() => {
                            const newLinks = safeArray(settings.footer?.important_links).filter((_: any, i: number) => i !== idx);
                            saveSetting('footer', { ...settings.footer, important_links: newLinks });
                          }} className="p-2 text-brand-coral"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => saveSetting('footer', { ...settings.footer, important_links: [...safeArray(settings.footer?.important_links), { label: 'New Link', path: '/' }] })} className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">+ Add Link</button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/30 mb-4">Legal & Media</h4>
                    <div className="space-y-4">
                      {safeArray(settings.footer?.legal_links).map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <TextInput value={link.label} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.legal_links)];
                            newLinks[idx].label = val;
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} />
                          <TextInput value={link.path} onChange={(val) => {
                            const newLinks = [...safeArray(settings.footer?.legal_links)];
                            newLinks[idx].path = val;
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} />
                          <button onClick={() => {
                            const newLinks = safeArray(settings.footer?.legal_links).filter((_: any, i: number) => i !== idx);
                            saveSetting('footer', { ...settings.footer, legal_links: newLinks });
                          }} className="p-2 text-brand-coral"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button onClick={() => saveSetting('footer', { ...settings.footer, legal_links: [...safeArray(settings.footer?.legal_links), { label: 'New Link', path: '/' }] })} className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">+ Add Link</button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif text-brand-navy">Database & System Schema</h3>
                  <p className="text-brand-navy/60 font-sans text-sm mt-1">Ensure your database is up to date with the latest features.</p>
                </div>
                <button 
                  onClick={async () => {
                    showNotification('Please copy and run the SQL below in your Supabase SQL Editor to ensure all features work correctly.');
                  }}
                  className="px-6 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal/90 transition-all"
                >
                  Check Schema
                </button>
              </div>

              <div className="bg-brand-paper/30 p-6 rounded-3xl border border-brand-navy/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Required SQL Setup</h4>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('Schema is managed in supabase_schema.sql');
                      showNotification('SQL copied to clipboard');
                    }}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:text-brand-teal/80 transition-all"
                  >
                    <Copy size={14} /> Copy SQL
                  </button>
                </div>
                <pre className="bg-brand-navy text-white/90 p-6 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-[400px] leading-relaxed">
                  Schema is managed in supabase_schema.sql
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TextInput({ label, value, onChange, icon, type = 'text' }: any) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== (value || '')) {
        onChange(localValue);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  return (
    <div className="flex-1">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30">{icon}</div>}
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => {
            if (localValue !== (value || '')) {
              onChange(localValue);
            }
          }}
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
}

function TextAreaInput({ label, value, onChange }: any) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== (value || '')) {
        onChange(localValue);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localValue, onChange, value]);

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans">{label}</label>
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== (value || '')) {
            onChange(localValue);
          }
        }}
        rows={4}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className="w-full bg-brand-paper/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy resize-none"
      />
    </div>
  );
}

function LogoInput({ label, value, onUpload, onChange }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-brand-paper/30 p-4 rounded-2xl">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-4 font-sans">{label}</label>
      <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center h-24 overflow-hidden border border-brand-navy/5 relative group">
        {value ? (
          <img src={value} alt={label} className="max-h-full object-contain" referrerPolicy="no-referrer" />
        ) : (
          <div className="text-brand-navy/10"><Image size={32} /></div>
        )}
        <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white rounded-full text-brand-navy hover:bg-brand-teal hover:text-white transition-all"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <input
        type="text"
        placeholder="Logo URL"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className="w-full bg-white border-none rounded-lg px-3 py-2 text-[10px] focus:ring-1 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy"
      />
    </div>
  );
}

function BannerInput({ label, value, type, onUpload, onChange }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="bg-brand-paper/30 p-6 rounded-3xl">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-4 font-sans">{label}</label>
      <div className="bg-white rounded-2xl mb-4 flex items-center justify-center aspect-video overflow-hidden border border-brand-navy/5 relative group">
        {value ? (
          type === 'video' ? (
            <video src={value} className="w-full h-full object-cover" controls />
          ) : (
            <img src={value} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          )
        ) : (
          <div className="text-brand-navy/10"><Image size={48} /></div>
        )}
        <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy hover:bg-brand-teal hover:text-white transition-all"
          >
            <Upload size={14} />
            Upload File
          </button>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
      <input
        type="text"
        placeholder="Media URL"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-brand-navy"
      />
    </div>
  );
}
