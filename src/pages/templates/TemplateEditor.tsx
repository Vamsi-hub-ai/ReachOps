import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Settings2, Trash2, Send, Wand2 } from 'lucide-react';

const VARIABLES = [
  { label: 'First Name', value: '{{firstName}}' },
  { label: 'Last Name', value: '{{lastName}}' },
  { label: 'Company', value: '{{company}}' },
  { label: 'Email', value: '{{email}}' },
  { label: 'Sender Name', value: '{{sender.name}}' },
];

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const isNew = id === 'new';

  const [template, setTemplate] = useState({
    name: isNew ? 'New Template' : 'Cold Outreach - SaaS',
    category: isNew ? 'Cold Email' : 'Cold Email',
    subject: isNew ? '' : 'Quick question about {{company}}',
    body: isNew ? '' : 'Hi {{firstName}},\n\nI noticed you work at {{company}}...',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate('/templates');
    }, 800);
  };

  const insertVariable = (variable: string) => {
    setTemplate(prev => ({ ...prev, body: prev.body + variable }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="mb-1 -ml-2 text-gray-500" onClick={() => navigate('/templates')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{isNew ? 'Create Template' : 'Edit Template'}</h1>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              {template.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-gray-600 bg-white" onClick={() => navigate('/templates')}>
            Discard
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            
            <div className="space-y-2">
              <Label className="text-gray-700">Template Name</Label>
              <Input 
                value={template.name}
                onChange={(e) => setTemplate({...template, name: e.target.value})}
                className="text-base h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Subject Line</Label>
              <Input 
                value={template.subject}
                onChange={(e) => setTemplate({...template, subject: e.target.value})}
                placeholder="e.g. Quick question about {{company}}"
                className="text-base h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700">Email Body</Label>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-blue-50 h-8 -mr-2">
                  <Wand2 className="w-4 h-4 mr-1.5" /> AI Enhance
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                {/* Fake Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-2 items-center">
                  <select className="text-sm bg-transparent border-none text-gray-600 focus:ring-0 cursor-pointer">
                    <option>Normal text</option>
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                  </select>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-600 font-bold w-7 h-7 flex items-center justify-center">B</button>
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-600 italic w-7 h-7 flex items-center justify-center">I</button>
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-600 underline w-7 h-7 flex items-center justify-center">U</button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-600 text-xs w-7 h-7 flex items-center justify-center">&lt;/&gt;</button>
                </div>
                
                <textarea 
                  className="w-full min-h-[400px] p-4 focus:outline-none resize-y text-gray-700 leading-relaxed"
                  value={template.body}
                  onChange={(e) => setTemplate({...template, body: e.target.value})}
                  placeholder="Type your email template here..."
                />
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar Settings (Right col) */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm space-y-6">
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Settings2 className="w-4 h-4 mr-2 text-gray-500" /> Settings
              </h3>
              
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Category</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background"
                  value={template.category}
                  onChange={(e) => setTemplate({...template, category: e.target.value})}
                >
                  <option>Cold Email</option>
                  <option>Follow-up</option>
                  <option>Meeting</option>
                  <option>Breakup</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Plus className="w-4 h-4 mr-2 text-gray-500" /> Variables
              </h3>
              <p className="text-xs text-gray-500">Click a variable to insert it at the end of the email body.</p>
              
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map(v => (
                  <Button 
                    key={v.value} 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 bg-white text-gray-700 hover:text-primary hover:border-primary/50"
                    onClick={() => insertVariable(v.value)}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Send className="w-4 h-4 mr-2 text-gray-500" /> Test Template
              </h3>
              <Button variant="outline" className="w-full bg-white">Send Test Email</Button>
            </div>

            {!isNew && (
              <div className="pt-4 border-t border-gray-200">
                 <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Template
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
