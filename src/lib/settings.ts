import { supabase } from '../supabase';

let settingsCache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function getSiteSettings(isPreview: boolean = false) {
  const cacheKey = isPreview ? 'preview' : 'published';
  const now = Date.now();

  if (!isPreview && settingsCache[cacheKey] && (now - settingsCache[cacheKey].timestamp < CACHE_DURATION)) {
    return settingsCache[cacheKey].data;
  }

  const defaults = {
    hero: {
      title: 'Curating the Maldives for the World’s Leading Travel Professionals',
      subtitle: 'Exclusive resort partnerships, seamless destination management, and real-time booking intelligence.',
      banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
      banner_type: 'image',
      partners_title: 'Top Properties'
    },
    expertise_stats: [
      { value: '198+', label: 'Resorts' },
      { value: '20+', label: 'Years Experience' },
      { value: '24/7', label: 'Local Support' },
      { value: 'Global', label: 'Travel Partners' }
    ],
    introduction: {
      title: 'The B2B Gateway to Luxury Travel in the Maldives',
      summary: 'A destination management and digital distribution platform connecting global travel professionals with the Maldives’ most exceptional resorts and experiences.'
    },
    why_us: [
      { title: 'Local Expertise', description: 'Deep-rooted knowledge and on-ground presence in the Maldives.' },
      { title: 'Exclusive Resort Partnerships', description: 'Direct contracts and priority access to the finest island retreats.' },
      { title: 'Seamless Operations', description: 'Flawless execution from arrival to departure.' },
      { title: '24/7 Guest Support', description: 'Round-the-clock dedicated assistance for your VIP clients.' }
    ],
    platform_excellence: {
      title: 'Why Travel Designers Choose Us',
      description: '',
      features: [
        { title: 'Local Expertise', description: 'Deep-rooted knowledge and on-ground presence in the Maldives.' },
        { title: 'Exclusive Resort Partnerships', description: 'Direct contracts and priority access to the finest island retreats.' },
        { title: 'Seamless Operations', description: 'Flawless execution from arrival to departure.' },
        { title: '24/7 Guest Support', description: 'Round-the-clock dedicated assistance for your VIP clients.' }
      ]
    },
    global_markets: [
      { name: 'Russia & CIS', description: 'Supporting travel designers and agencies across global markets.' },
      { name: 'Europe & UK', description: 'Supporting travel designers and agencies across global markets.' },
      { name: 'Middle East (GCC)', description: 'Supporting travel designers and agencies across global markets.' },
      { name: 'Asia Pacific', description: 'Supporting travel designers and agencies across global markets.' },
      { name: 'North America', description: 'Supporting travel designers and agencies across global markets.' }
    ],
    awards: {
      title: 'Prestigious Awards',
      summary: '',
      items: [
        { url: 'https://picsum.photos/seed/award1/200/200' },
        { url: 'https://picsum.photos/seed/award2/200/200' },
        { url: 'https://picsum.photos/seed/award3/200/200' }
      ]
    },
    services: [
      { title: 'Luxury Resort Reservations', icon: 'Hotel', desc: 'Direct contracts and preferred rates with top-tier properties.' },
      { title: 'Private Transfers & Aviation', icon: 'Plane', desc: 'Seamless seaplane, domestic flight, and luxury yacht logistics.' },
      { title: 'Tailor-Made Itineraries', icon: 'Map', desc: 'Bespoke travel planning for discerning clients.' },
      { title: 'VIP Guest Services', icon: 'UserCheck', desc: 'Fast-track arrival, dedicated concierge, and personalized care.' },
      { title: 'Experiences & Excursions', icon: 'Compass', desc: 'Curated diving, dining, and cultural immersions.' },
      { title: 'Event & Group Travel', icon: 'Calendar', desc: 'Specialized handling for weddings, corporate retreats, and MICE.' }
    ],
    hero_partners: [
      { url: 'https://picsum.photos/seed/partner1/200/100' },
      { url: 'https://picsum.photos/seed/partner2/200/100' },
      { url: 'https://picsum.photos/seed/partner3/200/100' },
      { url: 'https://picsum.photos/seed/partner4/200/100' }
    ],
    travel_guide: [
      { title: 'Best Atolls for Diving', category: 'Destinations', img: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?auto=format&fit=crop&q=80' },
      { title: 'When to Visit the Maldives', category: 'Planning', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80' },
      { title: 'Seaplane vs. Speedboat', category: 'Transfers', img: 'https://images.unsplash.com/photo-1546026423-cc46426e97b7?auto=format&fit=crop&q=80' },
      { title: 'Luxury Resorts Guide', category: 'Accommodation', img: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80' }
    ],
    navbar: [
      { label: 'Home', path: '/' },
      { label: 'Resorts', path: '/resorts' },
      { label: 'Experiences', path: '/experiences' },
      { label: 'Platform', path: '/#platform' },
      { label: 'About', path: '/#about' },
      { label: 'Partner With Us', path: '/become-partner' }
    ],
    footer: {
      contact: { email: 'info@excitingmaldives.com', phone: '+960 123 4567', address: 'Male, Maldives' },
      social: { instagram: '', linkedin: '', facebook: '', twitter: '' },
      important_links: [
        { label: 'Resorts', path: '/resorts' },
        { label: 'Experiences', path: '/experiences' },
        { label: 'Partner With Us', path: '/become-partner' }
      ],
      legal_links: [{ label: 'Privacy Policy', path: '/legal' }]
    }
  };

  try {
    const { data, error } = await supabase.from('site_settings').select('*');
    
    if (error) {
      if (error.code !== 'PGRST205') {
        console.error('Error fetching site settings:', error);
      }
      return defaults;
    }

    const settingsMap: any = {};

    const publishedSettings = data.filter((s: any) => s.key.endsWith(':published'));
    publishedSettings.forEach((s: any) => {
      const key = s.key.replace(':published', '');
      let value = s.value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (parsed !== null && typeof parsed === 'object') {
            value = parsed;
          }
        } catch (e) {}
      }
      settingsMap[key] = value;
    });

    if (isPreview) {
      const draftSettings = data.filter((s: any) => s.key.endsWith(':draft'));
      draftSettings.forEach((s: any) => {
        const key = s.key.replace(':draft', '');
        let value = s.value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (parsed !== null && typeof parsed === 'object') {
              value = parsed;
            }
          } catch (e) {}
        }
        settingsMap[key] = value;
      });
    }

    const result = { ...defaults, ...settingsMap };
    if (!isPreview) {
      settingsCache[cacheKey] = { data: result, timestamp: now };
    }
    return result;
  } catch (err) {
    return defaults;
  }
}
