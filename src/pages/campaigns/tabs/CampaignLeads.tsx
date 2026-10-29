import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';

const sampleLeads = [
  { id: '1', name: 'Sarah Connor', email: 'sarah.connor@acme.com', company: 'Acme Systems', status: 'Replied', step: 'Step 1', nextAction: 'Replied: Ready for call', deliverability: 'Verified' },
  { id: '2', name: 'David Miller', email: 'david.miller@enterprise.io', company: 'Enterprise IO', status: 'Opened', step: 'Step 2', nextAction: 'Wait 3 days before Step 3', deliverability: 'Verified' },
  { id: '3', name: 'Michael Chang', email: 'michael@fintechops.com', company: 'FintechOps', status: 'Active', step: 'Step 1', nextAction: 'Sending today at 14:30', deliverability: 'Verified' },
  { id: '4', name: 'Elena Rostova', email: 'elena@growthcloud.net', company: 'GrowthCloud', status: 'Active', step: 'Step 2', nextAction: 'Wait 2 days', deliverability: 'Catch-all Safe' },
];

export default function CampaignLeads() {
  const { id } = useParams();
  const campaignKey = id || 'tga-sales';
  const isTga = campaignKey === 'tga-sales';

  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<any[]>(isTga ? sampleLeads : []);
  const [leadStats, setLeadStats] = useState(isTga ? { total: 47, active: 46, replied: 1 } : { total: 0, active: 0, replied: 0 });

  useEffect(() => {
    fetch(`/api/campaigns/${campaignKey}/leads`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.leads)) {
          setLeads(data.leads);
          setLeadStats({
            total: data.total || data.leads.length,
            active: data.active || data.leads.filter((l: any) => l.status === 'Active' || l.status === 'Opened').length,
            replied: data.replied || data.leads.filter((l: any) => l.status === 'Replied').length,
          });
        }
      })
      .catch(console.error);
  }, [campaignKey]);

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Campaign Leads</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prospects enrolled in this sequence. Cleaned and verified to prevent hard bounces.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#26283b] bg-[#141520] hover:bg-[#1b1c2b] text-slate-200 text-xs h-9">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            Filter
          </Button>
          <Button className="bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] text-xs h-9 font-bold shadow-lg shadow-[#9FA0FF]/25 border-none">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Leads
          </Button>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="rounded-2xl bg-[#121319] border border-[#222430] overflow-hidden">
        
        {/* Controls bar */}
        <div className="p-4 border-b border-[#1c1e28] flex flex-col sm:flex-row justify-between gap-4 bg-[#0e0f14]">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400">Total Enrolled: </span>
              <span className="font-bold text-white">{leadStats.total}</span>
            </div>
            <div>
              <span className="text-slate-400">Active Sequence: </span>
              <span className="font-bold text-[#9FA0FF]">{leadStats.active}</span>
            </div>
            <div>
              <span className="text-slate-400">Replied: </span>
              <span className="font-bold text-[#D5E8E6]">{leadStats.replied}</span>
            </div>
            <div>
              <span className="text-slate-400">Bounce Protection: </span>
              <span className="font-bold text-[#D5E8E6]">100% Clean</span>
            </div>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              placeholder="Search by name, email, or company..." 
              className="w-full bg-[#161724] border border-[#26283b] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#9FA0FF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-[#0e0f14] border-b border-[#1c1e28]">
              <tr>
                <th className="px-6 py-3.5 font-semibold text-slate-300">Prospect</th>
                <th className="px-6 py-3.5 font-semibold text-slate-300">Company</th>
                <th className="px-6 py-3.5 font-semibold text-slate-300">Status</th>
                <th className="px-6 py-3.5 font-semibold text-slate-300">Current Step</th>
                <th className="px-6 py-3.5 font-semibold text-slate-300">Next Action</th>
                <th className="px-6 py-3.5 font-semibold text-slate-300">Hygiene</th>
                <th className="px-6 py-3.5 font-semibold text-right text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1e28]">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#161722]/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-white">{lead.name}</div>
                    <div className="text-[11px] text-slate-400">{lead.email}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-300">{lead.company}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      lead.status === 'Replied' ? 'bg-[#D5E8E6]/20 text-[#D5E8E6] border border-[#D5E8E6]/40' :
                      lead.status === 'Opened' ? 'bg-[#FFF3E3]/20 text-[#FFF3E3] border border-[#FFF3E3]/40' :
                      'bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/40'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-300 font-medium">{lead.step}</td>
                  <td className="px-6 py-3.5 text-slate-400 text-[11px]">{lead.nextAction}</td>
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-1 text-[11px] text-[#D5E8E6] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {lead.deliverability}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1e2030]">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No leads enrolled in this campaign yet.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
        </div>

      </div>

    </div>
  );
}
