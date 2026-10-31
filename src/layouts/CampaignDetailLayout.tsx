import { useState, useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Settings, 
  Pause, Play, MoreVertical, CheckCircle2, ShieldCheck, Rocket, Edit2, Check
} from 'lucide-react';
import DeliverabilityDiagnoseModal from '@/components/DeliverabilityDiagnoseModal';

export default function CampaignDetailLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isInboxRoute = location.pathname.endsWith('/inbox') || location.pathname.includes('/inbox/');
  const isEditorRoute = location.pathname.endsWith('/editor');
  const isCanvasRoute = isInboxRoute || isEditorRoute;

  const [isActive, setIsActive] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<'ACTIVE' | 'PAUSED' | 'DRAFT'>('DRAFT');
  const [campaignTitle, setCampaignTitle] = useState(id === 'tga-sales' ? 'TGA-Sales' : (id || 'Untitled Campaign'));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleVal, setEditTitleVal] = useState('');
  const [diagnoseOpen, setDiagnoseOpen] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [showLaunchNotification, setShowLaunchNotification] = useState(false);
  const [showPauseNotification, setShowPauseNotification] = useState(false);
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
          setCampaignStatus('ACTIVE');
        } else if (data && data.status === 'PAUSED') {
          setIsActive(false);
          setCampaignStatus('PAUSED');
        } else if (data && data.status === 'DRAFT') {
          setIsActive(false);
          setCampaignStatus('DRAFT');
        }
      })
      .catch(() => {
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
    setCampaignStatus('ACTIVE');
    setShowLaunchNotification(true);
    setTimeout(() => setShowLaunchNotification(false), 3000);

    try {
      await fetch(`/api/campaigns/${id}/start`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
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
    setCampaignStatus(next ? 'ACTIVE' : 'PAUSED');
    if (next) {
      setShowLaunchNotification(true);
      setTimeout(() => setShowLaunchNotification(false), 2500);
    } else {
      setShowPauseNotification(true);
      setTimeout(() => setShowPauseNotification(false), 2500);
    }
    try {
      await fetch(`/api/campaigns/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next ? 'ACTIVE' : 'PAUSED' }),
      });
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
    <div className="flex flex-col h-full w-full bg-[#06110c] bg-reachops-cosmic text-slate-100 selection:bg-[#a31c1b]/30 overflow-hidden relative">
      
      {/* Top Glass Subheader matching ReachOps Design System */}
      <header className="sticky top-0 z-20 bg-[#171717]/85 backdrop-blur-2xl border-b border-white/[0.08] px-5 sm:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        
        {/* Left: Back & Campaign Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate('/campaigns')} 
            className="p-1.5 text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            title="Back to campaigns"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/[0.1] hidden sm:block" />
          
          <div className="flex items-center gap-2 group min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editTitleVal}
                  onChange={(e) => setEditTitleVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="bg-[#171717] border border-emerald-500 text-white font-bold text-xs sm:text-sm px-2.5 py-1 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button 
                  onClick={handleSaveTitle}
                  className="p-1 text-emerald-400 hover:bg-white/[0.06] rounded-md transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => { setEditTitleVal(campaignTitle); setIsEditingTitle(true); }}
                className="flex items-center gap-2 cursor-pointer py-1 px-2.5 -ml-1 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all truncate"
                title="Click to rename campaign"
              >
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {campaignTitle}
                </h1>
                <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Navigation Tabs (Clean alignment, no rogue scrollbar) */}
        <nav className="flex items-center h-full gap-1 sm:gap-3 overflow-hidden no-scrollbar">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={`/campaigns/${id}/${tab.path}`}
              className={({ isActive: tabActive }) => `
                relative h-14 flex items-center px-2.5 sm:px-3.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${tabActive 
                  ? 'text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'}
              `}
            >
              {({ isActive: tabActive }) => (
                <>
                  <span>{tab.name}</span>
                  {tabActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-emerald-500 to-[#10b981] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right: Status Badge, Action Button (Pause/Launch) & Dropdown Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Status Badge: Active, Paused, or Draft */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border text-xs font-semibold shadow-sm transition-all ${
            isActive 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]' 
              : campaignStatus === 'PAUSED'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                : 'bg-white/[0.04] border-white/[0.08] text-slate-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isActive 
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse' 
                : campaignStatus === 'PAUSED'
                  ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]'
                  : 'bg-slate-400'
            }`} />
            <span>{isActive ? 'Active' : campaignStatus === 'PAUSED' ? 'Paused' : 'Draft'}</span>
          </div>

          {/* Action Button: Pause Sequence when Active, Launch/Resume Sequence when Inactive */}
          {isActive ? (
            <button 
              onClick={handleToggleActive}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer"
              title="Pause campaign automated sequences"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Pause</span>
            </button>
          ) : (
            <button 
              onClick={campaignStatus === 'PAUSED' ? handleToggleActive : handleLaunch}
              className="btn-reachops-primary flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer hover:scale-[1.02]"
              title={campaignStatus === 'PAUSED' ? 'Resume campaign automated sequences' : 'Launch campaign automated sequences'}
            >
              <Rocket className="w-3.5 h-3.5 -rotate-12" />
              <span>{campaignStatus === 'PAUSED' ? 'Resume' : 'Launch'}</span>
            </button>
          )}

          {/* Dropdown Options Button */}
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => { setMenuOpen(false); handleToggleActive(); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{isActive ? 'Pause Campaign' : 'Resume Campaign'}</span>
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); handleShare(); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Campaign Link</span>
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); setDiagnoseOpen(true); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deliverability Check</span>
                  </button>
                  <button 
                    onClick={() => { setMenuOpen(false); navigate(`/campaigns/${id}/settings`); }}
                    className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-white/[0.06] hover:text-white flex items-center gap-2 border-t border-white/[0.06] mt-1 pt-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Campaign Settings</span>
                  </button>
                  <div className="border-t border-white/[0.06] my-1" />
                  <button 
                    onClick={() => { setMenuOpen(false); setIsActive(false); setCampaignStatus('PAUSED'); }}
                    className="w-full text-left px-4 py-2 text-[#ef4444] hover:bg-[#a31c1b]/15 cursor-pointer transition-colors"
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717]/95 backdrop-blur-xl border border-emerald-500/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Campaign link copied to clipboard!</span>
        </div>
      )}

      {/* Launch Toast Notification */}
      {showLaunchNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717]/95 backdrop-blur-xl border border-emerald-500/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Campaign successfully launched and active!</span>
        </div>
      )}

      {/* Pause Toast Notification */}
      {showPauseNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171717]/95 backdrop-blur-xl border border-amber-500/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2">
          <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Campaign paused. Automated dispatches suspended.</span>
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
        <main className="flex-1 overflow-hidden bg-[#06110c] bg-reachops-cosmic flex flex-col min-h-0 relative">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto bg-[#06110c] bg-reachops-cosmic p-6 scroll-smooth relative">
          <div className="mx-auto max-w-7xl pb-28">
            <Outlet />
          </div>
        </main>
      )}

    </div>
  );
}
