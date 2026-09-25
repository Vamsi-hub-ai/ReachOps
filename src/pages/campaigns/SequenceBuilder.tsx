import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Clock, GitBranch, Plus, Save, Trash2, GripVertical, Play, Settings2 } from 'lucide-react';

type NodeType = 'email' | 'delay' | 'condition';

interface SequenceNode {
  id: string;
  type: NodeType;
  title: string;
  config: any;
}

const VARIABLES = [
  { label: 'First Name', value: '{{firstName}}' },
  { label: 'Last Name', value: '{{lastName}}' },
  { label: 'Company', value: '{{company}}' },
  { label: 'Email', value: '{{email}}' },
];

export default function SequenceBuilder() {
  const navigate = useNavigate();
  
  const [nodes, setNodes] = useState<SequenceNode[]>([
    { id: 'node-1', type: 'email', title: 'Step 1: Initial Outreach', config: { subject: 'Quick question about {{company}}', body: 'Hi {{firstName}},\n\nI noticed you work at {{company}}...' } },
    { id: 'node-2', type: 'delay', title: 'Wait 3 Days', config: { days: 3 } },
    { id: 'node-3', type: 'email', title: 'Step 2: Follow-up', config: { subject: 'Re: Quick question about {{company}}', body: 'Hi {{firstName}},\n\nJust bumping this to the top of your inbox.' } },
  ]);
  
  const [activeNodeId, setActiveNodeId] = useState<string>('node-1');
  const [isSaving, setIsSaving] = useState(false);

  const activeNode = nodes.find(n => n.id === activeNodeId);

  const addNode = (type: NodeType) => {
    const newId = `node-${Date.now()}`;
    const newNode: SequenceNode = {
      id: newId,
      type,
      title: type === 'email' ? 'New Email Step' : type === 'delay' ? 'Wait Duration' : 'Condition',
      config: type === 'email' ? { subject: '', body: '' } : type === 'delay' ? { days: 1 } : { criteria: 'If Opened' }
    };
    setNodes([...nodes, newNode]);
    setActiveNodeId(newId);
  };

  const removeNode = (id: string) => {
    const filtered = nodes.filter(n => n.id !== id);
    setNodes(filtered);
    if (activeNodeId === id && filtered.length > 0) {
      setActiveNodeId(filtered[0].id);
    }
  };

  const updateNodeConfig = (key: string, value: any) => {
    setNodes(nodes.map(n => n.id === activeNodeId ? { ...n, config: { ...n.config, [key]: value } } : n));
  };
  
  const updateNodeTitle = (title: string) => {
    setNodes(nodes.map(n => n.id === activeNodeId ? { ...n, title } : n));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // alert('Sequence saved successfully');
    }, 1000);
  };

  const insertVariable = (variable: string) => {
    if (activeNode?.type === 'email') {
      const currentBody = activeNode.config.body || '';
      updateNodeConfig('body', currentBody + variable);
    }
  };

  const loadTemplate = (templateName: string) => {
    if (activeNode?.type === 'email') {
      // Mock loading a template
      const templateData = {
        'Cold Outreach': { subject: 'Quick question for {{company}}', body: 'Hi {{firstName}},\n\nI am reaching out because...\n\nThanks,\nVamsi' },
        'Follow Up': { subject: 'Re: Quick question for {{company}}', body: 'Hi {{firstName}},\n\nJust floating this to the top of your inbox.\n\nThanks,\nVamsi' }
      };
      const t = templateData[templateName as keyof typeof templateData];
      if (t) {
        setNodes(nodes.map(n => n.id === activeNodeId ? { ...n, config: { ...n.config, subject: t.subject, body: t.body } } : n));
      }
    }
  };

  const getNodeIcon = (type: NodeType) => {
    switch(type) {
      case 'email': return <Mail className="w-5 h-5 text-blue-500" />;
      case 'delay': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'condition': return <GitBranch className="w-5 h-5 text-purple-500" />;
    }
  };

  const getNodeColor = (type: NodeType) => {
    switch(type) {
      case 'email': return 'bg-blue-50 border-blue-200';
      case 'delay': return 'bg-amber-50 border-amber-200';
      case 'condition': return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-6">
      {/* Top Bar */}
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/campaigns')} className="text-gray-500">
            &larr; Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Sequence Editor</h1>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
            {nodes.length} Steps
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-gray-600" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Play className="w-4 h-4 mr-2" />
            Activate Sequence
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Visual Builder */}
        <div className="w-1/3 min-w-[350px] max-w-[500px] bg-gray-50/50 border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-4">
            
            {/* Start Node */}
            <div className="flex justify-center">
              <div className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-full shadow-sm">
                START
              </div>
            </div>

            {/* Nodes */}
            {nodes.map((node) => (
              <div key={node.id} className="relative flex flex-col items-center group">
                {/* Connecting Line */}
                <div className="w-px h-6 bg-gray-300"></div>
                
                {/* Node Card */}
                <div 
                  onClick={() => setActiveNodeId(node.id)}
                  className={`w-full max-w-sm rounded-xl border-2 transition-all cursor-pointer shadow-sm flex items-start p-4 bg-white ${
                    activeNodeId === node.id 
                      ? 'border-primary ring-4 ring-primary/10 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GripVertical className="w-5 h-5 text-gray-300 mr-2 flex-shrink-0 cursor-grab mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className={`p-2 rounded-lg border mr-3 ${getNodeColor(node.type)}`}>
                    {getNodeIcon(node.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{node.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {node.type === 'email' && (node.config.subject || 'No subject')}
                      {node.type === 'delay' && `Wait for ${node.config.days} days`}
                      {node.type === 'condition' && `If: ${node.config.criteria}`}
                    </p>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Node Button */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-px h-6 bg-gray-300 mb-2"></div>
              <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:bg-blue-50" onClick={() => addNode('email')}>
                  <Mail className="w-4 h-4 mr-1.5" /> Email
                </Button>
                <div className="w-px h-full bg-gray-200"></div>
                <Button variant="ghost" size="sm" className="h-8 text-amber-600 hover:bg-amber-50" onClick={() => addNode('delay')}>
                  <Clock className="w-4 h-4 mr-1.5" /> Delay
                </Button>
                <div className="w-px h-full bg-gray-200"></div>
                <Button variant="ghost" size="sm" className="h-8 text-purple-600 hover:bg-purple-50" onClick={() => addNode('condition')}>
                  <GitBranch className="w-4 h-4 mr-1.5" /> Split
                </Button>
              </div>
            </div>

            {/* End Node */}
            <div className="flex flex-col items-center pt-2">
              <div className="w-px h-6 bg-gray-300 mb-2"></div>
              <div className="px-4 py-2 bg-gray-200 text-gray-500 text-xs font-bold rounded-full border border-gray-300">
                END OF SEQUENCE
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel: Configuration */}
        <div className="flex-1 bg-white overflow-y-auto">
          {activeNode ? (
            <div className="p-8 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">
              
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className={`p-2 rounded-lg border ${getNodeColor(activeNode.type)}`}>
                  {getNodeIcon(activeNode.type)}
                </div>
                <div className="flex-1">
                  <Input 
                    value={activeNode.title} 
                    onChange={(e) => updateNodeTitle(e.target.value)}
                    className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                  />
                  <p className="text-sm text-gray-500">Configure this step's settings.</p>
                </div>
              </div>

              {activeNode.type === 'email' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700">Subject Line</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Load Template:</span>
                        <select 
                          className="h-8 text-xs border border-gray-200 rounded px-2 bg-gray-50 focus:outline-none"
                          onChange={(e) => {
                            if(e.target.value) loadTemplate(e.target.value);
                            e.target.value = '';
                          }}
                        >
                          <option value="">Select...</option>
                          <option value="Cold Outreach">Cold Outreach</option>
                          <option value="Follow Up">Follow Up</option>
                        </select>
                      </div>
                    </div>
                    <Input 
                      value={activeNode.config.subject}
                      onChange={(e) => updateNodeConfig('subject', e.target.value)}
                      placeholder="e.g. Quick question about {{company}}"
                      className="text-base h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-700">Email Body</Label>
                      <div className="flex flex-wrap gap-2">
                        {VARIABLES.map(v => (
                          <Button 
                            key={v.value} 
                            size="sm" 
                            variant="secondary" 
                            className="text-xs h-7 bg-gray-100 hover:bg-gray-200 text-gray-700"
                            onClick={() => insertVariable(v.value)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {v.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      {/* Fake Toolbar */}
                      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-2 items-center">
                        <select className="text-sm bg-transparent border-none text-gray-600 focus:ring-0 cursor-pointer">
                          <option>Normal text</option>
                          <option>Heading 1</option>
                          <option>Heading 2</option>
                        </select>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button className="p-1 hover:bg-gray-200 rounded text-gray-600 font-bold">B</button>
                        <button className="p-1 hover:bg-gray-200 rounded text-gray-600 italic">I</button>
                        <button className="p-1 hover:bg-gray-200 rounded text-gray-600 underline">U</button>
                      </div>
                      <textarea 
                        className="w-full min-h-[350px] p-4 focus:outline-none resize-y text-gray-700"
                        value={activeNode.config.body}
                        onChange={(e) => updateNodeConfig('body', e.target.value)}
                        placeholder="Type your email here..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeNode.type === 'delay' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Wait Duration (Days)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        type="number" 
                        min="1"
                        value={activeNode.config.days}
                        onChange={(e) => updateNodeConfig('days', parseInt(e.target.value) || 1)}
                        className="w-32 h-11 text-lg"
                      />
                      <span className="text-gray-500">Days</span>
                    </div>
                    <p className="text-sm text-gray-500 pt-2">The sequence will pause for this duration before proceeding to the next step.</p>
                  </div>
                </div>
              )}

              {activeNode.type === 'condition' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Condition Criteria</Label>
                    <select 
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background"
                      value={activeNode.config.criteria}
                      onChange={(e) => updateNodeConfig('criteria', e.target.value)}
                    >
                      <option>If Opened</option>
                      <option>If Clicked Link</option>
                      <option>If Replied</option>
                      <option>If Unsubscribed</option>
                    </select>
                    <p className="text-sm text-gray-500 pt-2">Prospects will route to different branches based on this condition.</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 flex-col">
              <Settings2 className="w-12 h-12 mb-4 text-gray-300" />
              <p>Select a node to configure its settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
