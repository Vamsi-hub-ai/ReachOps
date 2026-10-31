import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Mail, Zap, Target, Inbox, CheckCircle2, 
  Layers, Sparkles, LineChart, Check, ShieldCheck, Clock,
  ChevronDown, Minus, Plus, RefreshCw, Send, Database
} from 'lucide-react';

export default function EmailOutreachAutomation() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is automated cold email outreach?',
      a: 'Automated cold email outreach is the process of dispatching personalized, multi-step email sequences to targeted B2B prospects with automated follow-ups that pause immediately upon reply or tag assignment.'
    },
    {
      q: 'How does ReachOps prevent emails from landing in spam?',
      a: 'ReachOps rotates sending volume across multiple connected inboxes, enforces conservative daily sending limits, respects business sending hours, and performs real-time SPF, DKIM, DMARC, and MX checks.'
    },
    {
      q: 'What triggers automated follow-ups to stop?',
      a: 'Sequences automatically stop whenever a prospect replies, unsubscribes, bounces, is marked with a tag (such as "Interested" or "Warm"), or is added to your workspace suppression list.'
    },
    {
      q: 'Can I personalize messages for individual prospects?',
      a: 'Yes. ReachOps dynamically merges custom fields from Google Sheets or CSV files (e.g. {{firstName}}, {{company}}, {{jobTitle}}) and supports AI-assisted copy tailoring.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#06110c] bg-reachops-cosmic text-slate-100 font-sans selection:bg-[#10b981]/30 selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#171717]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#059669] to-[#10b981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Send className="text-white w-5 h-5 -rotate-12" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                ReachOps<span className="text-emerald-400">.</span>
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-8 text-sm font-medium">
              <Link to="/" className="text-slate-300 hover:text-emerald-400 transition-colors">Home</Link>
              <Link to="/email-outreach-automation" className="text-emerald-400 font-bold">Email Outreach</Link>
              <Link to="/google-sheets-email-automation" className="text-slate-300 hover:text-emerald-400 transition-colors">Google Sheets</Link>
              <Link to="/email-deliverability-monitoring" className="text-slate-300 hover:text-emerald-400 transition-colors">Deliverability</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5">
                Sign In
              </Link>
              <Link to="/signup" className="btn-reachops-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#a31c1b]/25">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-emerald-400 text-xs font-semibold mb-6">
            <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
            Automated B2B Cold Email Sequences
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Email Outreach Software That Turns Prospects Into Conversations
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            ReachOps automates multi-step B2B email sequences, synchronizes follow-up workflows, and manages prospect interactions so your sales team can book more meetings without burning sender reputation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/signup" className="w-full sm:w-auto btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#a31c1b]/30">
              Start Your Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/" className="w-full sm:w-auto bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] px-8 py-3.5 rounded-xl text-sm font-semibold transition-all">
              Explore Platform
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-Step Follow-Ups</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Smart Inbox Rotation</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Reply Stop</span>
          </div>
        </div>
      </section>

      {/* Feature Breakdown */}
      <section className="py-20 bg-[#171717]/60 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-3">Engineered for Cold Email Automation</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">Build high-converting outbound funnels with intelligent delays, automated sequence controls, and deliverability protection.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-surface p-7 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Configurable Multi-Step Sequences</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Design Day 0 initial outreach, Day 2 follow-ups, and Day 5 break-ups with custom sending windows, weekend protection, and prospect timezone enforcement.
              </p>
            </div>

            <div className="glass-surface p-7 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Intelligent Follow-Up Pausing</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Applying any tag (e.g. &quot;Interested&quot;, &quot;Meeting Booked&quot;) immediately pauses pending automated follow-ups so you never send automated emails to active prospects.
              </p>
            </div>

            <div className="glass-surface p-7 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Mailbox Rotation</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect multiple Google Workspace and Microsoft 365 accounts. ReachOps rotates messages across mailboxes to maintain high deliverability and stay below provider limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">Email Outreach Automation FAQs</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div 
                key={i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="glass-surface p-5 rounded-xl cursor-pointer transition-all border border-white/[0.08] hover:border-emerald-500/30"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">{f.q}</span>
                  {openFaq === i ? <Minus className="w-4 h-4 text-emerald-400 shrink-0" /> : <Plus className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                {openFaq === i && (
                  <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-white/[0.06] leading-relaxed">
                    {f.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#171717]/80 border-t border-white/[0.08] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white mb-4">Start Automating Your B2B Outreach</h2>
          <p className="text-sm text-slate-300 mb-8 max-w-xl mx-auto">Join forward-thinking sales teams scaling pipeline with ReachOps Email Outreach Software.</p>
          <Link to="/signup" className="btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#a31c1b]/30 inline-flex items-center gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#06110c] border-t border-white/[0.08] text-center text-xs text-slate-500">
        <p>© 2026 ReachOps. AI-Powered Email Outreach Software. All rights reserved.</p>
      </footer>
    </div>
  );
}

