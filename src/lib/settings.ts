import { supabase } from '../supabase';

export async function getSiteSettings(isPreview: boolean = false) {
  const defaults = {
    hero: {
      title: 'Curating the Maldives for the World’s Leading Travel Professionals',
      subtitle: 'Exclusive resort partnerships, seamless destination management, and real-time booking intelligence.',
      banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
      banner_type: 'image'
    },
    introduction: {
      title: 'The B2B Gateway to Luxury Travel in the Maldives',
      summary: 'A destination management and digital distribution platform connecting global travel professionals with the Maldives’ most exceptional resorts and experiences.'
    },
    why_us: [
      { title: 'Curated Luxury Portfolio', description: 'Hand-selected partnerships with the Maldives’ most exceptional resorts.' },
      { title: 'Operational Excellence', description: 'Seamless coordination, logistics, and concierge-level destination management.' },
      { title: 'Real-Time Intelligence', description: 'Dynamic pricing, instant quotations, and live availability.' }
    ],
    platform_excellence: [
      { title: 'Real-Time Quotations & Dynamic Pricing', description: 'Instant access to the most competitive rates in the market.' },
      { title: '24/7 Reservation Portal', description: 'Manage your bookings anytime, anywhere with our intuitive interface.' },
      { title: 'Live Offer Repository', description: 'Stay updated with the latest seasonal offers and exclusive deals.' },
      { title: 'SAMO & Master Tour Integration', description: 'Seamlessly sync with industry-standard management systems.' }
    ],
    global_markets: [
      { name: 'Russia & CIS', description: 'Dedicated support for one of our strongest market segments.' },
      { name: 'Europe', description: 'Deep connections across the UK, Germany, and Western Europe.' },
      { name: 'Middle East', description: 'Specialized services for high-net-worth travelers from the GCC.' }
    ],
    awards: {
      title: 'Awards & Recognition',
      summary: 'Trusted by the industry, recognized for excellence.',
      items: [
        { label: 'TTM Top Producer', year: '4 Consecutive Years' }
      ]
    },
    services: [
      { title: 'Accommodation & Booking', icon: 'Hotel' },
      { title: 'Transportation & Transfers', icon: 'Plane' },
      { title: 'Concierge Services', icon: 'UserCheck' },
      { title: 'Event Management', icon: 'Calendar' },
      { title: 'Meet & Greet', icon: 'Smile' }
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
      settingsMap[key] = s.value;
    });

    if (isPreview) {
      const draftSettings = data.filter((s: any) => s.key.endsWith(':draft'));
      draftSettings.forEach((s: any) => {
        const key = s.key.replace(':draft', '');
        settingsMap[key] = s.value;
      });
    }

    return { ...defaults, ...settingsMap };
  } catch (err) {
    return defaults;
  }
}
