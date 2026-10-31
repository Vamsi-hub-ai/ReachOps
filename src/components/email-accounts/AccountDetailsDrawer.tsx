import { useState, useEffect } from 'react';
import { 
  X, Check, Copy, Flame, Pause, Play, Settings, Mail, Globe, 
  ShieldCheck, BarChart3, Clock, ChevronDown, ChevronUp, RefreshCw, 
  Plus, ExternalLink, Sparkles, Send, Layers, HelpCircle, AlertTriangle
} from 'lucide-react';

export interface EmailAccountData {
  id: string;
  email: string;
  displayName?: string;
  provider?: string;
  status?: string;
  dailyLimit?: number;
  sentToday?: number;
  warmupActive?: boolean;
  warmupEnabled?: boolean;
  healthScore?: number;
  tags?: string[];
  signature?: string;
  firstName?: string;
  lastName?: string;
  replyTo?: string;
  minWaitMinutes?: number;
  slowRampEnabled?: boolean;
  inboxPlacementLimit?: number;
  customTrackingDomain?: string;
  useCustomTrackingDomain?: boolean;
  warmupDailyLimit?: number;
  warmupRampUp?: number;
  warmupReplyRate?: number;
  disableSlowWarmup?: boolean;
  warmupFilterTag?: string;
  weekdaysOnly?: boolean;
  readEmulation?: boolean;
  warmTrackingDomain?: boolean;
  openRatePercent?: number;
  spamProtectionPercent?: number;
  markImportantPercent?: number;
  assignedCampaigns?: string[];
}

interface AccountDetailsDrawerProps {
  isOpen: boolean;
  account: EmailAccountData | null;
  onClose: () => void;
  onSave: (updatedAccount: EmailAccountData) => void;
}

export default function AccountDetailsDrawer({
  isOpen,
  account,
  onClose,
  onSave
}: AccountDetailsDrawerProps) {
  if (!isOpen || !account) return null;

  // Active Tab: 'settings' | 'warmup' | 'campaigns'
  const [activeTab, setActiveTab] = useState<'settings' | 'warmup' | 'campaigns'>('settings');

  // Copy email feedback
  const [copied, setCopied] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Form State
  const [status, setStatus] = useState<string>(account.status || 'ACTIVE');
  const [warmupActive, setWarmupActive] = useState<boolean>(account.warmupActive ?? account.warmupEnabled ?? true);
  
  // Sender Profile
  const initialFirst = account.firstName || (account.displayName ? account.displayName.split(' ')[0] : 'Alex');
  const initialLast = account.lastName || (account.displayName && account.displayName.split(' ').length > 1 ? account.displayName.split(' ').slice(1).join(' ') : 'Turner');
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);

  // Signature
  const [signature, setSignature] = useState(
    account.signature || `Best regards,\n${initialFirst} ${initialLast}\nReachOps Team`
  );

  // Tags
  const [tags, setTags] = useState<string[]>(account.tags || ['Outbound', 'Tier 1']);
  const [newTagInput, setNewTagInput] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  // Campaign Settings
  const [dailyLimit, setDailyLimit] = useState<number>(account.dailyLimit || 30);
  const [minWaitMinutes, setMinWaitMinutes] = useState<number>(account.minWaitMinutes || 1);
  const [slowRampEnabled, setSlowRampEnabled] = useState<boolean>(account.slowRampEnabled ?? true);
  const [replyTo, setReplyTo] = useState<string>(account.replyTo || '');
  const [inboxPlacementLimit, setInboxPlacementLimit] = useState<number>(account.inboxPlacementLimit || 10);

  // Custom Tracking Domain
  const [useCustomTrackingDomain, setUseCustomTrackingDomain] = useState<boolean>(account.useCustomTrackingDomain ?? false);
  const [customTrackingDomain, setCustomTrackingDomain] = useState<string>(
    account.customTrackingDomain || `track.${account.email ? account.email.split('@')[1] : 'reachops.io'}`
  );

  // Warmup Settings Basics
  const [warmupRampUp, setWarmupRampUp] = useState<number>(account.warmupRampUp || 1);
  const [warmupDailyLimit, setWarmupDailyLimit] = useState<number>(account.warmupDailyLimit || 10);
  const [warmupReplyRate, setWarmupReplyRate] = useState<number>(account.warmupReplyRate || 30);
  const [disableSlowWarmup, setDisableSlowWarmup] = useState<boolean>(account.disableSlowWarmup ?? false);
  const [warmupFilterTag, setWarmupFilterTag] = useState<string>(account.warmupFilterTag || '6PZGMYD');

  // Advanced Warmup Settings
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [weekdaysOnly, setWeekdaysOnly] = useState<boolean>(account.weekdaysOnly ?? true);
  const [readEmulation, setReadEmulation] = useState<boolean>(account.readEmulation ?? true);
  const [warmTrackingDomain, setWarmTrackingDomain] = useState<boolean>(account.warmTrackingDomain ?? false);
  const [openRatePercent, setOpenRatePercent] = useState<number>(account.openRatePercent ?? 100);
  const [spamProtectionPercent, setSpamProtectionPercent] = useState<number>(account.spamProtectionPercent ?? 100);
  const [markImportantPercent, setMarkImportantPercent] = useState<number>(account.markImportantPercent ?? 100);

  // Assigned Campaigns
  const isDemo = account.email?.includes('demo') || account.email?.includes('example');
  const [assignedCampaigns, setAssignedCampaigns] = useState<string[]>(
    account.assignedCampaigns || (isDemo ? ['camp-1', 'camp-2'] : [])
  );

  // Available campaigns for routing
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>(() => isDemo ? [
    { id: 'camp-1', name: '[DEMO] Product Hunt Beta Launch Sequence', leads: 30, status: 'DRAFT', dailyShare: '50%' },
    { id: 'camp-2', name: '[DEMO] VP of Sales Executive Outreach', leads: 30, status: 'ACTIVE', dailyShare: '35%' },
    { id: 'camp-3', name: '[DEMO] SaaS Growth Founders Warmup', leads: 25, status: 'ACTIVE', dailyShare: '15%' }
  ] : []);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.ok ? r.json() : [])
      .then(cData => {
        if (Array.isArray(cData)) {
          if (cData.length > 0) {
            setAvailableCampaigns(cData.map(c => ({
              id: c.id,
              name: c.name,
              leads: c.prospects?.length || c.prospects || 0,
              status: c.status,
              dailyShare: '50%'
            })));
          } else if (isDemo) {
            setAvailableCampaigns([
              { id: 'camp-1', name: '[DEMO] Product Hunt Beta Launch Sequence', leads: 30, status: 'DRAFT', dailyShare: '50%' },
              { id: 'camp-2', name: '[DEMO] VP of Sales Executive Outreach', leads: 30, status: 'ACTIVE', dailyShare: '35%' },
              { id: 'camp-3', name: '[DEMO] SaaS Growth Founders Warmup', leads: 25, status: 'ACTIVE', dailyShare: '15%' }
            ]);
          } else {
            setAvailableCampaigns([]);
          }
        }
      })
      .catch(() => {});
  }, [isDemo]);

  // 7-day warmup history simulation
  const warmupStats = [
    { date: 'Oct 24', sent: 0, spam: 0 },
    { date: 'Oct 25', sent: 0, spam: 0 },
    { date: 'Oct 26', sent: 0, spam: 0 },
    { date: 'Oct 27', sent: 0, spam: 0 },
    { date: 'Oct 28', sent: 1, spam: 0 },
    { date: 'Oct 29', sent: 2, spam: 0 },
    { date: 'Oct 30', sent: 3, spam: 0 },
  ];

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(account.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTag = () => {
    navigator.clipboard?.writeText(warmupFilterTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const handleRegenerateFilterTag = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for (let i = 0; i < 7; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWarmupFilterTag(res);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const clean = newTagInput.trim();
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setNewTagInput('');
    setShowAddTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const toggleCampaignAssignment = (campaignId: string) => {
    if (assignedCampaigns.includes(campaignId)) {
      setAssignedCampaigns(assignedCampaigns.filter(id => id !== campaignId));
    } else {
      setAssignedCampaigns([...assignedCampaigns, campaignId]);
    }
  };

  const handleToggleStatus = () => {
    setStatus(prev => prev === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
  };

  const handleToggleWarmup = () => {
    setWarmupActive(prev => !prev);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const updated: EmailAccountData = {
      ...account,
      displayName: `${firstName} ${lastName}`.trim() || account.displayName,
      firstName,
      lastName,
      status,
      warmupActive,
      warmupEnabled: warmupActive,
      signature,
      tags,
      dailyLimit,
      minWaitMinutes,
      slowRampEnabled,
      replyTo,
      inboxPlacementLimit,
      useCustomTrackingDomain,
      customTrackingDomain,
      warmupRampUp,
      warmupDailyLimit,
      warmupReplyRate,
      disableSlowWarmup,
      warmupFilterTag,
      weekdaysOnly,
      readEmulation,
      warmTrackingDomain,
      openRatePercent,
      spamProtectionPercent,
      markImportantPercent,
      assignedCampaigns,
    };

    try {
      await fetch('/api/email-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.warn('Backend sync failed, saving locally:', err);
    }

    onSave(updated);
    setIsSaving(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      
      {/* Deep Frosted Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#06110c]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
      />

      {/* Slide-over Drawer Surface (Charcoal Black #171717) */}
      <div className="relative w-full max-w-2xl bg-[#171717]/98 backdrop-blur-2xl border-l border-white/[0.1] shadow-[-20px_0_60px_rgba(0,0,0,0.7)] flex flex-col h-full z-10 animate-in slide-in-from-right duration-300 text-slate-100">
        
        {/* ========================================================================= */}
        {/* DRAWER HEADER */}
        {/* ========================================================================= */}
        <div className="px-6 py-5 border-b border-white/[0.08] bg-white/[0.02] flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            
            {/* Account Identity */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-emerald-500/25 shrink-0">
                {account.email?.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight truncate">
                    Account Details
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    status === 'ACTIVE' 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}>
                    {status}
                  </span>
                </div>

                {/* Email with 1-click copy */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-300 font-mono truncate max-w-xs">
                    {account.email}
                  </span>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
                    title="Copy email address"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400">
                    {account.provider === 'GMAIL' ? 'Google Workspace' : account.provider === 'MICROSOFT' ? 'Microsoft 365' : 'SMTP / IMAP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Controls: Quick Pause / Warmup / Close */}
            <div className="flex items-center gap-2">
              {/* Quick Pause / Resume */}
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  status === 'ACTIVE'
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-slate-300 hover:text-white'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                }`}
                title={status === 'ACTIVE' ? 'Pause Outbound Sending' : 'Resume Outbound Sending'}
              >
                {status === 'ACTIVE' ? (
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

              {/* Quick Warmup Button */}
              <button
                onClick={handleToggleWarmup}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  warmupActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                    : 'bg-white/[0.04] text-slate-400 border-white/[0.1] hover:text-white'
                }`}
                title={warmupActive ? 'Warmup Active (Click to Pause)' : 'Warmup Paused (Click to Enable)'}
              >
                <Flame className={`w-4 h-4 ${warmupActive ? 'fill-amber-400 text-amber-400 animate-pulse' : ''}`} />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/[0.08]"
                title="Close drawer (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Segmented Glass Tab Bar (Crimson Red #a31c1b Active) */}
          <div className="flex items-center gap-2 mt-5 bg-white/[0.03] border border-white/[0.06] p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#a31c1b] text-white shadow-md shadow-[#a31c1b]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('warmup')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'warmup'
                  ? 'bg-[#a31c1b] text-white shadow-md shadow-[#a31c1b]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Warmup</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-[#a31c1b] text-white shadow-md shadow-[#a31c1b]/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Campaigns</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.15] text-white">
                {assignedCampaigns.length}
              </span>
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* DRAWER BODY (SCROLLABLE) */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: SETTINGS */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'settings' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Card 1: Sender Name */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Sender Name
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The friendly from-name shown in recipients' inboxes.
                    </p>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {firstName} {lastName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Turner"
                      className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Signature */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Account Signature
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Appended via <code className="text-emerald-400 font-mono text-[10px]">{`{{accountSignature}}`}</code> variable.
                    </p>
                  </div>
                  
                  {/* Quick Dynamic Inserts */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSignature(prev => `${prev}\n{{senderName}}`)}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] font-mono text-emerald-400"
                    >
                      + Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignature(prev => `${prev}\nReachOps Team`)}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] text-slate-300"
                    >
                      + Company
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Enter email signature..."
                    className="w-full bg-[#171717]/90 border border-white/[0.1] focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none transition-all placeholder:text-slate-500 font-sans resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Plain text + HTML tags supported</span>
                    <span>{signature.length} characters</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Tags */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Tags &amp; Segmentation
                    </h3>
                    <span title="Organize mailboxes for campaign pool rotation">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                  </div>

                  {!showAddTag && (
                    <button
                      type="button"
                      onClick={() => setShowAddTag(true)}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-white transition-colors font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tag</span>
                    </button>
                  )}
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {tags.map(t => (
                    <span 
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-slate-200 shadow-sm"
                    >
                      <span>{t}</span>
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {showAddTag && (
                    <div className="inline-flex items-center gap-1 bg-white/[0.06] border border-[#10b981] rounded-xl p-0.5">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Tag name..."
                        autoFocus
                        className="bg-transparent px-2 py-0.5 text-xs text-white outline-none w-28"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-2 py-0.5 bg-[#10b981] rounded-lg text-white text-[11px] font-bold"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setShowAddTag(false)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Campaign Settings */}
              <div className="glass-surface p-5 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Campaign Dispatch Settings
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Safe sending caps and pacing parameters to safeguard mailbox health.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Daily Campaign Limit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Daily campaign limit
                    </label>
                    <p className="text-[10px] text-slate-500">Maximum campaign emails per day</p>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-500 font-medium">emails/day</span>
                    </div>
                  </div>

                  {/* Minimum wait time */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Minimum wait time
                    </label>
                    <p className="text-[10px] text-slate-500">Between consecutive dispatches</p>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={minWaitMinutes}
                        onChange={(e) => setMinWaitMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-500 font-medium">minute(s)</span>
                    </div>
                  </div>

                </div>

                {/* Slow Ramp & Reply-To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                  
                  {/* Campaign slow ramp toggle */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-300">Campaign slow ramp</label>
                      <span className="px-2 py-0.2 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-emerald-400 text-[9px] font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Gradually increase daily sending volume</p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSlowRampEnabled(!slowRampEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          slowRampEnabled ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          slowRampEnabled ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Reply-to Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Reply-to Address (Optional)
                    </label>
                    <p className="text-[10px] text-slate-500">Route recipient replies to central inbox</p>
                    <input
                      type="email"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="e.g. replies@yourdomain.com"
                      className="w-full mt-1 bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500"
                    />
                  </div>

                </div>

                {/* Daily Placement Test Limit */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block">
                        Daily Inbox Placement test limit
                      </label>
                      <p className="text-[10px] text-slate-500">Maximum seed-list placement tests per day</p>
                    </div>
                    <div className="w-36 relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={inboxPlacementLimit}
                        onChange={(e) => setInboxPlacementLimit(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none text-right pr-20"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-medium">test emails</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Card 5: Custom Tracking Domain */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Custom Tracking Domain
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Isolate your open &amp; click tracking reputation with your own branded CNAME.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setUseCustomTrackingDomain(!useCustomTrackingDomain)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      useCustomTrackingDomain ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      useCustomTrackingDomain ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {useCustomTrackingDomain && (
                  <div className="pt-2 space-y-2 animate-in fade-in">
                    <label className="text-[11px] font-semibold text-slate-400 block">Host Domain (CNAME)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTrackingDomain}
                        onChange={(e) => setCustomTrackingDomain(e.target.value)}
                        placeholder="track.yourdomain.com"
                        className="flex-1 bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                      <span className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>SSL Ready</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 6: Warmup Settings Basics */}
              <div className="glass-surface p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Warmup Settings Basics
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure automated peer warmup volume and reply simulation.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Peer Network</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Increase per day */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">Increase per day</label>
                    <p className="text-[10px] text-slate-500">Suggested 1, Max 4</p>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={warmupRampUp}
                      onChange={(e) => setWarmupRampUp(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none mt-1"
                    />
                  </div>

                  {/* Daily warmup limit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">Daily warmup limit</label>
                    <p className="text-[10px] text-slate-500">Suggested 10, Max 200</p>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={warmupDailyLimit}
                        onChange={(e) => setWarmupDailyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-500">warmups/day</span>
                    </div>
                  </div>

                  {/* Reply rate % */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">Reply rate %</label>
                    <p className="text-[10px] text-slate-500">Suggested 30%</p>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min="10"
                        max="60"
                        value={warmupReplyRate}
                        onChange={(e) => setWarmupReplyRate(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <span className="absolute right-3 top-2 text-[11px] text-slate-500">%</span>
                    </div>
                  </div>

                </div>

                {/* Disable Slow Warmup Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block">Disable slow warmup</label>
                    <p className="text-[10px] text-slate-500">Instantly start at max daily limit (only for seasoned inboxes)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDisableSlowWarmup(!disableSlowWarmup)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      disableSlowWarmup ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      disableSlowWarmup ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

              </div>

              {/* Card 7: Warmup Filter Tag */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Warmup Filter Tag
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Unique identifier injected into headers for automated inbox archiving.
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Default: {warmupFilterTag}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={warmupFilterTag}
                    onChange={(e) => setWarmupFilterTag(e.target.value)}
                    placeholder="Custom filter tag..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.1] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateFilterTag}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-slate-300 hover:text-white transition-colors"
                    title="Generate new tag"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyTag}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200"
                    title="Copy tag"
                  >
                    {copiedTag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTag ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Card 8: Advanced Warmup Settings (Accordion) */}
              <div className="glass-surface rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Advanced Warmup Settings
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Behavior emulation, weekday scheduling, and AI engagement sliders
                      </p>
                    </div>
                  </div>
                  {advancedOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {advancedOpen && (
                  <div className="p-5 pt-0 border-t border-white/[0.06] space-y-4 animate-in fade-in">
                    
                    {/* Weekdays Only */}
                    <div className="flex items-center justify-between pt-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-200 block">Weekdays only</label>
                        <p className="text-[11px] text-slate-400">Only send warmup emails on weekdays for organic B2B patterns</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWeekdaysOnly(!weekdaysOnly)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          weekdaysOnly ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          weekdaysOnly ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Read Emulation */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <div>
                        <label className="text-xs font-semibold text-slate-200 block">Read emulation</label>
                        <p className="text-[11px] text-slate-400">Spend realistic time and scroll through emails before marking read</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReadEmulation(!readEmulation)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          readEmulation ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          readEmulation ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Warm Custom Tracking Domain */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <div>
                        <label className="text-xs font-semibold text-slate-200 block">Warm custom tracking domain</label>
                        <p className="text-[11px] text-slate-400">Include tracking links in warmup emails to further improve deliverability</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWarmTrackingDomain(!warmTrackingDomain)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          warmTrackingDomain ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          warmTrackingDomain ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Slider 1: Open Rate */}
                    <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200">Open rate target</label>
                        <span className="px-2 py-0.5 rounded-lg bg-[#10b981]/15 text-emerald-400 border border-[#10b981]/30 text-xs font-bold">
                          {openRatePercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">How many of your warm up emails to open</p>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={openRatePercent}
                        onChange={(e) => setOpenRatePercent(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Slider 2: Spam Protection */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200">Spam protection</label>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                          {spamProtectionPercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">How many of your warm up emails to save from spam folder</p>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={spamProtectionPercent}
                        onChange={(e) => setSpamProtectionPercent(parseInt(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>

                    {/* Slider 3: Mark Important */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-200">Mark important</label>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                          {markImportantPercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">How many of your warm up emails to mark as important</p>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={markImportantPercent}
                        onChange={(e) => setMarkImportantPercent(parseInt(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: WARMUP ENGINE & ANALYTICS */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'warmup' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Warmup Status Banner */}
              <div className="glass-surface p-5 rounded-2xl flex items-center justify-between border-amber-500/30 bg-gradient-to-r from-amber-950/20 to-[#171717]/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                    <Flame className="w-6 h-6 fill-current animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">ReachOps Warmup Engine</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {warmupActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Started on Oct 28, 2026 • 2 days active in network
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleWarmup}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    warmupActive ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    warmupActive ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Summary For Past Week */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Summary For Past Week
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-2xl font-extrabold text-white">52</p>
                    <p className="text-[11px] text-slate-400 mt-1">Warmup received</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-2xl font-extrabold text-[#10b981]">3</p>
                    <p className="text-[11px] text-slate-400 mt-1">Warmup sent</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                    <p className="text-2xl font-extrabold text-emerald-400">0</p>
                    <p className="text-[11px] text-slate-400 mt-1">Saved from spam</p>
                  </div>
                </div>
              </div>

              {/* Warmup Emails Sent (Interactive Visual Chart) */}
              <div className="glass-surface p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Warmup Emails Sent
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">7-day outbound progression &amp; spam audit</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                      <span className="text-slate-300 text-[11px]">Warmup emails sent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#FB7185]" />
                      <span className="text-slate-300 text-[11px]">Landed in spam</span>
                    </div>
                  </div>
                </div>

                {/* Bar Graph Visual */}
                <div className="pt-4">
                  <div className="h-40 flex items-end justify-between gap-3 px-2 border-b border-white/[0.08] pb-2">
                    {warmupStats.map((item, idx) => {
                      const maxVal = 3;
                      const heightPercent = item.sent > 0 ? (item.sent / maxVal) * 100 : 4;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          {/* Value tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[#171717] px-1.5 py-0.5 rounded text-white font-mono">
                            {item.sent}
                          </div>

                          <div className="w-full max-w-[28px] bg-white/[0.04] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                            <div 
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-gradient-to-t from-[#059669] to-[#10b981] rounded-t-lg transition-all duration-500 shadow-md shadow-emerald-500/20"
                            />
                          </div>

                          <span className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                            {item.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Protocol Authentication Health */}
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Domain Authentication &amp; SPF / DKIM / DMARC
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">SPF Record</p>
                      <p className="text-[10px] text-emerald-400">v=spf1 Verified</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">DKIM Key</p>
                      <p className="text-[10px] text-emerald-400">2048-bit Signed</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">DMARC Policy</p>
                      <p className="text-[10px] text-emerald-400">p=quarantine</p>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 3: CAMPAIGNS ASSIGNMENT */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === 'campaigns' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="glass-surface p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Assigned Outreach Campaigns
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Attach or detach this mailbox from active multi-account sequence pools.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {assignedCampaigns.length} Active Routing(s)
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  {availableCampaigns.map((camp) => {
                    const isAttached = assignedCampaigns.includes(camp.id);

                    return (
                      <div 
                        key={camp.id}
                        className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                          isAttached 
                            ? 'bg-[#10b981]/10 border-[#10b981]/30 shadow-sm' 
                            : 'bg-white/[0.02] border-white/[0.06] opacity-70'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{camp.name}</span>
                            <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                              camp.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.1] text-slate-400'
                            }`}>
                              {camp.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {camp.leads} Prospects enrolled • Pool Allocation: <strong className="text-slate-200">{camp.dailyShare}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleCampaignAssignment(camp.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                            isAttached ? 'bg-gradient-to-r from-[#059669] to-[#10b981]' : 'bg-slate-700'
                          }`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            isAttached ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* DRAWER FOOTER (SAVE ACTIONS) */}
        {/* ========================================================================= */}
        <div className="p-5 border-t border-white/[0.08] bg-[#171717]/90 backdrop-blur-xl flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {saveToast && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Changes Saved!
              </span>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="btn-reachops-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg shadow-[#a31c1b]/25 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
