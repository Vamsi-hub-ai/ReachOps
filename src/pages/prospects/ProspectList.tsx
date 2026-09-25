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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Prospects</h1>
          <p className="text-gray-500 mt-1">Manage your contacts and track engagement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, email, company..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk Actions (visible when items selected) */}
      {selected.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm text-blue-800 font-medium ml-2">
            {selected.length} prospect{selected.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-white">Add to Campaign</Button>
            <Button size="sm" variant="outline" className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700">Delete</Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <Card className="shadow-sm overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                    {selected.length === filteredProspects.length && filteredProspects.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
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
            <tbody className="divide-y divide-gray-100">
              {filteredProspects.map((prospect) => (
                <tr 
                  key={prospect.id} 
                  className={`transition-colors group ${selected.includes(prospect.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                >
                  <td className="px-6 py-4">
                    <button onClick={() => toggleOne(prospect.id)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                      {selected.includes(prospect.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{prospect.name}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Mail className="w-3 h-3 mr-1" /> {prospect.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{prospect.company}</div>
                    <div className="text-xs text-gray-500 mt-1">{prospect.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      prospect.status === 'Replied' ? 'bg-green-100 text-green-800' :
                      prospect.status === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                      prospect.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      prospect.status === 'Bounced' ? 'bg-red-100 text-red-800' :
                      prospect.status === 'Unsubscribed' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {prospect.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{prospect.campaign}</div>
                    <div className="text-xs text-gray-500 mt-1">{prospect.step}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {prospect.lastContact}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-gray-900"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredProspects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
