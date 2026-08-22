import React, { useState, useEffect } from 'react';
import { User, Settings, Save, Moon, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [name, setName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('libriaudio_profile_name');
    if (savedName) setName(savedName);
  }, []);

  const handleSave = () => {
    localStorage.setItem('libriaudio_profile_name', name);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-3xl font-serif-display italic font-bold text-white tracking-wide">
          Profile & Settings
        </h2>
        <p className="text-sm text-white/50 mt-2">Manage your on-device preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#111111] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[#C5A059]" />
            <h3 className="text-lg font-semibold text-white">On-Device Profile</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C5A059] transition-colors"
              />
            </div>
            
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C5A059] text-black font-semibold hover:bg-[#d4af65] transition-colors flex items-center justify-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-[#C5A059]" />
            <h3 className="text-lg font-semibold text-white">Application Data</h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            Your reading history, bookmarks, and preferences are stored locally on this device as a cache to provide a personalized experience.
          </p>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
                localStorage.removeItem('libriaudio_state');
                localStorage.removeItem('libriaudio_profile_name');
                window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
          >
            Clear Local Data Cache
          </button>
        </div>
      </div>
    </div>
  );
};
