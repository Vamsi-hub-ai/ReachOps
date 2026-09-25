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
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-white overflow-hidden animate-in fade-in duration-500 border-t border-gray-200">
      
      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule Follow-up</h3>
            <p className="text-sm text-gray-500 mb-4">The next follow-up email will be queued and sent at the specified date and time.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date</label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Time</label>
                <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                  setThreadStatus(prev => ({ ...prev, [activeThread!.id]: `Scheduled (${scheduleDate} ${scheduleTime})` }));
                  setShowScheduleModal(false);
                  setScheduleDate('');
                  setScheduleTime('');
                }} 
                disabled={!scheduleDate || !scheduleTime}
                className="bg-primary hover:bg-primary/90"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Left Pane: Inbox List */}
      <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/30">
        <div className="p-4 border-b border-gray-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
            {!routeCampaignId && (
              <select 
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {mockCampaigns.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search emails..." className="pl-9 bg-gray-50 border-gray-200" />
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {['All', 'Unread', 'Replied', 'Bounced'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors relative ${
                activeThreadId === thread.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'
              }`}
            >
              {activeThreadId === thread.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              )}
              
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${thread.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                    {thread.name}
                  </span>
                  {thread.unread && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{thread.time}</span>
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
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Thread Header Toolbar */}
          <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0 bg-white shadow-sm z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 truncate">{activeThread.subject}</h2>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${getTagColor(activeThread.tag)}`}>
                {activeThread.tag}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-gray-600 h-9">
                <Pause className="w-4 h-4 mr-2 text-amber-500" /> Pause Sequence
              </Button>
              
              <div className="relative" ref={dropdownRef}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-gray-600 h-9"
                  onClick={() => setShowLeadDropdown(!showLeadDropdown)}
                >
                  <Check className="w-4 h-4 mr-2 text-green-500" /> Mark Lead <ChevronDown className="w-3 h-3 ml-2 text-gray-400" />
                </Button>
                {showLeadDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-50 py-1">
                    {['Lead', 'Warm', 'Cold', 'DNC', 'Invalid Contact', 'Schedule'].map(opt => (
                      <button 
                        key={opt} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
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

              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
                <Archive className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Thread History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeThread.history.map((msg: Message, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${msg.sender === 'You' ? 'bg-primary' : 'bg-slate-700'}`}>
                    {msg.sender === 'You' ? 'ME' : msg.sender.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Card className="shadow-none border-gray-200">
                      <CardHeader className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <span className="font-semibold text-gray-900 text-sm">{msg.sender}</span>
                          {msg.sender !== 'You' && (
                            <span className="text-gray-500 text-xs ml-2">&lt;{activeThread.email}&gt;</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </CardHeader>
                      <CardContent className="p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
              
              {/* Quick Reply Box */}
              <div className="flex gap-4 pt-4">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-white font-bold text-sm">
                    ME
                  </div>
                  <div className="flex-1 border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary overflow-hidden transition-all">
                    <textarea 
                      className="w-full min-h-[120px] p-4 text-sm text-gray-700 focus:outline-none resize-y"
                      placeholder={`Reply to ${activeThread.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-gray-500">
                          Template
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-gray-500">
                          Variables
                        </Button>
                      </div>
                      <Button size="sm" className="h-8" disabled={!replyText} onClick={handleSendReply}>
                        <Send className="w-3.5 h-3.5 mr-2" /> Send Reply
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
