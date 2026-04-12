import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: any[];
  initialIndex?: number;
  title?: string;
  showFilters?: boolean;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  title,
  showFilters = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = useMemo(() => {
    if (!showFilters) return [];
    const cats = new Set(media.map(m => m.resort_media_categories?.label || m.category || 'Uncategorized'));
    return ['all', ...Array.from(cats)];
  }, [media, showFilters]);

  const filteredMedia = useMemo(() => {
    if (activeCategory === 'all') return media;
    return media.filter(m => (m.resort_media_categories?.label || m.category || 'Uncategorized') === activeCategory);
  }, [media, activeCategory]);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setActiveCategory('all');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
  }, [filteredMedia.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
  }, [filteredMedia.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') onClose();
  }, [handleNext, handlePrev, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || filteredMedia.length === 0) return null;

  const currentMedia = filteredMedia[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-brand-navy/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-8 gap-6">
          <div>
            <h3 className="text-white font-serif text-xl md:text-2xl">{title || 'Gallery'}</h3>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">
              {currentIndex + 1} of {filteredMedia.length}
            </p>
          </div>

          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setCurrentIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat 
                      ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 self-end md:self-auto">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative flex items-center justify-center px-4 md:px-20 overflow-hidden">
          <button
            onClick={handlePrev}
            className="absolute left-4 md:left-8 z-10 p-4 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronLeft size={32} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.05, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`relative max-w-full max-h-full flex items-center justify-center ${isFullscreen ? 'w-screen h-screen' : ''}`}
            >
              <img
                src={currentMedia.storage_path}
                alt={currentMedia.original_filename || 'Gallery Image'}
                className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain shadow-2xl rounded-lg"
                referrerPolicy="no-referrer"
              />
              {currentMedia.room_type_name && (
                <div className="absolute bottom-[-40px] left-0 right-0 text-center">
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    {currentMedia.room_type_name}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 z-10 p-4 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <ChevronRight size={32} />
          </button>
        </div>

        {/* Thumbnail Strip */}
        <div className="p-6 md:p-8 bg-black/20">
          <div className="max-w-5xl mx-auto flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {filteredMedia.map((m, idx) => (
              <button
                key={m.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === idx ? 'border-brand-teal scale-110 shadow-lg z-10' : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <img
                  src={m.storage_path}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
