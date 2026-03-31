import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { getSiteSettings } from '../lib/settings';

export default function Footer() {
  const [settings, setSettings] = useState<any>({});
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchSettings = async () => {
      const isPreview = searchParams.get('preview') === 'true';
      const settingsData = await getSiteSettings(isPreview);
      setSettings(settingsData);
    };
    fetchSettings();
  }, [searchParams]);

  const footer = {
    contact: {
      address: settings.footer?.contact?.address || "Male', Republic of Maldives",
      phone: settings.footer?.contact?.phone || "+960 123 4567",
      email: settings.footer?.contact?.email || "info@excitingmaldives.com"
    },
    social: {
      facebook: settings.footer?.social?.facebook || "",
      instagram: settings.footer?.social?.instagram || "",
      twitter: settings.footer?.social?.twitter || "",
      linkedin: settings.footer?.social?.linkedin || ""
    },
    important_links: settings.footer?.important_links || [
      { label: 'Resorts', path: '/resorts' },
      { label: 'Maldives Map', path: '/map' },
      { label: 'Tourist Info', path: '/tourist-info' },
      { label: 'Partner Login', path: 'https://b2b.excitingmv.com/' }
    ],
    legal_links: settings.footer?.legal_links || [
      { label: 'Privacy Policy', path: '/legal' },
      { label: 'Terms of Service', path: '/legal' },
      { label: 'Media Kit', path: '/legal' },
      { label: 'Meet the Team', path: '/legal' }
    ],
    memberships: settings.footer?.memberships || [],
    awards: settings.footer?.awards || []
  };

  const logos = settings.logos || {};

  return (
    <footer className="bg-brand-navy text-white pt-32 pb-12 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand & Contact */}
          <div className="space-y-10">
            <Link to="/" className="inline-block">
              {logos.white ? (
                <img src={logos.white} alt="Exciting Maldives" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-serif tracking-tighter">Exciting Maldives</span>
              )}
            </Link>
            <div className="space-y-6 text-white/50 text-sm font-sans leading-relaxed">
              <p className="max-w-xs">
                The B2B Gateway to Luxury Travel in the Maldives. Connecting global travel professionals with exceptional experiences.
              </p>
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-4">
                  <MapPin size={18} className="text-brand-teal shrink-0 mt-0.5" />
                  <span>{footer.contact.address}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone size={18} className="text-brand-teal shrink-0" />
                  <span>{footer.contact.phone}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Mail size={18} className="text-brand-teal shrink-0" />
                  <span>{footer.contact.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-10">Quick Links</h4>
            <ul className="space-y-5 text-sm font-sans text-white/50">
              {(footer.important_links || []).map((link: any, idx: number) => (
                <li key={idx}>
                  {link.path.startsWith('http') ? (
                    <a href={link.path} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{link.label}</a>
                  ) : (
                    <Link to={link.path} className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Market Presence */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-10">Market Presence</h4>
            <ul className="space-y-5 text-sm font-sans text-white/50">
              <li>Russia & CIS</li>
              <li>Europe & UK</li>
              <li>Middle East (GCC)</li>
              <li>Asia Pacific</li>
              <li>North America</li>
            </ul>
          </div>

          {/* Social & Legal */}
          <div className="space-y-12">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-10">Follow Our Journey</h4>
              <div className="flex gap-4">
                {[
                  { icon: Facebook, url: footer.social.facebook },
                  { icon: Instagram, url: footer.social.instagram },
                  { icon: Twitter, url: footer.social.twitter },
                  { icon: Linkedin, url: footer.social.linkedin }
                ].map((social, i) => social.url && (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-brand-navy hover:border-white transition-all duration-500">
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Legal</h4>
              <ul className="space-y-4 text-xs font-sans text-white/40">
                {(footer.legal_links || []).map((link: any, idx: number) => (
                  <li key={idx}>
                    <Link to={link.path} className="hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-white/20">
          <p>© {new Date().getFullYear()} Exciting Maldives. A Premium B2B Travel Ecosystem.</p>
          <div className="flex gap-10">
            <Link to="/legal" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/legal" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
