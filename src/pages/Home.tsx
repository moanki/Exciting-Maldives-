import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { getSiteSettings } from '../lib/settings';
import { ArrowRight, MapPin, Plane, Ship, CheckCircle2, Star, ShieldCheck, Users, Clock, Search, ChevronRight, ChevronLeft, Zap, Check, MessageSquare, Hotel, Calendar, Smile } from 'lucide-react';

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

function Newsletter() {
  return (
    <section className="py-[120px] bg-brand-paper text-brand-navy">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
        <h2 className="text-3xl md:text-5xl font-serif">Stay Inspired</h2>
        <p className="text-brand-navy/60 font-sans text-sm uppercase tracking-widest">Subscribe to our newsletter for exclusive luxury travel insights and curated resort recommendations.</p>
        <div className="flex gap-4">
          <input type="email" placeholder="Enter your email" className="flex-1 bg-white border border-brand-navy/10 rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/50 outline-none" />
          <button className="bg-brand-navy text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all">Subscribe</button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const ceoRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const { scrollYProgress: ceoScrollY } = useScroll({ target: ceoRef });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const ceoY = useTransform(ceoScrollY, [0, 1], ['-10%', '10%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  
  const [featuredResorts, setFeaturedResorts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [activeFilter, setActiveFilter] = useState('Ultra Luxury');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      const settingsData = await getSiteSettings(isPreview);
      setSettings(settingsData);
      
      const { data, error } = await supabase
        .from('resorts')
        .select('*')
        .eq('is_featured', true)
        .limit(6);
      
      if (error || !data || data.length === 0) {
        const fallback = await supabase.from('resorts').select('*').limit(6);
        if (fallback.data) setFeaturedResorts(fallback.data);
      } else {
        setFeaturedResorts(data);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const filters = ['Ultra Luxury', 'Adults Only', 'Family Friendly', 'Best House Reef', 'All Inclusive', 'Private Island Buyout'];

  const experiences = [
    { title: 'Luxury Resorts', image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80' },
    { title: 'Private Island Buyouts', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80' },
    { title: 'Seaplane Adventures', image: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?auto=format&fit=crop&q=80' },
    { title: 'Underwater Dining', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80' },
    { title: 'Cultural Journeys', image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&q=80' },
    { title: 'Sunset Cruises', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&q=80' },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-brand-paper text-brand-navy selection:bg-brand-teal/20">
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#128C7E] transition-all">
        <MessageSquare size={28} />
      </button>

      {/* 1. HERO EXPERIENCE */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <motion.div style={{ y, scale }} className="absolute inset-0 z-0 bg-brand-navy">
          {settings.hero?.banner_url ? (
            <img 
              src={settings.hero?.banner_url} 
              alt="Luxury Maldives" 
              className="w-full h-full object-cover brightness-75"
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="w-full h-full bg-brand-navy animate-pulse" />
          )}
        </motion.div>
        
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-navy">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="max-w-3xl">
            <h1 className="text-white font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] mb-10">
              {settings.hero?.title || 'Maldives, Curated for the World’s Leading Travel Designers'}
            </h1>
            <div className="flex flex-wrap gap-6">
              <Link to="/resorts">
                <button className="bg-brand-teal text-white px-10 py-5 text-xs uppercase tracking-[0.2em] font-sans rounded-full hover:bg-white hover:text-brand-navy transition-all">Explore Retreats</button>
              </Link>
              <Link to="/become-partner">
                <button className="bg-transparent border border-white/30 text-white px-10 py-5 text-xs uppercase tracking-[0.2em] font-sans rounded-full hover:bg-white hover:text-brand-navy transition-all">Become a Partner</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED RETREATS */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <h2 className="font-serif text-5xl md:text-6xl text-brand-navy">Featured Retreats</h2>
          </div>
        </div>
        
        {/* Automatic Rotating Carousel */}
        <div className="relative overflow-hidden">
          <motion.div 
            className="flex gap-6"
            animate={{ x: ['0%', '-100%'] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          >
            {[...featuredResorts, ...featuredResorts].map((resort, i) => (
              <div key={i} className="group cursor-pointer flex-shrink-0 w-[280px]">
                <div className="overflow-hidden rounded-2xl aspect-[3/4] mb-6 relative">
                  <img 
                    src={resort.images?.[0] || `https://picsum.photos/seed/${resort.id || i}/600/800`} 
                    alt={resort.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-serif text-xl">{resort.name}</h3>
                  </div>
                </div>
                <div className="px-2">
                  <Link to={`/resorts/${resort.id}`} className="text-brand-navy font-sans text-[10px] uppercase tracking-widest border-b border-brand-navy pb-1">Explore</Link>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. CEO MESSAGE */}
      <section ref={ceoRef} className="py-[120px] bg-brand-paper">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <span className="text-brand-teal font-sans uppercase tracking-[0.2em] text-[10px] block">Leadership</span>
              <h2 className="font-serif text-5xl md:text-6xl text-brand-navy">A Message From Our CEO</h2>
              <p className="text-lg text-gray-600 leading-relaxed font-light italic">
                “{settings.ceo_message?.message || 'At Exciting Maldives, our mission is to connect travel professionals with the most extraordinary island experiences through a lens of absolute luxury and local expertise.'}”
              </p>
              <div>
                <p className="font-bold text-brand-navy">{settings.ceo_message?.name || 'Elias Jancel'}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal mt-1">Founder & CEO</p>
              </div>
            </div>
            <motion.div style={{ y: ceoY }} className="rounded-[2rem] overflow-hidden luxury-shadow aspect-square">
              <img 
                src={settings.ceo_message?.photo_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80"} 
                alt="CEO" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. DESTINATION STORY */}
      <section className="py-[120px] px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 relative rounded-[2rem] overflow-hidden luxury-shadow aspect-[4/5]"
          >
            <img 
              src={settings.our_story?.photo_url || "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&q=80"} 
              alt="Maldives Seaplane" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3 space-y-8"
          >
            <h2 className="text-5xl md:text-6xl font-serif leading-[1.1] text-brand-navy" dangerouslySetInnerHTML={{ __html: settings.our_story?.title || 'Our Story — Crafting Maldives journeys for travel professionals across the globe' }} />
            <div className="text-lg text-gray-600 leading-relaxed font-light space-y-6">
              <p>
                {settings.our_story?.content || 'Founded on the principles of discretion and excellence, we have spent two decades building intimate relationships with the Maldives\' most secluded resorts.'}
              </p>
              <p>
                Our role as a specialized B2B DMC is to be the extension of your team on the ground, ensuring every detail is executed with precision.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. GLOBAL MARKETS */}
      {safeArray(settings.global_markets).length > 0 && (
        <section className="py-[120px] bg-brand-navy text-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-20">
              <h2 className="font-serif text-5xl md:text-6xl text-white">Global Markets</h2>
              <p className="text-white/60 font-sans text-sm uppercase tracking-widest mt-4">Our specialized focus across key international regions</p>
            </div>
            <div className="flex overflow-x-auto gap-8 pb-8 scrollbar-hide">
              {safeArray(settings.global_markets).map((market: any, i: number) => (
                <div key={i} className="p-10 rounded-3xl border border-white/10 bg-white/5 min-w-[300px] md:min-w-[400px] hover:bg-white/10 transition-all">
                  <h3 className="font-serif text-2xl text-white mb-4">{market.name}</h3>
                  <p className="text-white/80 font-light leading-relaxed text-sm">{market.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. DMC SERVICES */}
      {safeArray(settings.services).length > 0 && (
        <section className="py-[120px] bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-20">
              <h2 className="font-serif text-5xl md:text-6xl text-brand-navy">DMC Services</h2>
              <p className="text-brand-navy/60 font-sans text-sm uppercase tracking-widest mt-4">Comprehensive on-ground support for our partners</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {safeArray(settings.services).map((service: any, i: number) => {
                const Icon = service.icon === 'Hotel' ? Hotel :
                             service.icon === 'Plane' ? Plane :
                             service.icon === 'UserCheck' ? Users :
                             service.icon === 'Calendar' ? Calendar :
                             service.icon === 'Smile' ? Star : Zap;
                return (
                  <div key={i} className="group flex flex-col items-center text-center space-y-4 p-8 rounded-3xl hover:bg-brand-paper transition-all">
                    <div className="w-16 h-16 bg-brand-paper rounded-2xl flex items-center justify-center text-brand-teal shadow-sm group-hover:bg-brand-teal group-hover:text-white transition-all">
                      <Icon size={32} />
                    </div>
                    <h3 className="font-serif text-lg text-brand-navy">{service.title}</h3>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 7. WHY TRAVEL DESIGNERS CHOOSE US */}
      <section className="py-[120px] bg-brand-paper">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl md:text-6xl text-brand-navy">Why Travel Designers Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safeArray(settings.why_us).map((card: any, i: number) => {
              const Icon = card.icon === 'MapPin' ? MapPin : 
                           card.icon === 'Clock' ? Clock : 
                           card.icon === 'Users' ? Users : 
                           card.icon === 'ShieldCheck' ? ShieldCheck : MapPin;
              return (
                <div key={i} className="group bg-white p-10 rounded-3xl space-y-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-serif text-2xl text-brand-navy">{card.title}</h3>
                  <p className="text-gray-600 font-light leading-relaxed text-sm">{card.description || card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. PRESTIGIOUS AWARDS */}
      {safeArray(settings.awards?.items).length > 0 && (
        <section className="py-[120px] bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 mb-20 text-center">
            <h2 className="font-serif text-5xl md:text-6xl text-brand-navy">{settings.awards?.title || 'Prestigious Awards'}</h2>
            <p className="text-brand-navy/60 font-sans text-sm uppercase tracking-widest mt-4">{settings.awards?.summary}</p>
          </div>
          <div className="relative">
            <motion.div 
              className="flex gap-16 items-center"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            >
              {[...settings.awards.items, ...settings.awards.items].map((award: any, i: number) => (
                <div key={i} className="flex-shrink-0 w-48 h-24 flex items-center justify-center">
                  <img src={award.url} alt="Award" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 9. PARTNER CTA BANNER */}
      <section className="py-[120px] bg-gradient-to-r from-brand-teal to-brand-navy text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          <h2 className="text-5xl md:text-6xl font-serif leading-tight">Join Our Global Network of Travel Professionals</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="bg-white text-brand-navy px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:bg-brand-paper transition-all">Become a Partner</button>
            <button className="bg-transparent border border-white/30 text-white px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white/10 transition-all">Agent Login</button>
          </div>
        </div>
      </section>

      {/* 10. MALDIVES TRAVEL GUIDE */}
      <section className="py-[120px] px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <h2 className="font-serif text-5xl md:text-6xl text-brand-navy">The Maldives Travel Guide</h2>
          <Link to="/guide" className="text-brand-navy font-sans text-[10px] uppercase tracking-widest border-b border-brand-navy pb-1">View All Insights</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {safeArray(settings.travel_guide).map((post: any, i: number) => (
            <div key={i} className="group cursor-pointer">
              <div className="overflow-hidden rounded-3xl aspect-[16/10] mb-6">
                <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
              </div>
              <span className="text-brand-teal font-sans uppercase tracking-[0.2em] text-[10px] mb-2 block">{post.category}</span>
              <h3 className="font-serif text-2xl text-brand-navy mb-4">{post.title}</h3>
              <Link to="/guide" className="text-brand-navy font-sans text-[10px] uppercase tracking-widest border-b border-brand-navy pb-1">Read Story</Link>
            </div>
          ))}
        </div>
      </section>

      <Newsletter />

    </div>
  );
}
