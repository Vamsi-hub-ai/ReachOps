import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Mail, Zap, Target, Inbox, BarChart3, CheckCircle2, 
  Layers, Sparkles, LineChart, Plus, Check, Users, Minus, 
  ShieldCheck, Flame, ChevronDown, Send, Database, Table,
  Clock, Tag, Calendar, Lock, AlertTriangle, ExternalLink, Globe, FileSpreadsheet
} from 'lucide-react';

export default function Landing() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: '1. What is ReachOps?',
      a: 'ReachOps is an AI-powered B2B email outreach and campaign management platform that helps businesses organize prospects, create personalized email campaigns, automate follow-ups, and monitor outreach performance from one workspace.'
    },
    {
      q: '2. Who should use ReachOps?',
      a: 'ReachOps is designed for B2B sales teams, lead generation agencies, marketing professionals, consultants, freelancers, and businesses that use email outreach to connect with potential customers.'
    },
    {
      q: '3. Can I connect Google Sheets to ReachOps?',
      a: 'Yes. ReachOps is designed to connect Google Sheets as a source for prospect information. Users can organize contacts, map spreadsheet columns, and manage campaign-related data through the platform.'
    },
    {
      q: '4. Can ReachOps automate email follow-ups?',
      a: 'Yes. ReachOps supports configurable multi-step email sequences and follow-up scheduling. Follow-up execution depends on the connected mailbox, campaign settings, and recipient eligibility.'
    },
    {
      q: '5. Can I stop follow-ups when a prospect replies?',
      a: 'Yes. When a reply is successfully detected and matched to the prospect, the corresponding automated follow-up sequence stops immediately to prevent unnecessary additional messages.'
    },
    {
      q: '6. Can I manually schedule the next follow-up?',
      a: 'Yes. Users can schedule an eligible prospect’s next follow-up for a specific date and time. The scheduled message is processed by the background scheduling system.'
    },
    {
      q: '7. Does ReachOps support multiple email accounts?',
      a: 'ReachOps is designed to manage multiple connected sending accounts. Available providers and mailbox limits depend on your subscription plan and implemented integrations.'
    },
    {
      q: '8. Does ReachOps provide email deliverability monitoring?',
      a: 'ReachOps provides tools for checking important email authentication configurations, including SPF, DKIM, DMARC, and MX records. These checks help identify configuration issues but do not guarantee inbox placement.'
    },
    {
      q: '9. Does ReachOps support AI-generated email content?',
      a: 'Yes. The AI Copywriter helps generate outreach drafts, subject lines, and follow-up messages that users can review and personalize before sending.'
    },
    {
      q: '10. Is there a free trial?',
      a: 'ReachOps offers a free-trial option where enabled by the current subscription and registration configuration. Check the pricing section for the current trial duration and eligibility.'
    },
    {
      q: '11. Can I manage multiple campaigns?',
      a: 'Yes. ReachOps is designed to help users create, organize, monitor, and manage multiple outreach campaigns from a centralized dashboard.'
    },
    {
      q: '12. Does ReachOps automatically send emails?',
      a: 'ReachOps can execute configured campaigns and scheduled follow-ups through supported connected mailboxes. Sending is subject to user authorization, provider restrictions, campaign settings, and recipient suppression rules.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#06110c] bg-reachops-cosmic text-slate-100 font-sans selection:bg-[#10b981]/30 selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#171717]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#059669] to-[#10b981] rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg shadow-emerald-500/25">
                <Send className="text-white w-5 h-5 -rotate-12 translate-x-[-1px] translate-y-[-1px]" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                ReachOps<span className="text-emerald-400">.</span>
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-7 text-sm font-medium">
              <a href="#features" className="text-slate-300 hover:text-emerald-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-emerald-400 transition-colors">How It Works</a>
              <a href="#sheets" className="text-slate-300 hover:text-emerald-400 transition-colors">Google Sheets</a>
              <a href="#ai-copywriter" className="text-slate-300 hover:text-emerald-400 transition-colors">AI Writer</a>
              <a href="#pricing" className="text-slate-300 hover:text-emerald-400 transition-colors">Pricing</a>
              <a href="#faq" className="text-slate-300 hover:text-emerald-400 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="btn-reachops-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#a31c1b]/25 transition-all hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#06110c] bg-reachops-cosmic">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-emerald-500/10 via-[#a31c1b]/10 to-transparent rounded-full blur-[120px] opacity-70 -translate-y-1/3"></div>
          <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-gradient-to-tr from-[#a31c1b]/15 via-emerald-600/10 to-transparent rounded-full blur-[100px] opacity-60"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Copy */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-emerald-400 text-xs font-semibold mb-6 shadow-inner">
                <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
                AI-Powered B2B Email Outreach Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
                AI-Powered Email Outreach Software That Turns Prospects Into Conversations
              </h1>

              <div className="space-y-4 mb-8 max-w-xl text-slate-300 leading-relaxed text-sm sm:text-base">
                <p className="font-semibold text-white">
                  Scale Your B2B Outreach Without Losing the Human Touch
                </p>
                <p>
                  Reach more prospects, personalize every conversation, and automate your email follow-ups with ReachOps. Manage campaigns, prospect data, and outreach workflows from one powerful platform designed for modern sales teams.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <Link 
                  to="/signup" 
                  className="w-full sm:w-auto btn-reachops-primary text-white px-8 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg shadow-[#a31c1b]/30"
                >
                  Start Your Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#features" 
                  className="w-full sm:w-auto bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] hover:border-emerald-500/30 px-8 py-4 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  Explore the Platform
                </a>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 text-xs text-slate-400 font-medium mb-8">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> No credit card required*
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Easy campaign setup
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Centralized outreach management
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium pt-3 border-t border-white/[0.08]">
                Built for B2B sales teams, lead generation agencies, consultants, and growing businesses.
              </p>
            </div>

            {/* Right Dashboard Mockup (Black SaaS Theme) */}
            <div className="relative lg:pl-6">
              <div className="absolute -top-10 right-10 text-emerald-400/80 font-mono text-xs rotate-6 hidden md:block">
                All your outreach in one place ⤵
              </div>
              
              <div className="bg-[#171717] rounded-2xl shadow-2xl shadow-black/80 border border-white/[0.09] overflow-hidden flex flex-col h-[490px] transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                {/* Mock Header */}
                <div className="h-12 bg-white/[0.02] border-b border-white/[0.08] flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    <span className="text-[11px] font-bold text-slate-400 ml-2">ReachOps Telemetry</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                  </span>
                </div>

                {/* Mock Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Active Campaigns</span>
                      <p className="text-xl font-extrabold text-white mt-1">3</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">+1 from last month</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Prospects</span>
                      <p className="text-xl font-extrabold text-white mt-1">30</p>
                      <span className="text-[10px] text-slate-400 font-medium">Verified leads</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Outbound Pool</span>
                      <p className="text-xl font-extrabold text-white mt-1">98.6%</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">Operational</span>
                    </div>
                  </div>

                  {/* Mock Activity Chart Preview */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Outbound Progression</span>
                      <span className="text-[10px] text-slate-500 font-mono">Last 30 Days</span>
                    </div>
                    
                    {/* SVG Curve */}
                    <div className="h-28 w-full relative pt-2">
                      <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a31c1b" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#06110c" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M 10,85 C 60,75 100,55 150,60 C 200,65 240,40 280,30 C 320,20 360,10 390,15 L 390,95 L 10,95 Z" 
                          fill="url(#heroGradient)" 
                        />
                        <path 
                          d="M 10,85 C 60,75 100,55 150,60 C 200,65 240,40 280,30 C 320,20 360,10 390,15" 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="2.5" 
                        />
                        <path 
                          d="M 10,90 C 60,82 100,65 150,70 C 200,72 240,48 280,38 C 320,28 360,18 390,20" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2" 
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/[0.06]">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Sent Dispatches</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Delivered &amp; Replied</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: TRUST / INTEGRATIONS STRIP */}
      <section className="py-12 bg-[#171717]/80 border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-extrabold tracking-widest text-emerald-400 uppercase mb-2">
            CONNECT YOUR OUTREACH WORKFLOW
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-xl mx-auto">
            Bring your prospect data and business tools together to simplify your daily outreach operations.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 text-sm font-bold text-slate-300">
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-blue-400 font-black">G</span> Google Workspace
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 bg-red-400"></div><div className="w-1.5 h-1.5 bg-green-400"></div><div className="w-1.5 h-1.5 bg-blue-400"></div><div className="w-1.5 h-1.5 bg-yellow-400"></div></span> Microsoft 365
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Google Sheets
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="text-purple-400 font-black">#</span> Slack
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="w-4 h-4 bg-emerald-500 text-white flex items-center justify-center rounded-sm text-[10px]">S</span> Shopify
            </span>
            <span className="flex items-center gap-2 hover:text-white transition-colors">
              <span className="border border-white/60 rounded px-1 text-[10px]">N</span> Notion
            </span>
          </div>
        </div>
      </section>

      {/* AEO SECTION: REACHOPS AT A GLANCE (Answer Engine Optimization) */}
      <section className="py-20 bg-[#06110c] relative border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              REACHOPS AT A GLANCE
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-4 mb-3">
              Everything You Need to Know About ReachOps
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Direct, verified answers for modern sales leaders, researchers, and AI answer engines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-surface p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all">
              <h3 className="text-base font-bold text-white mb-2.5 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> What is ReachOps?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                ReachOps is an AI-powered B2B email outreach platform that helps businesses manage prospects, create email campaigns, automate follow-ups, connect Google Sheets, and monitor campaign performance from one centralized workspace.
              </p>
            </div>

            <div className="glass-surface p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all">
              <h3 className="text-base font-bold text-white mb-2.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Who is ReachOps for?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                B2B sales teams, lead generation agencies, marketing professionals, consultants, freelancers, and businesses that manage prospect outreach.
              </p>
            </div>

            <div className="glass-surface p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all">
              <h3 className="text-base font-bold text-white mb-2.5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> What makes ReachOps useful?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                It combines prospect management, campaign creation, email automation, AI copywriting, spreadsheet integration, and campaign analytics in one platform.
              </p>
            </div>

            <div className="glass-surface p-6 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all">
              <h3 className="text-base font-bold text-white mb-2.5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Can ReachOps automate follow-ups?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Yes. Users can configure multi-step email sequences, schedule follow-ups, and manage sequence stopping conditions based on prospect activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES OVERVIEW */}
      <section id="features" className="py-24 bg-[#06110c] bg-reachops-cosmic relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              EVERYTHING YOU NEED IN ONE PLATFORM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              Engineered for Smarter B2B Email Outreach
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              From prospect management to automated follow-ups, ReachOps brings your essential outreach workflows together. Spend less time managing repetitive tasks and more time building meaningful business relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-[#171717]/80 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Multi-Step Email Sequences</h3>
              <p className="text-xs font-semibold text-emerald-400 mb-3">Automate Your Follow-Ups Without Losing Personalization</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Create structured email sequences with personalized messages, configurable delays, and automated follow-up steps.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Build multi-step outreach sequences.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Personalize emails using prospect information.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Configure follow-up timing.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Pause or stop sequences based on prospect activity.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Manage multiple campaigns from one dashboard.</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-[#171717]/80 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Email Deliverability Monitoring</h3>
              <p className="text-xs font-semibold text-amber-400 mb-3">Understand and Improve Your Email Deliverability</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Monitor important email authentication settings and identify configuration issues that may affect your sending infrastructure.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> SPF record checks.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> DKIM configuration checks.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> DMARC policy checks.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> MX record verification.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sending account monitoring.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Deliverability troubleshooting guidance.</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-[#171717]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-5 text-cyan-400 group-hover:scale-105 transition-transform">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Centralized Unified Inbox</h3>
              <p className="text-xs font-semibold text-cyan-400 mb-3">Manage Prospect Conversations in One Place</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Keep track of your outreach conversations without constantly switching between multiple email accounts.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> View connected mailbox conversations.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Organize prospect replies.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Manage conversations centrally.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Track communication history.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Respond to prospects from the platform.</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-[#171717]/80 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-5 text-purple-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">AI Email Copywriting</h3>
              <p className="text-xs font-semibold text-purple-400 mb-3">Write Personalized Emails That Start Conversations</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Create professional outreach messages with AI-powered writing assistance.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Generate personalized email drafts.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Create multiple subject-line variations.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Improve email clarity and tone.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Rewrite existing outreach messages.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Generate follow-up email content.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Customize messaging for different audiences.</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-[#171717]/80 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/40 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-5 text-blue-400 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Smart Inbox Rotation</h3>
              <p className="text-xs font-semibold text-blue-400 mb-3">Manage Multiple Sending Accounts</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Organize connected email accounts and configure campaign-level mailbox allocation.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Connect supported email providers.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Assign sending accounts to campaigns.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Configure sending limits.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Monitor account connectivity.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Manage sending account availability.</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl bg-[#171717]/80 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-lg group">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 text-emerald-400 group-hover:scale-105 transition-transform">
                <LineChart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Real-Time Campaign Analytics</h3>
              <p className="text-xs font-semibold text-emerald-400 mb-3">Understand Your Outreach Performance</p>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Monitor campaign activity and measure how prospects engage with your outreach.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Emails sent and provider-accepted counts.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Delivery and bounce reporting where supported.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Reply tracking.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Open and click tracking where enabled.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Campaign performance reports.</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Prospect-level activity history.</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: HOW REACHOPS WORKS */}
      <section id="how-it-works" className="py-24 bg-[#171717]/60 relative border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              SIMPLE SETUP. SMARTER OUTREACH.
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              Launch and Manage B2B Email Campaigns in One Place
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              ReachOps simplifies the process of organizing prospects, creating campaigns, managing sending accounts, and automating follow-ups.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 mb-12">
            {[
              { num: '01', title: 'Connect Prospect Data', desc: 'Import prospects or connect Google Sheets to organize contact information. Map fields and validate lists.' },
              { num: '02', title: 'Create Campaigns', desc: 'Build multi-step follow-up sequences with personalized content and AI writing assistance.' },
              { num: '03', title: 'Configure Mailboxes', desc: 'Connect supported email providers, assign mailboxes to campaigns, and configure limits.' },
              { num: '04', title: 'Automate Follow-Ups', desc: 'Set intervals and sequence rules. Tag prospects, pause sequences, or schedule individual sends.' },
              { num: '05', title: 'Monitor Performance', desc: 'Track dispatches, replies, campaign progress, and prospect interactions through your dashboard.' },
            ].map((step, idx) => (
              <div key={idx} className="glass-surface p-5 rounded-2xl flex flex-col justify-between space-y-3 border border-white/[0.08]">
                <div>
                  <span className="text-2xl font-black text-emerald-400/80 font-mono">{step.num}</span>
                  <h3 className="text-sm font-bold text-white mt-2 mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
                <div className="w-full h-1 rounded-full bg-emerald-500/20 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(idx + 1) * 20}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link 
              to="/signup" 
              className="btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-[#a31c1b]/25"
            >
              Create Your First Campaign <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: GOOGLE SHEETS INTEGRATION */}
      <section id="sheets" className="py-24 bg-[#06110c] bg-reachops-cosmic relative border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              YOUR PROSPECT DATA. YOUR OUTREACH WORKFLOW.
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              Manage B2B Email Outreach Directly From Google Sheets
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
              Already managing your leads in Google Sheets? Bring your prospect data into ReachOps and turn your spreadsheet into an organized outreach workflow. Connect a Google Sheet, map your prospect information, and let ReachOps manage campaign activity and follow-up tracking.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            
            {/* Column A */}
            <div className="glass-surface p-8 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Table className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">What You Can Do</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Connect existing Google Sheets or blank spreadsheets.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Automatically prepare 66 required system columns with frozen headers.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Import and organize prospect information seamlessly.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Map contact fields to campaign personalization variables.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Track email delivery, bounce, and open activity.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Synchronize campaign status and prospect updates in real time.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Manage prospect tags and follow-up scheduling.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Keep your outreach records perfectly organized.</li>
              </ul>
            </div>

            {/* Column B */}
            <div className="glass-surface p-8 rounded-2xl border border-white/[0.08] space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Intelligent Follow-Up Management</h3>
              <p className="text-xs text-slate-400">ReachOps helps you manage prospect follow-ups based on their engagement and status:</p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Apply a tag to immediately pause pending automated follow-ups.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Explicit manual schedule modal to send a follow-up on a chosen date/time.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Stop automated follow-ups permanently when a prospect replies.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Respect unsubscribe, suppression, and bounce status across campaigns.</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Track detailed follow-up activity timestamps and history.</li>
              </ul>
            </div>

          </div>

          <div className="text-center">
            <Link 
              to="/signup" 
              className="btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-[#a31c1b]/25"
            >
              Connect Google Sheets <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: AI EMAIL COPYWRITER */}
      <section id="ai-copywriter" className="py-24 bg-[#171717]/60 relative border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] inline-flex items-center gap-1.5 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> AI-POWERED EMAIL GENERATION
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Write Personalized Outreach Emails That Start Real Conversations
              </h2>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Generic outreach messages rarely communicate why your offer matters. ReachOps AI Copywriter helps you create relevant, professional, and personalized B2B outreach messages based on your target audience and campaign objectives.
              </p>
              
              <div className="space-y-2 text-xs text-slate-300 mb-8">
                <p className="font-bold text-white text-sm mb-2">Create Better Outreach Content:</p>
                <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Generate personalized cold email drafts.</p>
                <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Create compelling subject lines.</p>
                <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Adapt messaging to different industries.</p>
                <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Improve existing email content.</p>
                <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Generate professional follow-up messages.</p>
                <p className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Create different messaging variations.</p>
              </div>

              <Link 
                to="/signup" 
                className="btn-reachops-primary text-white px-7 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#a31c1b]/25 inline-flex items-center gap-2"
              >
                Try AI Copywriter <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* AI Interactive Prompt & Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-surface p-6 rounded-2xl border border-white/[0.08] shadow-xl">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-emerald-400">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Example Outreach Prompt
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">B2B SaaS Context</span>
                </div>
                <div className="text-xs text-slate-200 bg-[#06110c] p-4 rounded-xl border border-white/[0.08] leading-relaxed">
                  &quot;Write a personalized B2B outreach email to a marketing agency owner introducing our email automation platform. Keep the message concise, professional, and focused on their business challenges.&quot;
                </div>
              </div>
              
              <div className="bg-[#171717] p-6 rounded-2xl border border-white/[0.08] shadow-2xl text-xs space-y-3">
                <div className="text-slate-400 border-b border-white/[0.08] pb-3">
                  <span className="font-semibold text-white">Subject:</span> Quick question regarding {'{{company}}'}&apos;s client outbound operations
                </div>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>Hi {'{{firstName}}'},</p>
                  <p>Managing outbound prospecting for multiple agency clients often turns into a messy puzzle of disconnected spreadsheets, burned inboxes, and untracked follow-ups.</p>
                  <p>We built ReachOps to connect directly with your existing Google Sheets databases, rotate mailboxes across Google and Microsoft, and automatically pause sequences the second a client prospect replies.</p>
                  <p>Would you be open to a 10-minute walkthrough this Thursday to see how other agencies automate this workflow?</p>
                  <p className="text-slate-400">Best regards,<br/>ReachOps Outreach Specialist</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7: CAMPAIGN MANAGEMENT */}
      <section className="py-24 bg-[#06110c] bg-reachops-cosmic relative border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              COMPLETE CAMPAIGN CONTROL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              Organize Every Outreach Campaign From One Dashboard
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Managing multiple outreach campaigns shouldn&apos;t require multiple spreadsheets, inboxes, and disconnected tools. ReachOps gives you a centralized workspace to organize campaigns, monitor progress, and manage prospect interactions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { title: 'Create & Manage Campaigns', desc: 'Run distinct initiatives for enterprise, mid-market, and inbound nurture.' },
              { title: 'Organize by Campaign', desc: 'Segment prospects, custom variables, and tags cleanly without mixing data.' },
              { title: 'Multi-Step Sequences', desc: 'Tailor touchpoints with delays, working hours, and weekend suppression.' },
              { title: 'Assign Sending Accounts', desc: 'Allocate specific mailboxes and rotation algorithms to each campaign.' },
              { title: 'Schedule Activities', desc: 'Deliver outreach strictly within target prospect timezones and business days.' },
              { title: 'Monitor Progress', desc: 'Real-time telemetry on sent emails, replies, and follow-up states.' },
              { title: 'Pause, Resume & Stop', desc: 'Full operational control to halt sequences instantly when needed.' },
              { title: 'Prospect-Level History', desc: 'Audit complete email timestamps, message logs, and replies per lead.' },
            ].map((f, i) => (
              <div key={i} className="glass-surface p-5 rounded-xl border border-white/[0.08] space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-400 font-medium">
            Whether you&apos;re managing one campaign or coordinating multiple B2B outreach initiatives, ReachOps helps keep your workflow organized.
          </p>
        </div>
      </section>

      {/* SECTION 8: PRICING */}
      <section id="pricing" className="py-24 bg-[#171717]/80 relative border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              SIMPLE AND TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              Plans for Every Stage of Your Outreach Growth
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Start with the essentials and choose a plan that supports your outreach operations as your business grows.
            </p>
          </div>

          {/* Toggle Switch */}
          <div className="flex justify-center mb-12">
            <div className="bg-[#06110c] p-1 rounded-full inline-flex border border-white/[0.08] items-center">
              <button 
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  !isYearly ? 'btn-reachops-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                  isYearly ? 'btn-reachops-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Save 20%</span>
              </button>
            </div>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 items-start">
            
            {/* Starter Plan */}
            <div className="glass-surface p-8 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">STARTER</h3>
                <p className="text-xs text-slate-400 mb-6">For individuals and small teams getting started with B2B outreach.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">${isYearly ? '23' : '29'}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-3 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 1,000 prospect records per month.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 1 connected sending mailbox.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Basic email campaign management.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Automated follow-up sequences.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> AI email copywriting.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Basic campaign analytics.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Essential outreach management.</li>
                </ul>
              </div>
              <Link 
                to="/signup"
                className="w-full py-3 rounded-xl border border-white/[0.1] text-slate-200 font-bold text-xs hover:text-white hover:bg-white/[0.06] transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>

            {/* Growth Plan (Highlighted) */}
            <div className="glass-surface p-8 rounded-2xl border-2 border-emerald-500/50 relative transform md:-translate-y-3 flex flex-col justify-between shadow-2xl shadow-emerald-500/10">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-[#059669] to-[#10b981] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">GROWTH</h3>
                <p className="text-xs text-emerald-400 mb-6">For growing sales teams and businesses managing multiple outreach campaigns.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">${isYearly ? '63' : '79'}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-3 mb-8 text-xs text-slate-200">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 10,000 prospect records per month.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 5 connected sending mailboxes.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-step automated sequences.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> AI-powered email writing.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Mailbox management and rotation.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Advanced campaign analytics.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unified inbox management.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Google Sheets integration.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Priority support.</li>
                </ul>
              </div>
              <Link 
                to="/signup"
                className="w-full py-3 rounded-xl btn-reachops-primary text-white font-bold text-xs shadow-lg shadow-[#a31c1b]/30 text-center block"
              >
                Start Free 14-Day Trial
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="glass-surface p-8 rounded-2xl border border-white/[0.08] hover:border-emerald-500/30 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">SCALE</h3>
                <p className="text-xs text-slate-400 mb-6">For agencies and businesses managing larger outreach operations.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">${isYearly ? '159' : '199'}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-3 mb-8 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 50,000 prospect records per month.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> 20 connected sending mailboxes.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited campaign creation.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Advanced sequence management.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Campaign-level mailbox assignment.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Advanced analytics and reporting.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-workspace management.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Team collaboration.</li>
                  <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Priority support.</li>
                </ul>
              </div>
              <Link 
                to="/signup"
                className="w-full py-3 rounded-xl border border-white/[0.1] text-slate-200 font-bold text-xs hover:text-white hover:bg-white/[0.06] transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>

          </div>

          <p className="text-center text-xs text-slate-500 mt-10 max-w-2xl mx-auto">
            *Pricing note: Plan limits, mailbox counts, prospect allowances, and included features reflect active workspace quotas. Prospect allowances indicate total verified contacts imported and managed per billing cycle.
          </p>
        </div>
      </section>

      {/* SECTION 9: FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-24 bg-[#06110c] bg-reachops-cosmic relative border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              QUESTIONS &amp; ANSWERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Everything you need to know about ReachOps email outreach software.</p>
          </div>

          <div className="space-y-4 mb-20">
            {faqs.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="glass-surface p-5 rounded-2xl border border-white/[0.08] cursor-pointer hover:border-emerald-500/30 transition-all overflow-hidden"
              >
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm font-bold text-white">{item.q}</span>
                  {openFaq === i ? (
                    <Minus className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </div>
                {openFaq === i && (
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-3 pt-3 border-t border-white/[0.06] animate-in fade-in duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SECTION 10: FINAL CALL TO ACTION */}
          <div className="bg-gradient-to-r from-[#171717] via-[#06110c] to-[#171717] border border-emerald-500/30 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.1] text-emerald-400 text-xs font-semibold mb-4">
              <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
              Start Your Free 14-Day Trial
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to Make Your B2B Outreach More Organized?
            </h2>
            <p className="text-slate-300 text-sm md:text-base mb-4 max-w-2xl mx-auto leading-relaxed">
              Stop managing disconnected outreach workflows. Bring prospect management, email campaigns, personalized messaging, and automated follow-ups together with ReachOps.
            </p>
            <p className="text-slate-400 text-xs md:text-sm mb-8 max-w-xl mx-auto">
              Build better outreach workflows and focus on conversations that matter. Get started with a more organized approach to B2B email outreach.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-xl shadow-[#a31c1b]/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Start Your Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#features" 
                className="w-full sm:w-auto bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] px-8 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                Explore ReachOps
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 11: FOOTER */}
      <footer className="bg-[#05060A] text-slate-400 pt-16 pb-12 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12 text-xs">
            
            {/* Column 1: Brand Info */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-tr from-[#059669] to-[#10b981] rounded-lg flex items-center justify-center shadow-md">
                  <Send className="text-white w-4 h-4 -rotate-12" />
                </div>
                <span className="font-extrabold text-lg text-white">ReachOps<span className="text-emerald-400">.</span></span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-xs">
                AI-Powered B2B Email Outreach &amp; Automation Platform. Organize your prospects, personalize your outreach, and manage automated follow-ups from one centralized workspace.
              </p>
            </div>
            
            {/* Column 2: PRODUCT */}
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">PRODUCT</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/email-outreach-automation" className="hover:text-emerald-400 transition-colors">Email Outreach Software</Link></li>
                <li><Link to="/google-sheets-email-automation" className="hover:text-emerald-400 transition-colors">Google Sheets Integration</Link></li>
                <li><Link to="/email-deliverability-monitoring" className="hover:text-emerald-400 transition-colors">Deliverability Monitoring</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Campaign Management</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Unified Inbox</a></li>
                <li><a href="#ai-copywriter" className="hover:text-white transition-colors">AI Copywriter</a></li>
              </ul>
            </div>

            {/* Column 3: SOLUTIONS */}
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">SOLUTIONS</h4>
              <ul className="space-y-2.5">
                <li><Link to="/email-outreach-automation" className="hover:text-white transition-colors">B2B Lead Generation</Link></li>
                <li><Link to="/email-outreach-automation" className="hover:text-white transition-colors">Sales Outreach</Link></li>
                <li><Link to="/google-sheets-email-automation" className="hover:text-white transition-colors">Marketing Agencies</Link></li>
                <li><Link to="/email-outreach-automation" className="hover:text-white transition-colors">Business Development Teams</Link></li>
                <li><Link to="/google-sheets-email-automation" className="hover:text-white transition-colors">Prospect Management</Link></li>
              </ul>
            </div>

            {/* Column 4: RESOURCES */}
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">RESOURCES</h4>
              <ul className="space-y-2.5">
                <li><Link to="/email-deliverability-monitoring" className="hover:text-white transition-colors">Email Deliverability Guides</Link></li>
                <li><Link to="/email-outreach-automation" className="hover:text-white transition-colors">Cold Email Best Practices</Link></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
                <li><Link to="/google-sheets-email-automation" className="hover:text-white transition-colors">Spreadsheet Automation Docs</Link></li>
              </ul>
            </div>

            {/* Column 5: COMPANY */}
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">COMPANY</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><Link to="/email-deliverability-monitoring" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-slate-500">Copyright © 2026 ReachOps. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#faq" className="text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#faq" className="text-slate-500 hover:text-white transition-colors">Terms of Service</a>
              <a href="#faq" className="text-slate-500 hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
