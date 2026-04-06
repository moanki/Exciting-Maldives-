import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useAnimationFrame, wrap } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { getSiteSettings } from '../lib/settings';
import { ArrowRight, MapPin, Plane, Ship, CheckCircle2, Star, ShieldCheck, Users, Clock, Search, ChevronRight, ChevronLeft, Zap, Check, MessageSquare, Hotel, Calendar, Smile, Globe, Award, HeartHandshake, PhoneCall, UserCheck } from 'lucide-react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const StackedPhotoCarousel = ({ images, onIndexChange }: { images: string[], onIndexChange: (index: number) => void }) => {
  const [index, setIndex] = useState(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    onIndexChange(index);
  }, [index, onIndexChange]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
  };

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  return (
    <div 
      className="relative w-full h-full perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
    >
      <AnimatePresence mode="popLayout">
        {/* Behind Image */}
        <motion.div
          key={(index + 1) % images.length}
          initial={{ opacity: 0, scale: 0.8, x: 20, y: 10 }}
          animate={{ opacity: 0.5, scale: 0.9, x: 10, y: 5 }}
          exit={{ opacity: 0, scale: 0.8, x: 20, y: 10 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-lg"
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', zIndex: 0 }}
        >
          <img src={images[(index + 1) % images.length]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-brand-navy/20" />
        </motion.div>

        {/* Front Image */}
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9, x: -20, y: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20, y: 10 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', zIndex: 10 }}
        >
          <img src={images[index]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-brand-navy/5" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function Newsletter() {
  return (
    <section className="py-16 md:py-[120px] bg-brand-paper text-brand-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div className="max-w-3xl mx-auto px-6 text-center space-y-8 relative z-10">
        <h2 className="text-3xl md:text-5xl font-serif">Stay Updated With Maldives Travel Insights</h2>
        <p className="text-brand-navy/60 font-sans text-sm uppercase tracking-widest">
          Get the latest on new resorts, seasonal offers, and destination updates.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input type="email" placeholder="Enter your email" className="flex-1 bg-white border border-brand-navy/10 rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/50 outline-none" />
          <button className="bg-brand-navy text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all">Subscribe</button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const ctaRef = useRef(null);
  
  // Hero Parallax (Background moves 60-75%, Text moves slightly slower)
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroBgY = useTransform(heroScroll, [0, 1], ['0%', '30%']);
  const heroTextY = useTransform(heroScroll, [0, 1], ['0%', '15%']);

  // Story Parallax
  const { scrollYProgress: storyScroll } = useScroll({ target: storyRef, offset: ["start end", "end start"] });
  const storyImgY = useTransform(storyScroll, [0, 1], ['-15%', '15%']);

  // CTA Parallax
  const { scrollYProgress: ctaScroll } = useScroll({ target: ctaRef, offset: ["start end", "end start"] });
  const ctaBgY = useTransform(ctaScroll, [0, 1], ['-20%', '20%']);
  
  const [featuredResorts, setFeaturedResorts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeMarket, setActiveMarket] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      
      const [settingsData, resortsResult] = await Promise.all([
        getSiteSettings(isPreview),
        supabase
          .from('resorts')
          .select('*')
          .eq('is_featured', true)
          .limit(6)
      ]);

      if (resortsResult.error) {
        console.error('Error fetching featured resorts:', resortsResult.error);
      }

      setSettings(settingsData);
      console.log('Site settings loaded:', settingsData);
      
      if (resortsResult.error || !resortsResult.data || resortsResult.data.length === 0) {
        const fallback = await supabase.from('resorts').select('*').limit(6);
        if (fallback.data) setFeaturedResorts(fallback.data);
      } else {
        setFeaturedResorts(resortsResult.data);
      }
    };
    fetchData();
  }, []);

  // Static Data for B2B
  const whyUsPillars = [
    { title: 'Local Expertise', desc: 'Deep-rooted knowledge and on-ground presence in the Maldives.', icon: MapPin },
    { title: 'Exclusive Resort Partnerships', desc: 'Direct contracts and priority access to the finest island retreats.', icon: Star },
    { title: 'Seamless Operations', desc: 'Flawless execution from arrival to departure.', icon: CheckCircle2 },
    { title: '24/7 Guest Support', desc: 'Round-the-clock dedicated assistance for your VIP clients.', icon: Clock }
  ];

  const dmcServices = [
    { title: 'Luxury Resort Reservations', icon: Hotel, link: '/services/reservations' },
    { title: 'Private Transfers & Aviation', icon: Plane, link: '/services/transfers' },
    { title: 'Tailor-Made Itineraries', icon: Calendar, link: '/services/itineraries' },
    { title: 'VIP Guest Services', icon: Star, link: '/services/vip' },
    { title: 'Experiences & Excursions', icon: Ship, link: '/services/experiences' },
    { title: 'Event & Group Travel', icon: Users, link: '/services/events' }
  ];

  const globalMarkets = [
    { name: 'Europe', desc: 'Supporting luxury agencies across the UK, DACH, and Southern Europe.', lat: '48.8566', lng: '2.3522', countries: 'UK, Germany, France, Italy' },
    { name: 'Middle East', desc: 'Curated VIP and ultra-luxury services for GCC travelers.', lat: '25.2048', lng: '55.2708', countries: 'UAE, Saudi Arabia, Qatar' },
    { name: 'Asia', desc: 'Tailored solutions for high-net-worth clients from emerging Asian markets.', lat: '1.3521', lng: '103.8198', countries: 'Singapore, China, Japan' },
    { name: 'North America', desc: 'Seamless long-haul travel planning and exclusive access.', lat: '40.7128', lng: '-74.0060', countries: 'USA, Canada' },
    { name: 'Australia', desc: 'Bespoke itineraries for discerning travelers from Oceania.', lat: '-33.8688', lng: '151.2093', countries: 'Australia, New Zealand' }
  ];

  const travelGuideArticles = [
    { title: 'Best Atolls in the Maldives', category: 'Destination', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800' },
    { title: 'When to Visit Maldives', category: 'Planning', img: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=800' },
    { title: 'Seaplane vs Speedboat Transfers', category: 'Logistics', img: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?auto=format&fit=crop&q=80&w=800' },
    { title: 'Luxury Resorts Guide', category: 'Resorts', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800' }
  ];

  const partnerLogos = [
    { name: 'Soneva', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Soneva_Logo.svg/512px-Soneva_Logo.svg.png' },
    { name: 'Joali', url: '' },
    { name: 'Cheval Blanc', url: '' },
    { name: 'Six Senses', url: '' },
    { name: 'Patina', url: '' }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-brand-paper text-brand-navy selection:bg-brand-teal/20">
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#128C7E] transition-all">
        <MessageSquare size={28} strokeWidth={1.5} />
      </button>

      {/* 1. HERO EXPERIENCE (Parallax) */}
      <section ref={heroRef} style={{ position: 'relative' }} className="relative h-[100dvh] min-h-[600px] flex items-center overflow-hidden bg-brand-navy">
        <motion.div style={{ y: heroBgY, willChange: 'transform' }} className="absolute inset-[-20%] z-0">
          <img 
            src={`${settings.hero?.banner_url || "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=85&w=1920"}${settings.hero?.banner_url?.includes('unsplash') ? '&auto=format&fit=crop&q=85&w=1920' : (settings.hero?.banner_url ? '' : '')}`} 
            alt="Luxury Maldives" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            fetchPriority="high"
            loading="eager"
          />
        </motion.div>
        
        {/* Dark gradient overlay stays stable */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-brand-navy/40 via-brand-navy/60 to-brand-navy/90"></div>
        
        <motion.div style={{ y: heroTextY }} className="relative z-20 px-6 md:px-12 max-w-7xl mx-auto w-full mt-10 md:mt-20">
          <div className="max-w-4xl">
            <h1 
              className={`${settings.hero?.title_size || 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'} ${settings.hero?.title_font || 'font-serif'} mb-6 leading-tight tracking-tight`}
              style={{ color: settings.hero?.title_color || '#ffffff' }}
            >
              {settings.hero?.title || 'Your Trusted Maldives Destination Management Partner'}
            </h1>
            <p className="text-white/90 font-light text-base md:text-xl max-w-2xl mb-10 leading-relaxed">
              {settings.hero?.subtitle || 'Luxury resort access, curated experiences, and seamless travel solutions for global travel professionals.'}
            </p>
            <div className="flex flex-wrap gap-4 md:gap-6">
              <Link to="/resorts">
                <button 
                  className="text-white px-8 md:px-10 py-4 md:py-5 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white hover:text-brand-navy transition-all"
                  style={{ backgroundColor: settings.hero?.button_color || '#008080' }}
                >
                  Explore Resorts
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Floating Partner Strip */}
        <div className="absolute bottom-0 left-0 right-0 py-8 z-30 bg-gradient-to-t from-brand-navy to-transparent">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-6 font-bold">{settings.hero?.partners_title || 'Top Properties'}</p>
            <div className="overflow-hidden relative">
              <motion.div 
                className="flex gap-16 md:gap-24 items-center w-max opacity-80 hover:opacity-100 transition-opacity duration-500"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                style={{ willChange: 'transform' }}
              >
                {safeArray(settings.hero_partners).length > 0 ? (
                  [...safeArray(settings.hero_partners), ...safeArray(settings.hero_partners)].map((logo: any, i: number) => (
                    <div key={i} className="flex-shrink-0">
                      <img 
                        src={`${logo.url}${logo.url?.includes('unsplash') ? '&auto=format&fit=crop&q=80&w=300' : ''}`} 
                        alt="Partner" 
                        className="h-16 md:h-20 max-w-[200px] w-auto object-contain brightness-0 invert" 
                        referrerPolicy="no-referrer" 
                        loading="lazy"
                      />
                    </div>
                  ))
                ) : (
                  [...partnerLogos, ...partnerLogos].map((logo, i) => (
                    <div key={i} className="flex-shrink-0 text-white font-serif text-2xl md:text-3xl tracking-wide">
                      {logo.name}
                    </div>
                  ))
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED RETREATS */}
      <section className="py-16 md:py-[120px] bg-white" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-brand-navy">{settings.featured_retreats_title || 'Featured Retreats'}</h2>
            <p className="text-brand-navy/60 font-sans text-xs md:text-sm uppercase tracking-widest mt-4">Hand-picked luxury island experiences</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {featuredResorts.slice(0, 5).map((resort: any, i: number) => (
              <Link to={`/resorts/${resort.id}`} key={resort.id || i} className="group block relative overflow-hidden rounded-2xl aspect-[3/4] luxury-shadow">
                {/* Background Image */}
                <img 
                  src={resort.banner_url || (resort.images && resort.images[0]) || resort.image_url || `https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800&sig=${resort.id}`} 
                  alt={resort.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  referrerPolicy="no-referrer" 
                  loading="lazy" 
                  decoding="async" 
                />
                
                {/* Filter/Blur Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500"></div>
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent backdrop-blur-[2px]"></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="font-serif text-xl text-white mb-2 drop-shadow-md line-clamp-2 leading-tight">
                      {resort.name}
                    </h3>
                    
                    <div className="flex flex-col gap-1.5 text-xs text-white/90 mb-4 font-sans drop-shadow-md">
                      {resort.atoll && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-white shrink-0" />
                          <span className="truncate">{resort.atoll}</span>
                        </span>
                      )}
                      {resort.category && (
                        <span className="flex items-center gap-1.5">
                          <Star size={12} className="text-white shrink-0" />
                          <span className="truncate">{resort.category}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white opacity-80 group-hover:opacity-100 transition-opacity">
                      <span>View More</span>
                      <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CEO MESSAGE */}
      <section className="py-16 md:py-[120px] bg-brand-paper overflow-hidden relative" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="relative rounded-[2rem] overflow-hidden luxury-shadow aspect-[4/5]">
              <img 
                src={`${settings.ceo_message?.photo_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2"}${settings.ceo_message?.photo_url?.includes('unsplash') ? '&auto=format&fit=crop&q=80&w=800' : (settings.ceo_message?.photo_url ? '' : '?auto=format&fit=crop&q=80&w=800')}`} 
                alt="CEO" 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="space-y-6 md:space-y-10">
              <span className="text-brand-teal font-sans uppercase tracking-[0.2em] text-[10px] block font-bold">CEO's Message</span>
              <h2 className="font-serif text-3xl md:text-5xl text-brand-navy leading-tight">
                {settings.ceo_message?.quote || "“Our mission is to connect the world’s leading travel designers with the extraordinary experiences of the Maldives.”"}
              </h2>
              <div className="text-base md:text-lg text-gray-600 leading-relaxed font-light space-y-6">
                <p>
                  {settings.ceo_message?.message || "Founded on the principles of discretion and excellence, we have spent two decades building intimate relationships with the Maldives' most secluded resorts."}
                </p>
              </div>
              <div>
                <p className="font-bold text-brand-navy text-lg md:text-xl">{settings.ceo_message?.name || 'Elias Jancel'}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal mt-1">{settings.ceo_message?.title || 'Founder & CEO'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR STORY */}
      <section ref={storyRef} className="py-16 md:py-[120px] bg-white overflow-hidden relative" id="story" style={{ position: 'relative', contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-10 order-2 lg:order-1">
              <span className="text-brand-teal font-sans uppercase tracking-[0.2em] text-[10px] block font-bold">Our Story</span>
              <h2 className="font-serif text-3xl md:text-5xl text-brand-navy leading-tight">
                {settings.our_story?.title || "A Legacy of Luxury in the Maldives"}
              </h2>
              <div className="text-base md:text-lg text-gray-600 leading-relaxed font-light space-y-6">
                <p>
                  {settings.our_story?.content || "Our role as a specialized B2B DMC is to be the extension of your team on the ground, ensuring every detail is executed with precision. We understand that your reputation relies on our flawless execution."}
                </p>
              </div>
            </div>
            <div className="relative rounded-[2rem] overflow-hidden luxury-shadow aspect-[4/5] order-1 lg:order-2">
              <motion.img 
                style={{ y: storyImgY, scale: 1.1, willChange: 'transform' }}
                src={`${settings.our_story?.image_url || "https://images.unsplash.com/photo-1514282401047-d79a71a590e8"}${settings.our_story?.image_url?.includes('unsplash') ? '&auto=format&fit=crop&q=80&w=800' : (settings.our_story?.image_url ? '' : '?auto=format&fit=crop&q=80&w=800')}`} 
                alt="Our Story" 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. GLOBAL MARKETS */}
      <section className="py-16 md:py-[120px] bg-brand-navy text-white relative overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-white">Global Markets</h2>
            <p className="text-white/60 font-sans text-xs md:text-sm uppercase tracking-widest mt-4">Supporting travel designers and agencies across global markets.</p>
          </div>
          
          <div className="w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden border border-white/10 relative luxury-shadow">
            <Map
              initialViewState={{
                longitude: 20,
                latitude: 20,
                zoom: 1.5,
                pitch: 0,
                bearing: 0
              }}
              mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
              interactive={true}
              dragPan={true}
              scrollZoom={false}
            >
              {(safeArray(settings.global_markets).length > 0 ? safeArray(settings.global_markets) : globalMarkets).map((market: any, i: number) => {
                const lat = parseFloat(market.lat);
                const lng = parseFloat(market.lng);
                
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker
                    key={`marker-${i}`}
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
                        <MapPin size={20} />
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-brand-navy/80 backdrop-blur-sm text-white px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
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
                  maxWidth="300px"
                >
                  <div className="p-4 bg-white rounded-xl text-brand-navy shadow-xl">
                    <h3 className="font-serif text-xl mb-1 flex items-center gap-2">
                      <Globe size={16} className="text-brand-teal" />
                      {activeMarket.name}
                    </h3>
                    {activeMarket.countries && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal mb-2">
                        {activeMarket.countries}
                      </p>
                    )}
                    <p className="text-sm text-brand-navy/70 leading-relaxed">
                      {activeMarket.description || activeMarket.desc}
                    </p>
                  </div>
                </Popup>
              )}
            </Map>
            
            {/* Overlay gradient to blend map edges */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_0_40px_rgba(10,25,47,0.8)]"></div>
          </div>
        </div>
      </section>

      {/* 6. DMC SERVICES */}
      <section className="py-16 md:py-[120px] bg-white relative" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="font-serif text-3xl md:text-5xl text-brand-navy">DMC Services</h2>
            <p className="text-brand-navy/60 font-sans text-xs md:text-sm uppercase tracking-widest mt-4">Comprehensive on-ground support for our partners</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {safeArray(settings.services).length > 0 ? (
              safeArray(settings.services).map((service: any, i: number) => {
                const Icon = service.icon === 'Hotel' ? Hotel :
                             service.icon === 'Plane' ? Plane :
                             service.icon === 'Ship' ? Ship :
                             service.icon === 'UserCheck' ? UserCheck :
                             service.icon === 'Calendar' ? Calendar :
                             service.icon === 'Smile' ? Smile :
                             service.icon === 'Star' ? Star :
                             service.icon === 'Users' ? Users :
                             service.icon === 'Compass' ? Globe :
                             service.icon === 'Map' ? MapPin : Zap;
                return (
                  <Link to={service.link || '#'} key={i} className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] group flex flex-col items-center text-center space-y-4 md:space-y-6 p-6 md:p-10 rounded-3xl border border-brand-navy/5 hover:bg-brand-paper hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-paper rounded-2xl flex items-center justify-center text-brand-teal shadow-sm group-hover:bg-brand-teal group-hover:text-white transition-all duration-300 group-hover:scale-110">
                      <Icon size={24} className="md:size-32" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-serif text-lg md:text-xl text-brand-navy">{service.title}</h3>
                  </Link>
                );
              })
            ) : (
              dmcServices.map((service: any, i: number) => {
                const Icon = service.icon;
                return (
                  <Link to={service.link} key={i} className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] group flex flex-col items-center text-center space-y-4 md:space-y-6 p-6 md:p-10 rounded-3xl border border-brand-navy/5 hover:bg-brand-paper hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-paper rounded-2xl flex items-center justify-center text-brand-teal shadow-sm group-hover:bg-brand-teal group-hover:text-white transition-all duration-300 group-hover:scale-110">
                      <Icon size={24} className="md:size-32" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-serif text-lg md:text-xl text-brand-navy">{service.title}</h3>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* STRATEGIC SUGGESTION: MALDIVES EXPERTISE */}
      <section className="py-16 md:py-20 bg-brand-navy text-white" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center md:divide-x divide-white/10">
            {(safeArray(settings.expertise_stats).length > 0 ? safeArray(settings.expertise_stats) : [
              { value: '198+', label: 'Resorts' },
              { value: '20+', label: 'Years Experience' },
              { value: '24/7', label: 'Local Support' },
              { value: 'Global', label: 'Travel Partners' }
            ]).map((stat: any, i: number) => (
              <div key={i} className="px-2 md:px-4">
                <h4 className="text-3xl md:text-5xl font-serif text-brand-teal mb-2">{stat.value}</h4>
                <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. WHY TRAVEL DESIGNERS CHOOSE US & PLATFORM EXCELLENCE */}
      <section className="py-16 md:py-[120px] bg-brand-paper relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-start">
            
            {/* Left: Text Points */}
            <div className="space-y-8 md:space-y-12 md:h-[400px] flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-[10px] font-bold text-brand-teal uppercase tracking-[0.3em] mb-4 block">Our Value Proposition</span>
                <h2 className="font-serif text-3xl md:text-5xl text-brand-navy leading-tight">
                  {settings.why_us_title || 'Why Travel Designers Choose Us'}
                </h2>
              </motion.div>

              <div className="space-y-6 md:space-y-8">
                {(safeArray(settings.why_us).length > 0 ? safeArray(settings.why_us) : whyUsPillars).map((pillar: any, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: i === activeIndex ? 1.05 : 1
                    }}
                    transition={{ duration: 0.5 }}
                    className="flex gap-4 md:gap-6"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-sm transition-colors duration-500 ${i === activeIndex ? 'bg-brand-teal text-white' : 'bg-white text-brand-teal'}`}>
                      <CheckCircle2 size={18} className="md:size-20" />
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="font-serif text-lg md:text-xl text-brand-navy">{pillar.title}</h3>
                      <p className="font-light leading-relaxed text-xs md:text-sm text-gray-600">
                        {pillar.description || pillar.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Parallax Stack */}
            <div className="relative h-[300px] md:h-[400px] w-full max-w-md mx-auto flex items-center justify-center perspective-1000">
              <StackedPhotoCarousel 
                onIndexChange={setActiveIndex}
                images={safeArray(settings.platform_excellence?.images).length > 0 ? safeArray(settings.platform_excellence.images) : [
                  (settings.platform_excellence?.image_url || "https://images.unsplash.com/photo-1514282401047-d79a71a590e8") + (settings.platform_excellence?.image_url?.includes('?') ? '&' : '?') + "auto=format&fit=crop&q=80&w=800",
                  "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=800",
                  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&q=80&w=800"
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRESTIGIOUS AWARDS */}
      <section className="py-24 bg-white overflow-hidden border-y border-brand-navy/5 relative" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 400px' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-brand-navy">{settings.awards?.title || 'Prestigious Awards'}</h2>
          {settings.awards?.summary && (
            <p className="mt-4 text-brand-navy/60 max-w-2xl mx-auto">{settings.awards.summary}</p>
          )}
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 items-center">
            {safeArray(settings.awards?.items).length > 0 ? (
              safeArray(settings.awards.items).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-center transition-transform hover:scale-105 duration-300">
                  <img 
                    src={`${item.url}${item.url?.includes('unsplash') ? '&auto=format&fit=crop&q=80&w=400' : ''}`} 
                    alt="Award" 
                    className="h-48 md:h-56 lg:h-64 w-auto object-contain" 
                    referrerPolicy="no-referrer" 
                    loading="lazy" 
                  />
                </div>
              ))
            ) : (
              [1, 2, 3].map((item, i) => (
                <div key={i} className="flex items-center justify-center transition-transform hover:scale-105 duration-300">
                  <div className="text-center">
                    <Award size={100} strokeWidth={1} className="mx-auto mb-4 text-brand-teal" />
                    <p className="font-serif text-2xl text-brand-navy">
                      {item === 1 ? 'World Travel Awards' : item === 2 ? 'Luxury Travel Awards' : 'Travel & Hospitality Awards'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 9. JOIN OUR GLOBAL NETWORK (CTA Parallax) */}
      <section ref={ctaRef} style={{ position: 'relative' }} className="relative py-[160px] overflow-hidden bg-brand-navy">
        <motion.div style={{ y: ctaBgY, willChange: 'transform' }} className="absolute inset-[-20%] z-0">
          <img 
            src={settings.ctas?.bg_image_url || "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=1920"} 
            alt="Maldives Aerial" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
        <div className="absolute inset-0 z-10 bg-brand-navy/80"></div>
        
        <div className="relative z-20 max-w-4xl mx-auto px-6 text-center space-y-10">
          <h2 className="text-5xl md:text-6xl font-serif leading-tight text-white">
            {settings.ctas?.partner_title || 'Join Our Global Network of Travel Professionals'}
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm uppercase tracking-widest font-bold mb-8">
            <span className="flex items-center gap-2"><Check size={16} strokeWidth={1.5} className="text-brand-teal" /> Priority Support</span>
            <span className="flex items-center gap-2"><Check size={16} strokeWidth={1.5} className="text-brand-teal" /> Exclusive Rates</span>
            <span className="flex items-center gap-2"><Check size={16} strokeWidth={1.5} className="text-brand-teal" /> Access to Offers</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/become-partner">
              <button className="bg-brand-teal text-white px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white hover:text-brand-navy transition-all">
                {settings.ctas?.partner_btn || 'Become a Travel Partner'}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. MALDIVES TRAVEL GUIDE */}
      <section className="py-[120px] px-6 md:px-12 max-w-7xl mx-auto relative" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}>
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-brand-navy">
              {settings.ctas?.guide_title || 'The Maldives Travel Guide'}
            </h2>
            <p className="text-brand-navy/60 font-sans text-sm uppercase tracking-widest mt-4">Destination knowledge for professionals</p>
          </div>
          <Link to="/guide" className="text-brand-navy font-sans text-[10px] uppercase tracking-widest border-b border-brand-navy pb-1 hover:text-brand-teal hover:border-brand-teal transition-colors">
            {settings.ctas?.guide_btn || 'View All Insights'}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {safeArray(settings.travel_guide).length > 0 ? (
            safeArray(settings.travel_guide).map((post: any, i: number) => (
              <Link to="/guide" key={i} className="group cursor-pointer block">
                <div className="overflow-hidden rounded-2xl aspect-[4/3] mb-6">
                  <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                </div>
                <span className="text-brand-teal font-sans uppercase tracking-[0.2em] text-[10px] mb-3 block font-bold">{post.category}</span>
                <h3 className="font-serif text-xl text-brand-navy mb-4 group-hover:text-brand-teal transition-colors">{post.title}</h3>
              </Link>
            ))
          ) : (
            travelGuideArticles.map((post: any, i: number) => (
              <Link to="/guide" key={i} className="group cursor-pointer block">
                <div className="overflow-hidden rounded-2xl aspect-[4/3] mb-6">
                  <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                </div>
                <span className="text-brand-teal font-sans uppercase tracking-[0.2em] text-[10px] mb-3 block font-bold">{post.category}</span>
                <h3 className="font-serif text-xl text-brand-navy mb-4 group-hover:text-brand-teal transition-colors">{post.title}</h3>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 11. NEWSLETTER */}
      <Newsletter />

    </div>
  );
}
