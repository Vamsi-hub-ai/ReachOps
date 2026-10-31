import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Mail, User, Building, Send, Pause, Play,
  Check, ChevronDown, ShieldCheck, 
  MessageSquare, RefreshCw, Flame, Snowflake, Ban, AlertCircle, Calendar, Sparkles
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import ScheduleFollowUpModal from '@/components/ScheduleFollowUpModal';

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkLeadStatus = async (opt: string) => {
    if (!activeThread) return;
    const threadKey = String(activeThread.id);
    setThreadStatus(prev => ({ ...prev, [threadKey]: opt }));
    setShowLeadDropdown(false);

    const isStopTag = ['Lead', 'Warm', 'Cold', 'DNC', 'Invalid Contact', 'Paused'].includes(opt);

    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_lead',
          prospectId: activeThread.prospectId || activeThread.id,
          status: opt,
          stopSequence: isStopTag,
        })
      });
      if (isStopTag) {
        showToast(`Tag '${opt}' applied. Automated follow-up sequence stopped.`);
      } else {
        showToast(`Lead status updated to '${opt}'.`);
      }
    } catch (e) {
      console.error('Failed to mark lead status:', e);
    }
  };

  const handleScheduleFollowUp = async (dateStr: string, timeStr: string, formattedLabel: string) => {
    if (!activeThread) return;
    const threadKey = String(activeThread.id);
    const statusLabel = `Scheduled (${formattedLabel})`;
    setThreadStatus(prev => ({ ...prev, [threadKey]: statusLabel }));

    try {
      await fetch('/api/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_follow_up',
          prospectId: activeThread.prospectId || activeThread.id,
          scheduledDate: dateStr,
          scheduledTime: timeStr,
          formattedLabel: formattedLabel,
        })
      });
      showToast(`Follow-up locked: Next email will send on ${formattedLabel}.`);
    } catch (e) {
      console.error('Failed to schedule follow-up:', e);
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
    <div className="flex h-full w-full bg-[#06110c] bg-reachops-cosmic text-slate-100 overflow-hidden relative select-none">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 bg-[#171717]/95 border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Redesigned Custom Cosmic Glassmorphic Schedule Follow-up Modal */}
      <ScheduleFollowUpModal 
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        prospectName={activeThread?.name || 'this prospect'}
        initialDate={scheduleDate}
        initialTime={scheduleTime}
        onConfirm={(dateStr, timeStr, formattedLabel) => {
          if (activeThread) {
            handleScheduleFollowUp(dateStr, timeStr, formattedLabel);
          }
          setShowScheduleModal(false);
          setScheduleDate('');
          setScheduleTime('');
        }}
      />

      {/* Left Pane: Inbox Threads List */}
      <div className="w-[340px] lg:w-[360px] flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-[#171717]/95 backdrop-blur-2xl z-10">
        
        {/* Top Header: Height 56px matching middle pane exactly */}
        <div className="h-14 border-b border-white/[0.08] px-4 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100">
              {routeCampaignId ? 'Campaign Responses' : 'Inbox'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              {threads.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Global campaign dropdown selector if not pinned to a single campaign */}
            {!routeCampaignId && (
              <select 
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="text-xs border border-white/[0.09] rounded-xl px-2.5 py-1 bg-white/[0.04] text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold max-w-[140px] truncate"
              >
                <option value="all" className="bg-[#171717] text-white">All Campaigns</option>
                {campaignsList.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#171717] text-white">{c.name}</option>
                ))}
              </select>
            )}

            <button 
              onClick={fetchInboxThreads}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Refresh responses"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar: Search and Filters */}
        <div className="p-3 border-b border-white/[0.08] space-y-2.5 bg-white/[0.01]">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search leads, responses, companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-8 text-xs bg-white/[0.04] border border-white/[0.09] text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 rounded-xl transition-all shadow-inner" 
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {['All', 'Replied', 'Unread', 'Bounced'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filter === f 
                    ? 'bg-[#a31c1b] text-white font-bold shadow-[0_0_12px_rgba(163,28,27,0.6)]' 
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Threads List Scroll View */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
          {isLoading && threads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mb-3" />
              <p className="text-xs text-slate-400">Loading campaign responses...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.09] flex items-center justify-center mb-3 text-emerald-400 shadow-lg shadow-emerald-500/20">
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
                      ? 'bg-white/[0.06] border-l-emerald-400' 
                      : 'border-l-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {thread.name}
                      </span>
                      {thread.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a31c1b] shadow-[0_0_6px_#a31c1b] flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
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
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold ${getTagColor(thread.tag)}`}>
                      {thread.tag}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
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
          <div className="flex-1 flex flex-col min-w-0 bg-[#171717]/90 backdrop-blur-xl z-10">
            
            {/* Thread Header Toolbar: Exactly 56px matching left and right pane */}
            <div className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <h2 className="text-xs font-bold text-white truncate tracking-tight">
                  {activeThread.subject}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold flex-shrink-0 ${getTagColor(activeThread.tag)}`}>
                  {activeThread.tag}
                </span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                {/* Mark Lead Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                    onClick={() => setShowLeadDropdown(!showLeadDropdown)}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 
                    <span>{threadStatus[String(activeThread.id)] || 'Mark Lead'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLeadDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showLeadDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl rounded-2xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 text-xs">
                      {[
                        { label: 'Lead', desc: 'Qualified prospect', icon: Sparkles, color: 'text-emerald-400', bg: 'hover:bg-emerald-500/10' },
                        { label: 'Warm', desc: 'Interested in meeting', icon: Flame, color: 'text-amber-400', bg: 'hover:bg-amber-500/10' },
                        { label: 'Cold', desc: 'Not ready right now', icon: Snowflake, color: 'text-slate-300', bg: 'hover:bg-white/[0.06]' },
                        { label: 'DNC', desc: 'Do Not Contact', icon: Ban, color: 'text-[#ef4444]', bg: 'hover:bg-[#a31c1b]/15' },
                        { label: 'Invalid Contact', desc: 'Wrong address or person', icon: AlertCircle, color: 'text-amber-400', bg: 'hover:bg-amber-500/10' },
                        { label: 'Schedule', desc: 'Book a call on calendar', icon: Calendar, color: 'text-[#10b981]', bg: 'hover:bg-[#10b981]/15' },
                      ].map(item => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              if (item.label === 'Schedule') {
                                setShowScheduleModal(true);
                                setShowLeadDropdown(false);
                              } else {
                                handleMarkLeadStatus(item.label);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-slate-200 ${item.bg} hover:text-white transition-all flex items-center gap-2.5 cursor-pointer group`}
                          >
                            <div className={`w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 ${item.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-white leading-tight">{item.label}</span>
                              <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pause Sequence Action */}
                <button 
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer ${
                    threadStatus[String(activeThread.id)] === 'Paused'
                      ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-200 hover:text-white'
                  }`}
                  onClick={() => handleMarkLeadStatus(threadStatus[String(activeThread.id)] === 'Paused' ? 'Active' : 'Paused')}
                >
                  {threadStatus[String(activeThread.id)] === 'Paused' ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume Sequence</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause Sequence</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sequence Status Banners: Tag Stopped vs. Scheduled Follow-up */}
            {(() => {
              const currentTag = threadStatus[String(activeThread.id)] || '';
              const isStopTag = ['Lead', 'Warm', 'Cold', 'DNC', 'Invalid Contact'].includes(currentTag);
              const isScheduled = currentTag.startsWith('Scheduled');

              if (isStopTag) {
                return (
                  <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Pause className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white flex items-center gap-2">
                          <span>Automated Follow-up Stopped</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Sequence emails have been halted because this prospect was tagged as <strong className="text-amber-400">{currentTag}</strong>. Manual replies only.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 shrink-0">
                      Follow-up Halted
                    </span>
                  </div>
                );
              }

              if (isScheduled) {
                const dateText = currentTag.replace('Scheduled (', '').replace(')', '');
                return (
                  <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white flex items-center gap-2">
                          <span>Next Follow-up Scheduled</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Automated cadence is locked. Next email will dispatch on <strong className="text-emerald-400">{dateText}</strong>.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 shrink-0">
                      Dispatches on Date
                    </span>
                  </div>
                );
              }

              return null;
            })()}

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeThread.history.map((msg, index) => {
                const isMe = msg.sender.toLowerCase().includes('you') || msg.sender.toLowerCase().includes('me');
                return (
                  <div 
                    key={index} 
                    className={`flex gap-3.5 max-w-3xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isMe 
                        ? 'bg-gradient-to-tr from-[#059669] to-[#10b981] text-white shadow-md shadow-emerald-500/20' 
                        : 'bg-white/[0.06] border border-white/[0.09] text-slate-300'
                    }`}>
                      {isMe ? 'ME' : (msg.sender.charAt(0).toUpperCase() || 'P')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-xs font-bold text-white">
                          {msg.sender}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {msg.time}
                        </span>
                      </div>
                      
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans shadow-sm ${
                        isMe 
                          ? 'bg-[#10b981]/15 border border-[#10b981]/30 text-white rounded-tr-none' 
                          : 'glass-surface text-slate-200 rounded-tl-none'
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
            <div className="p-4 bg-white/[0.02] border-t border-white/[0.08] flex-shrink-0">
              <div className="flex gap-3 max-w-4xl">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-[#059669] to-[#10b981] text-white font-bold text-xs shadow-md shadow-emerald-500/20">
                  ME
                </div>
                <div className="flex-1 border border-white/[0.09] rounded-2xl shadow-2xl bg-white/[0.03] focus-within:border-emerald-500 overflow-hidden transition-all">
                  <textarea 
                    className="w-full min-h-[90px] p-3.5 text-xs text-slate-100 focus:outline-none resize-y bg-transparent placeholder-slate-500 leading-relaxed font-sans"
                    placeholder={`Reply directly to ${activeThread.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="bg-white/[0.02] px-4 py-2 border-t border-white/[0.06] flex justify-between items-center">
                    <div className="text-[11px] text-slate-400">
                      Sending via rotating connected mailbox
                    </div>
                    <Button 
                      size="sm" 
                      className={`h-8 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        replyText 
                          ? 'btn-reachops-primary shadow-md' 
                          : 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
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
          <div className="w-72 xl:w-80 border-l border-white/[0.08] bg-[#171717]/95 backdrop-blur-2xl hidden xl:flex flex-col flex-shrink-0 z-10">
            
            {/* Right Top Header: Height 56px matching left and center pane exactly */}
            <div className="h-14 border-b border-white/[0.08] px-5 flex items-center justify-between bg-white/[0.02] flex-shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Prospect Details
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Lead Info</span>
            </div>

            {/* Right Content Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Lead Details */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Prospect Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{activeThread.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{activeThread.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{activeThread.company}</p>
                      <p className="text-[11px] text-slate-400 truncate">{activeThread.title || 'Managing Director'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Context */}
              <div className="pt-4 border-t border-white/[0.06]">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Campaign Info</h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Campaign</span>
                    <p className="font-semibold text-slate-200 mt-0.5 truncate">
                      {activeThread.campaignName || 'Product Hunt Beta Launch Sequence'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Sequence Step</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {activeThread.step || 'Step 1'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Engagement Status</span>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getTagColor(activeThread.tag)}`}>
                      {activeThread.tag}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deliverability Badge */}
              <div className="pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Deliverability Verified</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Inbound response processed and sequence paused automatically.
                </p>
              </div>

            </div>

          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 bg-[#06110c] bg-reachops-cosmic">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.09] flex items-center justify-center mb-3 text-emerald-400 shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">Select a conversation to view response</p>
          <p className="text-xs text-slate-400 mt-1">Choose a responded prospect from the left to read their message and send replies.</p>
        </div>
      )}

      {/* Schedule Next Follow-up Modal */}
      {showScheduleModal && activeThread && (
        <ScheduleFollowUpModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onConfirm={(dateStr, timeStr, formattedLabel) => {
            handleScheduleFollowUp(dateStr, timeStr, formattedLabel);
            setShowScheduleModal(false);
          }}
          prospectName={activeThread.name}
          prospectEmail={activeThread.email}
          campaignName={activeThread.campaignName || 'Campaign Outreach'}
          isSuppressed={Boolean(activeThread.status === 'Unsubscribed' || activeThread.tag === 'Bounced')}
          suppressReason={activeThread.status === 'Unsubscribed' ? 'Prospect is unsubscribed.' : ''}
        />
      )}

    </div>
  );
}
