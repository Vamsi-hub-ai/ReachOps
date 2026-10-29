import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Mail, Zap, Target, Inbox, BarChart3, CheckCircle2, 
  Layers, Sparkles, LineChart, Plus, Check, Users, Code, Minus, 
  ShieldCheck, Flame, Star, ExternalLink, Globe
} from 'lucide-react';

export default function Landing() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#07080E] text-slate-100 font-sans selection:bg-[#9FA0FF]/30 selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#07080E]/85 backdrop-blur-xl border-b border-[#181B30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-[#9FA0FF] rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-500/25">
                <Mail className="text-[#07080E] w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white group-hover:text-[#9FA0FF] transition-colors">
                ReachOps
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-8 text-sm font-medium">
              <a href="#features" className="text-slate-300 hover:text-[#9FA0FF] transition-colors">Products</a>
              <a href="#solutions" className="text-slate-300 hover:text-[#9FA0FF] transition-colors">Solutions</a>
              <a href="#pricing" className="text-slate-300 hover:text-[#9FA0FF] transition-colors">Pricing</a>
              <a href="#faq" className="text-slate-300 hover:text-[#9FA0FF] transition-colors">Resources</a>
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
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-[#07080E]">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-[120px] opacity-70 -translate-y-1/3"></div>
          <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-[100px] opacity-60"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Copy */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131526] border border-[#252948] text-[#9FA0FF] text-xs font-semibold mb-6 shadow-inner">
                <span className="flex h-2 w-2 rounded-full bg-[#9FA0FF] animate-pulse"></span>
                The #1 AI Cold Email Outreach Platform
              </div>

              <h1 className="text-5xl lg:text-[4.2rem] font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                Scale your outreach <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9FA0FF] via-indigo-300 to-purple-400">
                  without losing the human touch.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
                Automate hyper-personalized cold email sequences, ensure maximum sender deliverability, and handle replies in a unified inbox powered by AI.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <Link 
                  to="/signup" 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Start for free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto bg-[#121422] hover:bg-[#181B2E] text-slate-200 border border-[#232745] hover:border-[#9FA0FF]/40 px-8 py-4 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  View Demo
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs sm:text-sm text-slate-400 font-medium mb-10">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14-day free trial
                </span>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-[#181B30]">
                <div className="flex -space-x-3">
                  <img className="w-9 h-9 rounded-full border-2 border-[#07080E] object-cover" src="https://i.pravatar.cc/100?img=1" alt="User" />
                  <img className="w-9 h-9 rounded-full border-2 border-[#07080E] object-cover" src="https://i.pravatar.cc/100?img=2" alt="User" />
                  <img className="w-9 h-9 rounded-full border-2 border-[#07080E] object-cover" src="https://i.pravatar.cc/100?img=3" alt="User" />
                  <img className="w-9 h-9 rounded-full border-2 border-[#07080E] object-cover" src="https://i.pravatar.cc/100?img=4" alt="User" />
                </div>
                <div>
                  <div className="flex items-center text-amber-400 text-xs">
                    ★★★★★
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Trusted by 10,000+ high-growth B2B teams</div>
                </div>
              </div>
            </div>

            {/* Right Dashboard Mockup (Black SaaS Theme) */}
            <div className="relative lg:pl-6">
              <div className="absolute -top-10 right-10 text-[#9FA0FF]/80 font-mono text-xs rotate-6 hidden md:block">
                All your outreach in one place ⤵
              </div>
              
              <div className="bg-[#0C0D18] rounded-2xl shadow-2xl shadow-indigo-950/40 border border-[#232745] overflow-hidden flex h-[470px] transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                
                {/* Mock Sidebar */}
                <div className="w-48 bg-[#090A12] border-r border-[#1B1E34] text-white p-4 hidden sm:flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-7 h-7 bg-[#9FA0FF] rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-[#07080E]" />
                    </div>
                    <span className="font-extrabold text-sm tracking-wide text-white">ReachOps</span>
                  </div>
                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="bg-[#1C2038] text-[#9FA0FF] border border-[#2E335C] px-3 py-2 rounded-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                    </div>
                    {['Campaigns', 'Prospects', 'Templates', 'Email Accounts', 'Suppression List', 'Activity Log'].map(item => (
                      <div key={item} className="text-slate-400 hover:text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-default">
                        <div className="w-2 h-2 rounded-sm bg-slate-600"></div> {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock Main Content */}
                <div className="flex-1 bg-[#0E1020] p-6 flex flex-col gap-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-white text-lg">Dashboard</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-slate-300 bg-[#14162B] border border-[#232745] rounded-lg px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                        Last 30 Days <span className="text-[10px]">▼</span>
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-sm font-semibold">+ Create Campaign</div>
                    </div>
                  </div>
                  
                  {/* KPI Cards inside mockup */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Active Campaigns', value: '12', trend: '+12.5%' },
                      { label: 'Total Prospects', value: '4,528', trend: '+8.2%' },
                      { label: 'Emails Sent', value: '12,480', trend: '' },
                      { label: 'Replies', value: '1,048', trend: '' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#121424] p-3.5 rounded-xl border border-[#202442]">
                        <div className="text-[11px] text-slate-400 font-medium mb-1">{stat.label}</div>
                        <div className="text-xl font-bold text-white">{stat.value}</div>
                        {stat.trend && <div className="text-[10px] text-emerald-400 font-semibold mt-1">↑ {stat.trend}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Real-Time Sending Log inside mockup */}
                  <div className="bg-[#121424] rounded-xl border border-[#202442] p-4 flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-white mb-3 flex items-center justify-between">
                      <span>Real-Time Sending Activity</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>
                    <div className="space-y-2.5 text-[11px]">
                      {[
                        { time: '10:42 AM', action: 'Email sent to john@company.com', color: 'bg-indigo-400' },
                        { time: '10:45 AM', action: 'Prospect opened your email', color: 'bg-emerald-400' },
                        { time: '11:02 AM', action: 'Prospect replied: "Let\'s schedule"', color: 'bg-amber-400' },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${log.color} shrink-0`}></div>
                          <div className="text-slate-500 w-16 shrink-0">{log.time}</div>
                          <div className="text-slate-300 truncate">{log.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trusted By Logos Strip */}
      <section className="py-12 bg-[#0A0B14] border-y border-[#181B30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold tracking-widest text-slate-500 uppercase mb-8">
            Powering Outreach for Forward-Thinking B2B Teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-lg font-bold text-slate-300 flex items-center gap-1.5"><span className="text-blue-400">G</span>oogle</span>
            <span className="text-lg font-bold text-slate-300 flex items-center gap-1.5"><span className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 bg-red-400"></div><div className="w-1.5 h-1.5 bg-green-400"></div><div className="w-1.5 h-1.5 bg-blue-400"></div><div className="w-1.5 h-1.5 bg-yellow-400"></div></span> Microsoft</span>
            <span className="text-lg font-bold text-slate-300 flex items-center gap-1.5"><span className="text-purple-400 font-black">#</span> Slack</span>
            <span className="text-lg font-bold text-slate-300 flex items-center gap-1.5"><span className="w-4 h-4 bg-emerald-500 text-white flex items-center justify-center rounded-sm text-[10px]">S</span> Shopify</span>
            <span className="text-lg font-bold text-slate-300 flex items-center gap-1.5"><span className="border border-white/60 rounded px-1 text-[10px]">N</span> Notion</span>
          </div>
        </div>
      </section>

      {/* Core Platform Features Section */}
      <section id="features" className="py-24 bg-[#07080E] relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14162B] border border-[#2B3058] text-[#9FA0FF] text-[11px] font-bold uppercase tracking-wider mb-4">
              Everything in One Engine
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Engineered for Cold Outreach Mastery
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              Combining automated multi-step sequences, native mailbox rotation, and AI personalization to help you close more meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Multi-Step Sequences', desc: 'Build sophisticated automated outreach sequences with custom delays and conditional stops.', color: 'text-[#9FA0FF]', border: 'hover:border-[#9FA0FF]/40' },
              { icon: Zap, title: 'Native Deliverability & Warmup', desc: 'Automatic peer inbox warmup, SPF/DKIM/DMARC health monitoring, and spam prevention.', color: 'text-amber-400', border: 'hover:border-amber-500/40' },
              { icon: Inbox, title: 'Centralized Unified Inbox', desc: 'Consolidate leads and reply to prospect emails across all domains from a single interface.', color: 'text-cyan-400', border: 'hover:border-cyan-500/40' },
              { icon: Sparkles, title: 'AI Copywriter & Spintax', desc: 'Generate unique, high-converting cold pitches and auto-resolve spintax variations.', color: 'text-purple-400', border: 'hover:border-purple-500/40' },
              { icon: Layers, title: 'Smart Inbox Rotation', desc: 'Distribute sending load evenly across Google, Microsoft, and SMTP accounts to avoid burn.', color: 'text-blue-400', border: 'hover:border-blue-500/40' },
              { icon: LineChart, title: 'Real-Time Analytics', desc: 'Live reporting for opens, clicks, replies, and sentiment detection on every sequence.', color: 'text-emerald-400', border: 'hover:border-emerald-500/40' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl bg-[#0E1020] border border-[#1E223D] ${feature.border} transition-all hover:-translate-y-1 group shadow-lg`}
              >
                <div className="w-11 h-11 rounded-xl bg-[#14162B] border border-[#252948] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions / Campaign Workflow Section */}
      <section id="solutions" className="py-24 bg-[#0A0B14] relative overflow-hidden border-t border-[#181B30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">How ReachOps Works</h2>
            <p className="text-slate-400 text-sm sm:text-base">Launch, scale, and optimize cold campaigns in minutes, not days.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Dark Mock Table */}
            <div className="bg-[#0E1020] p-6 rounded-2xl shadow-2xl border border-[#202442]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {['All', 'Active', 'Paused'].map((tab, i) => (
                    <div 
                      key={tab} 
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        i === 0 
                          ? 'bg-[#181B30] text-[#9FA0FF] border border-[#2A2E50]' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Create Campaign
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-[#1C2038] uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Campaign Name</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Sent</th>
                      <th className="pb-3">Replies</th>
                      <th className="pb-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181B2E]">
                    {[
                      { name: 'SaaS Founders - US', status: 'Active', sent: '1,180', replies: '124', rate: '10.5%' },
                      { name: 'HR Decision Makers - UK', status: 'Active', sent: '912', replies: '86', rate: '9.4%' },
                      { name: 'Marketing Agencies - AU', status: 'Paused', sent: '620', replies: '52', rate: '8.3%' },
                      { name: 'Enterprise Fintech - Global', status: 'Active', sent: '1,300', replies: '148', rate: '11.3%' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#121424]">
                        <td className="py-3 font-semibold text-white">{row.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300">{row.sent}</td>
                        <td className="py-3 text-slate-300 font-bold">{row.replies}</td>
                        <td className="py-3 text-emerald-400 font-bold">{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Content Column */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 leading-tight">
                Manage Multi-Step Outreach<br />with Zero Guesswork
              </h3>
              <p className="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base">
                Create separate campaigns for targeted market tiers, employ unique personalized templates, rotate multiple inboxes, and measure conversion velocity with granular metrics.
              </p>
              <ul className="space-y-3.5 mb-10 text-sm text-slate-300">
                {[
                  'Automated inbox rotation to avoid provider throttling',
                  'Dynamic variable merging from Google Sheets or CSV',
                  'Built-in smart delay timers & weekend sending protection',
                  'Automatic sequence pause upon prospect response'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup" 
                className="inline-flex items-center gap-2 bg-[#9FA0FF] hover:bg-[#8889FF] text-[#07080E] px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#9FA0FF]/25 hover:-translate-y-0.5"
              >
                Create Your First Campaign <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* AI Writer Section */}
      <section className="py-24 bg-[#07080E] relative border-t border-[#181B30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16192E] border border-[#272B4E] text-[#9FA0FF] text-[11px] font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" /> AI Email Generator
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 leading-tight">
                Write personalized pitches<br />that actually get replies.
              </h3>
              <p className="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base">
                Use AI to generate high-converting email sequences based on your product offer and audience persona. Boost uniqueness with dynamic spintax variations.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link 
                  to="/signup" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  Try AI Copywriter <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {/* Fake AI prompt box */}
              <div className="bg-[#0E1020] p-6 rounded-2xl border border-[#202442] shadow-xl">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#9FA0FF]">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Prompt Assistant
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">GPT-4o Engine</span>
                </div>
                <div className="text-xs text-slate-300 bg-[#090A12] p-3.5 rounded-xl border border-[#1A1D33] mb-4">
                  &quot;Write a 3-sentence consultative cold email to a B2B SaaS founder offering a free deliverability audit with zero pitch.&quot;
                </div>
                <div className="flex justify-end">
                  <span className="text-xs px-4 py-2 rounded-lg bg-[#181B30] text-[#9FA0FF] font-semibold">
                    Generated in 1.2s
                  </span>
                </div>
              </div>
              
              {/* Fake Email preview */}
              <div className="bg-[#0D0F1C] p-6 rounded-2xl border border-[#232745] shadow-2xl text-xs space-y-3">
                <div className="text-slate-400 border-b border-[#1C2038] pb-3">
                  <span className="font-semibold text-white">Subject:</span> Quick observation regarding {'{{company}}'}&apos;s deliverability
                </div>
                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>Hi {'{{firstName}}'},</p>
                  <p>Noticed your sales engineering team is expanding rapidly on LinkedIn. Most fast-growing SaaS teams in your space run into Google 2024 spam filter blocks once outbound scales past 200/day.</p>
                  <p>We built an automated health scanner that tests your DMARC alignment and inbox placement across 50 peer domains. Mind if I send you a 1-page report?</p>
                  <p className="text-slate-400">Best regards,<br/>Alex | ReachOps</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section (Screenshot 2 Redesigned into Black Theme) */}
      <section id="pricing" className="py-24 bg-[#0A0B14] relative border-t border-[#181B30]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16192E] border border-[#272B4E] text-[#9FA0FF] text-[11px] font-bold uppercase tracking-wider mb-4">
              Simple &amp; Transparent Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Plans for every stage of your growth
            </h2>
            <p className="text-slate-400 text-sm">Start small and scale outbound revenue as you grow. No hidden charges.</p>
          </div>

          {/* Toggle Switch */}
          <div className="flex justify-center mb-12">
            <div className="bg-[#121424] p-1 rounded-full inline-flex border border-[#232745] items-center">
              <button 
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
                  !isYearly ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2 text-xs font-bold rounded-full flex items-center gap-1.5 transition-all ${
                  isYearly ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Save 20%</span>
              </button>
            </div>
          </div>

          {/* 3 Pricing Cards (Black SaaS Palette) */}
          <div className="grid md:grid-cols-3 gap-8 items-start">
            
            {/* Starter Plan */}
            <div className="bg-[#0E1020] p-8 rounded-2xl shadow-xl border border-[#202442] hover:border-[#9FA0FF]/40 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Starter</h3>
                <p className="text-xs text-slate-400 mb-6">For individual SDRs &amp; founders</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">${isYearly ? '23' : '29'}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs text-slate-300">
                  {['1,000 active prospects / mo', '1 connected sending inbox', 'Automated email sequences', 'Basic AI copy generator', 'Native warmup engine'].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                to="/signup"
                className="w-full py-3 rounded-xl border border-[#2B3058] text-slate-200 font-bold text-xs hover:text-white hover:bg-[#181B30] transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>

            {/* Growth Plan (Highlighted / Most Popular) */}
            <div className="bg-gradient-to-b from-[#151934] to-[#0E1020] p-8 rounded-2xl shadow-2xl border-2 border-[#9FA0FF] relative transform md:-translate-y-4 flex flex-col justify-between">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#9FA0FF] text-[#07080E] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Growth</h3>
                <p className="text-xs text-[#9FA0FF] mb-6">For expanding outbound teams</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">${isYearly ? '63' : '79'}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs text-slate-200">
                  {[
                    '10,000 active prospects / mo', 
                    '5 connected sending inboxes', 
                    'Multi-mailbox inbox rotation', 
                    'Advanced AI writer + spintax', 
                    'Unified inbox reply manager',
                    'Google Sheets automatic sync',
                    'Priority support'
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                to="/signup"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/30 text-center block"
              >
                Start Free 14-Day Trial
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="bg-[#0E1020] p-8 rounded-2xl shadow-xl border border-[#202442] hover:border-[#9FA0FF]/40 transition-all flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Scale</h3>
                <p className="text-xs text-slate-400 mb-6">For agencies &amp; high-volume sales</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">${isYearly ? '159' : '199'}</span>
                  <span className="text-xs text-slate-400"> / month</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs text-slate-300">
                  {[
                    '50,000 active prospects / mo', 
                    'Unlimited sending accounts', 
                    'Custom tracking domain setup', 
                    'Dedicated IP cluster routing', 
                    'Multi-workspace team roles',
                    'API access & webhooks',
                    'Dedicated deliverability engineer'
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                to="/signup"
                className="w-full py-3 rounded-xl border border-[#2B3058] text-slate-200 font-bold text-xs hover:text-white hover:bg-[#181B30] transition-colors text-center block"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#07080E] relative border-t border-[#181B30]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-10 gap-4 text-center sm:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Frequently Asked Questions</h2>
              <p className="text-slate-400 text-sm">Everything you need to know about ReachOps architecture.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-20 items-start">
            {[
              { q: 'What is ReachOps?', a: 'ReachOps is an enterprise cold email outreach platform that combines AI sequence generation, multi-mailbox inbox rotation, and deliverability monitoring.' },
              { q: 'Can I sync leads directly from Google Sheets?', a: 'Yes! ReachOps syncs prospects directly from any Google Sheet in real time or accepts CSV imports with automatic column mapping.' },
              { q: 'Can I connect multiple Google & Microsoft inboxes?', a: 'Yes. Connect unlimited Google Workspace, Microsoft 365, and custom SMTP/IMAP servers with 1-click OAuth 2.0.' },
              { q: 'How does automated warmup work?', a: 'ReachOps exchanges realistic, gradual emails with verified peer inboxes to build your domain sender score and keep you out of spam.' },
              { q: 'Does sequences stop when a prospect replies?', a: 'Yes! Our unified inbox automatically detects positive and negative replies and pauses all future sequence steps instantly.' },
              { q: 'Is there a free trial?', a: 'Yes, we offer an unrestricted 14-day free trial on all plans. No credit card required to start.' }
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="bg-[#0E1020] p-5 rounded-xl border border-[#202442] cursor-pointer hover:border-[#9FA0FF]/40 transition-all overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  {openFaq === i ? (
                    <Minus className="w-4 h-4 text-[#9FA0FF] shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-[#9FA0FF] shrink-0" />
                  )}
                </div>
                {openFaq === i && (
                  <div className="text-xs text-slate-400 leading-relaxed mt-3 pt-3 border-t border-[#1C2038] animate-in fade-in duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/70 to-purple-950/60 border border-indigo-500/30 rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to supercharge your outbound revenue?
            </h2>
            <p className="text-slate-300 text-sm md:text-base mb-8 max-w-xl mx-auto">
              Join thousands of B2B founders and sales teams closing more deals with ReachOps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Start for free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#05060A] text-slate-400 pt-16 pb-12 border-t border-[#16182B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-xs">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#9FA0FF] rounded-lg flex items-center justify-center">
                  <Mail className="text-[#07080E] w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg text-white">ReachOps</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-xs">
                The premier AI-native email automation platform designed for high-scale B2B outbound pipeline.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Platform</h4>
              <ul className="space-y-2.5">
                <li><a href="#features" className="hover:text-white transition-colors">Multi-Step Sequences</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Inbox Rotation</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Deliverability Warmup</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Unified Inbox</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Integrations</h4>
              <ul className="space-y-2.5">
                <li><a href="/email-accounts" className="hover:text-white transition-colors">Google Workspace</a></li>
                <li><a href="/email-accounts" className="hover:text-white transition-colors">Microsoft 365</a></li>
                <li><a href="/email-accounts" className="hover:text-white transition-colors">Custom SMTP / IMAP</a></li>
                <li><a href="/campaigns" className="hover:text-white transition-colors">Google Sheets Sync</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Company</h4>
              <ul className="space-y-2.5">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Support &amp; FAQ</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#16182B] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-slate-500">© 2026 ReachOps Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
