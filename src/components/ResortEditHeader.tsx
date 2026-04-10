import React from 'react';

interface ResortEditHeaderProps {
  name: string;
  isAdding: boolean;
  onCancel: () => void;
  onSave: (e: React.FormEvent) => void;
  isEditing: boolean;
}

export const ResortEditHeader: React.FC<ResortEditHeaderProps> = ({ name, isAdding, onCancel, onSave, isEditing }) => (
  <div className="flex items-center justify-between pb-6 border-b border-brand-navy/10">
    <div>
      <h1 className="text-2xl font-serif text-brand-navy">{isEditing ? name : 'New Resort'}</h1>
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mt-1">
        {isEditing ? 'Edit Resort Details' : 'Create New Resort'}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button type="button" onClick={onCancel} className="px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 hover:text-brand-navy transition-all">Cancel</button>
      <button type="submit" className="bg-brand-navy text-white px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shadow-brand-navy/10">
        {isEditing ? 'Update Resort' : 'Add Resort'}
      </button>
    </div>
  </div>
);
