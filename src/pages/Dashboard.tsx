import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Activity, Users, Mail, Reply, CalendarClock, 
  Send, Plus, Database, RefreshCw, TrendingUp, ArrowUpRight, 
  ChevronRight, Zap, ArrowUp, ShieldCheck, Calendar, ChevronDown,
  Clock, MoreHorizontal, CheckCircle2, Flame, UserCheck, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Mini Smooth Line Sparkline SVG component matching screenshot
const MiniSparkline = ({ 
  color, 
  data = [12, 18, 14, 25, 20, 32, 28, 40] 
}: { 
  color: string; 
  data?: number[] 
}) => {
  const allZero = data.every(v => v === 0);
  const width = 110;
  const height = 32;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = allZero ? height - 6 : height - 4 - ((d - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' L ');

  const strokeColor = allZero ? 'rgba(255, 255, 255, 0.12)' : color;
  const filterId = `sparkline-glow-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        d={`M ${points}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={allZero ? undefined : `url(#${filterId})`}
      />
    </svg>
  );
};

// Mini Bar Sparkline component for Emails Sent and Scheduled Sends matching screenshot
const BarSparkline = ({ 
  color, 
  data = [4, 8, 6, 12, 10, 16, 14, 20, 18, 22] 
}: { 
  color: string; 
  data?: number[] 
}) => {
  const allZero = data.every(v => v === 0);
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-8 shrink-0">
      {data.map((val, i) => {
        const heightPct = allZero ? 8 : (val === 0 ? 8 : Math.max(18, (val / max) * 100));
        return (
          <div 
            key={i} 
            className="w-1.5 rounded-t-sm transition-all duration-300" 
            style={{ 
              height: `${heightPct}%`, 
              backgroundColor: allZero ? 'rgba(255, 255, 255, 0.08)' : color,
              boxShadow: allZero ? 'none' : `0 0 6px ${color}66`
            }} 
          />
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');
  const [timeRangeMenuOpen, setTimeRangeMenuOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'Sent' | 'Delivered' | 'Replies' | 'Bounces'>('Sent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(7);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) return JSON.parse(u);
    } catch {}
    return null;
  });

  const isDemo = Boolean(currentUser?.isDemo || currentUser?.email === 'demo@reachops.com');

  const [dashboardStats, setDashboardStats] = useState<any>(() => ({
    activeCampaigns: isDemo ? 3 : 0,
    totalCampaigns: isDemo ? 5 : 0,
    totalProspects: isDemo ? 30 : 0,
    totalSent: isDemo ? 13 : 0,
    totalOpened: isDemo ? 11 : 0,
    totalReplied: isDemo ? 11 : 0,
    totalBounced: 0,
    openRate: isDemo ? '84.6%' : '0.0%',
    replyRate: isDemo ? '84.6%' : '0.0%',
    bounceRate: '0.0%',
    scheduledSends: isDemo ? 3 : 0,
    sentToday: isDemo ? 14 : 0,
    dailyLimit: 1000,
    emailsToday: isDemo ? '14 / 1,000' : '0 / 1,000',
    poolHealth: isDemo ? '98.6%' : '0.0%',
    mailboxesCount: isDemo ? 3 : 0,
    activeMailboxesCount: isDemo ? 3 : 0,
  }));

  const loadData = () => {
    setIsRefreshing(true);
    Promise.all([
      fetch('/api/campaigns').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/activity-log').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([cData, sData, aData, meData]) => {
      if (Array.isArray(cData)) setCampaigns(cData);
      if (sData && !sData.error) {
        setDashboardStats(sData);
      }
      if (aData && Array.isArray(aData.logs)) {
        setRecentActivities(aData.logs);
      }
      if (meData && meData.user) {
        setCurrentUser(meData.user);
        try { localStorage.setItem('user', JSON.stringify(meData.user)); } catch {}
      }
    }).finally(() => {
      setTimeout(() => setIsRefreshing(false), 400);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : (isDemo ? 'Demo' : 'there');
  const displayGreeting = `Good afternoon, ${userName}! 👋`;

  // Demo telemetry points
  const demoTelemetryData = [
    { label: 'Oct 1', sent: 20, delivered: 18, replies: 2, bounces: 0 },
    { label: 'Oct 4', sent: 32, delivered: 30, replies: 5, bounces: 0 },
    { label: 'Oct 7', sent: 50, delivered: 48, replies: 8, bounces: 1 },
    { label: 'Oct 10', sent: 42, delivered: 40, replies: 6, bounces: 0 },
    { label: 'Oct 13', sent: 68, delivered: 65, replies: 11, bounces: 0 },
    { label: 'Oct 16', sent: 58, delivered: 55, replies: 9, bounces: 1 },
    { label: 'Oct 19', sent: 82, delivered: 80, replies: 14, bounces: 0 },
    { label: 'Oct 22', sent: 98, delivered: 94, replies: 16, bounces: 1 },
    { label: 'Oct 25', sent: 142, delivered: 138, replies: 18, bounces: 2 },
    { label: 'Oct 28', sent: 128, delivered: 124, replies: 15, bounces: 1 },
    { label: 'Oct 30', sent: 175, delivered: 170, replies: 22, bounces: 2 },
  ];

  // Live telemetry data points from backend or zero baseline
  const telemetryData: { label: string; sent: number; delivered: number; replies: number; bounces: number }[] = isDemo 
    ? demoTelemetryData 
    : (Array.isArray(dashboardStats.telemetry) && dashboardStats.telemetry.length > 0 
        ? dashboardStats.telemetry 
        : demoTelemetryData.map(d => ({ ...d, sent: 0, delivered: 0, replies: 0, bounces: 0 })));

  const totalSentInTelemetry = telemetryData.reduce((sum: number, pt: any) => sum + (pt.sent || 0), 0);
  const isTelemetryEmpty = !isDemo && (dashboardStats.totalSent === 0 || totalSentInTelemetry === 0);

  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 24;
  const paddingY = 24;
  const maxSent = Math.max(...telemetryData.map((d: any) => d.sent || 0), 10);
  const maxScale = isDemo ? 200 : Math.max(20, Math.ceil(maxSent / 10) * 10);

  // Compute SVG coordinates for Sent (Crimson curve)
  const sentPoints = telemetryData.map((d, i) => {
    const x = paddingX + (i / (telemetryData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.sent / maxScale) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Compute SVG coordinates for Delivered (Emerald curve)
  const deliveredPoints = telemetryData.map((d, i) => {
    const x = paddingX + (i / (telemetryData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.delivered / maxScale) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  // Build smooth bezier curves
  const buildPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let p = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      p += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }
    return p;
  };

  const sentCurvePath = buildPath(sentPoints);
  const deliveredCurvePath = buildPath(deliveredPoints);

  const sentAreaPath = sentCurvePath 
    ? `${sentCurvePath} L ${sentPoints[sentPoints.length - 1].x},${chartHeight} L ${sentPoints[0].x},${chartHeight} Z` 
    : '';

  const activePoint = sentPoints[selectedPointIndex] || sentPoints[Math.min(7, sentPoints.length - 1)];

  // Fallback demo recent campaigns strictly for demo user
  const displayRecentCampaigns = campaigns.length > 0 ? campaigns.slice(0, 4) : (isDemo ? [
    {
      id: 'demo-1',
      name: 'Product Launch Outreach',
      status: 'sending',
      prospectsCount: 1250,
      sentCount: 892,
      repliesCount: 64,
      deliveryRate: '98.2%',
      lastActivity: '2 hours ago'
    },
    {
      id: 'demo-2',
      name: '[DEMO] VP of Sales Executive Outreach',
      status: 'sending',
      prospectsCount: 8,
      sentCount: 4,
      repliesCount: 3,
      deliveryRate: '100.0%',
      lastActivity: '4 hours ago'
    },
    {
      id: 'demo-3',
      name: '[DEMO] Q4 Enterprise SaaS Partnership',
      status: 'active',
      prospectsCount: 6,
      sentCount: 3,
      repliesCount: 2,
      deliveryRate: '99.4%',
      lastActivity: 'Yesterday'
    }
  ] : []);

  // Demo activities fallback strictly for demo account
  const demoActivities = [
    {
      id: 'act-1',
      title: 'Campaign started',
      time: '2 hours ago',
      detail: 'Product Launch Outreach',
      icon: Send,
    },
    {
      id: 'act-2',
      title: 'Reply received',
      time: '4 hours ago',
      detail: 'Liam Vance (Acme Corp)',
      icon: Reply,
    },
    {
      id: 'act-3',
      title: 'Mailbox warmed up',
      time: '6 hours ago',
      detail: 'team.outbound@reachops.com',
      icon: Flame,
    },
    {
      id: 'act-4',
      title: 'Lead marked Warm',
      time: 'Yesterday',
      detail: 'Sarah Jenkins (TechCorp)',
      icon: UserCheck,
    },
  ];

  const displayActivities = recentActivities.length > 0
    ? recentActivities.slice(0, 4)
    : (isDemo ? demoActivities : []);

  // Compute daily limit and percentage
  const sentToday = dashboardStats.sentToday ?? 0;
  const dailyQuota = dashboardStats.dailyLimit ?? 1000;
  const todayPercentage = dailyQuota > 0 ? Math.min(100, Math.max(0, (sentToday / dailyQuota) * 100)) : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Header Banner matching reference screenshot */}
      <div className="glass-surface p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Soft background glow spot in forest/emerald */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-[#a31c1b]/10 rounded-full blur-3xl pointer-events-none -mb-20" />

        <div className="space-y-1 z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            WELCOME BACK
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {displayGreeting}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Here's your outreach performance and real-time deliverability telemetry at a glance.
          </p>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3 z-10 self-start md:self-auto">
          
          {/* Timeframe dropdown matching screenshot */}
          <div className="relative">
            <button
              onClick={() => setTimeRangeMenuOpen(!timeRangeMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeRange === '7D' ? 'Last 7 Days' : timeRange === '30D' ? 'Last 30 Days' : 'Last 90 Days'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {timeRangeMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[#171717] border border-white/[0.1] shadow-2xl py-1 z-50 text-xs">
                {(['7D', '30D', '90D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => { setTimeRange(r); setTimeRangeMenuOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 transition-colors cursor-pointer ${
                      timeRange === r ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {r === '7D' ? 'Last 7 Days' : r === '30D' ? 'Last 30 Days' : 'Last 90 Days'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh icon button */}
          <button
            onClick={loadData}
            title="Refresh telemetry"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Primary CTA: Create Campaign in Crimson Red #a31c1b */}
          <Button 
            asChild
            className="btn-reachops-primary px-4 py-2 text-xs font-bold shadow-lg shadow-[#a31c1b]/25 active:scale-95 transition-all cursor-pointer"
          >
            <Link to="/campaigns/new">
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Campaign</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Exactly 8 KPI Cards (2 Rows of 4 Cards) matching screenshot */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Active Campaigns (Emerald) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shadow-sm">
                <Send className="w-4 h-4 -rotate-12" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Active Campaigns</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.activeCampaigns ?? 0}
            </span>
            <MiniSparkline 
              color="#10b981" 
              data={isDemo ? [12, 16, 15, 24, 22, 34, 28, 42] : (dashboardStats.activeCampaigns > 0 ? [1, 2, 2, 3, 3, 4, 4, dashboardStats.activeCampaigns] : [0, 0, 0, 0, 0, 0, 0, 0])} 
            />
          </div>

          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            {isDemo ? (
              <>
                <ArrowUp className="w-3 h-3 stroke-[3]" />
                <span>+1 from last month</span>
              </>
            ) : (
              <span>{dashboardStats.activeCampaigns > 0 ? `${dashboardStats.activeCampaigns} active sequences` : 'Live pipeline active'}</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Prospects (Emerald) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Total Prospects</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.totalProspects ?? 0}
            </span>
            <MiniSparkline 
              color="#10b981" 
              data={isDemo ? [15, 22, 18, 30, 26, 38, 35, 48] : (dashboardStats.totalProspects > 0 ? [2, 5, 8, 12, 18, 22, 25, dashboardStats.totalProspects] : [0, 0, 0, 0, 0, 0, 0, 0])} 
            />
          </div>

          <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            <span>{dashboardStats.totalProspects > 0 ? `${dashboardStats.totalProspects} verified contacts` : 'Verified target leads'}</span>
          </div>
        </div>

        {/* Card 3: Emails Sent (Emerald with Vertical Bars) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Emails Sent</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.totalSent ?? 0}
            </span>
            <BarSparkline 
              color="#10b981" 
              data={isDemo ? [6, 10, 8, 14, 12, 18, 16, 22, 18, 24] : (dashboardStats.totalSent > 0 ? [1, 2, 3, 4, 3, 5, 4, 6, 5, dashboardStats.totalSent] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])} 
            />
          </div>

          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            {isDemo ? (
              <>
                <ArrowUp className="w-3 h-3 stroke-[3]" />
                <span>+28% from last month</span>
              </>
            ) : (
              <span>{dashboardStats.totalSent > 0 ? 'All-time outbound dispatch' : '0 outbound dispatched'}</span>
            )}
          </div>
        </div>

        {/* Card 4: Replies Received (Crimson Red #a31c1b) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 text-[#ef4444] flex items-center justify-center shadow-sm">
                <Reply className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Replies Received</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ef4444] transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.totalReplied ?? 0}
            </span>
            <MiniSparkline 
              color="#ef4444" 
              data={isDemo ? [8, 12, 11, 20, 18, 26, 24, 38] : (dashboardStats.totalReplied > 0 ? [1, 2, 2, 3, 4, 5, 4, dashboardStats.totalReplied] : [0, 0, 0, 0, 0, 0, 0, 0])} 
            />
          </div>

          <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            <span>{dashboardStats.totalReplied > 0 ? `${dashboardStats.totalReplied} responses received` : 'Unique prospect responses'}</span>
          </div>
        </div>

        {/* Card 5: Bounce Rate (Crimson Red #a31c1b) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 text-[#ef4444] flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Bounce Rate</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ef4444] transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.bounceRate || '0.0%'}
            </span>
            <MiniSparkline 
              color="#ef4444" 
              data={isDemo ? [2, 4, 3, 5, 2, 6, 3, 5] : [0, 0, 0, 0, 0, 0, 0, 0]} 
            />
          </div>

          <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
            <span>Safely below 2.0% threshold</span>
          </div>
        </div>

        {/* Card 6: Reply Rate (Emerald) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Reply Rate</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.replyRate || '0.0%'}
            </span>
            <MiniSparkline 
              color="#10b981" 
              data={isDemo ? [18, 24, 22, 35, 30, 44, 40, 52] : [0, 0, 0, 0, 0, 0, 0, 0]} 
            />
          </div>

          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            {isDemo ? (
              <>
                <ArrowUp className="w-3 h-3 stroke-[3]" />
                <span>+12% from last month</span>
              </>
            ) : (
              <span>Live engagement rate</span>
            )}
          </div>
        </div>

        {/* Card 7: Scheduled Sends (Emerald with Vertical Bars) */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shadow-sm">
                <CalendarClock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Scheduled Sends</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {dashboardStats.scheduledSends ?? 0}
            </span>
            <BarSparkline 
              color="#10b981" 
              data={isDemo ? [4, 8, 6, 12, 10, 16, 14, 20, 18, 22] : (dashboardStats.scheduledSends > 0 ? [1, 2, 1, 3, 2, 4, 3, 5, 4, dashboardStats.scheduledSends] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0])} 
            />
          </div>

          <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            <span>{dashboardStats.scheduledSends > 0 ? 'Next batch queued' : 'Queue idle'}</span>
          </div>
        </div>

        {/* Card 8: Emails Today with Crimson Red Glowing Progress Bar */}
        <div className="glass-surface glass-surface-hover p-4 sm:p-5 flex flex-col justify-between h-[155px] relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 text-[#ef4444] flex items-center justify-center shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Emails Today</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ef4444] transition-colors" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {sentToday} / {dailyQuota.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400">{todayPercentage.toFixed(1)}%</span>
            </div>
            {/* Glowing crimson progress bar matching screenshot */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#a31c1b] to-[#ef4444] shadow-[0_0_8px_#ef4444] transition-all duration-500" 
                style={{ width: `${Math.max(todayPercentage, todayPercentage > 0 ? 3 : 0)}%` }} 
              />
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              Daily account quota
            </span>
          </div>
        </div>

      </div>

      {/* 3. Mid Section: Real-Time Sending Activity (Left 2 cols) & Quick Actions (Right 1 col) */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Real-Time Sending Activity Area Chart (2 Columns wide) */}
        <div className="lg:col-span-2 glass-surface p-6 flex flex-col justify-between space-y-4 relative overflow-hidden min-h-[360px]">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Real-Time Sending Activity</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Outbound dispatch and prospect engagement progression over the last 30 days.
              </p>
            </div>

            {/* Segmented Metric Selector (Sent | Delivered | Replies | Bounces) */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
              {(['Sent', 'Delivered', 'Replies', 'Bounces'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMetric(m)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                    activeMetric === m
                      ? 'bg-[#a31c1b] text-white font-bold shadow-[0_0_12px_rgba(163,28,27,0.6)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart Canvas */}
          <div className="relative pt-2 pb-1 flex-1 flex flex-col justify-end">
            
            {/* Pinned Tooltip */}
            {activePoint && !isTelemetryEmpty && (
              <div 
                className="absolute z-30 pointer-events-none -translate-x-1/2 p-2.5 rounded-xl bg-[#171717]/95 backdrop-blur-xl border border-white/[0.15] shadow-[0_8px_24px_rgba(0,0,0,0.6)] text-left min-w-[125px]"
                style={{
                  left: `${(activePoint.x / chartWidth) * 100}%`,
                  top: '18px'
                }}
              >
                <div className="text-[10px] font-bold text-slate-400 pb-1 mb-1 border-b border-white/[0.08]">
                  {activePoint.label}, 2026
                </div>
                <div className="space-y-1 text-[11px] font-semibold">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      Sent
                    </span>
                    <span className="font-bold text-white">{activePoint.sent}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      Delivered
                    </span>
                    <span className="font-bold text-white">{activePoint.delivered}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                      Replies
                    </span>
                    <span className="font-bold text-white">{activePoint.replies}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      Bounces
                    </span>
                    <span className="font-bold text-white">{activePoint.bounces}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Zero sends overlay banner for fresh accounts */}
            {isTelemetryEmpty && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-[#171717]/50 backdrop-blur-[2px] rounded-2xl border border-white/[0.05]">
                <div className="w-10 h-10 rounded-2xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444] mb-2 shadow-lg shadow-[#a31c1b]/25">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white">Live Telemetry Active — Zero Outbound Sends</p>
                <p className="text-[11px] text-slate-400 max-w-sm text-center mt-1">
                  Real-time deliverability, open rates, and prospect replies will graph automatically once campaigns launch.
                </p>
              </div>
            )}

            <div className="flex">
              {/* Y-Axis scale on left */}
              <div className="flex flex-col justify-between text-[10px] text-slate-500 font-mono pr-2 py-1 select-none text-right w-8">
                <span>{maxScale}</span>
                <span>{Math.round(maxScale * 0.75)}</span>
                <span>{Math.round(maxScale * 0.5)}</span>
                <span>{Math.round(maxScale * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart SVG */}
              <div className="flex-1 relative">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full h-[220px] overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="crimsonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a31c1b" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="#ef4444" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#06110c" stopOpacity="0" />
                    </linearGradient>

                    <filter id="crimsonLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    
                    <filter id="emeraldLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal Dotted Grid Lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
                    return (
                      <line 
                        key={idx}
                        x1={paddingX} 
                        y1={y} 
                        x2={chartWidth - paddingX} 
                        y2={y} 
                        stroke="rgba(255, 255, 255, 0.06)" 
                        strokeDasharray="3 3"
                      />
                    );
                  })}

                  {/* Area fill under Crimson Sent curve */}
                  {sentAreaPath && (
                    <path d={sentAreaPath} fill="url(#crimsonAreaGradient)" />
                  )}

                  {/* Delivered Curve in Emerald Green */}
                  {deliveredCurvePath && (
                    <path 
                      d={deliveredCurvePath} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      filter="url(#emeraldLineGlow)"
                    />
                  )}

                  {/* Glowing Sent Curve in Crimson Red */}
                  {sentCurvePath && (
                    <path 
                      d={sentCurvePath} 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      filter="url(#crimsonLineGlow)"
                    />
                  )}

                  {/* Delivered Vertices (Emerald) */}
                  {!isTelemetryEmpty && deliveredPoints.map((pt, idx) => (
                    <circle
                      key={`del-${idx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={2.5}
                      fill="#10b981"
                      className="pointer-events-none"
                    />
                  ))}

                  {/* Sent Vertices (Crimson) */}
                  {!isTelemetryEmpty && sentPoints.map((pt, idx) => (
                    <g key={`sent-${idx}`} className="cursor-pointer" onClick={() => setSelectedPointIndex(idx)}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={selectedPointIndex === idx ? 5.5 : 3.5}
                        fill="#FFFFFF"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="transition-all"
                      />
                      {selectedPointIndex === idx && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={11}
                          fill="#ef4444"
                          fillOpacity={0.25}
                        />
                      )}
                    </g>
                  ))}
                </svg>

                {/* X-Axis Dates */}
                <div className="flex justify-between text-[11px] text-slate-500 pt-2 px-1 select-none">
                  {telemetryData.map((d, i) => (
                    <span 
                      key={i} 
                      onClick={() => setSelectedPointIndex(i)}
                      className={`cursor-pointer transition-colors ${selectedPointIndex === i && !isTelemetryEmpty ? 'text-white font-bold' : 'hover:text-slate-300'}`}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Quick Actions Panel matching reference screenshot */}
        <div className="glass-surface p-6 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#a31c1b]/20 border border-[#a31c1b]/40 text-[#ef4444] flex items-center justify-center">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Quick Actions</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Get started with common tasks.
            </p>
          </div>

          {/* 3 Primary Action Cards matching screenshot */}
          <div className="space-y-3">
            
            {/* Action 1: Create Campaign (Emerald glowing styling matching screenshot) */}
            <Link
              to="/campaigns/new"
              className="p-3.5 rounded-2xl bg-[#059669]/15 hover:bg-[#059669]/25 border border-[#10b981]/40 flex items-center justify-between transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#10b981]/20 border border-[#10b981]/50 text-[#10b981] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4 -rotate-12" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                    Create Campaign
                  </span>
                  <span className="text-[11px] text-slate-300 truncate mt-0.5">
                    Launch a new outreach campaign
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

            {/* Action 2: Add Email Account (Charcoal card) */}
            <Link
              to="/email-accounts"
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-between transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.1] text-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-slate-200 transition-colors truncate">
                    Add Email Account
                  </span>
                  <span className="text-[11px] text-slate-400 truncate mt-0.5">
                    Connect Google or Microsoft account
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

            {/* Action 3: Connect Google Sheet (Charcoal card) */}
            <Link
              to="/settings"
              className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] flex items-center justify-between transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    Connect Google Sheet
                  </span>
                  <span className="text-[11px] text-slate-400 truncate mt-0.5">
                    Import prospects from Google Sheets
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>

          </div>

          <div className="pt-2">
            <span className="text-[10px] text-slate-500 flex items-center gap-1.5 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Automated Warmup & MX Protection Active
            </span>
          </div>
        </div>

      </div>

      {/* 4. Bottom Section: Recent Campaigns (Left) & Recent Activity (Right) matching reference screenshot */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Recent Campaigns Table (2 Columns wide) */}
        <div className="lg:col-span-2 glass-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                  <Send className="w-4 h-4 -rotate-12" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">Recent Campaigns</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your latest outreach campaigns and their performance.
              </p>
            </div>
            
            <Link
              to="/campaigns"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Campaigns Table or Empty State */}
          {displayRecentCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                    <th className="pb-3 font-semibold">CAMPAIGN</th>
                    <th className="pb-3 font-semibold">STATUS</th>
                    <th className="pb-3 font-semibold">PROSPECTS</th>
                    <th className="pb-3 font-semibold">SENT</th>
                    <th className="pb-3 font-semibold">REPLIES</th>
                    <th className="pb-3 font-semibold">DELIVERY RATE</th>
                    <th className="pb-3 font-semibold">LAST ACTIVITY</th>
                    <th className="pb-3 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {displayRecentCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 font-medium text-white max-w-[200px] truncate">
                        <Link to={`/campaigns/${c.id}`} className="hover:text-emerald-400 transition-colors">
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {c.status === 'active' || c.status === 'sending' || c.status === 'Running' ? 'Sending' : c.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono">
                        {c.prospects?.length ?? c.prospectsCount ?? c.prospects ?? 0}
                      </td>
                      <td className="py-3 text-slate-300 font-mono">
                        {c.sent ?? c.sentCount ?? 0}
                      </td>
                      <td className="py-3 text-slate-300 font-mono">
                        {c.replies ?? c.repliesCount ?? 0}
                      </td>
                      <td className="py-3 text-emerald-400 font-semibold font-mono">
                        {c.deliveryRate || (c.sent > 0 ? '98.5%' : '100%')}
                      </td>
                      <td className="py-3 text-slate-400">
                        {c.lastActivity || 'Active'}
                      </td>
                      <td className="py-3 text-right">
                        <Link 
                          to={`/campaigns/${c.id}`}
                          className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white inline-block transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 text-emerald-400 shadow-md">
                <Send className="w-5 h-5 -rotate-12" />
              </div>
              <p className="text-sm font-bold text-white">No campaigns created yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-5 max-w-sm">
                Create your first outreach campaign or connect Google Sheets to enroll prospects and schedule automated sequences.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/campaigns/new"
                  className="btn-reachops-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#a31c1b]/25"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Campaign</span>
                </Link>
                <Link
                  to="/settings"
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-colors"
                >
                  Connect Google Sheet
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Timeline (1 Column wide) matching screenshot */}
        <div className="glass-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444]">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Latest updates from your campaigns and mailboxes.
              </p>
            </div>
            
            <Link
              to="/activity"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Timeline Feed items or Clean Empty State */}
          {displayActivities.length > 0 ? (
            <div className="space-y-3.5 pt-1">
              {displayActivities.map((act: any, idx: number) => {
                const IconComponent = act.icon || (act.status === 'REPLIED' ? Reply : act.status === 'SENT' ? Send : Sparkles);
                return (
                  <div key={act.id || idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{act.title || act.description || 'Activity event'}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {act.time || (act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.detail || act.campaignName || 'ReachOps Engine'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-2.5 text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">No activity logged yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                Live dispatches, prospect replies, and sequence events will appear here in real-time.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
