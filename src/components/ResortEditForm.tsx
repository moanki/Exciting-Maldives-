import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, FileText, Globe, MapPin, Hotel, Coffee, Palmtree, AlertCircle, CheckCircle2, Loader2, X, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import JSZip from 'jszip';
import { MediaLibraryModal } from './MediaLibraryModal';
import { generateResortMarketingCopy, classifyImageWithAI } from '../services/content';

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

// Classification Helper (Frontend version for local files)
const classifyLocalMedia = (path: string, fileName: string) => {
  const combined = `${path.toLowerCase()} ${fileName.toLowerCase()}`;
  
  const keywords = {
    main_hero: ['hero', 'banner', 'cover', 'main', 'landing', 'exterior', 'aerial'],
    room_types: ['room', 'villa', 'suite', 'residence', 'bedroom', 'accommodation', 'stay', 'living'],
    restaurants: ['dining', 'restaurant', 'bar', 'breakfast', 'lunch', 'dinner', 'culinary', 'food', 'drink', 'kitchen'],
    spa: ['spa', 'wellness', 'treatment', 'massage', 'therapy', 'gym', 'fitness', 'yoga', 'pool'],
    activities: ['activity', 'experience', 'diving', 'snorkel', 'excursion', 'marine', 'dolphin', 'cruise', 'sport', 'kids', 'club'],
    maps: ['map', 'floorplan', 'floor plan', 'site plan', 'layout', 'location'],
    logos: ['logo', 'brand', 'wordmark', 'emblem', 'asset']
  };

  const subcategories = {
    'water villa': ['water villa', 'overwater', 'ocean villa'],
    'beach villa': ['beach villa', 'sand villa'],
    'residence': ['residence', 'estate', 'mansion'],
    'suite': ['suite'],
    'deluxe room': ['deluxe'],
    'family room': ['family']
  };

  let detectedCategory = 'uncategorized';
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => combined.includes(word))) {
      detectedCategory = cat;
      break;
    }
  }

  let detectedSubcategory = null;
  for (const [sub, words] of Object.entries(subcategories)) {
    if (words.some(word => combined.includes(word))) {
      detectedSubcategory = sub;
      break;
    }
  }

  return { category: detectedCategory, subcategory: detectedSubcategory };
};

// Helper to resize image
const resizeImage = (file: File, maxWidth = 1920, maxHeight = 1080): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        } else {
          reject(new Error('Canvas to Blob failed'));
        }
      }, 'image/jpeg', 0.8);
    };
    img.onerror = reject;
  });
};

export const ResortEditForm: React.FC<ResortEditFormProps> = ({ formData, setFormData, editingResort, handleSave, setIsAdding, showNotification, setUploadProgress }) => {
  console.log('ResortEditForm formData:', formData);
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Media', 'Import Media'];
  const [media, setMedia] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [importState, setImportState] = useState<'idle' | 'processing' | 'ready_for_review' | 'saving' | 'saved' | 'failed'>('idle');
  const [importedMedia, setImportedMedia] = useState<any[]>([]); 
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAICopy = async () => {
    if (!formData.name) {
      showNotification('Please enter a resort name first');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const copy = await generateResortMarketingCopy({
        name: formData.name,
        location: formData.location,
        atoll: formData.atoll,
        category: category,
        highlights: highlights.split(',').map(s => s.trim()).filter(Boolean),
        meal_plans: mealPlans.split(',').map(s => s.trim()).filter(Boolean)
      });

      if (copy) {
        setAbout(copy.luxury_description);
        setHighlights(copy.unique_selling_points.join(', '));
        showNotification('AI Marketing Copy generated successfully!');
      }
    } catch (err) {
      console.error('AI Generation failed:', err);
      showNotification('Failed to generate AI copy');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const [isClassifyingAI, setIsClassifyingAI] = useState(false);

  const handleAIAutoTag = async () => {
    setIsClassifyingAI(true);
    try {
      const newMedia = [...importedMedia];
      for (let i = 0; i < newMedia.length; i++) {
        const item = newMedia[i];
        if (item.ignore) continue;

        // Only classify if we have a file and it's not already well-categorized (optional logic)
        if (item.file) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(item.file);
          });

          const aiResult = await classifyImageWithAI(base64);
          if (aiResult) {
            newMedia[i] = { 
              ...newMedia[i], 
              category: aiResult.category, 
              subcategory: aiResult.subcategory,
              ai_description: aiResult.description
            };
          }
        }
      }
      setImportedMedia(newMedia);
      showNotification('AI Auto-Tagging complete!');
    } catch (err) {
      console.error('AI Classification failed:', err);
      showNotification('Failed to auto-tag images');
    } finally {
      setIsClassifyingAI(false);
    }
  };

  // New state for CMS fields
  const [about, setAbout] = useState(formData.description || '');
  const [transfer, setTransfer] = useState(formData.transfer_type || '');
  const [mealPlans, setMealPlans] = useState(formData.meal_plans?.join(', ') || '');
  const [rooms, setRooms] = useState(formData.rooms?.join(', ') || '');
  const [roomTypes, setRoomTypes] = useState<any[]>(formData.room_types || []);
  const [highlights, setHighlights] = useState(formData.highlights?.join(', ') || '');
  const [category, setCategory] = useState(formData.category || '');
  const [bannerUrl, setBannerUrl] = useState(formData.banner_url || '');

  useEffect(() => {
    if (editingResort) {
      setAbout(editingResort.description || '');
      setTransfer(editingResort.transfer_type || '');
      setMealPlans(editingResort.meal_plans?.join(', ') || '');
      setRooms(editingResort.rooms?.join(', ') || '');
      setRoomTypes(editingResort.room_types || []);
      setHighlights(editingResort.highlights?.join(', ') || '');
      setCategory(editingResort.category || '');
      setBannerUrl(editingResort.banner_url || '');
      fetchMedia();
      fetchCategories();
    }
  }, [editingResort]);

  useEffect(() => {
    console.log('formData updated:', formData);
  }, [formData]);

  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      description: about,
      transfer_type: transfer,
      meal_plans: mealPlans.split(',').map(s => s.trim()).filter(Boolean),
      rooms: rooms.split(',').map(s => s.trim()).filter(Boolean),
      room_types: roomTypes,
      highlights: highlights.split(',').map(s => s.trim()).filter(Boolean),
      category: category,
      banner_url: bannerUrl
    }));
  }, [about, transfer, mealPlans, rooms, roomTypes, highlights, category, bannerUrl]);

  const fetchCategories = async () => {
    if (!editingResort?.id) return;
    const { data } = await supabase
      .from('resort_media_categories')
      .select('*')
      .eq('resort_id', editingResort.id)
      .order('sort_order', { ascending: true });
    if (data) setDbCategories(data);
  };

  const fetchMedia = async () => {
    if (!editingResort?.id) return;
    const { data } = await supabase
      .from('resort_media')
      .select('*, resort_media_categories(key, label)')
      .eq('resort_id', editingResort.id)
      .order('sort_order', { ascending: true });
    if (data) setMedia(data);
  };

  const handleDeleteMedia = async (id: string, path: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    try {
      // Delete from storage if it's an internal path
      if (!path.startsWith('http')) {
        await supabase.storage.from('resorts').remove([path]);
      }
      // Delete from database
      await supabase.from('resort_media').delete().eq('id', id);
      
      setMedia(media.filter(m => m.id !== id));
      showNotification('Media deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showNotification('Failed to delete media');
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    setImportState('processing');
    setImportError(null);
    const newMedia: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Handle ZIP
      if (file.name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipFiles = Object.values(zip.files);
          for (const zipFile of zipFiles) {
            if (!zipFile.dir && /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(zipFile.name)) {
              const blob = await zipFile.async('blob');
              const extractedFile = new File([blob], zipFile.name, { type: 'image/jpeg' });
              
              // Simple path logic for frontend
              const parts = zipFile.name.split('/');
              const fileName = parts.pop() || "";
              const folderName = parts.join('/');
              
              const { category, subcategory } = classifyLocalMedia(folderName, fileName);
              
              newMedia.push({
                file: extractedFile,
                storage_path: URL.createObjectURL(extractedFile),
                category,
                subcategory,
                original_filename: fileName,
                source_folder: folderName,
                source_type: 'zip_upload',
                is_hero: category === 'main_hero'
              });
            }
          }
        } catch (err) {
          console.error('ZIP error:', err);
          setImportError('Failed to extract ZIP file');
          setImportState('failed');
          return;
        }
        continue;
      }

      // Handle Images
      if (file.type.startsWith('image/')) {
        const relativePath = (file as any).webkitRelativePath || "";
        const parts = relativePath.split('/');
        const fileName = parts.pop() || file.name;
        const folderName = parts.join('/');
        
        const { category, subcategory } = classifyLocalMedia(folderName, fileName);
        
        newMedia.push({
          file,
          storage_path: URL.createObjectURL(file),
          category,
          subcategory,
          original_filename: fileName,
          source_folder: folderName,
          source_type: relativePath ? 'local_folder' : 'local_upload',
          is_hero: category === 'main_hero'
        });
      }
    }

    if (newMedia.length === 0) {
      setImportError('No supported image files found');
      setImportState('failed');
    } else {
      // Duplicate detection
      const detectedDuplicates = newMedia.map((item, idx) => {
        const isDuplicate = newMedia.some((other, otherIdx) => 
          idx !== otherIdx && 
          item.original_filename === other.original_filename && 
          item.file?.size === other.file?.size
        );
        return { ...item, is_duplicate: isDuplicate };
      });

      setImportedMedia(detectedDuplicates);
      setImportState('ready_for_review');
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl) return;
    setImportState('processing');
    setImportError(null);
    
    try {
      const response = await fetch('/api/import-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl, resort_id: editingResort?.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to import');
      }
      
      const data = await response.json();
      if (data.media && data.media.length > 0) {
        setImportedMedia(data.media.map((m: any) => ({
          ...m,
          is_hero: m.category === 'main_hero' || m.category === 'banner'
        })));
        setImportState('ready_for_review');
      } else {
        setImportError('No images found at the provided URL.');
        setImportState('failed');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message || 'Failed to import media');
      setImportState('failed');
    }
  };

  const legacyToNewCategoryMap: Record<string, string> = {
    'banner': 'main_hero',
    'rooms': 'room_types',
    'dining': 'restaurants',
    'spa': 'spa',
    'activities': 'activities',
    'maps': 'maps',
    'logos': 'logos'
  };

  const defaultCategories = [
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
  const roomSubcategories = ['water villa', 'beach villa', 'residence', 'suite', 'deluxe room', 'family room'];

  const handleFinalSave = async () => {
    if (!editingResort?.id) {
      showNotification('Error: Resort ID missing');
      return;
    }
    
    setImportState('saving');
    setUploadProgress(0);
    
    try {
      // 1. Create Batch
      const batchRes = await fetch('/api/import/create-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_type: 'media_import',
          source_type: 'mixed_upload',
          source_ref: editingResort.name
        })
      });
      const batch = await batchRes.json();
      const batchId = batch.id;

      const stagingItems = [];
      
      for (let i = 0; i < importedMedia.length; i++) {
        const item = importedMedia[i];
        if (item.ignore) continue;

        let storagePath = item.storage_path;
        
        // If it's a local file or external URL that needs proxying/uploading
        if (item.file || (storagePath && storagePath.startsWith('http'))) {
          try {
            let fileToUpload = item.file;
            
            if (!fileToUpload && storagePath.startsWith('http')) {
              const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(storagePath)}`;
              const response = await fetch(proxyUrl);
              if (!response.ok) throw new Error(`Proxy failed with status ${response.status}`);
              const blob = await response.blob();
              fileToUpload = new File([blob], item.original_filename || `imported_${i}.jpg`, { type: blob.type });
            }

            if (fileToUpload && fileToUpload.size > 5 * 1024 * 1024) {
              fileToUpload = await resizeImage(fileToUpload);
            }

            if (fileToUpload) {
              const internalUrl = await uploadResortFile(
                fileToUpload, 
                formData.name || editingResort.name, 
                item.category, 
                (p) => setUploadProgress(((i + p/100) / importedMedia.length) * 100),
                showNotification
              );
              if (internalUrl) storagePath = internalUrl;
            }
          } catch (uploadErr) {
            console.error(`Failed to upload image ${i}:`, uploadErr);
          }
        }

        stagingItems.push({ 
          import_batch_id: batchId,
          target_resort_id: editingResort.id,
          staged_storage_path: storagePath,
          inferred_category_key: item.category,
          inferred_subcategory: item.subcategory,
          original_filename: item.original_filename,
          original_url: item.source_url,
          review_status: 'pending'
        });
      }
      
      const { error } = await supabase.from('media_staging').insert(stagingItems);
      if (error) throw error;
      
      setImportedMedia([]);
      setImportState('saved');
      showNotification('Media sent to staging for review. Please check Import Batches.');
      setTimeout(() => {
        setImportState('idle');
        window.location.href = '/admin/imports';
      }, 2000);
    } catch (err: any) {
      console.error('Save error:', err);
      setImportError(err.message || 'Failed to save media');
      setImportState('failed');
    } finally {
      setUploadProgress(null);
    }
  };

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
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-navy/60">Resort Details</h3>
            <button
              type="button"
              onClick={handleGenerateAICopy}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 px-4 py-2 bg-brand-teal/10 text-brand-teal rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50"
            >
              {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isGeneratingAI ? 'Generating...' : 'Magic AI Assistant'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput label="Resort Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} placeholder="e.g. Soneva Jani" />
            <TextInput label="Atoll" value={formData.atoll} onChange={(v: string) => setFormData({...formData, atoll: v})} placeholder="e.g. Noonu Atoll" />
            <TextInput label="Category" value={category} onChange={setCategory} placeholder="e.g. Luxury" />
            <TextInput label="Transfer Type" value={transfer} onChange={setTransfer} placeholder="e.g. Seaplane" />
          </div>
          <TextAreaInput label="About" value={about} onChange={setAbout} placeholder="About the resort..." />
          <TextAreaInput label="Meal Plans" value={mealPlans} onChange={setMealPlans} placeholder="e.g. Half Board, Full Board, All Inclusive" />
          <TextAreaInput label="Rooms" value={rooms} onChange={setRooms} placeholder="e.g. Overwater Villa, Beach Villa" />
          <TextAreaInput label="Highlights" value={highlights} onChange={setHighlights} placeholder="e.g. Overwater slide, Underwater restaurant" />
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Banner Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-40 h-20 rounded-lg overflow-hidden bg-brand-paper/50 border border-brand-navy/10 relative group">
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
                console.log('Setting activeMediaField to banner');
                setActiveMediaField('banner');
                setIsMediaLibraryOpen(true);
              }} className="text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:underline">Change Photo</button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Room Types</label>
            {roomTypes.map((rt, index) => (
              <div key={index} className="bg-brand-paper/30 border border-brand-navy/10 rounded-xl p-4 space-y-4">
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
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-brand-paper/50 border border-brand-navy/10 relative">
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
                          <ImageIcon size={16} />
                        </div>
                      );
                    })()}
                  </div>
                  <button type="button" onClick={() => {
                    setActiveMediaField(`room_type_${index}`);
                    setIsMediaLibraryOpen(true);
                  }} className="text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:underline">Change Photo</button>
                </div>
                <button type="button" onClick={() => setRoomTypes(roomTypes.filter((_, i) => i !== index))} className="text-[10px] font-bold uppercase tracking-widest text-brand-coral hover:underline">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => setRoomTypes([...roomTypes, { name: '', description: '', image_url: '' }])} className="w-full bg-brand-navy text-white px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all">Add Room Type</button>
          </div>
        </div>
      )}
      
  {activeTab === 'Media' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif text-brand-navy">Media Management</h3>
            {dbCategories.length === 0 && (
              <p className="text-[10px] text-brand-coral font-bold uppercase tracking-widest">
                Warning: No categories found in database. Using defaults.
              </p>
            )}
          </div>
          {(dbCategories.length > 0 ? dbCategories : defaultCategories).map(category => (
            <div key={category.id || category.key} className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{category.label || category.key}</h4>
              <div className="grid grid-cols-4 gap-4">
                {media.filter(m => 
                  (category.id && m.category_id === category.id) || 
                  (!category.id && (m.category === category.key || legacyToNewCategoryMap[m.category] === category.key))
                ).map(m => (
                  <div key={m.id} className="relative group">
                    <img src={m.storage_path} alt={m.original_filename} className="w-full h-24 object-cover rounded-lg" />
                    {m.is_hero && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-brand-teal text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-sm">
                        Hero
                      </div>
                    )}
                    <button type="button" onClick={() => handleDeleteMedia(m.id, m.storage_path)} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100"><Trash2 size={14} className="text-brand-coral" /></button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => {
                    setActiveMediaField(category.id ? `category_${category.id}` : category.key);
                    setIsMediaLibraryOpen(true);
                  }}
                  className="w-full h-24 border-2 border-dashed border-brand-navy/10 rounded-lg flex flex-col items-center justify-center text-brand-navy/40 hover:border-brand-teal hover:text-brand-teal transition-all"
                >
                  <Plus size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Add</span>
                </button>
              </div>
            </div>
          ))}
          
          {isMediaLibraryOpen && (
            <MediaLibraryModal 
              onClose={() => setIsMediaLibraryOpen(false)}
              onSelect={async (selectedMedia) => {
                console.log('onSelect called with:', selectedMedia, 'activeMediaField:', activeMediaField);
                if (!editingResort?.id) return;

                const isSameResort = selectedMedia.resort_id === editingResort.id;

                const ensureMediaInResort = async (extraUpdates: any = {}) => {
                  // Resolve category if needed
                  let targetField = activeMediaField;
                  if (targetField === 'banner') targetField = 'main_hero';
                  if (targetField?.startsWith('room_type_')) targetField = 'room_types';
                  
                  const categoryUpdates: any = {};
                  if (targetField?.startsWith('category_')) {
                    categoryUpdates.category_id = targetField.split('_')[1];
                  } else if (targetField && targetField !== 'all') {
                    const matchingDbCat = dbCategories.find(c => c.key === targetField);
                    if (matchingDbCat) {
                      categoryUpdates.category_id = matchingDbCat.id;
                    } else {
                      categoryUpdates.category = targetField;
                    }
                  }

                  const allUpdates = { ...categoryUpdates, ...extraUpdates };

                  if (isSameResort) {
                    const { error } = await supabase
                      .from('resort_media')
                      .update(allUpdates)
                      .eq('id', selectedMedia.id);
                    if (error) throw error;
                    return selectedMedia;
                  } else {
                    // Copy media to current resort
                    const insertData: any = {
                      resort_id: editingResort.id,
                      storage_path: selectedMedia.storage_path,
                      original_filename: selectedMedia.original_filename,
                      source_type: 'library_reuse',
                      status: 'active',
                      ...allUpdates
                    };
                    
                    const { data, error } = await supabase
                      .from('resort_media')
                      .insert(insertData)
                      .select()
                      .single();
                    if (error) throw error;
                    return data;
                  }
                };

                try {
                  if (activeMediaField === 'banner') {
                    setBannerUrl(selectedMedia.storage_path);
                    
                    // 1. Unset all heroes for this resort
                    await supabase
                      .from('resort_media')
                      .update({ is_hero: false })
                      .eq('resort_id', editingResort.id);
                    
                    // 2. Ensure this media is in our resort and set as hero
                    await ensureMediaInResort({ is_hero: true, is_featured: true });

                    // 3. Sync with resorts table banner_url
                    await supabase
                      .from('resorts')
                      .update({ banner_url: selectedMedia.storage_path })
                      .eq('id', editingResort.id);
                    
                    fetchMedia();
                    showNotification('Banner photo updated');
                  } else if (activeMediaField?.startsWith('room_type_')) {
                    const index = parseInt(activeMediaField.split('_')[2]);
                    const roomName = roomTypes[index].name;
                    const newTypes = [...roomTypes];
                    newTypes[index].image_url = selectedMedia.storage_path;
                    setRoomTypes(newTypes);

                    // 1. Unset room_type_name for other media of this resort with the same room name
                    await supabase
                      .from('resort_media')
                      .update({ room_type_name: null })
                      .eq('resort_id', editingResort.id)
                      .eq('room_type_name', roomName);

                    // 2. Ensure this media is in our resort and associated with room type
                    await ensureMediaInResort({ room_type_name: roomName });
                    
                    fetchMedia();
                    showNotification('Room type photo updated');
                  } else {
                    // Standard gallery add
                    await ensureMediaInResort();
                    fetchMedia();
                    showNotification('Media added to gallery');
                  }
                } catch (error) {
                  console.error('Error in media selection:', error);
                  showNotification('Failed to update media');
                }

                setIsMediaLibraryOpen(false);
              }}
              resortId={editingResort?.id}
              initialCategory={activeMediaField?.startsWith('room_type_') ? 'room_types' : activeMediaField || 'all'}
            />
          )}
        </div>
      )}

      {activeTab === 'Import Media' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-serif text-brand-navy">Import Media</h3>
              <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest mt-1">
                Use categorized folders such as Hero, Rooms, Dining, Spa, Activities, Maps, and Logos for best results.
              </p>
            </div>
            {importedMedia.length > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  setImportedMedia([]);
                  setImportState('idle');
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-brand-coral hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {importState === 'idle' || importState === 'failed' ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                processFiles(e.dataTransfer.files);
              }}
              className="p-12 border-2 border-dashed border-brand-navy/10 rounded-3xl text-center space-y-6 bg-brand-paper/20 hover:bg-brand-paper/40 transition-all group"
            >
              <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="text-brand-teal" size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-serif text-brand-navy">Drag & drop media files or folders here, or paste a Google Drive / Dropbox URL.</p>
                <p className="text-sm text-brand-navy/40">Supports JPG, PNG, WEBP, AVIF, SVG and ZIP files.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <input 
                  type="text" 
                  value={importUrl} 
                  onChange={(e) => setImportUrl(e.target.value)} 
                  placeholder="Paste Google Drive or Dropbox URL here..." 
                  className="flex-1 bg-white border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all shadow-sm" 
                />
                <button 
                  type="button" 
                  onClick={handleImportUrl}
                  className="bg-brand-teal text-white px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all shadow-lg shadow-brand-teal/20"
                >
                  Import URL
                </button>
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-navy/60 hover:text-brand-teal transition-colors"
                >
                  <ImageIcon size={16} /> Select Files
                </button>
                <button 
                  type="button" 
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-navy/60 hover:text-brand-teal transition-colors"
                >
                  <Plus size={16} /> Select Folders
                </button>
              </div>
              
              <input type="file" ref={fileInputRef} multiple className="hidden" onChange={(e) => e.target.files && processFiles(e.target.files)} />
              <input type="file" ref={folderInputRef} {...({ webkitdirectory: "", directory: "" } as any)} className="hidden" onChange={(e) => e.target.files && processFiles(e.target.files)} />

              {importError && (
                <div className="flex items-center justify-center gap-2 text-brand-coral bg-brand-coral/5 p-3 rounded-xl border border-brand-coral/10">
                  <AlertCircle size={16} />
                  <span className="text-xs font-medium">{importError}</span>
                </div>
              )}
            </div>
          ) : importState === 'processing' ? (
            <div className="p-20 text-center space-y-4">
              <Loader2 className="mx-auto text-brand-teal animate-spin" size={48} />
              <p className="text-brand-navy font-serif text-xl">Processing your media...</p>
              <p className="text-sm text-brand-navy/40">Scanning folders and detecting categories.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Review Screen */}
              <div className="flex items-center justify-between bg-brand-teal/5 border border-brand-teal/10 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-teal/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-brand-teal" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">Ready for Review</p>
                    <p className="text-[10px] text-brand-navy/40 uppercase tracking-widest font-bold">Found {importedMedia.length} items. Please verify categories before saving.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   <button 
                    type="button" 
                    onClick={handleAIAutoTag}
                    disabled={isClassifyingAI || importedMedia.length === 0}
                    className="flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-teal bg-brand-teal/10 hover:bg-brand-teal hover:text-white transition-all disabled:opacity-50"
                  >
                    {isClassifyingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isClassifyingAI ? 'Analyzing...' : 'AI Auto-Tag'}
                  </button>
                   <button 
                    type="button" 
                    onClick={() => setImportState('idle')}
                    className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-navy"
                  >
                    Add More
                  </button>
                  <button 
                    type="button" 
                    onClick={handleFinalSave}
                    disabled={importState === 'saving'}
                    className="bg-brand-teal text-white px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all shadow-lg shadow-brand-teal/20 flex items-center gap-2"
                  >
                    {importState === 'saving' ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save All'}
                  </button>
                </div>
              </div>

              {/* Grouped Results */}
              <div className="space-y-12">
                {defaultCategories.map(cat => {
                  const category = cat.key;
                  const items = importedMedia.filter(m => m.category === category || (category === 'main_hero' && m.category === 'banner'));
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-brand-navy/5 pb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy">{cat.label}</h4>
                          <span className="px-2 py-0.5 bg-brand-navy/5 rounded-full text-[10px] font-bold text-brand-navy/40">{items.length}</span>
                        </div>
                        {category === 'main_hero' && (
                          <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest">Suggested Hero Images</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {importedMedia.map((m, i) => {
                          if (m.category !== category) return null;
                          return (
                            <div key={i} className={`group relative bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-xl ${m.ignore ? 'opacity-40 grayscale' : 'border-brand-navy/5'}`}>
                              <div className="aspect-video relative overflow-hidden">
                                <img src={m.storage_path} alt="Imported" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                
                                <div className="absolute top-2 right-2 flex gap-2">
                                  {m.is_duplicate && (
                                    <div className="bg-brand-coral text-white p-1.5 rounded-full shadow-lg" title="Potential duplicate detected">
                                      <AlertCircle size={12} />
                                    </div>
                                  )}
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newMedia = [...importedMedia];
                                      newMedia[i] = { ...newMedia[i], ignore: !newMedia[i].ignore };
                                      setImportedMedia(newMedia);
                                    }}
                                    className={`p-1.5 rounded-full shadow-lg transition-colors ${m.ignore ? 'bg-brand-teal text-white' : 'bg-white/90 text-brand-coral hover:bg-brand-coral hover:text-white'}`}
                                  >
                                    {m.ignore ? <Plus size={12} /> : <X size={12} />}
                                  </button>
                                </div>

                                {m.is_hero && (
                                  <div className="absolute top-2 left-2 px-2 py-1 bg-brand-teal text-white text-[8px] font-bold uppercase tracking-widest rounded shadow-lg">
                                    Hero Candidate
                                  </div>
                                )}
                              </div>

                              <div className="p-4 space-y-3">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-brand-navy truncate" title={m.original_filename}>{m.original_filename}</p>
                                  {m.source_folder && (
                                    <p className="text-[8px] text-brand-navy/40 uppercase tracking-widest font-bold truncate">Folder: {m.source_folder}</p>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">Category</label>
                                    <select 
                                      value={m.category} 
                                      onChange={(e) => {
                                        const newMedia = [...importedMedia];
                                        newMedia[i] = { ...newMedia[i], category: e.target.value };
                                        setImportedMedia(newMedia);
                                      }} 
                                      className="w-full bg-brand-paper/50 border border-brand-navy/10 rounded-lg px-2 py-1.5 text-[10px] font-medium focus:border-brand-teal outline-none"
                                    >
                                      {defaultCategories.map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                                    </select>
                                  </div>
                                  {(m.category === 'room_types' || m.category === 'rooms') && (
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-brand-navy/40">Subtype</label>
                                      <select 
                                        value={m.subcategory || ''} 
                                        onChange={(e) => {
                                          const newMedia = [...importedMedia];
                                          newMedia[i] = { ...newMedia[i], subcategory: e.target.value };
                                          setImportedMedia(newMedia);
                                        }} 
                                        className="w-full bg-brand-paper/50 border border-brand-navy/10 rounded-lg px-2 py-1.5 text-[10px] font-medium focus:border-brand-teal outline-none"
                                      >
                                        <option value="">None</option>
                                        {roomSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                      </select>
                                    </div>
                                  )}
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer group/hero">
                                  <input 
                                    type="checkbox" 
                                    checked={m.is_hero}
                                    onChange={(e) => {
                                      const newMedia = [...importedMedia];
                                      // If setting this as hero, unset others in this category? 
                                      // Actually, multiple heroes might be okay, but usually one main.
                                      newMedia[i] = { ...newMedia[i], is_hero: e.target.checked };
                                      setImportedMedia(newMedia);
                                    }}
                                    className="w-3 h-3 rounded border-brand-navy/20 text-brand-teal focus:ring-brand-teal"
                                  />
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-brand-navy/40 group-hover/hero:text-brand-teal transition-colors">Set as Hero</span>
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
