import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Plus, MoreHorizontal, Play, Pause, Copy, Edit2, 
  Trash2, Send, Settings, Bot, ChevronDown, CheckSquare, Square
} from 'lucide-react';

export default function CampaignList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [tagFilter, setTagFilter] = useState('All tags');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownAnchor, setDropdownAnchor] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!dropdownAnchor) return;
    const handleClose = () => setDropdownAnchor(null);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [dropdownAnchor]);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCampaigns(data);
        }
      })
      .catch((err) => console.warn('Could not fetch /api/campaigns:', err));
  }, []);

  const updateCampaigns = (newCampaigns: any[]) => {
    setCampaigns(newCampaigns);
  };

  const toggleCampaignStatus = async (id: string, newStatus: string) => {
    const updated = campaigns.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    updateCampaigns(updated);
    setDropdownAnchor(null);

    try {
      await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update campaign status in backend:', err);
    }
  };

  const duplicateCampaign = async (campaign: any) => {
    const newName = `${campaign.name} (Copy)`;
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, dailyLimit: 100 }),
      });
      if (res.ok) {
        const created = await res.json();
        const newCamp = {
          ...campaign,
          id: created.id,
          name: created.name,
          created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Draft',
          sent: 0,
          replies: 0,
          replyRate: '0%',
        };
        updateCampaigns([newCamp, ...campaigns]);
      }
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
    setDropdownAnchor(null);
  };

  const deleteCampaign = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const updated = campaigns.filter((c) => c.id !== id);
      updateCampaigns(updated);
      setDropdownAnchor(null);

      try {
        await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete campaign from backend:', err);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCampaigns.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All statuses' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 text-slate-100 select-none">
      
      {/* Top Toolbar matching Image 3 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        
        {/* Left Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search" 
              className="w-full pl-9 pr-3 py-1.5 bg-[#0f1118] border border-[#202334] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0080FF] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0f1118] border border-[#202334] hover:border-[#2e3349] text-xs font-medium text-slate-300 rounded-lg pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none transition-colors"
            >
              <option value="All statuses">All statuses</option>
              <option value="Running">Running</option>
              <option value="Draft">Draft</option>
              <option value="Paused">Paused</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Tags Filter Dropdown */}
          <div className="relative">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="appearance-none bg-[#0f1118] border border-[#202334] hover:border-[#2e3349] text-xs font-medium text-slate-300 rounded-lg pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none transition-colors"
            >
              <option value="All tags">All tags</option>
              <option value="Inbound">Inbound</option>
              <option value="Outbound">Outbound</option>
              <option value="Enterprise">Enterprise</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Right Actions: Settings, Automate Pill, + Create New matching Image 3 */}
        <div className="flex items-center gap-2.5">
          {/* Settings button */}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg bg-[#0f1118] border border-[#202334] hover:border-[#2e3349] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Campaign Defaults"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Automate your outreach button with top cyan border glow */}
          <button 
            onClick={() => navigate('/campaigns/new')}
            className="relative px-3.5 py-1.5 rounded-lg bg-[#0f1118] border border-[#202334] text-xs font-medium text-slate-200 hover:text-white flex items-center gap-1.5 overflow-hidden transition-all group cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Automate your outreach</span>
          </button>

          {/* Solid blue Create New button */}
          <button
            onClick={() => navigate('/campaigns/new')}
            className="px-4 py-1.5 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0080FF]/25 hover:shadow-[#0080FF]/40 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
        </div>

      </div>

      {/* Campaigns Table matching Image 3 */}
      <div className="w-full bg-[#0a0c13] border border-[#1a1d2b] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-bold text-slate-400 uppercase bg-[#08090f] border-b border-[#181a26]">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCampaigns.length > 0 && selectedIds.length === filteredCampaigns.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded bg-[#12141e] border-[#2b2e40] text-[#0080FF] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 font-bold tracking-wider">
                  <div className="flex items-center gap-1">
                    <span>NAME</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold tracking-wider">
                  <div className="flex items-center gap-1">
                    <span>TYPE</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold tracking-wider">
                  <div className="flex items-center gap-1">
                    <span>STATUS</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold tracking-wider">TAGS</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">PROGRESS</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">ACTIVITY</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">OUTCOME</th>
                <th className="px-4 py-3.5 font-bold tracking-wider">GOAL</th>
                <th className="px-4 py-3.5 w-12 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151724]">
              {filteredCampaigns.map((campaign) => {
                const isChecked = selectedIds.includes(campaign.id);

                return (
                  <tr 
                    key={campaign.id} 
                    className="hover:bg-[#0f111a] transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(campaign.id)}
                        className="w-3.5 h-3.5 rounded bg-[#12141e] border-[#2b2e40] text-[#0080FF] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* NAME */}
                    <td className="px-4 py-3.5">
                      <Link 
                        to={`/campaigns/${campaign.id}/editor`} 
                        className="font-bold text-white hover:text-[#0080FF] transition-colors text-xs"
                      >
                        {campaign.name}
                      </Link>
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Send className="w-3 h-3 text-slate-400 rotate-[-20deg]" />
                        <span>Cold Outre...</span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        campaign.status === 'Running' || campaign.status === 'ACTIVE'
                          ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                          : campaign.status === 'Paused' || campaign.status === 'PAUSED'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[#181a26] text-slate-400 border border-[#242738]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          campaign.status === 'Running' || campaign.status === 'ACTIVE'
                            ? 'bg-[#10B981]'
                            : campaign.status === 'Paused' || campaign.status === 'PAUSED'
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`} />
                        <span>{campaign.status}</span>
                      </span>
                    </td>

                    {/* TAGS */}
                    <td className="px-4 py-3.5 text-slate-500">-</td>

                    {/* PROGRESS */}
                    <td className="px-4 py-3.5 text-slate-500">-</td>

                    {/* ACTIVITY */}
                    <td className="px-4 py-3.5 text-slate-300 font-medium">
                      Sent <span className="text-white font-bold">{campaign.sent ?? 0}</span>
                    </td>

                    {/* OUTCOME */}
                    <td className="px-4 py-3.5 text-slate-300 font-medium">
                      Opportunities <span className="text-white font-bold">{campaign.replies ?? 0}</span>
                    </td>

                    {/* GOAL */}
                    <td className="px-4 py-3.5 text-slate-500">-</td>

                    {/* Actions Menu */}
                    <td className="px-4 py-3.5 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (dropdownAnchor?.id === campaign.id) {
                            setDropdownAnchor(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownAnchor({ id: campaign.id, rect });
                          }
                        }}
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-[#181b28] transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {filteredCampaigns.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#0f1118] border border-[#202334] flex items-center justify-center mb-3 text-[#0080FF]">
                        <Send className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-white">No campaigns found</p>
                      <p className="text-xs text-slate-400 mt-1 mb-5">
                        Create your first outreach campaign to start sending automated sequences.
                      </p>
                      <button 
                        onClick={() => navigate('/campaigns/new')}
                        className="px-4 py-2 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#0080FF]/30 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Campaign</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown Menu Portal */}
      {dropdownAnchor && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownAnchor(null)} />
          <div 
            style={{
              position: 'fixed',
              top: `${dropdownAnchor.rect.bottom + 4}px`,
              left: `${Math.min(window.innerWidth - 180, dropdownAnchor.rect.right - 170)}px`,
            }}
            className="w-44 bg-[#12141e] border border-[#242738] rounded-xl shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 text-slate-300"
          >
            <button
              onClick={() => {
                navigate(`/campaigns/${dropdownAnchor.id}/editor`);
                setDropdownAnchor(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#1a1d2c] hover:text-white flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Sequence</span>
            </button>
            <button
              onClick={() => {
                const target = campaigns.find(c => c.id === dropdownAnchor.id);
                if (target) {
                  toggleCampaignStatus(target.id, target.status === 'Running' ? 'Paused' : 'Running');
                }
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#1a1d2c] hover:text-white flex items-center gap-2"
            >
              {campaigns.find(c => c.id === dropdownAnchor.id)?.status === 'Running' ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                const target = campaigns.find(c => c.id === dropdownAnchor.id);
                if (target) duplicateCampaign(target);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#1a1d2c] hover:text-white flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplicate</span>
            </button>
            <div className="border-t border-[#202334] my-1" />
            <button
              onClick={() => deleteCampaign(dropdownAnchor.id)}
              className="w-full text-left px-3 py-2 text-[#FF7171] hover:bg-[#FF7171]/10 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#FF7171]" />
              <span>Delete Campaign</span>
            </button>
          </div>
        </>
      )}

    </div>
  );
}
