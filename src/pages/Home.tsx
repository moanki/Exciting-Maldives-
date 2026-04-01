import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { getSiteSettings } from '../lib/settings';
import { ArrowRight, MapPin, Plane, Ship, CheckCircle2, Star, ShieldCheck, Users, Clock, Search, ChevronRight, ChevronLeft, Zap, Check } from 'lucide-react';

const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];

function Newsletter() {
  return (
    <section className="py-[120px] bg-brand-navy text-white">
      <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
        <h2 className="text-3xl md:text-5xl font-serif">Stay Inspired</h2>
        <p className="text-brand-paper/60">Subscribe to our newsletter for exclusive luxury travel insights and curated resort recommendations.</p>
        <div className="flex gap-4">
          <input type="email" placeholder="Enter your email" className="flex-1 bg-white/10 border-none rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/50" />
          <button className="bg-brand-teal text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-brand-navy transition-all">Subscribe</button>
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
      
      {/* 1. HERO EXPERIENCE */}
      <section className="relative h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
          <img 
            src={settings.hero?.banner_url || 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80'} 
            alt="Luxury Maldives" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Soft gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/60 via-brand-navy/30 to-brand-navy/80 z-10"></div>
        </motion.div>
        
        <div className="relative z-20 text-center text-white px-6 max-w-5xl mx-auto space-y-10 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight">
              {settings.hero?.title || 'Maldives, Designed for the World’s Leading Travel Experts'}
            </h1>
            <p className="text-lg md:text-2xl font-sans max-w-3xl mx-auto text-white/90 leading-relaxed font-light tracking-wide">
              {settings.hero?.subtitle || 'Luxury Resorts • Private Islands • Seamless Transfers'}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            <Link to="/resorts">
              <button className="bg-white text-brand-navy px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-brand-teal hover:text-white transition-all duration-500 shadow-2xl">
                Explore Resorts
              </button>
            </Link>
            <Link to="/become-partner">
              <button className="bg-transparent backdrop-blur-md border border-white/30 text-white px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-white hover:text-brand-navy transition-all duration-500">
                Become a Partner
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 text-white/70"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll</span>
          <div className="w-[1px] h-12 bg-white/30 overflow-hidden">
            <motion.div 
              animate={{ y: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-full bg-white"
            />
          </div>
        </motion.div>
      </section>

      {/* 2. MALDIVES DISCOVERY ENGINE */}
      <section className="py-[120px] bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-serif text-brand-navy">Find the perfect resort</h2>
              <p className="text-lg text-gray-500 font-light">Utilize our discovery engine to match your clients with their ideal Maldivian escape.</p>
            </div>
            <Link to="/resorts" className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-navy hover:text-brand-teal transition-all group">
              Open Discovery Engine <Search size={16} className="group-hover:scale-110 transition-transform duration-300" />
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeFilter === filter 
                    ? 'bg-brand-navy text-white' 
                    : 'bg-brand-paper text-brand-navy hover:bg-brand-teal/10'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Resort Cards Carousel */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex gap-8"
              animate={{ x: `-${currentIndex * 350}px` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {featuredResorts.map((resort, i) => (
                <motion.div 
                  key={resort.id || i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group cursor-pointer min-w-[320px] md:min-w-[400px]"
                >
                  <Link to={`/resorts/${resort.id}`}>
                    <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 luxury-shadow">
                      <img 
                        src={resort.images?.[0] || `https://picsum.photos/seed/${resort.id}/800/1000`} 
                        alt={resort.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                      
                      <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col justify-end h-full">
                        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                          <div className="flex items-center gap-2 text-brand-teal mb-3">
                            <MapPin size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{resort.location || 'Maldives'}</span>
                          </div>
                          <h3 className="text-3xl font-serif text-white mb-2">{resort.name}</h3>
                          <div className="flex items-center justify-between text-white/80 text-sm font-light">
                            <span>{resort.star_rating || 5} Star Luxury</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-teal transition-colors">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Carousel Controls */}
            <div className="flex justify-center gap-4 mt-8">
              <button 
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                className="w-12 h-12 rounded-full bg-brand-paper flex items-center justify-center hover:bg-brand-teal hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentIndex(Math.min(featuredResorts.length - 1, currentIndex + 1))}
                className="w-12 h-12 rounded-full bg-brand-paper flex items-center justify-center hover:bg-brand-teal hover:text-white transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DESTINATION STORY */}
      <section className="py-[120px] px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <h2 className="text-5xl md:text-7xl font-serif leading-[1.1] text-brand-navy" dangerouslySetInnerHTML={{ __html: settings.our_story?.title || '1200 Islands.<br/><span class="text-brand-teal italic">26 Atolls.</span><br/>Infinite Possibilities.' }} />
            <div className="text-lg text-gray-600 leading-relaxed font-light space-y-6 max-w-lg">
              <p>
                {settings.our_story?.content || 'The Maldives is more than a destination; it is a canvas for extraordinary experiences. As your dedicated Destination Management Company, we unlock the true potential of this archipelago for your most discerning clients.'}
              </p>
            </div>
            <Link to="/about" className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-navy hover:text-brand-teal transition-all group">
              Discover Our Story <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative rounded-[2rem] overflow-hidden luxury-shadow aspect-[4/5] lg:aspect-square"
          >
            <img 
              src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&q=80" 
              alt="Maldives Atolls" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent flex items-end p-10">
              <div className="text-white space-y-2">
                <div className="flex items-center gap-2 text-brand-teal">
                  <MapPin size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Interactive Map Coming Soon</span>
                </div>
                <h3 className="text-2xl font-serif">Explore the Atolls</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. FEATURED EXPERIENCES / DMC SERVICES */}
      <section className="py-[120px] px-6 md:px-10 max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl md:text-6xl font-serif text-brand-navy">Comprehensive DMC Services</h2>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
            Luxury travellers don't just book resorts. They seek transformative moments. We curate the extraordinary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeArray(settings.services).length > 0 ? safeArray(settings.services).map((service: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden group cursor-pointer bg-brand-paper flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal mb-6 group-hover:scale-110 transition-transform duration-500">
                {service.icon === 'Hotel' && <MapPin size={32} />}
                {service.icon === 'Plane' && <Plane size={32} />}
                {service.icon === 'Ship' && <Ship size={32} />}
                {service.icon === 'Zap' && <Zap size={32} />}
                {!['Hotel', 'Plane', 'Ship', 'Zap'].includes(service.icon) && <Star size={32} />}
              </div>
              <h3 className="text-2xl font-serif text-brand-navy group-hover:-translate-y-2 transition-transform duration-500">{service.title}</h3>
            </motion.div>
          )) : experiences.map((exp, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative aspect-square rounded-[2rem] overflow-hidden group cursor-pointer"
            >
              <img 
                src={exp.image} 
                alt={exp.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-brand-navy/40 group-hover:bg-brand-navy/20 transition-colors duration-500"></div>
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <h3 className="text-2xl font-serif text-white group-hover:-translate-y-2 transition-transform duration-500">{exp.title}</h3>
                <div className="h-0 overflow-hidden group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white mt-4">
                    Explore <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. SEAMLESS TRANSFERS */}
      <section className="py-[120px] bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
            <div className="lg:col-span-1 space-y-8">
              <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Logistics</div>
              <h2 className="text-4xl md:text-6xl font-serif leading-tight">Getting There Is Part of the Journey</h2>
              <p className="text-lg text-white/60 font-light leading-relaxed">
                The Maldives geography requires expert logistical planning. We handle all domestic transfers seamlessly, ensuring your clients arrive in style and comfort.
              </p>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: <Plane size={32} />, title: 'Seaplane', time: '15 – 60 mins', desc: 'Serves 90+ resorts' },
                { icon: <Ship size={32} />, title: 'Speedboat', time: '10 – 45 mins', desc: 'North & South Male Atoll' },
                { icon: <Plane size={32} className="rotate-45" />, title: 'Domestic Flight', time: '20 – 90 mins', desc: 'Distant Atolls' }
              ].map((transfer, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-brand-teal/20 rounded-2xl flex items-center justify-center text-brand-teal mb-8 group-hover:scale-110 transition-transform">
                    {transfer.icon}
                  </div>
                  <h3 className="text-2xl font-serif mb-2">{transfer.title}</h3>
                  <p className="text-brand-teal text-sm font-bold mb-4">{transfer.time}</p>
                  <p className="text-white/50 text-sm font-light">{transfer.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRUST & AUTHORITY / AWARDS */}
      <section className="py-[120px] bg-white border-b border-brand-navy/5">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-6xl font-serif text-brand-navy">{settings.awards?.title || 'Prestigious Awards'}</h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
              {settings.awards?.summary || 'Recognized globally for our commitment to excellence in luxury travel.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {safeArray(settings.global_markets).length > 0 ? safeArray(settings.global_markets).map((market: any, i: number) => (
              <div key={i} className="space-y-4">
                <div className="text-3xl md:text-4xl font-serif text-brand-navy">{market.name}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-teal">{market.description}</div>
              </div>
            )) : [
              { number: '120+', label: 'Resort Partnerships' },
              { number: '3,000+', label: 'Global Travel Agents' },
              { number: '20+', label: 'Years of Expertise' },
              { number: '24/7', label: 'Reservation Support' }
            ].map((metric, i) => (
              <div key={i} className="space-y-4">
                <div className="text-5xl md:text-6xl font-serif text-brand-navy">{metric.number}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-brand-teal">{metric.label}</div>
              </div>
            ))}
          </div>
          
          {/* Partner Logos / Awards */}
          <div className="mt-24 pt-16 border-t border-brand-navy/5">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-10">Trusted by the world's finest resorts</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60">
              {safeArray(settings.awards?.items).length > 0 ? safeArray(settings.awards?.items).map((item: any, i: number) => (
                <img key={i} src={item.url} alt="Award" className="h-16 object-contain" />
              )) : (
                <>
                  <div className="text-2xl font-serif font-bold">Soneva</div>
                  <div className="text-2xl font-serif font-bold">JOALI</div>
                  <div className="text-2xl font-serif font-bold">Cheval Blanc</div>
                  <div className="text-2xl font-serif font-bold">Aman</div>
                  <div className="text-2xl font-serif font-bold">One&Only</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLATFORM EXCELLENCE */}
      <section className="py-[120px] bg-brand-paper overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Technology</div>
              <h2 className="text-4xl md:text-6xl font-serif leading-tight text-brand-navy">Platform Excellence</h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                Your real-time intelligence hub. Access instant resort availability, dynamic pricing, and a live offers repository. Built for travel professionals who demand speed and accuracy.
              </p>
              <ul className="space-y-4">
                {safeArray(settings.platform_excellence).length > 0 ? safeArray(settings.platform_excellence).map((feature: any, i: number) => (
                  <li key={i} className="flex items-center gap-4 text-brand-navy font-medium">
                    <CheckCircle2 size={20} className="text-brand-teal" />
                    <span className="flex flex-col">
                      <span>{feature.title}</span>
                      <span className="text-sm text-gray-500 font-light">{feature.description}</span>
                    </span>
                  </li>
                )) : ['Real-Time Intelligence', 'Instant Resort Availability', 'Dynamic Pricing Engine', 'Live Offers Repository'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-4 text-brand-navy font-medium">
                    <CheckCircle2 size={20} className="text-brand-teal" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link to="/become-partner">
                  <button className="bg-brand-navy text-white px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-brand-teal transition-all duration-500">
                    Request Platform Access
                  </button>
                </Link>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-brand-teal/10 blur-[100px] rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80" 
                alt="Platform Dashboard" 
                className="relative z-10 rounded-[2rem] luxury-shadow border border-white/50"
              />
              {/* Floating UI Elements */}
              <div className="absolute -left-10 top-20 bg-white p-4 rounded-2xl luxury-shadow z-20 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Availability</p>
                  <p className="text-sm font-bold text-brand-navy">Confirmed Instantly</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7.5. WHY US */}
      <section className="py-[120px] bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-6xl font-serif text-brand-navy">Why Partner With Us</h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
              We provide unparalleled support and technology for luxury travel professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {safeArray(settings.why_us).length > 0 ? safeArray(settings.why_us).map((pillar: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 bg-brand-paper rounded-[2rem] space-y-4 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal mb-6">
                  <Check size={24} />
                </div>
                <h3 className="text-2xl font-serif text-brand-navy">{pillar.title}</h3>
                <p className="text-gray-600 font-light leading-relaxed">{pillar.description}</p>
              </motion.div>
            )) : [
              { title: 'Authentic Connections', description: 'We focus on fostering genuine relationships with our B2B partners by understanding their needs and providing personalized solutions.' },
              { title: 'Unmatched Expertise', description: 'Our team possesses deep, localized knowledge of the Maldives, ensuring your clients receive the most accurate and insightful recommendations.' },
              { title: 'Seamless Technology', description: 'Our advanced platform provides real-time availability, dynamic pricing, and instant confirmations, streamlining your booking process.' }
            ].map((pillar, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 bg-brand-paper rounded-[2rem] space-y-4 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-brand-teal/10 rounded-full flex items-center justify-center text-brand-teal mb-6">
                  <Check size={24} />
                </div>
                <h3 className="text-2xl font-serif text-brand-navy">{pillar.title}</h3>
                <p className="text-gray-600 font-light leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CEO MESSAGE */}
      <section ref={ceoRef} className="py-[120px] bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 md:px-10 text-center space-y-12">
          <h2 className="text-3xl md:text-5xl font-serif text-brand-navy leading-relaxed max-w-4xl mx-auto">
            “{settings.ceo_message?.message || 'Exciting Maldives has become our go-to Maldives partner. Their platform is incredibly intuitive, and their local expertise is unmatched.'}”
          </h2>
          <div className="flex flex-col items-center gap-4">
            <motion.div style={{ y: ceoY }} className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden luxury-shadow">
              <img 
                src={settings.ceo_message?.photo_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80"} 
                alt="CEO" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div>
              <p className="font-bold text-brand-navy">{settings.ceo_message?.name || 'Sarah Jenkins'}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-teal mt-1">CEO & Founder</p>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />

      {/* 9. FINAL CTA */}
      <section className="relative py-[160px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80" 
            alt="Sunset Maldives" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-navy/80 z-10"></div>
        </div>
        
        <div className="relative z-20 text-center text-white px-6 max-w-4xl mx-auto space-y-10">
          <h2 className="text-5xl md:text-7xl font-serif leading-tight">
            {settings.ctas?.partner_title || 'Design Maldives Experiences Your Clients Will Never Forget'}
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link to="/resorts">
              <button className="bg-brand-teal text-white px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-white hover:text-brand-navy transition-all duration-500 shadow-2xl">
                {settings.ctas?.guide_btn || 'Explore Resorts'}
              </button>
            </Link>
            <Link to="/become-partner">
              <button className="bg-transparent backdrop-blur-md border border-white/30 text-white px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-white hover:text-brand-navy transition-all duration-500">
                {settings.ctas?.partner_btn || 'Partner With Us'}
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
