import React from 'react';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

const TextInput = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all" />
  </div>
);

const TextAreaInput = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all h-32" />
  </div>
);

interface ResortOverviewPanelProps {
  formData: any;
  setFormData: (data: any) => void;
  category: string;
  setCategory: (val: string) => void;
  transfer: string;
  setTransfer: (val: string) => void;
  about: string;
  setAbout: (val: string) => void;
  mealPlans: string;
  setMealPlans: (val: string) => void;
  highlights: string;
  setHighlights: (val: string) => void;
  bannerUrl: string;
  media: any[];
  handleGenerateAICopy: () => void;
  isGeneratingAI: boolean;
  setActiveMediaField: (field: string) => void;
  setIsMediaLibraryOpen: (open: boolean) => void;
}

export const ResortOverviewPanel: React.FC<ResortOverviewPanelProps> = ({
  formData, setFormData, category, setCategory, transfer, setTransfer, about, setAbout, mealPlans, setMealPlans, highlights, setHighlights, bannerUrl, media, handleGenerateAICopy, isGeneratingAI, setActiveMediaField, setIsMediaLibraryOpen
}) => (
  <div className="space-y-12">
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy mb-6">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TextInput label="Resort Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="e.g. Soneva Jani" />
        <TextInput label="Atoll" value={formData.atoll} onChange={(v: string) => setFormData({...formData, atoll: v})} placeholder="e.g. Noonu Atoll" />
        <TextInput label="Category" value={category} onChange={setCategory} placeholder="e.g. Luxury" />
        <TextInput label="Transfer Type" value={transfer} onChange={setTransfer} placeholder="e.g. Seaplane" />
      </div>
    </section>

    <section>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Description</h3>
        <button
          type="button"
          onClick={handleGenerateAICopy}
          disabled={isGeneratingAI}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50"
        >
          {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isGeneratingAI ? 'Generating...' : 'Magic AI Assistant'}
        </button>
      </div>
      <TextAreaInput label="About" value={about} onChange={setAbout} placeholder="About the resort..." />
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy mb-6">Commercial Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TextAreaInput label="Meal Plans" value={mealPlans} onChange={setMealPlans} placeholder="e.g. Half Board, Full Board, All Inclusive" />
        <TextAreaInput label="Highlights" value={highlights} onChange={setHighlights} placeholder="e.g. Overwater slide, Underwater restaurant" />
      </div>
    </section>
    
    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy mb-6">Main Hero Image</h3>
      <div className="flex items-center gap-6 p-6 bg-brand-paper/30 border border-brand-navy/5 rounded-2xl">
        <div className="w-48 h-24 rounded-xl overflow-hidden bg-brand-paper/50 border border-brand-navy/10 relative">
          {(() => {
            const preview = bannerUrl || 
                          media.find(m => m.is_hero)?.storage_path || 
                          media.find(m => m.resort_media_categories?.key === 'main_hero' || m.category === 'banner')?.storage_path || 
                          media[0]?.storage_path;
            
            return preview ? (
              <img src={preview} alt="Banner Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-navy/20">
                <ImageIcon size={24} />
              </div>
            );
          })()}
        </div>
        <button type="button" onClick={() => {
          setActiveMediaField('banner');
          setIsMediaLibraryOpen(true);
        }} className="text-xs font-bold uppercase tracking-widest text-brand-teal hover:underline">Change Photo</button>
      </div>
    </section>
  </div>
);
