import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Mail, User, Building, Send, Pause, 
  Check, ChevronDown, ShieldCheck, 
  MessageSquare, RefreshCw
} from 'lucide-react';
import { useParams } from 'react-router-dom';

interface Message {
  sender: string;
  time: string;
  body: string;
}

interface Thread {
  id: string | number;
  prospectId?: string;
  campaignId?: string;
  campaignName?: string;
  name: string;
  email: string;
  company: string;
  title?: string;
  time: string;
  subject: string;
  snippet: string;
  tag: string;
  unread: boolean;
  step?: string;
  status?: string;
  history: Message[];
}

export default function UnifiedInbox() {
  const { id: routeCampaignId } = useParams<{ id: string }>();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | number | null>(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [campaignsList, setCampaignsList] = useState<{ id: string; name: string }[]>([]);
  const [campaignFilter, setCampaignFilter] = useState(
    routeCampaignId ? routeCampaignId : 'all'
  );
  
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [threadStatus, setThreadStatus] = useState<Record<string, string>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLeadDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch campaigns for dropdown filter
  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setCampaignsList(data.map((c: any) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch responses from backend
  const fetchInboxThreads = async () => {
    setIsLoading(true);
    try {
      const activeCampaign = routeCampaignId || (campaignFilter !== 'all' ? campaignFilter : '');
      const endpoint = activeCampaign 
        ? `/api/campaigns/${activeCampaign}/inbox?filter=${filter}&search=${encodeURIComponent(searchQuery)}`
        : `/api/inbox?filter=${filter}&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.threads)) {
          setThreads(data.threads);
          if (data.threads.length > 0) {
            setActiveThreadId(prev => {
              const exists = data.threads.find((t: Thread) => t.id === prev);
              return exists ? prev : data.threads[0].id;
            });
          } else {
            setActiveThreadId(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch inbox threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInboxThreads();
  }, [routeCampaignId, campaignFilter, filter, searchQuery]);

  const activeThread = threads.find(t => t.id === activeThreadId) || (threads.length > 0 ? threads[0] : null);

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    setIsSendingReply(true);
    
    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          threadId: activeThread.id,
          message: replyText.trim(),
        })
      });

      const newMessage: Message = {
        sender: 'You',
        time: 'Just now',
        body: replyText.trim()
      };
      
      setThreads(prev => prev.map(t => {
        if (t.id === activeThread.id) {
          return {
            ...t,
            history: [...t.history, newMessage]
          };
        }
        return t;
      }));
      setReplyText('');
    } catch (e) {
      console.error('Failed to dispatch reply:', e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleMarkLeadStatus = async (opt: string) => {
    if (!activeThread) return;
    const threadKey = String(activeThread.id);
    setThreadStatus(prev => ({ ...prev, [threadKey]: opt }));
    setShowLeadDropdown(false);

    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_lead',
          prospectId: activeThread.prospectId || activeThread.id,
          status: opt,
        })
      });
    } catch (e) {
      console.error('Failed to mark lead status:', e);
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Positive':
      case 'Meeting':
        return 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-bold';
      case 'Interested':
      case 'Warm':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold';
      case 'Question':
        return 'bg-[#0080FF]/15 text-[#0080FF] border border-[#0080FF]/30 font-bold';
      case 'Bounced':
        return 'bg-[#FF7171]/20 text-[#FF7171] border border-[#FF7171]/40 font-bold';
      default:
        return 'bg-[#141724] text-slate-300 border border-[#222538] font-medium';
    }
  };

  return (
    <div className="flex h-full w-full bg-black text-slate-100 overflow-hidden relative select-none">

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#0f1118] border border-[#222536] text-slate-100 rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white mb-1.5">Schedule Follow-up</h3>
            <p className="text-xs text-slate-400 mb-5">Queue automated follow-up dispatch for this prospect at the scheduled time.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Date</label>
                <Input 
                  type="date" 
                  value={scheduleDate} 
                  onChange={(e) => setScheduleDate(e.target.value)} 
                  className="h-10 bg-[#12141e] border-[#25283a] text-white focus:border-[#0080FF]" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Time</label>
                <Input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={(e) => setScheduleTime(e.target.value)} 
                  className="h-10 bg-[#12141e] border-[#25283a] text-white focus:border-[#0080FF]" 
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowScheduleModal(false)} 
                className="bg-[#12141e] border-[#25283a] text-slate-300 hover:text-white hover:bg-[#1a1d2c] text-xs h-9"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (activeThread) {
                    setThreadStatus(prev => ({ ...prev, [String(activeThread.id)]: `Scheduled (${scheduleDate} ${scheduleTime})` }));
                  }
                  setShowScheduleModal(false);
                  setScheduleDate('');
                  setScheduleTime('');
                }} 
                disabled={!scheduleDate || !scheduleTime}
                className="bg-[#0080FF] hover:bg-[#0070E0] text-white font-bold text-xs h-9 px-4 cursor-pointer"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Left Pane: Inbox Threads List */}
      <div className="w-[340px] lg:w-[360px] flex-shrink-0 border-r border-[#1a1d2e] flex flex-col bg-[#08090f] z-10">
        
        {/* Top Header: Height 56px matching middle pane exactly */}
        <div className="h-14 border-b border-[#1a1d2e] px-4 flex items-center justify-between bg-[#0a0c14] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              {routeCampaignId ? 'Campaign Responses' : 'Inbox'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0080FF]/15 text-[#0080FF] border border-[#0080FF]/30">
              {threads.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Global campaign dropdown selector if not pinned to a single campaign */}
            {!routeCampaignId && (
              <select 
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="text-xs border border-[#222538] rounded-lg px-2 py-1 bg-[#12141e] text-slate-200 focus:outline-none focus:border-[#0080FF] font-medium max-w-[140px] truncate"
              >
                <option value="all">All Campaigns</option>
                {campaignsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <button 
              onClick={fetchInboxThreads}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151724] transition-colors cursor-pointer"
              title="Refresh responses"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar: Search and Filters */}
        <div className="p-3 border-b border-[#1a1d2e] space-y-2.5 bg-[#08090f]">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search leads, responses, companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-8 text-xs bg-[#10121a] border border-[#1e2232] text-white placeholder-slate-500 focus:outline-none focus:border-[#0080FF] rounded-lg transition-colors" 
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {['All', 'Replied', 'Unread', 'Bounced'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filter === f 
                    ? 'bg-[#0080FF] text-white font-bold' 
                    : 'bg-[#10121a] text-slate-400 hover:text-white hover:bg-[#151724] border border-[#1e2232]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Threads List Scroll View */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#141622]">
          {isLoading && threads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-[#0080FF] mb-3" />
              <p className="text-xs text-slate-400">Loading campaign responses...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 rounded-xl bg-[#12141e] border border-[#222538] flex items-center justify-center mb-3 text-[#0080FF]">
                <Mail className="w-5 h-5" />
              </div>
              <p className="font-bold text-white text-xs">No responses yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                When prospects reply to your outreach emails, their conversations will stream into this inbox in real time.
              </p>
            </div>
          ) : (
            threads.map(thread => {
              const isSelected = activeThreadId === thread.id;
              return (
                <div 
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`p-3.5 cursor-pointer transition-colors relative border-l-2 ${
                    isSelected 
                      ? 'bg-[#10131d] border-l-[#0080FF]' 
                      : 'border-l-transparent hover:bg-[#0c0e16]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {thread.name}
                      </span>
                      {thread.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0080FF] shadow-[0_0_6px_rgba(0,128,255,0.8)] flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {thread.time}
                    </span>
                  </div>
                  
                  <p className="text-[11px] font-medium text-slate-300 truncate mb-1">
                    {thread.subject}
                  </p>
                  
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {thread.snippet}
                  </p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${getTagColor(thread.tag)}`}>
                      {thread.tag}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {thread.company}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Center Pane: Thread Detail & Conversation Composer */}
      {activeThread ? (
        <>
          <div className="flex-1 flex flex-col min-w-0 bg-[#07080e] z-10">
            
            {/* Thread Header Toolbar: Exactly 56px matching left and right pane */}
            <div className="h-14 border-b border-[#1a1d2e] px-6 flex items-center justify-between flex-shrink-0 bg-[#0a0c14]">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-xs font-bold text-white truncate tracking-tight">
                  {activeThread.subject}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider flex-shrink-0 ${getTagColor(activeThread.tag)}`}>
                  {activeThread.tag}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mark Lead Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-[#10121a] border-[#222538] text-slate-200 hover:text-white hover:bg-[#161824] text-xs h-8 px-3 font-semibold cursor-pointer"
                    onClick={() => setShowLeadDropdown(!showLeadDropdown)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> 
                    {threadStatus[String(activeThread.id)] || 'Mark Lead'} 
                    <ChevronDown className="w-3 h-3 ml-1.5 text-slate-400" />
                  </Button>

                  {showLeadDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#12141e] border border-[#25283a] shadow-2xl rounded-xl z-50 py-1 overflow-hidden animate-in fade-in text-xs">
                      {['Lead', 'Warm', 'Cold', 'DNC', 'Invalid Contact', 'Schedule'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => {
                            if (opt === 'Schedule') {
                              setShowScheduleModal(true);
                              setShowLeadDropdown(false);
                            } else {
                              handleMarkLeadStatus(opt);
                            }
                          }}
                          className="w-full text-left px-3.5 py-2 text-slate-300 hover:bg-[#1a1d2c] hover:text-white transition-colors cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pause Sequence Action */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-[#10121a] border-[#222538] text-slate-200 hover:text-white hover:bg-[#161824] text-xs h-8 px-3 cursor-pointer"
                  onClick={() => handleMarkLeadStatus('Paused')}
                >
                  <Pause className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> 
                  Pause Sequence
                </Button>
              </div>
            </div>

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeThread.history.map((msg, index) => {
                const isMe = msg.sender.toLowerCase().includes('you') || msg.sender.toLowerCase().includes('me');
                return (
                  <div 
                    key={index} 
                    className={`flex gap-3 max-w-3xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isMe 
                        ? 'bg-[#0080FF] text-white shadow-md shadow-[#0080FF]/25' 
                        : 'bg-[#12141e] border border-[#222538] text-slate-300'
                    }`}>
                      {isMe ? 'ME' : (msg.sender.charAt(0).toUpperCase() || 'P')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-xs font-bold text-white">
                          {msg.sender}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {msg.time}
                        </span>
                      </div>
                      
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                        isMe 
                          ? 'bg-[#10131d] border border-[#1e2336] text-slate-200 rounded-tr-none' 
                          : 'bg-[#0f1118] border border-[#1e2232] text-slate-200 rounded-tl-none'
                      }`}>
                        <div className="whitespace-pre-wrap">
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pinned Quick Reply Composer Box */}
            <div className="p-4 bg-[#08090f] border-t border-[#1a1d2e] flex-shrink-0">
              <div className="flex gap-3 max-w-4xl">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#0080FF] text-white font-bold text-xs shadow-md shadow-[#0080FF]/25">
                  ME
                </div>
                <div className="flex-1 border border-[#1e2232] rounded-2xl shadow-2xl bg-[#0c0e16] focus-within:border-[#0080FF] overflow-hidden transition-all">
                  <textarea 
                    className="w-full min-h-[90px] p-3.5 text-xs text-slate-100 focus:outline-none resize-y bg-transparent placeholder-slate-500 leading-relaxed font-sans"
                    placeholder={`Reply directly to ${activeThread.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="bg-[#090b10] px-4 py-2 border-t border-[#181a26] flex justify-between items-center">
                    <div className="text-[11px] text-slate-400">
                      Sending via rotating connected mailbox
                    </div>
                    <Button 
                      size="sm" 
                      className={`h-7 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        replyText 
                          ? 'bg-[#0080FF] hover:bg-[#0070E0] text-white shadow-md shadow-[#0080FF]/25' 
                          : 'bg-[#141724] text-slate-500 cursor-not-allowed'
                      }`} 
                      disabled={!replyText || isSendingReply} 
                      onClick={handleSendReply}
                    >
                      <Send className={`w-3 h-3 mr-1.5 ${isSendingReply ? 'animate-spin' : ''}`} /> 
                      {isSendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Context Panel (CRM & Campaign Context) */}
          <div className="w-72 xl:w-80 border-l border-[#1a1d2e] bg-[#08090f] hidden xl:flex flex-col flex-shrink-0 z-10">
            
            {/* Right Top Header: Height 56px matching left and center pane exactly */}
            <div className="h-14 border-b border-[#1a1d2e] px-5 flex items-center justify-between bg-[#0a0c14] flex-shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#0080FF]" />
                <span className="text-xs font-semibold text-slate-200">
                  Prospect Details
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Lead Info</span>
            </div>

            {/* Right Content Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Lead Details */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Prospect Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#12141e] border border-[#222538] flex items-center justify-center text-[#0080FF]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{activeThread.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{activeThread.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#12141e] border border-[#222538] flex items-center justify-center text-emerald-400">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{activeThread.company}</p>
                      <p className="text-[11px] text-slate-400 truncate">{activeThread.title || 'Managing Director'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Context */}
              <div className="pt-4 border-t border-[#181a26]">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Campaign Info</h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Campaign</span>
                    <p className="font-semibold text-slate-200 mt-0.5 truncate">
                      {activeThread.campaignName || 'Product Hunt Beta Launch Sequence'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Sequence Step</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {activeThread.step || 'Step 1'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Engagement Status</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getTagColor(activeThread.tag)}`}>
                      {activeThread.tag}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deliverability Badge */}
              <div className="pt-4 border-t border-[#181a26]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Deliverability Verified</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Inbound response processed and sequence paused automatically.
                </p>
              </div>

            </div>

          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 bg-[#07080e]">
          <div className="w-12 h-12 rounded-2xl bg-[#10121a] border border-[#1e2232] flex items-center justify-center mb-3 text-slate-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">Select a conversation to view response</p>
          <p className="text-xs text-slate-500 mt-1">Choose a responded prospect from the left to read their message and send replies.</p>
        </div>
      )}

    </div>
  );
}
