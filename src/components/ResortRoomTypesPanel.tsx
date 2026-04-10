import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const TextInput = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all" />
  </div>
);

const TextAreaInput = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all h-32" />
  </div>
);

interface ResortRoomTypesPanelProps {
  roomTypes: any[];
  setRoomTypes: (types: any[]) => void;
  media: any[];
  setActiveMediaField: (field: string) => void;
  setIsMediaLibraryOpen: (open: boolean) => void;
}

export const ResortRoomTypesPanel: React.FC<ResortRoomTypesPanelProps> = ({ roomTypes, setRoomTypes, media, setActiveMediaField, setIsMediaLibraryOpen }) => (
  <section>
    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy mb-6">Room Types</h3>
    <div className="space-y-4">
      {roomTypes.map((rt, index) => (
        <div key={index} className="bg-white border border-brand-navy/5 rounded-2xl p-6 flex gap-6 shadow-sm">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-brand-paper/50 border border-brand-navy/10 flex-shrink-0">
            {(() => {
              const matchingMedia = media.find(m => 
                (m.resort_media_categories?.key === 'room_types' || m.category === 'rooms') && 
                (m.room_type_name?.toLowerCase() === rt.name?.toLowerCase() || 
                 m.subcategory?.toLowerCase() === rt.name?.toLowerCase() || 
                 m.original_filename?.toLowerCase().includes(rt.name?.toLowerCase()))
              );
              const preview = rt.image_url || matchingMedia?.storage_path;
              
              return preview ? (
                <img src={preview} alt={rt.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-navy/20">
                  <ImageIcon size={24} />
                </div>
              );
            })()}
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <TextInput label="Name" value={rt.name} onChange={(v: string) => {
                const newTypes = [...roomTypes];
                newTypes[index].name = v;
                setRoomTypes(newTypes);
              }} />
              <TextAreaInput label="Description" value={rt.description} onChange={(v: string) => {
                const newTypes = [...roomTypes];
                newTypes[index].description = v;
                setRoomTypes(newTypes);
              }} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => {
                setActiveMediaField(`room_type_${index}`);
                setIsMediaLibraryOpen(true);
              }} className="text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:underline">Change Photo</button>
              <button type="button" onClick={() => setRoomTypes(roomTypes.filter((_, i) => i !== index))} className="text-[10px] font-bold uppercase tracking-widest text-brand-coral hover:underline">Remove</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setRoomTypes([...roomTypes, { name: '', description: '', image_url: '' }])} className="w-full border-2 border-dashed border-brand-navy/10 rounded-2xl p-6 text-brand-navy/40 hover:border-brand-teal hover:text-brand-teal transition-all text-[10px] font-bold uppercase tracking-widest">Add Room Type</button>
    </div>
  </section>
);
