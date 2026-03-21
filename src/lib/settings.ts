import { supabase } from '../supabase';

export async function getSiteSettings(isPreview: boolean = false) {
  const { data, error } = await supabase.from('site_settings').select('*');
  if (error) {
    console.error('Error fetching site settings:', error);
    return {};
  }

  const suffix = isPreview ? ':draft' : ':published';
  
  // First try to get settings with the preferred suffix
  const preferredSettings = data.filter((s: any) => s.key.endsWith(suffix));
  
  if (preferredSettings.length > 0) {
    return preferredSettings.reduce((acc: any, curr: any) => {
      const key = curr.key.replace(suffix, '');
      acc[key] = curr.value;
      return acc;
    }, {});
  }

  // If no preferred settings, fall back to the other suffix or just the key itself
  const otherSuffix = isPreview ? ':published' : ':draft';
  const otherSettings = data.filter((s: any) => s.key.endsWith(otherSuffix));
  
  if (otherSettings.length > 0) {
    return otherSettings.reduce((acc: any, curr: any) => {
      const key = curr.key.replace(otherSuffix, '');
      acc[key] = curr.value;
      return acc;
    }, {});
  }

  // Final fallback: provide default values as requested by user
  const defaults = {
    hero: {
      title: 'The Art of Maldivian Luxury',
      subtitle: 'Bespoke Destination Management for Travel Professionals',
      banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
      banner_type: 'image'
    },
    introduction: {
      title: 'Bespoke Destination Management',
      summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships. We offer tailored, high-end travel solutions that highlight the beauty and culture of the Maldives, ensuring our partners can deliver unforgettable and seamless experiences to their clients.'
    }
  };

  const settings = data.reduce((acc: any, curr: any) => {
    const key = curr.key.replace(':draft', '').replace(':published', '');
    acc[key] = curr.value;
    return acc;
  }, {});

  return { ...defaults, ...settings };
}
