import { supabase } from './src/supabase';

async function checkSchema() {
  try {
    const { data: resources, error: resError } = await supabase.from('resources').select('*').limit(1);
    console.log('Resources table:', resError ? 'Error: ' + resError.message : 'OK');
    
    const { data: protectedResources, error: protError } = await supabase.from('protected_resources').select('*').limit(1);
    console.log('Protected Resources table:', protError ? 'Error: ' + protError.message : 'OK');

    const { data: resortMedia, error: mediaError } = await supabase.from('resort_media').select('*').limit(1);
    console.log('Resort Media table:', mediaError ? 'Error: ' + mediaError.message : 'OK');
  } catch (e) {
    console.error(e);
  }
}
checkSchema();
