import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, Copy, Trash2, Edit } from 'lucide-react';
import { useParams } from 'react-router-dom';

const mockCampaignTemplates = [
  { id: 1, name: 'CEO Introduction', subject: 'Quick question about {{company}}', createdAt: 'Oct 12, 2023', lastModified: 'Oct 13, 2023' },
  { id: 2, name: 'CEO Follow-up 1', subject: 'Following up - {{company}}', createdAt: 'Oct 12, 2023', lastModified: 'Oct 12, 2023' },
  { id: 3, name: 'CEO Breakup Email', subject: 'Should I cross you off my list?', createdAt: 'Oct 14, 2023', lastModified: 'Oct 14, 2023' },
];

export default function CampaignTemplates() {
  const { id } = useParams();
  console.log('Campaign ID:', id);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = mockCampaignTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Campaign Templates</h2>
          <p className="text-gray-500 mt-1">
            Manage email templates exclusively scoped to this campaign.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search campaign templates..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          Import from Global Library
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow group relative border-gray-200">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500">Subject: {template.subject}</p>
                  </div>
                </div>
                
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border border-gray-100 rounded-md">
                  <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-l-md" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 border-l border-gray-100" title="Duplicate">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border-l border-gray-100 rounded-r-md" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 text-xs text-gray-500 border-t border-gray-100 pt-4">
                <span>Created: {template.createdAt}</span>
                <span>Modified: {template.lastModified}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-12 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg">
            No templates found in this campaign.
          </div>
        )}
      </div>
    </div>
  );
}
