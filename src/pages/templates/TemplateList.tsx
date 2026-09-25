import { useState } from 'react';
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
  const [templates, setTemplates] = useState(mockTemplates);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const filtered = templates.filter(t => {
    const matchesCategory = filter === 'All' || t.category === filter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Email Templates</h1>
          <p className="text-gray-500 mt-1">Manage and organize your reusable email templates.</p>
        </div>
        <Button onClick={() => navigate('/templates/new')} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Template
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search templates..." 
            className="pl-9 bg-gray-50 border-gray-200"
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
              className={filter === cat ? '' : 'text-gray-600 bg-white hover:bg-gray-50'}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(template => (
          <Card key={template.id} className="group overflow-hidden border-gray-200 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md cursor-pointer" onClick={() => navigate(`/templates/${template.id}`)}>

            <CardContent className="p-5 relative bg-white">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-600">
                  {template.category}
                </span>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/templates/${template.id}`); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={(e) => { e.stopPropagation(); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 text-lg truncate mb-1">{template.name}</h3>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                <span>Edited {template.lastEdited}</span>
                <span className="font-medium bg-gray-100 px-2 py-1 rounded text-gray-700">{template.uses.toLocaleString()} uses</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl border-dashed">
          <LayoutTemplate className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

    </div>
  );
}
