import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ChevronDown, ChevronUp, X, Calendar, Plus, 
  Save, CheckCircle2, Sliders, ShieldCheck, 
  Sparkles, Clock, Globe, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CampaignSettings() {
  const { id } = useParams<{ id: string }>();
  const campaignKey = id || 'tga-sales';

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Accordion expansion states matching Instantly.ai
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [crmOpen, setCrmOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  
  // Advanced sub-accordions
  const [basicDeliverabilityOpen, setBasicDeliverabilityOpen] = useState(true);
  const [sendingRulesOpen, setSendingRulesOpen] = useState(true);
  const [advDeliverabilityOpen, setAdvDeliverabilityOpen] = useState(true);
  const [ccBccOpen, setCcBccOpen] = useState(true);

  // 1. Accounts To Use state
  const [currentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u);
    } catch {}
    return null;
  });
  const isDemo = Boolean(currentUser?.isDemo || currentUser?.email === 'demo@reachops.com');

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // 2. Schedule & Limits state
  const [scheduleName, setScheduleName] = useState('Default Schedule');
  const [sendType, setSendType] = useState('At custom times');
  const [fromTime, setFromTime] = useState('9:30 AM');
  const [toTime, setToTime] = useState('4:00 PM');
  const [timezone, setTimezone] = useState('Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)');
  const [days, setDays] = useState({
    Sunday: false,
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false
  });
  const [startDate, setStartDate] = useState('2026-10-12');
  const [stopDate, setStopDate] = useState('');
  const [dailyLimit, setDailyLimit] = useState(90);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // 3. CRM & Tags state
  const [owner, setOwner] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const parsed = JSON.parse(u);
        return parsed.name || parsed.email || 'Demo User';
      }
    } catch {}
    return 'Demo User';
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 4A. Basic Deliverability state
  const [stopOnReply, setStopOnReply] = useState(true);
  const [openTracking, setOpenTracking] = useState(true);
  const [linkTracking, setLinkTracking] = useState(false);
  const [textOnlyAll, setTextOnlyAll] = useState(false);
  const [textOnlyFirst, setTextOnlyFirst] = useState(true);

  // 4B. Sending Rules state (Screenshots 1, 2, 3)
  const [minGapMinutes, setMinGapMinutes] = useState(9);
  const [randomAdditionalMinutes, setRandomAdditionalMinutes] = useState(5);
  const [maxNewLeadsPerDay, setMaxNewLeadsPerDay] = useState(15);
  const [prioritizeNewLeads, setPrioritizeNewLeads] = useState(false);
  const [winningMetric, setWinningMetric] = useState('Reply Rate');
  const [providerMatching, setProviderMatching] = useState(false);
  
  // ESP Routing
  const [espRules, setEspRules] = useState<{ id: string; provider: string; mailbox: string }[]>([]);
  const [showAddEspModal, setShowAddEspModal] = useState(false);
  const [selectedEspSender, setSelectedEspSender] = useState('Google Workspace');
  const [selectedEspRecipient, setSelectedEspRecipient] = useState('Google / Gmail');

  // Company stop, auto-reply, unsubscribe, risky emails
  const [companyReplyStop, setCompanyReplyStop] = useState(true);
  const [stopOnAutoReply, setStopOnAutoReply] = useState(false);
  const [unsubscribeLinkHeader, setUnsubscribeLinkHeader] = useState(false);
  const [enableRiskyEmails, setEnableRiskyEmails] = useState(false);
  const [disableBounceProtect, setDisableBounceProtect] = useState(false);

  // 4C. Advanced Deliverability state (Screenshot 4)
  const [overrideCampaignDeliverability, setOverrideCampaignDeliverability] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [domainLimitCount, setDomainLimitCount] = useState(5);
  const [domainDelayMins, setDomainDelayMins] = useState(45);

  // 4D. CC & BCC Recipients state (Screenshot 5)
  const [ccRecipients, setCcRecipients] = useState('');
  const [bccRecipients, setBccRecipients] = useState('');

  // Fetch campaign settings from backend on mount
  useEffect(() => {
    fetch(`/api/campaigns/${campaignKey}/settings`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        if (data.dailyLimit !== undefined) setDailyLimit(data.dailyLimit);
        if (data.minGapMinutes !== undefined) setMinGapMinutes(data.minGapMinutes);
        if (data.randomAdditionalMinutes !== undefined) setRandomAdditionalMinutes(data.randomAdditionalMinutes);
        if (data.maxNewLeadsPerDay !== undefined) setMaxNewLeadsPerDay(data.maxNewLeadsPerDay);
        if (data.prioritizeNewLeads !== undefined) setPrioritizeNewLeads(data.prioritizeNewLeads);
        if (data.winningMetric) setWinningMetric(data.winningMetric);
        if (data.providerMatching !== undefined) setProviderMatching(data.providerMatching);
        if (data.espRules) setEspRules(data.espRules);
        if (data.companyReplyStop !== undefined) setCompanyReplyStop(data.companyReplyStop);
        if (data.stopOnAutoReply !== undefined) setStopOnAutoReply(data.stopOnAutoReply);
        if (data.unsubscribeLinkHeader !== undefined) setUnsubscribeLinkHeader(data.unsubscribeLinkHeader);
        if (data.enableRiskyEmails !== undefined) setEnableRiskyEmails(data.enableRiskyEmails);
        if (data.disableBounceProtect !== undefined) setDisableBounceProtect(data.disableBounceProtect);
        if (data.overrideCampaignDeliverability !== undefined) setOverrideCampaignDeliverability(data.overrideCampaignDeliverability);
        if (data.ccRecipients !== undefined) setCcRecipients(data.ccRecipients);
        if (data.bccRecipients !== undefined) setBccRecipients(data.bccRecipients);
        if (data.timezone) setTimezone(data.timezone);
        if (data.sendingWindowStart) setFromTime(data.sendingWindowStart);
        if (data.sendingWindowEnd) setToTime(data.sendingWindowEnd);
        if (data.selectedAccounts && Array.isArray(data.selectedAccounts) && data.selectedAccounts.length > 0) {
          setSelectedAccounts(data.selectedAccounts);
        }
      })
      .catch(console.error);

    fetch('/api/email-accounts')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const emails = data.map((a: any) => a.email);
          setAvailableAccounts(emails);
          setSelectedAccounts(prev => prev.length === 0 ? [emails[0]] : prev);
        } else if (isDemo) {
          const fallback = ['alex@reachops-demo.io', 'growth@reachops-demo.io'];
          setAvailableAccounts(fallback);
          setSelectedAccounts(prev => prev.length === 0 ? [fallback[0]] : prev);
        } else {
          setAvailableAccounts([]);
          setSelectedAccounts([]);
        }
      })
      .catch(() => {
        if (isDemo) {
          const fallback = ['alex@reachops-demo.io', 'growth@reachops-demo.io'];
          setAvailableAccounts(fallback);
          setSelectedAccounts(prev => prev.length === 0 ? [fallback[0]] : prev);
        } else {
          setAvailableAccounts([]);
          setSelectedAccounts([]);
        }
      });
  }, [campaignKey, isDemo]);

  const removeAccount = (acc: string) => {
    setSelectedAccounts(selectedAccounts.filter(a => a !== acc));
  };

  const addAccount = (acc: string) => {
    if (!selectedAccounts.includes(acc)) {
      setSelectedAccounts([...selectedAccounts, acc]);
    }
  };

  const toggleDay = (day: keyof typeof days) => {
    setDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        dailyLimit,
        timezone,
        fromTime,
        toTime,
        minGapMinutes,
        randomAdditionalMinutes,
        maxNewLeadsPerDay,
        prioritizeNewLeads,
        winningMetric,
        providerMatching,
        espRules,
        companyReplyStop,
        stopOnAutoReply,
        unsubscribeLinkHeader,
        enableRiskyEmails,
        disableBounceProtect,
        overrideCampaignDeliverability,
        ccRecipients,
        bccRecipients,
        selectedAccounts,
      };

      await fetch(`/api/campaigns/${campaignKey}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save settings to backend:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const openActionModal = (title: string, desc: string) => {
    setModalTitle(title);
    setModalDescription(desc);
    setShowWorkspaceModal(true);
  };

  // Helper toggle switch component for 100% reliable animation
  const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id?: string }) => (
    <button
      type="button"
      id={id}
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 focus:outline-none ${
        checked ? 'bg-gradient-to-r from-[#059669] to-[#10b981] shadow-[0_0_10px_rgba(139,92,246,0.6)]' : 'bg-white/[0.1] border border-white/[0.1]'
      }`}
    >
      <span 
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-4 bg-white' : 'translate-x-0 bg-white'
        }`} 
      />
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300 pb-48 text-slate-100 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Campaign Settings</h2>
          <p className="text-xs text-slate-400">
            Configure your outreach schedule, accounts, deliverability safeguards, and rules
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          className="btn-reachops-primary font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-[#a31c1b]/25 border-none active:scale-95 transition-all cursor-pointer"
        >
          {isSaving ? 'Saving...' : savedSuccess ? (
            <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" /> Saved</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1" /> Save Settings</>
          )}
        </Button>
      </div>

      {/* 1. Accounts To Use Section */}
      <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] transition-all shadow-[0_8px_32px_rgba(0,0,0,0.25)] relative overflow-hidden">
        <div 
          onClick={() => setAccountsOpen(!accountsOpen)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors rounded-t-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Accounts To Use</h3>
                <span className="text-[11px] font-semibold text-emerald-400 bg-[#10b981]/15 border border-[#10b981]/25 px-2 py-0.5 rounded-full">
                  {selectedAccounts.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Select one or more accounts to send emails from</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white p-1">
            {accountsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {accountsOpen && (
          <div className="px-6 pb-6 pt-2 space-y-4">
            {/* Selected Accounts Pill Tags */}
            {selectedAccounts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {selectedAccounts.map((acc) => (
                  <span 
                    key={acc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-white font-medium shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span>{acc}</span>
                    <button 
                      onClick={() => removeAccount(acc)}
                      className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 ml-0.5 cursor-pointer"
                      title="Remove account"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* In-Card Available Sending Inboxes List - Never cut off by screen overflow */}
            <div className="border border-white/[0.08] rounded-xl bg-[#080d1b]/60 overflow-hidden shadow-inner">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Available Sending Inboxes ({availableAccounts.length})
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedAccounts.length === availableAccounts.length) {
                        setSelectedAccounts([]);
                      } else {
                        setSelectedAccounts([...availableAccounts]);
                      }
                    }}
                    className="text-emerald-400 hover:text-[#B7ACFF] text-xs font-semibold hover:underline cursor-pointer transition-colors"
                  >
                    {selectedAccounts.length === availableAccounts.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {availableAccounts.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-400 text-xs">
                  <p>No connected email accounts found.</p>
                  <a 
                    href="/email-accounts" 
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/30 text-emerald-400 font-semibold text-xs border border-[#10b981]/30 transition-colors"
                  >
                    Connect an Email Account →
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto">
                  {availableAccounts.map(acc => {
                    const isSelected = selectedAccounts.includes(acc);
                    return (
                      <div
                        key={acc}
                        onClick={() => {
                          if (isSelected) {
                            removeAccount(acc);
                          } else {
                            addAccount(acc);
                          }
                        }}
                        className={`px-4 py-3 hover:bg-white/[0.04] cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[#10b981]/10 text-white font-medium' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-[#10b981] border-[#10b981]' : 'border-slate-500 bg-white/[0.04]'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#080d1b]" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-xs truncate text-white">{acc}</span>
                            <span className="text-[10px] text-slate-400">Daily send limit: 50/day</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Connected
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Schedule & Limits Section */}
      <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden transition-all shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div 
          onClick={() => setScheduleOpen(!scheduleOpen)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white tracking-tight">Schedule & Limits</h3>
            {!scheduleOpen ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium">
                  1 schedule
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium">
                  Start sending {startDate || 'Oct 12, 2026'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium">
                  {stopDate ? `Stop sending ${stopDate}` : 'Never Stop sending'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium">
                  {dailyLimit} emails daily
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Configure when and how your emails are sent</p>
            )}
          </div>

          <button className="text-slate-400 hover:text-white p-1 ml-4">
            {scheduleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {scheduleOpen && (
          <div className="px-6 pb-6 pt-1 space-y-5">
            <div>
              <button 
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-xs font-semibold text-slate-200 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Create New Schedule</span>
              </button>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Schedule Name</label>
                <input 
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Send</label>
                <div className="relative">
                  <select 
                    value={sendType}
                    onChange={(e) => setSendType(e.target.value)}
                    className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option>At custom times</option>
                    <option>24 / 7 Anytime</option>
                    <option>Recipient Business Hours</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">From</label>
                  <div className="relative">
                    <select 
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                    >
                      <option>9:00 AM</option>
                      <option>9:30 AM</option>
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">To</label>
                  <div className="relative">
                    <select 
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                    >
                      <option>4:00 PM</option>
                      <option>5:00 PM</option>
                      <option>6:00 PM</option>
                      <option>7:00 PM</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Timezone</label>
                  <div className="relative">
                    <select 
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer truncate pr-8"
                    >
                      <option>Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)</option>
                      <option>Eastern Time (US & Canada) (UTC-05:00)</option>
                      <option>Pacific Time (US & Canada) (UTC-08:00)</option>
                      <option>London, Edinburgh (UTC+00:00)</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-300 block">Days</label>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  {Object.keys(days).map((dayKey) => {
                    const day = dayKey as keyof typeof days;
                    const checked = days[day];
                    return (
                      <label key={day} className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDay(day)}
                          className="w-4 h-4 rounded text-emerald-500 bg-white/[0.05] border-white/[0.1] focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <span className={checked ? 'text-white font-medium' : 'text-slate-400'}>{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Start sending</label>
                  <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent border-none text-white focus:outline-none w-full [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Stop sending</label>
                  <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input 
                      type="date"
                      value={stopDate}
                      onChange={(e) => setStopDate(e.target.value)}
                      placeholder="Never"
                      className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-500 [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-semibold text-slate-300 block">Daily limit</label>
                <p className="text-[11px] text-slate-400">Max number of emails to send per day for this campaign</p>
                <input 
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CRM & Tags Section */}
      <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden transition-all shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div 
          onClick={() => setCrmOpen(!crmOpen)}
          className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white tracking-tight">CRM & Tags</h3>
            {!crmOpen ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium">
                  Owner: {owner}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium">
                  {tags.length > 0 ? `${tags.length} tags` : 'No tags'}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Manage campaign ownership and tags</p>
            )}
          </div>

          <button className="text-slate-400 hover:text-white p-1 ml-4">
            {crmOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {crmOpen && (
          <div className="px-6 pb-6 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Owner</label>
                <p className="text-[11px] text-slate-400">Select the owner of this campaign</p>
                <div className="relative mt-1">
                  <select 
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full appearance-none bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                  >
                    <option>Sathish Eppakayala</option>
                    <option>Victor Admin</option>
                    <option>Alex Growth</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Custom Tags</label>
                <p className="text-[11px] text-slate-400">Tags are used to group your campaigns</p>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="text"
                    placeholder="Type tag & press enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim() && !tags.includes(tagInput.trim())) {
                        setTags([...tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 placeholder-slate-500"
                  />
                  <button 
                    onClick={() => {
                      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                        setTags([...tags, tagInput.trim()]);
                        setTagInput('');
                      }
                    }}
                    className="px-3 py-2 bg-[#202235] hover:bg-[#282b42] border border-[#2f324d] rounded-xl text-xs text-white"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tags.map(t => (
                      <span key={t} className="px-2.5 py-0.5 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-emerald-400 text-[11px] flex items-center gap-1.5">
                        {t}
                        <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Advanced Settings Container */}
      <div className="pt-2 space-y-3">
        
        <div 
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors"
        >
          <span className="text-sm font-bold text-white">Advanced settings</span>
          {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {advancedOpen && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            
            {/* 4A. Basic Deliverability */}
            <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              <div 
                onClick={() => setBasicDeliverabilityOpen(!basicDeliverabilityOpen)}
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#161722]/50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">Basic Deliverability</h4>
                  {!basicDeliverabilityOpen ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.09] text-xs text-slate-300 font-medium">
                        Stop on reply: {stopOnReply ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.09] text-xs text-slate-300 font-medium">
                        Open tracking: {openTracking ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Configure email tracking and delivery settings</p>
                  )}
                </div>
                <button className="text-slate-400 hover:text-white p-1 ml-4">
                  {basicDeliverabilityOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {basicDeliverabilityOpen && (
                <div className="px-6 pb-6 pt-1 space-y-3">
                  
                  {/* Stop sending emails on reply */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Stop sending emails on reply</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Stop sending emails to a lead if a response has been received</p>
                    </div>
                    <ToggleSwitch 
                      checked={stopOnReply} 
                      onChange={() => setStopOnReply(!stopOnReply)} 
                    />
                  </div>

                  {/* Open Tracking */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Open Tracking</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">Track email opens</p>
                      </div>
                      <ToggleSwitch 
                        checked={openTracking} 
                        onChange={() => setOpenTracking(!openTracking)} 
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 cursor-pointer pt-1">
                      <input 
                        type="checkbox" 
                        checked={linkTracking}
                        onChange={(e) => setLinkTracking(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-400 bg-white/[0.05] border-white/[0.1] focus:ring-[#10b981]"
                      />
                      <span>Link tracking</span>
                    </label>
                  </div>

                  {/* Delivery Optimization [Recommended] */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-white">Delivery Optimization</h5>
                        <span className="px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30 text-[10px] font-semibold">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Disables open tracking</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={textOnlyAll}
                          onChange={(e) => setTextOnlyAll(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-400 bg-white/[0.05] border-white/[0.1] focus:ring-[#10b981]"
                        />
                        <span>Send emails as text-only (no HTML)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={textOnlyFirst}
                          onChange={(e) => setTextOnlyFirst(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-400 bg-white/[0.05] border-white/[0.1] focus:ring-[#10b981]"
                        />
                        <span>Send first email as text-only</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#FBBF24]/20 text-[#FBBF24] text-[10px] font-bold">
                          Pro
                        </span>
                      </label>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 4B. Sending Rules (Exact match for Screenshots 1, 2, 3) */}
            <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              <div 
                onClick={() => setSendingRulesOpen(!sendingRulesOpen)}
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#161722]/50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Sending Rules</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Specify how you want your emails to go</p>
                </div>
                <button className="text-slate-400 hover:text-white p-1">
                  {sendingRulesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {sendingRulesOpen && (
                <div className="px-6 pb-6 pt-1 space-y-3.5">
                  
                  {/* Time gap between emails */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                    <h5 className="text-xs font-bold text-white">Time gap between emails</h5>
                    
                    <div className="pt-2 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Minimum time</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number"
                            value={minGapMinutes}
                            onChange={(e) => setMinGapMinutes(parseInt(e.target.value) || 0)}
                            className="w-28 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                          />
                          <span className="text-xs text-slate-400">minutes</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Random additional time</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number"
                            value={randomAdditionalMinutes}
                            onChange={(e) => setRandomAdditionalMinutes(parseInt(e.target.value) || 0)}
                            className="w-28 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                          />
                          <span className="text-xs text-slate-400">minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Max new leads */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Max new leads</span>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        value={maxNewLeadsPerDay}
                        onChange={(e) => setMaxNewLeadsPerDay(parseInt(e.target.value) || 0)}
                        className="w-28 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                      />
                      <span className="text-xs text-slate-400 min-w-[50px]">per day</span>
                    </div>
                  </div>

                  {/* Prioritize New Leads */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Prioritize New Leads</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Prioritize reaching out to new leads over scheduled follow-ups
                      </p>
                    </div>
                    <ToggleSwitch 
                      checked={prioritizeNewLeads} 
                      onChange={() => setPrioritizeNewLeads(!prioritizeNewLeads)} 
                    />
                  </div>

                  {/* Auto optimize A/Z Testing */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                    <div>
                      <h5 className="text-xs font-bold text-white">Auto optimize A/Z Testing</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        When using A/Z testing, the Instantly algorithm will automatically select the best performing variant after a certain number of emails have been sent.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Choose winning metric</label>
                      <div className="relative max-w-sm">
                        <select 
                          value={winningMetric}
                          onChange={(e) => setWinningMetric(e.target.value)}
                          className="w-full appearance-none bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer pr-10"
                        >
                          <option value="Reply Rate">Reply Rate</option>
                          <option value="Open Rate">Open Rate</option>
                          <option value="Click Rate">Click Rate</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                          <X className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Provider Matching */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-white">Provider Matching</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Matches your lead's email provider with your mailbox provider for boosted deliverability. (Outlook to Outlook, Google to Google, etc.)
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs text-slate-300">Enable provider matching for deliverability boost</span>
                      <ToggleSwitch 
                        checked={providerMatching} 
                        onChange={() => setProviderMatching(!providerMatching)} 
                      />
                    </div>
                  </div>

                  {/* ESP Routing [New] */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-white">ESP Routing</h5>
                        <span className="px-2 py-0.5 rounded bg-[#10b981] text-white text-[10px] font-bold">
                          New
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Create rules to control email sending based on sender and recipient email service providers
                      </p>
                    </div>

                    {espRules.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {espRules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs">
                            <span className="text-slate-300">If recipient uses <b>{rule.provider}</b>, send from <b>{rule.mailbox}</b></span>
                            <button 
                              onClick={() => setEspRules(espRules.filter(r => r.id !== rule.id))}
                              className="text-slate-400 hover:text-[#FB7185] p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-1">
                      <button 
                        onClick={() => setShowAddEspModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-slate-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add rule</span>
                      </button>
                    </div>
                  </div>

                  {/* Stop Campaign for Company on Reply */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-white">Stop Campaign for Company on Reply</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Stops the campaign automatically for all leads from a company if a reply is received from any of them.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs text-slate-300">Enable company reply stop</span>
                      <ToggleSwitch 
                        checked={companyReplyStop} 
                        onChange={() => setCompanyReplyStop(!companyReplyStop)} 
                      />
                    </div>
                  </div>

                  {/* Stop Sending Emails on Auto-Reply */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-white">Stop Sending Emails on Auto-Reply</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Stop sending emails to a lead if an automatic response has been received, for example for out-of-office replies.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs text-slate-300">Stop on auto-reply</span>
                      <ToggleSwitch 
                        checked={stopOnAutoReply} 
                        onChange={() => setStopOnAutoReply(!stopOnAutoReply)} 
                      />
                    </div>
                  </div>

                  {/* Insert Unsubscribe Link Header */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-white">Insert Unsubscribe Link Header</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Automatically adds an unsubscribe link to email headers for one-click unsubscription by supported email providers
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs text-slate-300">Insert unsubscribe link header</span>
                      <ToggleSwitch 
                        checked={unsubscribeLinkHeader} 
                        onChange={() => setUnsubscribeLinkHeader(!unsubscribeLinkHeader)} 
                      />
                    </div>
                  </div>

                  {/* Allow Risky Emails (Screenshot 2 and 3) */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3.5">
                    <div>
                      <h5 className="text-xs font-bold text-white">Allow Risky Emails</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        When using verification, allow emails that are marked as risky to be contacted; or disable BounceProtect to allow known risky emails to be contacted.
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs text-slate-300">Enable risky emails</span>
                      <ToggleSwitch 
                        checked={enableRiskyEmails} 
                        onChange={() => setEnableRiskyEmails(!enableRiskyEmails)} 
                      />
                    </div>

                    <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs text-slate-300">Disable BounceProtect</span>
                      <ToggleSwitch 
                        checked={disableBounceProtect} 
                        onChange={() => setDisableBounceProtect(!disableBounceProtect)} 
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 4C. Advanced Deliverability (Screenshot 4) */}
            <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              <div 
                onClick={() => setAdvDeliverabilityOpen(!advDeliverabilityOpen)}
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#161722]/50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">Advanced Deliverability</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Campaign-level overrides for workspace deliverability settings</p>
                </div>
                <button className="text-slate-400 hover:text-white p-1">
                  {advDeliverabilityOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {advDeliverabilityOpen && (
                <div className="px-6 pb-6 pt-1 space-y-3.5">
                  
                  {/* Limit emails per company Card */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3.5">
                    <div>
                      <h5 className="text-xs font-bold text-white">Limit emails per company</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Domain limiter is currently off for this workspace. Enable it here for this campaign or manage workspace defaults to apply it across all campaigns.
                      </p>
                    </div>

                    <div>
                      <button 
                        onClick={() => openActionModal('Advanced Deliverability Settings', 'Adjust domain rate limiting and max daily threshold per target domain.')}
                        className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
                      >
                        Update Advanced Deliverability Settings
                      </button>
                    </div>
                  </div>

                  {/* Override setting for this campaign Card */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Override setting for this campaign</span>
                    <ToggleSwitch 
                      checked={overrideCampaignDeliverability} 
                      onChange={() => setOverrideCampaignDeliverability(!overrideCampaignDeliverability)} 
                    />
                  </div>

                  {/* Deliverability boost Card */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3.5">
                    <div>
                      <h5 className="text-xs font-bold text-white">Deliverability boost</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Instantly spaces out sends so companies never feel overwhelmed while your campaigns keep moving forward — this may lower your daily sending volume, but it keeps everything inbox-friendly.
                      </p>
                    </div>

                    <div>
                      <button 
                        onClick={() => openActionModal('Deliverability Boost Workspace Defaults', 'Configure global pacing, sending delays, and adaptive inbox spacing across all active campaigns.')}
                        className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
                      >
                        Manage workspace defaults
                      </button>
                    </div>
                  </div>

                  {/* Unlock more deliverability boosters Card */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3.5">
                    <div>
                      <h5 className="text-xs font-bold text-white">Unlock more deliverability boosters</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Explore workspace-wide settings for throttling, safety guardrails, and smart routing to keep every campaign healthy.
                      </p>
                    </div>

                    <div>
                      <button 
                        onClick={() => openActionModal('Workspace Deliverability Suite', 'Access global anti-spam throttles, MX provider rotation, and reputation guards.')}
                        className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
                      >
                        Open Advanced Deliverability
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 4D. CC & BCC Recipients (Screenshot 5) */}
            <div className="rounded-2xl bg-[#171717]/90 backdrop-blur-xl border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              <div 
                onClick={() => setCcBccOpen(!ccBccOpen)}
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-[#161722]/50 transition-colors"
              >
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">CC & BCC Recipients</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Add recipients to CC or BCC on all emails</p>
                </div>
                <button className="text-slate-400 hover:text-white p-1">
                  {ccBccOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {ccBccOpen && (
                <div className="px-6 pb-6 pt-1 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white block">CC</label>
                    <textarea 
                      rows={2}
                      placeholder="email@example.com, email2@example.com"
                      value={ccRecipients}
                      onChange={(e) => setCcRecipients(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white block">BCC</label>
                    <textarea 
                      rows={2}
                      placeholder="email@example.com, email2@example.com"
                      value={bccRecipients}
                      onChange={(e) => setBccRecipients(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-y"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Floating Bottom Quick Save Toolbar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/[0.04]/90 backdrop-blur-md border border-white/[0.1] shadow-2xl rounded-2xl px-5 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
          <span>Settings sync ready</span>
        </div>

        <div className="h-4 w-px bg-[#2e3146]" />

        <Button 
          onClick={handleSave} 
          className="btn-reachops-primary text-white font-bold text-xs h-8 px-4 shadow-md shadow-emerald-500/20"
        >
          {isSaving ? 'Saving...' : savedSuccess ? (
            <><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" /> Saved</>
          ) : (
            <><Save className="w-3.5 h-3.5 mr-1" /> Save Settings</>
          )}
        </Button>
      </div>

      {/* Create New Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#14151f] border border-[#292c3f] rounded-2xl w-full max-w-md shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Create New Sending Schedule</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Preset Template:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setScheduleName('US East Business Hours');
                      setFromTime('9:00 AM');
                      setToTime('5:00 PM');
                      setTimezone('Eastern Time (US & Canada) (UTC-05:00)');
                      setShowScheduleModal(false);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:border-emerald-500/40 text-left"
                  >
                    <div className="font-semibold text-white">US Eastern</div>
                    <div className="text-[10px] text-slate-400">9:00 AM - 5:00 PM EST</div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setScheduleName('Europe Business Hours');
                      setFromTime('9:00 AM');
                      setToTime('6:00 PM');
                      setTimezone('London, Edinburgh (UTC+00:00)');
                      setShowScheduleModal(false);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:border-emerald-500/40 text-left"
                  >
                    <div className="font-semibold text-white">Europe / UK</div>
                    <div className="text-[10px] text-slate-400">9:00 AM - 6:00 PM GMT</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ESP Routing Modal */}
      {showAddEspModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#14151f] border border-[#292c3f] rounded-2xl w-full max-w-md shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Add ESP Routing Rule</h3>
              </div>
              <button onClick={() => setShowAddEspModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Direct emails to matched mailboxes based on the recipient's mail exchange server.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">When Recipient Provider is:</label>
                <select 
                  value={selectedEspRecipient}
                  onChange={(e) => setSelectedEspRecipient(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                >
                  <option value="Google / Gmail">Google / Gmail (ASPMX.L.GOOGLE.COM)</option>
                  <option value="Microsoft 365 / Outlook">Microsoft 365 / Outlook (mail.protection.outlook.com)</option>
                  <option value="Yahoo Mail">Yahoo / AOL</option>
                  <option value="Custom / Private SMTP">Custom / Private SMTP</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Send from Mailbox Provider:</label>
                <select 
                  value={selectedEspSender}
                  onChange={(e) => setSelectedEspSender(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                >
                  <option value="Google Workspace">Google Workspace Inboxes</option>
                  <option value="Microsoft 365">Microsoft 365 Inboxes</option>
                  <option value="Private SMTP Dedicated IP">Private SMTP Dedicated IP</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowAddEspModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setEspRules([
                    ...espRules, 
                    { id: Date.now().toString(), provider: selectedEspRecipient, mailbox: selectedEspSender }
                  ]);
                  setShowAddEspModal(false);
                }}
                className="btn-reachops-primary text-white font-bold text-xs"
              >
                Save Rule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deliverability Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#14151f] border border-[#292c3f] rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#34D399]" />
                <h3 className="text-sm font-bold">{modalTitle}</h3>
              </div>
              <button onClick={() => setShowWorkspaceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {modalDescription}
            </p>

            <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.09] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Domain-level daily send limit:</span>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    value={domainLimitCount} 
                    onChange={(e) => setDomainLimitCount(parseInt(e.target.value) || 1)}
                    className="w-16 bg-[#121319] border border-[#2d3045] rounded px-2 py-1 text-white text-center"
                  />
                  <span className="text-slate-400">emails/day</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">Min spacing between target domain contacts:</span>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    value={domainDelayMins} 
                    onChange={(e) => setDomainDelayMins(parseInt(e.target.value) || 1)}
                    className="w-16 bg-[#121319] border border-[#2d3045] rounded px-2 py-1 text-white text-center"
                  />
                  <span className="text-slate-400">minutes</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-300">Automated DNS warmup status:</span>
                <span className="font-semibold text-[#34D399] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 100% Reputable
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                onClick={() => setShowWorkspaceModal(false)}
                className="btn-reachops-primary text-white font-bold text-xs px-4"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
