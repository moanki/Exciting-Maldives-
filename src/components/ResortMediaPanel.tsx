import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface ResortMediaPanelProps {
  dbCategories: any[];
  defaultCategories: any[];
  media: any[];
  handleDeleteMedia: (id: string, path: string) => void;
  setActiveMediaField: (field: string) => void;
  setIsMediaLibraryOpen: (open: boolean) => void;
  legacyToNewCategoryMap: Record<string, string>;
}

export const ResortMediaPanel: React.FC<ResortMediaPanelProps> = ({ dbCategories, defaultCategories, media, handleDeleteMedia, setActiveMediaField, setIsMediaLibraryOpen, legacyToNewCategoryMap }) => (
  <div className="space-y-12">
    <div className="flex justify-between items-center">
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Media Management</h3>
      {dbCategories.length === 0 && (
        <p className="text-[10px] text-brand-coral font-bold uppercase tracking-widest">
          Warning: No categories found in database. Using defaults.
        </p>
      )}
    </div>
    {(dbCategories.length > 0 ? dbCategories : defaultCategories).map(category => (
      <section key={category.id || category.key} className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{category.label || category.key}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.filter(m => 
            (category.id && m.category_id === category.id) || 
            (!category.id && (m.category === category.key || legacyToNewCategoryMap[m.category] === category.key))
          ).map(m => (
            <div key={m.id} className="group relative aspect-square rounded-xl overflow-hidden bg-brand-paper/50 border border-brand-navy/5">
              <img src={m.storage_path} alt={m.original_filename} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              {m.is_hero && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-brand-teal text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-sm">
                  Hero
                </div>
              )}
              <button type="button" onClick={() => handleDeleteMedia(m.id, m.storage_path)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} className="text-brand-coral" /></button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => {
              setActiveMediaField(category.id ? `category_${category.id}` : category.key);
              setIsMediaLibraryOpen(true);
            }}
            className="aspect-square border-2 border-dashed border-brand-navy/10 rounded-xl flex flex-col items-center justify-center text-brand-navy/40 hover:border-brand-teal hover:text-brand-teal transition-all"
          >
            <Plus size={24} />
            <span className="text-[9px] font-bold uppercase tracking-widest mt-2">Add</span>
          </button>
        </div>
      </section>
    ))}
  </div>
);
