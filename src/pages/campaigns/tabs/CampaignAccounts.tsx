import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

const mockGlobalAccounts = [
  { id: '1', email: 'gayatri@theglobalassociates.com', provider: 'Gmail', status: 'Connected', globalLimit: 100, usedToday: 14, assignedToCampaign: true },
  { id: '2', email: 'ishita@theglobalassociates.com', provider: 'Gmail', status: 'Connected', globalLimit: 100, usedToday: 18, assignedToCampaign: true },
  { id: '3', email: 'juhi@theglobalassociates.com', provider: 'Gmail', status: 'Connected', globalLimit: 100, usedToday: 21, assignedToCampaign: true },
  { id: '4', email: 'sales.lead@theglobalassociates.com', provider: 'Outlook', status: 'Connected', globalLimit: 80, usedToday: 12, assignedToCampaign: true },
];

export default function CampaignAccounts() {
  const { id } = useParams();

  const [accounts, setAccounts] = useState<any[]>(mockGlobalAccounts);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/email-accounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data.map((acc, idx) => ({
            id: acc.id || String(idx + 1),
            email: acc.email,
            provider: acc.provider === 'GMAIL' ? 'Gmail' : acc.provider === 'MICROSOFT' ? 'Outlook' : acc.provider,
            status: acc.status === 'ACTIVE' ? 'Connected' : 'Paused',
            globalLimit: acc.dailyLimit || 100,
            usedToday: acc.sentToday || 0,
            assignedToCampaign: true,
          })));
        }
      })
      .catch(console.error);
  }, []);

  const toggleAssignment = (accountId: any) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, assignedToCampaign: !acc.assignedToCampaign } : acc
    ));
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = accounts.filter(a => a.assignedToCampaign).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Sending Accounts</h2>
          <p className="text-slate-400 mt-1">
            Assign workspace email accounts to rotate sending for this specific campaign.
          </p>
        </div>
        <Button className="bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] font-bold shadow-md shadow-[#9FA0FF]/25 border-none">
          <Plus className="w-4 h-4 mr-2" />
          Connect New Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0e0f17] border border-[#202235]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#9FA0FF]/20 text-[#9FA0FF] rounded-xl border border-[#9FA0FF]/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Assigned Accounts</p>
              <p className="text-2xl font-bold text-white">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0e0f17] border border-[#202235]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#D5E8E6]/20 text-[#D5E8E6] rounded-xl border border-[#D5E8E6]/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Daily Capacity</p>
              <p className="text-2xl font-bold text-white">{assignedCount * 50}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0e0f17] border border-[#202235]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-[#FFF3E3]/20 text-[#FFF3E3] rounded-xl border border-[#FFF3E3]/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Global Limit Status</p>
              <p className="text-sm font-bold text-[#FFF3E3] mt-1">Checking enabled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0e0f17] border border-[#202235] shadow-sm">
        <CardHeader className="pb-4 border-b border-[#1c1e2d]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg text-white">Workspace Accounts</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search accounts..." 
                className="pl-9 bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-[#090a10] border-b border-[#1c1e2d]">
              <tr>
                <th className="px-6 py-4 font-medium w-16">Assign</th>
                <th className="px-6 py-4 font-medium">Email Account</th>
                <th className="px-6 py-4 font-medium">Provider</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Global Used Today</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1e2d]">
              {filteredAccounts.map((account) => (
                <tr 
                  key={account.id} 
                  className={`hover:bg-[#141520]/60 transition-colors ${account.assignedToCampaign ? 'bg-[#9FA0FF]/10' : ''}`}
                >
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-[#9FA0FF] rounded border-[#26283b] bg-[#141520] focus:ring-[#9FA0FF] cursor-pointer"
                      checked={account.assignedToCampaign}
                      onChange={() => toggleAssignment(account.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{account.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400">{account.provider}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      account.status === 'Connected' ? 'bg-[#D5E8E6] text-[#1a4a44] border border-[#D5E8E6]' : 'bg-[#FF7171]/20 text-[#FF7171] border border-[#FF7171]/40'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#181a28] rounded-full h-2 max-w-[100px] overflow-hidden">
                        <div 
                          className="bg-[#9FA0FF] h-2 rounded-full" 
                          style={{ width: `${(account.usedToday / account.globalLimit) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-400">{account.usedToday}/{account.globalLimit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-[#9FA0FF] font-semibold hover:text-[#8889FF] hover:bg-[#181a28]">
                      Test
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No accounts found matching your search.
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
