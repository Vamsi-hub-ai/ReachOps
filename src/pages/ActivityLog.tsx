import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, Search, Filter, Download, Mail, UserPlus, 
  Settings, CheckCircle, ShieldAlert, Sparkles, Check, ChevronDown, Clock 
} from 'lucide-react';

const mockActivities = [
  { id: 1, type: 'campaign', action: 'Campaign Started', details: 'Product Launch Outreach launched with 3 inboxes rotating', user: 'ReachOps Engine', time: '10 mins ago', icon: Activity, color: 'text-emerald-400' },
  { id: 2, type: 'send', action: 'Outbound Batch Dispatched', details: '14 initial sequence emails delivered to validated contacts', user: 'ReachOps Scheduler', time: '1 hour ago', icon: Mail, color: 'text-emerald-400' },
  { id: 3, type: 'reply', action: 'Lead Reply Received', details: 'Sophie Martin replied: "Let us connect this Tuesday for a demo"', user: 'System Telemetry', time: '2 hours ago', icon: Sparkles, color: 'text-emerald-400' },
  { id: 4, type: 'prospect', action: 'Prospects Enrolled', details: '30 verified contacts enrolled into Product Hunt Beta Launch Sequence', user: 'Demo User', time: '5 hours ago', icon: UserPlus, color: 'text-slate-300' },
  { id: 5, type: 'settings', action: 'Warmup Limits Elevated', details: 'Daily limit escalated safely from 40 to 50 for team.outbound', user: 'Smart Warmup Engine', time: '1 day ago', icon: Settings, color: 'text-amber-400' },
  { id: 6, type: 'auth', action: 'Workspace Authenticated', details: 'Secure login via session token', user: 'ReachOps Auth', time: '1 day ago', icon: CheckCircle, color: 'text-emerald-400' },
];

export default function ActivityLog() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u);
    } catch {}
    return null;
  });
  const isDemo = Boolean(currentUser?.isDemo || currentUser?.email === 'demo@reachops.com');

  const [activities, setActivities] = useState<any[]>(() => isDemo ? mockActivities : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/activity-log')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data.logs)) {
          if (data.logs.length > 0) {
            setActivities(data.logs.map((log: any, idx: number) => ({
              id: log.id || idx,
              type: log.status === 'REPLIED' ? 'reply' : log.status === 'SENT' ? 'send' : 'campaign',
              action: log.status === 'REPLIED' ? 'Lead Reply Received' : log.status === 'SENT' ? 'Outbound Batch Dispatched' : 'Campaign Activity',
              details: log.description || log.campaignName,
              user: 'System Telemetry',
              time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              icon: log.status === 'REPLIED' ? Sparkles : Mail,
              color: 'text-emerald-400'
            })));
          } else if (isDemo) {
            setActivities(mockActivities);
          } else {
            setActivities([]);
          }
        }
      })
      .catch(() => {});
  }, [isDemo]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredActivities = activities.filter(item => {
    const matchesSearch = 
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (typeFilter === 'All') return matchesSearch;
    return matchesSearch && item.type.toLowerCase() === typeFilter.toLowerCase();
  });

  const handleExportAuditLog = () => {
    const header = 'Action,Details,User,Time\n';
    const rows = filteredActivities.map(a => `"${a.action}","${a.details}","${a.user}","${a.time}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reachops-audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredActivities.length} audit log events.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 text-slate-100">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 bg-[#171717]/95 border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Activity Log</h1>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Audit trail of all actions and outreach events in your workspace.</p>
        </div>
        
        <div className="flex items-center gap-2.5 relative">
          
          {/* Filter Dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="bg-white/[0.04] border-white/[0.09] text-slate-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-xs h-9 cursor-pointer active:scale-95"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span>{typeFilter === 'All' ? 'Filter' : `Filter: ${typeFilter}`}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
            </Button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl py-1.5 z-40 text-xs animate-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 border-b border-white/[0.06]">
                    Filter by Event
                  </div>
                  {['All', 'Campaign', 'Send', 'Reply', 'Prospect', 'Settings', 'Auth'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTypeFilter(t);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/[0.06] transition-colors cursor-pointer ${
                        typeFilter === t ? 'text-emerald-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{t}</span>
                      {typeFilter === t && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Button 
            variant="outline" 
            onClick={handleExportAuditLog}
            className="bg-white/[0.04] border-white/[0.09] text-slate-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-xs h-9 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Log
          </Button>
        </div>
      </div>

      <div className="glass-surface overflow-hidden rounded-2xl">
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search activity by action, details, or user..." 
              className="pl-9 bg-white/[0.04] border-white/[0.09] text-white placeholder-slate-400 focus:border-emerald-500 rounded-xl text-xs h-9 shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-0">
          <div className="relative">
            {/* Vertical Timeline Guide */}
            <div className="absolute left-10 top-0 bottom-0 w-px bg-white/[0.08]"></div>

            <div className="divide-y divide-white/[0.05]">
              {filteredActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="p-5 sm:p-6 flex items-start gap-5 hover:bg-white/[0.03] transition-colors relative">
                    <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-white/[0.1] bg-[#171717] ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-sm font-bold text-white tracking-tight">{act.action}</p>
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">{act.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{act.details}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Triggered By</span>
                        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {act.user}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredActivities.length === 0 && (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-white">No activity logged yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Campaign events, sequence dispatches, and prospect replies will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
