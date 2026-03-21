import { supabase } from '../supabase';

export async function getSiteSettings(isPreview: boolean = false) {
  try {
    const { data, error } = await supabase.from('site_settings').select('*');
    
    if (error) {
      // If table doesn't exist (PGRST205), we just return defaults silently
      if (error.code !== 'PGRST205') {
        console.error('Error fetching site settings:', error);
      }
      return {
        hero: {
          title: 'The Art of Maldivian Luxury',
          subtitle: 'Bespoke Destination Management for Travel Professionals',
          banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080',
          banner_type: 'image'
        },
        introduction: {
          title: 'Bespoke Destination Management',
          summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships.'
        }
      };
    }

    const settingsMap: any = {};

    // 1. Load published settings first
    const publishedSettings = data.filter((s: any) => s.key.endsWith(':published'));
    publishedSettings.forEach((s: any) => {
      const key = s.key.replace(':published', '');
      settingsMap[key] = s.value;
    });

    // 2. If preview mode, overlay draft settings
    if (isPreview) {
      const draftSettings = data.filter((s: any) => s.key.endsWith(':draft'));
      draftSettings.forEach((s: any) => {
        const key = s.key.replace(':draft', '');
        settingsMap[key] = s.value;
      });
    }

    // 3. Apply defaults for missing critical sections
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
      },
      why_us: [
        { title: 'Authentic Connections', description: 'We focus on fostering genuine relationships with our B2B partners by understanding their needs and providing personalized solutions.' },
        { title: 'Curated Luxury', description: 'Our strategy centers on curating unique luxury experiences that showcase the beauty and culture of the Maldives.' },
        { title: 'Streamlined Collaboration', description: 'We aim to enhance collaboration that simplify the booking process and improve communication, ensuring seamless service delivery.' },
        { title: 'Tailored Support', description: 'We offer dedicated support to our partners, providing them with the insights and resources needed to effectively promote our offerings.' }
      ],
      navbar: [
        { label: 'Resorts', path: '/resorts' },
        { label: 'Map', path: '/map' },
        { label: 'Info', path: '/tourist-info' }
      ],
      footer: {
        contact: { email: 'info@excitingmaldives.com', phone: '+960 123 4567', address: 'Male, Maldives' },
        social: { instagram: '', linkedin: '', facebook: '', twitter: '' },
        important_links: [{ label: 'Resorts', path: '/resorts' }],
        legal_links: [{ label: 'Privacy Policy', path: '/legal' }]
      }
    };

    return { ...defaults, ...settingsMap };
  } catch (err) {
    return {
      hero: { title: 'The Art of Maldivian Luxury', subtitle: 'Bespoke Destination Management for Travel Professionals', banner_url: 'https://picsum.photos/seed/maldives-luxury/1920/1080', banner_type: 'image' },
      introduction: { title: 'Bespoke Destination Management', summary: 'Exciting Maldives is a bespoke Destination Management Company specializing in B2B partnerships.' }
    };
  }
}
