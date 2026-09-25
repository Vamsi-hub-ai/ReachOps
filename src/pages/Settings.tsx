import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, CreditCard, Bell, Key, Shield, CheckCircle2, Blocks, Webhook, MessageSquare, Users, UserPlus, MoreHorizontal, Plus } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-primary' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {activeTab === 'profile' && (
            <Card className="shadow-sm border-gray-200 animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your personal information and email address.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                    V
                  </div>
                  <Button variant="outline">Change Avatar</Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input defaultValue="Vamsi" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input defaultValue="K" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="vamsi@example.com" type="email" />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the Pro plan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Pro Plan</h3>
                      <p className="text-gray-500 mt-1">10,000 emails/month • 5 Users</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">$99<span className="text-sm font-normal text-gray-500">/mo</span></div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline">Cancel Plan</Button>
                    <Button>Upgrade Plan</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold font-mono">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Visa ending in 4242</p>
                        <p className="text-xs text-gray-500">Expires 12/2028</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'api' && (
            <Card className="shadow-sm border-gray-200 animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage your secret API keys for programmatic access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-3">
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <p>Keep your API keys secure. Do not share them in publicly accessible areas such as GitHub, client-side code, and so forth.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Production Key</h4>
                      <p className="text-xs text-gray-500">Created Oct 1, 2026</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 font-mono">
                        sk_live_••••••••••••••••
                      </code>
                      <Button variant="outline" size="sm">Reveal</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Development Key</h4>
                      <p className="text-xs text-gray-500">Created Oct 1, 2026</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 font-mono">
                        sk_test_••••••••••••••••
                      </code>
                      <Button variant="outline" size="sm">Reveal</Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="outline"><Key className="w-4 h-4 mr-2" /> Generate New Key</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Connected Apps</h2>
                <p className="text-gray-500 text-sm mt-1">Sync your prospects and campaign data with your favorite tools.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'HubSpot CRM', type: 'CRM', status: 'Connected', desc: 'Sync prospects, activities, and opportunities bi-directionally.', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
                  { name: 'Salesforce', type: 'CRM', status: 'Connect', desc: 'Enterprise-grade CRM sync for leads and contacts.', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { name: 'Pipedrive', type: 'CRM', status: 'Connect', desc: 'Push engaged leads directly into your sales pipeline.', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
                  { name: 'Slack', type: 'Communication', status: 'Connect', desc: 'Get notified immediately when a hot prospect replies.', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' }
                ].map((app, i) => (
                  <Card key={i} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${app.bg} ${app.border} border`}>
                          {app.icon ? <app.icon className={`w-6 h-6 ${app.color}`} /> : <Blocks className={`w-6 h-6 ${app.color}`} />}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${app.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {app.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900">{app.name}</h3>
                      <p className="text-xs text-primary font-medium mb-2">{app.type}</p>
                      <p className="text-sm text-gray-500 flex-1">{app.desc}</p>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button variant={app.status === 'Connected' ? 'outline' : 'default'} className="w-full">
                          {app.status === 'Connected' ? 'Manage Settings' : 'Connect App'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="shadow-sm border-gray-200 mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-gray-400" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>Send real-time events to your custom endpoints or Zapier.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">No Webhooks Configured</h4>
                      <p className="text-sm text-gray-500 mt-1">Listen to events like `email.opened`, `email.replied`, and `campaign.completed`.</p>
                    </div>
                    <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Endpoint</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                  <p className="text-gray-500 text-sm mt-1">Manage who has access to your workspace and campaigns.</p>
                </div>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                </Button>
              </div>

              <Card className="shadow-sm border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Last Active</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                              V
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Vamsi K (You)</div>
                              <div className="text-xs text-gray-500">vamsi@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-semibold">
                            Owner
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">Just now</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              S
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Sarah Jenkins</div>
                              <div className="text-xs text-gray-500">sarah@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                            Admin
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">2 hours ago</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>

                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                              J
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">John Doe</div>
                              <div className="text-xs text-gray-500">john@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                            Member
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Invited
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">-</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {['notifications', 'security'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-center animate-in slide-in-from-right-4 duration-300">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 capitalize">{activeTab} Settings</h3>
              <p className="text-gray-500 mt-1 max-w-sm">This section is fully functional but contains no configuration options for this demo.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
