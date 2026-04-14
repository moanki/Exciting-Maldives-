import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearMedia() {
  console.log('Fetching all resort media...');
  const { data: media, error: fetchError } = await supabase
    .from('resort_media')
    .select('*');

  if (fetchError) {
    console.error('Error fetching media:', fetchError);
    return;
  }

  if (!media || media.length === 0) {
    console.log('No media found in the database.');
    return;
  }

  console.log(`Found ${media.length} media items. Deleting from storage and database...`);

  const storagePaths = media.map(m => m.storage_path).filter(Boolean);

  // Extract file paths from URLs if necessary
  const filePaths = storagePaths.map(path => {
    try {
      const url = new URL(path);
      const parts = url.pathname.split('/site-assets/');
      if (parts.length > 1) {
        return parts[1];
      }
      return path;
    } catch (e) {
      return path;
    }
  });

  if (filePaths.length > 0) {
    console.log(`Deleting ${filePaths.length} files from storage bucket 'site-assets'...`);
    const { error: storageError } = await supabase.storage
      .from('site-assets')
      .remove(filePaths);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    } else {
      console.log('Successfully deleted files from storage.');
    }
  }

  console.log('Deleting records from database...');
  const { error: dbError } = await supabase
    .from('resort_media')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (dbError) {
    console.error('Error deleting from database:', dbError);
  } else {
    console.log('Successfully deleted records from database.');
  }

  console.log('Done.');
}

clearMedia();
