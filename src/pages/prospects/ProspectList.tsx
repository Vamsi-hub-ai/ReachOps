import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Plus, MoreHorizontal, Download, Mail, CheckSquare, Square, 
  Check, X, UserPlus, Trash2, Send, AlertCircle 
} from 'lucide-react';

const initialProspects = [
  { id: 1, name: 'Sarah Connor', email: 'sarah.connor@acme.example', company: 'Acme Systems', status: 'Replied', campaign: 'Product Hunt Beta Launch', step: 'Step 2', lastContact: '2 hours ago' },
  { id: 2, name: 'David Miller', email: 'david.miller@enterprise.example', company: 'Enterprise IO', status: 'Warm', campaign: 'VP of Sales Executive Outreach', step: 'Step 1', lastContact: 'Yesterday' },
  { id: 3, name: 'Michael Chang', email: 'michael@fintechops.example', company: 'FintechOps', status: 'New', campaign: 'SaaS Growth Founders Warmup', step: 'Step 1', lastContact: '3 days ago' },
  { id: 4, name: 'Elena Rostova', email: 'elena@growthcloud.example', company: 'GrowthCloud', status: 'Replied', campaign: 'Product Hunt Beta Launch', step: 'Step 3', lastContact: 'Today' },
  { id: 5, name: 'Marcus Sterling', email: 'marcus.s@hypergrowth.example', company: 'HyperGrowth Labs', status: 'New', campaign: 'VP of Sales Executive Outreach', step: 'Queued', lastContact: 'Just now' },
];

const statuses = ['All', 'New', 'Cold', 'Warm', 'Replied', 'Bounced', 'Unsubscribed'];

export default function ProspectList() {
  const [currentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u);
    } catch {}
    return null;
  });
  const isDemo = Boolean(currentUser?.isDemo || currentUser?.email === 'demo@reachops.com');

  const [prospects, setProspects] = useState<any[]>(() => isDemo ? initialProspects : []);

  useEffect(() => {
    fetch('/api/campaigns-leads?all=true')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.leads)) {
          if (data.leads.length > 0) {
            setProspects(data.leads);
          } else if (isDemo) {
            setProspects(initialProspects);
          } else {
            setProspects([]);
          }
        }
      })
      .catch(() => {});
  }, [isDemo]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Add Prospect Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [campaignInput, setCampaignInput] = useState('Product Hunt Beta Launch');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProspects = prospects.filter(p => 
    (filter === 'All' || p.status === filter) &&
    ((p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.company || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleAll = () => {
    if (selected.length === filteredProspects.length) {
      setSelected([]);
    } else {
      setSelected(filteredProspects.map(p => p.id));
    }
  };

  const toggleOne = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  // Add Prospect
  const handleAddProspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      showToast('Prospect email is required', 'error');
      return;
    }

    const newProspect = {
      id: Date.now(),
      name: nameInput.trim() || emailInput.split('@')[0],
      email: emailInput.trim(),
      company: companyInput.trim() || 'Enterprise Prospect',
      status: 'New',
      campaign: campaignInput,
      step: 'Step 1 Queued',
      lastContact: 'Just now'
    };

    setProspects([newProspect, ...prospects]);
    setIsAddModalOpen(false);
    setNameInput('');
    setEmailInput('');
    setCompanyInput('');
    showToast(`Added ${newProspect.email} successfully!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredProspects.length === 0) {
      showToast('No prospects to export', 'error');
      return;
    }

    const header = 'Name,Email,Company,Status,Campaign,LastContact\n';
    const rows = filteredProspects.map(p => 
      `"${p.name}","${p.email}","${p.company}","${p.status}","${p.campaign}","${p.lastContact}"`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reachops-prospects-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredProspects.length} prospects to CSV`);
  };

  // Bulk Actions
  const handleBulkAddToCampaign = () => {
    showToast(`Enrolled ${selected.length} prospects into active sequence!`);
    setSelected([]);
  };

  const handleBulkDelete = () => {
    setProspects(prospects.filter(p => !selected.includes(p.id)));
    showToast(`Removed ${selected.length} prospects.`);
    setSelected([]);
  };

  // Single Row Actions
  const handleDeleteOne = (id: number) => {
    setProspects(prospects.filter(p => p.id !== id));
    setActiveMenuId(null);
    showToast('Prospect deleted');
  };

  const handleMarkStatus = (id: number, nextStatus: string) => {
    setProspects(prospects.map(p => p.id === id ? { ...p, status: nextStatus } : p));
    setActiveMenuId(null);
    showToast(`Prospect status changed to ${nextStatus}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toastType === 'success'
            ? 'bg-[#171717]/95 border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)]'
            : 'bg-[#171717]/95 border-rose-500/40 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.3)]'
        }`}>
          {toastType === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Prospects</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage your contacts, sequence enrollments, and response signals.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="bg-white/[0.04] border-white/[0.09] text-slate-200 hover:text-white hover:bg-white/[0.08] text-xs h-9 rounded-xl cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-reachops-primary text-white font-bold shadow-lg shadow-[#a31c1b]/30 border-none text-xs h-9 rounded-xl cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-surface p-4 rounded-2xl border border-white/[0.09] shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === status 
                  ? 'bg-[#a31c1b] text-white font-bold shadow-md shadow-[#a31c1b]/30' 
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input 
            placeholder="Search by name, email, company..." 
            className="pl-9 bg-white/[0.04] border-white/[0.09] text-white placeholder-slate-400 focus:border-emerald-500 text-xs h-9 rounded-xl shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk Actions (visible when items selected) */}
      {selected.length > 0 && (
        <div className="bg-[#10b981]/15 border border-[#10b981]/30 rounded-2xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-xs text-white font-bold ml-2">
            {selected.length} prospect{selected.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleBulkAddToCampaign}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 rounded-xl cursor-pointer"
            >
              Add to Campaign
            </Button>
            <Button 
              size="sm" 
              onClick={handleBulkDelete}
              variant="outline" 
              className="bg-white/[0.04] border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-xs h-8 rounded-xl cursor-pointer"
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Prospects Table */}
      <Card className="glass-surface border border-white/[0.09] shadow-sm overflow-hidden rounded-2xl">
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 uppercase bg-white/[0.03] border-b border-white/[0.08] font-bold">
              <tr>
                <th className="px-6 py-3.5 w-12 text-center">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-white focus:outline-none cursor-pointer">
                    {selected.length === filteredProspects.length && filteredProspects.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3.5">Prospect</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Campaign</th>
                <th className="px-6 py-3.5">Last Contact</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredProspects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-white/[0.035] transition-colors relative">
                  <td className="px-6 py-3.5 text-center">
                    <button onClick={() => toggleOne(prospect.id)} className="text-slate-400 hover:text-white focus:outline-none cursor-pointer">
                      {selected.includes(prospect.id) ? (
                        <CheckSquare className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-white">{prospect.name}</div>
                    <div className="text-[11px] text-slate-400">{prospect.email}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-300 font-medium">{prospect.company}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      prospect.status === 'Replied' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      prospect.status === 'Warm' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      prospect.status === 'New' ? 'bg-[#10b981]/20 text-emerald-300 border border-[#10b981]/30' :
                      prospect.status === 'Bounced' ? 'bg-[#a31c1b]/20 text-rose-300 border border-[#a31c1b]/40' :
                      'bg-white/[0.06] text-slate-400 border border-white/[0.09]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        prospect.status === 'Replied' ? 'bg-emerald-400' :
                        prospect.status === 'Warm' ? 'bg-amber-400' :
                        prospect.status === 'New' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`} />
                      {prospect.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-slate-200 font-medium">{prospect.campaign}</div>
                    <div className="text-[11px] text-slate-400">{prospect.step}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 text-[11px]">
                    {prospect.lastContact}
                  </td>
                  <td className="px-6 py-3.5 text-right relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setActiveMenuId(activeMenuId === prospect.id ? null : prospect.id)}
                      className="text-slate-400 hover:text-white hover:bg-white/[0.08] h-8 w-8 rounded-lg cursor-pointer"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>

                    {/* Context Action Menu */}
                    {activeMenuId === prospect.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-6 top-8 w-44 bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl py-1.5 z-40 text-xs text-left animate-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(prospect.id, 'Replied')}
                            className="w-full px-3.5 py-2 text-slate-200 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mark Replied</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(prospect.id, 'Warm')}
                            className="w-full px-3.5 py-2 text-slate-200 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-amber-400" />
                            <span>Mark Warm Lead</span>
                          </button>
                          <div className="border-t border-white/[0.06] my-1" />
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(prospect.id)}
                            className="w-full px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete Prospect</span>
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredProspects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No prospects found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Prospect Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 overflow-hidden text-slate-100">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Add New Prospect</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProspect} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Turner"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex.turner@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Company</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Tech"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Assign Campaign</label>
                <select
                  value={campaignInput}
                  onChange={(e) => setCampaignInput(e.target.value)}
                  className="w-full bg-[#171717] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner [color-scheme:dark]"
                >
                  <option value="Product Hunt Beta Launch">Product Hunt Beta Launch</option>
                  <option value="VP of Sales Executive Outreach">VP of Sales Executive Outreach</option>
                  <option value="SaaS Growth Founders Warmup">SaaS Growth Founders Warmup</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs border-white/[0.09] bg-white/[0.04] text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-reachops-primary text-xs font-bold text-white shadow-md shadow-[#a31c1b]/30"
                >
                  Save Prospect
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
