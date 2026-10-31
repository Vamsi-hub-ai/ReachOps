import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, CheckCircle2, Check, 
  Send, Plus, Minus, Zap, Flame, Lock, AlertTriangle
} from 'lucide-react';

export default function DeliverabilityMonitoring() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Why are SPF, DKIM, and DMARC essential for cold email?',
      a: 'Email providers (like Google and Yahoo) require sender authentication records to verify domain ownership and prevent spoofing. Missing or misaligned SPF, DKIM, or DMARC records will cause your outreach to bounce or go directly to the spam folder.'
    },
    {
      q: 'Does ReachOps verify MX records before sending?',
      a: 'Yes. ReachOps automatically validates the recipient MX records and provider configuration to minimize bounce risk and protect your domain reputation.'
    },
    {
      q: 'How does mailbox warmup protect deliverability?',
      a: 'Our warmup engine gradually scales your sending volume and engages in realistic interactions with peer inboxes, building high sender trust before high-volume campaigns launch.'
    },
    {
      q: 'Can deliverability monitoring guarantee inbox placement?',
      a: 'While no software can guarantee 100% inbox placement, identifying configuration flaws, balancing daily sending caps, and enforcing strict domain hygiene maximizes your deliverability score.'
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
                <Send className="text-white w-4 h-4 -rotate-12" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                ReachOps<span className="text-emerald-400">.</span>
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-8 text-sm font-medium">
              <Link to="/" className="text-slate-300 hover:text-emerald-400 transition-colors">Home</Link>
              <Link to="/email-outreach-automation" className="text-slate-300 hover:text-emerald-400 transition-colors">Email Outreach</Link>
              <Link to="/google-sheets-email-automation" className="text-slate-300 hover:text-emerald-400 transition-colors">Google Sheets</Link>
              <Link to="/email-deliverability-monitoring" className="text-emerald-400 font-bold">Deliverability</Link>
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
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Infrastructure &amp; Deliverability Health
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Email Deliverability Monitoring &amp; Infrastructure Protection
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Monitor essential email authentication records, identify configuration issues, and maintain healthy sender reputation with automated SPF, DKIM, DMARC, and MX record diagnostics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link to="/signup" className="w-full sm:w-auto btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#a31c1b]/30">
              Run Deliverability Check <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/" className="w-full sm:w-auto bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] px-8 py-3.5 rounded-xl text-sm font-semibold transition-all">
              Explore Platform
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SPF Verification</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> DKIM Alignment</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> DMARC Enforcement</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> MX Routing Checks</span>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 bg-[#171717]/60 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-3">Understand and Improve Your Sending Infrastructure</h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">Comprehensive diagnostics to ensure your outbound emails are welcomed by modern mail servers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-surface p-7 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Authentication Auditing</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Scan all sending mailboxes for valid SPF records, 2048-bit DKIM keys, and aligned DMARC policies matching the 2024 Google &amp; Yahoo bulk-sender guidelines.
              </p>
            </div>

            <div className="glass-surface p-7 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Warmup Health &amp; Ramp-Up</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Gradually increase outbound volume with peer inbox warmup to cultivate trust scores and prevent sudden rate-limiting spikes.
              </p>
            </div>

            <div className="glass-surface p-7 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Spam Shield &amp; Quota Guard</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Enforce daily sending ceilings per mailbox, distribute campaigns with smart inbox rotation, and auto-pause mailboxes that experience high bounce rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-10">Deliverability Monitoring FAQs</h2>
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
          <h2 className="text-3xl font-extrabold text-white mb-4">Protect Your Domain Health Today</h2>
          <p className="text-sm text-slate-300 mb-8 max-w-xl mx-auto">Maintain high sender reputation and deliver cold email sequences directly to your prospect&apos;s primary inbox.</p>
          <Link to="/signup" className="btn-reachops-primary text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#a31c1b]/30 inline-flex items-center gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#06110c] border-t border-white/[0.08] text-center text-xs text-slate-500">
        <p>© 2026 ReachOps. Email Deliverability Monitoring Software. All rights reserved.</p>
      </footer>
    </div>
  );
}

