import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Settings2, Trash2, Send, Wand2, Mail, LayoutTemplate, Layers } from 'lucide-react';

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

  useEffect(() => {
    if (!isNew && id) {
      const saved = localStorage.getItem('email_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existing = parsed.find((t: any) => t.id === id);
        if (existing) {
          setTemplate({
            name: existing.name || '',
            category: existing.category || 'Cold Email',
            subject: existing.subject || '',
            body: existing.body || '',
          });
        }
      }
    }
  }, [id, isNew]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      const saved = localStorage.getItem('email_templates');
      let templates = saved ? JSON.parse(saved) : [];
      
      if (isNew) {
        const newId = Date.now().toString();
        templates.unshift({
          id: newId,
          name: template.name,
          category: template.category,
          subject: template.subject,
          body: template.body,
          lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          uses: 0
        });
      } else {
        templates = templates.map((t: any) => {
          if (t.id === id) {
            return {
              ...t,
              name: template.name,
              category: template.category,
              subject: template.subject,
              body: template.body,
              lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            }
          }
          return t;
        });
      }
      
      localStorage.setItem('email_templates', JSON.stringify(templates));
      setIsSaving(false);
      navigate('/templates');
    }, 500);
  };

  const handleDeleteTemplate = () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
       const saved = localStorage.getItem('email_templates');
       if (saved) {
         let templates = JSON.parse(saved);
         templates = templates.filter((t: any) => t.id !== id);
         localStorage.setItem('email_templates', JSON.stringify(templates));
       }
       navigate('/templates');
    }
  };

  const insertVariable = (variable: string) => {
    setTemplate(prev => ({ ...prev, body: prev.body + variable }));
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-12 animate-in fade-in duration-700">
      
      {/* Premium Header */}
      <div className="relative flex items-center justify-between p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-all rounded-full" onClick={() => navigate('/templates')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                {isNew ? 'Create Template' : 'Edit Template'}
              </h1>
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest shadow-sm border border-indigo-200/50">
                {template.category}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Design your perfect outreach message</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-gray-600 bg-white/50 hover:bg-white border-gray-200/60 shadow-sm transition-all duration-300 font-medium px-6" onClick={() => navigate('/templates')}>
            Discard
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 font-semibold px-6" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-xl shadow-gray-200/50 space-y-8 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-50 -z-10 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-500" /> Template Name
              </Label>
              <Input 
                value={template.name}
                onChange={(e) => setTemplate({...template, name: e.target.value})}
                className="text-lg h-14 bg-white/50 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" /> Subject Line
              </Label>
              <Input 
                value={template.subject}
                onChange={(e) => setTemplate({...template, subject: e.target.value})}
                placeholder="e.g. Quick question about {{company}}"
                className="text-lg h-14 bg-white/50 border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" /> Email Body
                </Label>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 h-9 font-semibold rounded-lg transition-colors">
                  <Wand2 className="w-4 h-4 mr-2" /> AI Enhance
                </Button>
              </div>
              
              <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-sm focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md">
                {/* Premium Toolbar */}
                <div className="bg-gray-50/80 border-b border-gray-200/80 px-4 py-3 flex gap-3 items-center backdrop-blur-md">
                  <select className="text-sm font-medium bg-transparent border-none text-gray-700 focus:ring-0 cursor-pointer hover:text-indigo-600 transition-colors">
                    <option>Normal text</option>
                    <option>Heading 1</option>
                    <option>Heading 2</option>
                  </select>
                  <div className="w-px h-5 bg-gray-300/80 mx-2"></div>
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-gray-600 font-bold w-8 h-8 flex items-center justify-center transition-colors">B</button>
                    <button className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-gray-600 italic w-8 h-8 flex items-center justify-center transition-colors">I</button>
                    <button className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-gray-600 underline w-8 h-8 flex items-center justify-center transition-colors">U</button>
                  </div>
                  <div className="w-px h-5 bg-gray-300/80 mx-2"></div>
                  <button className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-gray-600 text-xs font-bold w-8 h-8 flex items-center justify-center transition-colors">&lt;/&gt;</button>
                </div>
                
                <textarea 
                  className="w-full min-h-[420px] p-6 focus:outline-none resize-y text-gray-800 leading-relaxed text-base bg-transparent font-medium"
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
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-xl shadow-gray-200/50 space-y-8 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-purple-100/50">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-purple-50 to-pink-50 rounded-full blur-3xl opacity-60 -z-10 group-hover:scale-125 transition-transform duration-700"></div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center text-lg">
                <Settings2 className="w-5 h-5 mr-2 text-indigo-500" /> Settings
              </h3>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</Label>
                <select 
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-gray-700"
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

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900 flex items-center text-lg mb-1">
                  <Plus className="w-5 h-5 mr-2 text-purple-500" /> Variables
                </h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Click a variable to insert it at the end of the email body.</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5">
                {VARIABLES.map(v => (
                  <Button 
                    key={v.value} 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-8 bg-white/60 text-gray-700 border-gray-200 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm rounded-lg font-semibold"
                    onClick={() => insertVariable(v.value)}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center text-lg">
                <Send className="w-5 h-5 mr-2 text-blue-500" /> Actions
              </h3>
              <Button variant="outline" className="w-full bg-white/60 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold h-12 rounded-xl transition-all shadow-sm">
                Send Test Email
              </Button>
            </div>

            {!isNew && (
              <div className="pt-6 border-t border-gray-100">
                 <Button variant="ghost" onClick={handleDeleteTemplate} className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold h-12 rounded-xl transition-all border border-transparent hover:border-red-100">
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

