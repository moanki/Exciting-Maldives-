import { motion } from 'motion/react';
import { Info, Plane, Sun, Wallet, ShieldCheck, HelpCircle } from 'lucide-react';

export default function TouristInfo() {
  const sections = [
    {
      title: "Visa & Entry",
      icon: <ShieldCheck size={32} />,
      content: "All nationalities receive a 30-day free visa on arrival. You'll need a valid passport, a confirmed resort booking, and a return ticket."
    },
    {
      title: "Weather & Seasons",
      icon: <Sun size={32} />,
      content: "The Maldives is a year-round destination. High season is December to April (dry), while May to November is the wet season (surf season)."
    },
    {
      title: "Connectivity",
      icon: <Plane size={32} />,
      content: "Velana International Airport (MLE) is the main gateway. Transfers to resorts are via seaplane, speedboat, or domestic flight."
    },
    {
      title: "Currency & Payments",
      icon: <Wallet size={32} />,
      content: "The local currency is Maldivian Rufiyaa (MVR), but US Dollars and major credit cards are widely accepted in all resorts."
    }
  ];

  return (
    <div className="pb-24 bg-brand-paper/30">
      <div className="bg-brand-navy text-white py-32 px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-serif mb-6"
        >
          Travel <span className="italic text-brand-beige">Guide</span>
        </motion.h1>
        <p className="text-white/60 uppercase tracking-[0.4em] text-[10px] font-bold font-sans">Everything you need to know before you go</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-10 rounded-3xl shadow-xl shadow-brand-navy/5 border border-brand-navy/5"
          >
            <div className="text-brand-teal mb-6">{section.icon}</div>
            <h2 className="text-2xl font-serif mb-4 text-brand-navy">{section.title}</h2>
            <p className="text-brand-navy/60 font-sans font-light leading-relaxed text-sm">{section.content}</p>
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-24 text-center">
        <HelpCircle className="mx-auto mb-6 text-brand-beige" size={48} />
        <h2 className="text-3xl font-serif mb-6 text-brand-navy">Need more information?</h2>
        <p className="text-brand-navy/60 mb-10 font-sans font-light text-lg">
          Our team of experts is available 24/7 to assist with any specific inquiries regarding travel regulations or resort-specific requirements.
        </p>
        <button className="bg-brand-navy text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal transition-all font-sans shadow-lg shadow-brand-navy/10">
          Contact Support
        </button>
      </div>
    </div>
  );
}
