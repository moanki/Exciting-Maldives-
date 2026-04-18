import React, { useState } from 'react';
import { supabase } from '../../supabase';
import { apiFetch } from '../../lib/api';
import { Save, Loader2, Key } from 'lucide-react';

export const GeminiSettings = ({ showNotification }: { showNotification: (msg: string) => void }) => {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey || apiKey.trim().length < 8) {
      showNotification('Please enter a valid API key');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await apiFetch('/api/settings/update-gemini-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save key');
      }

      showNotification('Gemini API Key updated successfully');
      setApiKey('');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-brand-navy/10 shadow-sm space-y-6">
      <div>
        <h2 className="text-sm font-bold text-brand-navy uppercase tracking-widest flex items-center gap-2">
          <Key size={16} />
          Gemini API Configuration
        </h2>
        <p className="text-[10px] text-brand-navy/40 font-bold uppercase tracking-widest mt-1">
          Securely update the Gemini API key used for AI-powered features.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Enter New Gemini API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIza..."
          className="w-full bg-brand-paper/30 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm focus:border-brand-teal outline-none transition-all"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-navy transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save API Key'}
        </button>
      </div>
    </div>
  );
};
