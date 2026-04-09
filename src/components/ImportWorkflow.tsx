import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Eye, 
  Trash2, 
  Check, 
  X, 
  Edit2, 
  ArrowRight, 
  Layers, 
  Image as ImageIcon, 
  FileText,
  Search,
  Filter,
  MoreVertical,
  Zap,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';

interface ImportBatch {
  id: string;
  batch_type: string;
  source_type: string;
  source_ref: string | null;
  status: string;
  created_at: string;
  summary_json: any;
  counts?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    published: number;
  };
}

export function AdminImportBatches() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('import_batches')
        .select(`
          *,
          resort_staging(id, review_status),
          media_staging(id, review_status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedBatches = data.map((b: any) => {
        const resorts = b.resort_staging || [];
        const media = b.media_staging || [];
        const allItems = [...resorts, ...media];
        
        // Use summary_json if available, otherwise calculate
        const summary = b.summary_json || {};
        const resCounts = summary.resorts || { total: resorts.length, pending: resorts.filter((i: any) => i.review_status === 'pending').length, approved: resorts.filter((i: any) => i.review_status === 'approved').length, rejected: resorts.filter((i: any) => i.review_status === 'rejected').length, published: 0 };
        const medCounts = summary.media || { total: media.length, pending: media.filter((i: any) => i.review_status === 'pending').length, approved: media.filter((i: any) => i.review_status === 'approved').length, rejected: media.filter((i: any) => i.review_status === 'rejected').length, published: 0 };

        return {
          ...b,
          counts: {
            total: resCounts.total + medCounts.total,
            pending: resCounts.pending + medCounts.pending,
            approved: resCounts.approved + medCounts.approved,
            rejected: resCounts.rejected + medCounts.rejected,
            published: resCounts.published + medCounts.published
          }
        };
      });

      setBatches(processedBatches);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => {
    const matchesStatus = filter === 'all' || b.status === filter;
    const matchesType = typeFilter === 'all' || b.batch_type === typeFilter;
    const matchesSource = sourceFilter === 'all' || b.source_type === sourceFilter;
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.batch_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (b.source_ref && b.source_ref.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesType && matchesSource && matchesSearch;
  });

  if (selectedBatch) {
    return <BatchReviewConsole batchId={selectedBatch} onBack={() => { setSelectedBatch(null); fetchBatches(); }} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-brand-navy">Import Batches</h1>
          <p className="text-brand-navy/40 text-sm mt-1">Manage bulk resort and media ingestions</p>
        </div>
        <button 
          onClick={fetchBatches}
          className="p-3 bg-white rounded-xl border border-brand-navy/5 text-brand-navy/40 hover:text-brand-teal transition-all"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <div className="p-6 border-b border-brand-navy/5 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {['all', 'ingested', 'reviewing', 'partially_approved', 'published', 'failed'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    filter === s ? 'bg-brand-navy text-white' : 'bg-brand-paper text-brand-navy/40 hover:bg-brand-navy/5'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/20" size={16} />
              <input 
                type="text" 
                placeholder="Search batches..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-brand-paper rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-teal/20 w-64"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-brand-paper text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full outline-none border-none text-brand-navy/60"
            >
              <option value="all">All Types</option>
              <option value="resort_pdf_import">Resort PDF</option>
              <option value="media_import">Media Import</option>
            </select>
            <select 
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-brand-paper text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full outline-none border-none text-brand-navy/60"
            >
              <option value="all">All Sources</option>
              <option value="local_upload">Local Upload</option>
              <option value="google_drive">Google Drive</option>
              <option value="dropbox">Dropbox</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-brand-paper/50">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Batch Info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Progress</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Created At</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-paper">
              {filteredBatches.map(batch => (
                <tr key={batch.id} className="hover:bg-brand-paper/30 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        batch.batch_type === 'resort_pdf_import' ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-navy/10 text-brand-navy'
                      }`}>
                        {batch.batch_type === 'resort_pdf_import' ? <FileText size={20} /> : <ImageIcon size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-navy uppercase tracking-widest">
                          {batch.batch_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-brand-navy/40 font-medium">
                          Source: {batch.source_type} {batch.source_ref ? `(${batch.source_ref})` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-brand-navy/40">{batch.counts?.published} / {batch.counts?.total} Published</span>
                        <span className="text-brand-teal">{Math.round((batch.counts?.published || 0) / (batch.counts?.total || 1) * 100)}%</span>
                      </div>
                      <div className="w-32 h-1.5 bg-brand-paper rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-teal" 
                          style={{ width: `${(batch.counts?.published || 0) / (batch.counts?.total || 1) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[8px] font-bold text-brand-teal bg-brand-teal/5 px-1.5 py-0.5 rounded">{batch.counts?.approved} APP</span>
                        <span className="text-[8px] font-bold text-brand-navy/40 bg-brand-paper px-1.5 py-0.5 rounded">{batch.counts?.pending} PND</span>
                        <span className="text-[8px] font-bold text-brand-coral bg-brand-coral/5 px-1.5 py-0.5 rounded">{batch.counts?.rejected} REJ</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-xs text-brand-navy/60 font-medium">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-brand-navy/30 font-medium">
                      {new Date(batch.created_at).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button 
                      onClick={() => setSelectedBatch(batch.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shadow-brand-navy/10"
                    >
                      Open Review <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    ingested: 'bg-blue-50 text-blue-600 border-blue-100',
    reviewing: 'bg-brand-teal/5 text-brand-teal border-brand-teal/10',
    published: 'bg-green-50 text-green-600 border-green-100',
    failed: 'bg-brand-coral/5 text-brand-coral border-brand-coral/10',
    approved: 'bg-brand-teal/5 text-brand-teal border-brand-teal/10',
    partially_approved: 'bg-brand-paper text-brand-navy/60 border-brand-navy/5'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[status] || 'bg-brand-paper text-brand-navy/40'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function BatchReviewConsole({ batchId, onBack }: { batchId: string, onBack: () => void }) {
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [resorts, setResorts] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resorts' | 'media'>('resorts');
  const [publishing, setPublishing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchBatchData();
  }, [batchId]);

  const fetchBatchData = async () => {
    setLoading(true);
    try {
      const { data: batchData } = await supabase.from('import_batches').select('*').eq('id', batchId).single();
      const { data: resortData } = await supabase.from('resort_staging').select('*').eq('import_batch_id', batchId);
      const { data: mediaData } = await supabase.from('media_staging').select('*').eq('import_batch_id', batchId);

      setBatch(batchData);
      setResorts(resortData || []);
      setMedia(mediaData || []);
      
      if (resortData?.length === 0 && mediaData?.length > 0) {
        setActiveTab('media');
      }
    } catch (err) {
      console.error('Error fetching batch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedMedia.length === 0) return;
    setBulkActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = { 
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString()
      };

      if (action === 'approve') updates.review_status = 'approved';
      if (action === 'reject') updates.review_status = 'rejected';
      if (action === 'category') updates.reviewer_override_category_key = value;
      if (action === 'resort') updates.target_resort_id = value;
      if (action === 'room_type') updates.reviewer_override_room_type_name = value;

      const { error } = await supabase
        .from('media_staging')
        .update(updates)
        .in('id', selectedMedia);

      if (error) throw error;
      setSelectedMedia([]);
      fetchBatchData();
    } catch (err: any) {
      alert('Bulk action failed: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handlePublish = async () => {
    const approvedCount = resorts.filter(r => r.review_status === 'approved' && !r.published_at).length + 
                         media.filter(m => m.review_status === 'approved' && !m.published_at).length;
    
    if (approvedCount === 0) {
      alert('No new approved items to publish.');
      return;
    }

    if (!window.confirm(`Publish ${approvedCount} approved items to live site?`)) return;

    setPublishing(true);
    try {
      const response = await fetch('/api/import/publish-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Publish failed');
      
      if (result.errors && result.errors.length > 0) {
        alert(`Published with ${result.errors.length} errors. Check error log.`);
      } else {
        alert('Batch published successfully!');
      }
      fetchBatchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-brand-teal" /></div>;

  const pendingCount = resorts.filter(r => r.review_status === 'pending').length + media.filter(m => m.review_status === 'pending').length;
  const lowConfidenceCount = resorts.filter(r => r.confidence_score < 0.8).length + media.filter(m => m.confidence_score < 0.7).length;
  const duplicateCount = resorts.filter(r => r.duplicate_candidate_resort_id).length;

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white rounded-xl border border-brand-navy/5 text-brand-navy/40 hover:text-brand-navy transition-all">
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-serif text-brand-navy">Review Batch</h1>
              <StatusBadge status={batch?.status || ''} />
            </div>
            <p className="text-brand-navy/40 text-sm font-medium">
              ID: {batchId.split('-')[0]}... • {batch?.batch_type.replace(/_/g, ' ')} • {batch?.source_type}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePublish}
            disabled={publishing || (batch?.status === 'published' && pendingCount === 0)}
            className="bg-brand-teal text-white px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-navy transition-all shadow-xl shadow-brand-teal/20 flex items-center gap-3 disabled:opacity-50"
          >
            {publishing ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
            {batch?.status === 'published' ? 'Publish Remaining' : 'Publish Approved Items'}
          </button>
        </div>
      </div>

      {/* Warnings */}
      {(pendingCount > 0 || lowConfidenceCount > 0 || duplicateCount > 0) && (
        <div className="flex gap-4 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-navy/5 text-brand-navy rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Clock size={14} className="text-brand-navy/40" />
              {pendingCount} Items Pending Review
            </div>
          )}
          {lowConfidenceCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-coral/5 text-brand-coral rounded-full text-[10px] font-bold uppercase tracking-widest">
              <AlertTriangle size={14} />
              {lowConfidenceCount} Low Confidence Items
            </div>
          )}
          {duplicateCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-coral/5 text-brand-coral rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Database size={14} />
              {duplicateCount} Duplicate Candidates
            </div>
          )}
        </div>
      )}

      <div className="flex gap-8">
        <div className="flex-1 space-y-8">
          {/* Tabs */}
          <div className="flex justify-between items-center border-b border-brand-navy/5">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('resorts')}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'resorts' ? 'text-brand-teal' : 'text-brand-navy/40 hover:text-brand-navy'
                }`}
              >
                Resorts ({resorts.length})
                {activeTab === 'resorts' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-teal" />}
              </button>
              <button 
                onClick={() => setActiveTab('media')}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === 'media' ? 'text-brand-teal' : 'text-brand-navy/40 hover:text-brand-navy'
                }`}
              >
                Media ({media.length})
                {activeTab === 'media' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-teal" />}
              </button>
            </div>

            {activeTab === 'media' && selectedMedia.length > 0 && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{selectedMedia.length} selected</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleBulkAction('approve')}
                    disabled={bulkActionLoading}
                    className="p-2 bg-brand-teal/10 text-brand-teal rounded-lg hover:bg-brand-teal hover:text-white transition-all"
                    title="Bulk Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => handleBulkAction('reject')}
                    disabled={bulkActionLoading}
                    className="p-2 bg-brand-coral/10 text-brand-coral rounded-lg hover:bg-brand-coral hover:text-white transition-all"
                    title="Bulk Reject"
                  >
                    <X size={16} />
                  </button>
                  <div className="w-px h-6 bg-brand-navy/5 mx-2" />
                  <select 
                    onChange={(e) => handleBulkAction('category', e.target.value)}
                    disabled={bulkActionLoading}
                    className="text-[10px] font-bold uppercase tracking-widest bg-brand-paper rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="">Bulk Category</option>
                    <option value="main_hero">Main Hero</option>
                    <option value="room_types">Room Types</option>
                    <option value="restaurants">Restaurants</option>
                    <option value="facilities">Facilities</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'resorts' ? (
            <div className="space-y-6">
              {resorts.length === 0 ? (
                <div className="bg-white p-12 rounded-[40px] border border-brand-navy/5 text-center">
                  <FileText className="mx-auto text-brand-navy/10 mb-4" size={48} />
                  <p className="text-brand-navy/40 font-medium">No resorts in this batch</p>
                </div>
              ) : (
                resorts.map(resort => (
                  <ResortStagingCard key={resort.id} resort={resort} onUpdate={fetchBatchData} />
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {media.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-[40px] border border-brand-navy/5 text-center">
                  <ImageIcon className="mx-auto text-brand-navy/10 mb-4" size={48} />
                  <p className="text-brand-navy/40 font-medium">No media in this batch</p>
                </div>
              ) : (
                media.map(item => (
                  <div key={item.id} className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <input 
                        type="checkbox" 
                        checked={selectedMedia.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMedia([...selectedMedia, item.id]);
                          else setSelectedMedia(selectedMedia.filter(id => id !== item.id));
                        }}
                        className="w-5 h-5 rounded-lg border-brand-navy/20 text-brand-teal focus:ring-brand-teal"
                      />
                    </div>
                    <MediaStagingCard item={item} onUpdate={fetchBatchData} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="w-80 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 sticky top-8">
            <h3 className="text-lg font-serif text-brand-navy mb-6">Batch Summary</h3>
            <div className="space-y-4">
              <SummaryRow label="Total Items" value={resorts.length + media.length} />
              <SummaryRow label="Pending" value={pendingCount} color="text-brand-navy/40" />
              <SummaryRow label="Approved" value={resorts.filter(r => r.review_status === 'approved' && !r.published_at).length + media.filter(m => m.review_status === 'approved' && !m.published_at).length} color="text-brand-teal" />
              <SummaryRow label="Published" value={resorts.filter(r => r.published_at).length + media.filter(m => m.published_at).length} color="text-brand-teal" />
              <SummaryRow label="Rejected" value={resorts.filter(r => r.review_status === 'rejected').length + media.filter(m => m.review_status === 'rejected').length} color="text-brand-coral" />
            </div>

            <div className="mt-8 pt-8 border-t border-brand-navy/5">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-4">Batch Actions</h4>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    if (!window.confirm('Approve all pending items?')) return;
                    const { data: { user } } = await supabase.auth.getUser();
                    await supabase.from('resort_staging').update({ review_status: 'approved', reviewer_id: user?.id, reviewed_at: new Date().toISOString() }).eq('import_batch_id', batchId).eq('review_status', 'pending');
                    await supabase.from('media_staging').update({ review_status: 'approved', reviewer_id: user?.id, reviewed_at: new Date().toISOString() }).eq('import_batch_id', batchId).eq('review_status', 'pending');
                    fetchBatchData();
                  }}
                  className="w-full py-3 bg-brand-teal/5 text-brand-teal rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all"
                >
                  Approve All Pending
                </button>
                <button 
                  onClick={async () => {
                    if (!window.confirm('Reject all pending items?')) return;
                    const { data: { user } } = await supabase.auth.getUser();
                    await supabase.from('resort_staging').update({ review_status: 'rejected', reviewer_id: user?.id, reviewed_at: new Date().toISOString() }).eq('import_batch_id', batchId).eq('review_status', 'pending');
                    await supabase.from('media_staging').update({ review_status: 'rejected', reviewer_id: user?.id, reviewed_at: new Date().toISOString() }).eq('import_batch_id', batchId).eq('review_status', 'pending');
                    fetchBatchData();
                  }}
                  className="w-full py-3 bg-brand-coral/5 text-brand-coral rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all"
                >
                  Reject All Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string, value: number, color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</span>
      <span className={`text-lg font-serif ${color || 'text-brand-navy'}`}>{value}</span>
    </div>
  );
}

function ResortStagingCard({ resort, onUpdate }: { resort: any, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(resort.normalized_json);
  const [candidateResort, setCandidateResort] = useState<any>(null);
  const [duplicateAction, setDuplicateAction] = useState<'create' | 'update' | 'manual'>(resort.duplicate_candidate_resort_id ? 'update' : 'create');

  useEffect(() => {
    if (resort.duplicate_candidate_resort_id) {
      fetchCandidate(resort.duplicate_candidate_resort_id);
    }
  }, [resort.duplicate_candidate_resort_id]);

  const fetchCandidate = async (id: string) => {
    const { data } = await supabase.from('resorts').select('id, name, atoll, location').eq('id', id).single();
    setCandidateResort(data);
  };

  const handleStatus = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('resort_staging')
      .update({ 
        review_status: status,
        normalized_json: editedData,
        duplicate_candidate_resort_id: duplicateAction === 'update' ? resort.duplicate_candidate_resort_id : null,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', resort.id);
    
    if (!error) onUpdate();
  };

  return (
    <div className={`bg-white rounded-[40px] border transition-all overflow-hidden ${
      resort.published_at ? 'border-green-200 bg-green-50/10' :
      resort.review_status === 'approved' ? 'border-brand-teal/30 shadow-brand-teal/5' :
      resort.review_status === 'rejected' ? 'border-brand-coral/30 opacity-60' :
      'border-brand-navy/5 shadow-xl shadow-brand-navy/5'
    }`}>
      <div className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-paper rounded-2xl flex items-center justify-center text-brand-teal">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-serif text-brand-navy">{editedData.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{editedData.atoll}</span>
                <span className="text-brand-navy/20">•</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{editedData.category}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {resort.published_at && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[8px] font-bold uppercase tracking-widest">
                <CheckCircle2 size={12} /> Published
              </div>
            )}
            <div className="text-right mr-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">Confidence</p>
              <p className={`text-sm font-bold ${resort.confidence_score > 0.8 ? 'text-brand-teal' : 'text-brand-coral'}`}>
                {Math.round(resort.confidence_score * 100)}%
              </p>
            </div>
            <StatusBadge status={resort.review_status} />
          </div>
        </div>

        {candidateResort && (
          <div className="mb-8 p-6 bg-brand-coral/5 rounded-3xl border border-brand-coral/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-brand-coral" size={20} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-coral">Duplicate Candidate Detected</p>
                  <p className="text-xs font-medium text-brand-navy/60">Matches existing resort: <span className="font-bold">{candidateResort.name}</span></p>
                </div>
              </div>
              <a href={`/resort/${candidateResort.id}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:underline flex items-center gap-1">
                View Live <ExternalLink size={12} />
              </a>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setDuplicateAction('update')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  duplicateAction === 'update' ? 'bg-brand-coral text-white border-brand-coral' : 'bg-white text-brand-coral border-brand-coral/20'
                }`}
              >
                Update Existing
              </button>
              <button 
                onClick={() => setDuplicateAction('create')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  duplicateAction === 'create' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-navy/40 border-brand-navy/10'
                }`}
              >
                Create New
              </button>
              <button 
                onClick={() => setDuplicateAction('manual')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  duplicateAction === 'manual' ? 'bg-brand-paper text-brand-navy border-brand-navy/20' : 'bg-white text-brand-navy/20 border-brand-navy/5'
                }`}
              >
                Manual Follow-up
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2">Description</h4>
              <p className="text-sm text-brand-navy/70 leading-relaxed line-clamp-3">{editedData.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedData.highlights?.slice(0, 4).map((h: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-brand-paper rounded-full text-[10px] font-bold text-brand-navy/60 uppercase tracking-widest">{h}</span>
              ))}
            </div>
          </div>
          <div className="bg-brand-paper/30 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Transfer</span>
              <span className="text-xs font-bold text-brand-navy">{editedData.transfer_type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Meal Plans</span>
              <span className="text-xs font-bold text-brand-navy">{editedData.meal_plans?.length} items</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Room Types</span>
              <span className="text-xs font-bold text-brand-navy">{editedData.room_types?.length} items</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-brand-navy/5 flex justify-between items-center">
          <div className="flex gap-4">
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-brand-paper text-brand-navy rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy/10 transition-all flex items-center gap-2"
            >
              <Edit2 size={14} /> Edit Details
            </button>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => handleStatus('rejected')}
              className="px-6 py-3 bg-brand-coral/5 text-brand-coral rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all flex items-center gap-2"
            >
              <X size={14} /> Reject
            </button>
            <button 
              onClick={() => handleStatus('approved')}
              className="px-6 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all flex items-center gap-2 shadow-lg shadow-brand-teal/20"
            >
              <Check size={14} /> Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaStagingCard({ item, onUpdate }: { item: any, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState(item.reviewer_override_category_key || item.inferred_category_key);
  const [resorts, setResorts] = useState<any[]>([]);

  useEffect(() => {
    fetchResorts();
  }, []);

  const fetchResorts = async () => {
    const { data } = await supabase.from('resorts').select('id, name').order('name');
    if (data) setResorts(data);
  };

  const handleStatus = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('media_staging')
      .update({ 
        review_status: status,
        reviewer_override_category_key: category,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', item.id);
    
    if (!error) onUpdate();
  };

  const handleTargetResort = async (resortId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('media_staging')
      .update({ 
        target_resort_id: resortId,
        reviewer_id: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', item.id);
    
    if (!error) onUpdate();
  };

  return (
    <div className={`bg-white rounded-[32px] border transition-all overflow-hidden flex flex-col ${
      item.published_at ? 'border-green-200 bg-green-50/10' :
      item.review_status === 'approved' ? 'border-brand-teal/30' :
      item.review_status === 'rejected' ? 'border-brand-coral/30 opacity-60' :
      'border-brand-navy/5 shadow-xl shadow-brand-navy/5'
    }`}>
      <div className="aspect-[4/3] relative group">
        <img 
          src={item.staged_storage_path} 
          alt={item.original_filename}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button className="p-3 bg-white rounded-full text-brand-navy hover:text-brand-teal transition-all">
            <Eye size={20} />
          </button>
        </div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-widest rounded-full">
            {item.reviewer_override_category_key || item.inferred_category_key}
          </span>
        </div>
        {item.published_at && (
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-green-500 rounded-full text-white shadow-lg">
              <CheckCircle2 size={14} />
            </div>
          </div>
        )}
        {!item.published_at && item.confidence_score < 0.7 && (
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-brand-coral rounded-full text-white shadow-lg" title="Low Confidence">
              <AlertTriangle size={14} />
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-1 truncate">
            {item.original_filename}
          </p>
          <select 
            value={item.target_resort_id || ''}
            onChange={(e) => handleTargetResort(e.target.value)}
            className="w-full text-[10px] font-bold uppercase tracking-widest text-brand-teal bg-brand-teal/5 border-none rounded-lg px-3 py-2 outline-none"
          >
            <option value="">Select Target Resort</option>
            {resorts.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-[8px] font-bold uppercase tracking-widest text-brand-navy/30 mb-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-bold text-brand-navy bg-brand-paper rounded-lg px-3 py-2 outline-none border border-transparent focus:border-brand-teal/20"
            >
              <option value="main_hero">Main Hero</option>
              <option value="overview">Overview</option>
              <option value="room_types">Room Types</option>
              <option value="spa">Spa</option>
              <option value="restaurants">Restaurants</option>
              <option value="facilities">Facilities</option>
              <option value="activities">Activities</option>
              <option value="beaches">Beaches</option>
              <option value="maps">Maps</option>
              <option value="logos">Logos</option>
              <option value="uncategorized">Uncategorized</option>
            </select>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-brand-navy/5 flex gap-2">
          <button 
            onClick={() => handleStatus('rejected')}
            className="flex-1 py-2 bg-brand-coral/5 text-brand-coral rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all"
          >
            Reject
          </button>
          <button 
            onClick={() => handleStatus('approved')}
            className="flex-1 py-2 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all shadow-lg shadow-brand-teal/10"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
