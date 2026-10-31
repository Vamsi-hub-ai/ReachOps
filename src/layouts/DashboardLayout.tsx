import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, Send, Users, Settings, 
  Activity, ShieldCheck, ChevronDown, ChevronLeft, ChevronRight,
  Bell, Search, Menu, User, LogOut, Mail, CheckCircle2,
  X
} from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Campaigns', href: '/campaigns', icon: Send },
  { name: 'Inbox', href: '/inbox', icon: Mail },
  { name: 'Email Accounts', href: '/email-accounts', icon: Users },
  { name: 'Suppression List', href: '/suppression', icon: ShieldCheck },
  { name: 'Activity Log', href: '/activity', icon: Activity },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const customAvatar = localStorage.getItem('user_profile_avatar');
        if (customAvatar && !parsed.avatarUrl) parsed.avatarUrl = customAvatar;
        return parsed;
      }
    } catch {}
    return null;
  });
  const location = useLocation();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('user');
          window.location.href = '/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.id) {
          setCurrentUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          const customAvatar = localStorage.getItem('user_profile_avatar');
          if (customAvatar && !parsed.avatarUrl) parsed.avatarUrl = customAvatar;
          setCurrentUser(parsed);
        }
      } catch {}
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  // Hotkey for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCurrentRoute = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);
  const isCampaignDetail = location.pathname.startsWith('/campaigns/') && 
    location.pathname !== '/campaigns' && 
    location.pathname !== '/campaigns/new';
  const isFullBleedRoute = isCampaignDetail || location.pathname === '/inbox';

  const isDemo = currentUser?.isDemo || currentUser?.email === 'demo@reachops.com';
  const userInitials = (currentUser?.name || currentUser?.email || 'Demo User')
    .split(' ')
    .map((s: string) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DU';

  const [poolStats, setPoolStats] = useState<{ health: string; mailboxes: number; active: number }>(() => ({
    health: isDemo ? '98.6%' : '0.0%',
    mailboxes: isDemo ? 3 : 0,
    active: isDemo ? 3 : 0,
  }));

  useEffect(() => {
    fetch('/api/email-accounts')
      .then(r => r.ok ? r.json() : [])
      .then(accounts => {
        if (Array.isArray(accounts)) {
          if (accounts.length > 0) {
            const active = accounts.filter(a => a.status === 'ACTIVE' || a.status === 'Connected').length;
            const health = `${Math.round((active / accounts.length) * 100)}%`;
            setPoolStats({ health, mailboxes: accounts.length, active });
          } else if (isDemo) {
            setPoolStats({ health: '98.6%', mailboxes: 3, active: 3 });
          } else {
            setPoolStats({ health: '0.0%', mailboxes: 0, active: 0 });
          }
        }
      })
      .catch(() => {});
  }, [isDemo, location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#06110c] bg-reachops-cosmic text-slate-100 font-sans selection:bg-[#a31c1b]/30">
      
      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Left Sidebar matching exact screenshot design */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#171717]/95 backdrop-blur-2xl border-r border-white/[0.08] 
          transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col justify-between shadow-2xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-60'}
          w-60 shrink-0
        `}
      >
        <div>
          {/* Logo & Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.08]">
            <Link to="/dashboard" className="flex items-center gap-2.5 group min-w-0">
              {/* Glowing Paper Airplane Squircle in Emerald */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
                <Send className="w-4 h-4 text-white -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
              </div>

              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center">
                    ReachOps<span className="text-emerald-400">.</span>
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold tracking-[0.2em] uppercase">
                    OUTREACH ENGINE
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = isCurrentRoute(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-[#171717]/90 border border-emerald-500/45 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.22)]' 
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'}
                    ${sidebarCollapsed ? 'justify-center px-2' : ''}
                  `}
                >
                  <div className={`p-1 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  
                  {!sidebarCollapsed && (
                    <span className="text-xs tracking-tight truncate">{item.name}</span>
                  )}

                  {/* Active navigation glowing emerald dot (exact match for reference screenshot) */}
                  {isActive && !sidebarCollapsed && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981] animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Card: Outbound Pool Gauge + Settings (Exact Match for Screenshot) */}
        <div className="p-3 border-t border-white/[0.08] space-y-2">
          <Link
            to="/email-accounts"
            title={sidebarCollapsed ? (isDemo || poolStats.mailboxes > 0 ? "Outbound Pool: Operational" : "Outbound Pool: Connect Mailbox") : undefined}
            className={`p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] shadow-inner flex items-center gap-3 transition-colors cursor-pointer ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
          >
            {/* Radial Ring Gauge in Emerald / Amber */}
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/[0.1]"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isDemo || poolStats.mailboxes > 0 ? "text-emerald-400" : "text-amber-400/50"}
                  strokeDasharray={isDemo ? "98.6, 100" : `${parseFloat(poolStats.health) || 0}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>

            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-white truncate">Outbound Pool</span>
                <span className="text-xs font-extrabold text-white tracking-tight mt-0.5">
                  {isDemo ? '98.6%' : (poolStats.mailboxes > 0 ? poolStats.health : '0.0%')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
                  {isDemo || poolStats.mailboxes > 0 ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      {isDemo ? 'Operational' : `${poolStats.active} Active`}
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                      Connect Mailbox
                    </>
                  )}
                </span>
              </div>
            )}

            {!sidebarCollapsed && (
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            )}
          </Link>

          {/* Settings link at bottom of sidebar */}
          <Link
            to="/settings"
            title={sidebarCollapsed ? "Settings" : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all text-xs font-semibold ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          >
            <Settings className="w-4 h-4 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        
        {/* Top Navigation Bar with Stacking Context Priority */}
        <header className="relative z-50 h-16 bg-[#171717]/85 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-slate-100">
          
          {/* Left: Mobile hamburger & Pill Search Bar with Ctrl+K */}
          <div className="flex items-center flex-1 gap-3 max-w-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl lg:hidden text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Pill Input matching screenshot */}
            <div 
              onClick={() => setSearchOpen(true)}
              className="relative w-full max-w-md hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.09] hover:border-white/[0.15] text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer group shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
              <span className="truncate">Search campaigns, prospects, leads...</span>
              <kbd className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] bg-white/[0.08] border border-white/[0.1] px-2 py-0.5 rounded text-slate-300">
                <span>Ctrl K</span>
              </kbd>
            </div>
          </div>

          {/* Right Controls: Workspace Selector Pill, Notification Bell, User Avatar & Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Workspace Selector Pill matching screenshot */}
            <div className="relative">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                <span className="truncate max-w-[140px] sm:max-w-[180px]">
                  {isDemo ? 'Demo Workspace' : 'Private Workspace'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {workspaceMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setWorkspaceMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06] pb-2 mb-1">
                      Active Workspace
                    </div>
                    <div className="px-3.5 py-2 flex items-center justify-between bg-white/[0.04]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{isDemo ? 'Demo Workspace' : 'Private Workspace'}</span>
                        <span className="text-[10px] text-slate-400">{currentUser?.email || 'demo@reachops.com'}</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell matching screenshot */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-slate-300 hover:text-white transition-all cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#a31c1b] ring-2 ring-[#171717] shadow-[0_0_6px_#a31c1b]" />
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-2">
                      <span className="font-bold text-white">Notifications</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">Mark all read</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-white font-medium text-xs">Deliverability Pool Optimized</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Warmup score improved to 99.8% across connected mailboxes.</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-white font-medium text-xs">New reply received</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ethan Hunt replied to Product Hunt Beta Launch Sequence.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Avatar with Name & Email matching screenshot */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1 pl-1.5 pr-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {currentUser?.avatarUrl || currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatarUrl || currentUser.avatar} 
                    alt="User Avatar" 
                    className="w-8 h-8 rounded-full object-cover border border-emerald-400/40 shadow-md shadow-emerald-500/20 shrink-0" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-emerald-500/20 shrink-0">
                    {userInitials}
                  </div>
                )}
                
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-white">
                    {currentUser?.name || 'Demo User'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {currentUser?.email || 'demo@reachops.com'}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-white/[0.06] mb-1 flex items-center gap-2.5">
                      {currentUser?.avatarUrl || currentUser?.avatar ? (
                        <img 
                          src={currentUser.avatarUrl || currentUser.avatar} 
                          alt="Avatar" 
                          className="w-9 h-9 rounded-full object-cover border border-emerald-500/30 shrink-0" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-white text-xs shrink-0">
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{currentUser?.name || 'Demo User'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'demo@reachops.com'}</p>
                      </div>
                    </div>

                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                      My Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-4 py-2 text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-3.5 h-3.5 mr-2.5 text-slate-400" />
                      Workspace Settings
                    </Link>

                    <div className="border-t border-white/[0.06] my-1" />
                    
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center px-4 py-2 text-[#FB7185] hover:bg-[#FB7185]/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2.5 text-[#FB7185]" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* DEMO MODE Banner matching exact screenshot design in Crimson Red */}
        {isDemo && !demoBannerDismissed && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-3.5 px-4 py-2.5 rounded-2xl bg-[#a31c1b]/15 backdrop-blur-xl border border-[#a31c1b]/35 flex items-center justify-between z-20 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3">
              {/* Crimson Shield Icon */}
              <div className="w-6 h-6 rounded-lg bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#f87171] shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#f87171]" />
              </div>

              {/* DEMO MODE Badge */}
              <span className="px-2.5 py-0.5 rounded-md bg-[#a31c1b] text-white font-extrabold text-[10px] tracking-wider uppercase shadow-sm shrink-0">
                DEMO MODE
              </span>

              <span className="text-slate-200 font-medium text-xs hidden sm:inline">
                No real emails will be sent. Outbound mailboxes and scheduled sequences are safely sandboxed.
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#a31c1b] shadow-[0_0_6px_#a31c1b]" />
                <span className="hidden md:inline">Simulated Outreach & Analytics</span>
              </div>
              <button 
                onClick={() => setDemoBannerDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Area (Full bleed for Campaign Detail & Inbox) */}
        {isFullBleedRoute ? (
          <main className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-transparent">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-transparent scroll-smooth">
            <div className="mx-auto max-w-7xl h-full">
              <Outlet />
            </div>
          </main>
        )}
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
