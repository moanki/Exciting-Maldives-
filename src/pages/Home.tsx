import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Gem, Zap, MessageSquare, X, Send, Mail, Globe, Award, Hotel, Plane, UserCheck, Calendar, Smile, ArrowRight, ShieldCheck, Database, BarChart3, Clock } from 'lucide-react';
import { supabase } from '../supabase';
import FeaturedRetreatsCarousel from '../components/FeaturedRetreatsCarousel';
import { getSiteSettings } from '../lib/settings';

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const [featuredResorts, setFeaturedResorts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [newsletterForm, setNewsletterForm] = useState({
    name: '',
    email: '',
    company: '',
    country: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const settingsData = await getSiteSettings();
      setSettings(settingsData);
      
      const { data, error } = await supabase
        .from('resorts')
        .select('*')
        .eq('is_featured', true);
      
      if (error || !data || data.length === 0) {
        const fallback = await supabase.from('resorts').select('*').limit(10);
        if (fallback.data) setFeaturedResorts(fallback.data);
      } else {
        setFeaturedResorts(data);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const iconMap: any = {
    Hotel: <Hotel size={24} />,
    Plane: <Plane size={24} />,
    UserCheck: <UserCheck size={24} />,
    Calendar: <Calendar size={24} />,
    Smile: <Smile size={24} />,
    Zap: <Zap size={24} />
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-brand-paper text-brand-navy selection:bg-brand-teal/20">
      {/* Section 1: Hero (Dream) */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          <img 
            src={settings.hero?.banner_url || 'https://picsum.photos/seed/maldives-luxury/1920/1080'} 
            alt="Luxury Maldives" 
            className="w-full h-full object-cover brightness-[0.85]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/40 via-transparent to-brand-paper z-10"></div>
        </motion.div>
        
        <div className="relative z-20 text-center text-white px-4 max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight">
              {settings.hero?.title}
            </h1>
            <p className="text-lg md:text-2xl font-sans max-w-3xl mx-auto text-white/90 leading-relaxed font-light">
              {settings.hero?.subtitle}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/become-partner">
              <button className="bg-brand-teal text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-white hover:text-brand-navy transition-all duration-500 shadow-2xl">
                Partner With Us
              </button>
            </Link>
            <Link to="/resorts">
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-white hover:text-brand-navy transition-all duration-500">
                Explore Resorts
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Featured Luxury Resorts (Visual) - MOVED UP */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-10 mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Curated Portfolio</div>
            <h2 className="text-4xl md:text-6xl font-serif">Featured Luxury Resorts</h2>
          </div>
          <Link to="/resorts" className="text-[11px] font-bold uppercase tracking-widest text-brand-navy hover:text-brand-teal transition-all flex items-center gap-2 group">
            View All Resorts <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="px-6 md:px-10">
          <FeaturedRetreatsCarousel resorts={featuredResorts} />
        </div>
      </section>

      {/* Section 3: Why Exciting Maldives (Trust) */}
      <section id="about" className="py-32 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-2 bg-brand-teal/5 text-brand-teal text-[10px] font-bold uppercase tracking-widest rounded-full">
              Our Positioning
            </div>
            <h2 className="text-4xl md:text-6xl font-serif leading-tight">
              {settings.introduction?.title}
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed font-light">
              {settings.introduction?.summary}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {settings.why_us?.map((item: any, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white rounded-[2.5rem] luxury-shadow border border-brand-navy/5 group hover:border-brand-teal/20 transition-all duration-500"
              >
                <div className="flex gap-6 items-start">
                  <div className="w-14 h-14 bg-brand-teal/5 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-teal group-hover:text-white transition-all duration-500">
                    {i === 0 ? <Gem size={24} /> : i === 1 ? <ShieldCheck size={24} /> : <BarChart3 size={24} />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-bold text-brand-navy">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-sans">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: CEO Message & Our Story */}
      <section className="py-32 px-6 md:px-10 bg-brand-paper/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* CEO Message */}
            <div className="space-y-10">
              <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Leadership Vision</div>
              <div className="relative p-12 bg-white rounded-[3rem] luxury-shadow">
                <div className="absolute -top-6 -left-6 w-20 h-20 bg-brand-teal text-white rounded-full flex items-center justify-center shadow-xl">
                  <MessageSquare size={32} />
                </div>
                <div className="space-y-8">
                  <p className="text-2xl font-serif italic text-brand-navy leading-relaxed">
                    "{settings.ceo_message?.message}"
                  </p>
                  <div className="flex items-center gap-4">
                    {settings.ceo_message?.photo_url && (
                      <img 
                        src={settings.ceo_message.photo_url} 
                        alt={settings.ceo_message.name} 
                        className="w-16 h-16 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <h4 className="text-lg font-serif font-bold text-brand-navy">{settings.ceo_message?.name}</h4>
                      <p className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Chief Executive Officer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Story */}
            <div className="space-y-10">
              <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Our Journey</div>
              <div className="space-y-8">
                <h2 className="text-4xl md:text-5xl font-serif leading-tight">{settings.our_story?.title}</h2>
                <div className="text-lg text-gray-600 leading-relaxed font-light space-y-6">
                  {settings.our_story?.content?.split('\n').map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <div className="pt-4">
                  <Link to="/about" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-navy hover:text-brand-teal transition-all group">
                    Learn More About Us <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Platform Excellence (Tech) */}
      <section id="platform" className="py-32 px-6 md:px-10 bg-brand-navy text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-teal/5 blur-[120px] rounded-full -mr-1/4"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Digital Infrastructure</div>
                <h2 className="text-4xl md:text-6xl font-serif leading-tight">Platform Excellence</h2>
                <p className="text-xl text-white/60 font-light leading-relaxed">
                  We empower our partners with cutting-edge technology, ensuring seamless operational coordination across the Maldives.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {settings.platform_excellence?.map((item: any, i: number) => (
                  <div key={i} className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="w-10 h-10 bg-brand-teal/20 rounded-xl flex items-center justify-center text-brand-teal">
                      {i === 0 ? <Database size={20} /> : i === 1 ? <Clock size={20} /> : i === 2 ? <Zap size={20} /> : <Globe size={20} />}
                    </div>
                    <h4 className="text-lg font-serif font-bold">{item.title}</h4>
                    <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-brand-teal/20 to-transparent rounded-full absolute inset-0 blur-3xl"></div>
              <img 
                src="https://picsum.photos/seed/tech/1000/1000" 
                alt="Platform Excellence" 
                className="relative z-10 rounded-[3rem] shadow-2xl border border-white/10"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Global Markets (Credibility) */}
      <section className="py-32 px-6 md:px-10 bg-brand-paper">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-6">
            <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Our Reach</div>
            <h2 className="text-4xl md:text-6xl font-serif">Global Markets</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
              Trusted by global travel partners across Russia, CIS, Europe, and the Middle East.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {settings.global_markets?.map((market: any, i: number) => (
              <div key={i} className="p-10 bg-white rounded-[3rem] luxury-shadow border border-brand-navy/5 space-y-6 group hover:-translate-y-2 transition-all duration-500">
                <div className="w-20 h-20 bg-brand-paper rounded-full flex items-center justify-center mx-auto text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                  <Globe size={32} />
                </div>
                <h3 className="text-2xl font-serif font-bold">{market.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{market.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Awards & Recognition (Trust) */}
      <section className="py-32 px-6 md:px-10 bg-white border-y border-brand-navy/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Industry Authority</div>
              <h2 className="text-4xl md:text-5xl font-serif leading-tight">{settings.awards?.title}</h2>
              <p className="text-xl text-gray-500 font-light leading-relaxed">{settings.awards?.summary}</p>
              <div className="flex items-center gap-6 p-6 bg-brand-paper rounded-3xl border border-brand-navy/5">
                <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold">
                  <Award size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-serif font-bold text-brand-navy">{settings.awards?.items?.[0]?.label}</h4>
                  <p className="text-xs text-brand-gold font-bold uppercase tracking-widest mt-1">{settings.awards?.items?.[0]?.year}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-center justify-items-center opacity-40 hover:opacity-100 transition-opacity duration-700">
              {/* Fallback award logos if none in settings */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/award-${i}/200/200`} 
                  alt="Award" 
                  className="h-20 md:h-24 object-contain grayscale hover:grayscale-0 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Services (Visual) */}
      <section className="py-32 px-6 md:px-10 bg-brand-paper">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <div className="text-brand-teal text-[10px] font-bold uppercase tracking-[0.3em]">Our Expertise</div>
            <h2 className="text-4xl md:text-6xl font-serif">Comprehensive DMC Services</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {settings.services?.map((service: any, i: number) => (
              <div key={i} className="p-8 bg-white rounded-[2.5rem] luxury-shadow border border-brand-navy/5 text-center space-y-6 group hover:bg-brand-navy hover:text-white transition-all duration-500">
                <div className="w-16 h-16 bg-brand-teal/5 rounded-2xl flex items-center justify-center mx-auto text-brand-teal group-hover:bg-white/10 group-hover:text-white transition-all duration-500">
                  {iconMap[service.icon] || <Zap size={24} />}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest leading-tight">{service.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Partner Invitation (Action) */}
      <section className="py-32 px-6 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto luxury-gradient rounded-[4rem] p-12 md:p-24 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 space-y-10 max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
              <Handshake size={40} />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl md:text-7xl font-serif leading-tight">Partner with Exciting Maldives</h2>
              <p className="text-xl text-white/80 font-light leading-relaxed">
                Empower your portfolio with curated Maldivian luxury and dedicated destination management expertise ensuring flawless execution.
              </p>
            </div>
            <Link to="/become-partner" className="inline-block">
              <button className="bg-white text-brand-navy px-16 py-6 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-brand-gold hover:text-white transition-all duration-500 shadow-2xl">
                Become a Partner
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 px-6 md:px-10 bg-brand-paper/50">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="w-20 h-20 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-brand-teal" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif text-brand-navy">Stay Informed</h2>
            <p className="text-xl text-gray-500 font-light max-w-xl mx-auto leading-relaxed">
              Subscribe to our B2B newsletter for the latest resort openings, exclusive seasonal offers, and Maldivian travel intelligence.
            </p>
          </div>
          <button 
            onClick={() => setIsNewsletterOpen(true)}
            className="bg-brand-navy text-white px-16 py-6 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-brand-teal transition-all duration-500 shadow-2xl"
          >
            Subscribe to Intelligence
          </button>
        </div>
      </section>

      {/* Newsletter Modal */}
      <AnimatePresence>
        {isNewsletterOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewsletterOpen(false)}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsNewsletterOpen(false)}
                className="absolute top-8 right-8 p-2 text-brand-navy/20 hover:text-brand-teal transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="p-16">
                {!isSubscribed ? (
                  <div className="space-y-10">
                    <div className="text-center space-y-4">
                      <h3 className="text-4xl font-serif text-brand-navy leading-tight">Be the first to know</h3>
                      <p className="text-gray-500 font-light">Subscribe to our B2B newsletter for Maldivian travel intelligence.</p>
                    </div>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmitting(true);
                      await new Promise(r => setTimeout(r, 1500));
                      setIsSubscribed(true);
                      setIsSubmitting(false);
                    }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/40 ml-6">Full Name</label>
                        <input 
                          required
                          type="text" 
                          value={newsletterForm.name}
                          onChange={(e) => setNewsletterForm({...newsletterForm, name: e.target.value})}
                          className="w-full bg-brand-paper border-none rounded-full px-8 py-5 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/40 ml-6">Email Address</label>
                        <input 
                          required
                          type="email" 
                          value={newsletterForm.email}
                          onChange={(e) => setNewsletterForm({...newsletterForm, email: e.target.value})}
                          className="w-full bg-brand-paper border-none rounded-full px-8 py-5 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/40 ml-6">Company</label>
                          <input 
                            type="text" 
                            value={newsletterForm.company}
                            onChange={(e) => setNewsletterForm({...newsletterForm, company: e.target.value})}
                            className="w-full bg-brand-paper border-none rounded-full px-8 py-5 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                            placeholder="Company"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-navy/40 ml-6">Country</label>
                          <input 
                            type="text" 
                            value={newsletterForm.country}
                            onChange={(e) => setNewsletterForm({...newsletterForm, country: e.target.value})}
                            className="w-full bg-brand-paper border-none rounded-full px-8 py-5 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                            placeholder="Country"
                          />
                        </div>
                      </div>
                      <button 
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-brand-navy text-white py-6 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-brand-teal transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Subscribe <Send size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-8 py-12"
                  >
                    <div className="w-24 h-24 bg-brand-teal text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-brand-teal/20">
                      <Zap size={48} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-serif text-brand-navy leading-tight">Welcome Aboard!</h3>
                      <p className="text-gray-500 font-light leading-relaxed">You've successfully subscribed to our B2B intelligence newsletter. Get ready for Maldivian excellence in your inbox.</p>
                    </div>
                    <button 
                      onClick={() => setIsNewsletterOpen(false)}
                      className="text-brand-teal font-bold uppercase tracking-widest text-[11px] hover:underline"
                    >
                      Close Window
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
