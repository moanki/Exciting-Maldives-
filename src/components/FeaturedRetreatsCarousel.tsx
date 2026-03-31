import { motion, useMotionValue, useSpring } from 'motion/react';
import { Link } from 'react-router-dom';

export default function FeaturedRetreatsCarousel({ resorts }: { resorts: any[] }) {
  const x = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(x, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const relativeX = (clientX - left) / width;
    // Move carousel based on mouse position
    x.set(-relativeX * (width * 0.5)); 
  };

  return (
    <div className="overflow-hidden cursor-grab py-10" onMouseMove={handleMouseMove}>
      <motion.div 
        className="flex gap-10"
        style={{ x: smoothX }}
      >
        {resorts.map((resort) => (
          <div key={resort.id} className="min-w-[300px] md:min-w-[450px] group">
            <div className="overflow-hidden rounded-[2rem] aspect-[4/3] relative">
              <img 
                src={resort.images?.[0] || 'https://picsum.photos/seed/resort/800/600'} 
                alt={resort.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 backdrop-blur-md text-brand-navy px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  {resort.category || 'Luxury'}
                </span>
              </div>
            </div>
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal">
                <span>{resort.atoll}</span>
              </div>
              <h3 className="text-3xl font-serif text-brand-navy group-hover:text-brand-teal transition-colors duration-300">{resort.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 font-sans leading-relaxed">
                {resort.description}
              </p>
              <Link to={`/resorts/${resort.id}`} className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-navy hover:text-brand-teal transition-all mt-4 group/link">
                Explore Resort
                <span className="w-8 h-[1px] bg-brand-navy group-hover/link:w-12 group-hover/link:bg-brand-teal transition-all"></span>
              </Link>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
