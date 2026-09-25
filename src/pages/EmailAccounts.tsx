import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, CheckCircle2, AlertTriangle, Plus, Settings, RefreshCw, Flame, X, Server, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const initialAccounts: any[] = [];

export default function EmailAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [warmupModalOpen, setWarmupModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [showManualOAuth, setShowManualOAuth] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/email-accounts');
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to disconnect this email account?')) return;
    try {
      const res = await fetch('/api/email-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Example state for warmup form. In a real app, this would be tied to a specific account ID.
  const [warmupSettings, setWarmupSettings] = useState({
    active: true,
    dailyLimit: 40,
    rampUp: 3,
    replyRate: 30
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Email Accounts</h1>
          <p className="text-gray-500 mt-1">Connect and manage your sending infrastructure.</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map(account => {
          const usagePercent = Math.round((account.sentToday / account.dailyLimit) * 100);
          const isWarning = usagePercent >= 90 || account.status === 'Warning';
          
          return (
            <Card key={account.id} className="relative overflow-hidden hover:shadow-md transition-shadow bg-white">
              <div className={`absolute top-0 left-0 w-full h-1 ${isWarning ? 'bg-amber-400' : 'bg-green-500'}`}></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base truncate max-w-[200px]">{account.email}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{account.provider}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Daily Limit</span>
                    <span className={`font-semibold ${isWarning ? 'text-amber-600' : 'text-gray-900'}`}>
                      {account.sentToday} / {account.dailyLimit}
                    </span>
                  </div>
                  {/* Custom Progress Bar */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-amber-400' : 'bg-primary'}`} 
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 text-right">{usagePercent}% used today</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Warmup</p>
                    <div className="flex items-center text-sm font-medium">
                      <Flame className={`w-4 h-4 mr-1 ${account.warmupActive ? 'text-orange-500' : 'text-gray-300'}`} />
                      <span className={account.warmupActive ? 'text-gray-900' : 'text-gray-500'}>
                        {account.warmupActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <div className="flex items-center text-sm font-medium">
                      {account.status === 'Healthy' ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" /> Healthy</>
                      ) : (
                        <><AlertTriangle className="w-4 h-4 text-amber-500 mr-1.5" /> Warning</>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Sync</p>
                    <div className="flex items-center text-sm text-gray-900 font-medium">
                      <RefreshCw className="w-3 h-3 text-gray-400 mr-1.5" />
                      Just now
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-gray-50 mt-2">
                  <Button variant="outline" className="flex-1 text-xs h-8">
                    <Settings className="w-3 h-3 mr-1.5" /> Manage
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs h-8 hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    onClick={() => setWarmupModalOpen(true)}
                  >
                    <Flame className="w-3 h-3 mr-1.5" /> Warmup
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-none text-xs h-8 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors px-2"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add New Card */}
        <Card 
          onClick={() => setAddModalOpen(true)}
          className="border-dashed border-2 border-gray-200 bg-gray-50 hover:bg-gray-100/50 transition-colors flex flex-col items-center justify-center min-h-[280px] cursor-pointer group shadow-none"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 group-hover:border-primary/50 group-hover:text-primary transition-colors mb-4">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary" />
          </div>
          <CardTitle className="text-lg">Connect Account</CardTitle>
          <CardDescription className="text-center mt-2 px-6">
            Add a new Google Workspace or Microsoft 365 sender account.
          </CardDescription>
        </Card>
      </div>

      {/* Add Account Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Connect Email Account</h2>
              <button 
                onClick={() => {
                  setAddModalOpen(false);
                  setSelectedProvider(null);
                  setNewEmail('');
                  setShowManualOAuth(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {!selectedProvider ? (
                <>
                  <p className="text-sm text-gray-500 mb-6">Select your email service provider. We use secure OAuth to connect to your account without storing passwords.</p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => setSelectedProvider('Google Workspace')}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <img src="https://img.icons8.com/color/48/000000/google-logo.png" className="w-5 h-5" alt="Google" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Google Workspace</p>
                          <p className="text-xs text-gray-500">Gmail, Google Apps</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    </button>

                    <button 
                      onClick={() => setSelectedProvider('Microsoft 365')}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <img src="https://img.icons8.com/color/48/000000/microsoft.png" className="w-5 h-5" alt="Microsoft" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Microsoft 365</p>
                          <p className="text-xs text-gray-500">Outlook, Exchange</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    </button>

                    <button 
                      onClick={() => setSelectedProvider('SMTP / IMAP')}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                          <Server className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">SMTP / IMAP</p>
                          <p className="text-xs text-gray-500">Any other email provider</p>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setSelectedProvider(null)} className="text-sm text-gray-500 hover:text-gray-900">
                      &larr; Back
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-gray-900">{selectedProvider}</span>
                  </div>
                  
                  {selectedProvider !== 'SMTP / IMAP' ? (
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          {selectedProvider === 'Google Workspace' ? (
                            <img src="https://img.icons8.com/color/48/000000/google-logo.png" className="w-6 h-6" alt="Google" />
                          ) : (
                            <img src="https://img.icons8.com/color/48/000000/microsoft.png" className="w-6 h-6" alt="Microsoft" />
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Choose an account</h3>
                        <p className="text-sm text-gray-500">to continue to Reachly Platform</p>
                      </div>

                      {showManualOAuth ? (
                        <div className="space-y-4 animate-in fade-in">
                          <div className="space-y-2 text-left">
                            <Label htmlFor="oauth-email" className="font-medium text-gray-700">Enter your email to connect</Label>
                            <input 
                              id="oauth-email"
                              type="email" 
                              placeholder="your.name@company.com" 
                              className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                            />
                          </div>
                          <Button 
                            className="w-full h-11 bg-primary text-white font-medium"
                            disabled={loadingGoogle}
                            onClick={async () => {
                              if (selectedProvider === 'Google Workspace') {
                                setLoadingGoogle(true);
                                try {
                                  const res = await fetch('/api/auth/google-url');
                                  const data = await res.json();
                                  if (data.url) {
                                    window.location.href = data.url;
                                  }
                                } catch (e) {
                                  console.error(e);
                                  setLoadingGoogle(false);
                                }
                              } else {
                                alert('Microsoft 365 OAuth not fully implemented in this demo.');
                              }
                            }}
                          >
                            {loadingGoogle ? 'Connecting...' : `Connect with ${selectedProvider === 'Google Workspace' ? 'Google' : 'Microsoft'}`}
                          </Button>
                          <div className="text-center">
                            <button onClick={() => setShowManualOAuth(false)} className="text-sm text-gray-500 hover:text-gray-900">Back to saved accounts</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            {['alex@yourcompany.com', 'marketing@yourcompany.com'].map((email, idx) => (
                              <button 
                                key={email}
                                onClick={() => {
                                  setAccounts([...accounts, { 
                                    id: Math.random().toString(), 
                                    email: email, 
                                    provider: selectedProvider, 
                                    dailyLimit: 40, 
                                    sentToday: 0, 
                                    warmupActive: true, 
                                    status: 'Healthy', 
                                    lastSync: 'Just now' 
                                  }]);
                                  setAddModalOpen(false);
                                  setSelectedProvider(null);
                                  setShowManualOAuth(false);
                                }}
                                className={`w-full flex items-center p-4 hover:bg-gray-100 transition-colors text-left ${idx === 0 ? 'border-b border-gray-200' : ''}`}
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3 uppercase text-sm">
                                  {email.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900 block">{email}</span>
                                  <span className="text-xs text-gray-500">Signed in</span>
                                </div>
                              </button>
                            ))}
                          </div>
                          
                          <div className="pt-2 text-center">
                            <button onClick={() => setShowManualOAuth(true)} className="text-sm text-primary font-medium hover:underline">Use another account</button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-semibold">Email Address</Label>
                        <input 
                          id="email"
                          type="email" 
                          placeholder="e.g. hello@yourdomain.com" 
                          className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">App Password</Label>
                          <input 
                            id="password"
                            type="password" 
                            placeholder="••••••••••••" 
                            className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>SMTP Host</Label>
                            <input type="text" placeholder="smtp.provider.com" className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <input type="text" placeholder="587" className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-11 text-base font-bold bg-primary text-white flex items-center justify-center gap-2"
                        disabled={!newEmail}
                        onClick={() => {
                          setAccounts([...accounts, { 
                            id: Math.random().toString(), 
                            email: newEmail, 
                            provider: selectedProvider, 
                            dailyLimit: 40, 
                            sentToday: 0, 
                            warmupActive: true, 
                            status: 'Healthy', 
                            lastSync: 'Just now' 
                          }]);
                          setAddModalOpen(false);
                          setSelectedProvider(null);
                          setNewEmail('');
                        }}
                      >
                        Connect Account
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warmup Modal */}
      {warmupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <div className="flex items-center gap-2 text-orange-600">
                <Flame className="w-5 h-5 fill-current" />
                <h2 className="text-lg font-bold text-gray-900">Warmup Settings</h2>
              </div>
              <button 
                onClick={() => setWarmupModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <Label className="text-base font-semibold text-gray-900">Enable Warmup</Label>
                  <p className="text-xs text-gray-500 mt-1">Automatically send emails to a network of real inboxes to build sender reputation.</p>
                </div>
                <Switch 
                  checked={warmupSettings.active}
                  onCheckedChange={(c: boolean) => setWarmupSettings({ ...warmupSettings, active: c })}
                />
              </div>

              <div className={`space-y-4 transition-opacity ${!warmupSettings.active ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-gray-700 font-semibold">Total Warmup Limit</Label>
                    <span className="text-sm font-bold text-primary">{warmupSettings.dailyLimit} / day</span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={warmupSettings.dailyLimit}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, dailyLimit: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-gray-500">Maximum number of warmup emails sent per day.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-gray-700 font-semibold">Daily Ramp-up</Label>
                    <span className="text-sm font-bold text-primary">+{warmupSettings.rampUp} / day</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={warmupSettings.rampUp}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, rampUp: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-gray-500">Gradually increase daily volume by this amount until the limit is reached.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between">
                    <Label className="text-gray-700 font-semibold">Target Reply Rate</Label>
                    <span className="text-sm font-bold text-primary">{warmupSettings.replyRate}%</span>
                  </div>
                  <input 
                    type="range" min="10" max="80" step="5"
                    value={warmupSettings.replyRate}
                    onChange={(e) => setWarmupSettings({ ...warmupSettings, replyRate: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-gray-500">Percentage of warmup emails that will receive an automated reply.</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <Button variant="outline" onClick={() => setWarmupModalOpen(false)}>Cancel</Button>
              <Button onClick={() => setWarmupModalOpen(false)}>Save Configuration</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
