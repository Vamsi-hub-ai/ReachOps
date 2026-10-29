import { useState, useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Activity, Settings, 
  Pause, Play, MoreVertical, CheckCircle2, ShieldCheck, Rocket, Edit2, Check
} from 'lucide-react';
import DeliverabilityDiagnoseModal from '@/components/DeliverabilityDiagnoseModal';

export default function CampaignDetailLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isInboxRoute = location.pathname.endsWith('/inbox') || location.pathname.includes('/inbox/');
  const isCanvasRoute = isInboxRoute || location.pathname.endsWith('/editor');
  const [isActive, setIsActive] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState(id === 'tga-sales' ? 'TGA-Sales' : (id || 'Untitled Campaign'));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [diagnoseOpen, setDiagnoseOpen] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [showLaunchNotification, setShowLaunchNotification] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${id}/analytics`)
      .then(res => res.json())
      .then(data => {
        if (data && data.campaignName) {
          setCampaignTitle(data.campaignName);
          setEditTitleVal(data.campaignName);
        }
        if (data && (data.status === 'Running' || data.status === 'ACTIVE')) {
          setIsActive(true);
        } else if (data && data.status === 'DRAFT') {
          setIsActive(false);
        }
      })
      .catch(() => {
        // Fallback title formatting
        if (id && id !== 'new') {
          const formatted = id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          setCampaignTitle(formatted);
          setEditTitleVal(formatted);
        }
      });
  }, [id]);

  const handleSaveTitle = async () => {
    if (!editTitleVal.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const newName = editTitleVal.trim();
    setCampaignTitle(newName);
    setIsEditingTitle(false);

    try {
      await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName }),
      });
    } catch (err) {
      console.error('Failed to update campaign name:', err);
    }
  };

  const handleLaunch = async () => {
    setIsActive(true);
    setShowLaunchNotification(true);
    setTimeout(() => setShowLaunchNotification(false), 3000);

    try {
      await fetch(`/api/campaigns/${id}/start`, { method: 'POST' });
      await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'ACTIVE' }),
      });
    } catch (err) {
      console.error('Failed to launch campaign:', err);
    }
  };

  const handleToggleActive = async () => {
    const next = !isActive;
    setIsActive(next);
    try {
      await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next ? 'ACTIVE' : 'PAUSED' }),
      });
    } catch (err) {
      console.error('Failed to toggle campaign active status:', err);
    }
  };

  const tabs = [
    { name: 'Analytics', path: 'analytics' },
    { name: 'Editor', path: 'editor' },
    { name: 'Leads', path: 'leads' },
    { name: 'Inbox', path: 'inbox' },
    { name: 'Settings', path: 'settings' },
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareNotification(true);
    setTimeout(() => setShowShareNotification(false), 2500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-slate-100 selection:bg-[#0080FF]/30 overflow-hidden">
      
      {/* Top Navigation Bar matching Image 5 */}
      <header className="sticky top-0 z-30 bg-black border-b border-[#161822] px-6 h-14 flex items-center justify-between flex-shrink-0">
        
        {/* Left: Back & Campaign Name */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate('/campaigns')} 
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#151722] rounded-lg transition-colors cursor-pointer"
            title="Back to campaigns"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#232638]" />
          
          <div className="flex items-center gap-2 group">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editTitleVal}
                  onChange={(e) => setEditTitleVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="bg-[#12141e] border border-[#0080FF] text-white font-bold text-sm px-2.5 py-1 rounded-md outline-none focus:ring-1 focus:ring-[#0080FF]"
                />
                <button 
                  onClick={handleSaveTitle}
                  className="p-1 text-[#0080FF] hover:bg-[#12141e] rounded"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => { setEditTitleVal(campaignTitle); setIsEditingTitle(true); }}
                className="flex items-center gap-2 cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-[#12141e] transition-colors"
                title="Click to rename campaign"
              >
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {campaignTitle}
                </h1>
                <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="hidden md:flex items-center h-full gap-8">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={`/campaigns/${id}/${tab.path}`}
              className={({ isActive: tabActive }) => `
                relative h-14 flex items-center text-sm font-medium transition-colors
                ${tabActive 
                  ? 'text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'}
              `}
            >
              {({ isActive: tabActive }) => (
                <>
                  <span>{tab.name}</span>
                  {tabActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0080FF] rounded-t-full shadow-[0_-2px_10px_rgba(0,128,255,0.7)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right: Status, Launch Button & Dropdown Menu */}
        <div className="flex items-center gap-3">
          
          {/* Status Badge: Draft or Active */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12141e] border border-[#222536] text-xs font-medium text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`} />
            <span>{isActive ? 'Active' : 'Draft'}</span>
          </div>

          {/* Launch Button */}
          <button 
            onClick={handleLaunch}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-bold transition-all shadow-md shadow-[#0080FF]/30 active:scale-95 cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch</span>
          </button>

          {/* Dropdown Options Button */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-[#12141e] hover:bg-[#1b1e2c] border border-[#222536] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-[#12141e] border border-[#25283a] rounded-xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => { setMenuOpen(false); handleToggleActive(); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-[#1a1d2d] hover:text-white flex items-center gap-2"
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isActive ? 'Pause Campaign' : 'Resume Campaign'}</span>
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); handleShare(); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-[#1a1d2d] hover:text-white flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Campaign Link</span>
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); setDiagnoseOpen(true); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-[#1a1d2d] hover:text-white flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0080FF]" />
                    <span>Deliverability Check</span>
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); navigate(`/campaigns/${id}/settings`); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-[#1a1d2d] hover:text-white flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Campaign Settings</span>
                  </button>
                  <div className="border-t border-[#202336] my-1" />
                  <button 
                    onClick={() => { setMenuOpen(false); setIsActive(false); }}
                    className="w-full text-left px-4 py-2 text-[#FF7171] hover:bg-[#FF7171]/10"
                  >
                    Stop Sending
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </header>

      {/* Share Toast Notification */}
      {showShareNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12141e] border border-[#0080FF]/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Campaign link copied to clipboard!</span>
        </div>
      )}

      {/* Launch Toast Notification */}
      {showLaunchNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10B981]/20 border border-[#10B981]/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>Campaign successfully launched and active!</span>
        </div>
      )}

      {/* Deliverability Diagnostics Modal */}
      <DeliverabilityDiagnoseModal 
        isOpen={diagnoseOpen} 
        onClose={() => setDiagnoseOpen(false)} 
        campaignName={campaignTitle}
      />

      {/* Campaign Workspace Canvas */}
      {isCanvasRoute ? (
        <main className="flex-1 overflow-hidden bg-black flex flex-col min-h-0">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto bg-black p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      )}

    </div>
  );
}
