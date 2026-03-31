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
    <footer className="bg-brand-navy text-white pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand & Contact */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3">
              {logos.white ? (
                <img src={logos.white} alt="Exciting Maldives" className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : null}
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
                <li key={idx}>
                  {link.path.startsWith('http') ? (
                    <a href={link.path} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{link.label}</a>
                  ) : (
                    <Link to={link.path} className="hover:text-white transition-colors">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Media */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Legal & Media</h4>
            <ul className="space-y-4 text-sm font-sans text-white/60">
              {(footer.legal_links || []).map((link: any, idx: number) => (
                <li key={idx}>
                  {link.path.startsWith('http') ? (
                    <a href={link.path} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{link.label}</a>
                  ) : (
                    <Link to={link.path} className="hover:text-white transition-colors">{link.label}</Link>
                  )}
                </li>
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

        {/* Memberships & Awards */}
        {(footer.memberships.length > 0 || footer.awards.length > 0) && (
          <div className="mb-20 pt-12 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {footer.memberships.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Our Memberships</h4>
                  <div className="flex flex-wrap gap-8 items-center opacity-40 hover:opacity-100 transition-opacity duration-500">
                    {footer.memberships.map((m: any, i: number) => (
                      <img key={i} src={m.url} alt="Membership" className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                </div>
              )}
              {footer.awards.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-teal mb-8">Our Recognition</h4>
                  <div className="flex flex-wrap gap-8 items-center opacity-40 hover:opacity-100 transition-opacity duration-500">
                    {footer.awards.map((a: any, i: number) => (
                      <img key={i} src={a.url} alt="Award" className="h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
