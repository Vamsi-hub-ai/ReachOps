import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Zap, Target, Inbox, BarChart3, CheckCircle2, Layers, Sparkles, LineChart, Plus, Check, Users, Code, Minus } from 'lucide-react';

export default function Landing() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);



  return (
    <div className="min-h-screen bg-white text-brand-dark font-sans selection:bg-brand-teal selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-teal rounded-xl flex items-center justify-center transform rotate-12 transition-transform hover:rotate-0">
                <Mail className="text-white w-5 h-5 -rotate-12" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-brand-indigo">ReachOps</span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-brand-teal transition-colors">Products</a>
              <a href="#solutions" className="text-sm font-medium text-gray-600 hover:text-brand-teal transition-colors">Solutions</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-brand-teal transition-colors">Pricing</a>
              <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-brand-teal transition-colors">Resources</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-brand-indigo hover:text-brand-royal transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="bg-brand-indigo hover:bg-brand-royal text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-brand-indigo/30 hover:shadow-brand-indigo/50">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-brand-light">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-brand-pink/20 to-brand-royal/10 rounded-full blur-[100px] opacity-70 translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-brand-teal/20 to-blue-200/20 rounded-full blur-[80px] opacity-70 -translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-brand-indigo text-xs font-semibold mb-6">
                <span className="flex h-2 w-2 rounded-full bg-brand-teal"></span>
                The #1 AI Email Outreach Platform
              </div>
              <h1 className="text-5xl lg:text-[4rem] font-extrabold tracking-tight text-brand-indigo mb-6 leading-[1.1]">
                Scale your outreach <br />
                <span className="text-brand-teal">
                  without losing the human touch.
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
                Automate your cold email sequences, ensure maximum email deliverability, and manage responses in a unified inbox powered by AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <Link to="/dashboard" className="w-full sm:w-auto bg-brand-teal hover:bg-teal-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-xl shadow-brand-teal/30 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                  Start for free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/dashboard" className="w-full sm:w-auto bg-white hover:bg-gray-50 text-brand-indigo border border-gray-200 px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
                  View Demo
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-sm text-gray-500 font-medium mb-10">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-teal" /> No credit card required</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-teal" /> 14-day free trial</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=1" alt="User" />
                  <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=2" alt="User" />
                  <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=3" alt="User" />
                  <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/100?img=4" alt="User" />
                </div>
                <div>
                  <div className="flex items-center text-yellow-400 text-sm">
                    ★★★★★
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">Trusted by 10,000+ teams</div>
                </div>
              </div>
            </div>

            <div className="relative lg:pl-10">
              <div className="absolute -top-10 right-10 text-brand-indigo/60 font-handwriting text-sm rotate-6 hidden md:block">
                All your outreach in one place ⤵
              </div>
              <div className="bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex h-[460px] transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Sidebar */}
                <div className="w-48 bg-brand-indigo text-white p-4 hidden sm:flex flex-col">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-7 h-7 bg-brand-teal rounded flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm tracking-wide">ReachOps</span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="bg-brand-teal/20 text-brand-teal px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                    </div>
                    {['Campaigns', 'Prospects', 'Templates', 'Email Accounts', 'Suppression List', 'Activity Log'].map(item => (
                      <div key={item} className="text-brand-light/70 hover:text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-default">
                        <div className="w-3.5 h-3.5 border-2 border-current rounded-[4px] opacity-70"></div> {item}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main Content */}
                <div className="flex-1 bg-gray-50/50 p-6 flex flex-col gap-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-brand-indigo text-xl">Dashboard</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-md px-2.5 py-1.5 flex items-center gap-1 shadow-sm">
                        Last 30 Days <span className="text-[10px]">▼</span>
                      </div>
                      <div className="bg-brand-royal text-white text-xs px-3 py-1.5 rounded-md shadow-sm font-medium">+ Create Campaign</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Active Campaigns', value: '12', trend: '+12.5%' },
                      { label: 'Total Prospects', value: '4,528', trend: '+8.2%' },
                      { label: 'Emails Sent', value: '12,480', trend: '' },
                      { label: 'Replies', value: '1,048', trend: '' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-brand-indigo">{stat.value}</div>
                        {stat.trend && <div className="text-xs text-brand-teal font-medium mt-2">↑ {stat.trend}</div>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1">
                     <div className="text-xs font-semibold text-gray-800 mb-3">Real-Time Sending Activity</div>
                     <div className="space-y-3">
                       {[
                         { time: '10:42 AM', action: 'Email sent to john@company.com' },
                         { time: '10:45 AM', action: 'Prospect opened your email', highlight: true },
                         { time: '11:02 AM', action: 'Prospect replied', highlight: true },
                       ].map((log, i) => (
                         <div key={i} className="flex items-center gap-3 text-xs">
                           <div className={`w-2 h-2 rounded-full ${log.highlight ? 'bg-brand-teal' : 'bg-gray-300'}`}></div>
                           <div className="text-gray-400 w-16">{log.time}</div>
                           <div className={log.highlight ? 'text-gray-800 font-medium' : 'text-gray-500'}>{log.action}</div>
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

      {/* Trusted By Logos */}
      <section className="py-12 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold tracking-widest text-gray-400 uppercase mb-8">Trusted by modern B2B teams</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos placeholders, using text since we don't have SVGs readily available, styled to look like logos */}
            <span className="text-xl font-bold text-gray-800 flex items-center gap-1"><span className="text-blue-500">G</span>oogle</span>
            <span className="text-xl font-bold text-gray-800 flex items-center gap-1"><span className="grid grid-cols-2 gap-0.5"><div className="w-2 h-2 bg-red-500"></div><div className="w-2 h-2 bg-green-500"></div><div className="w-2 h-2 bg-blue-500"></div><div className="w-2 h-2 bg-yellow-500"></div></span> Microsoft</span>
            <span className="text-xl font-bold text-gray-800 flex items-center gap-1"><div className="text-purple-600 font-black">#</div> slack</span>
            <span className="text-xl font-bold text-gray-800 flex items-center gap-1"><span className="w-5 h-5 bg-green-600 text-white flex items-center justify-center rounded-sm text-xs">S</span> shopify</span>
            <span className="text-xl font-bold text-gray-800 flex items-center gap-1"><span className="border-2 border-black rounded-sm px-1 text-xs">N</span> Notion</span>
          </div>
        </div>
      </section>

      {/* SEO Architecture & Features */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-brand-indigo mb-4">Everything you need for Cold Email</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Our platform combines the best of email automation and AI to help you close more deals.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: Target, title: 'Email Sequences', desc: 'Build multi-step campaigns with automated follow-ups.', color: 'text-brand-indigo' },
              { icon: Zap, title: 'Email Deliverability', desc: 'Advanced warmup tools and infrastructure.', color: 'text-brand-teal' },
              { icon: Inbox, title: 'Unified Inbox', desc: 'Manage all replies from one central location.', color: 'text-brand-pink' },
              { icon: Sparkles, title: 'AI Email Writer', desc: 'Create high-converting emails in seconds.', color: 'text-brand-royal' },
              { icon: Layers, title: 'Multiple Accounts', desc: 'Connect and manage multiple email accounts.', color: 'text-blue-500' },
              { icon: LineChart, title: 'Analytics', desc: 'Track performance and optimize campaigns.', color: 'text-purple-500' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] transition-all">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="text-sm font-bold text-brand-indigo mb-2">{feature.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="py-24 bg-brand-light relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-brand-indigo mb-4">How ReachOps Works</h2>
            <p className="text-gray-500">Launch your first campaign in minutes, not days.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Mock Table */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {['All', 'Active', 'Paused', 'Completed'].map((tab, i) => (
                    <div key={tab} className={`px-4 py-1.5 rounded-full text-xs font-semibold ${i === 0 ? 'border border-gray-200 text-brand-indigo' : 'text-gray-400 hover:bg-gray-50'}`}>{tab}</div>
                  ))}
                </div>
                <div className="bg-brand-royal text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Create Campaign
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 font-medium border-b border-gray-50">
                    <th className="pb-3 font-medium">Campaign Name</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Leads</th>
                    <th className="pb-3 font-medium">Emails Sent</th>
                    <th className="pb-3 font-medium">Replies</th>
                    <th className="pb-3 font-medium">Positive</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    { name: 'SaaS Founders - US', status: 'Active', leads: '1,240', sent: '1,180', replies: '124', positive: '48' },
                    { name: 'HR Decision Makers - UK', status: 'Active', leads: '980', sent: '912', replies: '86', positive: '32' },
                    { name: 'Marketing Agencies - AU', status: 'Paused', leads: '740', sent: '620', replies: '52', positive: '18' },
                    { name: 'Tech Companies - UAE', status: 'Active', leads: '1,560', sent: '1,300', replies: '148', positive: '60' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-50/50">
                      <td className="py-4 font-semibold text-gray-800">{row.name}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-brand-teal/20 text-teal-700' : 'bg-red-100 text-red-600'}`}>{row.status}</span>
                      </td>
                      <td className="py-4">{row.leads}</td>
                      <td className="py-4">{row.sent}</td>
                      <td className="py-4">{row.replies}</td>
                      <td className="py-4">{row.positive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Content */}
            <div>
              <h3 className="text-3xl font-extrabold text-brand-indigo mb-6 leading-tight">Manage Multiple Campaigns<br/>with Complete Control</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Create separate campaigns for different audiences, use unique templates, connect multiple sending accounts, and track performance for each campaign.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  'Separate templates for each campaign',
                  'Multiple sending accounts per campaign',
                  'Individual sequences and schedules',
                  'Real-time analytics and reporting'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-teal-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/dashboard" className="inline-flex items-center gap-2 bg-brand-teal hover:bg-teal-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-teal/30">
                Create Your First Campaign <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-4 lg:pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-brand-teal text-[10px] font-bold uppercase tracking-wider mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-teal"></div> AI EMAIL WRITER
              </div>
              <h3 className="text-4xl font-extrabold text-brand-indigo mb-6 leading-tight">Write personalized<br/>emails that get replies.</h3>
              <p className="text-gray-500 mb-8 leading-relaxed text-lg">
                Use AI to generate high-converting email templates based on your audience, offer, and goals. Personalize every email with dynamic variables.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/dashboard" className="bg-brand-teal hover:bg-teal-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-teal/30 flex items-center gap-2">
                  Try AI Email Writer <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="bg-white hover:bg-gray-50 text-brand-indigo border border-gray-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm">
                  View Examples
                </Link>
              </div>
            </div>

            <div className="lg:col-span-8 relative flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-6">
              {/* Hand-drawn annotation */}
              <div className="hidden lg:block absolute -top-12 right-8 z-30">
                <div className="relative flex flex-col items-center">
                  <svg className="absolute -left-28 top-6 w-24 h-12 text-brand-royal opacity-50" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M10,90 Q40,10 90,45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M75,30 L90,45 L70,55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <div className="text-brand-royal font-medium text-[13px] rotate-2 opacity-80 whitespace-nowrap font-serif italic text-center leading-tight">
                    From a simple prompt<br/>to a high-converting email
                  </div>
                  <svg className="w-1.5 h-4 mt-2 text-brand-royal opacity-40" fill="none" viewBox="0 0 10 20">
                    <path d="M5,0 L5,20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
              </div>
              
              {/* Fake AI prompt box */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-gray-100 flex-1 relative z-10 sm:mt-16 w-full">
                <div className="flex items-center gap-2 mb-4 font-bold text-brand-royal text-sm">
                  <Sparkles className="w-4 h-4" /> Write with AI
                </div>
                <div className="text-sm text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                  Write a cold email to a SaaS founder about our lead generation service
                </div>
                <button className="bg-[#5C6BC0] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">Generate</button>
              </div>
              
              {/* Fake Email preview */}
              <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] border border-gray-50 flex-[1.3] relative z-20 w-full">
                <div className="text-[13px] text-gray-500 pb-4 mb-4">
                  <span className="font-semibold text-gray-800">Subject:</span> Quick question about {'{{company}}'}
                </div>
                <div className="space-y-5 text-[13px] text-gray-500 leading-relaxed">
                  <p>Hi {'{{first_name}}'},</p>
                  <p>I noticed that {'{{company}}'} is growing quickly and might be looking at new ways to generate more qualified leads.</p>
                  <p>We help SaaS companies like yours book sales calls through personalized cold email outreach.</p>
                  <p>Best regards,<br/>[Your Name]</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-brand-light relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-brand-indigo mb-3">Connect with your favorite tools</h2>
            <p className="text-gray-500 text-sm">Easily integrate with the tools you already use.</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 mb-24">
            {[
              { name: 'Gmail', icon: 'https://cdn.simpleicons.org/gmail' },
              { name: 'Google Sheets', icon: 'https://cdn.simpleicons.org/googlesheets' },
              { name: 'Microsoft 365', icon: 'https://img.icons8.com/color/48/000000/microsoft-office-2019.png' },
              { name: 'Outlook', icon: 'https://img.icons8.com/color/48/000000/microsoft-outlook-2019.png' },
              { name: 'Slack', icon: 'https://img.icons8.com/color/48/000000/slack-new.png' },
              { name: 'Zapier', icon: 'https://cdn.simpleicons.org/zapier' },
              { name: 'HubSpot', icon: 'https://cdn.simpleicons.org/hubspot' },
              { name: 'API', icon: 'Code' }
            ].map((tool, i) => (
              <div key={tool.name} className="flex items-center gap-2 md:gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center font-bold text-[10px] text-gray-500 flex-col gap-1.5 hover:-translate-y-1 transition-transform cursor-pointer">
                  {tool.icon === 'Code' ? (
                    <Code className="w-6 h-6 text-brand-indigo" />
                  ) : (
                    <img src={tool.icon} alt={tool.name} className="w-6 h-6" />
                  )}
                  <span className="text-center leading-tight">{tool.name}</span>
                </div>
                {i < 7 && <ArrowRight className="w-3 h-3 text-gray-200 hidden md:block" />}
              </div>
            ))}
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-brand-indigo mb-3">Built for Modern B2B Teams</h2>
            <p className="text-gray-500 text-sm">Whether you're a founder, SDR, agency, or recruiter — ReachOps helps you scale your outreach.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: 'Sales Teams', desc: 'Automate outbound prospecting and close more deals.', color: 'text-teal-500' },
              { title: 'Founders', desc: 'Build pipeline without spending hours on manual outreach.', color: 'text-purple-500' },
              { title: 'Agencies', desc: 'Manage multiple client campaigns from one platform.', color: 'text-blue-500' },
              { title: 'Recruiters', desc: 'Find and engage top talent with personalized outreach.', color: 'text-orange-500' },
              { title: 'Consultants', desc: 'Reach potential clients with targeted campaigns.', color: 'text-brand-royal' },
            ].map((persona, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-8 h-8 mb-4 rounded flex items-center justify-center bg-gray-50 ${persona.color}`}>
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-brand-indigo text-sm mb-2">{persona.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal text-[10px] font-bold uppercase tracking-wider mb-4">
              Simple & Transparent Pricing
            </div>
            <h2 className="text-4xl font-extrabold text-brand-indigo mb-4">Plans for every stage of your growth</h2>
            <p className="text-gray-500 text-sm">Start small and upgrade as you scale. No hidden fees.</p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="bg-white p-1.5 rounded-full inline-flex border border-gray-100 items-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${!isYearly ? 'bg-brand-teal text-white shadow-sm' : 'text-gray-500 hover:text-brand-indigo'}`}>
                Monthly
              </button>
              <button 
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2 text-sm font-bold rounded-full flex items-center gap-2 transition-all ${isYearly ? 'bg-brand-teal text-white shadow-sm' : 'text-brand-indigo hover:bg-gray-50'}`}>
                Yearly <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide transition-colors ${isYearly ? 'bg-white/20 text-white' : 'text-emerald-600 bg-emerald-50'}`}>Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Starter */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-brand-indigo mb-1">Starter</h3>
              <p className="text-xs text-gray-500 mb-6">For individuals getting started</p>
              <div className="mb-6"><span className="text-4xl font-extrabold text-gray-900">${isYearly ? '23' : '29'}</span> <span className="text-xs text-gray-500">/ month</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-600">
                {['1,000 emails per month', '1 sending account', 'Basic AI writer', 'Email templates', 'Community support'].map(f => (
                  <li key={f} className="flex items-center gap-3"><Check className="w-4 h-4 text-brand-teal" /> {f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl border border-gray-200 text-brand-indigo font-bold text-sm hover:bg-gray-50 transition-colors">Get Started</button>
            </div>
            {/* Growth */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-brand-royal relative transform md:-translate-y-4">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-royal text-white text-[10px] font-bold px-3 py-1 rounded-full">Most Popular</div>
              <h3 className="text-xl font-bold text-brand-indigo mb-1">Growth</h3>
              <p className="text-xs text-gray-500 mb-6">For growing teams</p>
              <div className="mb-6"><span className="text-4xl font-extrabold text-gray-900">${isYearly ? '63' : '79'}</span> <span className="text-xs text-gray-500">/ month</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-600">
                {['10,000 emails per month', '5 sending accounts', 'Advanced AI writer', 'Unified inbox', 'Google Sheets integration', 'Priority support'].map(f => (
                  <li key={f} className="flex items-center gap-3"><Check className="w-4 h-4 text-brand-teal" /> {f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-royal text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-brand-royal/30">Get Started</button>
            </div>
            {/* Scale */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-brand-indigo mb-1">Scale</h3>
              <p className="text-xs text-gray-500 mb-6">For agencies and larger teams</p>
              <div className="mb-6"><span className="text-4xl font-extrabold text-gray-900">${isYearly ? '159' : '199'}</span> <span className="text-xs text-gray-500">/ month</span></div>
              <ul className="space-y-4 mb-8 text-sm text-gray-600">
                {['50,000 emails per month', '20 sending accounts', 'Advanced automation', 'Team collaboration', 'API access', 'Dedicated support'].map(f => (
                  <li key={f} className="flex items-center gap-3"><Check className="w-4 h-4 text-brand-teal" /> {f}</li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl border border-gray-200 text-brand-indigo font-bold text-sm hover:bg-gray-50 transition-colors">Get Started</button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-brand-light relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-10 gap-4 text-center sm:text-left">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-indigo mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-500 text-sm">Everything you need to know about ReachOps.</p>
            </div>
            <a href="#" className="text-sm font-medium text-brand-royal hover:underline">View all FAQs →</a>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-24 items-start">
            {[
              { q: 'What is ReachOps?', a: 'ReachOps is a powerful platform that combines cold email automation with AI to help you scale your outbound prospecting and book more meetings.' },
              { q: 'Can I import leads from Google Sheets?', a: 'Yes! You can easily sync your leads directly from Google Sheets or upload a CSV file into your campaigns.' },
              { q: 'Can I use Gmail or Outlook?', a: 'Absolutely. You can connect multiple Google Workspace and Microsoft 365 accounts to send emails.' },
              { q: 'Does it support automated follow-ups?', a: 'Yes, you can build multi-step sequences with automated follow-ups based on prospect engagement.' },
              { q: 'Can I create multiple campaigns?', a: 'Yes, you can create unlimited campaigns to target different audiences or run A/B tests.' },
              { q: 'Can AI write personalized emails?', a: 'Our built-in AI Email Writer can generate personalized emails and entire sequences based on your prompts.' },
              { q: 'Can one campaign use multiple email accounts?', a: 'Yes, you can use inbox rotation to send from multiple accounts within a single campaign for better deliverability.' },
              { q: 'Can I track campaign performance?', a: 'We provide real-time analytics including open rates, reply rates, and positive response tracking.' },
              { q: 'Does ReachOps provide a unified inbox?', a: 'Yes, you can view and reply to all your prospect responses from different accounts in one central unified inbox.' },
              { q: 'Is there a free trial?', a: 'Yes, we offer a 14-day free trial on all plans. No credit card required to start.' }
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-brand-royal/30 transition-all overflow-hidden"
              >
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium transition-colors ${openFaq === i ? 'text-brand-royal' : 'text-gray-700'}`}>{item.q}</span>
                  {openFaq === i ? (
                    <Minus className="w-4 h-4 text-brand-royal flex-shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-brand-royal flex-shrink-0" />
                  )}
                </div>
                <div className={`text-xs text-gray-500 leading-relaxed transition-all duration-300 ease-in-out ${openFaq === i ? 'mt-4 opacity-100 max-h-40' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-brand-indigo to-[#2A829E] rounded-[2rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 relative z-10">Ready to supercharge your sales?</h2>
            <p className="text-white/80 text-sm md:text-base mb-8 max-w-2xl mx-auto relative z-10">Join thousands of companies using ReachOps to generate pipeline on autopilot.</p>
            <div className="flex flex-col items-center relative z-10">
              <Link to="/dashboard" className="bg-brand-teal hover:bg-teal-400 text-brand-indigo px-8 py-4 rounded-xl text-sm font-bold transition-all shadow-xl hover:-translate-y-1 mb-6 flex items-center gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex gap-6 text-xs text-white/70">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No credit card required</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> 14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with SEO Content Architecture */}
      <footer className="bg-brand-dark text-white pt-16 pb-8 border-t border-brand-indigo/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center">
                  <Mail className="text-white w-4 h-4" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white">ReachOps</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                The most powerful AI email automation platform designed to help you generate leads at scale.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-brand-light mb-4">Core Platform</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">AI Email Outreach</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Email Automation</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Cold Email</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Email Sequences</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-brand-light mb-4">Features</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Email Deliverability</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Unified Inbox</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">AI Email Writer</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-brand-light mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Homepage</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Use Cases</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-brand-teal transition-colors">Blog/Guides</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2026 ReachOps. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
