import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Search, Plus, MoreHorizontal, Download, Upload } from 'lucide-react';

const mockSuppressionList = [
  { id: 1, type: 'Domain', value: 'competitor.com', reason: 'Competitor', added: 'Oct 1, 2026', by: 'Victor Admin' },
  { id: 2, type: 'Email', value: 'do-not-reply@example.com', reason: 'Invalid Email', added: 'Oct 2, 2026', by: 'Victor Admin' },
];

export default function SuppressionList() {
  const [search, setSearch] = useState('');

  const filtered = search 
    ? mockSuppressionList.filter(item => item.value.toLowerCase().includes(search.toLowerCase()))
    : mockSuppressionList;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Suppression List</h1>
            <ShieldAlert className="w-6 h-6 text-[#FF7171]" />
          </div>
          <p className="text-slate-400 mt-1">Manage domains and email addresses that should never be contacted.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-[#141520] border-[#26283b] text-slate-200 hover:text-white hover:bg-[#1a1c29]">
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button className="bg-[#FF7171] hover:bg-[#ee6060] text-white font-bold shadow-md shadow-[#FF7171]/25 border-none">
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-[#202235] bg-[#0e0f17]">
        <div className="p-4 border-b border-[#1c1e2d] bg-[#090a10] flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search domains or emails..." 
              className="pl-9 bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="bg-[#141520] border-[#26283b] text-slate-200 hover:bg-[#1a1c29] hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-[#090a10] border-b border-[#1c1e2d] uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Value</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Added On</th>
                <th className="px-6 py-4 font-medium">Added By</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1e2d]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#141520]/60 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      item.type === 'Domain' ? 'bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/30' : 'bg-[#D5E8E6]/20 text-[#D5E8E6] border border-[#D5E8E6]/30'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{item.value}</td>
                  <td className="px-6 py-4 text-slate-300">{item.reason}</td>
                  <td className="px-6 py-4 text-slate-400">{item.added}</td>
                  <td className="px-6 py-4 text-slate-400">{item.by}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#FF7171] hover:bg-[#181a28]">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No suppression rules found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-[#1c1e2d] bg-[#090a10] text-xs text-slate-400 flex justify-between items-center">
          <span>Showing {filtered.length} entries</span>
        </div>
      </Card>
      
    </div>
  );
}
