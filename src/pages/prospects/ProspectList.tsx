import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Plus, MoreHorizontal, Download, Mail, CheckSquare, Square
} from 'lucide-react';

const mockProspects: any[] = [];

const statuses = ['All', 'New', 'Cold', 'Warm', 'Replied', 'Bounced', 'Unsubscribed'];

export default function ProspectList() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  
  const filteredProspects = mockProspects.filter(p => 
    (filter === 'All' || p.status === filter) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.company.toLowerCase().includes(searchQuery.toLowerCase()))
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Prospects</h1>
          <p className="text-slate-400 mt-1">Manage your contacts and track engagement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-[#141520] border-[#26283b] text-slate-200 hover:text-white hover:bg-[#1a1c29]">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] font-bold shadow-md shadow-[#9FA0FF]/25 border-none">
            <Plus className="w-4 h-4 mr-2" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0e0f17] p-4 rounded-xl border border-[#202235] shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status 
                  ? 'bg-[#9FA0FF] text-[#0c0d18] font-bold shadow-sm' 
                  : 'bg-[#181a28] text-slate-300 hover:bg-[#202235] hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email, company..." 
            className="pl-9 bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk Actions (visible when items selected) */}
      {selected.length > 0 && (
        <div className="bg-[#9FA0FF]/15 border border-[#9FA0FF]/30 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm text-white font-medium ml-2">
            {selected.length} prospect{selected.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-[#141520] border-[#26283b] text-slate-200 hover:bg-[#1a1c29]">Add to Campaign</Button>
            <Button size="sm" variant="outline" className="bg-[#141520] border-[#FF7171]/40 text-[#FF7171] hover:bg-[#FF7171]/20">Delete</Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <Card className="shadow-sm overflow-visible bg-[#0e0f17] border-[#202235]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-[#090a10] border-b border-[#1c1e2d]">
              <tr>
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-white focus:outline-none">
                    {selected.length === filteredProspects.length && filteredProspects.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-[#9FA0FF]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 font-medium">Prospect</th>
                <th className="px-6 py-4 font-medium">Company</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Campaign</th>
                <th className="px-6 py-4 font-medium">Last Contact</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1e2d]">
              {filteredProspects.map((prospect) => (
                <tr 
                  key={prospect.id} 
                  className={`transition-colors group ${selected.includes(prospect.id) ? 'bg-[#9FA0FF]/15' : 'hover:bg-[#141520]/60'}`}
                >
                  <td className="px-6 py-4">
                    <button onClick={() => toggleOne(prospect.id)} className="text-slate-400 hover:text-white focus:outline-none">
                      {selected.includes(prospect.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#9FA0FF]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{prospect.name}</div>
                    <div className="text-xs text-slate-400 flex items-center mt-1">
                      <Mail className="w-3 h-3 mr-1 text-[#9FA0FF]" /> {prospect.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{prospect.company}</div>
                    <div className="text-xs text-slate-400 mt-1">{prospect.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      prospect.status === 'Replied' ? 'bg-[#D5E8E6] text-[#1a4a44] border border-[#D5E8E6]' :
                      prospect.status === 'Warm' ? 'bg-[#FFF3E3] text-[#7c561b] border border-[#f5e4cd]' :
                      prospect.status === 'New' ? 'bg-[#9FA0FF]/25 text-[#9FA0FF] border border-[#9FA0FF]/40' :
                      prospect.status === 'Bounced' ? 'bg-[#FF7171]/20 text-[#FF7171] border border-[#FF7171]/40' :
                      'bg-[#181a28] text-slate-400 border border-[#26283b]'
                    }`}>
                      {prospect.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{prospect.campaign}</div>
                    <div className="text-xs text-slate-400 mt-1">{prospect.step}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {prospect.lastContact}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-white hover:bg-[#181a28]"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
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
    </div>
  );
}
