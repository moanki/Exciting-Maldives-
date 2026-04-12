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
  subtitle,
  media,
  onViewMore
}) => {
  if (!media || media.length === 0) return null;

  // Take first 3 images for the preview
  const previewMedia = media.slice(0, 3);

  return (
    <section className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-brand-navy">
            {title} <span className="italic text-brand-teal">{subtitle || 'Gallery'}</span>
          </h2>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-navy/30 mt-2">
            {media.length} Photos Available
          </p>
        </div>
        <button
          onClick={onViewMore}
          className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-teal hover:text-brand-navy transition-all"
        >
          View Full Gallery
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[400px] md:h-[500px]">
        {/* Large Editorial Image */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="md:col-span-7 relative rounded-[32px] overflow-hidden cursor-pointer group shadow-lg"
          onClick={onViewMore}
        >
          <img
            src={previewMedia[0].storage_path}
            alt={`${title} 1`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>

        {/* Two Stacked Smaller Images */}
        <div className="md:col-span-5 grid grid-rows-2 gap-4">
          {previewMedia.slice(1).map((m, idx) => (
            <motion.div
              key={m.id || idx}
              whileHover={{ scale: 1.02 }}
              className="relative rounded-[24px] overflow-hidden cursor-pointer group shadow-md"
              onClick={onViewMore}
            >
              <img
                src={m.storage_path}
                alt={`${title} ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {idx === 1 && media.length > 3 && (
                <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                  <ImageIcon size={24} className="mb-2 opacity-60" />
                  <span className="text-xl font-serif">+{media.length - 3}</span>
                  <span className="text-[8px] uppercase tracking-widest font-bold opacity-60 mt-1">More Photos</span>
                </div>
              )}
            </motion.div>
          ))}
          
          {/* Fallback if only 1 or 2 images */}
          {previewMedia.length < 3 && (
            <div className="rounded-[24px] bg-brand-paper/40 border border-brand-navy/5 flex items-center justify-center">
              <ImageIcon size={32} className="text-brand-navy/10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
