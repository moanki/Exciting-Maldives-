import React from 'react';

interface ResortSectionNavProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ResortSectionNav: React.FC<ResortSectionNavProps> = ({ tabs, activeTab, setActiveTab }) => (
  <div className="flex gap-8 border-b border-brand-navy/10 mb-8">
    {tabs.map(tab => (
      <button
        key={tab}
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-brand-teal border-b-2 border-brand-teal' : 'text-brand-navy/40 hover:text-brand-navy'}`}
      >
        {tab}
      </button>
    ))}
  </div>
);
