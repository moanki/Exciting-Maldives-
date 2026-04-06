import { supabase } from '../supabase';

let settingsCache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_DURATION = 1000 * 30; // Reduced to 30 seconds for better responsiveness

export function clearSettingsCache() {
  settingsCache = {};
}

export async function getSiteSettings(isPreview: boolean = false, force: boolean = false) {
  const cacheKey = isPreview ? 'preview' : 'published';
  const now = Date.now();

  if (!force && !isPreview && settingsCache[cacheKey] && (now - settingsCache[cacheKey].timestamp < CACHE_DURATION)) {
    return settingsCache[cacheKey].data;
  }

  const defaults = {
    logos: {
      primary: '',
      white: '',
      black: ''
    },
    hero: {
      title: 'Curating the Maldives for the World’s Leading Travel Professionals',
      subtitle: 'Exclusive resort partnerships, seamless destination management, and real-time booking intelligence.',
      banner_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=85&w=1920',
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
    why_us_title: 'Why Travel Designers Choose Us',
    why_us: [
      { title: 'Local Expertise', description: 'Deep-rooted knowledge and on-ground presence in the Maldives.' },
      { title: 'Exclusive Resort Partnerships', description: 'Direct contracts and priority access to the finest island retreats.' },
      { title: 'Seamless Operations', description: 'Flawless execution from arrival to departure.' },
      { title: '24/7 Guest Support', description: 'Round-the-clock dedicated assistance for your VIP clients.' }
    ],
    platform_excellence: {
      title: 'Why Travel Designers Choose Us',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8',
      badge_text: 'Platform Excellence',
      images: [],
      features: [
        { title: 'Local Expertise', description: 'Deep-rooted knowledge and on-ground presence in the Maldives.' },
        { title: 'Exclusive Resort Partnerships', description: 'Direct contracts and priority access to the finest island retreats.' },
        { title: 'Seamless Operations', description: 'Flawless execution from arrival to departure.' },
        { title: '24/7 Guest Support', description: 'Round-the-clock dedicated assistance for your VIP clients.' }
      ]
    },
    our_story: {
      title: 'A Legacy of Luxury in the Maldives',
      content: 'Our role as a specialized B2B DMC is to be the extension of your team on the ground, ensuring every detail is executed with precision. We understand that your reputation relies on our flawless execution.',
      image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8'
    },
    ceo_message: {
      name: 'Elias Jancel',
      title: 'Founder & CEO',
      quote: '“Our mission is to connect the world’s leading travel designers with the extraordinary experiences of the Maldives.”',
      message: 'Founded on the principles of discretion and excellence, we have spent two decades building intimate relationships with the Maldives\' most secluded resorts.',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2'
    },
    global_markets: [
      { name: 'Europe', description: 'Supporting luxury agencies across the UK, DACH, and Southern Europe.', lat: '48.8566', lng: '2.3522', countries: 'UK, Germany, France, Italy' },
      { name: 'Middle East', description: 'Curated VIP and ultra-luxury services for GCC travelers.', lat: '25.2048', lng: '55.2708', countries: 'UAE, Saudi Arabia, Qatar' },
      { name: 'Asia', description: 'Tailored solutions for high-net-worth clients from emerging Asian markets.', lat: '1.3521', lng: '103.8198', countries: 'Singapore, China, Japan' },
      { name: 'North America', description: 'Seamless long-haul travel planning and exclusive access.', lat: '40.7128', lng: '-74.0060', countries: 'USA, Canada' },
      { name: 'Australia', description: 'Bespoke itineraries for discerning travelers from Oceania.', lat: '-33.8688', lng: '151.2093', countries: 'Australia, New Zealand' }
    ],
    featured_retreats_title: 'Featured Retreats',
    awards: {
      title: 'Prestigious Awards',
      summary: '',
      items: [
        { url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400' },
        { url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=400' },
        { url: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=400' }
      ]
    },
    ctas: {
      partner_title: 'Join Our Global Network of Travel Professionals',
      partner_btn: 'Become a Travel Partner',
      guide_title: 'The Maldives Travel Guide',
      guide_btn: 'View All Insights',
      retreats_title: 'Featured Retreats',
      retreats_btn: 'View All Resorts',
      bg_image_url: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21'
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
      { url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=300' },
      { url: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=300' },
      { url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&q=80&w=300' },
      { url: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&q=80&w=300' }
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

    // 1. Load legacy settings (no suffix)
    data.forEach((s: any) => {
      if (!s.key.includes(':')) {
        let value = s.value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            value = parsed;
          } catch (e) {}
        }
        settingsMap[s.key] = value;
      }
    });

    // 2. Load published settings (overrides legacy)
    const publishedSettings = data.filter((s: any) => s.key.endsWith(':published'));
    publishedSettings.forEach((s: any) => {
      const key = s.key.replace(':published', '');
      let value = s.value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          value = parsed;
        } catch (e) {}
      }
      settingsMap[key] = value;
    });

    // 3. Load draft settings if in preview mode
    if (isPreview) {
      const draftSettings = data.filter((s: any) => s.key.endsWith(':draft'));
      draftSettings.forEach((s: any) => {
        const key = s.key.replace(':draft', '');
        let value = s.value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            value = parsed;
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
