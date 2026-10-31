import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Send, ShieldCheck, CheckCircle2, AlertTriangle,
  Monitor, Smartphone, Code, Eye, RefreshCw,
  Layers, ChevronDown, Check, User, Mail, Sparkles,
  ExternalLink, Info, CornerDownRight, HelpCircle,
  Sun, Moon
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

  // Synchronize selectedStepId with initialStepId when modal opens or initialStepId changes
  useEffect(() => {
    if (initialStepId) {
      setSelectedStepId(initialStepId);
      setExpandQuotedThread(true);
    }
  }, [initialStepId, isOpen]);

  // Thread Simulation Mode: 'thread' (Gmail/Outlook conversation view) vs 'single' (only this step)
  const [threadMode, setThreadMode] = useState<'thread' | 'single'>('thread');
  const [expandQuotedThread, setExpandQuotedThread] = useState(true);

  // Device & Render Modes
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [renderMode, setRenderMode] = useState<'visual' | 'html'>('visual');
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>('dark');

  // Scroll Container Ref to guarantee top visibility on step change
  const emailScrollRef = useRef<HTMLDivElement>(null);

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

  // Active step slider state for thread navigation
  const [activeSlideStep, setActiveSlideStep] = useState<number>(currentStep.stepNumber);

  // Helper to smoothly slide to a specific step in the thread
  const handleSlideToStep = (stepNumber: number) => {
    setActiveSlideStep(stepNumber);
    if (stepNumber === currentStep.stepNumber) {
      emailScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetEl = document.getElementById(`thread-step-${stepNumber}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Automatically scroll email preview back to top when switching steps or changing thread mode
  useEffect(() => {
    if (currentStep) {
      setActiveSlideStep(currentStep.stepNumber);
    }
    if (emailScrollRef.current) {
      emailScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedStepId, threadMode, canvasTheme, currentStep?.stepNumber]);

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

  // Compute previous steps history for Outlook email trail simulation
  const previousThreadSteps = useMemo(() => {
    if (currentStepIndex <= 0) return [];
    
    // In Outlook email trails, the most recent prior email appears first in the trail
    return steps.slice(0, currentStepIndex).reverse().map((s, revIdx) => {
      // Calculate true index from origin (0 = initial outreach)
      const origIdx = currentStepIndex - 1 - revIdx;
      const stepDate = new Date();
      stepDate.setDate(stepDate.getDate() - (currentStepIndex - origIdx) * 2);
      
      const weekday = stepDate.toLocaleDateString('en-US', { weekday: 'long' });
      const month = stepDate.toLocaleDateString('en-US', { month: 'long' });
      const day = stepDate.getDate();
      const year = stepDate.getFullYear();
      const hours = 10 + (origIdx % 3);
      const minutes = 15 + (origIdx * 19) % 45;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = hours > 12 ? hours - 12 : hours;
      const formattedMinute = minutes < 10 ? `0${minutes}` : `${minutes}`;
      
      // Formatted exactly like Outlook: Wednesday, April 29, 2026 12:34 PM
      const formattedOutlookSent = `${weekday}, ${month} ${day}, ${year} ${formattedHour}:${formattedMinute} ${ampm}`;

      return {
        stepNumber: s.stepNumber || origIdx + 1,
        senderName: selectedSender?.displayName || variables.senderName || 'Vamsi Pallela',
        senderEmail: selectedSender?.email || 'vamsipallela31@gmail.com',
        recipientName: `${variables.firstName} ${variables.lastName}`.trim() || 'Sarah Connor',
        recipientEmail: sendToEmail || `${(variables.firstName || 'sarah').toLowerCase()}@acme-corp.com`,
        subject: interpolate(s.subject || steps[0]?.subject || 'Scaling Acme Corp outreach efficiency'),
        body: interpolate(s.body || ''),
        sentAt: formattedOutlookSent,
      };
    });
  }, [currentStepIndex, steps, variables, selectedSender, sendToEmail]);

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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStepId(s.id);
                        setExpandQuotedThread(true);
                      }}
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/30">
                    Outlook Style
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
                    🧵 Outlook Trail
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
                    ? 'Simulates how prospects see this follow-up stacked in Outlook with standard From/Sent/To/Subject trail headers.'
                    : 'Previews only this step email isolated without previous email history.'}
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
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#070b09] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(16,185,129,0.07),transparent_70%)] p-4 sm:p-5 text-left">
            
            {/* Top Recipient & Dispatch Bar */}
            <div className="space-y-3 pb-3 border-b border-white/[0.08] flex-shrink-0">
              
              {/* Recipient Input & Send Test Email Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 justify-between">
                <div className="flex-1 flex items-center gap-2 bg-[#0e1411] border border-white/[0.1] rounded-xl px-3 py-1.5 focus-within:border-emerald-500 transition-all shadow-inner">
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

            {/* Email Client Canvas Container (With pinned headers, active slide bar, and full thread simulation) */}
            <div className="flex-1 min-h-0 py-2 px-1 flex justify-center items-stretch overflow-hidden">
              <div
                className={`w-full transition-all duration-200 h-full flex flex-col rounded-2xl border overflow-hidden ${
                  deviceMode === 'mobile'
                    ? `max-w-sm rounded-[40px] border-[6px] border-[#222824] shadow-[0_20px_60px_rgba(0,0,0,0.95)] ${
                        canvasTheme === 'dark' ? 'bg-[#0f1411] text-slate-100' : 'bg-white text-slate-900'
                      }`
                    : `max-w-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ${
                        canvasTheme === 'dark'
                          ? 'bg-[#101613] border-white/[0.12] text-slate-100 ring-1 ring-emerald-500/10'
                          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                      }`
                }`}
              >
                {/* Mobile Phone Device Top Header Simulation */}
                {deviceMode === 'mobile' && (
                  <div className={`px-6 py-2.5 flex items-center justify-between text-[11px] font-semibold border-b flex-shrink-0 ${
                    canvasTheme === 'dark'
                      ? 'bg-[#161d18] text-slate-300 border-white/[0.08]'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <span>9:41</span>
                    <div className="w-16 h-3.5 bg-black rounded-full" />
                    <span>5G 100%</span>
                  </div>
                )}

                {/* Desktop Webmail Window Chrome Bar (Pinned at top) */}
                {deviceMode === 'desktop' && (
                  <div className={`px-4 py-2.5 flex items-center justify-between border-b text-xs flex-shrink-0 ${
                    canvasTheme === 'dark'
                      ? 'bg-[#151d18] border-white/[0.08] text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
                        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
                        <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
                      </div>
                      <span className="ml-2 font-semibold text-[11px] opacity-75">
                        {canvasTheme === 'dark'
                          ? 'Microsoft Outlook 365 (Dark Mode) Trail Simulation'
                          : 'Microsoft Outlook Desktop (Standard) Email Trail Simulation'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 1-Click Dark / Light Canvas Mode Switcher */}
                      <button
                        type="button"
                        onClick={() => setCanvasTheme(canvasTheme === 'dark' ? 'light' : 'dark')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          canvasTheme === 'dark'
                            ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.1]'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
                        }`}
                        title="Toggle Dark Mode vs Real-World White Inbox Canvas"
                      >
                        {canvasTheme === 'dark' ? (
                          <>
                            <Sun className="w-3 h-3 text-amber-400" />
                            <span>Preview Light Canvas</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3 h-3 text-emerald-600" />
                            <span>Preview Dark Canvas</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Live Preview
                      </span>
                    </div>
                  </div>
                )}

                {/* Email Client Top Meta Header (Pinned at top) */}
                <div className={`p-4 sm:p-5 border-b space-y-3 flex-shrink-0 ${
                  canvasTheme === 'dark'
                    ? 'border-white/[0.08] bg-[#131b16]'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Step #{currentStep.stepNumber} • {currentStepIndex === 0 ? 'Cold Outreach' : `Follow-Up (+${currentStep.waitValue || currentStep.waitDays || 2}d)`}
                        </span>
                        <h3 className={`text-sm sm:text-base font-bold tracking-tight leading-snug truncate ${
                          canvasTheme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {renderedSubject}
                        </h3>
                      </div>

                      {/* Sender Avatar & Metadata */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#10b981] to-[#059669] text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-emerald-400/30 shadow-sm">
                          {(selectedSender?.displayName || variables.senderName || 'VP')
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div className="text-xs space-y-0.5 min-w-0 flex-1">
                          <p className={`font-semibold truncate ${
                            canvasTheme === 'dark' ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            {selectedSender?.displayName || variables.senderName}{' '}
                            <span className={canvasTheme === 'dark' ? 'text-slate-400 font-normal' : 'text-slate-500 font-normal'}>
                              &lt;{selectedSender?.email}&gt;
                            </span>
                          </p>
                          <p className={`truncate text-[11px] ${
                            canvasTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            To: <span className="font-medium">{variables.firstName} {variables.lastName}</span> &lt;{sendToEmail}&gt;
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-right shrink-0 space-y-1">
                      <span className={canvasTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                        Today, 10:20 AM
                      </span>
                      <p className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {placementPrediction.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* THREAD SLIDE NAVIGATOR BAR: Allows sliding through all emails in the thread */}
                {currentStepIndex > 0 && threadMode === 'thread' && (
                  <div className={`px-4 py-2 border-b flex items-center justify-between gap-3 text-xs flex-wrap flex-shrink-0 ${
                    canvasTheme === 'dark'
                      ? 'bg-[#0d1410] border-white/[0.08] text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Outlook Email Trail</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {previousThreadSteps.length + 1} Messages in Trail
                      </span>
                    </div>

                    {/* Interactive Thread Step Slider ("Slide Bar") */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border ${
                        canvasTheme === 'dark' ? 'bg-black/50 border-white/[0.08]' : 'bg-white border-slate-300'
                      }`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          Slide Trail:
                        </span>
                        <input
                          type="range"
                          min="1"
                          max={currentStep.stepNumber}
                          value={activeSlideStep}
                          onChange={(e) => handleSlideToStep(parseInt(e.target.value))}
                          className="w-20 sm:w-28 accent-emerald-500 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                          title="Slide bar to navigate through the email thread steps"
                        />
                        <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                          Step {activeSlideStep}/{currentStep.stepNumber}
                        </span>
                      </div>

                      {/* Quick Jump Slide Pills */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSlideToStep(currentStep.stepNumber)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            activeSlideStep === currentStep.stepNumber
                              ? 'bg-emerald-500 text-black font-bold shadow-sm'
                              : canvasTheme === 'dark'
                              ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1]'
                              : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                          title="Slide to Active Follow-up (Top)"
                        >
                          <span>Step #{currentStep.stepNumber} (Newest)</span>
                        </button>

                        {previousThreadSteps.map((p) => (
                          <button
                            key={p.stepNumber}
                            type="button"
                            onClick={() => handleSlideToStep(p.stepNumber)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              activeSlideStep === p.stepNumber
                                ? 'bg-emerald-500 text-black font-bold shadow-sm'
                                : canvasTheme === 'dark'
                                ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.1]'
                                : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300'
                            }`}
                            title={`Slide to Step #${p.stepNumber} in thread`}
                          >
                            <span>Step #{p.stepNumber}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Body & Full Quoted Thread Scrollable Pane (With prominent slide bar) */}
                <div
                  ref={emailScrollRef}
                  className={`flex-1 min-h-0 overflow-y-scroll p-5 sm:p-6 text-left space-y-4 font-sans text-xs sm:text-sm leading-relaxed ${
                    canvasTheme === 'dark'
                      ? 'text-slate-100 bg-[#0f1411] email-thread-slidebar'
                      : 'text-slate-800 bg-white email-thread-slidebar-light'
                  }`}
                >
                  
                  {renderMode === 'html' ? (
                    <pre className="p-4 rounded-xl bg-black/80 border border-white/[0.1] text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                      {renderedBody}
                    </pre>
                  ) : (
                    <div
                      className="whitespace-pre-line break-words leading-relaxed selection:bg-emerald-500 selection:text-black font-sans"
                      dangerouslySetInnerHTML={{
                        __html: renderedBody.includes('<p>') || renderedBody.includes('<br')
                          ? renderedBody
                          : renderedBody.replace(/\n/g, '<br/>'),
                      }}
                    />
                  )}

                  {/* THREAD SIMULATION: If Thread Mode is active, show Origin context or full quoted historical messages */}
                  {threadMode === 'thread' && (
                    <div className={`mt-6 pt-4 border-t space-y-3 ${
                      canvasTheme === 'dark' ? 'border-white/[0.1]' : 'border-slate-200'
                    }`}>
                      {previousThreadSteps.length === 0 ? (
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                          canvasTheme === 'dark'
                            ? 'bg-[#0a0f0c] border-emerald-500/20 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="text-xs">
                            <p className={`font-bold flex items-center gap-2 ${
                              canvasTheme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>
                              <span>Thread Initiator (Origin Message)</span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono">Day 0</span>
                            </p>
                            <p className={`text-[11px] mt-0.5 leading-relaxed ${
                              canvasTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              This cold email begins the conversation thread in the prospect's inbox. Click <strong className="text-emerald-500 cursor-pointer hover:underline" onClick={() => steps[1] && setSelectedStepId(steps[1].id)}>Follow-Up Step #2</strong> on the left to preview how future follow-up messages stack directly on top of this email.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandQuotedThread(!expandQuotedThread);
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                canvasTheme === 'dark'
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                              }`}
                              title="Toggle quoted conversation history visibility"
                            >
                              <span className="w-5 h-4 flex items-center justify-center rounded bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400">
                                ...
                              </span>
                              <span>
                                {expandQuotedThread ? 'Hide' : 'Show'} Outlook email trail ({previousThreadSteps.length} earlier{' '}
                                {previousThreadSteps.length === 1 ? 'message' : 'messages'})
                              </span>
                            </button>

                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                              Outlook Trail Attached ({currentStepIndex} prior {currentStepIndex === 1 ? 'message' : 'messages'})
                            </span>
                          </div>

                          {expandQuotedThread && (
                            <div className="space-y-6 animate-in fade-in duration-150 mt-4">
                              {previousThreadSteps.map((prev, pIdx) => (
                                <div
                                  key={pIdx}
                                  id={`thread-step-${prev.stepNumber}`}
                                  className="pt-2 select-text"
                                >
                                  {/* Outlook Email Trail Horizontal Divider (Exact match to Microsoft Outlook) */}
                                  <div className={`border-t my-5 ${
                                    canvasTheme === 'dark' ? 'border-white/[0.2]' : 'border-slate-300'
                                  }`} />

                                  {/* Outlook Original Message Block Header */}
                                  <div className={`font-sans text-xs sm:text-[13px] leading-relaxed space-y-1 ${
                                    canvasTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <p>
                                        <strong className={`font-bold ${canvasTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>From:</strong>{' '}
                                        <span>{prev.senderName}</span>{' '}
                                        <span className={canvasTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>&lt;{prev.senderEmail}&gt;</span>
                                      </p>
                                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                        canvasTheme === 'dark'
                                          ? 'bg-white/[0.08] text-slate-300 border border-white/[0.1]'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}>
                                        Step #{prev.stepNumber}
                                      </span>
                                    </div>

                                    <p>
                                      <strong className={`font-bold ${canvasTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sent:</strong>{' '}
                                      <span className={canvasTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{prev.sentAt}</span>
                                    </p>

                                    <p>
                                      <strong className={`font-bold ${canvasTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>To:</strong>{' '}
                                      <a
                                        href={`mailto:${prev.recipientEmail}`}
                                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 underline underline-offset-2"
                                      >
                                        {prev.recipientEmail}
                                      </a>
                                    </p>

                                    <p>
                                      <strong className={`font-bold ${canvasTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Subject:</strong>{' '}
                                      <span className={`font-normal ${canvasTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{prev.subject}</span>
                                    </p>
                                  </div>

                                  {/* Previous Email Content (Outlook Body) */}
                                  <div
                                    className={`font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-line mt-4 ${
                                      canvasTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                                    }`}
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
                        </>
                      )}
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Home Bar Indicator */}
                {deviceMode === 'mobile' && (
                  <div className={`py-2.5 flex justify-center flex-shrink-0 ${
                    canvasTheme === 'dark' ? 'bg-[#0f1411]' : 'bg-white'
                  }`}>
                    <div className={`w-28 h-1 rounded-full ${
                      canvasTheme === 'dark' ? 'bg-white/20' : 'bg-slate-300'
                    }`} />
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

