import { supabase } from '../supabase';

export interface MediaStagingItem {
  url: string;
  category: string;
  subcategory?: string;
  original_filename?: string;
  source_url?: string;
  room_type_name?: string;
}

export const importService = {
  async createBatch(data: { batch_type: string; source_type: string; source_ref?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        batch_type: data.batch_type,
        source_type: data.source_type,
        source_ref: data.source_ref,
        status: 'ingested',
        created_by: user.id,
        summary_json: {
          resorts: { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 },
          media: { total: 0, pending: 0, approved: 0, rejected: 0, published: 0 }
        }
      })
      .select()
      .single();

    if (error) throw error;
    return batch;
  },

  async stageMediaItems(batchId: string, targetResortId: string, mediaItems: MediaStagingItem[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const stagingItems = mediaItems.map(item => ({
      import_batch_id: batchId,
      target_resort_id: targetResortId,
      original_url: item.source_url,
      staged_storage_path: item.url,
      original_filename: item.original_filename,
      inferred_category_key: item.category,
      inferred_subcategory: item.subcategory,
      inferred_room_type_name: item.room_type_name,
      review_status: 'pending',
      confidence_score: 1.0,
      metadata_json: {
        source: 'manual_upload',
        uploaded_at: new Date().toISOString()
      }
    }));

    const { data, error } = await supabase
      .from('media_staging')
      .insert(stagingItems)
      .select();

    if (error) throw error;
    return data;
  },

  async publishBatch(batchId: string) {
    const { data, error } = await supabase.rpc('publish_import_batch', { batch_id: batchId });
    if (error) throw error;
    return data;
  }
};
