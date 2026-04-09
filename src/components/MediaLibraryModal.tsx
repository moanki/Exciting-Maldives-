import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface MediaLibraryModalProps {
  onClose: () => void;
  onSelect: (media: any) => void;
  resortId?: string;
  initialCategory?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ onClose, onSelect, resortId, initialCategory }) => {
  const [media, setMedia] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const legacyMap: Record<string, string> = {
    'banner': 'main_hero',
    'rooms': 'room_types',
    'dining': 'restaurants'
  };

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (initialCategory && legacyMap[initialCategory]) {
      return legacyMap[initialCategory];
    }
    return initialCategory || 'all';
  });
  const [showThisResortOnly, setShowThisResortOnly] = useState(!!resortId);

  const defaultCategories = [
    { key: 'all', label: 'All Media' },
    { key: 'main_hero', label: 'Main Hero' },
    { key: 'overview', label: 'Overview' },
    { key: 'room_types', label: 'Room Types' },
    { key: 'spa', label: 'Spa' },
    { key: 'restaurants', label: 'Restaurants' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'activities', label: 'Activities' },
    { key: 'beaches', label: 'Beaches' },
    { key: 'maps', label: 'Maps / Floor Plans' },
    { key: 'logos', label: 'Logos' },
    { key: 'uncategorized', label: 'Uncategorized' }
  ];

  useEffect(() => {
    if (resortId) {
      fetchCategories();
    }
  }, [resortId]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('resort_media_categories')
      .select('*')
      .eq('resort_id', resortId)
      .order('sort_order', { ascending: true });
    if (data) setDbCategories(data);
  };

  useEffect(() => {
    fetchMedia();
  }, [selectedCategory, showThisResortOnly, dbCategories]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let query = supabase.from('resort_media').select('*, resorts(name), resort_media_categories(key, label)');
      
      if (showThisResortOnly && resortId) {
        query = query.eq('resort_id', resortId);
      }
      
      if (selectedCategory !== 'all') {
        if (selectedCategory.startsWith('category_')) {
          query = query.eq('category_id', selectedCategory.split('_')[1]);
        } else {
          // Handle both new keys and legacy categories
          const conditions = [`category.eq.${selectedCategory}`];
          
          // Add legacy key if it exists
          const legacyKey = Object.keys(legacyMap).find(key => legacyMap[key] === selectedCategory);
          if (legacyKey) {
            conditions.push(`category.eq.${legacyKey}`);
          }

          // Add category_id if we have a matching DB category for this key
          const matchingDbCat = dbCategories.find(c => c.key === selectedCategory);
          if (matchingDbCat) {
            conditions.push(`category_id.eq.${matchingDbCat.id}`);
          }
          
          query = query.or(conditions.join(','));
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (data) setMedia(data);
    } catch (err) {
      console.error('Error fetching media library:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter(m => 
    m.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-[32px] p-8 shadow-2xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif text-brand-navy">Media Library</h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-paper rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-brand-navy/40" size={18} />
            <input 
              type="text" 
              placeholder="Search media..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-brand-teal outline-none"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none"
          >
            {defaultCategories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
            {dbCategories.map(cat => (
              <option key={cat.id} value={`category_${cat.id}`}>{cat.label}</option>
            ))}
          </select>
          {resortId && (
            <label className="flex items-center gap-2 cursor-pointer bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3">
              <input 
                type="checkbox" 
                checked={showThisResortOnly}
                onChange={(e) => setShowThisResortOnly(e.target.checked)}
                className="w-4 h-4 rounded border-brand-navy/20 text-brand-teal focus:ring-brand-teal"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-navy/60">This Resort Only</span>
            </label>
          )}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4 pr-2">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-brand-teal" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Loading Media...</p>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <ImageIcon className="text-brand-navy/10" size={48} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">No media found</p>
            </div>
          ) : (
            filteredMedia.map(m => (
              <div key={m.id} className="cursor-pointer group relative" onClick={() => onSelect(m)}>
                <div className="aspect-square rounded-2xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-brand-teal transition-all shadow-sm group-hover:shadow-md">
                  <img src={m.storage_path} alt={m.original_filename} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="px-1">
                  <p className="text-[10px] font-bold text-brand-navy truncate">{m.original_filename}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[8px] text-brand-navy/40 uppercase font-bold tracking-widest">
                      {m.resort_media_categories?.label || m.category}
                    </p>
                    {m.resorts?.name && (
                      <p className="text-[8px] text-brand-teal font-bold truncate max-w-[60px]">{m.resorts.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
