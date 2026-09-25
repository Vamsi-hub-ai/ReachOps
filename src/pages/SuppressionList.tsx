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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Suppression List</h1>
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-500 mt-1">Manage domains and email addresses that should never be contacted.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Rule
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search domains or emails..." 
              className="pl-9 bg-white border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="bg-white hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Value</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Added On</th>
                <th className="px-6 py-4 font-medium">Added By</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      item.type === 'Domain' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.value}</td>
                  <td className="px-6 py-4 text-gray-600">{item.reason}</td>
                  <td className="px-6 py-4 text-gray-500">{item.added}</td>
                  <td className="px-6 py-4 text-gray-500">{item.by}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No suppression rules found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 text-xs text-gray-500 flex justify-between items-center">
          <span>Showing {filtered.length} entries</span>
        </div>
      </Card>
      
    </div>
  );
}
