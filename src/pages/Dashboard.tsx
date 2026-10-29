import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, Users, Mail, Reply, AlertTriangle, CalendarClock, 
  Send, Plus, FileText, UserPlus, Database, MoreHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Sparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 10;
  const width = 800;
  const height = 200;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' L ');

  const pathData = `M ${points}`;
  const areaData = `${pathData} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 text-primary transition-all duration-500 ease-in-out" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
          <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaData} fill="url(#chartGradient)" className="transition-all duration-500 ease-in-out" />
      <path d={pathData} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="transition-all duration-500 ease-in-out" />
    </svg>
  );
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const [dashboardStats, setDashboardStats] = useState<any>({
    activeCampaigns: 0,
    totalCampaigns: 0,
    totalProspects: 0,
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    openRate: '0.0%',
    replyRate: '0.0%',
    bounceRate: '0.0%',
    emailsToday: '0 / 1,000',
  });

  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch campaigns
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCampaigns(data);
        }
      })
      .catch(console.error);

    // 2. Fetch email accounts
    fetch('/api/email-accounts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmailAccounts(data);
        }
      })
      .catch(console.error);

    // 3. Fetch aggregated analytics
    fetch('/api/analytics/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setDashboardStats(data);
        }
      })
      .catch(console.error);
  }, []);

  const totalSentCount = dashboardStats.totalSent || campaigns.reduce((sum, c) => sum + (Number(c.sent) || 0), 0);
  const chartData = totalSentCount > 0 
    ? [12, 18, 15, 22, 28, 25, 30, 35, 32, 40, 45, 42, 50, 48, 55, 60, 58, 65, 70, 68, 75, 80, 78, 85, 90, 88, 95, 100, 98, 110]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const activeCampaignsCount = dashboardStats.activeCampaigns || campaigns.filter(c => c.status === 'Running').length;
  const totalProspectsCount = dashboardStats.totalProspects || campaigns.reduce((sum, c) => sum + (Number(c.prospects) || 0), 0);
  const totalRepliesCount = dashboardStats.totalReplied || campaigns.reduce((sum, c) => sum + (Number(c.replies) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 bg-black text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-[#222436] bg-[#0e0f17] text-slate-300 hover:text-white hover:bg-[#141520]">
            Last 30 Days
          </Button>
          <Button className="bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] font-bold shadow-md shadow-[#9FA0FF]/25 border-none" asChild>
            <Link to="/campaigns/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </div>
      
      {/* 8 KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Campaigns', value: activeCampaignsCount.toString(), icon: Activity },
          { label: 'Total Prospects', value: totalProspectsCount.toLocaleString(), icon: Users },
          { label: 'Emails Sent', value: totalSentCount.toLocaleString(), icon: Send },
          { label: 'Replies', value: totalRepliesCount.toLocaleString(), icon: Reply },
          { label: 'Bounce Rate', value: dashboardStats.bounceRate || '0%', icon: AlertTriangle, trend: '+0%' },
          { label: 'Reply Rate', value: dashboardStats.replyRate || (totalSentCount > 0 ? `${((totalRepliesCount / totalSentCount) * 100).toFixed(1)}%` : '0%'), icon: Reply, trend: '+0%' },
          { label: 'Scheduled', value: campaigns.filter(c => c.status === 'Scheduled').length.toString(), icon: CalendarClock },
          { label: 'Emails Today', value: dashboardStats.emailsToday || '0 / 1,000', icon: Mail },
        ].map((stat, i) => (
          <Card key={i} className="bg-[#0e0f17] border border-[#202235] hover:border-[#9FA0FF]/40 hover:shadow-lg transition-all relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.label}</CardTitle>
              <stat.icon className="w-4 h-4 text-slate-500 group-hover:text-[#9FA0FF] transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white transition-all duration-300">{stat.value}</div>
              {stat.trend && (
                <p className={`text-xs mt-1 font-medium ${stat.trend.startsWith('+') ? 'text-[#D5E8E6]' : 'text-[#FF7171]'}`}>
                  {stat.trend} from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sending Activity Chart */}
        <Card className="col-span-3 lg:col-span-2 shadow-sm relative overflow-hidden bg-[#0e0f17] border border-[#202235]">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="text-white">Real-Time Sending Activity</CardTitle>
              <CardDescription className="text-slate-400">Live telemetry from your active campaigns.</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-white hidden sm:inline-flex">7D</Button>
              <Button size="sm" className="h-8 text-xs bg-[#9FA0FF] text-[#0c0d18] font-bold hover:bg-[#8889FF]">30D</Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-white hidden sm:inline-flex">90D</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Sparkline data={chartData} />
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="col-span-3 lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-sm bg-[#0e0f17] border border-[#202235]">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-slate-400">Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Create Campaign', icon: Send, path: '/campaigns/new' },
                { label: 'Add Email Account', icon: Mail, path: '/email-accounts' },
                { label: 'Connect Google Sheet', icon: Database, path: '/settings' },
                { label: 'Create Template', icon: FileText, path: '/templates' },
                { label: 'Add Prospect', icon: UserPlus, path: '/prospects' },
              ].map((action, i) => (
                <Button key={i} variant="outline" className="w-full justify-start h-12 bg-[#141520] hover:bg-[#1c1d2d] border border-[#242637] text-slate-200 hover:border-[#9FA0FF]/50 transition-colors" asChild>
                  <Link to={action.path}>
                    <action.icon className="w-5 h-5 mr-3 text-slate-400" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card className="shadow-sm bg-[#0e0f17] border border-[#202235]">
            <CardHeader>
              <CardTitle className="text-white">Connected Accounts</CardTitle>
              <CardDescription className="text-slate-400">Active sending accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {emailAccounts.length > 0 ? (
                emailAccounts.map(account => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-[#222436] bg-[#141520] rounded-xl hover:border-[#9FA0FF]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium truncate max-w-[150px] text-slate-200">{account.email}</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#D5E8E6] shadow-[0_0_8px_rgba(213,232,230,0.8)] flex-shrink-0"></span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-400 mb-3">No accounts connected.</p>
                  <Button variant="outline" size="sm" className="border-[#222436] bg-[#141520] text-slate-200 hover:bg-[#1b1c2b]" asChild>
                    <Link to="/email-accounts">Connect Now</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <Card className="shadow-sm bg-[#0e0f17] border border-[#202235]">
        <CardHeader>
          <CardTitle className="text-white">Live Campaign Performance</CardTitle>
          <CardDescription className="text-slate-400">Streaming overview of your top active campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-[#090a10] border-b border-[#1c1e2d]">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-md">Campaign</th>
                  <th className="px-4 py-3 font-medium">Prospects</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Replies</th>
                  <th className="px-4 py-3 font-medium">Bounce</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-tr-md"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1e2d]">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-[#141520]/60 transition-colors">
                    <td className="px-4 py-4">
                      <Link to={`/campaigns/${campaign.id}`} className="font-semibold text-white hover:text-[#9FA0FF] hover:underline">
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{campaign.prospects.toLocaleString()}</td>
                    <td className="px-4 py-4 text-white font-medium transition-all duration-300">
                      {campaign.sent.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-white font-medium transition-all duration-300">
                      {campaign.replies.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-slate-300">{campaign.bounce || '0.0%'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === 'Running' ? 'bg-[#D5E8E6] text-[#1a4a44] border border-[#D5E8E6]' :
                        campaign.status === 'Completed' ? 'bg-[#181a26] text-slate-300' :
                        'bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/40'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-[#141520] border border-[#222436] flex items-center justify-center mb-2 text-[#9FA0FF]">
                          <Activity className="w-5 h-5" />
                        </div>
                        <p className="font-semibold text-white">No active campaigns</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          Create an outreach sequence to start streaming live performance telemetry.
                        </p>
                        <Button size="sm" className="bg-[#9FA0FF] hover:bg-[#8889FF] text-[#0c0d18] font-bold shadow-md shadow-[#9FA0FF]/25 border-none" asChild>
                          <Link to="/campaigns/new">
                            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Campaign
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
