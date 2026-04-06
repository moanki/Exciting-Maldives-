import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, FileText, Globe, MapPin, Hotel, Coffee, Palmtree } from 'lucide-react';
import { supabase } from '../supabase';

const TextInput = ({ label, value, onChange, icon, type = 'text' }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all" />
  </div>
);

const TextAreaInput = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all h-32" />
  </div>
);

interface ResortEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
  editingResort: any;
  handleSave: (e: React.FormEvent) => void;
  setIsAdding: (val: boolean) => void;
  showNotification: (msg: string) => void;
}

export const ResortEditForm: React.FC<ResortEditFormProps> = ({ formData, setFormData, editingResort, handleSave, setIsAdding, showNotification }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Accommodation', 'Dining', 'Experiences', 'Media', 'Documents', 'Import Media'];
  const [media, setMedia] = useState<any[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importedMedia, setImportedMedia] = useState<any[]>([]); // Media to review

  useEffect(() => {
    if (editingResort) {
      fetchMedia();
    }
  }, [editingResort]);

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from('resort_media')
      .select('*')
      .eq('resort_id', editingResort.id);
    if (data) setMedia(data);
  };

  const handleDeleteMedia = async (id: string, path: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    // Delete from storage
    await supabase.storage.from('resorts').remove([path]);
    // Delete from database
    await supabase.from('resort_media').delete().eq('id', id);
    
    setMedia(media.filter(m => m.id !== id));
    showNotification('Media deleted successfully');
  };

  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    showNotification('Importing media...');
    
    try {
      // Call backend API to process import
      const response = await fetch('/api/import-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, resort_id: editingResort.id }),
      });
      
      if (!response.ok) throw new Error('Failed to import');
      
      // Simulate receiving media to review
      const mockImportedMedia = [
        { id: 'new-1', storage_path: 'https://picsum.photos/seed/1/200/200', category: 'hero' },
        { id: 'new-2', storage_path: 'https://picsum.photos/seed/2/200/200', category: 'villa' },
      ];
      setImportedMedia(mockImportedMedia);
      
      setImportUrl('');
      showNotification('Media imported. Please review and assign.');
    } catch (error) {
      showNotification('Failed to import media');
    } finally {
      setIsImporting(false);
    }
  };

  const categories = ['hero', 'aerial', 'villa', 'dining', 'spa', 'activity', 'map'];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex gap-4 border-b border-brand-navy/10 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${activeTab === tab ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-brand-navy/40'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput label="Resort Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="e.g. Soneva Jani" />
            <TextInput label="Atoll" value={formData.atoll} onChange={(v: string) => setFormData({...formData, atoll: v})} placeholder="e.g. Noonu Atoll" />
          </div>
          <TextAreaInput label="Description" value={formData.description} onChange={(v: string) => setFormData({...formData, description: v})} placeholder="Brief overview of the resort..." />
        </div>
      )}
      
      {activeTab === 'Media' && (
        <div className="space-y-6">
          <h3 className="text-xl font-serif text-brand-navy">Media Management</h3>
          {categories.map(category => (
            <div key={category} className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{category}</h4>
              <div className="grid grid-cols-4 gap-4">
                {media.filter(m => m.category === category).map(m => (
                  <div key={m.id} className="relative group">
                    <img src={m.storage_path} alt={m.alt_text} className="w-full h-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => handleDeleteMedia(m.id, m.storage_path)} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100"><Trash2 size={14} className="text-brand-coral" /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Import Media' && (
        <div className="space-y-6">
          <h3 className="text-xl font-serif text-brand-navy">Import Media</h3>
          {importedMedia.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Review & Assign</h4>
              <div className="grid grid-cols-2 gap-4">
                {importedMedia.map((m, i) => (
                  <div key={m.id} className="p-4 bg-brand-paper/30 rounded-2xl flex gap-4 items-center">
                    <img src={m.storage_path} alt="Imported" className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <select value={m.category} onChange={(e) => {
                        const newMedia = [...importedMedia];
                        newMedia[i].category = e.target.value;
                        setImportedMedia(newMedia);
                      }} className="w-full bg-white border border-brand-navy/10 rounded-lg px-2 py-1 text-xs">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={async () => {
                // Save importedMedia to database
                await supabase.from('resort_media').insert(importedMedia.map(m => ({ ...m, resort_id: editingResort.id })));
                await fetchMedia();
                setImportedMedia([]);
                showNotification('Media assigned successfully');
              }} className="bg-brand-teal text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all">
                Save All
              </button>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-brand-navy/10 rounded-2xl text-center space-y-4">
              <Upload className="mx-auto text-brand-teal" size={32} />
              <p className="text-sm text-brand-navy/60">Drag & drop media files or folders here, or paste a Google Drive/Dropbox URL.</p>
              <input type="text" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Paste URL here..." className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all" />
              <button type="button" onClick={handleImport} disabled={isImporting} className="bg-brand-teal text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all disabled:opacity-50">
                {isImporting ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-4 pt-6">
        <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-navy transition-all">Cancel</button>
        <button type="submit" className="bg-brand-navy text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-xl shadow-brand-navy/20">
          {editingResort ? 'Update Resort' : 'Add Resort'}
        </button>
      </div>
    </form>
  );
};
