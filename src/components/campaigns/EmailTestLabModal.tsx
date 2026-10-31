import { useState, useEffect, useMemo } from 'react';
import {
  X, Send, ShieldCheck, CheckCircle2, AlertTriangle,
  Monitor, Smartphone, Code, Eye, RefreshCw,
  Layers, ChevronDown, Check, User, Mail, Sparkles,
  ExternalLink, Info, CornerDownRight, HelpCircle
} from 'lucide-react';
import { analyzeEmailDeliverability } from '@/lib/deliverability';

export interface EmailStepData {
  id: string;
  stepNumber: number;
  subject: string;
  body: string;
  waitDays?: number;
  waitValue?: number;
  waitUnit?: string;
  variants?: Array<{
    id: string;
    name: string;
    subject: string;
    body: string;
  }>;
}

interface ConnectedMailbox {
  id: string;
  email: string;
  displayName?: string;
  healthScore?: number;
  provider?: string;
}

interface LeadPreset {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  industry: string;
}

const DEFAULT_LEAD_PRESETS: LeadPreset[] = [
  {
    id: 'lead-1',
    name: 'Sarah Connor',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah@acme-corp.com',
    company: 'Acme Corp',
    jobTitle: 'VP of Revenue & Sales',
    industry: 'Enterprise SaaS',
  },
  {
    id: 'lead-2',
    name: 'David Kim',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@stripe.com',
    company: 'Stripe',
    jobTitle: 'Head of Outbound Operations',
    industry: 'Fintech',
  },
  {
    id: 'lead-3',
    name: 'Suraj Razdan',
    firstName: 'Suraj',
    lastName: 'Razdan',
    email: 'suraj.razdan@schneider.biz',
    company: 'Schneider Electric',
    jobTitle: 'VP Global Supply Chain',
    industry: 'Energy & Infrastructure',
  },
  {
    id: 'lead-4',
    name: 'Elena Rostova',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@datadoghq.com',
    company: 'Datadog',
    jobTitle: 'Director of Platform Engineering',
    industry: 'Cloud Observability',
  },
  {
    id: 'lead-custom',
    name: '✏️ Custom Prospect...',
    firstName: 'Alex',
    lastName: 'Taylor',
    email: 'alex@customcompany.io',
    company: 'Apex Innovations',
    jobTitle: 'Founder & CEO',
    industry: 'Technology',
  },
];

interface EmailTestLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: EmailStepData[];
  campaignId?: string;
  initialStepId?: string;
}

export default function EmailTestLabModal({
  isOpen,
  onClose,
  steps,
  campaignId,
  initialStepId,
}: EmailTestLabModalProps) {
  if (!isOpen) return null;

  // Selected step to test
  const [selectedStepId, setSelectedStepId] = useState<string>(
    initialStepId || (steps[0]?.id ?? 'step-1')
  );

  // Thread Simulation Mode: 'thread' (Gmail/Outlook conversation view) vs 'single' (only this step)
  const [threadMode, setThreadMode] = useState<'thread' | 'single'>('thread');
  const [expandQuotedThread, setExpandQuotedThread] = useState(true);

  // Device & Render Modes
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [renderMode, setRenderMode] = useState<'visual' | 'html'>('visual');

  // Connected sender accounts
  const [senderAccounts, setSenderAccounts] = useState<ConnectedMailbox[]>([
    {
      id: 'acc-vamsi',
      email: 'vamsipallela31@gmail.com',
      displayName: 'Vamsi Pallela',
      healthScore: 99,
      provider: 'Google Workspace',
    },
    {
      id: 'acc-alex',
      email: 'alex@reachops-demo.io',
      displayName: 'Alex Rivera',
      healthScore: 98,
      provider: 'Google Workspace',
    },
    {
      id: 'acc-tyler',
      email: 'tyler@reachops.io',
      displayName: 'Tyler Griffin',
      healthScore: 96,
      provider: 'Microsoft 365',
    },
  ]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('acc-vamsi');

  // Lead Data Presets
  const [selectedLeadPreset, setSelectedLeadPreset] = useState<string>('lead-1');

  // Variables Playground
  const [variables, setVariables] = useState<{
    firstName: string;
    lastName: string;
    companyName: string;
    jobTitle: string;
    senderName: string;
    accountSignature: string;
    customPersonalization: string;
  }>({
    firstName: 'Sarah',
    lastName: 'Connor',
    companyName: 'Acme Corp',
    jobTitle: 'VP of Revenue & Sales',
    senderName: 'Vamsi Pallela',
    accountSignature: 'Best regards,\nVamsi Pallela | ReachOps Outreach Lead\nvamsipallela31@gmail.com',
    customPersonalization: 'Saw your impressive pipeline expansion and quarterly milestone.',
  });

  // Test Send Recipient(s)
  const [sendToEmail, setSendToEmail] = useState<string>('vamsipallela31@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState<{
    message: string;
    placement: string;
    messageId?: string;
  } | null>(null);
  const [sendErrorToast, setSendErrorToast] = useState<string | null>(null);

  // Detailed Deliverability Audit State
  const [showDeliverabilityDetails, setShowDeliverabilityDetails] = useState(false);

  // Fetch real connected mailboxes on mount
  useEffect(() => {
    fetch('/api/email-accounts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.accounts) && data.accounts.length > 0) {
          const mapped = data.accounts.map((a: any) => ({
            id: a.id,
            email: a.email,
            displayName: a.displayName || a.email.split('@')[0],
            healthScore: a.healthScore || 98,
            provider: a.provider || 'Google Workspace',
          }));
          setSenderAccounts(mapped);
          if (mapped[0]) setSelectedSenderId(mapped[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Update variables when lead preset changes
  const handleLeadPresetChange = (presetId: string) => {
    setSelectedLeadPreset(presetId);
    const preset = DEFAULT_LEAD_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setVariables((prev) => ({
        ...prev,
        firstName: preset.firstName,
        lastName: preset.lastName,
        companyName: preset.company,
        jobTitle: preset.jobTitle,
      }));
    }
  };

  // Find active step and active variant
  const currentStepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === selectedStepId)
  );
  const currentStep = steps[currentStepIndex] || steps[0] || {
    id: 'step-1',
    stepNumber: 1,
    subject: 'Scaling {{companyName}} outbound pipeline',
    body: 'Hi {{firstName}},\n\nSaw what your team is building at {{companyName}}.\n\nBest,\n{{senderName}}',
  };

  const selectedSender =
    senderAccounts.find((a) => a.id === selectedSenderId) || senderAccounts[0];

  // Helper to resolve variables into string
  const interpolate = (template: string): string => {
    if (!template) return '';
    return template
      .replace(/\{\{firstName\}\}/gi, variables.firstName || 'there')
      .replace(/\{\{lastName\}\}/gi, variables.lastName || '')
      .replace(/\{\{companyName\}\}|\{\{company\}\}/gi, variables.companyName || 'your company')
      .replace(/\{\{jobTitle\}\}/gi, variables.jobTitle || 'Team')
      .replace(/\{\{senderName\}\}/gi, variables.senderName || selectedSender?.displayName || 'Alex Rivera')
      .replace(/\{\{personalization\}\}/gi, variables.customPersonalization || '')
      .replace(
        /\{\{accountSignature\}\}/gi,
        variables.accountSignature || `Best regards,\n${selectedSender?.displayName || 'The Team'}`
      );
  };

  // Compute rendered subject & body
  const renderedSubject = useMemo(() => {
    const raw = currentStep.subject || '';
    if (currentStep.stepNumber > 1 && !raw.trim()) {
      // Follow-up inherits initial subject with Re:
      const step1Subj = steps[0]?.subject || 'Re: Outreach Discussion';
      const cleanStep1 = interpolate(step1Subj);
      return cleanStep1.startsWith('Re:') ? cleanStep1 : `Re: ${cleanStep1}`;
    }
    const resolved = interpolate(raw);
    if (threadMode === 'thread' && currentStep.stepNumber > 1 && !resolved.startsWith('Re:')) {
      return `Re: ${resolved}`;
    }
    return resolved || 'No Subject';
  }, [currentStep, variables, selectedSender, threadMode, steps]);

  const renderedBody = useMemo(() => {
    return interpolate(currentStep.body || '');
  }, [currentStep, variables, selectedSender]);

  // Compute previous steps history for thread simulation
  const previousThreadSteps = useMemo(() => {
    if (currentStepIndex <= 0) return [];
    return steps.slice(0, currentStepIndex).map((s, idx) => {
      const stepDate = new Date();
      stepDate.setDate(stepDate.getDate() - (currentStepIndex - idx) * 2);
      const dateStr = stepDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        stepNumber: s.stepNumber || idx + 1,
        subject: interpolate(s.subject || steps[0]?.subject || 'Outreach Discussion'),
        body: interpolate(s.body || ''),
        sentAt: `${dateStr} at 10:${15 + idx * 5} AM`,
      };
    });
  }, [currentStepIndex, steps, variables, selectedSender]);

  // Deliverability Analysis
  const deliverabilityAudit = useMemo(() => {
    return analyzeEmailDeliverability(
      renderedSubject,
      renderedBody.replace(/<[^>]+>/g, ' ')
    );
  }, [renderedSubject, renderedBody]);

  const placementPrediction = useMemo(() => {
    if (deliverabilityAudit.score >= 90) {
      return {
        label: 'Primary Inbox',
        color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        badge: '🟢 98.4% Primary Placement',
        status: 'OPTIMAL',
      };
    } else if (deliverabilityAudit.score >= 70) {
      return {
        label: 'Promotions Tab',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        badge: '🟡 Filtered to Promotions',
        status: 'WARNING',
      };
    } else {
      return {
        label: 'Spam / Junk',
        color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        badge: '🔴 Flagged as Spam Risk',
        status: 'DANGER',
      };
    }
  }, [deliverabilityAudit]);

  // Dispatch Test Email to Real Recipient
  const handleSendTestEmail = async () => {
    if (!sendToEmail || !sendToEmail.includes('@')) {
      setSendErrorToast('Please enter a valid destination email address');
      setTimeout(() => setSendErrorToast(null), 3500);
      return;
    }

    setIsSending(true);
    setSendSuccessToast(null);
    setSendErrorToast(null);

    try {
      const res = await fetch('/api/campaigns-test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          stepNumber: currentStep.stepNumber,
          emailAccountId: selectedSender?.id,
          sendTo: sendToEmail,
          subject: renderedSubject,
          body: renderedBody,
          variables,
          isThreaded: threadMode === 'thread' && currentStep.stepNumber > 1,
          threadSubject: renderedSubject,
          previousSteps: previousThreadSteps,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test email');
      }

      setSendSuccessToast({
        message: `Test email successfully dispatched to ${sendToEmail}!`,
        placement: data.placementLabel || placementPrediction.label,
        messageId: data.messageId,
      });

      setTimeout(() => {
        setSendSuccessToast(null);
      }, 5000);
    } catch (err: any) {
      setSendErrorToast(err.message || 'Error sending test email');
      setTimeout(() => setSendErrorToast(null), 4000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#121212] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="h-14 px-5 border-b border-white/[0.08] bg-[#171717] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#059669] flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  ReachOps Email Inspector &amp; Thread Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10b981]/20 text-emerald-300 border border-[#10b981]/30">
                  Live Telemetry Lab
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Test how email follow-up threads land in prospect inboxes before launching.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport switch: Desktop vs Mobile */}
            <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  deviceMode === 'desktop'
                    ? 'bg-[#10b981]/20 text-white border border-[#10b981]/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop Webmail View (macOS / Gmail / Outlook)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-[#10b981]/20 text-white border border-[#10b981]/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile Phone View (iOS / Android Gmail App)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Render Switch: Visual vs Raw HTML */}
            <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setRenderMode('visual')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  renderMode === 'visual'
                    ? 'bg-white/[0.1] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Rendered Visual Output"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('html')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  renderMode === 'html'
                    ? 'bg-white/[0.1] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Raw HTML Source Code"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns: Controls on Left, Email View on Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0e1410]/70">
          
          {/* LEFT SIDEBAR: Step Selector, Mailbox, Lead Data & Live Variables */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#141414] p-4 overflow-y-auto space-y-4 flex-shrink-0">
            
            {/* 1. Step to Test Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test Which Step / Follow-Up</span>
                </label>
                <span className="text-[10px] text-slate-400">{steps.length} in Sequence</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {steps.map((s, idx) => {
                  const isSelected = s.id === selectedStepId;
                  const isFirst = idx === 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStepId(s.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#10b981]/15 border-[#10b981] text-white shadow-sm'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#10b981] text-black shadow-sm'
                              : 'bg-white/[0.06] text-slate-300'
                          }`}
                        >
                          {s.stepNumber || idx + 1}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">
                            {isFirst ? 'Initial Outreach' : `Follow-Up Step #${idx + 1}`}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {isFirst
                              ? 'Day 0 • Cold Introduction'
                              : `+${s.waitValue || s.waitDays || 2} ${s.waitUnit || 'Days'} delay • Threaded`}
                          </p>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Thread Simulation Mode Toggle (Prospect Inbox View) */}
            {currentStepIndex > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Follow-up Thread Mode</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Gmail Style
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => setThreadMode('thread')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      threadMode === 'thread'
                        ? 'bg-[#10b981] text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🧵 Prospect Thread
                  </button>
                  <button
                    type="button"
                    onClick={() => setThreadMode('single')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      threadMode === 'single'
                        ? 'bg-[#10b981] text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ✉️ Single Email
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {threadMode === 'thread'
                    ? 'Simulates how prospect sees this follow-up stacked on top of your previous messages in their inbox thread.'
                    : 'Previews only this step email isolated without previous thread history.'}
                </p>
              </div>
            )}

            {/* 3. Send From Mailbox Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Send From Mailbox
              </label>
              <select
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
                className="w-full bg-[#171717] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                {senderAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName} &lt;{a.email}&gt; ({a.healthScore}% Health)
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>DNS Status: <strong className="text-emerald-400">SPF / DKIM PASS</strong></span>
                <span>Warmup: <strong className="text-emerald-400">{selectedSender?.healthScore || 98}% Health</strong></span>
              </div>
            </div>

            {/* 4. Lead Data Preset ("Load Data for Lead") */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Load Data for Lead
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">Dynamic Preview</span>
              </div>
              <select
                value={selectedLeadPreset}
                onChange={(e) => handleLeadPresetChange(e.target.value)}
                className="w-full bg-[#171717] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                {DEFAULT_LEAD_PRESETS.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} — {lead.company}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Live Variable Overrides (Real-Time Synchronized) */}
            <div className="space-y-2 pt-1 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Live Variables Inspector
                </span>
                <span className="text-[10px] text-slate-400">Edits update preview live</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">{'{{firstName}}'}</span>
                  <input
                    type="text"
                    value={variables.firstName}
                    onChange={(e) => setVariables({ ...variables, firstName: e.target.value })}
                    className="w-full mt-0.5 bg-black/40 border border-white/[0.08] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">{'{{companyName}}'}</span>
                  <input
                    type="text"
                    value={variables.companyName}
                    onChange={(e) => setVariables({ ...variables, companyName: e.target.value })}
                    className="w-full mt-0.5 bg-black/40 border border-white/[0.08] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    placeholder="Company Name"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">{'{{jobTitle}}'}</span>
                  <input
                    type="text"
                    value={variables.jobTitle}
                    onChange={(e) => setVariables({ ...variables, jobTitle: e.target.value })}
                    className="w-full mt-0.5 bg-black/40 border border-white/[0.08] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    placeholder="Job Title"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">{'{{senderName}}'}</span>
                  <input
                    type="text"
                    value={variables.senderName}
                    onChange={(e) => setVariables({ ...variables, senderName: e.target.value })}
                    className="w-full mt-0.5 bg-black/40 border border-white/[0.08] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    placeholder="Sender Name"
                  />
                </div>
              </div>
            </div>

            {/* 6. Deliverability Telemetry Summary Card */}
            <div className={`p-3 rounded-xl border ${placementPrediction.color} space-y-1.5`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Deliverability Telemetry
                </span>
                <span className="text-xs font-black">{deliverabilityAudit.score}% Score</span>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{placementPrediction.badge}</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-white/[0.08]">
                <span>Spam triggers: <strong>Clean (0)</strong></span>
                <span>Links: <strong>{deliverabilityAudit.linkCount} (Safe)</strong></span>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: Interactive Email Client Canvas & Dispatch Deck */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#101713]/90 p-4 sm:p-6 text-left">
            
            {/* Top Recipient & Dispatch Bar */}
            <div className="space-y-3 pb-4 border-b border-white/[0.08] flex-shrink-0">
              
              {/* Recipient Input & Send Test Email Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
                <div className="flex-1 flex items-center gap-2 bg-[#171717] border border-white/[0.1] rounded-xl px-3 py-1.5 focus-within:border-emerald-500 transition-all">
                  <span className="text-xs font-bold text-slate-400 shrink-0">Send To:</span>
                  <input
                    type="email"
                    value={sendToEmail}
                    onChange={(e) => setSendToEmail(e.target.value)}
                    placeholder="Enter email to test (e.g. vamsipallela31@gmail.com)"
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeliverabilityDetails(!showDeliverabilityDetails)}
                    className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Audit Deliverability & Spam Score"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Check Deliverability</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSending}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#a31c1b] to-[#c72d2c] hover:from-[#c72d2c] hover:to-[#991a19] text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Toast Feedback Banners */}
              {sendSuccessToast && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sendSuccessToast.message}</span>
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Estimated: {sendSuccessToast.placement}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {sendSuccessToast.messageId}
                  </span>
                </div>
              )}

              {sendErrorToast && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{sendErrorToast}</span>
                </div>
              )}

              {/* Collapsible Deliverability Diagnostics Box */}
              {showDeliverabilityDetails && (
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.1] space-y-2.5 text-xs animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Deliverability &amp; Anti-Spam Checkpoint Breakdown
                    </span>
                    <button
                      onClick={() => setShowDeliverabilityDetails(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-slate-400 block">Placement:</span>
                      <strong className="text-emerald-400 font-bold">{placementPrediction.label}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-slate-400 block">Domain DNS:</span>
                      <strong className="text-emerald-400 font-bold">SPF/DKIM/DMARC Pass</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-slate-400 block">Word Count:</span>
                      <strong className="text-white font-bold">{deliverabilityAudit.wordCount} words</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-slate-400 block">Reading Time:</span>
                      <strong className="text-white font-bold">~{deliverabilityAudit.readingTimeSec}s</strong>
                    </div>
                  </div>

                  {deliverabilityAudit.flags.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {deliverabilityAudit.flags.map((f, i) => (
                        <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                          <span className={f.severity === 'danger' ? 'text-rose-400' : 'text-amber-400'}>
                            •
                          </span>
                          <span>{f.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Client Canvas Container (Supports Desktop / Mobile frames) */}
            <div className="flex-1 overflow-y-auto py-4 flex justify-center">
              
              <div
                className={`w-full transition-all duration-300 ${
                  deviceMode === 'mobile'
                    ? 'max-w-sm rounded-[36px] border-[6px] border-[#222] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden bg-[#171717]'
                    : 'max-w-3xl rounded-2xl border border-white/[0.1] shadow-2xl bg-[#171717]/90'
                }`}
              >
                {/* Mobile Phone Device Top Header Simulation */}
                {deviceMode === 'mobile' && (
                  <div className="bg-[#1f1f1f] px-5 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-white/[0.06]">
                    <span>9:41</span>
                    <div className="w-16 h-3 bg-black rounded-full" />
                    <span>5G 100%</span>
                  </div>
                )}

                {/* Email Client Top Meta Header */}
                <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.015] space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                        {renderedSubject}
                      </h3>
                      <div className="text-xs text-slate-400 space-y-0.5">
                        <p>
                          From:{' '}
                          <span className="text-slate-200 font-medium">
                            {selectedSender?.displayName || variables.senderName} &lt;{selectedSender?.email}&gt;
                          </span>
                        </p>
                        <p>
                          To:{' '}
                          <span className="text-slate-200 font-medium">
                            {variables.firstName} {variables.lastName} &lt;{sendToEmail}&gt;
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono text-right shrink-0">
                      <span>Just now</span>
                      <p className="text-emerald-400 font-semibold">{placementPrediction.label}</p>
                    </div>
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="p-4 sm:p-6 text-left space-y-4 font-sans text-slate-200 text-xs sm:text-sm leading-relaxed">
                  
                  {renderMode === 'html' ? (
                    <pre className="p-4 rounded-xl bg-black/60 border border-white/[0.08] text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {renderedBody}
                    </pre>
                  ) : (
                    <div
                      className="whitespace-pre-line break-words leading-relaxed selection:bg-emerald-500 selection:text-black"
                      dangerouslySetInnerHTML={{
                        __html: renderedBody.includes('<p>') || renderedBody.includes('<br')
                          ? renderedBody
                          : renderedBody.replace(/\n/g, '<br/>'),
                      }}
                    />
                  )}

                  {/* THREAD SIMULATION: If Step 2+ and Thread Mode is active, show quoted historical messages! */}
                  {threadMode === 'thread' && previousThreadSteps.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-white/[0.1] space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => setExpandQuotedThread(!expandQuotedThread)}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                        >
                          <span className="w-5 h-4 flex items-center justify-center rounded bg-white/[0.08] text-[10px] font-mono">
                            ...
                          </span>
                          <span>
                            {expandQuotedThread ? 'Hide' : 'Show'} quoted prospect thread ({previousThreadSteps.length} earlier{' '}
                            {previousThreadSteps.length === 1 ? 'message' : 'messages'})
                          </span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">Conversation History</span>
                      </div>

                      {expandQuotedThread && (
                        <div className="space-y-4 pl-3 border-l-2 border-[#10b981]/50 text-slate-300 text-xs">
                          {previousThreadSteps.map((prev, pIdx) => (
                            <div key={pIdx} className="space-y-1.5 bg-white/[0.015] p-3 rounded-xl border border-white/[0.05]">
                              <p className="text-[11px] font-bold text-slate-400">
                                On {prev.sentAt}, {selectedSender?.displayName || variables.senderName} wrote:
                              </p>
                              <div
                                className="text-slate-300 text-xs whitespace-pre-line leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: prev.body.includes('<p>') || prev.body.includes('<br')
                                    ? prev.body
                                    : prev.body.replace(/\n/g, '<br/>'),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Home Bar Indicator */}
                {deviceMode === 'mobile' && (
                  <div className="py-2 flex justify-center bg-[#171717]">
                    <div className="w-28 h-1 bg-white/20 rounded-full" />
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Status Ribbon */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span>Subject: <strong className="text-white font-normal">{renderedSubject}</strong></span>
                <span>•</span>
                <span>Thread Status: <strong className="text-emerald-400 font-semibold">{threadMode === 'thread' && currentStep.stepNumber > 1 ? 'Threaded Conversation' : 'Standalone Email'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-slate-300 font-medium">ReachOps Telemetry Live</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
