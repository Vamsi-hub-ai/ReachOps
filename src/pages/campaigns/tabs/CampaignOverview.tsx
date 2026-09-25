import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, MailOpen, MousePointerClick, Reply } from 'lucide-react';


export default function CampaignOverview() {

  // Mock data tailored for the Overview dashboard
  const metrics = [
    { title: 'Total Sent', value: '0', icon: Send, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Opened', value: '0%', icon: MailOpen, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Clicked', value: '0%', icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Replied', value: '0%', icon: Reply, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <div className={`p-2 rounded-lg ${metric.bg}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <h2 className="text-3xl font-bold text-gray-900">{metric.value}</h2>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Active Sequences / Progress */}
        <Card className="col-span-2 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Funnel Progress</CardTitle>
            <CardDescription>Breakdown of leads currently moving through the sequence.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Step 1: Initial Outreach', count: 0, total: 100, color: 'bg-blue-500' },
                { label: 'Step 2: Follow-up', count: 0, total: 100, color: 'bg-amber-500' },
                { label: 'Step 3: Final Push', count: 0, total: 100, color: 'bg-primary' },
              ].map((step, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{step.label}</span>
                    <span className="text-gray-500">{step.count} active</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${step.color} rounded-full`} 
                      style={{ width: `${(step.count / step.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Activity Feed */}
        <Card className="col-span-1 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest events from this campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* No activity yet */}
              <div className="p-4 text-center text-sm text-gray-500">
                No recent activity.
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
