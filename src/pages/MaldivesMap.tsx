import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';

export default function MaldivesMap() {
  const atolls = [
    { name: "North Malé Atoll", resorts: 24, x: "50%", y: "40%" },
    { name: "South Malé Atoll", resorts: 18, x: "50%", y: "55%" },
    { name: "Ari Atoll", resorts: 32, x: "35%", y: "50%" },
    { name: "Baa Atoll", resorts: 15, x: "40%", y: "25%" },
    { name: "Lhaviyani Atoll", resorts: 12, x: "55%", y: "20%" },
    { name: "Dhaalu Atoll", resorts: 10, x: "45%", y: "75%" }
  ];

  return (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-serif mb-4 text-brand-ink">Island <span className="italic">Geography</span></h1>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-bold font-sans">Explore the 26 natural atolls of the Maldives</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Map Visualization */}
          <div className="relative aspect-[3/4] bg-blue-50 rounded-[40px] overflow-hidden border border-blue-100 shadow-inner p-12">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative w-full h-full">
              {atolls.map((atoll, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="absolute group cursor-pointer"
                  style={{ left: atoll.x, top: atoll.y }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-brand-teal rounded-full shadow-lg group-hover:scale-150 transition-transform"></div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <p className="text-xs font-bold uppercase tracking-widest font-sans">{atoll.name}</p>
                      <p className="text-[10px] text-gray-400 font-sans">{atoll.resorts} Resorts</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="absolute bottom-8 left-8 text-[10px] text-blue-400 uppercase tracking-[0.5em] font-bold font-sans">
              Indian Ocean
            </div>
          </div>

          {/* Atoll List */}
          <div className="space-y-8">
            <h2 className="text-3xl font-serif text-brand-ink">Resort Zones</h2>
            <p className="text-gray-500 font-sans font-light leading-relaxed text-lg">
              The Maldives is divided into administrative atolls, each offering a unique experience. From the vibrant North Malé to the pristine Baa Atoll (a UNESCO Biosphere Reserve).
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {atolls.map((atoll, idx) => (
                <div key={idx} className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-brand-teal/20 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-lg text-brand-ink group-hover:text-brand-teal transition-colors">{atoll.name}</h3>
                    <MapPin size={16} className="text-gray-300 group-hover:text-brand-teal transition-colors" />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 font-sans">{atoll.resorts} Exclusive Resorts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
