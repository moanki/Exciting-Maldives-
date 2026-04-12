import React from 'react';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface MediaGallerySectionProps {
  title: string;
  subtitle?: string;
  media: any[];
  onViewMore: () => void;
}

export const MediaGallerySection: React.FC<MediaGallerySectionProps> = ({
  title,
  media,
  onViewMore
}) => {
  if (!media || media.length === 0) return null;

  // Take first 3 images for the preview
  const previewMedia = media.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-brand-navy">{title}</h2>
        {media.length > 3 && (
          <button
            onClick={onViewMore}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:text-brand-navy transition-all"
          >
            View More
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {previewMedia.map((m, idx) => (
          <motion.div
            key={m.id || idx}
            whileHover={{ scale: 1.02 }}
            className="aspect-video rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
            onClick={onViewMore}
          >
            <img
              src={m.storage_path}
              alt={`${title} ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
