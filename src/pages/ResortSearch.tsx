import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { Search, Filter, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function ResortSearch() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [resorts, setResorts] = useState<any[]>([]);
  const [filteredResorts, setFilteredResorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [atollFilter, setAtollFilter] = useState('All');

  useEffect(() => {
    const fetchResorts = async () => {
      const { data, error } = await supabase
        .from('resorts')
        .select('*');
      
      if (data) {
        setResorts(data);
      }
      setLoading(false);
    };
    fetchResorts();
  }, []);

  useEffect(() => {
    let result = resorts;

    if (searchTerm) {
      result = result.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.atoll.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      result = result.filter(r => r.category === categoryFilter);
    }

    if (atollFilter !== 'All') {
      result = result.filter(r => r.atoll === atollFilter);
    }

    setFilteredResorts(result);
  }, [searchTerm, categoryFilter, atollFilter, resorts]);

  const categories = ['All', ...new Set(resorts.map(r => r.category))];
  const atolls = ['All', ...new Set(resorts.map(r => r.atoll))];

  return (
    <div className="pt-10 pb-24 px-4 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-serif mb-4 text-brand-navy">Explore <span className="italic text-brand-teal">Resorts</span></h1>
        <p className="text-brand-navy/50 font-bold tracking-[0.3em] uppercase text-[10px] font-sans">Discover your next Maldivian escape</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5 mb-12 flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/30" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or atoll..."
            className="w-full pl-12 pr-4 py-3 bg-brand-paper/50 border-none rounded-2xl focus:ring-2 focus:ring-brand-teal/20 font-sans text-brand-navy"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="flex-1 lg:w-48">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 ml-2 font-sans">Category</label>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-brand-paper/50 border-none rounded-2xl py-3 focus:ring-2 focus:ring-brand-teal/20 text-sm font-sans text-brand-navy"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 lg:w-48">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 ml-2 font-sans">Atoll</label>
            <select 
              value={atollFilter}
              onChange={(e) => setAtollFilter(e.target.value)}
              className="w-full bg-brand-paper/50 border-none rounded-2xl py-3 focus:ring-2 focus:ring-brand-teal/20 text-sm font-sans text-brand-navy"
            >
              {atolls.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-brand-paper/50 rounded-3xl h-96"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold font-sans">
            Showing {filteredResorts.length} results
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResorts.map((resort, idx) => (
              <motion.div 
                key={resort.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-3xl overflow-hidden border border-brand-navy/5 hover:shadow-2xl hover:shadow-brand-navy/10 transition-all"
              >
                <Link to={`/resorts/${resort.id}`}>
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={resort.images?.[0] || `https://picsum.photos/seed/${resort.name}/800/600`} 
                      alt={resort.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans text-brand-navy">
                      {resort.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-serif text-brand-navy">{resort.name}</h3>
                      <div className="flex items-center text-brand-teal">
                        <MapPin size={14} className="mr-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">{resort.atoll}</span>
                      </div>
                    </div>
                    <p className="text-brand-navy/60 text-sm line-clamp-2 mb-6 font-sans font-light leading-relaxed">
                      {resort.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-brand-paper">
                      <span className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold font-sans">Transfer: {resort.transfer_type}</span>
                      <span className="text-brand-navy group-hover:text-brand-teal transition-colors flex items-center text-[10px] font-bold uppercase tracking-widest font-sans">
                        Details <ChevronRight size={16} className="ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {filteredResorts.length === 0 && (
            <div className="text-center py-24">
              <div className="text-brand-beige mb-4 flex justify-center">
                <Search size={64} />
              </div>
              <h3 className="text-2xl font-serif mb-2 text-brand-navy">No resorts found</h3>
              <p className="text-brand-navy/50 font-sans">Try adjusting your search or filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
