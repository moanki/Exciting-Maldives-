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
  setUploadProgress: (p: number | null) => void;
}

import { uploadResortFile } from '../pages/AdminDashboard';

export const ResortEditForm: React.FC<ResortEditFormProps> = ({ formData, setFormData, editingResort, handleSave, setIsAdding, showNotification, setUploadProgress }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Accommodation', 'Dining', 'Experiences', 'Media', 'Documents', 'Import Media'];
  const [media, setMedia] = useState<any[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importedMedia, setImportedMedia] = useState<any[]>([]); // Media to review

  useEffect(() => {
    if (editingResort) {
      fetchMedia();
    }
  }, [editingResort]);

  const fetchMedia = async () => {
    if (!editingResort?.id) return;
    const { data, error } = await supabase
      .from('resort_media')
      .select('*')
      .eq('resort_id', editingResort.id);
    if (data) setMedia(data);
  };

  const handleDeleteMedia = async (id: string, path: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    try {
      // Delete from storage
      await supabase.storage.from('resorts').remove([path]);
      // Delete from database
      await supabase.from('resort_media').delete().eq('id', id);
      
      setMedia(media.filter(m => m.id !== id));
      showNotification('Media deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Failed to delete media');
    }
  };

  const handleImport = async () => {
    if (!importUrl) return;
    if (!editingResort?.id) {
      showNotification('Please save the resort first before importing media');
      return;
    }
    setIsImporting(true);
    showNotification('Importing media...');
    
    try {
      // Call backend API to process import
      const response = await fetch('/api/import-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, resort_id: editingResort.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to import');
      }
      
      const data = await response.json();
      if (data.media && data.media.length > 0) {
        setImportedMedia(data.media);
        showNotification(`Found ${data.media.length} images. Please review and assign.`);
      } else {
        showNotification('No images found at the provided URL.');
      }
      
      setImportUrl('');
    } catch (error: any) {
      console.error('Import error:', error);
      showNotification(error.message || 'Failed to import media');
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
                    {m.is_hero && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-brand-teal text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-sm">
                        Hero
                      </div>
                    )}
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
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif text-brand-navy">Import Media</h3>
            {importedMedia.length > 0 && (
              <button 
                type="button" 
                onClick={() => setImportedMedia([])}
                className="text-[10px] font-bold uppercase tracking-widest text-brand-coral hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {importedMedia.length > 0 ? (
            <div className="space-y-8">
              <div className="bg-brand-teal/5 border border-brand-teal/20 p-4 rounded-2xl">
                <p className="text-xs text-brand-teal font-medium">
                  Found {importedMedia.length} images. Review the categories below and click "Save All" to permanently store them.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {categories.map(category => {
                  const items = importedMedia.filter(m => m.category === category);
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/60">{category}</h4>
                        <span className="px-2 py-0.5 bg-brand-navy/5 rounded-full text-[9px] font-bold text-brand-navy/40">{items.length}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {importedMedia.map((m, i) => {
                          if (m.category !== category) return null;
                          return (
                            <div key={i} className="group relative bg-white border border-brand-navy/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                              <div className="aspect-video relative">
                                <img src={m.storage_path} alt="Imported" className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newMedia = [...importedMedia];
                                    newMedia.splice(i, 1);
                                    setImportedMedia(newMedia);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <div className="p-3 space-y-2">
                                <select 
                                  value={m.category} 
                                  onChange={(e) => {
                                    const newMedia = [...importedMedia];
                                    newMedia[i] = { ...newMedia[i], category: e.target.value };
                                    setImportedMedia(newMedia);
                                  }} 
                                  className="w-full bg-brand-paper/50 border border-brand-navy/10 rounded-lg px-2 py-1.5 text-[10px] font-medium focus:border-brand-teal outline-none"
                                >
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={m.is_hero}
                                    onChange={(e) => {
                                      const newMedia = [...importedMedia];
                                      newMedia[i] = { ...newMedia[i], is_hero: e.target.checked };
                                      setImportedMedia(newMedia);
                                    }}
                                    className="w-3 h-3 rounded border-brand-navy/20 text-brand-teal focus:ring-brand-teal"
                                  />
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-navy/40">Hero Image</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-0 bg-white/80 backdrop-blur-md p-4 border-t border-brand-navy/10 flex justify-between items-center rounded-b-2xl">
                <div className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                  {importedMedia.length} Items Ready
                </div>
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={async () => {
                    if (!editingResort?.id) {
                      showNotification('Error: Resort ID missing');
                      return;
                    }
                    
                    setIsSaving(true);
                    showNotification('Uploading and saving reviewed media...');
                    try {
                      const mediaToInsert = [];
                      
                      for (let i = 0; i < importedMedia.length; i++) {
                        const item = importedMedia[i];
                        let storagePath = item.storage_path;
                        
                        if (storagePath && storagePath.startsWith('http')) {
                          try {
                            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(storagePath)}`;
                            const response = await fetch(proxyUrl);
                            if (!response.ok) throw new Error(`Proxy failed with status ${response.status}`);
                            const blob = await response.blob();
                            const fileName = item.original_filename || `imported_${i}_${Date.now()}.jpg`;
                            const file = new File([blob], fileName, { type: blob.type });
                            
                            const internalUrl = await uploadResortFile(
                              file, 
                              formData.name || editingResort.name, 
                              item.category, 
                              setUploadProgress, 
                              showNotification
                            );
                            
                            if (internalUrl) {
                              storagePath = internalUrl;
                            }
                          } catch (uploadErr) {
                            console.error(`Failed to upload imported image ${i}:`, uploadErr);
                            throw new Error(`Failed to upload image ${i + 1}. Please check your connection.`);
                          }
                        }
                        
                        if (!storagePath) {
                          throw new Error(`Image ${i + 1} is missing a valid URL.`);
                        }

                        mediaToInsert.push({ 
                          resort_id: editingResort.id,
                          storage_path: storagePath,
                          category: item.category,
                          status: 'active',
                          is_hero: item.is_hero || item.category === 'hero',
                          is_featured: item.is_hero || ['hero', 'aerial'].includes(item.category)
                        });
                      }
                      
                      const { error } = await supabase.from('resort_media').insert(mediaToInsert);
                      if (error) throw error;

                      await fetchMedia();
                      setImportedMedia([]);
                      showNotification('Media assigned and saved successfully');
                    } catch (err: any) {
                      console.error('Unexpected save error:', err);
                      showNotification('Error: ' + (err.message || 'Failed to save media'));
                    } finally {
                      setIsSaving(false);
                      setUploadProgress(null);
                    }
                  }} 
                  className="bg-brand-teal text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save All'}
                </button>
              </div>
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
