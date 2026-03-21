import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import { Check, Send, User, Mail, Phone, Building2, Globe, MessageSquare } from 'lucide-react';

export default function BecomePartner() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    country_code: '+960',
    phone: '',
    company_name: '',
    website: '',
    message: ''
  });

  const countryCodes = [
    { code: '+960', name: 'Maldives' },
    { code: '+1', name: 'USA/Canada' },
    { code: '+44', name: 'UK' },
    { code: '+971', name: 'UAE' },
    { code: '+91', name: 'India' },
    { code: '+65', name: 'Singapore' },
    { code: '+61', name: 'Australia' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+39', name: 'Italy' },
    { code: '+81', name: 'Japan' },
    { code: '+86', name: 'China' },
    { code: '+7', name: 'Russia' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simple website validation: must have at least one dot and some characters after it
    const websiteRegex = /^([\da-z\.-]+)\.([a-z\.]{2,24})([\/\w \.-]*)*\/?$/i;
    const cleanWebsite = formData.website.replace(/^https?:\/\//i, '');
    
    if (formData.website && !websiteRegex.test(cleanWebsite)) {
      alert('Please enter a valid website URL (e.g. example.com)');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('agents')
      .insert([
        {
          ...formData,
          phone: `${formData.country_code} ${formData.phone}`,
          status: 'pending'
        }
      ]);

    if (!error) {
      setSubmitted(true);
    } else {
      alert('Error submitting request. Please try again.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl shadow-brand-navy/5 text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="text-green-500" size={40} />
          </div>
          <h2 className="text-3xl font-serif text-brand-navy mb-4">Request Received</h2>
          <p className="text-brand-navy/60 font-sans leading-relaxed mb-8">
            Thank you for your interest in partnering with us. Our team will review your application and get back to you shortly.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-brand-navy text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shadow-brand-navy/10"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-4 block"
          >
            Partnership
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-serif text-brand-navy mb-6"
          >
            Become a Partner
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-brand-navy/60 max-w-2xl mx-auto font-sans text-lg leading-relaxed"
          >
            Join our exclusive network of travel professionals and gain access to the most curated luxury experiences in the Maldives.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-brand-navy/5 border border-brand-navy/5"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-4">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                  <input 
                    required
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-brand-paper/50 border-none rounded-2xl px-14 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-brand-paper/50 border-none rounded-2xl px-14 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-4">Phone Number</label>
                <div className="flex gap-2">
                  <div className="relative w-32 shrink-0">
                    <select
                      required
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                      className="w-full bg-brand-paper/50 border-none rounded-2xl px-4 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans text-sm appearance-none"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                    <input 
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      className="w-full bg-brand-paper/50 border-none rounded-2xl px-14 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans"
                      placeholder="7771234"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-4">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                  <input 
                    required
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    className="w-full bg-brand-paper/50 border-none rounded-2xl px-14 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans"
                    placeholder="Travel Agency Co."
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-4">Website (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                  <input 
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full bg-brand-paper/50 border-none rounded-2xl px-14 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans"
                    placeholder="www.example.com"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 ml-4">Message / Additional Info</label>
                <div className="relative">
                  <MessageSquare className="absolute left-5 top-10 text-brand-navy/20" size={18} />
                  <textarea 
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-brand-paper/50 border-none rounded-2xl px-14 py-4 text-brand-navy focus:ring-2 focus:ring-brand-teal/20 transition-all font-sans resize-none"
                    placeholder="Tell us a bit about your business..."
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-brand-navy text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-teal transition-all shadow-xl shadow-brand-navy/10 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit Application
                  <Send size={14} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
