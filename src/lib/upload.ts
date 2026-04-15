import { supabase } from '../supabase';

export async function uploadFile(file: File, path: string, bucket: string = 'site-assets', setUploadProgress?: (p: number | null) => void, showNotification?: (msg: string) => void) {
  if (setUploadProgress) setUploadProgress(0);
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    if (setUploadProgress) setUploadProgress(null);
    console.error('Upload error:', uploadError);
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error(`Storage bucket "${bucket}" not found. Please click "Copy SQL" at the top of the dashboard and run it in your Supabase SQL Editor to create the required tables and buckets.`);
    } else {
      throw new Error(`Upload error: ${uploadError.message}`);
    }
  }

  if (setUploadProgress) setUploadProgress(null);
  if (showNotification) showNotification('Uploaded Successfully');

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadResortFile(file: File, resortName: string, category: string, setUploadProgress?: (p: number | null) => void, showNotification?: (msg: string) => void, isStaging: boolean = false) {
  if (setUploadProgress) setUploadProgress(0);
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const baseDir = isStaging ? 'staging/resorts' : 'resorts';
  const filePath = `${baseDir}/${resortName.toLowerCase().replace(/\s+/g, '-')}/${category.toLowerCase().replace(/\s+/g, '-')}/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file);

  if (uploadError) {
    if (setUploadProgress) setUploadProgress(null);
    console.error('Upload error:', uploadError);
    throw new Error(uploadError.message || 'Upload failed');
  }

  if (setUploadProgress) setUploadProgress(null);
  if (showNotification) showNotification('Uploaded Successfully');

  const { data: { publicUrl } } = supabase.storage
    .from('site-assets')
    .getPublicUrl(filePath);

  return publicUrl;
}
