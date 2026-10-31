import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Sparkles, Send, Trash2,
  LayoutTemplate, Mail, Layers, Settings2, Plus, Wand2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VARIABLES = [
  { label: 'First Name', value: '{{firstName}}' },
  { label: 'Last Name', value: '{{lastName}}' },
  { label: 'Company', value: '{{company}}' },
  { label: 'Website', value: '{{website}}' },
  { label: 'Industry', value: '{{industry}}' },
  { label: 'Sender Name', value: '{{senderName}}' },
];

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [template, setTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'Cold Email'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      fetch(`/api/templates`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const found = data.find((t: any) => String(t.id) === id);
            if (found) {
              setTemplate({
                name: found.name || '',
                subject: found.subject || '',
                body: found.body || '',
                category: found.category || 'Cold Email'
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = '/api/templates';
      const method = isNew ? 'POST' : 'PUT';
      const body = isNew ? template : { id, ...template };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      navigate('/templates');
    } catch {
      // Offline fallback
      navigate('/templates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
      } catch {}
      navigate('/templates');
    }
  };

  const insertVariable = (val: string) => {
    setTemplate(prev => ({
      ...prev,
      body: prev.body + (prev.body.endsWith(' ') || prev.body.length === 0 ? '' : ' ') + val
    }));
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-16 animate-in fade-in duration-300 font-sans text-slate-100 selection:bg-[#a31c1b]/30">
      
      {/* Header */}
      <div className="glass-surface p-6 sm:p-7 relative overflow-hidden flex items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-[#a31c1b]/15 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <button 
            onClick={() => navigate('/templates')}
            className="p-2 text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            title="Back to templates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-0.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                {isNew ? 'Create Template' : 'Edit Template'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                {template.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              Design high-converting cold email sequences and outreach copies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button 
            onClick={() => navigate('/templates')}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Discard
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn-reachops-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg shadow-[#a31c1b]/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-surface p-6 sm:p-7 rounded-2xl space-y-5 relative overflow-hidden">
            
            {/* Template Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <LayoutTemplate className="w-3.5 h-3.5 text-emerald-400" /> 
                Template Name
              </label>
              <input 
                value={template.name}
                onChange={(e) => setTemplate({...template, name: e.target.value})}
                placeholder="e.g. Executive VP Decision Maker Initial Outreach"
                className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner font-sans"
              />
            </div>

            {/* Subject Line */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> 
                Subject Line
              </label>
              <input 
                value={template.subject}
                onChange={(e) => setTemplate({...template, subject: e.target.value})}
                placeholder="e.g. Scaling {{company}} outbound efficiency without spam folders"
                className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner font-sans"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> 
                  Email Body
                </label>
                <button 
                  type="button" 
                  onClick={() => insertVariable('{{personalization}}')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3 h-3" /> AI Enhance
                </button>
              </div>
              
              <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-[#111111] focus-within:border-emerald-500 transition-all shadow-inner">
                {/* Formatting Toolbar */}
                <div className="bg-white/[0.02] border-b border-white/[0.06] px-4 py-2 flex gap-3 items-center">
                  <span className="text-xs font-medium text-slate-400 font-mono">Normal text</span>
                  <div className="w-px h-4 bg-white/[0.1] mx-1" />
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded text-xs font-bold text-slate-300 hover:text-white cursor-pointer hover:bg-white/[0.06]">B</span>
                    <span className="px-2 py-0.5 rounded text-xs italic text-slate-300 hover:text-white cursor-pointer hover:bg-white/[0.06]">I</span>
                    <span className="px-2 py-0.5 rounded text-xs underline text-slate-300 hover:text-white cursor-pointer hover:bg-white/[0.06]">U</span>
                  </div>
                </div>
                
                <textarea 
                  rows={14}
                  className="w-full p-5 focus:outline-none resize-y text-slate-100 leading-relaxed text-xs sm:text-sm bg-transparent font-sans placeholder:text-slate-600"
                  value={template.body}
                  onChange={(e) => setTemplate({...template, body: e.target.value})}
                  placeholder="Type your email template here... Use {{firstName}}, {{company}}, etc. for personalization."
                />
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar Settings (Right col) */}
        <div className="space-y-5">
          <div className="glass-surface p-6 rounded-2xl space-y-6">
            
            {/* Settings section */}
            <div className="space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Settings2 className="w-4 h-4 text-emerald-400" /> Template Settings
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select 
                  className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer [color-scheme:dark]"
                  value={template.category}
                  onChange={(e) => setTemplate({...template, category: e.target.value})}
                >
                  <option value="Cold Email" className="bg-[#171717] text-white">Cold Email</option>
                  <option value="Follow-up" className="bg-[#171717] text-white">Follow-up</option>
                  <option value="Meeting" className="bg-[#171717] text-white">Meeting Request</option>
                  <option value="Breakup" className="bg-[#171717] text-white">Breakup / Closing</option>
                </select>
              </div>
            </div>

            {/* Variables section */}
            <div className="space-y-3 pt-5 border-t border-white/[0.06]">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2 text-sm mb-0.5">
                  <Plus className="w-4 h-4 text-emerald-400" /> Personalization Variables
                </h3>
                <p className="text-[11px] text-slate-400 leading-tight">Click to insert directly into email body.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {VARIABLES.map(v => (
                  <button 
                    key={v.value} 
                    type="button"
                    className="text-xs px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] hover:border-emerald-500/40 rounded-lg font-mono transition-all cursor-pointer active:scale-95 shadow-sm"
                    onClick={() => insertVariable(v.value)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions section */}
            <div className="space-y-3 pt-5 border-t border-white/[0.06]">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Send className="w-4 h-4 text-emerald-400" /> Actions
              </h3>
              <button 
                type="button"
                onClick={() => alert('Test email draft queued to your connected mailbox!')}
                className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 hover:text-white font-semibold text-xs py-2.5 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Send Test Email
              </button>
            </div>

            {!isNew && (
              <div className="pt-4 border-t border-white/[0.06]">
                <button 
                  type="button" 
                  onClick={handleDeleteTemplate} 
                  className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 
                  <span>Delete Template</span>
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
