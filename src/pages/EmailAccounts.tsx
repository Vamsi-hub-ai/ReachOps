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

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [warmupModalOpen, setWarmupModalOpen] = useState(false);
  const [activeAccountForWarmup, setActiveAccountForWarmup] = useState<any | null>(null);

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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1F2342] text-[#9FA0FF] border border-[#2B305C]">
              {accounts.length} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect, warm up, and monitor your cold sending mailboxes across domains.
          </p>
        </div>

        {/* Prominent Primary CTA (Screenshot 1) */}
        <Button 
          onClick={() => setAddModalOpen(true)}
          className="h-11 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-600/25 border-none transition-all flex items-center gap-2 rounded-xl"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add or Buy Accounts</span>
        </Button>
      </div>

      {/* KPI Performance Overview Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#0E101E] border border-[#1E223D] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sending Inboxes</p>
            <p className="text-xl font-bold text-white mt-1">{accounts.length} Active</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[#9FA0FF] flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E101E] border border-[#1E223D] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Daily Capacity</p>
            <p className="text-xl font-bold text-white mt-1">
              {totalSentToday} <span className="text-xs text-slate-400 font-normal">/ {totalCapacity}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E101E] border border-[#1E223D] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Average Health</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{avgHealth}%</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E101E] border border-[#1E223D] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">In Warmup</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{activeWarmups} Mailboxes</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Toolbar / Search & Filter Bar (Matching Screenshot 1) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0C0D18] border border-[#1C2038]">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search email accounts or domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-[#131526] border border-[#232745] text-xs text-white rounded-lg focus:outline-none focus:border-[#9FA0FF] placeholder:text-slate-500"
          />
        </div>

        {/* Dropdowns & View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 pr-7 bg-[#131526] border border-[#232745] rounded-lg text-xs font-medium text-slate-300 hover:text-white focus:outline-none focus:border-[#9FA0FF] appearance-none cursor-pointer"
            >
              <option value="ALL">Type: All</option>
              <option value="GOOGLE">Google Workspace</option>
              <option value="MICROSOFT">Microsoft 365</option>
              <option value="SMTP">SMTP / IMAP</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 pr-7 bg-[#131526] border border-[#232745] rounded-lg text-xs font-medium text-slate-300 hover:text-white focus:outline-none focus:border-[#9FA0FF] appearance-none cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="HEALTHY">Healthy</option>
              <option value="WARNING">Warning</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* View Switcher (Table vs Grid) */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#131526] border border-[#232745]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-[#202442] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-[#202442] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: DATA TABLE (Screenshot 1 Design)                             */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="border border-[#1E223D] rounded-xl overflow-hidden bg-[#0C0D18] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Table Header */}
              <thead>
                <tr className="border-b border-[#1C2038] bg-[#0E1020] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded border-[#2E335C] bg-[#16182B] text-[#9FA0FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">EMAIL</th>
                  <th className="py-3 px-4">TAGS</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">DAILY SENT</th>
                  <th className="py-3 px-4">HEALTH SCORE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-[#181B2E]">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      <p className="font-semibold text-white">No email accounts found</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or connect a new mailbox.</p>
                      <Button
                        onClick={() => setAddModalOpen(true)}
                        className="mt-4 bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0A0B14] font-bold text-xs h-8 px-4"
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
                        className={`hover:bg-[#121424] transition-colors ${isSelected ? 'bg-[#151833]/60' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(account.id)}
                            className="rounded border-[#2E335C] bg-[#16182B] text-[#9FA0FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#181A2D] border border-[#272B4B] flex items-center justify-center text-[#9FA0FF] font-bold text-xs shrink-0">
                              {account.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-white hover:text-[#9FA0FF] transition-colors block">
                                {account.email}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {account.displayName || account.email?.split('@')[0]}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tags */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {account.tags && account.tags.length > 0 ? (
                              account.tags.map((t: string) => (
                                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#16192E] text-slate-300 border border-[#262B4E]">
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#16192E] text-slate-400 border border-[#262B4E]">
                                Outbound
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type / Provider */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-[#131526] border border-[#212542] text-slate-200">
                            {account.provider === 'GMAIL' ? 'Google Workspace' : account.provider === 'MICROSOFT' ? 'Microsoft 365' : 'SMTP / IMAP'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                            <span className={`font-semibold ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {account.status || 'Healthy'}
                            </span>
                          </div>
                        </td>

                        {/* Daily Sent */}
                        <td className="py-3 px-4">
                          <div className="space-y-1 max-w-[120px]">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-bold text-white">{account.sentToday || 0}</span>
                              <span className="text-slate-400">/ {account.dailyLimit || 50}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#181B2E] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usagePercent > 80 ? 'bg-amber-400' : 'bg-[#9FA0FF]'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Health Score */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              score >= 90 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              score >= 75 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}>
                              {score}%
                            </div>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">Optimal</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveAccountForWarmup(account);
                                setWarmupModalOpen(true);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                account.warmupActive 
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' 
                                  : 'bg-[#14162B] text-slate-400 border-[#222544] hover:text-white'
                              }`}
                              title={account.warmupActive ? 'Warmup Active' : 'Enable Warmup'}
                            >
                              <Flame className="w-3.5 h-3.5 fill-current" />
                            </button>

                            <button
                              onClick={() => handleDelete(account.id)}
                              className="p-1.5 rounded-lg bg-[#14162B] border border-[#222544] text-slate-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors"
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
      {/* VIEW MODE 2: CARD GRID (Rich Visual Cards)                                */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        filteredAccounts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-[#0c0d16] border border-[#1b1d30] rounded-2xl p-8">
            <Mail className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-white text-base">No email accounts found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Connect your Google Workspace, Microsoft 365, or SMTP sending account to start automated outreach.</p>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="mt-4 bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0A0B14] font-bold text-xs h-9 px-5 rounded-xl shadow-md shadow-[#9FA0FF]/20"
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
              <Card key={account.id} className="relative overflow-hidden hover:shadow-xl hover:border-[#9FA0FF]/40 transition-all bg-[#0e0f17] border border-[#202235]">
                <div className={`absolute top-0 left-0 w-full h-1 ${isWarning ? 'bg-amber-400' : 'bg-[#9FA0FF]'}`}></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-[#181a28] rounded-xl border border-[#222436]">
                        <Mail className="w-5 h-5 text-[#9FA0FF]" />
                      </div>
                      <div>
                        <CardTitle className="text-base truncate max-w-[200px] text-white">{account.email}</CardTitle>
                        <CardDescription className="text-xs mt-0.5 text-slate-400">
                          {account.provider === 'GMAIL' ? 'Google Workspace' : account.provider === 'MICROSOFT' ? 'Microsoft 365' : 'SMTP / IMAP'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium text-xs">Daily Limit</span>
                      <span className={`text-xs font-semibold ${isWarning ? 'text-amber-400' : 'text-white'}`}>
                        {account.sentToday || 0} / {account.dailyLimit || 50}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#181a28] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-amber-400' : 'bg-[#9FA0FF]'}`} 
                        style={{ width: `${Math.min(100, usagePercent)}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400 text-right">{usagePercent}% used today</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#1c1e2d] text-center">
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
                  
                  <div className="flex gap-2 pt-2 border-t border-[#1c1e2d] mt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-xs h-8 bg-[#141520] border-[#26283b] text-slate-200 hover:border-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      onClick={() => {
                        setActiveAccountForWarmup(account);
                        setWarmupModalOpen(true);
                      }}
                    >
                      <Flame className="w-3.5 h-3.5 mr-1.5" /> Warmup
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-none text-xs h-8 bg-[#141520] border-[#26283b] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/15 transition-colors px-2 text-slate-300"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Connect More Card in Grid */}
          <Card 
            onClick={() => setAddModalOpen(true)}
            className="border-dashed border-2 border-[#202235] bg-[#0e0f17]/50 hover:bg-[#141520] transition-colors flex flex-col items-center justify-center min-h-[260px] cursor-pointer group shadow-none"
          >
            <div className="w-12 h-12 bg-[#181a28] rounded-full flex items-center justify-center shadow-sm border border-[#26283b] group-hover:border-[#9FA0FF] transition-colors mb-4">
              <Plus className="w-6 h-6 text-[#9FA0FF]" />
            </div>
            <CardTitle className="text-base text-white">Add or Buy Accounts</CardTitle>
            <CardDescription className="text-center mt-2 px-6 text-xs text-slate-400">
              Deploy pre-warmed inboxes, DFY domains, or connect Google &amp; Microsoft.
            </CardDescription>
          </Card>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* ADD ACCOUNT WIZARD MODAL (Redesigned)                                      */}
      {/* ========================================================================= */}
      <AddAccountWizard
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAccountAdded={(newAccount) => {
          const updated = [newAccount, ...accounts];
          setAccounts(updated);
        }}
      />

      {/* ========================================================================= */}
      {/* WARMUP CONFIGURATION MODAL                                                */}
      {/* ========================================================================= */}
      {warmupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B0C15] border border-[#232742] text-slate-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#1C2038] flex items-center justify-between bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-5 h-5 fill-current" />
                <h2 className="text-base font-bold text-white">
                  Warmup Settings: {activeAccountForWarmup?.email ? activeAccountForWarmup.email.split('@')[0] : 'Global'}
                </h2>
              </div>
              <button 
                onClick={() => setWarmupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1A1D33] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#121422] rounded-xl border border-[#232742]">
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
                    <span className="text-xs font-bold text-[#9FA0FF]">{warmupSettings.dailyLimit} / day</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={warmupSettings.dailyLimit}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, dailyLimit: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#202235] rounded-lg appearance-none cursor-pointer accent-[#9FA0FF]"
                  />
                  <p className="text-[11px] text-slate-400">Maximum warmup sends per day.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 font-semibold text-xs">Daily Ramp-up</Label>
                    <span className="text-xs font-bold text-[#9FA0FF]">+{warmupSettings.rampUp} / day</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={warmupSettings.rampUp}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, rampUp: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#202235] rounded-lg appearance-none cursor-pointer accent-[#9FA0FF]"
                  />
                  <p className="text-[11px] text-slate-400">Gradually increment daily sends until maximum is reached.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 font-semibold text-xs">Target Peer Reply Rate</Label>
                    <span className="text-xs font-bold text-[#9FA0FF]">{warmupSettings.replyRate}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="80" step="5"
                    value={warmupSettings.replyRate}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, replyRate: parseInt(e.target.value) })}
                    className="w-full h-2 bg-[#202235] rounded-lg appearance-none cursor-pointer accent-[#9FA0FF]"
                  />
                  <p className="text-[11px] text-slate-400">Percentage of warmup emails receiving automated replies.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#1C2038] flex justify-end gap-2 bg-[#0A0B14]">
              <Button 
                variant="outline" 
                onClick={() => setWarmupModalOpen(false)} 
                className="bg-[#121422] border-[#252948] text-slate-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setWarmupModalOpen(false);
                }} 
                className="bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0A0B14] font-bold"
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

