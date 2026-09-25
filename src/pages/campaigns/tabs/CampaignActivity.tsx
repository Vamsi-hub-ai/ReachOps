import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CampaignActivity() {
  const [filter, setFilter] = useState('All');

  const activities: any[] = [];

  const filteredActivities = filter === 'All' ? activities : activities.filter(a => {
    if (filter === 'Sends') return a.type === 'send';
    if (filter === 'Replies') return a.type === 'reply';
    if (filter === 'System & Errors') return a.type === 'system' || a.type === 'error';
    return true;
  });

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
          <p className="text-sm text-gray-500">A detailed audit trail of everything happening in this campaign.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['All', 'Sends', 'Replies', 'System & Errors'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  filter === f 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No activities found for this filter.</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 sm:p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.bg}`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">{activity.text}</p>
                    <div className="flex items-center text-xs text-gray-500 gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{activity.date} at {activity.time}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-6">
        <Button variant="outline" className="text-gray-500">Load More Activity</Button>
      </div>

    </div>
  );
}
