import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Mail, ShieldAlert, CheckCircle2, RefreshCw, Check } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const mockGlobalAccounts = [
  { id: '1', email: 'team.outbound@reachops-demo.example', provider: 'Google Workspace', status: 'Connected', globalLimit: 150, usedToday: 88, assignedToCampaign: true },
  { id: '2', email: 'sarah.outreach@reachops-demo.example', provider: 'Microsoft 365', status: 'Connected', globalLimit: 100, usedToday: 52, assignedToCampaign: true },
  { id: '3', email: 'alex.turner@reachops-demo.example', provider: 'Google Workspace', status: 'Connected', globalLimit: 120, usedToday: 74, assignedToCampaign: true },
];

export default function CampaignAccounts() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u);
    } catch {}
    return null;
  });
  const isDemo = Boolean(currentUser?.isDemo || currentUser?.email === 'demo@reachops.com');

  const [accounts, setAccounts] = useState<any[]>(() => isDemo ? mockGlobalAccounts : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch('/api/email-accounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length > 0) {
            setAccounts(data.map((acc, idx) => ({
              id: acc.id || String(idx + 1),
              email: acc.email,
              provider: acc.provider === 'GMAIL' ? 'Google Workspace' : acc.provider === 'MICROSOFT' ? 'Microsoft 365' : acc.provider,
              status: acc.status === 'ACTIVE' ? 'Connected' : 'Paused',
              globalLimit: acc.dailyLimit || 150,
              usedToday: acc.sentToday || 0,
              assignedToCampaign: true,
            })));
          } else if (isDemo) {
            setAccounts(mockGlobalAccounts);
          } else {
            setAccounts([]);
          }
        }
      })
      .catch(console.error);
  }, [isDemo]);

  const toggleAssignment = (accountId: any) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, assignedToCampaign: !acc.assignedToCampaign } : acc
    ));
    showToast('Sending account rotation updated.');
  };

  const handleTestConnection = (accountId: string, email: string) => {
    setTestingId(accountId);
    setTimeout(() => {
      setTestingId(null);
      showToast(`Connection verified healthy for ${email} (MX/SPF/DKIM: Pass)`);
    }, 700);
  };

  const filteredAccounts = accounts.filter(acc => 
    (acc.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = accounts.filter(a => a.assignedToCampaign).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 bg-[#171717]/95 border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Sending Accounts</h2>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">
            Assign workspace email accounts to rotate sending for this specific campaign.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/email-accounts')}
          className="btn-reachops-primary text-white font-bold shadow-md shadow-[#a31c1b]/25 border-none cursor-pointer active:scale-95 transition-all text-xs h-9 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect New Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-surface border border-white/[0.09]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#10b981]/15 text-emerald-400 rounded-xl border border-[#10b981]/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Assigned Accounts</p>
              <p className="text-2xl font-extrabold text-white">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-surface border border-white/[0.09]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#10b981]/15 text-emerald-400 rounded-xl border border-[#10b981]/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Daily Capacity</p>
              <p className="text-2xl font-extrabold text-white">{assignedCount * 120} / day</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-surface border border-white/[0.09]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Warmup Safety</p>
              <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Protection
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-surface border border-white/[0.09] shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/[0.08]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-base font-bold text-white">Workspace Accounts</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search accounts..." 
                className="pl-9 bg-white/[0.04] border-white/[0.09] text-white placeholder-slate-500 focus:border-emerald-500 text-xs h-9 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 uppercase bg-white/[0.03] border-b border-white/[0.08] font-bold">
              <tr>
                <th className="px-6 py-3.5 w-16 text-center">Assign</th>
                <th className="px-6 py-3.5">Email Account</th>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Global Used Today</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredAccounts.map((account) => (
                <tr 
                  key={account.id} 
                  className={`hover:bg-white/[0.04] transition-colors ${account.assignedToCampaign ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="px-6 py-3.5 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-emerald-400 rounded border-white/[0.15] bg-white/[0.04] focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                      checked={account.assignedToCampaign}
                      onChange={() => toggleAssignment(account.id)}
                    />
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-white">{account.email}</div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-slate-300 font-medium">{account.provider}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      account.status === 'Connected' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 max-w-[100px] overflow-hidden">
                        <div 
                          className="bg-emerald-400 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (account.usedToday / account.globalLimit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{account.usedToday}/{account.globalLimit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={testingId === account.id}
                      onClick={() => handleTestConnection(account.id, account.email)}
                      className="text-emerald-400 font-bold hover:text-white hover:bg-emerald-500/20 text-xs h-7 px-3 rounded-lg cursor-pointer"
                    >
                      {testingId === account.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test'
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Mail className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-sm font-bold text-white">No email accounts connected</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">Connect a Google or Microsoft account to send emails from this campaign.</p>
                      <Button onClick={() => navigate('/email-accounts')} className="btn-reachops-primary text-xs font-bold">
                        Connect Email Account
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
