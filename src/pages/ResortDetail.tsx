import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Plane, Coffee, Home, Star, ArrowLeft, CheckCircle, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MediaLightbox } from '../components/MediaLightbox';
import { MediaGallerySection } from '../components/MediaGallerySection';

export default function ResortDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resort, setResort] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lightbox State
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    media: [] as any[],
    title: '',
    initialIndex: 0,
    showFilters: false
  });

  useEffect(() => {
    const fetchResort = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('resorts')
        .select('*, resort_media(*, resort_media_categories(*))')
        .eq('id', id)
        .single();
      
      if (data) {
        setResort(data);
      }
      setLoading(false);
    };
    fetchResort();
  }, [id]);

  if (!resort && !loading) return <div className="h-screen flex items-center justify-center font-serif text-xl text-brand-navy">Resort not found</div>;
  if (!resort) return null;

  // Categorized Galleries using new keys and legacy fallback
  const getMediaByKeys = (keys: string[], legacyCategory: string) => {
    return resort.resort_media?.filter((m: any) => 
      keys.includes(m.resort_media_categories?.key) || (!m.resort_media_categories && m.category === legacyCategory)
    );
  };

  const diningMedia = getMediaByKeys(['restaurants', 'dining'], 'dining');
  const spaMedia = getMediaByKeys(['spa'], 'spa');
  const activityMedia = getMediaByKeys(['activities', 'experiences'], 'activities');
  const roomMedia = getMediaByKeys(['room_types', 'rooms'], 'rooms');
  const mapMedia = getMediaByKeys(['maps'], 'maps');
  const facilitiesMedia = getMediaByKeys(['facilities'], 'facilities');
  const beachMedia = getMediaByKeys(['beaches'], 'beaches');

  const allMedia = resort.resort_media || [];

  const openLightbox = (media: any[], title: string, index: number = 0, showFilters: boolean = false) => {
    setLightbox({
      isOpen: true,
      media,
      title,
      initialIndex: index,
      showFilters
    });
  };

  const heroImage = resort.resort_media?.find((m: any) => m.is_hero)?.storage_path || 
                    resort.resort_media?.find((m: any) => m.resort_media_categories?.key === 'main_hero')?.storage_path ||
                    resort.banner_url ||
                    resort.resort_media?.find((m: any) => m.category === 'banner')?.storage_path ||
                    resort.resort_media?.[0]?.storage_path || 
                    `https://images.unsplash.com/photo-1514282401047-d79a71a590e8`;

  return (
    <div className="pb-24 bg-brand-paper/20">
      {/* Hero Gallery */}
      <div className="relative h-[70vh] group">
        <img 
          src={heroImage} 
          alt={resort.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent"></div>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 md:top-8 md:left-8 bg-white/20 backdrop-blur-md text-white p-2 md:p-3 rounded-full hover:bg-white hover:text-brand-navy transition-all z-20"
        >
          <ArrowLeft size={20} className="md:size-24" />
        </button>
        
        <div className="absolute bottom-8 md:bottom-12 left-6 right-6 md:left-8 md:right-8 max-w-7xl mx-auto">
          <div className="flex items-center text-white/80 uppercase tracking-[0.4em] text-[8px] md:text-[10px] font-bold mb-2 md:mb-4 font-sans">
            <MapPin size={12} className="mr-2 text-brand-beige" /> {resort.atoll}, Maldives
          </div>
          <h1 className="text-3xl md:text-7xl font-serif text-white mb-4 leading-tight">{resort.name}</h1>
          <div className="flex gap-3 md:gap-4">
            <span className="bg-brand-teal text-white px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest font-sans">
              {resort.category}
            </span>
            <span className="bg-white/20 backdrop-blur text-white px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest font-sans">
              {resort.transfer_type}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-3xl font-serif mb-6 text-brand-navy">About the <span className="italic text-brand-teal">Resort</span></h2>
            <div className="prose prose-stone max-w-none text-brand-navy/70 font-sans font-light leading-relaxed text-lg">
              <ReactMarkdown>{resort.description}</ReactMarkdown>
            </div>
          </section>

          {/* Categorized Gallery Sections */}
          <div className="space-y-24">
            {[
              { id: 'dining', label: 'Dining', items: diningMedia },
              { id: 'spa', label: 'Spa & Wellness', items: spaMedia },
              { id: 'activities', label: 'Experiences', items: activityMedia },
              { id: 'beaches', label: 'Beaches', items: beachMedia },
              { id: 'facilities', label: 'Facilities', items: facilitiesMedia }
            ].map(section => (
              <MediaGallerySection
                key={section.id}
                title={section.label}
                media={section.items}
                onViewMore={() => openLightbox(section.items, `${section.label} Gallery`)}
              />
            ))}
          </div>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-brand-navy/5">
            <div className="text-center">
              <Plane className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Transfer</p>
              <p className="text-sm font-bold font-sans text-brand-navy">{resort.transfer_type}</p>
            </div>
            <div className="text-center">
              <Coffee className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Meal Plans</p>
              <p className="text-sm font-bold font-sans text-brand-navy">{resort.meal_plans?.join(', ')}</p>
            </div>
            <div className="text-center">
              <Home className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Rooms</p>
              <p className="text-sm font-bold font-sans text-brand-navy">{resort.room_types?.length || 0} Types</p>
            </div>
            <div className="text-center">
              <Star className="mx-auto mb-3 text-brand-teal" size={32} />
              <p className="text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 mb-1 font-sans">Category</p>
              <p className="text-sm font-bold font-sans text-brand-navy">{resort.category}</p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-serif mb-8 text-brand-navy">Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resort.highlights?.map((h: string, i: number) => (
                <div key={i} className="flex items-center p-4 bg-white rounded-2xl border border-brand-navy/5 shadow-sm">
                  <CheckCircle className="text-brand-teal mr-3" size={20} />
                  <span className="text-brand-navy/80 font-bold font-sans text-sm tracking-wide">{h}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-serif mb-8 text-brand-navy">Room <span className="italic text-brand-teal">Types</span></h2>
            <div className="space-y-6">
              {resort.room_types?.map((room: any, i: number) => {
                const matchingMedia = roomMedia?.find((m: any) => 
                  m.room_type_name?.toLowerCase() === room.name?.toLowerCase() ||
                  m.subcategory?.toLowerCase() === room.name?.toLowerCase() || 
                  m.original_filename?.toLowerCase().includes(room.name?.toLowerCase())
                );
                const roomImage = room.image_url || matchingMedia?.storage_path || room.image || `https://images.unsplash.com/photo-1514282401047-d79a71a590e8`;

                return (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden border border-brand-navy/5 flex flex-col md:flex-row shadow-sm hover:shadow-xl hover:shadow-brand-navy/5 transition-all">
                    <div className="md:w-1/3 aspect-video md:aspect-auto">
                      <img 
                        src={`${roomImage}${roomImage.includes('unsplash') ? '&auto=format&fit=crop&q=80&w=600' : ''}`} 
                        alt={room.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="p-8 flex-1">
                      <h3 className="text-2xl font-serif mb-2 text-brand-navy">{room.name}</h3>
                      <p className="text-brand-navy/60 text-sm font-sans font-light mb-4 leading-relaxed">{room.description}</p>
                      <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold text-brand-teal font-sans">
                        <span>Max Guests: {room.max_guests}</span>
                        <span>Size: {room.size}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {mapMedia && mapMedia.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-3xl font-serif text-brand-navy">Resort <span className="italic text-brand-teal">Map</span></h2>
              <div className="rounded-3xl overflow-hidden border border-brand-navy/5 shadow-lg">
                <img src={mapMedia[0].storage_path} alt="Resort Map" className="w-full h-auto" referrerPolicy="no-referrer" />
              </div>
            </section>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 bg-white rounded-3xl p-8 shadow-2xl shadow-brand-navy/10 border border-brand-navy/5">
            <h3 className="text-2xl font-serif mb-6 text-brand-navy">Book this Resort</h3>
            <p className="text-brand-navy/60 mb-8 font-sans text-sm leading-relaxed">
              Access exclusive B2B rates, real-time availability, and instant booking confirmation through our dedicated partner portal.
            </p>
            <a 
              href="https://b2b.excitingmv.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block text-center bg-brand-navy text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal transition-all font-sans shadow-lg shadow-brand-navy/10"
            >
              Book on Partner Portal
            </a>
          </div>
        </div>
      </div>
      {/* Lightbox Component */}
      <MediaLightbox
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
        media={lightbox.media}
        title={lightbox.title}
        initialIndex={lightbox.initialIndex}
        showFilters={lightbox.showFilters}
      />
    </div>
  );
}
