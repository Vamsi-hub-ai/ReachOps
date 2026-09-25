import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Search, Filter, FileText, Users } from 'lucide-react';

const mockActivity = [
  { id: 1, action: 'Campaign Started', time: '2 hours ago', details: 'Q4 Enterprise Outreach campaign was activated.', user: 'Victor Admin', icon: Activity, color: 'text-blue-500', v: '' },
  { id: 2, action: 'New Template Created', time: '5 hours ago', details: 'Cold Outreach template was saved.', user: 'Victor Admin', icon: FileText, color: 'text-green-500', v: '' },
  { id: 3, action: 'Prospects Imported', time: '1 day ago', details: '500 prospects were imported from CSV.', user: 'Victor Admin', icon: Users, color: 'text-purple-500', v: '' },
];

export default function ActivityLog() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Activity Log</h1>
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <p className="text-gray-500 mt-1">Audit trail of all actions taken in your account.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search activity..." 
              className="pl-9 bg-white border-gray-200"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-200"></div>

            <div className="divide-y divide-gray-100">
              {mockActivity.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="p-6 flex items-start gap-6 hover:bg-gray-50/50 transition-colors relative">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white ${act.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{act.action}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{act.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{act.details || act.v}</p>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">
                          {act.user.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">{act.user}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {mockActivity.length === 0 && (
                <div className="p-8 text-center text-gray-500">
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
