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
          <div key={resort.id} className="min-w-[300px] md:min-w-[400px] group">
            <div className="overflow-hidden rounded-3xl">
              <img 
                src={resort.images?.[0] || 'https://picsum.photos/seed/resort/800/600'} 
                alt={resort.name} 
                className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-2xl font-serif mt-6">{resort.name}</h3>
            <Link to={`/resorts/${resort.id}`} className="text-sm font-bold uppercase tracking-widest text-brand-teal hover:text-brand-navy transition-colors mt-2 block">View Resort</Link>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
