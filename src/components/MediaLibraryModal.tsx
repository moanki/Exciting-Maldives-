import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../supabase';

interface MediaLibraryModalProps {
  onClose: () => void;
  onSelect: (media: any) => void;
  resortId?: string;
  categoryFilter?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({ onClose, onSelect, resortId, categoryFilter }) => {
  const [media, setMedia] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    let query = supabase.from('resort_media').select('*');
    if (resortId) query = query.eq('resort_id', resortId);
    if (categoryFilter) query = query.eq('category', categoryFilter);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (data) setMedia(data);
    setLoading(false);
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
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-brand-navy/40" size={18} />
          <input 
            type="text" 
            placeholder="Search media..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-brand-teal outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-4">
          {loading ? (
            <p>Loading...</p>
          ) : (
            filteredMedia.map(m => (
              <div key={m.id} className="cursor-pointer group" onClick={() => onSelect(m)}>
                <div className="aspect-square rounded-xl overflow-hidden mb-2 border-2 border-transparent group-hover:border-brand-teal transition-all">
                  <img src={m.storage_path} alt={m.original_filename} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] font-bold text-brand-navy truncate">{m.original_filename}</p>
                <p className="text-[8px] text-brand-navy/40 uppercase">{m.category}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
