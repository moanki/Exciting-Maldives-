import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Handshake, Gem, Zap, MessageSquare } from 'lucide-react';
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
  const [heroData, setHeroData] = useState({
    title: 'Exciting Maldives',
    subtitle: 'Bespoke Destination Management',
    banner_url: '',
    title_color: '#ffffff',
    button_color: '#008080'
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch Site Settings using the helper
      const settings = await getSiteSettings();
      
      if (settings.hero) {
        setHeroData({
          title: settings.hero.title || 'Exciting Maldives',
          subtitle: settings.hero.subtitle || 'Bespoke Destination Management',
          banner_url: settings.hero.banner_url || 'https://picsum.photos/seed/maldives/1920/1080',
          title_color: settings.hero.title_color || '#ffffff',
          button_color: settings.hero.button_color || '#008080'
        });

        // Automatic color detection
        const img = new Image();
        img.src = settings.hero.banner_url || 'https://picsum.photos/seed/maldives/1920/1080';
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const color = getColorSync(img);
          if (color) {
            const hex = color.hex();
            
            // Only update if user hasn't set a color
            if (!settings.hero.title_color) {
              setHeroData(prev => ({ ...prev, title_color: hex, button_color: hex }));
            }
          }
        };
      }

      if (settings.why_us) {
        setWhyUsPillars(settings.why_us);
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
          <h1 className="text-5xl md:text-7xl font-serif mb-6" style={{ color: heroData.title_color }}>{heroData.title}</h1>
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
        <h2 className="text-4xl font-serif mb-6 text-brand-navy">Bespoke Destination Management</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships. 
          We offer tailored, high-end travel solutions that highlight the beauty and culture of the Maldives, 
          ensuring our partners can deliver unforgettable and seamless experiences to their clients.
        </p>
      </section>

      {/* Section 2: Core Values */}
      <section className="py-20 px-10 bg-gradient-to-b from-brand-paper/50 to-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {whyUsPillars.map((item, i) => (
            <div key={i} className="p-8 bg-white rounded-3xl shadow-sm border border-brand-paper/50 hover:shadow-md transition-shadow duration-300 flex flex-col">
              <div className="flex justify-end mb-6">
                <Zap className="w-8 h-8 text-brand-teal" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-4 text-brand-navy">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed flex-grow">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Featured Retreats */}
      <section className="py-20 px-10 bg-[#f5f2ed] overflow-hidden">
        <h2 className="text-4xl font-serif text-center mb-12">Featured Retreats</h2>
        <FeaturedRetreatsCarousel resorts={featuredResorts} />
      </section>

      {/* Section 4: Calls to Action */}
      <section className="py-20 px-10 bg-white text-center">
        <div className="flex flex-col md:flex-row justify-center gap-10">
          <div className="p-10 border border-gray-200 rounded-lg w-full md:w-1/3">
            <h3 className="text-2xl font-bold mb-4">Become a Partner</h3>
            <Link to="/become-partner">
              <button className="bg-[#1a1a1a] text-white px-8 py-3 rounded-full">Request Form</button>
            </Link>
          </div>
          <div className="p-10 border border-gray-200 rounded-lg w-full md:w-1/3">
            <h3 className="text-2xl font-bold mb-4">Travel Guide</h3>
            <Link to="/tourist-info">
              <button className="bg-[#1a1a1a] text-white px-8 py-3 rounded-full">View Guide</button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
