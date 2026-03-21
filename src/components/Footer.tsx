import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('site_settings').select('*');
      if (data) {
        const settingsMap = data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        setSettings(settingsMap);
      }
    };
    fetchSettings();
  }, []);

  const footer = settings.footer || {
    contact: {
      address: "Male', Republic of Maldives",
      phone: "+960 123 4567",
      email: "info@excitingmaldives.com"
    },
    social: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
      linkedin: "https://linkedin.com"
    },
    important_links: [
      { label: 'Resorts', path: '/resorts' },
      { label: 'Maldives Map', path: '/map' },
      { label: 'Tourist Info', path: '/tourist-info' },
      { label: 'Agent Portal', path: '/login' }
    ],
    legal_links: [
      { label: 'Privacy Policy', path: '/legal' },
      { label: 'Terms of Service', path: '/legal' },
      { label: 'Media Kit', path: '/legal' },
      { label: 'Meet the Team', path: '/legal' }
    ]
  };

  const logos = settings.logos || {};

  return (
    <footer className="bg-brand-navy text-white pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand & Contact */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3">
              {logos.white ? (
                <img src={logos.white} alt="Exciting Maldives" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-serif font-bold tracking-[0.1em] text-white uppercase">
                    Exciting
                  </span>
                  <span className="text-[10px] font-sans font-bold tracking-[0.5em] text-brand-teal uppercase ml-0.5">
                    Maldives
                  </span>
                </div>
              )}
            </Link>
            <div className="space-y-4 text-white/60 text-sm font-sans">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-brand-teal" />
                <span>{footer.contact.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-brand-teal" />
                <span>{footer.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-brand-teal" />
                <span>{footer.contact.email}</span>
              </div>
            </div>
          </div>

          {/* Important Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Important Links</h4>
            <ul className="space-y-4 text-sm font-sans text-white/60">
              {(footer.important_links || []).map((link: any, idx: number) => (
                <li key={idx}><Link to={link.path} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Legal & Media */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Legal & Media</h4>
            <ul className="space-y-4 text-sm font-sans text-white/60">
              {(footer.legal_links || []).map((link: any, idx: number) => (
                <li key={idx}><Link to={link.path} className="hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Follow Us</h4>
            <div className="flex gap-4">
              {footer.social.facebook && (
                <a href={footer.social.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal transition-all">
                  <Facebook size={18} />
                </a>
              )}
              {footer.social.instagram && (
                <a href={footer.social.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal transition-all">
                  <Instagram size={18} />
                </a>
              )}
              {footer.social.twitter && (
                <a href={footer.social.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal transition-all">
                  <Twitter size={18} />
                </a>
              )}
              {footer.social.linkedin && (
                <a href={footer.social.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-teal hover:border-brand-teal transition-all">
                  <Linkedin size={18} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-white/30">
          <p>© {new Date().getFullYear()} Exciting Maldives. All Rights Reserved.</p>
          <div className="flex gap-8">
            <Link to="/legal" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
