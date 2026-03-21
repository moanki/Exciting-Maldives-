import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function PublicHome() {
  const [featuredResorts, setFeaturedResorts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data, error } = await supabase
        .from('resorts')
        .select('*')
        .eq('is_featured', true)
        .limit(3);
      
      if (data) {
        setFeaturedResorts(data);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/maldives/1920/1080" 
            alt="Maldives Hero" 
            className="w-full h-full object-cover brightness-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f5f2ed]"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-serif text-white mb-6 leading-tight"
          >
            The Art of <br />
            <span className="italic">Maldivian</span> Luxury
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-white/90 text-lg md:text-xl font-sans font-light tracking-widest uppercase mb-12"
          >
            Exclusive B2B Portal for Travel Professionals
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-xl p-2 rounded-full flex items-center max-w-2xl mx-auto border border-white/20"
          >
            <div className="flex-1 flex items-center px-6">
              <Search className="text-white/60 mr-3" size={20} />
              <input 
                type="text" 
                placeholder="Search resorts, atolls, or categories..."
                className="bg-transparent border-none focus:ring-0 text-white placeholder-white/60 w-full text-sm font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Link 
              to={`/resorts?q=${searchQuery}`}
              className="bg-white text-brand-ink px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all font-sans"
            >
              Explore
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Resorts */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-brand-teal font-bold mb-2 block font-sans">Curated Selection</span>
            <h2 className="text-4xl font-serif text-brand-ink">Featured Retreats</h2>
          </div>
          <Link to="/resorts" className="group flex items-center text-sm font-bold uppercase tracking-widest hover:text-brand-teal transition-colors font-sans">
            View All <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredResorts.length > 0 ? featuredResorts.map((resort, idx) => (
            <motion.div 
              key={resort.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
            >
              <Link to={`/resorts/${resort.id}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl mb-6">
                  <img 
                    src={resort.images?.[0] || `https://picsum.photos/seed/${resort.name}/600/800`} 
                    alt={resort.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans">
                    {resort.category}
                  </div>
                </div>
                <h3 className="text-xl font-serif mb-2">{resort.name}</h3>
                <div className="flex items-center text-xs text-gray-500 uppercase tracking-widest font-sans">
                  <MapPin size={12} className="mr-1" /> {resort.atoll}
                </div>
              </Link>
            </motion.div>
          )) : (
            // Skeleton / Placeholder
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-3xl mb-6"></div>
                <div className="h-6 bg-gray-200 w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 w-1/2"></div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-ink py-24 px-4 text-center text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight">Partner with the Maldives' <br /><span className="italic">Leading B2B Experts</span></h2>
          <p className="text-white/60 mb-12 font-sans font-light text-lg leading-relaxed">
            Gain access to exclusive rates, real-time availability, and AI-powered sales tools designed to elevate your travel business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-white text-brand-ink px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all font-sans">
              Become an Agent
            </Link>
            <Link to="/tourist-info" className="border border-white/20 px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-brand-ink transition-all font-sans">
              Travel Guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
