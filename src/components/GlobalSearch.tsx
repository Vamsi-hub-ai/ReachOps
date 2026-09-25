import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, Mail, Users, FileText, Settings, X, ArrowRight } from 'lucide-react';

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
    { type: 'Campaign', name: 'Q4 Enterprise Outreach', id: '1', icon: Mail, path: '/campaigns' },
    { type: 'Prospect', name: 'Sarah Jenkins', id: '2', icon: Users, path: '/prospects' },
    { type: 'Template', name: 'Cold Outreach - SaaS', id: '3', icon: FileText, path: '/templates' },
    { type: 'Settings', name: 'API Keys', id: '4', icon: Settings, path: '/settings' },
  ];

  const filtered = query 
    ? mockResults.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase()))
    : mockResults;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300 border border-gray-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search campaigns, prospects, templates..." 
            className="flex-1 bg-transparent text-lg focus:outline-none text-gray-900 placeholder:text-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-500 font-medium">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
          <button onClick={onClose} className="ml-3 p-1 rounded-md hover:bg-gray-200 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {query ? 'Search Results' : 'Recent Items'}
              </div>
              {filtered.map((result) => {
                const Icon = result.icon;
                return (
                  <div 
                    key={result.id}
                    onClick={() => handleSelect(result.path)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-blue-50 cursor-pointer group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-primary transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                      <p className="text-xs text-gray-500">{result.type}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto text-gray-300 mb-3" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
