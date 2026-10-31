import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GoogleSheetsManagerModal from '@/components/google-sheets/GoogleSheetsManagerModal';
import { User, CreditCard, Bell, Key, Shield, CheckCircle2, Blocks, 
  Webhook, MessageSquare, Users, UserPlus, MoreHorizontal, Plus, 
  Trash2, Copy, Eye, EyeOff, Check, Send, Smartphone, 
  RefreshCw, AlertCircle, Sparkles, Laptop, Download, Globe, FileSpreadsheet } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  status: 'Active' | 'Invited';
  lastActive: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  revealed: boolean;
}

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'Active' | 'Paused';
  lastDelivery: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // 1. Profile State
  const [profile, setProfile] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const parsed = savedUser ? JSON.parse(savedUser) : null;
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) return JSON.parse(savedProfile);
      return {
        firstName: parsed?.name?.split(' ')[0] || 'Demo',
        lastName: parsed?.name?.split(' ')[1] || 'User',
        email: parsed?.email || 'demo@reachops.com',
        title: 'VP of Growth & Outreach',
        company: 'ReachOps Enterprise',
        timezone: 'Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)',
        avatarColor: '#9FA0FF'
      };
    } catch {
      return {
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@reachops.com',
        title: 'VP of Growth & Outreach',
        company: 'ReachOps Enterprise',
        timezone: 'Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)',
        avatarColor: '#9FA0FF'
      };
    }
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 2. Billing & Plan State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    number: '•••• •••• •••• 4242',
    exp: '12/28',
    brand: 'VISA'
  });

  // 3. Notifications State (Real-time toggle switches)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('user_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      campaignCompleted: true,
      positiveReply: true,
      dailyDigest: true,
      deliverabilityWarning: true,
      warmupComplete: false,
      slackAlerts: true
    };
  });

  // 4. API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem('user_api_keys');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'key-1',
        name: 'Production Outbound Engine',
        key: 'sk_live_' + Array.from({length: 24}, () => Math.random().toString(36)[2]).join(''),
        created: 'Oct 15, 2026',
        lastUsed: '2 mins ago',
        revealed: false
      },
      {
        id: 'key-2',
        name: 'Development & Webhook Testing',
        key: 'sk_test_' + Array.from({length: 24}, () => Math.random().toString(36)[2]).join(''),
        created: 'Oct 22, 2026',
        lastUsed: '1 day ago',
        revealed: false
      }
    ];
  });
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // 5. Integrations & Webhooks State
  const [integrations, setIntegrations] = useState([
    { id: 'hubspot', name: 'HubSpot CRM', type: 'CRM', connected: true, desc: 'Sync prospects, activities, and won deals in real-time.', color: 'text-[#FF7171]', bg: 'bg-[#FF7171]/15', border: 'border-[#FF7171]/30' },
    { id: 'salesforce', name: 'Salesforce', type: 'CRM', connected: false, desc: 'Enterprise bi-directional sync for leads and enterprise accounts.', color: 'text-[#9FA0FF]', bg: 'bg-[#9FA0FF]/15', border: 'border-[#9FA0FF]/30' },
    { id: 'pipedrive', name: 'Pipedrive', type: 'CRM', connected: false, desc: 'Push engaged leads directly into sales deal stages.', color: 'text-[#D5E8E6]', bg: 'bg-[#D5E8E6]/15', border: 'border-[#D5E8E6]/30' },
    { id: 'slack', name: 'Slack', type: 'Notifications', connected: true, desc: 'Receive real-time alerts in #leads when prospects reply.', icon: MessageSquare, color: 'text-[#FFF3E3]', bg: 'bg-[#FFF3E3]/15', border: 'border-[#FFF3E3]/30' },
    { id: 'sheets', name: 'Google Sheets', type: 'Data Sync', connected: true, desc: 'Live auto-import prospects from shared sheets.', color: 'text-[#9FA0FF]', bg: 'bg-[#9FA0FF]/15', border: 'border-[#9FA0FF]/30' },
    { id: 'zapier', name: 'Zapier', type: 'Automation', connected: false, desc: 'Connect ReachOps to 5,000+ custom automation workflows.', color: 'text-[#FF7171]', bg: 'bg-[#FF7171]/15', border: 'border-[#FF7171]/30' }
  ]);

  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    { id: 'wh-1', url: 'https://api.reachops-demo.com/webhooks/leads', events: ['email.replied', 'campaign.completed'], status: 'Active', lastDelivery: '5 mins ago (200 OK)' }
  ]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [testWebhookResult, setTestWebhookResult] = useState<string | null>(null);

  // 6. Team State
  const [team, setTeam] = useState<TeamMember[]>([
    { id: 'tm-1', name: 'Demo User (You)', email: 'demo@reachops.com', role: 'Owner', status: 'Active', lastActive: 'Just now' },
    { id: 'tm-2', name: 'Sarah Jenkins', email: 'sarah@reachops.com', role: 'Admin', status: 'Active', lastActive: '12 mins ago' },
    { id: 'tm-3', name: 'Alex Rivera', email: 'alex@reachops.com', role: 'Member', status: 'Active', lastActive: '3 hours ago' },
    { id: 'tm-4', name: 'Priya Sharma', email: 'priya@enterprise.co', role: 'Viewer', status: 'Invited', lastActive: 'Invitation Pending' }
  ]);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member' | 'Viewer'>('Member');

  // 7. Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessions, setSessions] = useState([
    { id: 's-1', device: 'Chrome on Windows 11', location: 'New Delhi, India', ip: '103.24.120.4', current: true, time: 'Active now' },
    { id: 's-2', device: 'Safari on iPhone 15 Pro', location: 'San Francisco, USA', ip: '172.56.21.89', current: false, time: '2 hours ago' },
    { id: 's-3', device: 'Firefox on MacOS Sequoia', location: 'London, UK', ip: '82.165.197.1', current: false, time: '3 days ago' }
  ]);

  // Toast trigger helper
  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Profile Save
  const handleSaveProfile = () => {
    setIsSavingProfile(true);
    setTimeout(() => {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      const updatedUser = {
        id: 'demo-user-id',
        name: fullName || 'Demo User',
        email: profile.email || 'demo@reachops.com'
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('user_profile', JSON.stringify(profile));
      window.dispatchEvent(new Event('user-updated'));
      setIsSavingProfile(false);
      showToast('Profile updated in real-time!');
    }, 400);
  };

  // Notification Toggle
  const toggleNotification = (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    localStorage.setItem('user_notifications', JSON.stringify(next));
    showToast(`Notification setting updated: ${String(key)}`);
  };

  // Copy API key
  const handleCopyKey = (id: string, keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    showToast('API key copied to clipboard!');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Generate new API key
  const handleGenerateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey: ApiKeyItem = {
      id: 'key-' + Date.now(),
      name: newKeyName,
      key: 'sk_live_' + Array.from({length: 28}, () => Math.random().toString(36)[2]).join(''),
      created: 'Just now',
      lastUsed: 'Never',
      revealed: true
    };
    const nextKeys = [newKey, ...apiKeys];
    setApiKeys(nextKeys);
    localStorage.setItem('user_api_keys', JSON.stringify(nextKeys));
    setNewKeyName('');
    setNewKeyModal(false);
    showToast(`New API Key "${newKey.name}" generated!`);
  };

  // Revoke API key
  const handleRevokeKey = (id: string) => {
    const nextKeys = apiKeys.filter(k => k.id !== id);
    setApiKeys(nextKeys);
    localStorage.setItem('user_api_keys', JSON.stringify(nextKeys));
    showToast('API key revoked.');
  };

  // Toggle Integration
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.connected;
        showToast(`${item.name} ${nextState ? 'connected' : 'disconnected'}!`);
        return { ...item, connected: nextState };
      }
      return item;
    }));
  };

  // Add Webhook
  const handleAddWebhook = () => {
    if (!newWebhookUrl.trim()) return;
    const newWh: WebhookItem = {
      id: 'wh-' + Date.now(),
      url: newWebhookUrl,
      events: ['email.replied', 'campaign.completed'],
      status: 'Active',
      lastDelivery: 'Never'
    };
    setWebhooks([newWh, ...webhooks]);
    setNewWebhookUrl('');
    setShowWebhookModal(false);
    showToast('Webhook endpoint registered!');
  };

  // Test Webhook
  const handleTestWebhook = () => {
    setTestWebhookResult('Sending mock event...');
    setTimeout(() => {
      setTestWebhookResult('HTTP 200 OK — Payload delivered in 34ms');
      setTimeout(() => setTestWebhookResult(null), 4000);
    }, 600);
  };

  // Invite Team Member
  const handleInviteMember = () => {
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: 'tm-' + Date.now(),
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Invited',
      lastActive: 'Invitation Pending'
    };
    setTeam([...team, newMember]);
    setInviteName('');
    setInviteEmail('');
    setInviteModal(false);
    showToast(`Invitation sent to ${newMember.email}`);
  };

  // Remove Team Member
  const handleRemoveMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
    showToast('Team member removed.');
  };

  // Revoke Session
  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast('Device session terminated.');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing & Quota', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'team', label: 'Team Members', icon: Users },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-500 text-slate-100">
      
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141520] border border-[#9FA0FF] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-[#9FA0FF]/20 flex items-center justify-center text-[#9FA0FF]">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/40">
              Live Real-Time
            </span>
          </div>
          <p className="text-slate-400 mt-1">Manage your enterprise workspace, team credentials, API tokens, and sending quotas.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1 bg-[#0e0f17] p-2 rounded-2xl border border-[#202235]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#9FA0FF] text-[#0c0d18] shadow-md shadow-[#9FA0FF]/25 font-bold' 
                    : 'text-slate-300 hover:bg-[#181a28] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0c0d18]' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <Card className="shadow-2xl border-[#202235] bg-[#0e0f17] animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="border-b border-[#1c1e2d] pb-5">
                <CardTitle className="text-xl font-bold text-white">Personal Profile</CardTitle>
                <CardDescription className="text-slate-400">Update your account name, avatar badge, and workspace credentials.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                
                {/* Avatar Preview & Customizer */}
                <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[#141520] border border-[#242637]">
                  <div 
                    style={{ backgroundColor: profile.avatarColor }}
                    className="w-16 h-16 rounded-2xl text-[#0c0d18] flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-[#202235]"
                  >
                    {profile.firstName?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Profile Avatar Badge</p>
                    <p className="text-xs text-slate-400">Select your real-time theme color accent:</p>
                    <div className="flex items-center gap-2 pt-1">
                      {['#9FA0FF', '#D5E8E6', '#FFF3E3', '#FF7171'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setProfile({ ...profile, avatarColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${profile.avatarColor === color ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">First Name</Label>
                    <Input 
                      value={profile.firstName} 
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Last Name</Label>
                    <Input 
                      value={profile.lastName} 
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Work Email Address</Label>
                    <Input 
                      value={profile.email} 
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      type="email"
                      className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">Job Title</Label>
                    <Input 
                      value={profile.title} 
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Default Sending Timezone</Label>
                  <div className="flex items-center gap-3">
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      className="flex-1 h-11 bg-[#141520] border border-[#26283b] text-white rounded-md px-3 text-sm focus:outline-none focus:border-[#9FA0FF]"
                    >
                      <option value="Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)">Chennai, Kolkata, Mumbai, New Delhi (UTC+05:30)</option>
                      <option value="Eastern Time (US & Canada) (UTC-05:00)">Eastern Time (US & Canada) (UTC-05:00)</option>
                      <option value="Pacific Time (US & Canada) (UTC-08:00)">Pacific Time (US & Canada) (UTC-08:00)</option>
                      <option value="Greenwich Mean Time (UTC+00:00)">Greenwich Mean Time (UTC+00:00)</option>
                      <option value="Central European Time (UTC+01:00)">Central European Time (UTC+01:00)</option>
                    </select>
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end border-t border-[#1c1e2d]">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="bg-[#9FA0FF] hover:bg-[#8e8fff] text-[#0c0d18] font-bold px-6 shadow-md shadow-[#9FA0FF]/25 border-none"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: BILLING & QUOTAS */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Billing Cycle Switcher */}
              <div className="flex items-center justify-between bg-[#0e0f17] p-4 rounded-2xl border border-[#202235]">
                <div>
                  <h3 className="font-bold text-white text-base">Subscription Tier</h3>
                  <p className="text-xs text-slate-400">Switch billing cycle to unlock 20% annual discount.</p>
                </div>
                <div className="flex items-center bg-[#141520] p-1 rounded-xl border border-[#26283b]">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${billingCycle === 'monthly' ? 'bg-[#9FA0FF] text-[#0c0d18]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${billingCycle === 'annual' ? 'bg-[#9FA0FF] text-[#0c0d18]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Annual <span className="text-[10px] bg-[#D5E8E6] text-[#0f2d29] px-1 py-0.2 rounded font-extrabold">-20%</span>
                  </button>
                </div>
              </div>

              {/* Plan Options */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Starter', priceMonthly: 29, priceAnnual: 24, emails: '2,500 emails/mo', inboxes: '2 inboxes', seats: '1 seat' },
                  { name: 'Pro', priceMonthly: 99, priceAnnual: 79, emails: '15,000 emails/mo', inboxes: '10 inboxes', seats: '5 seats', highlight: true },
                  { name: 'Enterprise', priceMonthly: 249, priceAnnual: 199, emails: 'Unlimited emails', inboxes: '50 inboxes', seats: 'Unlimited seats' }
                ].map((plan) => {
                  const isCurrent = currentPlan === plan.name;
                  const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
                  return (
                    <div 
                      key={plan.name}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent 
                          ? 'border-[#9FA0FF] bg-[#9FA0FF]/10 ring-1 ring-[#9FA0FF] shadow-xl' 
                          : 'border-[#202235] bg-[#0e0f17] hover:border-[#9FA0FF]/40'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-white text-lg">{plan.name}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#9FA0FF] text-[#0c0d18]">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mb-4">
                          <span className="text-3xl font-extrabold text-white">${price}</span>
                          <span className="text-slate-400 text-xs font-medium"> /month</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-300 mb-6">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9FA0FF]" /> {plan.emails}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9FA0FF]" /> {plan.inboxes}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9FA0FF]" /> {plan.seats}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#9FA0FF]" /> Warmup Engine Included
                          </li>
                        </ul>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentPlan(plan.name as any);
                          showToast(`Switched to ${plan.name} Plan!`);
                        }}
                        variant={isCurrent ? 'outline' : 'default'}
                        className={`w-full font-bold text-xs h-10 ${
                          isCurrent 
                            ? 'border-[#9FA0FF] text-[#9FA0FF] hover:bg-[#9FA0FF]/20' 
                            : 'bg-[#9FA0FF] hover:bg-[#8e8fff] text-[#0c0d18]'
                        }`}
                      >
                        {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Usage Quotas */}
              <Card className="shadow-2xl border-[#202235] bg-[#0e0f17]">
                <CardHeader className="border-b border-[#1c1e2d] pb-4">
                  <CardTitle className="text-lg font-bold text-white">Real-Time Usage Quotas</CardTitle>
                  <CardDescription className="text-slate-400">Current monthly billing period ends on November 28, 2026.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  
                  {/* Quota 1: Emails */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">Monthly Email Deliveries</span>
                      <span className="text-[#9FA0FF] font-mono font-bold">8,420 / 15,000 sent (56%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#181a28] rounded-full overflow-hidden border border-[#242637]">
                      <div className="h-full bg-gradient-to-r from-[#9FA0FF] to-[#D5E8E6] rounded-full transition-all duration-500" style={{ width: '56%' }} />
                    </div>
                  </div>

                  {/* Quota 2: Mailboxes */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">Connected Sender Accounts</span>
                      <span className="text-[#D5E8E6] font-mono font-bold">4 / 10 active inboxes (40%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#181a28] rounded-full overflow-hidden border border-[#242637]">
                      <div className="h-full bg-[#D5E8E6] rounded-full transition-all duration-500" style={{ width: '40%' }} />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="pt-4 border-t border-[#1c1e2d] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-[#181a28] border border-[#26283b] rounded flex items-center justify-center text-white text-xs font-bold font-mono">
                        {cardInfo.brand}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Payment Method: {cardInfo.number}</p>
                        <p className="text-xs text-slate-400">Expires {cardInfo.exp} • Auto-renewal active</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCardModal(true)}
                      className="border-[#26283b] bg-[#141520] hover:bg-[#181a28] text-slate-200 text-xs font-semibold"
                    >
                      Update Card
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <Card className="shadow-2xl border-[#202235] bg-[#0e0f17] animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="border-b border-[#1c1e2d] pb-5">
                <CardTitle className="text-xl font-bold text-white">Alerts & Real-Time Notifications</CardTitle>
                <CardDescription className="text-slate-400">Configure instant webhook and email triggers for outreach events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {[
                  { key: 'positiveReply', title: 'Hot Lead Instant Notification', desc: 'Send immediate alert when a lead responds with high intent or positive sentiment.', badge: 'Recommended' },
                  { key: 'campaignCompleted', title: 'Campaign Sequence Finished', desc: 'Notify when all scheduled emails in a campaign have finished delivering.', badge: null },
                  { key: 'deliverabilityWarning', title: 'Deliverability & Spam Surge Warning', desc: 'Trigger high-priority alert if mailbox bounce rate exceeds 2% or reputation dips.', badge: 'Critical' },
                  { key: 'dailyDigest', title: 'Daily Executive Digest', desc: 'Summary of daily sent volume, open rates, and replies delivered at 09:00 AM.', badge: null },
                  { key: 'warmupComplete', title: 'Mailbox Warmup Milestone', desc: 'Alert when a newly added sender email reaches 100% warmup readiness.', badge: null },
                  { key: 'slackAlerts', title: 'Slack Channel Broadcast', desc: 'Push real-time reply webhook cards directly into configured team Slack channels.', badge: null },
                ].map((item) => {
                  const isChecked = (notifications as any)[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => toggleNotification(item.key as any)}
                      className="p-4 rounded-xl border border-[#242637] bg-[#141520] hover:border-[#9FA0FF]/40 hover:bg-[#181a28] transition-all flex items-start justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{item.title}</span>
                          {item.badge && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.badge === 'Critical' ? 'bg-[#FF7171]/20 text-[#FF7171] border border-[#FF7171]/30' : 'bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/30'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${isChecked ? 'bg-[#9FA0FF]' : 'bg-[#242637]'}`}>
                        <div className={`bg-[#0c0d18] w-4 h-4 rounded-full shadow-md transform transition-transform ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* TAB 4: API KEYS */}
          {activeTab === 'api' && (
            <Card className="shadow-2xl border-[#202235] bg-[#0e0f17] animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="border-b border-[#1c1e2d] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-white">API Authentication Keys</CardTitle>
                  <CardDescription className="text-slate-400">Manage developer API keys for programmatic sequence triggering and CRM sync.</CardDescription>
                </div>
                <Button 
                  onClick={() => setNewKeyModal(true)}
                  className="bg-[#9FA0FF] hover:bg-[#8e8fff] text-[#0c0d18] font-bold text-xs shadow-md shadow-[#9FA0FF]/25 border-none"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Generate New Key
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                
                {apiKeys.map((keyItem) => (
                  <div key={keyItem.id} className="p-4 rounded-xl border border-[#242637] bg-[#141520] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{keyItem.name}</span>
                        <span className="text-[10px] bg-[#181a28] text-[#9FA0FF] border border-[#242637] px-2 py-0.5 rounded-full font-mono">
                          {keyItem.key.startsWith('sk_live') ? 'Production' : 'Test'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{keyItem.revealed ? keyItem.key : `${keyItem.key.substring(0, 8)}••••••••••••••••••••••••`}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Created {keyItem.created} • Last active {keyItem.lastUsed}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setApiKeys(prev => prev.map(k => k.id === keyItem.id ? { ...k, revealed: !k.revealed } : k));
                        }}
                        className="text-slate-300 hover:text-white hover:bg-[#181a28] h-8 px-2.5 text-xs"
                      >
                        {keyItem.revealed ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        {keyItem.revealed ? 'Hide' : 'Reveal'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyKey(keyItem.id, keyItem.key)}
                        className="text-slate-300 hover:text-white hover:bg-[#181a28] h-8 px-2.5 text-xs"
                      >
                        {copiedKeyId === keyItem.id ? <Check className="w-3.5 h-3.5 mr-1 text-[#D5E8E6]" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copiedKeyId === keyItem.id ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeKey(keyItem.id)}
                        className="text-[#FF7171] hover:bg-[#FF7171]/15 h-8 px-2.5 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

              </CardContent>
            </Card>
          )}

          {/* TAB 5: INTEGRATIONS & WEBHOOKS */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* App Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {integrations.map((app) => (
                  <div key={app.id} className="p-5 rounded-2xl border border-[#202235] bg-[#0e0f17] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${app.bg} ${app.border} border`}>
                          {app.icon ? <app.icon className={`w-5 h-5 ${app.color}`} /> : <Blocks className={`w-5 h-5 ${app.color}`} />}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${app.connected ? 'bg-[#D5E8E6]/20 text-[#D5E8E6] border border-[#D5E8E6]/40' : 'bg-[#181a28] text-slate-400 border border-[#242637]'}`}>
                          {app.connected ? 'Connected' : 'Available'}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base">{app.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 mb-4">{app.desc}</p>
                    </div>
                    {app.id === 'sheets' && (
                        <Button 
                          type="button"
                          onClick={() => setIsSheetsModalOpen(true)}
                          className="w-full font-bold text-xs h-9 mb-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border-none flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Configure Database & Schema</span>
                        </Button>
                      )}
                      <Button onClick={() => toggleIntegration(app.id)}
                      variant={app.connected ? 'outline' : 'default'}
                      className={`w-full font-bold text-xs h-9 ${app.connected ? 'border-[#26283b] bg-[#141520] hover:bg-[#181a28] text-slate-300' : 'bg-[#9FA0FF] hover:bg-[#8e8fff] text-[#0c0d18]'}`}
                    >
                      {app.connected ? 'Disconnect App' : 'Connect Account'}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Webhooks Section */}
              <Card className="shadow-2xl border-[#202235] bg-[#0e0f17]">
                <CardHeader className="border-b border-[#1c1e2d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Webhook className="w-5 h-5 text-[#9FA0FF]" /> Real-Time Webhooks
                    </CardTitle>
                    <CardDescription className="text-slate-400">Stream instantaneous prospect responses to your custom endpoints.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleTestWebhook}
                      className="border-[#26283b] bg-[#141520] hover:bg-[#181a28] text-slate-200 text-xs font-semibold"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5 text-[#D5E8E6]" /> Test Ping
                    </Button>
                    <Button 
                      onClick={() => setShowWebhookModal(true)}
                      className="bg-[#9FA0FF] hover:bg-[#8e8fff] text-[#0c0d18] font-bold text-xs border-none"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Endpoint
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {testWebhookResult && (
                    <div className="p-3 bg-[#D5E8E6]/10 border border-[#D5E8E6]/30 rounded-xl text-xs text-[#D5E8E6] font-mono animate-in fade-in">
                      {testWebhookResult}
                    </div>
                  )}

                  {webhooks.map(wh => (
                    <div key={wh.id} className="p-4 rounded-xl border border-[#242637] bg-[#141520] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-mono font-bold text-white text-sm">{wh.url}</div>
                        <div className="flex items-center gap-2 text-slate-400 mt-1">
                          <span>Subscribed:</span>
                          {wh.events.map(ev => (
                            <span key={ev} className="bg-[#181a28] border border-[#242637] text-slate-300 px-2 py-0.5 rounded font-mono text-[10px]">{ev}</span>
                          ))}
                        </div>
                        <div className="text-slate-500 mt-1">Status: <span className="text-[#D5E8E6] font-semibold">{wh.status}</span> • Last delivery: {wh.lastDelivery}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setWebhooks(prev => prev.filter(w => w.id !== wh.id));
                          showToast('Webhook endpoint removed.');
                        }}
                        className="text-[#FF7171] hover:bg-[#FF7171]/15 text-xs h-8"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 6: TEAM MANAGEMENT */}
          {activeTab === 'team' && (
            <Card className="shadow-2xl border-[#202235] bg-[#0e0f17] animate-in slide-in-from-right-4 duration-300">
              <CardHeader className="border-b border-[#1c1e2d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-white">Team Members & Access</CardTitle>
                  <CardDescription className="text-slate-400">Manage seat allocations, admin rights, and campaign collaborators.</CardDescription>
                </div>
                <Button 
                  onClick={() => setInviteModal(true)}
                  className="bg-[#9FA0FF] hover:bg-[#8e8fff] text-[#0c0d18] font-bold text-xs shadow-md shadow-[#9FA0FF]/25 border-none"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Invite Member
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-[#090a10] border-b border-[#1c1e2d]">
                      <tr>
                        <th className="px-6 py-3.5 font-medium">User</th>
                        <th className="px-6 py-3.5 font-medium">Role</th>
                        <th className="px-6 py-3.5 font-medium">Status</th>
                        <th className="px-6 py-3.5 font-medium">Last Active</th>
                        <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c1e2d]">
                      {team.map((member) => (
                        <tr key={member.id} className="hover:bg-[#141520]/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#9FA0FF] text-[#0c0d18] flex items-center justify-center font-bold text-xs shadow-sm">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{member.name}</div>
                                <div className="text-xs text-slate-400">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {member.role === 'Owner' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#9FA0FF]/20 text-[#9FA0FF] border border-[#9FA0FF]/40">
                                Owner
                              </span>
                            ) : (
                              <select 
                                value={member.role}
                                onChange={(e) => {
                                  const newRole = e.target.value as any;
                                  setTeam(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
                                  showToast(`Updated ${member.name}'s role to ${newRole}`);
                                }}
                                className="bg-[#141520] border border-[#26283b] text-white text-xs rounded-lg px-2 py-1 focus:outline-none"
                              >
                                <option value="Admin">Admin</option>
                                <option value="Member">Member</option>
                                <option value="Viewer">Viewer</option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.status === 'Active' ? 'text-[#D5E8E6]' : 'text-amber-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-[#D5E8E6]' : 'bg-amber-400'}`}></span>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">{member.lastActive}</td>
                          <td className="px-6 py-4 text-right">
                            {member.role !== 'Owner' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-[#FF7171] hover:bg-[#FF7171]/15 text-xs h-8"
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 7: SECURITY & SESSIONS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* 2FA Card */}
              <Card className="shadow-2xl border-[#202235] bg-[#0e0f17]">
                <CardHeader className="border-b border-[#1c1e2d] pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-[#9FA0FF]" /> Two-Factor Authentication (2FA)
                      </CardTitle>
                      <CardDescription className="text-slate-400">Protect client campaigns with an extra layer of TOTP authenticator security.</CardDescription>
                    </div>
                    <div 
                      onClick={() => {
                        setTwoFactorEnabled(!twoFactorEnabled);
                        showToast(`Two-Factor Authentication ${!twoFactorEnabled ? 'Enabled' : 'Disabled'}`);
                      }}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${twoFactorEnabled ? 'bg-[#9FA0FF]' : 'bg-[#242637]'}`}
                    >
                      <div className={`bg-[#0c0d18] w-4 h-4 rounded-full shadow-md transform transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-400">
                    Status: <span className={twoFactorEnabled ? 'text-[#D5E8E6] font-bold' : 'text-[#FF7171] font-bold'}>{twoFactorEnabled ? 'Active (Authenticator App Protected)' : 'Disabled'}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Active Sessions */}
              <Card className="shadow-2xl border-[#202235] bg-[#0e0f17]">
                <CardHeader className="border-b border-[#1c1e2d] pb-4">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-[#D5E8E6]" /> Active Login Sessions
                  </CardTitle>
                  <CardDescription className="text-slate-400">Devices currently authenticated to your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {sessions.map(s => (
                    <div key={s.id} className="p-4 rounded-xl border border-[#242637] bg-[#141520] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          {s.device}
                          {s.current && (
                            <span className="bg-[#D5E8E6]/20 text-[#D5E8E6] border border-[#D5E8E6]/40 px-2 py-0.2 rounded-full text-[10px]">Current Session</span>
                          )}
                        </div>
                        <div className="text-slate-400 mt-0.5">{s.location} • IP: {s.ip}</div>
                        <div className="text-slate-500 mt-0.5">{s.time}</div>
                      </div>
                      {!s.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-[#FF7171] hover:bg-[#FF7171]/15 text-xs h-8"
                        >
                          Revoke Session
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          )}

        </div>
      </div>

      {/* MODAL: Generate API Key */}
      {newKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e0f17] border border-[#242637] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">Generate API Secret Key</h3>
            <p className="text-xs text-slate-400">Give your key a descriptive name so you remember where it is being used.</p>
            <div className="space-y-2">
              <Label className="text-slate-200">Key Name / Description</Label>
              <Input 
                placeholder="e.g. Zapier Production Webhooks" 
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setNewKeyModal(false)} className="border-[#26283b] text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleGenerateKey} className="bg-[#9FA0FF] text-[#0c0d18] font-bold">
                Generate Key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Webhook */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e0f17] border border-[#242637] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">Add Webhook Endpoint</h3>
            <p className="text-xs text-slate-400">Enter a secure HTTPS endpoint to receive realtime events.</p>
            <div className="space-y-2">
              <Label className="text-slate-200">Payload URL</Label>
              <Input 
                placeholder="https://api.yourdomain.com/webhooks/reachops" 
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
                className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowWebhookModal(false)} className="border-[#26283b] text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleAddWebhook} className="bg-[#9FA0FF] text-[#0c0d18] font-bold">
                Save Webhook
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invite Member */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e0f17] border border-[#242637] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">Invite Team Member</h3>
            <p className="text-xs text-slate-400">They will receive an email invite to join your ReachOps workspace.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-200">Full Name</Label>
                <Input 
                  placeholder="e.g. John Miller" 
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
                />
              </div>
              <div>
                <Label className="text-slate-200">Work Email</Label>
                <Input 
                  placeholder="john@company.com" 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-[#141520] border-[#26283b] text-white focus-visible:ring-[#9FA0FF]"
                />
              </div>
              <div>
                <Label className="text-slate-200">Permission Role</Label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-10 bg-[#141520] border border-[#26283b] text-white rounded-md px-3 text-sm focus:outline-none"
                >
                  <option value="Admin">Admin (Full campaign & account access)</option>
                  <option value="Member">Member (Create and edit sequences)</option>
                  <option value="Viewer">Viewer (Read-only analytics)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setInviteModal(false)} className="border-[#26283b] text-slate-300">
                Cancel
              </Button>
              <Button onClick={handleInviteMember} className="bg-[#9FA0FF] text-[#0c0d18] font-bold">
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Update Card */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e0f17] border border-[#242637] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">Update Payment Method</h3>
            <p className="text-xs text-slate-400">Card details are securely stored via PCI-DSS compliant tokenization.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-200">Card Number</Label>
                <Input 
                  placeholder="4242 •••• •••• 4242" 
                  defaultValue={cardInfo.number}
                  className="bg-[#141520] border-[#26283b] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-200">Expiration</Label>
                  <Input 
                    placeholder="MM/YY" 
                    defaultValue={cardInfo.exp}
                    className="bg-[#141520] border-[#26283b] text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">CVC</Label>
                  <Input 
                    placeholder="•••" 
                    defaultValue="888"
                    className="bg-[#141520] border-[#26283b] text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowCardModal(false)} className="border-[#26283b] text-slate-300">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowCardModal(false);
                  showToast('Payment method updated successfully!');
                }} 
                className="bg-[#9FA0FF] text-[#0c0d18] font-bold"
              >
                Save Card
              </Button>
            </div>
          </div>
        </div>
      )}

          {/* Google Sheets Manager Modal */}
      <GoogleSheetsManagerModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        initialSpreadsheetUrl="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
        initialSheetName="Prospects"
        onConnected={() => {
          showToast('Google Sheet connected as outreach database!');
        }}
      />
    </div>
  );
}