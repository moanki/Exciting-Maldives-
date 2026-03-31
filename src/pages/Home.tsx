import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Gem, Zap, MessageSquare, X, Send, Mail } from 'lucide-react';
import { supabase } from '../supabase';
import FeaturedRetreatsCarousel from '../components/FeaturedRetreatsCarousel';
import { getColorSync } from 'colorthief';
import { getSiteSettings } from '../lib/settings';

function ResortItem({ resort, i }: { resort: any; i: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1.1]);

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <motion.div style={{ y: textY }} className={`order-2 ${i % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
        <h3 className="text-3xl font-serif mb-4">{resort.name}</h3>
        <p className="text-gray-600 mb-6">{resort.description}</p>
        <Link to={`/resorts/${resort.id}`}>
          <button className="bg-[#1a1a1a] text-white px-6 py-2 rounded-full">View Resort</button>
        </Link>
      </motion.div>
      <motion.div style={{ y, scale }} className={`order-1 ${i % 2 === 0 ? 'md:order-2' : 'md:order-1'} overflow-hidden rounded-3xl`}>
        <img 
          src={resort.images?.[0] || 'https://picsum.photos/seed/resort/800/600'} 
          alt={resort.name} 
          className="w-full h-full object-cover shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </div>
  );
}

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const [featuredResorts, setFeaturedResorts] = useState<any[]>([]);
  const [whyUsPillars, setWhyUsPillars] = useState<any[]>([]);
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

  const [heroData, setHeroData] = useState({
    title: 'Exciting Maldives',
    subtitle: 'Bespoke Destination Management',
    banner_url: '',
    title_color: '#ffffff',
    button_color: '#008080',
    title_font: 'font-serif'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch Site Settings using the helper
      const settingsData = await getSiteSettings();
      setSettings(settingsData);
      
      if (settingsData.hero) {
        setHeroData({
          title: settingsData.hero.title || 'Exciting Maldives',
          subtitle: settingsData.hero.subtitle || 'Bespoke Destination Management',
          banner_url: settingsData.hero.banner_url || 'https://picsum.photos/seed/maldives/1920/1080',
          title_color: settingsData.hero.title_color || '#ffffff',
          button_color: settingsData.hero.button_color || '#008080',
          title_font: settingsData.hero.title_font || 'font-serif'
        });

        // Automatic color detection
        const img = new Image();
        img.src = settingsData.hero.banner_url || 'https://picsum.photos/seed/maldives/1920/1080';
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const color = getColorSync(img);
          if (color) {
            const hex = color.hex();
            
            // Only update if user hasn't set a color
            if (!settingsData.hero.title_color) {
              setHeroData(prev => ({ ...prev, title_color: hex, button_color: hex }));
            }
          }
        };
      }

      if (settingsData.why_us) {
        setWhyUsPillars(settingsData.why_us);
      }

      // Fetch Featured Resorts
      const { data, error } = await supabase
        .from('resorts')
        .select('*')
        .eq('is_featured', true);
      
      if (error || !data || data.length === 0) {
        // Fallback if is_featured column is missing or no featured resorts
        const fallback = await supabase.from('resorts').select('*').limit(10);
        if (fallback.data) {
          setFeaturedResorts(fallback.data);
        }
      } else {
        setFeaturedResorts(data);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#f5f2ed] text-[#1a1a1a]">
      {/* Banner */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Hero Banner Image */}
        <motion.div style={{ y }} className="absolute inset-0 z-0">
          {!isLoading && (
            <img 
              src={heroData.banner_url} 
              alt="Maldives" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          {/* Fade effect at the bottom of the banner */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#f5f2ed] to-transparent z-10"></div>
        </motion.div>
        
        {/* Hero Title and Search */}
        <div className="relative z-20 text-center text-white px-4">
          <h1 className={`text-5xl md:text-7xl mb-6 ${heroData.title_font}`} style={{ color: heroData.title_color }}>{heroData.title}</h1>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: heroData.title_color }}>{heroData.subtitle}</p>
          
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-full flex items-center border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <input 
              type="text" 
              placeholder="Explore..." 
              className="bg-transparent px-8 py-6 outline-none text-white placeholder-white/80 w-full text-lg" 
            />
            <button className="text-white px-12 py-6 rounded-full font-semibold text-lg hover:opacity-90 transition-colors whitespace-nowrap" style={{ backgroundColor: heroData.button_color }}>
              Explore
            </button>
          </div>
        </div>
      </section>

      {/* Section 1: Introduction */}
      <section className="py-20 px-10 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-serif mb-6 text-brand-navy">{settings.introduction?.title || 'Bespoke Destination Management'}</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          {settings.introduction?.summary || 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships.'}
        </p>
      </section>

      {/* Section 3: Featured Retreats */}
      <section className="py-20 px-10 bg-[#f5f2ed] overflow-hidden">
        <h2 className="text-4xl font-serif text-center mb-12">Featured Retreats</h2>
        <FeaturedRetreatsCarousel resorts={featuredResorts} />
      </section>

      {/* Section: CEO Message */}
      {settings.ceo_message?.message && (
        <section className="py-24 px-10 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-brand-teal/10 rounded-full blur-2xl"></div>
              {settings.ceo_message.photo_url ? (
                <img 
                  src={settings.ceo_message.photo_url} 
                  alt={settings.ceo_message.name} 
                  className="w-full aspect-[3/4] object-cover rounded-[2rem] shadow-2xl relative z-10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-brand-paper/50 rounded-[2rem] shadow-2xl relative z-10"></div>
              )}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-coral/5 rounded-full blur-3xl"></div>
            </div>
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-brand-teal/5 text-brand-teal text-[10px] font-bold uppercase tracking-widest rounded-full">
                Leadership Message
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-brand-navy leading-tight">
                A Message from our CEO
              </h2>
              <div className="relative">
                <span className="absolute -top-8 -left-4 text-8xl text-brand-teal/10 font-serif">"</span>
                <p className="text-xl text-gray-700 leading-relaxed italic relative z-10">
                  {settings.ceo_message.message}
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-serif text-brand-navy">{settings.ceo_message.name}</h4>
                <p className="text-brand-teal font-bold text-xs uppercase tracking-widest mt-1">Chief Executive Officer</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section: Our Story */}
      {settings.our_story?.content && (
        <section className="py-24 px-10 bg-brand-paper/30">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif text-brand-navy">{settings.our_story.title || 'Our Story'}</h2>
            <div className="w-20 h-1 bg-brand-teal/30 mx-auto rounded-full"></div>
            <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
              {settings.our_story.content}
            </p>
          </div>
        </section>
      )}

      {/* Section: Prestigious Awards */}
      {settings.awards?.title && (
        <section className="py-24 px-10 bg-white">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-brand-navy mb-6">{settings.awards.title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{settings.awards.summary}</p>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-items-center opacity-60 hover:opacity-100 transition-opacity duration-500">
            {settings.awards.items?.map((award: any, i: number) => (
              <motion.img 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                src={award.url} 
                alt="Award Badge" 
                className="h-24 md:h-32 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Core Values (Why Us) */}
      <section className="py-24 px-10 bg-brand-paper/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-brand-navy mb-4">Why Choose Us</h2>
            <p className="text-gray-600">The pillars of our excellence in Maldivian hospitality</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyUsPillars.map((item, i) => (
              <div key={i} className="p-8 bg-white rounded-[2rem] shadow-sm border border-brand-paper/50 hover:shadow-xl transition-all duration-500 group">
                <div className="w-12 h-12 bg-brand-teal/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-teal group-hover:text-white transition-all duration-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-4 text-brand-navy">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Calls to Action */}
      <section className="py-24 px-10 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ y: -10 }}
            className="relative overflow-hidden rounded-[2.5rem] p-12 bg-brand-navy text-white group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-brand-teal/20 transition-all duration-700"></div>
            <div className="relative z-10 space-y-6">
              <Handshake className="w-12 h-12 text-brand-teal" />
              <h3 className="text-3xl md:text-4xl font-serif">{settings.ctas?.partner_title || 'Become a Partner'}</h3>
              <p className="text-brand-paper/60 text-lg max-w-md">Join our exclusive network of travel professionals and access bespoke Maldivian experiences.</p>
              <Link to="/become-partner" className="inline-block">
                <button className="bg-brand-teal text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-brand-navy transition-all duration-300">
                  {settings.ctas?.partner_btn || 'Request Form'}
                </button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="relative overflow-hidden rounded-[2.5rem] p-12 bg-brand-teal text-white group"
          >
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="relative z-10 space-y-6">
              <Zap className="w-12 h-12 text-brand-paper" />
              <h3 className="text-3xl md:text-4xl font-serif">{settings.ctas?.guide_title || 'Travel Guide'}</h3>
              <p className="text-brand-paper/80 text-lg max-w-md">Everything you need to know about traveling to the Maldives, from visa info to local customs.</p>
              <Link to="/tourist-info" className="inline-block">
                <button className="bg-brand-navy text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-brand-navy transition-all duration-300">
                  {settings.ctas?.guide_btn || 'View Guide'}
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-10 bg-brand-paper/30">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-brand-teal" />
          </div>
          <h2 className="text-4xl font-serif text-brand-navy">Stay in the Loop</h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Subscribe to our newsletter to receive the latest updates, promotions and news from the Maldives.
          </p>
          <button 
            onClick={() => setIsNewsletterOpen(true)}
            className="bg-brand-navy text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-brand-teal transition-all duration-300 shadow-xl"
          >
            Subscribe to Newsletter
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
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsNewsletterOpen(false)}
                className="absolute top-6 right-6 p-2 text-brand-navy/20 hover:text-brand-coral transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="p-12">
                {!isSubscribed ? (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <h3 className="text-3xl font-serif text-brand-navy">Be the first to know</h3>
                      <p className="text-sm text-gray-500">Subscribe to our newsletter to receive the latest updates, promotions and news.</p>
                    </div>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmitting(true);
                      // Simulate API call
                      await new Promise(r => setTimeout(r, 1500));
                      setIsSubscribed(true);
                      setIsSubmitting(false);
                    }} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 ml-4">Full Name</label>
                        <input 
                          required
                          type="text" 
                          value={newsletterForm.name}
                          onChange={(e) => setNewsletterForm({...newsletterForm, name: e.target.value})}
                          className="w-full bg-brand-paper/50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 ml-4">Email Address</label>
                        <input 
                          required
                          type="email" 
                          value={newsletterForm.email}
                          onChange={(e) => setNewsletterForm({...newsletterForm, email: e.target.value})}
                          className="w-full bg-brand-paper/50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 ml-4">Company</label>
                          <input 
                            type="text" 
                            value={newsletterForm.company}
                            onChange={(e) => setNewsletterForm({...newsletterForm, company: e.target.value})}
                            className="w-full bg-brand-paper/50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                            placeholder="Company Name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 ml-4">Country</label>
                          <input 
                            type="text" 
                            value={newsletterForm.country}
                            onChange={(e) => setNewsletterForm({...newsletterForm, country: e.target.value})}
                            className="w-full bg-brand-paper/50 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
                            placeholder="Your Country"
                          />
                        </div>
                      </div>
                      <button 
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-brand-teal text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-navy transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
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
                    className="text-center space-y-6 py-12"
                  >
                    <div className="w-20 h-20 bg-brand-teal text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-brand-teal/20">
                      <Zap size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-serif text-brand-navy">Welcome Aboard!</h3>
                      <p className="text-gray-500">You've successfully subscribed to our newsletter. Get ready for some Maldivian magic in your inbox.</p>
                    </div>
                    <button 
                      onClick={() => setIsNewsletterOpen(false)}
                      className="text-brand-teal font-bold uppercase tracking-widest text-xs hover:underline"
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
