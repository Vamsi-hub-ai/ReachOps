import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { 
  Search, Plus, MoreHorizontal, Play, Pause, Copy, Edit2, BarChart2, Trash2
} from 'lucide-react';

const statuses = ['All', 'Draft', 'Scheduled', 'Running', 'Paused', 'Completed'];

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('campaigns');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse campaigns from local storage', e);
    }
    return [];
  });
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const updateCampaigns = (newCampaigns: any[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('campaigns', JSON.stringify(newCampaigns));
  };

  const toggleCampaignStatus = (id: string, newStatus: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c);
    updateCampaigns(updated);
    setOpenDropdown(null);
  };

  const duplicateCampaign = (campaign: any) => {
    const duplicated = {
      ...campaign,
      id: Math.random().toString(36).substring(2, 9),
      name: `${campaign.name} (Copy)`,
      created: new Date().toLocaleDateString(),
      status: 'Draft'
    };
    updateCampaigns([duplicated, ...campaigns]);
    setOpenDropdown(null);
  };

  const deleteCampaign = (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const updated = campaigns.filter(c => c.id !== id);
      updateCampaigns(updated);
      setOpenDropdown(null);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    (filter === 'All' || c.status === filter) &&
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage and track your email sequences.</p>
        </div>
        <Button asChild>
          <Link to="/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
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
            placeholder="Search campaigns..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm overflow-visible">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Campaign Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Prospects</th>
                <th className="px-6 py-4 font-medium">Sent</th>
                <th className="px-6 py-4 font-medium">Replies</th>
                <th className="px-6 py-4 font-medium">Reply Rate</th>
                <th className="px-6 py-4 font-medium">Next Send</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link to={`/campaigns/${campaign.id}`} className="font-medium text-primary hover:underline">{campaign.name}</Link>
                    <div className="text-xs text-gray-500 mt-1">Created: {campaign.created}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'Running' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                      campaign.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      campaign.status === 'Paused' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {campaign.status === 'Running' && <Play className="w-3 h-3 mr-1" />}
                      {campaign.status === 'Paused' && <Pause className="w-3 h-3 mr-1" />}
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{campaign.prospects.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{campaign.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{campaign.replies.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{campaign.replyRate}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{campaign.nextSend}</td>
                  <td className="px-6 py-4 text-right relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-gray-900"
                      onClick={() => setOpenDropdown(openDropdown === campaign.id ? null : campaign.id)}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                    
                    {/* Dropdown Menu */}
                    {openDropdown === campaign.id && (
                      <div className="absolute right-6 top-10 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 animate-in zoom-in-95">
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
                        <div className="relative z-50 text-left">
                          <Link to={`/campaigns/${campaign.id}`} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Edit2 className="mr-2 h-4 w-4 text-gray-400" /> Edit Campaign
                          </Link>
                          <Link to={`/campaigns/${campaign.id}`} className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <BarChart2 className="mr-2 h-4 w-4 text-gray-400" /> Open Workspace
                          </Link>
                          <button 
                            onClick={() => duplicateCampaign(campaign)}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="mr-2 h-4 w-4 text-gray-400" /> Duplicate
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          {campaign.status === 'Running' ? (
                            <button 
                              onClick={() => toggleCampaignStatus(campaign.id, 'Paused')}
                              className="w-full flex items-center px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                            >
                              <Pause className="mr-2 h-4 w-4" /> Pause
                            </button>
                          ) : (
                            <button 
                              onClick={() => toggleCampaignStatus(campaign.id, 'Running')}
                              className="w-full flex items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              <Play className="mr-2 h-4 w-4" /> Resume
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button 
                            onClick={() => deleteCampaign(campaign.id)}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No campaigns found matching your criteria.
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
