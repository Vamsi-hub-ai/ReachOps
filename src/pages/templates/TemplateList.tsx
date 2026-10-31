import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, LayoutTemplate, Copy, Trash2, Edit } from 'lucide-react';

const mockTemplates = [
  { id: '1', name: 'Cold Outreach - SaaS', category: 'Cold Email', lastEdited: 'Oct 12, 2026', uses: 1240 },
  { id: '2', name: 'Follow-up - Post Webinar', category: 'Follow-up', lastEdited: 'Oct 10, 2026', uses: 850 },
  { id: '3', name: 'Meeting Request - Enterprise', category: 'Meeting', lastEdited: 'Oct 8, 2026', uses: 420 },
  { id: '4', name: 'Breakup Email - No Response', category: 'Breakup', lastEdited: 'Oct 5, 2026', uses: 2100 },
  { id: '5', name: 'Intro - Series A Startups', category: 'Cold Email', lastEdited: 'Sep 28, 2026', uses: 670 },
  { id: '6', name: 'Follow-up - Value Add', category: 'Follow-up', lastEdited: 'Sep 15, 2026', uses: 1100 },
];

const categories = ['All', 'Cold Email', 'Follow-up', 'Meeting', 'Breakup'];

export default function TemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data.map((t: any) => ({
            id: t.id,
            name: t.name,
            category: t.category || 'Cold Email',
            lastEdited: new Date(t.updatedAt || t.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            uses: t.uses || 420,
            subject: t.subject,
            body: t.body,
          })));
        } else {
          setTemplates(mockTemplates);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('email_templates');
        if (saved) setTemplates(JSON.parse(saved));
        else setTemplates(mockTemplates);
      });
  }, []);

  const handleDuplicate = async (template: any) => {
    const copy: any = {
      ...template,
      id: `tmpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      lastEdited: 'Just now',
      uses: 0
    };
    const updated = [copy, ...templates];
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));

    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: copy.name,
          category: copy.category,
          subject: copy.subject,
          body: copy.body,
        }),
      });
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      localStorage.setItem('email_templates', JSON.stringify(updated));

      try {
        await fetch('/api/templates', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      } catch (err) {
        console.error('Failed to delete template from backend:', err);
      }
    }
  };

  const filtered = templates.filter(t => {
    const matchesCategory = filter === 'All' || t.category === filter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Email Templates</h1>
          <p className="text-slate-400 mt-1">Manage and organize your reusable email templates.</p>
        </div>
        <Button onClick={() => navigate('/templates/new')} className="btn-reachops-primary text-white font-bold shadow-md shadow-[#a31c1b]/30 border-none">
          <Plus className="w-4 h-4 mr-2" /> Create Template
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 glass-surface p-4 rounded-xl border border-white/[0.09] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search templates..." 
            className="pl-9 bg-white/[0.04] border-white/[0.09] text-white placeholder-slate-500 focus:border-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
              className={filter === cat ? 'btn-reachops-primary text-white font-bold shadow-sm' : 'text-slate-300 bg-white/[0.04] border-white/[0.09] hover:bg-white/[0.08] hover:text-white'}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(template => (
          <Card key={template.id} className="group overflow-hidden border-white/[0.09] hover:border-[#10b981]/50 transition-colors shadow-sm hover:shadow-lg cursor-pointer glass-surface" onClick={() => navigate(`/templates/${template.id}`)}>

            <CardContent className="p-5 relative glass-surface">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-white/[0.06] text-emerald-400 border border-[#10b981]/30">
                  {template.category}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06]" onClick={(e) => { e.stopPropagation(); navigate(`/templates/${template.id}`); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Duplicate template" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#FB7185] hover:bg-[#FB7185]/15" onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-white text-lg truncate mb-1">{template.name}</h3>
              
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4">
                <span>Edited {template.lastEdited || 'Just now'}</span>
                <span className="font-medium bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded text-slate-300">{(template.uses || 0).toLocaleString()} uses</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 glass-surface border border-white/[0.09] rounded-xl border-dashed">
          <LayoutTemplate className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white">No templates found</h3>
          <p className="text-slate-400 mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

    </div>
  );
}
