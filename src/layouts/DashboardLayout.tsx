import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Send, Users, Settings, 
  Activity, ShieldAlert, FileText, ChevronRight,
  Bell, Search, Menu, SearchCode, User, LogOut
} from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Send, children: [
    { name: 'All Campaigns', href: '/campaigns' },
    { name: 'Create Campaign', href: '/campaigns/new' },
  ]},
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Email Accounts', href: '/email-accounts', icon: Settings },
  { name: 'Suppression List', href: '/suppression', icon: ShieldAlert },
  { name: 'Activity Log', href: '/activity', icon: Activity },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

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

  const toggleExpand = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  const isCurrentRoute = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      
      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 border-b border-white/10 bg-black/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20">
              <Send className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Reachly</span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentRoute(item.href);
            const isExpanded = expandedItem === item.name;

            return (
              <div key={item.name}>
                {item.children ? (
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                      ${isActive ? 'bg-white/10 text-white font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : 'text-white/50 group-hover:text-white/90'}`} />
                      {item.name}
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group
                      ${isActive ? 'bg-secondary text-secondary-foreground shadow-md font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-secondary-foreground' : 'text-white/50 group-hover:text-white/90'}`} />
                    {item.name}
                  </Link>
                )}

                {item.children && (
                  <div className={`mt-1 ml-4 pl-4 border-l border-white/20 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {item.children.map(child => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                          location.pathname === child.href ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center flex-1 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md lg:hidden text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Trigger */}
            <button 
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 max-w-md w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 transition-colors"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-left">Search anything...</span>
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                <SearchCode className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative text-gray-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white cursor-pointer hover:opacity-90 transition-opacity"
              >
                V
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Victor Admin</p>
                      <p className="text-xs text-gray-500">victor@example.com</p>
                    </div>
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      My Profile
                    </Link>
                    <Link 
                      to="/settings" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2 text-gray-400" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Link 
                      to="/login" 
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <LogOut className="w-4 h-4 mr-2 text-red-500" />
                      Log out
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="mx-auto max-w-7xl h-full">
            <Outlet />
          </div>
        </main>
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
