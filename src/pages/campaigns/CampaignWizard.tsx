import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, ChevronRight, Settings, Users, Database, Mail, 
  AlignLeft, Calendar, ShieldCheck, Rocket, ListChecks, Play, Plus, Loader2, Link as LinkIcon,
  FileCode2, Megaphone, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TIMEZONES } from '@/lib/timezones';

// Steps are now dynamic based on campaign type, moved inside component.
export default function CampaignWizard() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  
  // Interaction States
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const [newSequenceModalOpen, setNewSequenceModalOpen] = useState(false);
  const [newSequenceForm, setNewSequenceForm] = useState({ name: '', type: 'Cold Leads', steps: 3, duration: 14 });
  const [sequences, setSequences] = useState([
    { id: 'seq-1', name: 'Standard SaaS Outreach', type: 'Cold Leads', steps: 3, duration: '14 Days' },
    { id: 'seq-2', name: 'Webinar Follow-up', type: 'Warm Leads', steps: 2, duration: '3 Days' },
    { id: 'seq-3', name: 'CTO Pitch - High Intent', type: 'Targeted', steps: 4, duration: '21 Days' }
  ]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'outreach', // 'outreach' | 'newsletter'
    sheetUrl: '',
    sheetId: '', 
    worksheetId: '',
    mapping: { email: 'email', firstName: 'firstName', lastName: '', company: 'company' },
    accountIds: [] as string[],
    sequenceId: '',
    subject: '', // For newsletter
    htmlBody: '', // For newsletter
    schedule: { timezone: 'US/Eastern (EST)', days: 'Mon-Fri', startTime: '09:00', endTime: '17:00' },
    newsletterSchedule: { sendType: 'now', date: '', time: '' },
    limits: { daily: 100, maxNew: 50 },
    newsletterBatch: { size: 50, delay: 15 },
    safety: { stopOnReply: true, addUnsubscribe: true },
  });

  const [debouncedHtml, setDebouncedHtml] = useState(formData.htmlBody);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHtml(formData.htmlBody);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.htmlBody]);

  const steps = [
    { id: 1, name: 'Details', icon: AlignLeft },
    { id: 2, name: 'Google Sheet', icon: Database },
    { id: 3, name: 'Column Mapping', icon: ListChecks },
    { id: 4, name: 'Sending Account', icon: Mail },
    formData.type === 'newsletter' 
      ? { id: 5, name: 'Newsletter Content', icon: FileCode2 } 
      : { id: 5, name: 'Sequence', icon: Users },
    { id: 6, name: 'Schedule', icon: Calendar },
    { id: 7, name: 'Limits', icon: Settings },
    { id: 8, name: 'Safety', icon: ShieldCheck },
    { id: 9, name: 'Review', icon: CheckCircle2 },
    { id: 10, name: 'Launch', icon: Rocket },
  ];

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedForm = (parentKey: 'mapping' | 'schedule' | 'limits' | 'safety' | 'newsletterSchedule' | 'newsletterBatch', key: string, value: any) => {
    setFormData(prev => ({ ...prev, [parentKey]: { ...prev[parentKey as keyof typeof prev] as any, [key]: value } }));
  };

  const toggleAccount = (email: string) => {
    setFormData(prev => {
      const current = prev.accountIds || [];
      const updated = current.includes(email) 
        ? current.filter(id => id !== email)
        : [...current, email];
      return { ...prev, accountIds: updated };
    });
  };

  // Validation Logic
  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.sheetId !== ''; // Requires clicking Connect
      case 3: return formData.mapping.email !== '';
      case 4: return formData.accountIds.length > 0;
      case 5: return formData.type === 'outreach' ? formData.sequenceId !== '' : (formData.subject !== '' && formData.htmlBody !== '');
      case 6: return true;
      case 7: return formData.limits.daily > 0 && formData.limits.maxNew > 0;
      case 8: return true;
      case 9: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (isStepValid()) setStep(s => Math.min(10, s + 1));
  };
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleConnectSheet = () => {
    if (!formData.sheetUrl) return;
    setIsConnecting(true);
    // Simulate API connection
    setTimeout(() => {
      setIsConnecting(false);
      updateForm('sheetId', 'connected-sheet-123');
    }, 1500);
  };

  const handleLaunch = () => {
    setIsLaunching(true);
    // Mock launch logic
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('campaigns');
        const existingCampaigns = saved ? JSON.parse(saved) : [];
        const newCampaign = {
          id: Math.random().toString(36).substring(2, 9),
          name: formData.name,
          type: formData.type,
          status: 'Running',
          prospects: formData.sheetId ? 1245 : 0,
          sent: 0,
          replies: 0,
          replyRate: '0%',
          created: new Date().toLocaleDateString(),
          nextSend: formData.type === 'newsletter' && formData.newsletterSchedule?.sendType === 'now' 
            ? 'Now' 
            : 'Scheduled'
        };
        localStorage.setItem('campaigns', JSON.stringify([newCampaign, ...existingCampaigns]));
      } catch (e) {
        console.error('Failed to save campaign to local storage', e);
      }
      
      navigate('/campaigns');
    }, 2500);
  };

  // Custom Toggle Switch Component
  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Campaign</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Stepper Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {steps.map((s) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    // Only allow clicking back to completed steps
                    if (s.id < step) setStep(s.id);
                  }}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                    isCurrent ? 'bg-primary/10 text-primary' :
                    isCompleted ? 'text-gray-900 hover:bg-gray-50 cursor-pointer' :
                    'text-gray-400 cursor-default'
                  }`}
                  disabled={s.id > step}
                >
                  <s.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isCurrent ? 'text-primary' :
                    isCompleted ? 'text-green-500' :
                    'text-gray-300'
                  }`} />
                  <span className="flex-1 text-left">{s.name}</span>
                  {isCompleted && !isCurrent && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Wizard Content */}
        <div className="flex-1">
          <Card className="shadow-sm border-gray-200 min-h-[500px] flex flex-col transition-all duration-300">
            {step === 1 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>Give your campaign a descriptive name and choose the campaign type.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 py-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Campaign Type</Label>
                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                      <div 
                        onClick={() => updateForm('type', 'outreach')}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.type === 'outreach' 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${formData.type === 'outreach' ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-gray-900">Cold Outreach</span>
                        </div>
                        <p className="text-sm text-gray-500">Automated multi-step drip sequences sent over time based on schedules.</p>
                      </div>

                      <div 
                        onClick={() => updateForm('type', 'newsletter')}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          formData.type === 'newsletter' 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${formData.type === 'newsletter' ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            <Megaphone className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-gray-900">Newsletter Blast</span>
                        </div>
                        <p className="text-sm text-gray-500">A one-time blast using custom HTML designs, perfect for announcements.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="name" className="text-base font-semibold">Campaign Name <span className="text-red-500">*</span></Label>
                    <Input 
                      id="name"
                      value={formData.name} 
                      onChange={(e) => updateForm('name', e.target.value)} 
                      placeholder={formData.type === 'outreach' ? "e.g. Q4 Enterprise Outreach - CTOs" : "e.g. Monthly Product Update - Oct 2026"}
                      autoFocus
                      className="h-12 text-lg focus-visible:ring-primary"
                    />
                    {formData.name.trim().length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">A campaign name is required to proceed.</p>
                    )}
                  </div>
                </CardContent>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Connect Google Sheet</CardTitle>
                  <CardDescription>Provide a link to your Google Sheet containing the prospect list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  <div className="max-w-xl space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sheetUrl">Google Sheet URL <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="sheetUrl"
                            value={formData.sheetUrl} 
                            onChange={(e) => updateForm('sheetUrl', e.target.value)} 
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="pl-9 h-10"
                            disabled={formData.sheetId !== '' || isConnecting}
                          />
                        </div>
                        {formData.sheetId === '' ? (
                          <Button 
                            onClick={handleConnectSheet} 
                            disabled={!formData.sheetUrl || isConnecting}
                            className="w-32"
                          >
                            {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            onClick={() => { updateForm('sheetId', ''); updateForm('sheetUrl', ''); }}
                            className="w-32 text-gray-500"
                          >
                            Change
                          </Button>
                        )}
                      </div>
                    </div>

                    {formData.sheetId && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Database className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">Prospect_List_Q4.xlsx</p>
                            <p className="text-xs text-green-700">Successfully connected • 1,245 rows detected</p>
                          </div>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Column Mapping</CardTitle>
                  <CardDescription>Map your spreadsheet columns to standard prospect fields to enable personalization.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                    {[
                      { key: 'email', label: 'Email Address', required: true, preview: 'john.doe@acme.co' },
                      { key: 'firstName', label: 'First Name', required: false, preview: 'John' },
                      { key: 'lastName', label: 'Last Name', required: false, preview: 'Doe' },
                      { key: 'company', label: 'Company', required: false, preview: 'Acme Corp' },
                    ].map(field => (
                      <div key={field.key} className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <Label className="font-semibold text-gray-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                        </div>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          value={(formData.mapping as any)[field.key]}
                          onChange={(e) => updateNestedForm('mapping', field.key, e.target.value)}
                        >
                          <option value="">-- Ignore --</option>
                          <option value="email">Email</option>
                          <option value="firstName">First Name</option>
                          <option value="lastName">Last Name</option>
                          <option value="company">Company Name</option>
                        </select>
                        {(formData.mapping as any)[field.key] && (
                          <p className="text-xs text-muted-foreground mt-2 pl-1">
                            Preview: <span className="font-mono text-gray-900 bg-gray-200 px-1 rounded">{field.preview}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>
            )}

            {step === 4 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Sending Accounts</CardTitle>
                  <CardDescription>Select one or more email accounts to send this campaign from. Load balancing will be applied automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 py-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { email: 'vamsi@emailai.io', type: 'Google Workspace', limit: '35 / 50' },
                      { email: 'hello@emailai.io', type: 'Google Workspace', limit: '10 / 50' },
                      { email: 'sales@emailai.io', type: 'Microsoft 365', limit: '0 / 40' }
                    ].map(acc => {
                      const isSelected = formData.accountIds.includes(acc.email);
                      return (
                        <div 
                          key={acc.email}
                          onClick={() => toggleAccount(acc.email)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden ${
                            isSelected 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                              : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                          }`}
                        >
                          {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${isSelected ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                                <Mail className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-gray-900">{acc.email}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium px-2 py-1 bg-white rounded border border-gray-100">{acc.type}</span>
                            <span className="text-gray-500">Daily Sent: <span className="font-bold text-gray-900">{acc.limit}</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {formData.accountIds.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">Please select at least one sending account.</p>
                  )}
                </CardContent>
              </div>
            )}

            {step === 5 && formData.type === 'outreach' && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Select Sequence</CardTitle>
                  <CardDescription>Choose the automated sequence of emails for this campaign.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 py-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {sequences.map(seq => (
                      <div 
                        key={seq.id}
                        onClick={() => updateForm('sequenceId', seq.id)}
                        className={`p-5 border rounded-xl cursor-pointer transition-all ${
                          formData.sequenceId === seq.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' 
                            : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="font-bold text-gray-900 block text-lg">{seq.name}</span>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full font-medium">{seq.type}</span>
                          </div>
                          {formData.sequenceId === seq.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 bg-white p-2 rounded-md border border-gray-100">
                          <div><span className="font-semibold text-gray-900">{seq.steps}</span> Steps</div>
                          <div>•</div>
                          <div><span className="font-semibold text-gray-900">{seq.duration}</span> Duration</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setNewSequenceModalOpen(true)}
                    className="w-full mt-4 border-dashed border-2 h-14 text-gray-500 hover:text-gray-900 hover:border-gray-400 bg-gray-50/50"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Create New Sequence
                  </Button>
                </CardContent>
              </div>
            )}

            {step === 5 && formData.type === 'newsletter' && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Newsletter Content</CardTitle>
                  <CardDescription>Compose your email subject and paste your raw HTML template.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base font-semibold">Subject Line <span className="text-red-500">*</span></Label>
                    <Input 
                      id="subject"
                      value={formData.subject || ''} 
                      onChange={(e) => updateForm('subject', e.target.value)} 
                      placeholder="e.g. October Product Updates - Don't Miss Out!"
                      className="h-11"
                    />
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6 h-[400px]">
                    <div className="space-y-2 flex flex-col h-full">
                      <Label htmlFor="htmlBody" className="text-base font-semibold">Raw HTML <span className="text-red-500">*</span></Label>
                      <textarea
                        id="htmlBody"
                        value={formData.htmlBody === undefined ? '' : formData.htmlBody}
                        onChange={(e) => updateForm('htmlBody', e.target.value)}
                        placeholder="Type your HTML here...&#10;e.g. <h1>Hello</h1>"
                        className="flex-1 w-full rounded-md border border-input bg-gray-900 text-green-400 font-mono text-sm shadow-sm p-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                      />
                    </div>
                    <div className="space-y-2 flex flex-col h-full">
                      <Label className="text-base font-semibold">Live Preview</Label>
                      <div className="flex-1 w-full rounded-md border-2 border-dashed border-gray-200 bg-white overflow-hidden flex items-center justify-center relative">
                        {debouncedHtml ? (
                          <iframe 
                            title="preview"
                            className="w-full h-full border-none absolute inset-0 bg-white"
                            srcDoc={debouncedHtml}
                            sandbox="allow-same-origin"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm text-center px-4">
                            <p className="font-semibold text-gray-500 mb-2">Live Preview is empty</p>
                            <p>Type or paste your HTML code into the dark editor on the left.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            )}

            {step === 6 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Determine when your emails are allowed to be sent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  {formData.type === 'newsletter' ? (
                    <div className="space-y-6 max-w-lg bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Send Timing</Label>
                        <select 
                          className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                          value={formData.newsletterSchedule?.sendType || 'now'}
                          onChange={(e) => updateNestedForm('newsletterSchedule', 'sendType', e.target.value)}
                        >
                          <option value="now">Send Immediately</option>
                          <option value="later">Schedule for Later</option>
                        </select>
                      </div>
                      
                      {formData.newsletterSchedule?.sendType === 'later' && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">Date</Label>
                            <Input 
                              type="date"
                              value={formData.newsletterSchedule?.date || ''}
                              onChange={(e) => updateNestedForm('newsletterSchedule', 'date', e.target.value)}
                              className="h-11 bg-white shadow-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-700 font-semibold">Time</Label>
                            <Input 
                              type="time"
                              value={formData.newsletterSchedule?.time || ''}
                              onChange={(e) => updateNestedForm('newsletterSchedule', 'time', e.target.value)}
                              className="h-11 bg-white shadow-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-lg bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Timezone</Label>
                        <select 
                          className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                          value={formData.schedule.timezone}
                          onChange={(e) => updateNestedForm('schedule', 'timezone', e.target.value)}
                        >
                          {TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Sending Days</Label>
                        <select 
                          className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm"
                          value={formData.schedule.days}
                          onChange={(e) => updateNestedForm('schedule', 'days', e.target.value)}
                        >
                          <option>Mon-Fri</option>
                          <option>Every Day</option>
                          <option>Custom...</option>
                        </select>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label className="text-gray-700 font-semibold">Time Window</Label>
                        <div className="flex items-center gap-3">
                          <Input 
                            type="time" 
                            value={formData.schedule.startTime} 
                            onChange={(e) => updateNestedForm('schedule', 'startTime', e.target.value)}
                            className="h-11 bg-white shadow-sm"
                          />
                          <span className="text-gray-400 font-medium">to</span>
                          <Input 
                            type="time" 
                            value={formData.schedule.endTime}
                            onChange={(e) => updateNestedForm('schedule', 'endTime', e.target.value)}
                            className="h-11 bg-white shadow-sm" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            )}

            {step === 7 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>{formData.type === 'newsletter' ? 'Batch Sending' : 'Sending Limits'}</CardTitle>
                  <CardDescription>
                    {formData.type === 'newsletter' ? 'Control the speed of your blast to protect deliverability.' : 'Set limits to protect your sender reputation and avoid spam filters.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 py-6">
                  {formData.type === 'newsletter' ? (
                    <div className="space-y-6 max-w-lg">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <Label className="text-base font-semibold text-gray-900">Batch Size</Label>
                            <p className="text-sm text-gray-500">How many emails to send per batch.</p>
                          </div>
                          <span className="text-xl font-bold text-primary">{formData.newsletterBatch?.size || 50}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="500" 
                          step="10"
                          value={formData.newsletterBatch?.size || 50}
                          onChange={(e) => updateNestedForm('newsletterBatch', 'size', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-4 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-end">
                          <div>
                            <Label className="text-base font-semibold text-gray-900">Delay Between Batches</Label>
                            <p className="text-sm text-gray-500">Wait time (in minutes) before sending the next batch.</p>
                          </div>
                          <span className="text-xl font-bold text-primary">{formData.newsletterBatch?.delay || 15} mins</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="60" 
                          step="5"
                          value={formData.newsletterBatch?.delay || 15}
                          onChange={(e) => updateNestedForm('newsletterBatch', 'delay', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 max-w-lg">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <Label className="text-base font-semibold text-gray-900">Total emails per day</Label>
                            <p className="text-sm text-gray-500">Includes both follow-ups and initial emails.</p>
                          </div>
                          <span className="text-xl font-bold text-primary">{formData.limits.daily}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="500" 
                          step="10"
                          value={formData.limits.daily}
                          onChange={(e) => updateNestedForm('limits', 'daily', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-4 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-end">
                          <div>
                            <Label className="text-base font-semibold text-gray-900">Max new prospects per day</Label>
                            <p className="text-sm text-gray-500">How many new leads enter step 1 daily.</p>
                          </div>
                          <span className="text-xl font-bold text-primary">{formData.limits.maxNew}</span>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="200" 
                          step="5"
                          value={formData.limits.maxNew}
                          onChange={(e) => updateNestedForm('limits', 'maxNew', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            )}

            {step === 8 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Safety & Deliverability</CardTitle>
                  <CardDescription>Configure rules for managing responses and unsubscribes automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 py-6 max-w-2xl">
                  
                  {formData.type === 'outreach' && (
                    <div className="flex items-start justify-between p-5 border rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="pr-8">
                        <Label className="font-semibold text-lg text-gray-900">Stop sequence on reply</Label>
                        <p className="text-sm text-gray-500 mt-1">If a prospect replies to any email, they will be instantly removed from the automated sequence to prevent awkward follow-ups.</p>
                      </div>
                      <div className="pt-1">
                        <Toggle 
                          checked={formData.safety.stopOnReply} 
                          onChange={(v) => updateNestedForm('safety', 'stopOnReply', v)} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between p-5 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="pr-8">
                      <Label className="font-semibold text-lg text-gray-900">Include Unsubscribe Link</Label>
                      <p className="text-sm text-gray-500 mt-1">Automatically append an opt-out link to the bottom of all emails. Highly recommended for compliance.</p>
                    </div>
                    <div className="pt-1">
                      <Toggle 
                        checked={formData.safety.addUnsubscribe} 
                        onChange={(v) => updateNestedForm('safety', 'addUnsubscribe', v)} 
                      />
                    </div>
                  </div>

                </CardContent>
              </div>
            )}

            {step === 9 && (
              <div className="flex-1 animate-in slide-in-from-right-4 fade-in duration-300">
                <CardHeader>
                  <CardTitle>Review Campaign</CardTitle>
                  <CardDescription>Please review your final settings before launching.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  <div className="bg-gray-50/80 p-6 rounded-xl space-y-5 text-sm border border-gray-100">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <span className="text-gray-500 font-medium">Campaign Name</span>
                      <span className="font-bold text-gray-900 text-base">{formData.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <span className="text-gray-500 font-medium">Data Source</span>
                      <span className="font-semibold text-gray-900">{formData.sheetId ? 'Connected (1,245 rows)' : 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <span className="text-gray-500 font-medium">Sender Accounts</span>
                      <span className="font-semibold text-gray-900">
                        {formData.accountIds.length > 0 ? formData.accountIds.join(', ') : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <span className="text-gray-500 font-medium">{formData.type === 'newsletter' ? 'Newsletter Content' : 'Sequence'}</span>
                      <span className="font-semibold text-gray-900">
                        {formData.type === 'newsletter' ? (formData.subject || 'None') : (formData.sequenceId || 'None')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-gray-500 font-medium">Schedule</span>
                      <span className="font-semibold text-gray-900">
                        {formData.type === 'newsletter' 
                          ? (formData.newsletterSchedule?.sendType === 'now' ? 'Send Immediately' : `Scheduled for ${formData.newsletterSchedule?.date} at ${formData.newsletterSchedule?.time}`)
                          : `${formData.schedule.days}, ${formData.schedule.startTime} - ${formData.schedule.endTime} (${formData.schedule.timezone})`
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>
            )}

            {step === 10 && (
              <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 pt-12 pb-24 text-center">
                {isLaunching ? (
                  <>
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <CardTitle className="text-3xl text-gray-900">Launching Campaign...</CardTitle>
                    <CardDescription className="text-lg mt-3 text-gray-500">
                      We're queuing your prospects and warming up the engines.
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
                      <Rocket className="w-12 h-12 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl text-gray-900">Ready for Liftoff!</CardTitle>
                    <CardDescription className="text-lg mt-3 max-w-md mx-auto text-gray-500">
                      Your campaign is fully configured. Click launch below to begin sending emails immediately based on your schedule.
                    </CardDescription>
                  </>
                )}
              </div>
            )}

            <CardFooter className="flex justify-between bg-gray-50/50 p-6 rounded-b-xl border-t border-gray-100 mt-auto">
              {step < 10 ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={prevStep} 
                    disabled={step === 1}
                    className="w-28 h-11 text-gray-600 font-semibold"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    disabled={!isStepValid()}
                    className="w-36 h-11 font-bold text-white shadow-md bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    Next Step <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <Button 
                    onClick={handleLaunch} 
                    disabled={isLaunching}
                    className="w-64 h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all"
                  >
                    {isLaunching ? (
                      <>Launching... <Rocket className="w-5 h-5 ml-2 animate-bounce" /></>
                    ) : (
                      <>Launch Campaign <Play className="w-5 h-5 ml-2 fill-current" /></>
                    )}
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Create New Sequence Modal */}
      {newSequenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create New Sequence</h2>
              <button 
                onClick={() => {
                  setNewSequenceModalOpen(false);
                  setNewSequenceForm({ name: '', type: 'Cold Leads', steps: 3, duration: 14 });
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seq-name" className="font-semibold">Sequence Name</Label>
                <Input 
                  id="seq-name"
                  placeholder="e.g. Q4 Executive Outreach" 
                  value={newSequenceForm.name}
                  onChange={(e) => setNewSequenceForm({...newSequenceForm, name: e.target.value})}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seq-type" className="font-semibold">Audience Type</Label>
                <Input 
                  id="seq-type"
                  placeholder="e.g. C-Level Executives" 
                  value={newSequenceForm.type}
                  onChange={(e) => setNewSequenceForm({...newSequenceForm, type: e.target.value})}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seq-steps" className="font-semibold">Number of Steps</Label>
                  <Input 
                    id="seq-steps"
                    type="number"
                    min={1}
                    max={10}
                    value={newSequenceForm.steps}
                    onChange={(e) => setNewSequenceForm({...newSequenceForm, steps: parseInt(e.target.value) || 1})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seq-duration" className="font-semibold">Total Duration (Days)</Label>
                  <Input 
                    id="seq-duration"
                    type="number"
                    min={1}
                    max={90}
                    value={newSequenceForm.duration}
                    onChange={(e) => setNewSequenceForm({...newSequenceForm, duration: parseInt(e.target.value) || 1})}
                    className="h-11"
                  />
                </div>
              </div>

              <Button 
                className="w-full h-11 text-base font-bold bg-primary text-white mt-4"
                disabled={!newSequenceForm.name.trim()}
                onClick={() => {
                  const newSeq = {
                    id: 'seq-' + Math.random().toString(36).substring(2, 9),
                    name: newSequenceForm.name,
                    type: newSequenceForm.type,
                    steps: newSequenceForm.steps,
                    duration: newSequenceForm.duration + ' Days'
                  };
                  setSequences([newSeq, ...sequences]);
                  updateForm('sequenceId', newSeq.id);
                  setNewSequenceModalOpen(false);
                  setNewSequenceForm({ name: '', type: 'Cold Leads', steps: 3, duration: 14 });
                }}
              >
                Create Sequence
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
