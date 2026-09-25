import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

const mockCampaignLeads: any[] = [];

export default function CampaignLeads() {
  const { id } = useParams();
  console.log('Campaign ID:', id);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = mockCampaignLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Interested': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'Replied': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'Bounced': return <AlertCircle className="w-3 h-3 mr-1" />;
      case 'Not Interested': return <XCircle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Interested': return 'bg-green-100 text-green-800';
      case 'Replied': return 'bg-blue-100 text-blue-800';
      case 'Bounced': return 'bg-red-100 text-red-800';
      case 'Not Interested': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Campaign Leads</h2>
          <p className="text-gray-500 mt-1">
            Manage prospects currently enrolled in this sequence.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Leads
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-white rounded-t-lg">
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Total: </span>
              <span className="font-bold text-gray-900">0</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Active: </span>
              <span className="font-bold text-gray-900">0</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Completed: </span>
              <span className="font-bold text-gray-900">0</span>
            </div>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name, email, or company..." 
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Prospect</th>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Current Step</th>
                <th className="px-6 py-3 font-medium">Next Action</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-xs text-gray-500">{lead.email}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{lead.company}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(lead.status)}`}>
                      {getStatusIcon(lead.status)}
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 font-medium">{lead.step}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{lead.nextAction}</td>
                  <td className="px-6 py-3 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No leads found matching your criteria.
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
