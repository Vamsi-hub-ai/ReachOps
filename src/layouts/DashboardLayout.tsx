import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Send, Users, Settings, 
  Activity, ShieldAlert, FileText, ChevronRight,
  Bell, Search, Menu, SearchCode, User, LogOut, Inbox
} from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Send },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Email Accounts', href: '/email-accounts', icon: Settings },
  { name: 'Suppression List', href: '/suppression', icon: ShieldAlert },
  { name: 'Activity Log', href: '/activity', icon: Activity },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
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
        if (saved) setCurrentUser(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  // Add global hotkey for Cmd+K / Ctrl+K
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

  return (
    <div className="flex h-screen overflow-hidden bg-black text-slate-100">
      
      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-black text-slate-100 border-r border-[#1a1c29] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 border-b border-[#1a1c29] bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#9FA0FF] flex items-center justify-center shadow-lg shadow-[#9FA0FF]/25">
              <Send className="w-4 h-4 text-[#0c0d18]" />
            </div>
            <span className="text-xl font-extrabold text-[#FFF3E3] tracking-tight">
              ReachOps<span className="text-[#9FA0FF]">.</span>
            </span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentRoute(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${isActive ? 'bg-[#9FA0FF] text-[#0c0d18] shadow-md shadow-[#9FA0FF]/25 font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0c0d18]' : 'text-slate-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        
        {/* Top Header */}
        <header className="h-16 bg-black border-b border-[#1a1c29] flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10 shadow-sm text-slate-100">
          <div className="flex items-center flex-1 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md lg:hidden text-slate-400 hover:bg-[#161722]"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Trigger */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 max-w-md w-full px-4 py-2 bg-[#0e0f17] hover:bg-[#141520] border border-[#222436] rounded-xl text-sm text-slate-400 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="flex-1 text-left">Search anything...</span>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <SearchCode className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Workspace badge */}
            <div className="hidden sm:flex items-center gap-2">
              {currentUser?.isDemo ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#9FA0FF]/15 text-[#9FA0FF] border border-[#9FA0FF]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9FA0FF] animate-pulse"></span>
                  ReachOps Demo Workspace
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Personal Workspace
                </span>
              )}
            </div>

            <button className="p-2 rounded-full hover:bg-[#161722] relative text-slate-400 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF7171] rounded-full border-2 border-black"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-[#9FA0FF] text-[#0c0d18] flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-[#9FA0FF]/40 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {currentUser?.name?.charAt(0)?.toUpperCase() || (currentUser?.isDemo ? 'D' : 'V')}
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-[#111219] rounded-xl shadow-2xl border border-[#242637] py-1 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-[#202234]">
                      <p className="text-sm font-semibold text-white truncate">{currentUser?.name || (currentUser?.isDemo ? 'Demo User' : 'Vamsi Pallela')}</p>
                      <p className="text-xs text-slate-400 truncate">{currentUser?.email || (currentUser?.isDemo ? 'demo@reachops.com' : 'Vamsipallela31@gmail.com')}</p>
                      <div className="mt-1.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${currentUser?.isDemo ? 'bg-[#9FA0FF]/20 text-[#9FA0FF]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {currentUser?.isDemo ? 'DEMO WORKSPACE' : 'PRODUCTION / PRIVATE'}
                        </span>
                      </div>
                    </div>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-[#181a28] hover:text-[#9FA0FF] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2 text-slate-400" />
                      My Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-[#181a28] hover:text-[#9FA0FF] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2 text-slate-400" />
                      Settings
                    </Link>
                    <div className="border-t border-[#202234] my-1"></div>
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center px-4 py-2 text-sm text-[#FF7171] hover:bg-[#FF7171]/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-[#FF7171]" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Demo Mode Notice Banner */}
        {currentUser?.isDemo && (
          <div className="bg-[#9FA0FF]/10 border-b border-[#9FA0FF]/25 px-4 py-2.5 text-xs text-[#9FA0FF] flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#9FA0FF] text-[#0c0d18] font-black text-[10px] tracking-wider uppercase shadow-sm">
                Demo Mode
              </span>
              <span className="text-slate-200 font-medium">
                No real emails will be sent. Outbound mailboxes and scheduled sequences are safely sandboxed.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Simulated Outreach & Analytics</span>
            </div>
          </div>
        )}

        {/* Main Workspace Area (Full bleed for Campaign Detail & Inbox) */}
        {isFullBleedRoute ? (
          <main className="flex-1 overflow-hidden relative bg-black flex flex-col min-h-0">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 relative bg-black">
            <div className="mx-auto max-w-7xl h-full">
              <Outlet />
            </div>
          </main>
        )}
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
