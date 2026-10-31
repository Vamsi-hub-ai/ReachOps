import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, Mail, Users, FileText, Settings, X, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockResults = [
    { type: 'Navigation', name: 'Dashboard Overview', id: '0', icon: Activity, path: '/dashboard' },
    { type: 'Navigation', name: 'All Campaigns', id: '1', icon: Mail, path: '/campaigns' },
    { type: 'Navigation', name: 'Unified Inbox', id: '2', icon: Mail, path: '/inbox' },
    { type: 'Navigation', name: 'Email Accounts & Warmup', id: '3', icon: Users, path: '/email-accounts' },
    { type: 'Navigation', name: 'Email Templates', id: '4', icon: FileText, path: '/templates' },
    { type: 'Navigation', name: 'Suppression List', id: '5', icon: ShieldCheck, path: '/suppression' },
    { type: 'Navigation', name: 'Activity Log', id: '6', icon: Activity, path: '/activity' },
    { type: 'Navigation', name: 'Workspace Settings', id: '7', icon: Settings, path: '/settings' },
  ];

  const filtered = query 
    ? mockResults.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase()))
    : mockResults;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4 select-none">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[#171717]/98 border border-white/[0.12] rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in slide-in-from-top-4 duration-300 text-slate-100 z-10">
        
        {/* Subtle Ambient Reflections */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#a31c1b]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Search Input */}
        <div className="flex items-center px-5 py-4 border-b border-white/[0.08] bg-[#111111] relative z-10">
          <Search className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search campaigns, prospects, mailboxes, templates..." 
            className="flex-1 bg-transparent text-sm sm:text-base focus:outline-none text-white placeholder:text-slate-500 font-sans"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.09] text-[11px] text-slate-400 font-mono shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
          <button 
            onClick={onClose} 
            className="ml-3 p-1.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1 relative z-10">
          {filtered.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {query ? 'Search Results' : 'Quick Navigation'}
              </div>
              {filtered.map((result) => {
                const Icon = result.icon;
                return (
                  <div 
                    key={result.id}
                    onClick={() => handleSelect(result.path)}
                    className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] cursor-pointer group transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 group-hover:bg-[#10b981]/15 group-hover:text-emerald-400 group-hover:border-[#10b981]/30 transition-all shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">{result.name}</p>
                      <p className="text-[11px] text-slate-400">{result.type}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-14 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-white">No results found</p>
              <p className="text-xs text-slate-400 mt-1">No matches found for "{query}"</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
