import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, Info, Activity } from 'lucide-react';
import DeliverabilityDiagnoseModal from '@/components/DeliverabilityDiagnoseModal';

export default function CampaignAnalytics() {
  const { id } = useParams<{ id: string }>();
  const campaignKey = id || 'tga-sales';
  const isTga = campaignKey === 'tga-sales';

  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progressVal, setProgressVal] = useState(5);
  const [activeSubTab, setActiveSubTab] = useState<'steps' | 'activity' | 'bounces'>('steps');
  const [diagnoseModalOpen, setDiagnoseModalOpen] = useState(false);

  const [analytics, setAnalytics] = useState<any>({
    campaignId: campaignKey,
    campaignName: isTga ? 'TGA-Sales' : (id || 'Campaign Outreach'),
    enrolled: isTga ? 47 : 0,
    sent: isTga ? 67 : 0,
    opened: isTga ? 6 : 0,
    clicked: 0,
    replied: isTga ? 1 : 0,
    bounced: 0,
    openRate: isTga ? '12.8%' : '0.0%',
    replyRate: isTga ? '2.1%' : '0.0%',
    steps: null,
  });

  useEffect(() => {
    fetch(`/api/campaigns/${campaignKey}/analytics?timeRange=${encodeURIComponent(timeRange)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load analytics');
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          setAnalytics(data);
        }
      })
      .catch((err) => console.warn('Could not fetch campaign analytics:', err));
  }, [campaignKey, timeRange]);

  // Step toggle states
  const [stepToggles, setStepToggles] = useState<Record<string, boolean>>({
    'step-1': true,
    'step-2': true,
    'step-3': true,
    'step-4': true,
    'step-5': true,
    'step-6': true,
    'step-7': true,
  });

  const toggleStep = (stepKey: string) => {
    setStepToggles(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const defaultStepsData = isTga ? [
    { id: 'step-1', name: 'Step 1', sent: 47, opened: 0, replied: 1, replyRate: '2.1%', posReplyRate: '0%', opps: 0, meetings: 0, won: 0 },
    { id: 'step-2', name: 'Step 2', sent: 17, opened: 6, replied: 0, replyRate: '0%', posReplyRate: '-', opps: 0, meetings: 0, won: 0 },
    { id: 'step-3', name: 'Step 3', sent: 3, opened: 3, replied: 0, replyRate: '0%', posReplyRate: '-', opps: 0, meetings: 0, won: 0 },
    { id: 'step-4', name: 'Step 4', sent: 0, opened: 0, replied: 0, replyRate: '-', posReplyRate: '-', opps: 0, meetings: 0, won: 0 },
    { id: 'step-5', name: 'Step 5', sent: 0, opened: 0, replied: 0, replyRate: '-', posReplyRate: '-', opps: 0, meetings: 0, won: 0 },
    { id: 'step-6', name: 'Step 6', sent: 0, opened: 0, replied: 0, replyRate: '-', posReplyRate: '-', opps: 0, meetings: 0, won: 0 },
    { id: 'step-7', name: 'Step 7', sent: 0, opened: 0, replied: 0, replyRate: '-', posReplyRate: '-', opps: 0, meetings: 0, won: 0 },
  ] : [
    { id: 'step-1', name: 'Step 1', sent: 0, opened: 0, replied: 0, replyRate: '0%', posReplyRate: '0%', opps: 0, meetings: 0, won: 0 },
  ];

  const stepsData = analytics.steps && analytics.steps.length > 0 ? analytics.steps : defaultStepsData;

  const timeOptions = ['Last 7 days', 'Last 14 days', 'Last 30 days', 'Last 90 days', 'All time'];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-300 text-slate-100">
      
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Timeframe Filter & Percentage Slider */}
        <div className="flex items-center gap-3">
          
          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-xs font-semibold text-slate-200 transition-colors cursor-pointer shadow-sm"
            >
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-44 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95">
                  {timeOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setTimeRange(opt); setDropdownOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                        timeRange === opt ? 'bg-[#10b981]/15 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Slider Pill */}
          <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-1.5 text-xs">
            <span className="text-white font-bold">{progressVal}%</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progressVal} 
              onChange={(e) => setProgressVal(parseInt(e.target.value))}
              className="w-20 h-1.5 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-emerald-500" 
            />
          </div>

        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDiagnoseModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Diagnose Deliverability</span>
          </button>
        </div>

      </div>

      {/* 7 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* Card 1: Sequence started */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Started</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-3">
            {analytics.enrolled}
          </div>
        </div>

        {/* Card 2: Total sent */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Total sent</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-3">
            {analytics.sent}
          </div>
        </div>

        {/* Card 3: Open rate */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Open rate</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-3">
            {analytics.openRate} <span className="text-slate-500 font-normal text-sm">| {analytics.opened}</span>
          </div>
        </div>

        {/* Card 4: Click rate */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Click rate</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-xl font-extrabold text-slate-300 tracking-tight mt-3">
            {analytics.clicked ? `${analytics.clicked}` : 'Disabled'}
          </div>
        </div>

        {/* Card 5: Unique replies */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Replies</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-3">
            {analytics.replied}
          </div>
        </div>

        {/* Card 6: Opportunities */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Opps</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-3">
            0 <span className="text-slate-500 font-normal text-sm">| $0</span>
          </div>
        </div>

        {/* Card 7: Conversions */}
        <div className="glass-surface glass-surface-hover p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-slate-300 font-semibold text-[11px]">Conversions</span>
            </div>
            <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-3">
            0 <span className="text-slate-500 font-normal text-sm">| $0</span>
          </div>
        </div>

      </div>

      {/* Performance Trend Chart Card */}
      <div className="glass-surface p-6 space-y-6">
        
        {/* Title */}
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Performance Trend</h2>
          <p className="text-xs text-slate-400 mt-0.5">Email campaign metrics progression over time</p>
        </div>

        {/* Interactive Curves Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sent Curve */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(139,124,255,0.8)]" />
              <span className="text-xs font-medium text-slate-300">Sent</span>
              <span className="text-sm font-bold text-[#FFF3E3]">67</span>
            </div>

            <div className="relative h-44 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sentGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                <line x1="0" y1="10" x2="500" y2="10" stroke="#1c1e2a" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#1c1e2a" />

                {/* Sent Area Fill */}
                <path 
                  d="M 0 110 Q 50 110, 80 50 T 160 110 L 260 110 Q 300 110, 340 60 T 450 50 L 500 50 L 500 110 Z" 
                  fill="url(#sentGlow)" 
                />
                
                {/* Sent Line */}
                <path 
                  d="M 0 110 Q 50 110, 80 50 T 160 110 L 260 110 Q 300 110, 340 60 T 450 50 L 500 50" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />

                {/* Point on Sent */}
                <circle cx="500" cy="50" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Y Axis indicators */}
              <span className="absolute top-2 left-0 text-[10px] text-slate-500 font-mono">25</span>
              <span className="absolute bottom-2 left-0 text-[10px] text-slate-500 font-mono">0</span>
            </div>
          </div>

          {/* Opens Curve */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D5E8E6] shadow-[0_0_8px_rgba(213,232,230,0.8)]" />
              <span className="text-xs font-medium text-slate-300">Opens</span>
              <span className="text-sm font-bold text-[#FFF3E3]">6</span>
            </div>

            <div className="relative h-44 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="opensGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D5E8E6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#D5E8E6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="10" x2="500" y2="10" stroke="#1c1e2a" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#1c1e2a" />

                {/* Opens Area Fill */}
                <path 
                  d="M 0 110 L 80 110 Q 140 30, 200 110 L 400 110 Q 450 110, 500 50 L 500 110 Z" 
                  fill="url(#opensGlow)" 
                />
                
                {/* Opens Line */}
                <path 
                  d="M 0 110 L 80 110 Q 140 30, 200 110 L 400 110 Q 450 110, 500 50" 
                  fill="none" 
                  stroke="#D5E8E6" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                />

                <circle cx="500" cy="50" r="4" fill="#D5E8E6" stroke="#ffffff" strokeWidth="2" />
              </svg>

              <span className="absolute top-2 left-0 text-[10px] text-slate-500 font-mono">5</span>
              <span className="absolute bottom-2 left-0 text-[10px] text-slate-500 font-mono">0</span>
            </div>
          </div>

        </div>

        {/* Replies & Clicks Row (Matching Screenshot 2) */}
        <div className="pt-4 border-t border-[#1c1e29] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D5E8E6] shadow-[0_0_8px_rgba(213,232,230,0.8)]" />
              <span className="text-xs font-medium text-slate-300">Replies</span>
              <span className="text-sm font-bold text-[#FFF3E3]">15</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-sm bg-[#FFF3E3]" />
              <span>Clicks</span>
              <span>- Not tracked</span>
            </div>
          </div>

          <div className="relative h-28 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="repliesGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D5E8E6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#D5E8E6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="75" x2="1000" y2="75" stroke="#1c1e2a" />

              {/* Replies Curve: High at start (15), drops to 0 */}
              <path 
                d="M 0 15 Q 60 75, 150 75 L 1000 75 L 1000 75 Z" 
                fill="url(#repliesGlow)" 
              />
              <path 
                d="M 0 15 Q 60 75, 150 75 L 1000 75" 
                fill="none" 
                stroke="#D5E8E6" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
              <circle cx="995" cy="75" r="4" fill="#D5E8E6" stroke="#ffffff" strokeWidth="2" />
            </svg>

            <span className="absolute top-0 left-0 text-[10px] text-slate-500 font-mono">20</span>
            <span className="absolute bottom-1 left-0 text-[10px] text-slate-500 font-mono">0</span>
          </div>

          {/* Time Dates Axis */}
          <div className="flex justify-between text-[11px] text-slate-500 pt-1 px-2 font-mono">
            <span>Oct 22</span>
            <span>Oct 24</span>
            <span>Oct 25</span>
            <span>Oct 27</span>
            <span>Oct 28</span>
          </div>
        </div>

      </div>

      {/* Subtabs: Step analytics | Activity | Bounces (Matching Screenshot 2 & 3) */}
      <div className="space-y-4">
        
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] w-fit">
          <button
            onClick={() => setActiveSubTab('steps')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'steps' 
                ? 'bg-[#a31c1b] text-white shadow-[0_0_12px_rgba(163,28,27,0.5)] font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Step analytics
          </button>
          <button
            onClick={() => setActiveSubTab('activity')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'activity' 
                ? 'bg-[#a31c1b] text-white shadow-[0_0_12px_rgba(163,28,27,0.5)] font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveSubTab('bounces')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'bounces' 
                ? 'bg-[#a31c1b] text-white shadow-[0_0_12px_rgba(163,28,27,0.5)] font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bounces
          </button>
        </div>

        {/* Step Analytics Table */}
        {activeSubTab === 'steps' && (
          <div className="glass-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/[0.03] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-300">STEP</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">SENT</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">OPENED</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">REPLIED</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">REPLY RATE</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">POSITIVE REPLY RATE</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">OPPORTUNITIES</th>
                    <th className="px-4 py-4 font-bold text-right text-slate-300">MEETINGS BOOKED</th>
                    <th className="px-6 py-4 font-bold text-right text-slate-300">WON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {stepsData.map((step: any) => {
                    const isStepActive = stepToggles[step.id] ?? true;
                    return (
                      <tr key={step.id} className="hover:bg-white/[0.035] transition-colors group">
                        
                        {/* Step Title & Variant Toggle A */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className="font-bold text-white block text-xs">{step.name}</span>
                            
                            {/* Toggle switch for Variant A */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleStep(step.id)}
                                className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                                  isStepActive ? 'bg-[#10b981]' : 'bg-slate-700'
                                }`}
                              >
                                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                                  isStepActive ? 'right-0.5' : 'left-0.5'
                                }`} />
                              </button>
                              <span className="text-[11px] font-semibold text-slate-400">A</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right text-slate-200 font-bold">{step.sent}</td>
                        <td className="px-4 py-4 text-right text-slate-200 font-bold">{step.opened}</td>
                        <td className="px-4 py-4 text-right text-slate-200 font-bold">{step.replied}</td>
                        <td className="px-4 py-4 text-right text-emerald-400 font-bold">{step.replyRate}</td>
                        <td className="px-4 py-4 text-right text-slate-400 font-mono">{step.posReplyRate}</td>
                        <td className="px-4 py-4 text-right text-slate-300">{step.opps}</td>
                        <td className="px-4 py-4 text-right text-slate-300">{step.meetings}</td>
                        <td className="px-6 py-4 text-right text-slate-300">{step.won}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Feed tab */}
        {activeSubTab === 'activity' && (
          <div className="glass-surface p-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Prospect Stream</h4>
            <div className="space-y-3">
              {[
                { type: 'reply', user: 'sarah.connor@acme.com', text: 'Replied to Step 1: "Interested, let\'s chat next Tuesday."', time: '12m ago' },
                { type: 'open', user: 'david.miller@enterprise.io', text: 'Opened Step 2 email', time: '45m ago' },
                { type: 'sent', user: 'jason.lee@fintech.co', text: 'Dispatched Step 1 email via inbox sales1@reachly.ai', time: '1h ago' },
              ].map((act, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{act.user}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{act.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bounces Tab */}
        {activeSubTab === 'bounces' && (
          <div className="glass-surface p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bounce Guard Report</h4>
                <p className="text-xs text-slate-400 mt-1">Bounce rate is 0.0% (Threshold: 3.0%). Sender reputation is protected.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                0 Bounces Recorded
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Deliverability Modal */}
      <DeliverabilityDiagnoseModal 
        isOpen={diagnoseModalOpen} 
        onClose={() => setDiagnoseModalOpen(false)} 
        campaignName={analytics.campaignName || 'Outreach Campaign'}
      />

    </div>
  );
}
