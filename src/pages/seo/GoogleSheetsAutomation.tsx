import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Database, CheckCircle2, Check, 
  Send, Plus, Minus, Table, RefreshCw, Calendar, Tag
} from 'lucide-react';

export default function GoogleSheetsAutomation() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does ReachOps connect with Google Sheets?',
      a: 'ReachOps securely connects to your Google account via OAuth 2.0 with minimal required scopes. You can select any existing spreadsheet or connect a blank sheet where ReachOps automatically generates all 66 system columns.'
    },
    {
      q: 'Does ReachOps overwrite my existing spreadsheet columns?',
      a: 'No. ReachOps preserves all existing user columns and data. It detects existing column names, maps them to contact fields, and appends missing operational columns safely without overwriting unknown headers.'
    },
    {
      q: 'What happens when I apply a tag in ReachOps or Google Sheets?',
      a: 'Applying any tag (such as "Interested" or "Meeting Booked") immediately pauses pending automated follow-ups for that prospect and updates the sheet. If you explicitly click Schedule Next Follow-up, ReachOps will send that single scheduled message on the chosen date.'
    },
    {
      q: 'Does it support two-way synchronization?',
      a: 'Yes. Dispatches, open events, replies, pause states, and tag updates are synchronized directly into your Google Sheet in real time.'
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
              <Link to="/email-outreach-automation" className="text-slate-300 hover:text-emerald-400 transition-colors">Email Outreach</Link>
              <Link to="/google-sheets-email-automation" className="text-emerald-400 font-bold">Google Sheets</Link>
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
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Google Sheets Powered Outreach Database
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Manage B2B Email Outreach Directly From Google Sheets
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Already managing your prospects in spreadsheets? Connect Google Sheets to ReachOps and turn your spreadsheet into an automated outreach database with automatic column creation, tag-based follow-up controls, and two-way sync.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/signup" className="w-full sm:w-auto btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#a31c1b]/30">
              Connect Google Sheets <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/" className="w-full sm:w-auto bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] px-8 py-3.5 rounded-xl text-sm font-semibold transition-all">
              Explore Platform
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 66 Auto-Managed Columns</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tag-Based Follow-Up Pause</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-Time Two-Way Sync</span>
          </div>
        </div>
      </section>

      {/* Deep Dive Grid */}
      <section className="py-20 bg-[#171717]/60 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-3">Your Prospect Data. Your Outreach Workflow.</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">Never worry about manual column management or missing follow-up states. ReachOps manages the complete lifecycle.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-surface p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Table className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Automatic Column Generation</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect an empty Google Sheet, and ReachOps instantly provisions 66 structured headers with frozen header rows, auto-filters, professional dark-forest formatting, and metadata tracking.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Contact info (prospect_id, email, company, title)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Email delivery &amp; bounce status tracking</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Tag management (last_tag_applied, tag_action)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Manual scheduling &amp; timestamp coordination</li>
              </ul>
            </div>

            <div className="glass-surface p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Intelligent Follow-Up Control</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Applying a tag automatically pauses automated follow-ups for that prospect. Need to follow up later? The explicit Schedule Next Follow-up modal lets you book a single follow-up message on a specific date and time without restarting the automated cadence.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Tag applied = Follow-up immediately paused</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Manual scheduling exception authorized for 1 send</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Automatic stop on reply detection</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unsubscribe &amp; suppression safety protections</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">Google Sheets Automation FAQs</h2>
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
          <h2 className="text-3xl font-extrabold text-white mb-4">Turn Google Sheets Into an Outreach Engine</h2>
          <p className="text-sm text-slate-300 mb-8 max-w-xl mx-auto">Connect your spreadsheet, organize prospects, and send automated cold sequences with complete follow-up control.</p>
          <Link to="/signup" className="btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#a31c1b]/30 inline-flex items-center gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#06110c] border-t border-white/[0.08] text-center text-xs text-slate-500">
        <p>© 2026 ReachOps. Google Sheets Email Automation Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

