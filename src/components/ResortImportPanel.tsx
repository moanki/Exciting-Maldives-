import React from 'react';
import { Loader2, Sparkles, Upload, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';

interface ResortImportPanelProps {
  importUrl: string;
  setImportUrl: (url: string) => void;
  handleImportUrl: () => void;
  processFiles: (files: FileList | File[]) => void;
  importState: string;
  importError: string | null;
  importedMedia: any[];
  setImportedMedia: (media: any[]) => void;
  handleAIAutoTag: () => void;
  isClassifyingAI: boolean;
  handleFinalSave: () => void;
  setImportState: (state: string) => void;
  defaultCategories: any[];
  roomSubcategories: string[];
}

export const ResortImportPanel: React.FC<ResortImportPanelProps> = ({ 
  importUrl, setImportUrl, handleImportUrl, processFiles, importState, importError, importedMedia, setImportedMedia, handleAIAutoTag, isClassifyingAI, handleFinalSave, setImportState, defaultCategories, roomSubcategories
}) => (
  <div className="space-y-12">
    <div className="flex justify-between items-center">
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Import Center</h3>
    </div>
    
    {importState === 'idle' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-2 border-dashed border-brand-navy/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Upload className="text-brand-navy/20 mb-4" size={48} />
          <p className="text-sm font-bold text-brand-navy mb-2">Drag & Drop Files</p>
          <p className="text-xs text-brand-navy/40 mb-6">Support for JPG, PNG, ZIP</p>
          <input type="file" multiple onChange={(e) => e.target.files && processFiles(e.target.files)} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="px-6 py-2 bg-brand-navy text-white rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-brand-teal transition-all">Browse Files</label>
        </div>
        <div className="border border-brand-navy/5 rounded-2xl p-8 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy">Import from URL</h4>
          <div className="flex gap-2">
            <input type="text" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none" />
            <button onClick={handleImportUrl} className="px-6 py-2 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all">Import</button>
          </div>
        </div>
      </div>
    )}

    {importState === 'processing' && (
      <div className="flex flex-col items-center justify-center py-20 text-brand-navy/40">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">Processing Media...</p>
      </div>
    )}

    {importError && (
      <div className="p-4 bg-brand-coral/10 border border-brand-coral/20 rounded-xl text-brand-coral text-xs font-bold uppercase tracking-widest flex items-center gap-2">
        <AlertCircle size={16} /> {importError}
      </div>
    )}

    {importState === 'ready_for_review' && (
      <div className="space-y-6">
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
              className="bg-brand-teal text-white px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all shadow-lg shadow-brand-teal/20 flex items-center gap-2"
            >
              Save All
            </button>
          </div>
        </div>

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
);
