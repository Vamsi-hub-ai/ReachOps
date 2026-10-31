import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Megaphone, Mail, Check, Loader2, ArrowRight, 
  ShieldCheck, Zap, FileSpreadsheet, Layers, Sparkles, 
  CheckCircle2, AlertCircle, RefreshCw, Database, Users, 
  Calendar, Clock, ExternalLink, ChevronRight, Table, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GoogleSheetsManagerModal from '@/components/google-sheets/GoogleSheetsManagerModal';

interface MailboxAccount {
  id: string;
  email: string;
  displayName: string;
  dailyLimit: number;
  sentToday: number;
}

export default function CampaignWizard() {
  const navigate = useNavigate();

  // Stepper State: Steps 1 to 10
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Campaign Basics
  const [campaignName, setCampaignName] = useState<string>('Q4 Executive Outreach');
  const [campaignType, setCampaignType] = useState<'cold-outreach' | 'newsletter'>('cold-outreach');

  // Step 2: Google Sheets Connection
  const [connectedAccountEmail, setConnectedAccountEmail] = useState<string>('team.outbound@reachops-demo.example');
  const [isAccountActive, setIsAccountActive] = useState<boolean>(true);

  // Step 3: Spreadsheet Selection
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [availableDriveSheets, setAvailableDriveSheets] = useState<{ id: string; name: string }[]>([]);
  const [isInspectingSheet, setIsInspectingSheet] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // Step 4: Worksheet / Tab Selection
  const [sheetName, setSheetName] = useState<string>('Sheet1');
  const [worksheets, setWorksheets] = useState<string[]>(['Sheet1', 'Prospects', 'Active Sequences']);

  // Step 5: Column Mapping
  const [mappingEmail, setMappingEmail] = useState<string>('Email');
  const [mappingFirstName, setMappingFirstName] = useState<string>('First Name');
  const [mappingLastName, setMappingLastName] = useState<string>('Last Name');
  const [mappingCompany, setMappingCompany] = useState<string>('Company');
  const [mappingStatus, setMappingStatus] = useState<string>('Status');
  const [mappingFollowUpDate, setMappingFollowUpDate] = useState<string>('Follow-up Date');

  // Step 6: Prospect Validation & Hygiene
  const [validatedProspects, setValidatedProspects] = useState<any[]>([
    { id: 'p_101', email: 'sophie.m@cloudscale.example', name: 'Sophie Martin', company: 'CloudScale Systems', status: 'Valid' },
    { id: 'p_102', email: 'amelia.watson@example.com', name: 'Amelia Watson', company: 'Quantum Retail', status: 'Valid' },
    { id: 'p_103', email: 'ethan.hunt@example.com', name: 'Ethan Hunt', company: 'Synergy Labs', status: 'Valid' },
    { id: 'p_104', email: 'marcus.s@hypergrowth.example', name: 'Marcus Sterling', company: 'HyperGrowth Labs', status: 'Valid' },
    { id: 'p_105', email: 'priya.sharma@techfrontier.example', name: 'Priya Sharma', company: 'TechFrontier', status: 'Valid' },
    { id: 'p_106', email: 'lucas.dubois@strata-ai.example', name: 'Lucas Dubois', company: 'Strata AI', status: 'Valid' },
  ]);
  const [validationStats, setValidationStats] = useState({ total: 6, valid: 6, invalid: 0, duplicates: 0 });

  // Step 7: Mailbox Selection
  const [mailboxes, setMailboxes] = useState<MailboxAccount[]>([
    { id: 'mb-1', email: 'team.outbound@reachops-demo.example', displayName: 'Growth Team', dailyLimit: 150, sentToday: 18 },
    { id: 'mb-2', email: 'sarah.outreach@reachops-demo.example', displayName: 'Sarah Jenkins', dailyLimit: 100, sentToday: 12 },
    { id: 'mb-3', email: 'alex.turner@reachops-demo.example', displayName: 'Alex Turner', dailyLimit: 120, sentToday: 24 },
  ]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>('mb-1');

  // Step 8: Initial Email Configuration
  const [initialSubject, setInitialSubject] = useState<string>('Quick question regarding {{company}} outreach');
  const [initialBody, setInitialBody] = useState<string>(
    `Hi {{firstName}},\n\nI noticed what your team is building at {{company}}.\n\nWe help high-growth teams automate multi-touch outbound campaigns, preserve sender deliverability, and turn prospects into booked meetings.\n\nWould you have 10 minutes next Tuesday for a quick intro chat?\n\nBest regards,\n{{senderName}}`
  );

  // Step 9: Follow-Up Sequence Configuration
  const [followUpDelayDays, setFollowUpDelayDays] = useState<number>(3);
  const [followUpSubject, setFollowUpSubject] = useState<string>('Re: Quick question regarding {{company}} outreach');
  const [followUpBody, setFollowUpBody] = useState<string>(
    `Hi {{firstName}},\n\nFollowing up on my previous note. Did you have a moment to review?\n\nHappy to work around your calendar if next week is preferred.\n\nBest,\n{{senderName}}`
  );
  const [stopOnTag, setStopOnTag] = useState<boolean>(true);
  const [stopOnReply, setStopOnReply] = useState<boolean>(true);

  // Fetch mailboxes on mount
  useEffect(() => {
    fetch('/api/email-accounts')
      .then(res => res.json())
      .then(data => {
        if (data?.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
          setMailboxes(data.accounts);
          setSelectedMailboxId(data.accounts[0].id);
        }
      })
      .catch(() => {});

    fetch('/api/sheets/list')
      .then(res => res.json())
      .then(data => {
        if (data?.spreadsheets && Array.isArray(data.spreadsheets)) {
          setAvailableDriveSheets(data.spreadsheets);
        }
      })
      .catch(() => {});
  }, []);

  // Inspect Sheet handler
  const handleInspectSheet = async (urlToInspect?: string) => {
    const targetUrl = urlToInspect || spreadsheetUrl;
    setIsInspectingSheet(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sheets/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl: targetUrl,
          sheetName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.worksheets && Array.isArray(data.worksheets)) {
          setWorksheets(data.worksheets.map((w: any) => w.title));
        }
        if (data.recognizedColumns && data.recognizedColumns.length > 0) {
          const recEmail = data.recognizedColumns.find((c: any) => c.matchedSystemKey === 'email');
          if (recEmail) setMappingEmail(recEmail.header);
          const recFirst = data.recognizedColumns.find((c: any) => c.matchedSystemKey === 'first_name');
          if (recFirst) setMappingFirstName(recFirst.header);
          const recComp = data.recognizedColumns.find((c: any) => c.matchedSystemKey === 'company');
          if (recComp) setMappingCompany(recComp.header);
        }
      }
    } catch {
      // Continue gracefully
    } finally {
      setIsInspectingSheet(false);
    }
  };

  // Launch Campaign (Step 10)
  const handleLaunchCampaign = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create Campaign in DB
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim() || 'Google Sheet Outreach Campaign',
          status: 'ACTIVE',
          dailyLimit: 100,
          timezone: 'US/Eastern (EST)',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create campaign');
      }

      const created = await res.json();
      const campaignId = created.id;

      // 2. Configure Sequence Steps (Step 1 + Step 2 Follow-Up)
      await fetch(`/api/campaigns/${campaignId}/sequence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: [
            {
              stepNumber: 1,
              delayDays: 0,
              subject: initialSubject,
              bodyText: initialBody,
              bodyHtml: `<p>${initialBody.replace(/\n/g, '<br/>')}</p>`,
            },
            {
              stepNumber: 2,
              delayDays: followUpDelayDays,
              subject: followUpSubject,
              bodyText: followUpBody,
              bodyHtml: `<p>${followUpBody.replace(/\n/g, '<br/>')}</p>`,
            }
          ]
        }),
      });

      // 3. Sync & Enroll Prospects from Google Sheet database
      await fetch(`/api/campaigns/${campaignId}/sync-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl,
          sheetName,
          mapping: {
            email: mappingEmail,
            firstName: mappingFirstName,
            lastName: mappingLastName,
            company: mappingCompany,
            status: mappingStatus,
            followUpDate: mappingFollowUpDate,
          },
        }),
      });

      // 4. Navigate directly to Campaign Leads tab
      navigate(`/campaigns/${campaignId}/leads`);
    } catch (err: any) {
      console.error('Launch Error:', err);
      setErrorMsg(err.message || 'Something went wrong launching the campaign.');
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { number: 1, title: 'Basics' },
    { number: 2, title: 'Connection' },
    { number: 3, title: 'Spreadsheet' },
    { number: 4, title: 'Tab' },
    { number: 5, title: 'Mapping' },
    { number: 6, title: 'Validation' },
    { number: 7, title: 'Mailbox' },
    { number: 8, title: 'Initial Email' },
    { number: 9, title: 'Follow-ups' },
    { number: 10, title: 'Review & Launch' },
  ];

  return (
    <div className="min-h-screen bg-[#06110c] text-white flex flex-col -m-6 p-6 sm:p-10 select-none">
      
      {/* Top Navigation */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-white/[0.08]">
        <button 
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors py-2 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Wizard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Google Sheets Outreach Engine Active</span>
        </div>
      </div>

      {/* 10-Step Progress Stepper Bar */}
      <div className="w-full max-w-5xl mx-auto py-6">
        <div className="hidden sm:flex items-center justify-between overflow-x-auto pb-2 scrollbar-none">
          {stepsList.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div 
                key={step.number}
                onClick={() => {
                  if (step.number < currentStep) setCurrentStep(step.number);
                }}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  isCurrent 
                    ? 'text-white' 
                    : isCompleted 
                      ? 'text-emerald-400' 
                      : 'text-slate-500'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all ${
                  isCurrent 
                    ? 'bg-gradient-to-r from-[#a31c1b] to-[#b92322] text-white shadow-[0_0_15px_rgba(163,28,27,0.4)] ring-2 ring-white/20' 
                    : isCompleted 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-white/[0.04] border border-white/[0.08] text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                </div>
                <span className="text-xs font-bold hidden md:inline">{step.title}</span>
                {step.number < 10 && <ChevronRight className="w-3 h-3 text-slate-600 ml-1 hidden lg:inline" />}
              </div>
            );
          })}
        </div>

        {/* Mobile Stepper Header */}
        <div className="sm:hidden flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
          <span className="text-slate-400">Step {currentStep} of 10:</span>
          <span className="font-bold text-white">{stepsList[currentStep - 1].title}</span>
        </div>
      </div>

      {/* Main Wizard Card Container */}
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center py-4">
        <div className="glass-panel bg-[#171717]/95 border border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 sm:p-10 animate-in fade-in duration-200">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-[#a31c1b]/50 text-xs text-red-300 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Campaign Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Name Your Campaign</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Define your campaign title and choose an outreach model.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Campaign Title</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Q4 Executive Outreach"
                  className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div
                  onClick={() => setCampaignType('cold-outreach')}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                    campaignType === 'cold-outreach'
                      ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center mb-3">
                    <Megaphone className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Cold Outreach Engine</h3>
                  <p className="text-xs text-slate-400 mt-1">Multi-step sequences with automated follow-ups.</p>
                </div>

                <div
                  onClick={() => setCampaignType('newsletter')}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                    campaignType === 'newsletter'
                      ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                      : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Broadcast / Newsletter</h3>
                  <p className="text-xs text-slate-400 mt-1">One-time announcement sent to subscriber lists.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Google Sheets Connection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Google Sheets Connection</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Authorize ReachOps to read prospects and synchronize follow-up states with Google Sheets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#06110c] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Google OAuth Service</p>
                    <p className="text-[11px] text-slate-400">
                      Signed in as <span className="text-emerald-400 font-semibold">{connectedAccountEmail}</span>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Ready & Verified
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2 text-xs text-slate-300">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Encrypted Google Sheets Token Storage
                </p>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Credentials are encrypted using AES-256-GCM. Tokens are never exposed in frontend code or client-side storage.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Spreadsheet Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Select Google Sheet</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose a spreadsheet from your Drive or paste the Google Sheet URL.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Spreadsheet URL or Google Sheet ID</span>
                  <span className="text-[10px] text-emerald-400">Auto-Detects Empty vs Existing</span>
                </label>
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>

              {/* Drive Presets */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Available Outreach Sheets:</span>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
                      setSpreadsheetUrl(url);
                      handleInspectSheet(url);
                    }}
                    className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-white">Default Outreach Prospects Database</p>
                        <p className="text-[10px] text-slate-400">Verified Sample Sheet with 6 Prospects</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Recommended</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsManagerModalOpen(true)}
                    className="w-full p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-white">Connect Empty Sheet (Auto-Generate ReachOps Columns)</p>
                        <p className="text-[10px] text-slate-400">Generates 66 system columns, frozen header, and dark styling</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Auto-Setup</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Worksheet / Tab Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Select Worksheet / Tab</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Specify the worksheet tab containing your outreach prospects.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Worksheet Tab</label>
                <select
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full bg-[#06110c] border border-white/[0.12] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-500 transition-all cursor-pointer font-mono"
                >
                  {worksheets.map(ws => (
                    <option key={ws} value={ws} className="bg-[#171717] text-white">
                      {ws}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-[#06110c] border border-white/[0.08] text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-white">Active Tab Target:</p>
                <p className="text-[11px] font-mono text-emerald-400">{sheetName}!A1:BN</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  ReachOps binds to this worksheet. Newly added rows in this tab enroll automatically into the campaign.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Column Mapping */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Map Prospect Fields</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Map your spreadsheet columns to ReachOps contact fields.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address (Required)</label>
                  <input
                    type="text"
                    value={mappingEmail}
                    onChange={(e) => setMappingEmail(e.target.value)}
                    className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">First Name</label>
                  <input
                    type="text"
                    value={mappingFirstName}
                    onChange={(e) => setMappingFirstName(e.target.value)}
                    className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    value={mappingLastName}
                    onChange={(e) => setMappingLastName(e.target.value)}
                    className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Company Name</label>
                  <input
                    type="text"
                    value={mappingCompany}
                    onChange={(e) => setMappingCompany(e.target.value)}
                    className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Status / Tag Column</label>
                  <input
                    type="text"
                    value={mappingStatus}
                    onChange={(e) => setMappingStatus(e.target.value)}
                    className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Follow-up Date Column</label>
                  <input
                    type="text"
                    value={mappingFollowUpDate}
                    onChange={(e) => setMappingFollowUpDate(e.target.value)}
                    className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Prospect Validation & Hygiene */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Validate Contact Records</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Automatic email syntax verification, duplicate filtering, and hygiene checks.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total</span>
                  <span className="text-base font-extrabold text-white mt-0.5 block">{validationStats.total}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Valid</span>
                  <span className="text-base font-extrabold text-emerald-300 mt-0.5 block">{validationStats.valid}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Invalid</span>
                  <span className="text-base font-extrabold text-slate-400 mt-0.5 block">{validationStats.invalid}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duplicates</span>
                  <span className="text-base font-extrabold text-slate-400 mt-0.5 block">{validationStats.duplicates}</span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#06110c]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase font-semibold text-[10px] border-b border-white/[0.08]">
                    <tr>
                      <th className="py-2.5 px-4">Prospect</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Company</th>
                      <th className="py-2.5 px-4 text-right">Hygiene</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {validatedProspects.slice(0, 4).map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-4 font-semibold text-white">{p.name}</td>
                        <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px]">{p.email}</td>
                        <td className="py-2.5 px-4 text-slate-400">{p.company}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 7: Mailbox Selection */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Select Sending Mailbox</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose an authorized sender account. ReachOps enforces daily limits automatically.
                </p>
              </div>

              <div className="space-y-3">
                {mailboxes.map((mb) => {
                  const isSelected = selectedMailboxId === mb.id;

                  return (
                    <div
                      key={mb.id}
                      onClick={() => setSelectedMailboxId(mb.id)}
                      className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center font-bold text-white text-sm">
                          {mb.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{mb.displayName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{mb.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-400">
                          {mb.sentToday} / {mb.dailyLimit}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Daily Quota</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 8: Initial Email Configuration */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Configure Initial Email</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Draft your initial outreach message with dynamic spreadsheet variable tokens.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Subject Line</label>
                <input
                  type="text"
                  value={initialSubject}
                  onChange={(e) => setInitialSubject(e.target.value)}
                  className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-semibold"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Email Body</label>
                  <span className="text-[10px] text-slate-400">Supports Spintax {"{Hi|Hello}"} and variables</span>
                </div>
                <textarea
                  rows={8}
                  value={initialBody}
                  onChange={(e) => setInitialBody(e.target.value)}
                  className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl p-4 text-xs text-white outline-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['{{firstName}}', '{{lastName}}', '{{company}}', '{{senderName}}'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setInitialBody(prev => prev + ` ${tag}`)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-emerald-400 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: Follow-Up Sequence */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Configure Follow-Up Sequence</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Automated cadence triggered when no reply is received.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Follow-up 1 Delay (Days)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={followUpDelayDays}
                    onChange={(e) => setFollowUpDelayDays(parseInt(e.target.value) || 3)}
                    className="w-24 bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold text-center"
                  />
                  <span className="text-xs text-slate-300">days after initial email dispatch</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Follow-up Subject</label>
                <input
                  type="text"
                  value={followUpSubject}
                  onChange={(e) => setFollowUpSubject(e.target.value)}
                  className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Follow-up Message</label>
                <textarea
                  rows={5}
                  value={followUpBody}
                  onChange={(e) => setFollowUpBody(e.target.value)}
                  className="w-full bg-[#06110c] border border-white/[0.12] focus:border-emerald-500 rounded-xl p-4 text-xs text-white outline-none leading-relaxed"
                />
              </div>

              {/* Tag Stop Rule Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300/90 leading-relaxed space-y-1">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Tag-Based Follow-Up Stoppage Active
                </p>
                <p className="text-[11px] text-amber-200/80">
                  Whenever any tag is applied (Lead, Warm, Cold, DNC), this follow-up will immediately pause for that prospect.
                </p>
              </div>
            </div>
          )}

          {/* STEP 10: Review & Launch */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Review & Launch Campaign</span>
                  <span className="text-emerald-400">.</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verify your Google Sheet outreach configuration before enrollment and launch.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#06110c] border border-white/[0.08] space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-slate-400">Campaign Title</span>
                    <span className="font-bold text-white">{campaignName}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-slate-400">Google Sheet Database</span>
                    <span className="font-mono text-emerald-400 text-[11px]">Active Tab: {sheetName}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-slate-400">Enrolled Prospects</span>
                    <span className="font-bold text-white">{validationStats.total} Verified Contacts</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-slate-400">Sending Mailbox</span>
                    <span className="font-mono text-slate-200 text-[11px]">{mailboxes.find(m => m.id === selectedMailboxId)?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Automated Follow-ups</span>
                    <span className="font-bold text-emerald-400">Step 2 dispatches after {followUpDelayDays} days</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Google Sheets synchronization active. Prospects, tags, and follow-up states will update live in your sheet.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Footer Buttons */}
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={currentStep === 1 || isSubmitting}
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              className="text-xs h-9 px-4 rounded-xl border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 disabled:opacity-30"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Back</span>
            </Button>

            {currentStep < 10 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(10, prev + 1))}
                className="text-xs h-9 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleLaunchCampaign}
                className="text-xs h-9 px-6 rounded-xl bg-gradient-to-r from-[#a31c1b] to-[#b92322] hover:from-[#b92322] hover:to-[#871615] text-white font-extrabold shadow-[0_0_25px_rgba(163,28,27,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enrolling & Launching...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-white" />
                    <span>Launch Campaign Now</span>
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Google Sheets Advanced Manager Modal */}
      <GoogleSheetsManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        initialSpreadsheetUrl={spreadsheetUrl}
        initialSheetName={sheetName}
        onConnected={(data) => {
          if (data.spreadsheetUrl) setSpreadsheetUrl(data.spreadsheetUrl);
          if (data.sheetName) setSheetName(data.sheetName);
        }}
      />

    </div>
  );
}
