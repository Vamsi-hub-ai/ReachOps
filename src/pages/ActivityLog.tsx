import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Search, Filter, FileText, Users, Mail, CheckCircle2 } from 'lucide-react';

export default function ActivityLog() {
  const [activities, setActivities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/activity-log')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.logs)) {
          setActivities(data.logs.map((log: any) => ({
            id: log.id,
            action: log.status === 'REPLIED' ? 'Prospect Replied' : log.status === 'OPENED' ? 'Email Opened' : 'Email Sent',
            time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: log.description,
            user: log.campaignName,
            icon: log.status === 'REPLIED' ? Users : log.status === 'OPENED' ? CheckCircle2 : Mail,
            color: log.status === 'REPLIED' ? 'text-emerald-500' : log.status === 'OPENED' ? 'text-amber-500' : 'text-blue-500',
          })));
        }
      })
      .catch(console.error);
  }, []);

  const filteredActivities = activities.filter(act => 
    act.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.user.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Activity Log</h1>
            <Activity className="w-6 h-6 text-[#9FA0FF]" />
          </div>
          <p className="text-slate-400 mt-1">Audit trail of all actions taken in your account.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-[#141520] border-[#26283b] text-slate-200 hover:text-white hover:bg-[#1a1c29]">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-[#202235] bg-[#0e0f17]">
        <div className="p-4 border-b border-[#1c1e2d] bg-[#090a10]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search activity..." 
              className="pl-9 bg-[#141520] border-[#26283b] text-white placeholder-slate-500 focus:border-[#9FA0FF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-10 top-0 bottom-0 w-px bg-[#202235]"></div>

            <div className="divide-y divide-[#1c1e2d]">
              {filteredActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="p-6 flex items-start gap-6 hover:bg-[#141520]/60 transition-colors relative">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#202235] bg-[#141520] ${act.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-white">{act.action}</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{act.time}</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{act.details || act.v}</p>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#1e2030] border border-[#26283b] text-[#9FA0FF] flex items-center justify-center text-[10px] font-bold">
                          {act.user.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{act.user}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredActivities.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  No activity found in your account yet.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
