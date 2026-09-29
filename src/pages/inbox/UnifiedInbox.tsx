import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, User, Building, Send, MoreVertical, Pause, Check, Archive, ChevronDown } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface Message {
  sender: string;
  time: string;
  body: string;
}

interface Thread {
  id: number;
  name: string;
  email: string;
  company: string;
  time: string;
  subject: string;
  snippet: string;
  tag: string;
  unread: boolean;
  history: Message[];
}

const initialMockThreads: Thread[] = [
  {
    id: 1,
    name: 'Sarah Connor',
    email: 'sarah@skynet.com',
    company: 'Cyberdyne Systems',
    time: '10:42 AM',
    subject: 'Re: Q4 Enterprise Outreach',
    snippet: 'Hi, I am interested in learning more about your platform.',
    tag: 'Positive',
    unread: true,
    history: [
      { sender: 'You', time: 'Oct 24, 9:00 AM', body: 'Hi Sarah,\n\nI noticed Cyberdyne is scaling its operations...' },
      { sender: 'Sarah Connor', time: '10:42 AM', body: 'Hi, I am interested in learning more about your platform. Can we jump on a call?' }
    ]
  },
  {
    id: 2,
    name: 'John Smith',
    email: 'john@example.com',
    company: 'Acme Corp',
    time: 'Yesterday',
    subject: 'Out of Office',
    snippet: 'I am currently out of the office until next week.',
    tag: 'Bounced',
    unread: false,
    history: [
      { sender: 'You', time: 'Oct 23, 2:00 PM', body: 'Hi John,\n\nChecking in on our previous conversation...' },
      { sender: 'System', time: 'Oct 23, 2:05 PM', body: 'Delivery Status Notification (Failure): I am currently out of the office until next week.' }
    ]
  }
];

const mockCampaigns = ['All Campaigns', 'Q4 Enterprise Outreach', 'Startup Founders', 'Webinar Follow-ups'];

export default function UnifiedInbox() {
  const { id: routeCampaignId } = useParams<{ id: string }>();
  const [threads, setThreads] = useState<Thread[]>(initialMockThreads);
  const [activeThreadId, setActiveThreadId] = useState(1);
  const [filter, setFilter] = useState('All');
  
  // If routeCampaignId exists, we are in a campaign view, so fix the filter. Otherwise use dropdown state.
  const [campaignFilter, setCampaignFilter] = useState(
    routeCampaignId ? 'Q4 Enterprise Outreach' : 'All Campaigns'
  );
  
  const [replyText, setReplyText] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [threadStatus, setThreadStatus] = useState<Record<number, string>>({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLeadDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Normally filter threads based on campaignFilter, here just mock
  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendReply = () => {
    if (!replyText || !activeThread) return;
    const newMessage: Message = {
      sender: 'You',
      time: 'Just now',
      body: replyText
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
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Positive': return 'bg-green-100 text-green-700';
      case 'Not Interested': return 'bg-red-100 text-red-700';
      case 'Question': return 'bg-blue-100 text-blue-700';
      case 'Bounced': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-[#f8f9fc] overflow-hidden animate-in fade-in duration-500 border-t border-gray-200 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-white w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule Follow-up</h3>
            <p className="text-sm text-gray-500 mb-6">The next follow-up email will be queued and sent at the specified date and time.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Date</label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-11 bg-gray-50 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Time</label>
                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-11 bg-gray-50 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="mt-8 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="rounded-xl border-gray-200 hover:bg-gray-50">Cancel</Button>
              <Button 
                onClick={() => {
                  setThreadStatus(prev => ({ ...prev, [activeThread!.id]: `Scheduled (${scheduleDate} ${scheduleTime})` }));
                  setShowScheduleModal(false);
                  setScheduleDate('');
                  setScheduleTime('');
                }} 
                disabled={!scheduleDate || !scheduleTime}
                className="bg-primary hover:bg-primary/90 rounded-xl px-6"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Left Pane: Inbox List */}
      <div className="w-[420px] flex-shrink-0 border-r border-gray-200/60 flex flex-col bg-white/60 backdrop-blur-xl z-10">
        <div className="p-5 border-b border-gray-200/60 space-y-5 bg-white/40">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Inbox</h1>
            {!routeCampaignId && (
              <select 
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              >
                {mockCampaigns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search emails, leads, or companies..." className="pl-10 h-11 bg-gray-50/80 border-gray-200/80 focus:bg-white rounded-xl transition-all shadow-sm" />
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {['All', 'Unread', 'Replied', 'Bounced'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  filter === f ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.map(thread => (
            <div 
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`p-5 border-b border-gray-100 cursor-pointer transition-all duration-300 relative group ${
                activeThreadId === thread.id ? 'bg-white shadow-[0_0_20px_rgba(0,0,0,0.03)] z-10' : 'hover:bg-white/80'
              }`}
            >
              {activeThreadId === thread.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-md"></div>
              )}
              
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`font-bold text-[15px] tracking-tight transition-colors ${thread.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {thread.name}
                  </span>
                  {thread.unread && <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                </div>
                <span className={`text-xs whitespace-nowrap font-medium ${activeThreadId === thread.id ? 'text-blue-600' : 'text-gray-400'}`}>{thread.time}</span>
              </div>
              
              <p className={`text-xs mb-2 truncate ${thread.unread ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {thread.subject}
              </p>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {thread.snippet}
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getTagColor(thread.tag)}`}>
                  {thread.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Thread Detail */}
      {activeThread ? (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent z-10">
          {/* Thread Header Toolbar */}
          <div className="h-[76px] border-b border-gray-200/60 px-8 flex items-center justify-between flex-shrink-0 bg-white/70 backdrop-blur-xl shadow-sm z-20">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900 truncate tracking-tight">{activeThread.subject}</h2>
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm border border-transparent ${getTagColor(activeThread.tag)}`}>
                {activeThread.tag}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-gray-700 font-semibold h-10 px-4 rounded-xl border-gray-200 hover:bg-gray-50 shadow-sm transition-all hover:-translate-y-0.5">
                <Pause className="w-4 h-4 mr-2 text-amber-500" /> Pause Sequence
              </Button>
              
              <div className="relative" ref={dropdownRef}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-700 font-semibold h-10 px-4 rounded-xl border-gray-200 hover:bg-gray-50 shadow-sm transition-all hover:-translate-y-0.5"
                  onClick={() => setShowLeadDropdown(!showLeadDropdown)}
                >
                  <Check className="w-4 h-4 mr-2 text-green-500" /> Mark Lead <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
                </Button>
                {showLeadDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-xl z-50 py-2 overflow-hidden animate-in slide-in-from-top-2">
                    {['Lead', 'Warm', 'Cold', 'DNC', 'Invalid Contact', 'Schedule'].map(opt => (
                      <button 
                        key={opt} 
                        className="block w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => {
                          if (opt === 'Schedule') {
                            setShowScheduleModal(true);
                          } else {
                            setThreadStatus(prev => ({ ...prev, [activeThread.id]: `Paused (${opt})` }));
                          }
                          setShowLeadDropdown(false);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              
              <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                <Archive className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Thread History */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth relative">
              {activeThread.history.map((msg: Message, i: number) => (
                <div key={i} className={`flex gap-4 animate-in slide-in-from-bottom-2 fade-in duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`w-11 h-11 rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0 text-white font-bold text-sm bg-gradient-to-br ${msg.sender === 'You' ? 'from-blue-600 to-indigo-600 ring-2 ring-indigo-200' : 'from-slate-700 to-slate-900'}`}>
                    {msg.sender === 'You' ? 'ME' : msg.sender.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 max-w-3xl">
                    <Card className="shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-gray-100 rounded-2xl overflow-hidden group hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-shadow">
                      <CardHeader className={`px-5 py-3.5 border-b flex flex-row items-center justify-between space-y-0 ${msg.sender === 'You' ? 'bg-indigo-50/50 border-indigo-100/50' : 'bg-gray-50/50 border-gray-100'}`}>
                        <div>
                          <span className="font-bold text-gray-900 text-[15px]">{msg.sender}</span>
                          {msg.sender !== 'You' && (
                            <span className="text-gray-500 text-xs ml-2 font-medium">&lt;{activeThread.email}&gt;</span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-500 transition-colors">{msg.time}</span>
                      </CardHeader>
                      <CardContent className="p-6 text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed bg-white">
                        {msg.body}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
              
              {/* Quick Reply Box */}
              <div className="flex gap-4 pt-6 pb-4 sticky bottom-0">
                 <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-sm ring-2 ring-indigo-200">
                    ME
                  </div>
                  <div className="flex-1 border border-gray-200/80 rounded-2xl shadow-xl shadow-gray-200/40 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 overflow-hidden transition-all bg-white/80 backdrop-blur-xl max-w-3xl">
                    <textarea 
                      className="w-full min-h-[140px] p-5 text-[15px] text-gray-800 focus:outline-none resize-y bg-transparent placeholder-gray-400"
                      placeholder={`Draft a reply to ${activeThread.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="bg-gray-50/80 px-5 py-3.5 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-9 text-gray-600 font-medium hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          Template
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 text-gray-600 font-medium hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                          Variables
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        className={`h-10 px-6 rounded-xl font-bold shadow-sm transition-all ${replyText ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/30' : 'bg-gray-100 text-gray-400'}`} 
                        disabled={!replyText} 
                        onClick={handleSendReply}
                      >
                        <Send className={`w-4 h-4 mr-2 ${replyText ? 'animate-pulse' : ''}`} /> Send Reply
                      </Button>
                    </div>
                  </div>
              </div>
            </div>

            {/* Right Context Panel (CRM Data) */}
            <div className="w-72 border-l border-gray-200 bg-gray-50/50 p-6 hidden lg:block overflow-y-auto">
              <div className="space-y-6">
                
                {/* Contact Info */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Info</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activeThread.name}</p>
                        <p className="text-xs text-gray-500 truncate">{activeThread.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activeThread.company}</p>
                        <p className="text-xs text-gray-500 truncate">Software Development</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaign Context */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Campaign Context</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Source Campaign</p>
                      <p className="text-sm font-medium text-gray-900 truncate hover:text-primary cursor-pointer transition-colors">
                        {campaignFilter === 'All Campaigns' ? 'Q4 Enterprise Outreach' : campaignFilter}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Step</p>
                      <p className="text-sm font-medium text-gray-900">Step 2: Follow-up</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        threadStatus[activeThread.id]?.startsWith('Scheduled') 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {threadStatus[activeThread.id] || 'Paused (Replied)'}
                      </span>
                      {threadStatus[activeThread.id] && !threadStatus[activeThread.id].startsWith('Scheduled') && (
                        <p className="text-[10px] text-red-500 mt-2 font-medium">Follow-up emails stopped.</p>
                      )}
                      {threadStatus[activeThread.id]?.startsWith('Scheduled') && (
                        <p className="text-[10px] text-green-600 mt-2 font-medium">Follow-up will resume.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 flex-col">
          <Mail className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg">Select a conversation to view.</p>
        </div>
      )}
    </div>
  );
}
