import { useState, useEffect } from 'react';
import { 
  Mail, CheckCircle2, AlertTriangle, Plus, Settings, RefreshCw, 
  Flame, Trash2, Search, Filter, LayoutGrid, List, Check,
  ExternalLink, Shield, Tag, ChevronDown, Zap, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AddAccountWizard from '@/components/email-accounts/AddAccountWizard';
import AccountDetailsDrawer, { type EmailAccountData } from '@/components/email-accounts/AccountDetailsDrawer';

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [warmupModalOpen, setWarmupModalOpen] = useState(false);
  const [activeAccountForWarmup, setActiveAccountForWarmup] = useState<any | null>(null);
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState<EmailAccountData | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Filters & View State (matching Screenshot 1)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Warmup Settings State
  const [warmupSettings, setWarmupSettings] = useState({
    active: true,
    dailyLimit: 40,
    rampUp: 3,
    replyRate: 30
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-accounts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAccounts(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error('Error fetching email accounts:', e);
    }
    setAccounts([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to disconnect this email account?')) return;
    try {
      await fetch(`/api/email-accounts?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting account on backend:', e);
    }
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    localStorage.setItem('email_accounts', JSON.stringify(updated));
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccounts.map(a => a.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter Accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      typeFilter === 'ALL' || 
      (typeFilter === 'GOOGLE' && (account.provider === 'GMAIL' || account.provider === 'Google Workspace')) ||
      (typeFilter === 'MICROSOFT' && (account.provider === 'MICROSOFT' || account.provider === 'Microsoft 365')) ||
      (typeFilter === 'SMTP' && account.provider === 'SMTP');

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'HEALTHY' && (account.status === 'Healthy' || account.status === 'ACTIVE')) ||
      (statusFilter === 'WARNING' && (account.status === 'Warning' || account.healthScore < 85));

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate Metrics
  const totalCapacity = accounts.reduce((acc, curr) => acc + (curr.dailyLimit || 50), 0);
  const totalSentToday = accounts.reduce((acc, curr) => acc + (curr.sentToday || 0), 0);
  const activeWarmups = accounts.filter(a => a.warmupActive).length;
  const avgHealth = accounts.length > 0 
    ? Math.round(accounts.reduce((acc, curr) => acc + (curr.healthScore || 95), 0) / accounts.length)
    : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 text-slate-100">
      
      {/* Page Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Email Accounts
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#10b981]/15 text-emerald-300 border border-[#10b981]/30">
              {accounts.length} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect, warm up, and monitor your cold sending mailboxes across domains.
          </p>
        </div>

        {/* Primary CTA with Violet Gradient */}
        <Button 
          onClick={() => setAddModalOpen(true)}
          className="btn-reachops-primary h-11 px-5 font-bold shadow-lg shadow-[#a31c1b]/25 border-none transition-all flex items-center gap-2 rounded-xl cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add or Buy Accounts</span>
        </Button>
      </div>

      {/* KPI Performance Overview Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-surface glass-surface-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sending Inboxes</p>
            <p className="text-2xl font-extrabold text-white mt-1">{accounts.length} Active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-emerald-300 flex items-center justify-center shadow-sm">
            <Mail className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-surface glass-surface-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Daily Capacity</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {totalSentToday} <span className="text-xs text-slate-400 font-normal">/ {totalCapacity}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-surface glass-surface-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Average Health</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{avgHealth}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-surface glass-surface-hover p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">In Warmup</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{activeWarmups} Mailboxes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-sm">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Filter Bar */}
      <div className="glass-surface p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search email accounts or domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3.5 bg-white/[0.04] border border-white/[0.09] hover:border-white/[0.16] text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 transition-all shadow-inner"
          />
        </div>

        {/* Dropdowns & View Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="h-10 px-3.5 pr-8 bg-[#171717] border border-white/[0.09] hover:border-white/[0.16] rounded-xl text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors [&>option]:bg-[#171717] [&>option]:text-white"
            >
              <option value="ALL" className="bg-[#171717] text-white">Type: All</option>
              <option value="GOOGLE" className="bg-[#171717] text-white">Google Workspace</option>
              <option value="MICROSOFT" className="bg-[#171717] text-white">Microsoft 365</option>
              <option value="SMTP" className="bg-[#171717] text-white">SMTP / IMAP</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="h-10 px-3.5 pr-8 bg-[#171717] border border-white/[0.09] hover:border-white/[0.16] rounded-xl text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors [&>option]:bg-[#171717] [&>option]:text-white"
            >
              <option value="ALL" className="bg-[#171717] text-white">Status: All</option>
              <option value="HEALTHY" className="bg-[#171717] text-white">Healthy</option>
              <option value="WARNING" className="bg-[#171717] text-white">Warning</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* View Switcher (Table vs Grid) */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#a31c1b] text-white shadow-[0_0_12px_rgba(163,28,27,0.5)]' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#a31c1b] text-white shadow-[0_0_12px_rgba(163,28,27,0.5)]' : 'text-slate-400 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* VIEW MODE 1: DATA TABLE */}
      {viewMode === 'table' && (
        <div className="glass-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Table Header */}
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded bg-white/[0.08] border-white/[0.2] text-emerald-400 focus:ring-0 cursor-pointer accent-emerald-500"
                    />
                  </th>
                  <th className="py-3.5 px-4 text-slate-300">EMAIL</th>
                  <th className="py-3.5 px-4 text-slate-300">TAGS</th>
                  <th className="py-3.5 px-4 text-slate-300">TYPE</th>
                  <th className="py-3.5 px-4 text-slate-300">STATUS</th>
                  <th className="py-3.5 px-4 text-slate-300">DAILY SENT</th>
                  <th className="py-3.5 px-4 text-slate-300">HEALTH SCORE</th>
                  <th className="py-3.5 px-4 text-right text-slate-300">ACTIONS</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-white/[0.05]">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.09] flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-lg shadow-[#a31c1b]/25">
                        <Mail className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-white text-sm">No email accounts found</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your filters or connect a new mailbox.</p>
                      <Button
                        onClick={() => setAddModalOpen(true)}
                        className="btn-reachops-primary font-bold text-xs h-9 px-4 cursor-pointer"
                      >
                        Add Account
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const isSelected = selectedIds.includes(account.id);
                    const usagePercent = Math.min(100, Math.round(((account.sentToday || 0) / (account.dailyLimit || 50)) * 100));
                    const score = account.healthScore || 96;
                    const isWarning = score < 85 || account.status === 'Warning';

                    return (
                      <tr 
                        key={account.id}
                        onClick={() => {
                          setSelectedAccountForDetails(account);
                          setDetailsDrawerOpen(true);
                        }}
                        className={`hover:bg-white/[0.045] transition-colors cursor-pointer group ${isSelected ? 'bg-white/[0.06]' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(account.id)}
                            className="rounded bg-white/[0.08] border-white/[0.2] text-emerald-400 focus:ring-0 cursor-pointer accent-emerald-500"
                          />
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 group-hover:border-[#10b981] transition-all">
                              {account.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white group-hover:text-emerald-400 transition-colors block">
                                {account.email}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {account.displayName || account.email?.split('@')[0]}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tags */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {account.tags && account.tags.length > 0 ? (
                              account.tags.map((t: string) => (
                                <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                                Outbound
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type / Provider */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-200">
                            {account.provider === 'GMAIL' ? 'Google Workspace' : account.provider === 'MICROSOFT' ? 'Microsoft 365' : 'SMTP / IMAP'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm transition-all ${
                            isWarning 
                              ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                              : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.18)]'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              isWarning ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse'
                            }`} />
                            <span>{account.status || 'Active'}</span>
                          </span>
                        </td>

                        {/* Daily Sent */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 max-w-[120px]">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-white">{account.sentToday || 0}</span>
                              <span className="text-slate-400">/ {account.dailyLimit || 50}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usagePercent > 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#38BDF8] to-[#34D399]'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Health Score */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              score >= 90 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              score >= 75 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}>
                              {score}%
                            </div>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">Optimal</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAccountForDetails(account);
                                setDetailsDrawerOpen(true);
                              }}
                              className="p-2 rounded-xl bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:text-emerald-400 hover:border-[#10b981]/30 hover:bg-[#10b981]/10 transition-all cursor-pointer"
                              title="Account Settings & Warmup"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAccountForDetails(account);
                                setDetailsDrawerOpen(true);
                              }}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                account.warmupActive 
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-sm' 
                                  : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
                              }`}
                              title={account.warmupActive ? 'Warmup Active (Click to inspect)' : 'Enable Warmup'}
                            >
                              <Flame className="w-3.5 h-3.5 fill-current" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(account.id);
                              }}
                              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-[#FB7185] hover:border-[#FB7185]/30 hover:bg-[#FB7185]/10 transition-all cursor-pointer"
                              title="Disconnect Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>

            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: CARD GRID */}
      {viewMode === 'grid' && (
        filteredAccounts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 glass-surface p-8">
            <Mail className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <p className="font-extrabold text-white text-base">No email accounts found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Connect your Google Workspace, Microsoft 365, or SMTP sending account to start automated outreach.</p>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="mt-4 btn-reachops-primary font-bold text-xs h-9 px-5 rounded-xl shadow-lg shadow-[#a31c1b]/25"
            >
              Add Account
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map(account => {
            const usagePercent = Math.round(((account.sentToday || 0) / (account.dailyLimit || 50)) * 100);
            const isWarning = usagePercent >= 90 || account.status === 'Warning';
            
            return (
              <div 
                key={account.id} 
                onClick={() => {
                  setSelectedAccountForDetails(account);
                  setDetailsDrawerOpen(true);
                }}
                className="glass-surface glass-surface-hover p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group cursor-pointer"
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${isWarning ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-gradient-to-r from-[#38BDF8] to-[#10b981]'}`}></div>
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-emerald-300 shadow-sm group-hover:scale-105 group-hover:border-[#10b981] transition-all">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold truncate max-w-[180px] text-white group-hover:text-emerald-400 transition-colors">{account.email}</h3>
                        <p className="text-xs mt-0.5 text-slate-400">
                          {account.provider === 'GMAIL' ? 'Google Workspace' : account.provider === 'MICROSOFT' ? 'Microsoft 365' : 'SMTP / IMAP'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Daily Limit</span>
                      <span className={`font-semibold ${isWarning ? 'text-amber-400' : 'text-white'}`}>
                        {account.sentToday || 0} / {account.dailyLimit || 50}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-amber-400' : 'bg-gradient-to-r from-[#38BDF8] to-[#34D399]'}`} 
                        style={{ width: `${Math.min(100, usagePercent)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 text-right">{usagePercent}% used today</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-center">
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">Warmup</p>
                      <div className="flex items-center justify-center text-xs font-semibold">
                        <Flame className={`w-3.5 h-3.5 mr-1 ${account.warmupActive ? 'text-amber-400 fill-current' : 'text-slate-500'}`} />
                        <span className={account.warmupActive ? 'text-white' : 'text-slate-400'}>
                          {account.warmupActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">Status</p>
                      <div className="flex items-center justify-center text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {account.status || 'Healthy'}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">Health</p>
                      <div className="text-xs font-bold text-white">
                        {account.healthScore || 96}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs h-8 bg-white/[0.04] border-white/[0.09] text-slate-200 hover:border-[#10b981]/50 hover:text-emerald-400 hover:bg-[#10b981]/10 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccountForDetails(account);
                        setDetailsDrawerOpen(true);
                      }}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" /> Details &amp; Settings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-none text-xs h-8 bg-white/[0.04] border-white/[0.09] hover:border-rose-500/40 hover:text-rose-400 hover:bg-rose-500/15 transition-colors px-2 text-slate-300 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(account.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Connect More Card in Grid */}
          <div 
            onClick={() => setAddModalOpen(true)}
            className="border-dashed border-2 border-white/[0.12] hover:border-[#10b981]/50 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-all flex flex-col items-center justify-center min-h-[260px] cursor-pointer group shadow-none p-6"
          >
            <div className="w-12 h-12 bg-[#10b981]/15 border border-[#10b981]/30 rounded-2xl flex items-center justify-center shadow-lg shadow-[#a31c1b]/25 group-hover:scale-105 transition-transform mb-4">
              <Plus className="w-6 h-6 text-emerald-300" />
            </div>
            <h3 className="text-base font-bold text-white">Add or Buy Accounts</h3>
            <p className="text-center mt-2 px-4 text-xs text-slate-400">
              Deploy pre-warmed inboxes, DFY domains, or connect Google &amp; Microsoft.
            </p>
          </div>
        </div>
        )
      )}

      {/* ADD ACCOUNT WIZARD MODAL */}
      <AddAccountWizard
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAccountAdded={(newAccount) => {
          const updated = [newAccount, ...accounts];
          setAccounts(updated);
        }}
      />

      {/* ACCOUNT DETAILS DRAWER (FULL OPTIONS & PRESET MANAGEMENT IN MIDNIGHT BLUE GLASS) */}
      <AccountDetailsDrawer
        isOpen={detailsDrawerOpen}
        account={selectedAccountForDetails}
        onClose={() => setDetailsDrawerOpen(false)}
        onSave={(updated) => {
          setAccounts(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
          setSelectedAccountForDetails(updated);
        }}
      />

      {/* WARMUP CONFIGURATION MODAL */}
      {warmupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#171717]/95 border border-white/[0.1] text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-amber-500/10">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-5 h-5 fill-current" />
                <h2 className="text-base font-bold text-white">
                  Warmup Settings: {activeAccountForWarmup?.email ? activeAccountForWarmup.email.split('@')[0] : 'Global'}
                </h2>
              </div>
              <button 
                onClick={() => setWarmupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                <div>
                  <Label className="text-sm font-bold text-white">Enable Warmup Engine</Label>
                  <p className="text-xs text-slate-400 mt-0.5">Automatically exchange realistic emails with verified peer inboxes to build sender score.</p>
                </div>
                <Switch 
                  checked={warmupSettings.active}
                  onCheckedChange={(c: boolean) => setWarmupSettings({ ...warmupSettings, active: c })}
                />
              </div>

              <div className={`space-y-4 transition-opacity ${!warmupSettings.active ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 font-semibold text-xs">Total Warmup Limit</Label>
                    <span className="text-xs font-bold text-emerald-400">{warmupSettings.dailyLimit} / day</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={warmupSettings.dailyLimit}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, dailyLimit: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">Maximum warmup sends per day.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 font-semibold text-xs">Daily Ramp-up</Label>
                    <span className="text-xs font-bold text-emerald-400">+{warmupSettings.rampUp} / day</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={warmupSettings.rampUp}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, rampUp: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">Gradually increment daily sends until maximum is reached.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 font-semibold text-xs">Target Peer Reply Rate</Label>
                    <span className="text-xs font-bold text-emerald-400">{warmupSettings.replyRate}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="80" step="5"
                    value={warmupSettings.replyRate}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, replyRate: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400">Percentage of warmup emails receiving automated replies.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-2.5 bg-white/[0.02]">
              <Button 
                variant="outline" 
                onClick={() => setWarmupModalOpen(false)} 
                className="bg-white/[0.04] border-white/[0.09] text-slate-300 hover:text-white rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setWarmupModalOpen(false);
                }} 
                className="btn-reachops-primary font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

