import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getSiteSettings } from '../lib/settings';

export default function CustomPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const isPreview = searchParams.get('preview') === 'true';
      const settings = await getSiteSettings(isPreview);
      
      const safeArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch (e) {}
        }
        return [];
      };

      const customPages = safeArray(settings.custom_pages);
      const found = customPages.find((p: any) => p.slug === slug);
      setPage(found);
      setLoading(false);
    };
    fetchPage();
  }, [slug, searchParams]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div></div>;
  if (!page) return <div className="min-h-screen flex items-center justify-center text-brand-navy font-serif text-2xl">Page Not Found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-24 px-4 bg-white"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-serif text-brand-navy mb-12">{page.title}</h1>
        <div 
          className="prose prose-lg max-w-none font-sans text-brand-navy/80 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </motion.div>
  );
}
