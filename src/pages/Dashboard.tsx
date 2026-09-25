
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
  // Real-time state (Simulated values for now)
  const emailsSent = 0;
  const replies = 0;
  const chartData = [12, 18, 15, 22, 28, 25, 30, 35, 32, 40, 45, 42, 50, 48, 55, 60, 58, 65, 70, 68, 75, 80, 78, 85, 90, 88, 95, 100, 98, 110];
  const campaigns: any[] = [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline">Last 30 Days</Button>
          <Button asChild>
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
          { label: 'Active Campaigns', value: '0', icon: Activity },
          { label: 'Total Prospects', value: '0', icon: Users },
          { label: 'Emails Sent', value: emailsSent.toLocaleString(), icon: Send },
          { label: 'Replies', value: replies.toLocaleString(), icon: Reply },
          { label: 'Bounce Rate', value: '0%', icon: AlertTriangle, trend: '+0%' },
          { label: 'Reply Rate', value: '0%', icon: Reply, trend: '+0%' },
          { label: 'Scheduled', value: '0', icon: CalendarClock },
          { label: 'Emails Today', value: '0 / 1,000', icon: Mail },
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
              <stat.icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 transition-all duration-300">{stat.value}</div>
              {stat.trend && (
                <p className={`text-xs mt-1 font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend} from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sending Activity Chart */}
        <Card className="col-span-3 lg:col-span-2 shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle>Real-Time Sending Activity</CardTitle>
              <CardDescription>Live telemetry from your active campaigns.</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs hidden sm:inline-flex">7D</Button>
              <Button variant="secondary" size="sm" className="h-8 text-xs">30D</Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs hidden sm:inline-flex">90D</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Sparkline data={chartData} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3 lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Create Campaign', icon: Send, path: '/campaigns/new' },
              { label: 'Add Email Account', icon: Mail, path: '/email-accounts' },
              { label: 'Connect Google Sheet', icon: Database, path: '/settings' },
              { label: 'Create Template', icon: FileText, path: '/templates' },
              { label: 'Add Prospect', icon: UserPlus, path: '/prospects' },
            ].map((action, i) => (
              <Button key={i} variant="outline" className="w-full justify-start h-12 hover:border-primary/50 transition-colors" asChild>
                <Link to={action.path}>
                  <action.icon className="w-5 h-5 mr-3 text-gray-500" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Live Campaign Performance</CardTitle>
          <CardDescription>Streaming overview of your top active campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/80">
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
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <Link to={`/campaigns/${campaign.id}`} className="font-medium text-primary hover:underline">
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{campaign.prospects.toLocaleString()}</td>
                    <td className="px-4 py-4 text-gray-900 font-medium transition-all duration-300">
                      {campaign.sent.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-gray-900 font-medium transition-all duration-300">
                      {campaign.replies.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{campaign.bounce}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'Running' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
