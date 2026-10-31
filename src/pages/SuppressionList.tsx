import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShieldAlert, Search, Plus, MoreHorizontal, Download, Upload, 
  Trash2, X, Check, AlertCircle, ShieldCheck 
} from 'lucide-react';

const initialSuppressionList = [
  { id: 1, type: 'Domain', value: 'competitor-analytics.example', reason: 'Direct Competitor', added: 'Oct 14, 2026', by: 'ReachOps Safety Guard' },
  { id: 2, type: 'Email', value: 'do-not-contact@example.org', reason: 'Unsubscribed (DNC)', added: 'Oct 18, 2026', by: 'Demo User' },
  { id: 3, type: 'Domain', value: 'spam-trap-domain.example', reason: 'Hard Bounce Risk', added: 'Oct 22, 2026', by: 'MX Hygiene Engine' },
  { id: 4, type: 'Email', value: 'legal@enterprise-rival.example', reason: 'Legal Compliance', added: 'Oct 26, 2026', by: 'Demo User' },
];

export default function SuppressionList() {
  const [rules, setRules] = useState(initialSuppressionList);
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add rule form
  const [ruleType, setRuleType] = useState<'Domain' | 'Email'>('Domain');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleReason, setRuleReason] = useState('Direct Competitor');
  const [importText, setImportText] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = search 
    ? rules.filter(item => 
        item.value.toLowerCase().includes(search.toLowerCase()) || 
        item.reason.toLowerCase().includes(search.toLowerCase())
      )
    : rules;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleValue.trim()) {
      showToast('Value (domain or email) is required');
      return;
    }

    const newRule = {
      id: Date.now(),
      type: ruleType,
      value: ruleValue.trim().toLowerCase(),
      reason: ruleReason,
      added: 'Just now',
      by: 'Demo User'
    };

    setRules([newRule, ...rules]);
    setIsAddModalOpen(false);
    setRuleValue('');
    showToast(`Suppression rule added for ${newRule.value}`);
  };

  const handleImportCSV = () => {
    if (!importText.trim()) {
      showToast('Please enter at least one entry');
      return;
    }

    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const newItems = lines.map((line, idx) => {
      const isEmail = line.includes('@');
      return {
        id: Date.now() + idx,
        type: isEmail ? 'Email' : 'Domain',
        value: line.toLowerCase(),
        reason: 'Bulk CSV Import',
        added: 'Just now',
        by: 'Demo User'
      };
    });

    setRules([...newItems, ...rules]);
    setIsImportModalOpen(false);
    setImportText('');
    showToast(`Imported ${newItems.length} suppression entries!`);
  };

  const handleDeleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
    setActiveMenuId(null);
    showToast('Suppression rule deleted.');
  };

  const handleExportCSV = () => {
    if (rules.length === 0) {
      showToast('No entries to export');
      return;
    }

    const header = 'Type,Value,Reason,Added,AddedBy\n';
    const rows = rules.map(r => `"${r.type}","${r.value}","${r.reason}","${r.added}","${r.by}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reachops-suppression-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${rules.length} suppression rules.`);
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Suppression List</h1>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Manage domains and email addresses that should never be contacted.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white/[0.04] border-white/[0.09] text-slate-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-xs h-9 cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import CSV
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-reachops-primary font-bold shadow-lg shadow-[#a31c1b]/25 rounded-xl text-xs h-9 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Rule
          </Button>
        </div>
      </div>

      <div className="glass-surface overflow-hidden rounded-2xl">
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search domains or emails..." 
              className="pl-9 bg-white/[0.04] border-white/[0.09] text-white placeholder-slate-400 focus:border-emerald-500 rounded-xl text-xs shadow-inner h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="bg-white/[0.04] border-white/[0.09] text-slate-200 hover:bg-white/[0.08] hover:text-white rounded-xl text-xs h-9 hidden sm:flex cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export List
          </Button>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 bg-white/[0.03] border-b border-white/[0.08] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3.5 text-slate-300">Type</th>
                <th className="px-6 py-3.5 text-slate-300">Value</th>
                <th className="px-6 py-3.5 text-slate-300">Reason</th>
                <th className="px-6 py-3.5 text-slate-300">Added On</th>
                <th className="px-6 py-3.5 text-slate-300">Added By</th>
                <th className="px-6 py-3.5 text-right text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.035] transition-colors relative">
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.type === 'Domain' ? 'bg-[#a31c1b]/15 text-rose-300 border border-[#a31c1b]/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white font-mono">{item.value}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{item.reason}</td>
                  <td className="px-6 py-4 text-slate-400 text-[11px]">{item.added}</td>
                  <td className="px-6 py-4 text-slate-400 text-[11px]">{item.by}</td>
                  <td className="px-6 py-4 text-right relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>

                    {activeMenuId === item.id && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-6 top-8 w-40 bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl py-1.5 z-40 text-xs text-left animate-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(item.id)}
                            className="w-full px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Remove Rule</span>
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No suppression rules match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">Add Suppression Rule</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddRule} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Rule Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleType('Domain')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      ruleType === 'Domain' ? 'bg-[#a31c1b] border-[#a31c1b] text-white shadow-sm' : 'bg-white/[0.04] border-white/[0.08] text-slate-300'
                    }`}
                  >
                    Domain
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleType('Email')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      ruleType === 'Email' ? 'bg-[#a31c1b] border-[#a31c1b] text-white shadow-sm' : 'bg-white/[0.04] border-white/[0.08] text-slate-300'
                    }`}
                  >
                    Email Address
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  {ruleType === 'Domain' ? 'Domain Name (e.g. competitor.com)' : 'Email Address'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={ruleType === 'Domain' ? 'rival-company.com' : 'lead@example.com'}
                  value={ruleValue}
                  onChange={(e) => setRuleValue(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Suppression Reason</label>
                <select
                  value={ruleReason}
                  onChange={(e) => setRuleReason(e.target.value)}
                  className="w-full bg-[#171717] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                >
                  <option value="Direct Competitor">Direct Competitor</option>
                  <option value="Unsubscribed (DNC)">Unsubscribed (DNC)</option>
                  <option value="Hard Bounce Risk">Hard Bounce Risk</option>
                  <option value="Legal Compliance">Legal Compliance</option>
                  <option value="Internal Company Domain">Internal Company Domain</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs border-white/[0.09] bg-white/[0.04] text-slate-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-reachops-primary text-xs font-bold text-white shadow-md shadow-[#a31c1b]/30">
                  Save Rule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsImportModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">Import Suppression List</h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">
                Paste Domains or Emails (one per line)
              </label>
              <textarea
                rows={5}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="bad-lead@example.com&#10;competitor-firm.com&#10;spam-trap.org"
                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono shadow-inner resize-none"
              />
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-xs border-white/[0.09] bg-white/[0.04] text-slate-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportCSV}
                  className="btn-reachops-primary text-xs font-bold text-white shadow-md shadow-[#a31c1b]/30"
                >
                  Import Entries
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
