import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, Users, GitBranch, FileText, Mail, 
  Calendar, Inbox, Activity, Settings, ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CampaignDetailLayout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const tabs = [
    { name: 'Overview', path: 'overview', icon: BarChart },
    { name: 'Leads', path: 'leads', icon: Users },
    { name: 'Sequence', path: 'sequence', icon: GitBranch },
    { name: 'Templates', path: 'templates', icon: FileText },
    { name: 'Accounts', path: 'accounts', icon: Mail },
    { name: 'Schedule', path: 'schedule', icon: Calendar },
    { name: 'Inbox', path: 'inbox', icon: Inbox },
    { name: 'Analytics', path: 'analytics', icon: BarChart },
    { name: 'Activity', path: 'activity', icon: Activity },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50/50 -m-6 animate-in fade-in duration-300">
      
      {/* Campaign Header & Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')} className="text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {id === '1' ? 'Q4 Enterprise Outreach' : 'Campaign Configuration'}
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider">
                Draft
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">ID: {id} • Created on Oct 12, 2026</p>
          </div>
          
          <div className="ml-auto flex gap-2">
             <Button variant="outline">Test Campaign</Button>
             <Button className="bg-green-600 hover:bg-green-700">Launch</Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 overflow-x-auto hide-scrollbar border-b border-gray-100">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={`/campaigns/${id}/${tab.path}`}
              className={({ isActive }) => `
                flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Campaign Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="p-6 h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
