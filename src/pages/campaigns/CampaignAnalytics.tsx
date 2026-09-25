import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Send, MailOpen, MousePointerClick, Reply, AlertCircle, Download, Activity, Calendar } from 'lucide-react';

const mockStats = {
  campaignName: 'Campaign Name',
  status: 'Draft',
  enrolled: 0,
  sent: 0,
  opened: 0,
  clicked: 0,
  replied: 0,
  bounced: 0,
  unsubscribed: 0,
};

const mockActivity: any[] = [];

export default function CampaignAnalytics() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stats = mockStats;

  // In production, fetch data based on campaignId

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-gray-500" onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Campaigns
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{stats.campaignName}</h1>
            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider">
              {stats.status}
            </span>
          </div>
          <p className="text-gray-500 mt-1 flex items-center">
            <Calendar className="w-4 h-4 mr-1.5" /> Started Oct 12, 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
          <Button onClick={() => navigate(`/campaigns/${campaignId || 'mock'}/sequence`)}>
            Edit Sequence
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Enrolled" value={stats.enrolled} icon={Users} color="text-gray-600" bg="bg-gray-100" />
        <MetricCard title="Sent" value={stats.sent} icon={Send} color="text-blue-600" bg="bg-blue-100" />
        <MetricCard title="Opened" value={stats.opened} icon={MailOpen} color="text-amber-600" bg="bg-amber-100" />
        <MetricCard title="Clicked" value={stats.clicked} icon={MousePointerClick} color="text-purple-600" bg="bg-purple-100" />
        <MetricCard title="Replied" value={stats.replied} icon={Reply} color="text-green-600" bg="bg-green-100" />
        <MetricCard title="Bounced" value={stats.bounced} icon={AlertCircle} color="text-red-600" bg="bg-red-100" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Funnel Visualization */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Track the drop-off rates at each stage of your campaign.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-6">
              <FunnelBar 
                label="Delivery Rate" 
                subtext="Sent vs Enrolled"
                count={stats.sent} 
                total={stats.enrolled} 
                color="bg-blue-500" 
              />
              <FunnelBar 
                label="Open Rate" 
                subtext="Opened vs Sent"
                count={stats.opened} 
                total={stats.sent} 
                color="bg-amber-500" 
              />
              <FunnelBar 
                label="Click Rate" 
                subtext="Clicked vs Opened"
                count={stats.clicked} 
                total={stats.opened} 
                color="bg-purple-500" 
              />
              <FunnelBar 
                label="Reply Rate" 
                subtext="Replied vs Sent"
                count={stats.replied} 
                total={stats.sent} 
                color="bg-green-500" 
              />
            </div>
            
            {/* Custom SVG Trend Chart (Mocking Activity over time) */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Replies over last 7 days</h4>
              <div className="h-32 w-full flex items-end justify-between gap-2 px-2">
                {[0, 0, 0, 0, 0, 0, 0].map((val, i) => (
                  <div key={i} className="w-full bg-green-100 rounded-t-sm relative group transition-all hover:bg-green-200" style={{ height: `${(val/50)*100}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest prospect interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockActivity.map((act) => (
                <div key={act.id} className="flex gap-4">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    act.type === 'reply' ? 'bg-green-100 text-green-600' :
                    act.type === 'click' ? 'bg-purple-100 text-purple-600' :
                    act.type === 'open' ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {act.type === 'reply' ? <Reply className="w-4 h-4" /> :
                     act.type === 'click' ? <MousePointerClick className="w-4 h-4" /> :
                     act.type === 'open' ? <MailOpen className="w-4 h-4" /> :
                     <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{act.user}</p>
                    <p className="text-sm text-gray-600">{act.detail}</p>
                    <span className="text-xs text-gray-400">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary">View All Activity</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="shadow-sm border-gray-200 hover:border-gray-300 transition-colors">
      <CardContent className="p-4 flex flex-col justify-between h-full min-h-[120px]">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-gray-500">{title}</span>
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function FunnelBar({ label, subtext, count, total, color }: any) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="font-semibold text-gray-900 block">{label}</span>
          <span className="text-xs text-gray-500">{subtext}</span>
        </div>
        <div className="text-right">
          <span className="font-bold text-lg text-gray-900">{percentage}%</span>
          <span className="text-sm text-gray-500 block">({count}/{total})</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div 
          className={`${color} h-full rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
