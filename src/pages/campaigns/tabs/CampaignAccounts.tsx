import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

const mockGlobalAccounts = [
  { id: 1, email: 'sales1@gmail.com', provider: 'Gmail', status: 'Connected', globalLimit: 50, usedToday: 42, assignedToCampaign: true },
  { id: 2, email: 'sales2@gmail.com', provider: 'Gmail', status: 'Connected', globalLimit: 50, usedToday: 38, assignedToCampaign: true },
  { id: 3, email: 'sales3@company.com', provider: 'Outlook', status: 'Paused', globalLimit: 100, usedToday: 0, assignedToCampaign: false },
  { id: 4, email: 'sales4@company.com', provider: 'Outlook', status: 'Connected', globalLimit: 100, usedToday: 15, assignedToCampaign: false },
  { id: 5, email: 'support@company.com', provider: 'Gmail', status: 'Connected', globalLimit: 250, usedToday: 210, assignedToCampaign: false },
];

export default function CampaignAccounts() {
  const { id } = useParams();
  // using id for demonstration if needed, or simply ignoring it to avoid unused var:
  console.log('Campaign ID:', id); 

  const [accounts, setAccounts] = useState(mockGlobalAccounts);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAssignment = (accountId: number) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, assignedToCampaign: !acc.assignedToCampaign } : acc
    ));
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = accounts.filter(a => a.assignedToCampaign).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sending Accounts</h2>
          <p className="text-gray-500 mt-1">
            Assign workspace email accounts to rotate sending for this specific campaign.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Connect New Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Assigned Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Daily Capacity</p>
              <p className="text-2xl font-bold text-gray-900">{assignedCount * 50}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Global Limit Status</p>
              <p className="text-sm font-bold text-gray-900 mt-1 text-amber-600">Checking enabled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle className="text-lg">Workspace Accounts</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search accounts..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium w-16">Assign</th>
                <th className="px-6 py-4 font-medium">Email Account</th>
                <th className="px-6 py-4 font-medium">Provider</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Global Used Today</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map((account) => (
                <tr 
                  key={account.id} 
                  className={`hover:bg-gray-50/50 transition-colors ${account.assignedToCampaign ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
                      checked={account.assignedToCampaign}
                      onChange={() => toggleAssignment(account.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{account.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{account.provider}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      account.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(account.usedToday / account.globalLimit) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{account.usedToday}/{account.globalLimit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      Test
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
