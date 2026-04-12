import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Image as ImageIcon, FileText, Globe, MapPin, Hotel, Coffee, Palmtree, AlertCircle, CheckCircle2, Loader2, X, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';
import JSZip from 'jszip';
import { MediaLibraryModal } from './MediaLibraryModal';
import { generateResortMarketingCopy, classifyImageWithAI } from '../services/content';
import { ResortEditHeader } from './ResortEditHeader';
import { ResortSectionNav } from './ResortSectionNav';
import { ResortOverviewPanel } from './ResortOverviewPanel';
import { ResortRoomTypesPanel } from './ResortRoomTypesPanel';
import { ResortMediaPanel } from './ResortMediaPanel';
import { ResortImportPanel } from './ResortImportPanel';
import { uploadResortFile } from '../pages/AdminDashboard';
import { importService } from '../services/importService';

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


// Classification Helper (Frontend version for local files)
const classifyLocalMedia = (path: string, fileName: string) => {
  const combined = `${path.toLowerCase()} ${fileName.toLowerCase()}`;
  
  const keywords = {
    main_hero: ['hero', 'banner', 'cover', 'main', 'landing', 'exterior', 'aerial'],
    room_types: ['room', 'villa', 'suite', 'residence', 'bedroom', 'accommodation', 'stay', 'living'],
    restaurants: ['dining', 'restaurant', 'bar', 'breakfast', 'lunch', 'dinner', 'culinary', 'food', 'drink', 'kitchen'],
    spa: ['spa', 'wellness', 'treatment', 'massage', 'therapy', 'gym', 'fitness', 'yoga', 'pool'],
    activities: ['activity', 'experience', 'diving', 'snorkel', 'excursion', 'marine', 'dolphin', 'cruise', 'sport', 'kids', 'club', 'water sport'],
    beaches: ['beach', 'sand', 'shore', 'coast'],
    facilities: ['facility', 'gym', 'fitness', 'pool', 'tennis', 'court', 'boutique', 'shop', 'library'],
    maps: ['map', 'floorplan', 'floor plan', 'site plan', 'layout', 'location', 'plan'],
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
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Room Types', 'Media Library', 'Import Center'];
  const [media, setMedia] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [importState, setImportState] = useState<'idle' | 'processing' | 'ready_for_review' | 'saving' | 'saved' | 'failed'>('idle');
  const [importedMedia, setImportedMedia] = useState<any[]>([]); 
  const [importError, setImportError] = useState<string | null>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isClassifyingAI, setIsClassifyingAI] = useState(false);
  const [about, setAbout] = useState(formData.description || '');
  const [transfer, setTransfer] = useState(formData.transfer_type || '');
  const [mealPlans, setMealPlans] = useState(formData.meal_plans?.join(', ') || '');
  const [rooms, setRooms] = useState(formData.rooms?.join(', ') || '');
  const [roomTypes, setRoomTypes] = useState<any[]>(formData.room_types || []);
  const [highlights, setHighlights] = useState(formData.highlights?.join(', ') || '');
  const [category, setCategory] = useState(formData.category || '');
  const [bannerUrl, setBannerUrl] = useState(formData.banner_url || '');

  const handleMediaSelect = (selectedMedia: any) => {
    if (activeMediaField === 'banner') {
      setBannerUrl(selectedMedia.storage_path);
    } else if (activeMediaField?.startsWith('room_type_')) {
      const index = parseInt(activeMediaField.replace('room_type_', ''));
      if (!isNaN(index) && roomTypes[index]) {
        const newTypes = [...roomTypes];
        newTypes[index].image_url = selectedMedia.storage_path;
        setRoomTypes(newTypes);
      }
    }
    setIsMediaLibraryOpen(false);
    setActiveMediaField(null);
  };

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

  const handleAIAutoTag = async () => {
    setIsClassifyingAI(true);
    try {
      const newMedia = [...importedMedia];
      for (let i = 0; i < newMedia.length; i++) {
        const item = newMedia[i];
        if (item.ignore) continue;

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
      if (!path.startsWith('http')) {
        await supabase.storage.from('resorts').remove([path]);
      }
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
      
      if (file.name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipFiles = Object.values(zip.files);
          for (const zipFile of zipFiles) {
            if (!zipFile.dir && /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(zipFile.name)) {
              const blob = await zipFile.async('blob');
              const extractedFile = new File([blob], zipFile.name, { type: 'image/jpeg' });
              
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
      // 1. Create Import Batch using importService (Direct Supabase)
      const batch = await importService.createBatch({
        batch_type: 'media_import',
        source_type: 'mixed_upload',
        source_ref: editingResort.name
      });
      
      const batchId = batch.id;
      const mediaItemsToStage = [];
      
      for (let i = 0; i < importedMedia.length; i++) {
        const item = importedMedia[i];
        if (item.ignore) continue;

        let storagePath = item.storage_path;
        
        if (item.file || (storagePath && storagePath.startsWith('http'))) {
          try {
            let fileToUpload = item.file;
            
            if (!fileToUpload && storagePath.startsWith('http')) {
              // Note: Proxy still needs a backend, but we'll try to handle it
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
              // Upload directly to Supabase Storage with staging path
              const internalUrl = await uploadResortFile(
                fileToUpload, 
                formData.name || editingResort.name, 
                item.category, 
                (p) => setUploadProgress(((i + p/100) / importedMedia.length) * 100),
                showNotification,
                true // isStaging = true
              );
              if (internalUrl) storagePath = internalUrl;
            }
          } catch (uploadErr) {
            console.error(`Failed to upload image ${i}:`, uploadErr);
          }
        }

        mediaItemsToStage.push({ 
          url: storagePath,
          category: item.category,
          subcategory: item.subcategory,
          original_filename: item.original_filename,
          source_url: item.source_url,
          room_type_name: item.room_type_name
        });
      }
      
      // 2. Stage Media Items using importService (Direct Supabase)
      await importService.stageMediaItems(batchId, editingResort.id, mediaItemsToStage);
      
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
    <form onSubmit={handleSave} className="space-y-8">
      <ResortEditHeader 
        name={formData.name} 
        isAdding={true} 
        onCancel={() => setIsAdding(false)} 
        onSave={handleSave} 
        isEditing={!!editingResort} 
      />
      <ResortSectionNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
      
      {activeTab === 'Overview' && (
        <div className="space-y-12">
          <ResortOverviewPanel
            formData={formData}
            setFormData={setFormData}
            category={category}
            setCategory={setCategory}
            transfer={transfer}
            setTransfer={setTransfer}
            about={about}
            setAbout={setAbout}
            mealPlans={mealPlans}
            setMealPlans={setMealPlans}
            highlights={highlights}
            setHighlights={setHighlights}
            bannerUrl={bannerUrl}
            media={media}
            handleGenerateAICopy={handleGenerateAICopy}
            isGeneratingAI={isGeneratingAI}
            setActiveMediaField={setActiveMediaField}
            setIsMediaLibraryOpen={setIsMediaLibraryOpen}
          />
          <ResortRoomTypesPanel
            roomTypes={roomTypes}
            setRoomTypes={setRoomTypes}
            media={media}
            setActiveMediaField={setActiveMediaField}
            setIsMediaLibraryOpen={setIsMediaLibraryOpen}
          />
        </div>
      )}
      
      {activeTab === 'Media Library' && (
        <ResortMediaPanel
          dbCategories={dbCategories}
          defaultCategories={defaultCategories}
          media={media}
          handleDeleteMedia={handleDeleteMedia}
          setActiveMediaField={setActiveMediaField}
          setIsMediaLibraryOpen={setIsMediaLibraryOpen}
          legacyToNewCategoryMap={legacyToNewCategoryMap}
        />
      )}

      {activeTab === 'Import Center' && (
        <ResortImportPanel
          importUrl={importUrl}
          setImportUrl={setImportUrl}
          handleImportUrl={handleImportUrl}
          processFiles={processFiles}
          importState={importState}
          importError={importError}
          importedMedia={importedMedia}
          setImportedMedia={setImportedMedia}
          handleAIAutoTag={handleAIAutoTag}
          isClassifyingAI={isClassifyingAI}
          handleFinalSave={handleFinalSave}
          setImportState={setImportState as (state: string) => void}
          defaultCategories={defaultCategories}
          roomSubcategories={roomSubcategories}
        />
      )}

      <div className="flex justify-end gap-4 pt-6">
        <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-navy transition-all">Cancel</button>
        <button type="submit" className="bg-brand-navy text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-xl shadow-brand-navy/20">
          {editingResort ? 'Update Resort' : 'Add Resort'}
        </button>
      </div>

      {isMediaLibraryOpen && (
        <MediaLibraryModal
          onClose={() => setIsMediaLibraryOpen(false)}
          onSelect={handleMediaSelect}
          resortId={editingResort?.id}
          initialCategory={activeMediaField === 'banner' ? 'banner' : activeMediaField?.startsWith('room_type_') ? 'rooms' : undefined}
        />
      )}
    </form>
  );
};

