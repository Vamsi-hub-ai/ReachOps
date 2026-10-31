import { useState } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Copy, ExternalLink, ShieldCheck, 
  Flame, Plane, Globe, Link2, Sparkles, Server, CheckCircle2, 
  AlertTriangle, Info, Lock, Mail, Sliders, RefreshCw, KeyRound,
  Eye, EyeOff, Play, User, HelpCircle, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface AddAccountWizardProps {
  open: boolean;
  onClose: () => void;
  onAccountAdded: (account: any) => void;
  googleClientId?: string;
}

type WizardStep = 
  | 'CATEGORY_SELECT'      // Step 1: Add or Buy (Turnkey vs Connect Existing)
  | 'PROVIDER_SELECT'      // Step 2: Choose Provider (Google, Microsoft, SMTP)
  | 'GOOGLE_STRATEGY'      // Step 3: OAuth vs App Password
  | 'GOOGLE_OAUTH_GUIDE'   // Step 4a: 4-step Google Workspace Admin Setup & OAuth launch
  | 'APP_PASSWORD_GUIDE'   // Step 4b: Google App Password Tutorial & 3-step setup (Image 2)
  | 'APP_PASSWORD_FORM'    // Step 4c: Enter Name, Email & 16-char App Password (Image 3)
  | 'SMTP_FORM'            // Step 4d: Custom SMTP/IMAP form
  | 'TURNKEY_ORDER';       // Step 4e: Pre-warmed / AirMail / DFY configuration

export default function AddAccountWizard({
  open,
  onClose,
  onAccountAdded,
  googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || ''),
}: AddAccountWizardProps) {
  const [step, setStep] = useState<WizardStep>('CATEGORY_SELECT');
  const [copiedClientId, setCopiedClientId] = useState(false);
  const [loadingOAuth, setLoadingOAuth] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Turnkey Order State
  const [turnkeyType, setTurnkeyType] = useState<'PRE_WARMED' | 'AIRMAIL' | 'DFY_GOOGLE'>('PRE_WARMED');
  const [turnkeyCount, setTurnkeyCount] = useState(5);
  const [turnkeySubmitted, setTurnkeySubmitted] = useState(false);

  // App Password Form State (Image 3)
  const [appFirstName, setAppFirstName] = useState('');
  const [appLastName, setAppLastName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [appDailyLimit, setAppDailyLimit] = useState(50);
  const [autoWarmup, setAutoWarmup] = useState(true);
  const [appSubmitting, setAppSubmitting] = useState(false);

  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState({
    email: '',
    displayName: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPass: '',
    useSsl: true,
    dailyLimit: 50,
  });
  const [smtpSubmitting, setSmtpSubmitting] = useState(false);

  if (!open) return null;

  const handleCopyClientId = () => {
    navigator.clipboard.writeText(googleClientId);
    setCopiedClientId(true);
    setTimeout(() => setCopiedClientId(false), 2500);
  };

  const handleLaunchGoogleOAuth = async () => {
    setLoadingOAuth(true);
    try {
      const res = await fetch('/api/auth/google-url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to generate Google authorization URL');
        setLoadingOAuth(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to Google service.');
      setLoadingOAuth(false);
    }
  };

  // Clean 16-character password without spaces
  const cleanPassword = appPassword.replace(/\s+/g, '');
  const isValidAppPassword = cleanPassword.length === 16;

  const handleAppPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appEmail || !cleanPassword) return;

    setAppSubmitting(true);
    try {
      const fullName = `${appFirstName} ${appLastName}`.trim() || appEmail.split('@')[0];
      const res = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: appEmail.trim().toLowerCase(),
          displayName: fullName,
          provider: 'GMAIL',
          dailyLimit: appDailyLimit,
          warmupActive: autoWarmup,
        }),
      });

      if (res.ok) {
        const newAcc = await res.json();
        onAccountAdded(newAcc);
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save account');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating account');
    } finally {
      setAppSubmitting(false);
    }
  };

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpForm.email || !smtpForm.smtpHost) return;

    setSmtpSubmitting(true);
    try {
      const res = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: smtpForm.email,
          displayName: smtpForm.displayName || smtpForm.email.split('@')[0],
          provider: 'SMTP',
          dailyLimit: smtpForm.dailyLimit,
        }),
      });

      if (res.ok) {
        const newAcc = await res.json();
        onAccountAdded(newAcc);
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save custom SMTP account');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting SMTP account');
    } finally {
      setSmtpSubmitting(false);
    }
  };

  // SVGs for clean authentic branding
  const GoogleGIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );

  const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H1z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#171717]/95 border border-white/[0.12] rounded-3xl backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.8)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            {step !== 'CATEGORY_SELECT' && (
              <button
                onClick={() => {
                  if (step === 'PROVIDER_SELECT') setStep('CATEGORY_SELECT');
                  else if (step === 'GOOGLE_STRATEGY') setStep('PROVIDER_SELECT');
                  else if (step === 'GOOGLE_OAUTH_GUIDE') setStep('GOOGLE_STRATEGY');
                  else if (step === 'APP_PASSWORD_GUIDE') setStep('GOOGLE_STRATEGY');
                  else if (step === 'APP_PASSWORD_FORM') setStep('APP_PASSWORD_GUIDE');
                  else if (step === 'SMTP_FORM') setStep('PROVIDER_SELECT');
                  else if (step === 'TURNKEY_ORDER') setStep('CATEGORY_SELECT');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {step === 'CATEGORY_SELECT' && 'Add or Buy Email Accounts'}
                  {step === 'PROVIDER_SELECT' && 'Connect Existing Mailbox'}
                  {step === 'GOOGLE_STRATEGY' && 'Google Workspace Authentication'}
                  {step === 'GOOGLE_OAUTH_GUIDE' && 'Google Workspace Domain Delegation'}
                  {step === 'APP_PASSWORD_GUIDE' && 'App Password Setup Guide'}
                  {step === 'APP_PASSWORD_FORM' && 'Connect via App Password'}
                  {step === 'SMTP_FORM' && 'Connect Custom SMTP / IMAP'}
                  {step === 'TURNKEY_ORDER' && 'Order Turnkey Inboxes'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#10b981]/15 text-emerald-400 border border-white/[0.1]">
                  {step === 'CATEGORY_SELECT' && 'Step 1 of 3'}
                  {step === 'PROVIDER_SELECT' && 'Step 2 of 3'}
                  {step === 'GOOGLE_STRATEGY' && 'Step 3 of 4'}
                  {step === 'GOOGLE_OAUTH_GUIDE' && 'OAuth Setup'}
                  {step === 'APP_PASSWORD_GUIDE' && 'App Pass: Step 1 of 2'}
                  {step === 'APP_PASSWORD_FORM' && 'App Pass: Step 2 of 2'}
                  {step === 'SMTP_FORM' && 'Configuration'}
                  {step === 'TURNKEY_ORDER' && 'Provisioning'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'CATEGORY_SELECT' && 'Select whether to deploy pre-warmed sending inboxes or link your existing domains.'}
                {step === 'PROVIDER_SELECT' && 'Select your mailbox provider for secure, high-deliverability sending.'}
                {step === 'GOOGLE_STRATEGY' && 'Choose between direct API OAuth 2.0 or legacy app password.'}
                {step === 'GOOGLE_OAUTH_GUIDE' && 'Authorize ReachOps in your Google Workspace Admin Console to enable API sending.'}
                {step === 'APP_PASSWORD_GUIDE' && 'Enable 2-Step verification & generate a 16-character App Password in Google.'}
                {step === 'APP_PASSWORD_FORM' && 'Enter your sender name, email, and 16-character Google App Password.'}
                {step === 'SMTP_FORM' && 'Configure custom SMTP sending and IMAP reply-tracking parameters.'}
                {step === 'TURNKEY_ORDER' && 'Ready-to-use mailboxes primed with automated SPF, DKIM, and DMARC.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: CATEGORY SELECTION (Turnkey vs Connect Existing)                  */}
          {/* ========================================================================= */}
          {step === 'CATEGORY_SELECT' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Pre-Warmed Inboxes */}
                <div 
                  onClick={() => {
                    setTurnkeyType('PRE_WARMED');
                    setStep('TURNKEY_ORDER');
                  }}
                  className="group relative p-5 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/30 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
                      <Flame className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Zero Setup
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      Pre-Warmed Inboxes
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Aged domains with established sender reputation and primed SPF/DKIM/DMARC. Ready to send immediately with high inbox placement.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      14 Domains Available
                    </span>
                    <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                      Configure &rarr;
                    </span>
                  </div>
                </div>

                {/* ReachOps AirMail Inboxes */}
                <div 
                  onClick={() => {
                    setTurnkeyType('AIRMAIL');
                    setStep('TURNKEY_ORDER');
                  }}
                  className="group relative p-5 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm group-hover:scale-105 transition-transform">
                      <Plane className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      High Volume • New
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      ReachOps AirMail Clusters
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      High-throughput dedicated sending network engineered for deliverability, dedicated rotating IPs, and zero domain burn.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-cyan-400 font-medium">Up to 5,000 sends / day</span>
                    <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                      Configure &rarr;
                    </span>
                  </div>
                </div>

                {/* DFY Google Accounts */}
                <div 
                  onClick={() => {
                    setTurnkeyType('DFY_GOOGLE');
                    setStep('TURNKEY_ORDER');
                  }}
                  className="group relative p-5 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Turnkey Setup
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      DFY Google Workspace
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Done-for-you Google Workspace accounts registered, DNS records configured (MX, SPF, DKIM, DMARC), and warmed up for you.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-slate-400">Full admin handover</span>
                    <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                      Configure &rarr;
                    </span>
                  </div>
                </div>

                {/* Connect Existing Accounts (Primary BYO) */}
                <div 
                  onClick={() => setStep('PROVIDER_SELECT')}
                  className="group relative p-5 rounded-xl bg-gradient-to-br from-[#151930] to-[#0F1122] border-2 border-[#8789FF]/40 hover:border-[#10b981] hover:shadow-xl hover:shadow-emerald-500/20 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#10b981]/25 to-indigo-600/30 border border-[#10b981]/30 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/15 text-emerald-400 border border-[#10b981]/30">
                      Most Popular • BYO
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      Connect Existing Accounts
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Connect your own Google Workspace, Microsoft 365, or private SMTP/IMAP servers directly via OAuth or credentials.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#23274A] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Unlimited mailboxes</span>
                    <span className="text-emerald-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center">
                      Connect Mailbox &rarr;
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PROVIDER SELECTION (Google vs Microsoft vs SMTP)                  */}
          {/* ========================================================================= */}
          {step === 'PROVIDER_SELECT' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Google Workspace */}
                <button
                  onClick={() => setStep('GOOGLE_STRATEGY')}
                  className="p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-[#10b981] hover:bg-[#16182B] transition-all text-left group flex flex-col justify-between min-h-[170px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1A1D33] border border-[#282C4C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <GoogleGIcon />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                      Google Workspace
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gmail, G Suite, Google Cloud
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                    <span>OAuth 2.0 / App Pass</span>
                    <span>&rarr;</span>
                  </div>
                </button>

                {/* Microsoft 365 / Outlook */}
                <button
                  onClick={() => {
                    alert('Microsoft 365 OAuth is scheduled for next provider release. Please use SMTP / IMAP or Google Workspace for immediate sending.');
                  }}
                  className="p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-blue-400 hover:bg-[#16182B] transition-all text-left group flex flex-col justify-between min-h-[170px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1A1D33] border border-[#282C4C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <MicrosoftIcon />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      Microsoft 365
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Outlook, Exchange Online, Office 365
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-blue-400 font-semibold">
                    <span>Enterprise Exchange</span>
                    <span>&rarr;</span>
                  </div>
                </button>

                {/* Custom SMTP / IMAP */}
                <button
                  onClick={() => setStep('SMTP_FORM')}
                  className="p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-400 hover:bg-[#16182B] transition-all text-left group flex flex-col justify-between min-h-[170px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1A1D33] border border-[#282C4C] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <Server className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                      Custom SMTP / IMAP
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Amazon SES, Mailgun, SendGrid, VPS
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                    <span>Universal Mail Server</span>
                    <span>&rarr;</span>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: GOOGLE STRATEGY (OAuth vs App Password) (Image 1)                 */}
          {/* ========================================================================= */}
          {step === 'GOOGLE_STRATEGY' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              
              <div className="flex items-center gap-3 pb-2 border-b border-white/[0.08]">
                <GoogleGIcon />
                <div>
                  <h3 className="text-sm font-bold text-white">Connect Your Google Account</h3>
                  <p className="text-xs text-slate-400">Gmail / G-Suite • Select a connection protocol</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Strategy A: OAuth 2.0 (Recommended) */}
                <div className="p-5 rounded-xl bg-gradient-to-b from-[#14162B] to-[#0E1020] border-2 border-[#10b981]/50 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-base">OAuth 2.0</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/15 text-emerald-400 border border-[#10b981]/30">
                        Recommended
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 my-4">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Easier to setup (1-click approval)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>More stable and zero sudden disconnects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Available for Google Workspace business accounts</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => setStep('GOOGLE_OAUTH_GUIDE')}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold mt-2 shadow-md shadow-blue-500/25 border-none"
                  >
                    Connect with OAuth
                  </Button>
                </div>

                {/* Strategy B: App Password (Image 1 right card) */}
                <div className="p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white text-base">App Password</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Personal Accounts
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-400 my-4">
                      <li className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Available for personal @gmail.com accounts</span>
                      </li>
                      <li className="flex items-center gap-2 text-red-400/90">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Requires 2-factor authentication enabled</span>
                      </li>
                      <li className="flex items-center gap-2 text-red-400/90">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>More prone to disconnects on password change</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setStep('APP_PASSWORD_GUIDE')}
                    className="w-full h-11 bg-[#16182B] border-[#2A2E4E] text-slate-200 hover:text-white hover:bg-[#1E213A] mt-2 font-semibold"
                  >
                    Connect with App Password
                  </Button>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: GOOGLE OAUTH GUIDE & ADMIN DELEGATION                             */}
          {/* ========================================================================= */}
          {step === 'GOOGLE_OAUTH_GUIDE' && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* Informational Callout */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-blue-500/30 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Google Workspace Domain Delegation</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Google Workspace security requires domain admins to approve third-party applications before mailboxes can send via API. You only need to perform this configuration once per domain.
                    </p>
                  </div>
                </div>
                <a 
                  href="https://support.google.com/a/answer/7281227" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap mt-1"
                >
                  Official Guide <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 4-Step Interactive Guide */}
              <div className="space-y-3">
                
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2E335C] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">Open your Google Workspace Admin Panel</p>
                      <p className="text-[11px] text-slate-400">Navigate to Security &gt; Access and data control &gt; API Controls.</p>
                    </div>
                    <a
                      href="https://admin.google.com/ac/owl/list?tab=apps"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#181B30] hover:bg-[#202442] border border-[#2C315A] text-xs font-semibold text-slate-200 hover:text-white transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      Open Admin Panel <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </a>
                  </div>
                </div>

                {/* Step 2: Client ID Copy */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2E335C] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-white">Click &quot;Configure new app&quot; and search by ReachOps Client ID:</p>
                    
                    {/* Copy Box */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0A0B14] border border-[#252948] font-mono text-xs text-slate-200">
                      <span className="truncate pr-2 select-all text-emerald-400">{googleClientId}</span>
                      <button
                        onClick={handleCopyClientId}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          copiedClientId 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-[#10b981]/15 hover:bg-[#2A2F5A] text-white border border-[#353B6E]'
                        }`}
                      >
                        {copiedClientId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Client ID
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2E335C] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Approve ReachOps with &quot;Trusted&quot; access</p>
                    <p className="text-[11px] text-slate-400">Select ReachOps in the search results, set app access to <strong>Trusted: Can access all Google services</strong>, and save.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2E335C] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Launch OAuth Authorization</p>
                    <p className="text-[11px] text-slate-400">Click the button below to initiate official Google OAuth authorization and link your mailbox.</p>
                  </div>
                </div>

              </div>

              {/* Bottom Launch Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('GOOGLE_STRATEGY')}
                  className="bg-white/[0.04] border-[#252948] text-slate-300 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleLaunchGoogleOAuth}
                  disabled={loadingOAuth}
                  className="bg-[#10b981] hover:bg-[#8889FF] text-[#0B0C15] font-bold px-6 h-11 flex items-center gap-2 shadow-lg shadow-emerald-500/20 border-none"
                >
                  <GoogleGIcon />
                  {loadingOAuth ? 'Launching Google Login...' : 'Authorize & Connect with Google'}
                </Button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4B: APP PASSWORD GUIDE & TUTORIAL (Image 2 Redesigned)               */}
          {/* ========================================================================= */}
          {step === 'APP_PASSWORD_GUIDE' && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* Header with Google Logo */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <GoogleGIcon />
                  <div>
                    <h3 className="text-sm font-bold text-white">Connect Your Google Account Via App Password</h3>
                    <p className="text-xs text-slate-400">Gmail / G-Suite • Step 1: Enable 2-Step Verification &amp; Generate Key</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTutorialModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#181B30] hover:bg-[#202442] border border-[#2B3058] text-xs font-semibold text-emerald-400 hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Watch Tutorial
                </button>
              </div>

              {/* 3 Interactive Steps Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#121424] to-[#0D0E1A] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    App Password Setup Instructions
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Estimated time: 45 seconds</span>
                </div>

                <div className="space-y-3 pt-1">
                  
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-lg bg-[#0B0C16] border border-[#1E223D] flex items-start justify-between gap-3 group hover:border-[#10b981]/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2A2E50] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Go to your Google Account&apos;s{' '}
                          <a 
                            href="https://myaccount.google.com/security" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            Security Settings <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Open the Google Account management portal in your browser.
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://myaccount.google.com/security"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-[#16192E] hover:bg-[#1E2342] text-[11px] font-semibold text-slate-300 hover:text-white transition-colors shrink-0"
                    >
                      Open &rarr;
                    </a>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-lg bg-[#0B0C16] border border-[#1E223D] flex items-start justify-between gap-3 group hover:border-[#10b981]/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2A2E50] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Enable{' '}
                          <a 
                            href="https://myaccount.google.com/signinoptions/two-step-verification" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            2-Step Verification <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Under &quot;How you sign in to Google&quot;, turn on 2-Step Verification if not already active.
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://myaccount.google.com/signinoptions/two-step-verification"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-[#16192E] hover:bg-[#1E2342] text-[11px] font-semibold text-slate-300 hover:text-white transition-colors shrink-0"
                    >
                      Enable 2FA &rarr;
                    </a>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-lg bg-[#0B0C16] border border-[#1E223D] flex items-start justify-between gap-3 group hover:border-[#10b981]/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#1A1D33] border border-[#2A2E50] text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Create an{' '}
                          <a 
                            href="https://myaccount.google.com/apppasswords" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-emerald-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                          >
                            App Password <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Enter <strong>&quot;ReachOps&quot;</strong> as the app name and click <strong>Create</strong>. Google will generate a 16-character code.
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-[#16192E] hover:bg-[#1E2342] text-[11px] font-semibold text-slate-300 hover:text-white transition-colors shrink-0"
                    >
                      Create Code &rarr;
                    </a>
                  </div>

                </div>
              </div>

              {/* Bottom Navigation (Image 2 style) */}
              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('GOOGLE_STRATEGY')}
                  className="bg-white/[0.04] border-[#252948] text-slate-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>

                <Button
                  onClick={() => setStep('APP_PASSWORD_FORM')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 h-10 shadow-lg shadow-blue-600/25 border-none flex items-center gap-2"
                >
                  <span>Next: Enter Password</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4C: APP PASSWORD CREDENTIALS FORM (Image 3 Redesigned)               */}
          {/* ========================================================================= */}
          {step === 'APP_PASSWORD_FORM' && (
            <form onSubmit={handleAppPasswordSubmit} className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              
              {/* Header with Google Logo */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <GoogleGIcon />
                  <div>
                    <h3 className="text-sm font-bold text-white">Connect Your Google Account Via App Password</h3>
                    <p className="text-xs text-slate-400">Gmail / G-Suite • Step 2: Enter Account Credentials</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('APP_PASSWORD_GUIDE')}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Need help generating code?
                </button>
              </div>

              <div className="p-5 rounded-xl bg-[#121424] border border-white/[0.08] space-y-4">
                
                {/* Name & Last Name (Image 3) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> First Name
                    </Label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your first name"
                      value={appFirstName}
                      onChange={(e) => setAppFirstName(e.target.value)}
                      className="w-full h-10 px-3.5 bg-[#0C0D17] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-200">Last Name</Label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      value={appLastName}
                      onChange={(e) => setAppLastName(e.target.value)}
                      className="w-full h-10 px-3.5 bg-[#0C0D17] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Email Address (Image 3) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                  </Label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address (e.g. alex@gmail.com)"
                    value={appEmail}
                    onChange={(e) => setAppEmail(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#0C0D17] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                {/* App Password with Auto-space Trimmer & Show/Hide (Image 3) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" /> App Password
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      {cleanPassword.length > 0 && (
                        <span className={`font-mono font-bold ${isValidAppPassword ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {cleanPassword.length} / 16 characters
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your 16 character app password without spaces"
                      value={appPassword}
                      onChange={(e) => setAppPassword(e.target.value)}
                      className={`w-full h-10 pl-3.5 pr-10 bg-[#0C0D17] border rounded-xl text-xs font-mono text-white focus:outline-none transition-colors placeholder:text-slate-600 ${
                        isValidAppPassword 
                          ? 'border-emerald-500/50 focus:border-emerald-400' 
                          : 'border-white/[0.08] focus:border-emerald-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Enter your 16 character app password <strong className="text-blue-400 font-medium">without any spaces</strong> (e.g. <span className="font-mono text-slate-300">abcdpqrswxyzuvwx</span>).</span>
                    {isValidAppPassword && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" /> Valid Length
                      </span>
                    )}
                  </p>
                </div>

                {/* Additional Cold Outreach Options */}
                <div className="pt-2 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-slate-300">Daily Send Limit</Label>
                      <span className="text-xs font-bold text-emerald-400">{appDailyLimit} / day</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={appDailyLimit}
                      onChange={(e) => setAppDailyLimit(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#232742] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0C0D17] border border-[#1E223D]">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" /> Auto-Enroll Warmup
                      </p>
                      <p className="text-[10px] text-slate-400">Prime inbox deliverability</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoWarmup}
                      onChange={(e) => setAutoWarmup(e.target.checked)}
                      className="rounded border-[#2E335C] bg-[#16182B] text-emerald-400 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              {/* Bottom Action Buttons (Image 3) */}
              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('APP_PASSWORD_GUIDE')}
                  className="bg-white/[0.04] border-[#252948] text-slate-300 hover:text-white h-10 px-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>

                <Button
                  type="submit"
                  disabled={appSubmitting || !appEmail || !isValidAppPassword}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 h-10 shadow-lg shadow-blue-600/25 border-none transition-all flex items-center gap-2"
                >
                  {appSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Connect</span>
                  )}
                </Button>
              </div>

            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4D: CUSTOM SMTP / IMAP FORM                                          */}
          {/* ========================================================================= */}
          {step === 'SMTP_FORM' && (
            <form onSubmit={handleSmtpSubmit} className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-200">Email Address</Label>
                  <input
                    type="email"
                    required
                    placeholder="sales@outreachdomain.com"
                    value={smtpForm.email}
                    onChange={(e) => setSmtpForm({ ...smtpForm, email: e.target.value })}
                    className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-200">Display Name</Label>
                  <input
                    type="text"
                    placeholder="Alex Morgan"
                    value={smtpForm.displayName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, displayName: e.target.value })}
                    className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* SMTP Settings */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" /> Outgoing (SMTP) Configuration
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px] text-slate-400">SMTP Host</Label>
                    <input
                      type="text"
                      required
                      placeholder="smtp.mailgun.org"
                      value={smtpForm.smtpHost}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
                      className="w-full h-9 px-3 bg-[#0A0B14] border border-white/[0.08] rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-400">Port</Label>
                    <input
                      type="text"
                      placeholder="587"
                      value={smtpForm.smtpPort}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: e.target.value })}
                      className="w-full h-9 px-3 bg-[#0A0B14] border border-white/[0.08] rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-400">SMTP Username</Label>
                    <input
                      type="text"
                      placeholder="smtp-user"
                      value={smtpForm.smtpUser}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpUser: e.target.value })}
                      className="w-full h-9 px-3 bg-[#0A0B14] border border-white/[0.08] rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-400">SMTP Password</Label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={smtpForm.smtpPass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtpPass: e.target.value })}
                      className="w-full h-9 px-3 bg-[#0A0B14] border border-white/[0.08] rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* IMAP Settings */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> Incoming (IMAP) for Reply Detection
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px] text-slate-400">IMAP Host</Label>
                    <input
                      type="text"
                      placeholder="imap.mailgun.org"
                      value={smtpForm.imapHost}
                      onChange={(e) => setSmtpForm({ ...smtpForm, imapHost: e.target.value })}
                      className="w-full h-9 px-3 bg-[#0A0B14] border border-white/[0.08] rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-slate-400">Port</Label>
                    <input
                      type="text"
                      placeholder="993"
                      value={smtpForm.imapPort}
                      onChange={(e) => setSmtpForm({ ...smtpForm, imapPort: e.target.value })}
                      className="w-full h-9 px-3 bg-[#0A0B14] border border-white/[0.08] rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('PROVIDER_SELECT')}
                  className="bg-white/[0.04] border-[#252948] text-slate-300 hover:text-white"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={smtpSubmitting}
                  className="bg-[#10b981] hover:bg-[#8889FF] text-[#0A0B14] font-bold px-6 h-10 shadow-lg shadow-emerald-500/20 border-none"
                >
                  {smtpSubmitting ? 'Testing Connection...' : 'Save & Connect SMTP'}
                </Button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4E: TURNKEY / AIRMAIL / DFY CONFIGURATION & ORDER                   */}
          {/* ========================================================================= */}
          {step === 'TURNKEY_ORDER' && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
              {turnkeySubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-in zoom-in-50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Provisioning Request Confirmed!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    We have allocated your {turnkeyCount} sending mailboxes. Our automated infrastructure engine is provisioning DNS records and warming up IP pools. Your mailboxes will appear in your dashboard within minutes.
                  </p>
                  <Button
                    onClick={onClose}
                    className="bg-[#10b981] hover:bg-[#8889FF] text-[#0B0C15] font-bold px-8 h-10 mt-2"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">
                        {turnkeyType === 'PRE_WARMED' && 'Pre-Warmed Inboxes Package'}
                        {turnkeyType === 'AIRMAIL' && 'AirMail Dedicated Cluster Package'}
                        {turnkeyType === 'DFY_GOOGLE' && 'DFY Google Workspace Package'}
                      </h4>
                      <span className="text-xs font-bold text-emerald-400">
                        {turnkeyCount} Inboxes ({turnkeyCount * 40} emails/day capacity)
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Select Mailbox Quantity:</span>
                        <span className="font-bold text-white">{turnkeyCount} Inboxes</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="25"
                        step="1"
                        value={turnkeyCount}
                        onChange={(e) => setTurnkeyCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-[#232742] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-[#20243E] space-y-2.5">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">What&apos;s Included</h5>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Authenticated SPF, DKIM, DMARC</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Automated Custom Tracking Domain</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pre-tested against spam firewalls</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Continuous auto-healing deliverability</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('CATEGORY_SELECT')}
                      className="bg-white/[0.04] border-[#252948] text-slate-300 hover:text-white"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setTurnkeySubmitted(true)}
                      className="bg-[#10b981] hover:bg-[#8889FF] text-[#0A0B14] font-bold px-6 h-10 shadow-lg shadow-emerald-500/20 border-none"
                    >
                      Instant Provision ({turnkeyCount} Accounts)
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Tutorial Video / Walkthrough Popup Dialog */}
      {showTutorialModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#171717]/95 border border-white/[0.12] rounded-3xl backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.8)] shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400 fill-current" />
                How to Generate a Google App Password
              </h3>
              <button 
                onClick={() => setShowTutorialModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Google created <strong>App Passwords</strong> so you can safely authenticate external apps without sharing your real primary password.
              </p>
              
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-2">
                <p className="font-semibold text-white">3 Quick Steps:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>Visit <span className="text-emerald-400 font-mono">myaccount.google.com/apppasswords</span></li>
                  <li>Sign in with your Google email &amp; verify your 2FA prompt.</li>
                  <li>In the <strong>&quot;App name&quot;</strong> field, type <span className="text-white font-semibold">&quot;ReachOps&quot;</span> and click <strong>Create</strong>.</li>
                  <li>Google displays a yellow box with 16 letters: <span className="font-mono text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded">xxxx xxxx xxxx xxxx</span>. Copy it and paste into ReachOps.</li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Tip: Don&apos;t worry about spaces. ReachOps automatically formats the 16 characters for you.</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setShowTutorialModal(false)}
                className="bg-[#10b981] hover:bg-[#8889FF] text-[#0A0B14] font-bold text-xs h-9 px-5"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
