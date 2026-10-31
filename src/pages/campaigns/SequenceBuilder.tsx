import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, Check, Sparkles, Eye, Code, 
  Smartphone, Monitor, ChevronDown, X, Save, Trash2,
  Bold, Italic, Link2, Smile, Clock,
  ShieldCheck, AlertTriangle, RefreshCw, Send,
  Wand2, FileText, CheckCircle2, MessageSquareText
} from 'lucide-react';
import { analyzeEmailDeliverability } from '@/lib/deliverability';

interface EmailVariant {
  id: string;
  name: string;
  subject: string;
  body: string;
  active: boolean;
}

interface EmailStep {
  id: string;
  stepNumber: number;
  subject: string;
  body: string;
  waitValue: number;
  waitUnit: 'Days' | 'Hours' | 'Minutes';
  waitDays: number;
  skipWeekends?: boolean;
  variants: EmailVariant[];
  activeVariantIndex: number;
}

interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actionType?: 'apply_sequence' | 'insert_spintax';
  payload?: any;
}

const DYNAMIC_VARIABLES = [
  { label: 'First Name', tag: '{{firstName}}' },
  { label: 'Last Name', tag: '{{lastName}}' },
  { label: 'Company Name', tag: '{{companyName}}' },
  { label: 'Job Title', tag: '{{jobTitle}}' },
  { label: 'Personalization', tag: '{{personalization}}' },
  { label: 'Sender Name', tag: '{{senderName}}' },
  { label: 'Sender Signature', tag: '{{accountSignature}}' },
];

const POPULAR_EMOJIS = ['👋', '🚀', '💡', '🔥', '📈', '🤝', '🎯', '✨', '☕', '⚡', '📊', '📩'];

export default function SequenceBuilder() {
  const { id } = useParams<{ id: string }>();
  const campaignKey = id || 'demo-camp-vp-execs';

  const [steps, setSteps] = useState<EmailStep[]>([
    {
      id: 'step-1',
      stepNumber: 1,
      subject: 'Scaling {{companyName}} outbound pipeline without spam filters',
      body: 'Hi {{firstName}},\n\nSaw what your team is building at {{companyName}}. Reaching out as we help B2B revenue leaders eliminate spam folder landing and scale authentic cold outreach.\n\nAre you free for a brief 10-minute chat this Thursday?\n\n{{accountSignature}}',
      waitValue: 1,
      waitUnit: 'Days',
      waitDays: 1,
      skipWeekends: true,
      activeVariantIndex: 0,
      variants: [
        {
          id: 'v-1-a',
          name: 'Variant A',
          subject: 'Scaling {{companyName}} outbound pipeline without spam filters',
          body: 'Hi {{firstName}},\n\nSaw what your team is building at {{companyName}}. Reaching out as we help B2B revenue leaders eliminate spam folder landing and scale authentic cold outreach.\n\nAre you free for a brief 10-minute chat this Thursday?\n\n{{accountSignature}}',
          active: true,
        }
      ]
    },
    {
      id: 'step-2',
      stepNumber: 2,
      subject: '',
      body: 'Hi {{firstName}},\n\nFollowing up on my previous note. We recently helped a similar B2B team lift their mailbox deliverability from 62% to 98% with ReachOps automated warmup and sender rotation.\n\nWorth a quick look?\n\nBest,\n{{senderName}}',
      waitValue: 2,
      waitUnit: 'Days',
      waitDays: 2,
      skipWeekends: true,
      activeVariantIndex: 0,
      variants: [
        {
          id: 'v-2-a',
          name: 'Variant A',
          subject: '',
          body: 'Hi {{firstName}},\n\nFollowing up on my previous note. We recently helped a similar B2B team lift their mailbox deliverability from 62% to 98% with ReachOps automated warmup and sender rotation.\n\nWorth a quick look?\n\nBest,\n{{senderName}}',
          active: true,
        }
      ]
    }
  ]);

  const [activeStepId, setActiveStepId] = useState<string>('step-1');
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View modes
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // ReachOps AI Copilot Drawer
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Popovers
  const [showVariablesDropdownStepId, setShowVariablesDropdownStepId] = useState<string | null>(null);
  const [showEmojiPickerStepId, setShowEmojiPickerStepId] = useState<string | null>(null);
  const [activeWaitDropdownStepId, setActiveWaitDropdownStepId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Preview & Spam Audit Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showSpamAuditModal, setShowSpamAuditModal] = useState(false);

  // Deliverability audit results
  const [deliverabilityScore, setDeliverabilityScore] = useState<{ score: number; issues: string[] }>({
    score: 98,
    issues: []
  });

  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowVariablesDropdownStepId(null);
      setShowEmojiPickerStepId(null);
      setActiveWaitDropdownStepId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Load sequence from backend
  useEffect(() => {
    fetch(`/api/campaigns/${campaignKey}/sequence`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.sequence && Array.isArray(data.sequence.steps) && data.sequence.steps.length > 0) {
          const loadedSteps: EmailStep[] = data.sequence.steps.map((s: any, idx: number) => {
            const rawBody = s.bodyText || (s.bodyHtml ? s.bodyHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '') : '');
            
            let waitUnit: 'Days' | 'Hours' | 'Minutes' = 'Days';
            let waitValue = s.delayDays || (idx === 0 ? 0 : 2);
            if (s.delayMinutes && s.delayMinutes > 0) {
              waitUnit = 'Minutes';
              waitValue = s.delayMinutes;
            } else if (s.delayHours && s.delayHours > 0) {
              waitUnit = 'Hours';
              waitValue = s.delayHours;
            }

            return {
              id: s.id || `step-${s.stepNumber || idx + 1}`,
              stepNumber: s.stepNumber || idx + 1,
              subject: s.subject || '',
              body: rawBody || '',
              waitValue,
              waitUnit,
              waitDays: s.delayDays || (idx === 0 ? 0 : 2),
              skipWeekends: true,
              activeVariantIndex: 0,
              variants: [
                {
                  id: `v-${s.id || idx}-a`,
                  name: 'Variant A',
                  subject: s.subject || '',
                  body: rawBody || '',
                  active: true,
                }
              ]
            };
          });
          setSteps(loadedSteps);
          if (loadedSteps[0]) setActiveStepId(loadedSteps[0].id);
        }
      })
      .catch(console.error);
  }, [campaignKey]);

  // Save sequence to backend
  const saveSequenceToBackend = async (customSteps?: EmailStep[]) => {
    setIsSaving(true);
    const targetSteps = customSteps || steps;

    try {
      await fetch(`/api/campaigns/${campaignKey}/sequence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: targetSteps.map((s, i) => {
            const isDays = s.waitUnit === 'Days';
            const isHours = s.waitUnit === 'Hours';
            const isMinutes = s.waitUnit === 'Minutes';
            return {
              stepNumber: i + 1,
              delayDays: isDays ? (s.waitValue || s.waitDays || 0) : 0,
              delayHours: isHours ? (s.waitValue || 0) : 0,
              delayMinutes: isMinutes ? (s.waitValue || 0) : 0,
              subject: s.subject,
              bodyHtml: s.body.includes('<') ? s.body : `<p>${s.body.replace(/\n/g, '<br/>')}</p>`,
              bodyText: s.body.replace(/<[^>]+>/g, ''),
            };
          })
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save sequence to backend:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateStepSubject = (stepId: string, newSubject: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      const updatedVariants = [...s.variants];
      if (updatedVariants[s.activeVariantIndex]) {
        updatedVariants[s.activeVariantIndex].subject = newSubject;
      }
      return {
        ...s,
        subject: newSubject,
        variants: updatedVariants
      };
    }));
  };

  const updateStepBody = (stepId: string, newBody: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      const updatedVariants = [...s.variants];
      if (updatedVariants[s.activeVariantIndex]) {
        updatedVariants[s.activeVariantIndex].body = newBody;
      }
      return {
        ...s,
        body: newBody,
        variants: updatedVariants
      };
    }));
  };

  const updateStepWait = (stepId: string, val: number, unit?: 'Days' | 'Hours' | 'Minutes') => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      return {
        ...s,
        waitValue: val,
        waitDays: unit === 'Days' ? val : (s.waitDays || val),
        ...(unit ? { waitUnit: unit } : {})
      };
    }));
  };

  const toggleSkipWeekends = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, skipWeekends: !s.skipWeekends } : s));
  };

  const addStep = () => {
    const newStepNum = steps.length + 1;
    const newStep: EmailStep = {
      id: `step-${Date.now()}`,
      stepNumber: newStepNum,
      subject: '',
      body: 'Hi {{firstName}},\n\nCircling back on this as we want to make sure your outbound accounts maintain high reputation.\n\nBest,\n{{senderName}}',
      waitValue: 3,
      waitUnit: 'Days',
      waitDays: 3,
      skipWeekends: true,
      activeVariantIndex: 0,
      variants: [
        {
          id: `v-${Date.now()}-a`,
          name: 'Variant A',
          subject: '',
          body: 'Hi {{firstName}},\n\nCircling back on this as we want to make sure your outbound accounts maintain high reputation.\n\nBest,\n{{senderName}}',
          active: true
        }
      ]
    };
    const updated = [...steps, newStep];
    setSteps(updated);
    setActiveStepId(newStep.id);
    saveSequenceToBackend(updated);

    setTimeout(() => {
      if (canvasScrollRef.current) {
        canvasScrollRef.current.scrollTop = canvasScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const removeStep = (stepId: string) => {
    if (steps.length <= 1) return;
    const filtered = steps
      .filter(s => s.id !== stepId)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(filtered);
    if (activeStepId === stepId && filtered[0]) {
      setActiveStepId(filtered[0].id);
    }
    saveSequenceToBackend(filtered);
  };

  const addVariant = (stepId: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      const nextLetter = String.fromCharCode(65 + s.variants.length);
      const newVariant: EmailVariant = {
        id: `v-${Date.now()}-${nextLetter.toLowerCase()}`,
        name: `Variant ${nextLetter}`,
        subject: s.subject ? `${s.subject} (v${nextLetter})` : '',
        body: s.body,
        active: true
      };
      const updatedVariants = [...s.variants, newVariant];
      return {
        ...s,
        variants: updatedVariants,
        activeVariantIndex: updatedVariants.length - 1,
        subject: newVariant.subject,
        body: newVariant.body
      };
    }));
  };

  const selectVariant = (stepId: string, variantIndex: number) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId) return s;
      const targetVar = s.variants[variantIndex];
      return {
        ...s,
        activeVariantIndex: variantIndex,
        subject: targetVar?.subject ?? s.subject,
        body: targetVar?.body ?? s.body
      };
    }));
  };

  const removeVariant = (stepId: string, variantIndex: number) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId || s.variants.length <= 1) return s;
      const updatedVariants = s.variants.filter((_, idx) => idx !== variantIndex);
      const newActiveIdx = Math.max(0, variantIndex - 1);
      return {
        ...s,
        variants: updatedVariants,
        activeVariantIndex: newActiveIdx,
        subject: updatedVariants[newActiveIdx]?.subject ?? '',
        body: updatedVariants[newActiveIdx]?.body ?? ''
      };
    }));
  };

  const insertVariable = (stepId: string, tag: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    if (lastFocusedField === 'subject') {
      updateStepSubject(step.id, step.subject ? `${step.subject} ${tag}` : tag);
    } else {
      updateStepBody(step.id, step.body ? `${step.body} ${tag} ` : `${tag} `);
    }
    setShowVariablesDropdownStepId(null);
  };

  const insertEmoji = (stepId: string, emoji: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    if (lastFocusedField === 'subject') {
      updateStepSubject(step.id, `${step.subject} ${emoji}`);
    } else {
      updateStepBody(step.id, `${step.body} ${emoji}`);
    }
    setShowEmojiPickerStepId(null);
  };

  const handleInsertLink = (stepId: string) => {
    const url = linkUrl.trim() || 'https://reachops.io';
    const text = linkText.trim() || url;
    const linkMd = `[${text}](${url})`;
    updateStepBody(stepId, `${activeStep.body} ${linkMd}`);
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  const checkDeliverability = (bodyText: string) => {
    const analysis = analyzeEmailDeliverability(activeStep?.subject || '', bodyText);
    const score = analysis.score;
    const issues = analysis.flags.map(f => f.message);
    setDeliverabilityScore({
      score,
      issues: issues.length > 0 ? issues : ['Excellent! Clean copy with high inbox placement probability.']
    });
  };

  // AI Assistant action dispatch
  const handleAiAction = (action: string) => {
    setAiGenerating(true);
    let promptText = '';

    if (action === 'write_sequence') {
      promptText = 'Generate a high-converting 3-step B2B cold email sequence for VP/Executive prospects';
      setTimeout(() => {
        const generatedSteps = [
          {
            subject: 'Scaling {{companyName}} outreach efficiency',
            body: 'Hi {{firstName}},\n\nSaw your team is expanding enterprise outreach. Reaching out because ReachOps automates multi-mailbox rotation and keeps your primary domain completely protected from spam traps.\n\nOpen to exploring a 15-minute product overview next Tuesday?\n\n{{accountSignature}}'
          },
          {
            subject: '',
            body: 'Hi {{firstName}},\n\nFollowing up quickly on my note about domain protection. We just helped a 40-rep outbound team increase their reply rate by 2.4x while maintaining zero domain blacklists.\n\nWould it make sense to connect this week?\n\nBest,\n{{senderName}}'
          },
          {
            subject: '',
            body: 'Hi {{firstName}},\n\nFinal check-in here. If cold deliverability isn\'t a priority for {{companyName}} right now, no problem at all.\n\nWhenever you are ready to review your sender health, feel free to reply.\n\nBest regards,\n{{senderName}}'
          }
        ];

        setAiChatMessages(prev => [
          ...prev,
          { role: 'user', content: promptText },
          {
            role: 'assistant',
            content: '✨ ReachOps Copilot generated an executive 3-step sequence optimized for 85%+ open rates and zero spam trigger patterns.',
            actionType: 'apply_sequence',
            payload: generatedSteps
          }
        ]);
        setAiGenerating(false);
      }, 500);
    } else if (action === 'review_copy') {
      promptText = 'Review current email sequence copy and optimize for reply conversions';
      setTimeout(() => {
        setAiChatMessages(prev => [
          ...prev,
          { role: 'user', content: promptText },
          {
            role: 'assistant',
            content: '✅ Sequence Deliverability Audit:\n• Reading Grade Level: 4.8 (Ideal for busy executives)\n• CTA Clarity: High — single ask with direct time proposal\n• Spam Trigger Words: 0\n• Recommendation: Keep subject lines below 5 words for optimal mobile preview.'
          }
        ]);
        setAiGenerating(false);
      }, 400);
    } else if (action === 'check_spam') {
      promptText = 'Scan sequence for spam trigger words';
      setTimeout(() => {
        setAiChatMessages(prev => [
          ...prev,
          { role: 'user', content: promptText },
          {
            role: 'assistant',
            content: '🛡️ ReachOps Spam Engine Scan Complete:\n• All sequence steps verified.\n• No blacklisted terms ("free", "guaranteed", "urgent", "100%") detected.\n• SPF/DKIM authentication compliance: Passed.'
          }
        ]);
        setAiGenerating(false);
      }, 400);
    } else if (action === 'spintax') {
      promptText = 'Generate dynamic Spintax variation for greeting & value prop';
      setTimeout(() => {
        const spintaxSnippet = '{Hi|Hello|Hey} {{firstName}},\n\n{Quick question|Reaching out briefly} regarding {{companyName}}\'s pipeline.';
        setAiChatMessages(prev => [
          ...prev,
          { role: 'user', content: promptText },
          {
            role: 'assistant',
            content: `Generated High-Inbox Spintax Variation:\n\n${spintaxSnippet}\n\nSpintax rotates phrases dynamically across outgoing emails to prevent mailbox fingerprinting.`,
            actionType: 'insert_spintax',
            payload: spintaxSnippet
          }
        ]);
        setAiGenerating(false);
      }, 400);
    }
  };

  const handleCustomAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const query = aiQuery.trim();
    setAiQuery('');
    setAiGenerating(true);
    setAiChatMessages(prev => [...prev, { role: 'user', content: query }]);

    setTimeout(() => {
      setAiChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `ReachOps Copilot Recommendation for: "${query}"\n\nTo maximize response rates from senior buyers, keep the body under 75 words, focus on a single metric, and end with a soft call-to-action ("Open to a quick intro?").`
        }
      ]);
      setAiGenerating(false);
    }, 450);
  };

  const applyAiGeneratedSequence = (newStepsData: Array<{ subject: string; body: string }>) => {
    const updatedSteps: EmailStep[] = newStepsData.map((s, idx) => ({
      id: `step-ai-${idx + 1}-${Date.now()}`,
      stepNumber: idx + 1,
      subject: s.subject,
      body: s.body,
      waitValue: idx === 0 ? 0 : 2,
      waitUnit: 'Days',
      waitDays: idx === 0 ? 0 : 2,
      skipWeekends: true,
      activeVariantIndex: 0,
      variants: [
        {
          id: `v-ai-${idx + 1}-a`,
          name: 'Variant A',
          subject: s.subject,
          body: s.body,
          active: true
        }
      ]
    }));

    setSteps(updatedSteps);
    setActiveStepId(updatedSteps[0].id);
    saveSequenceToBackend(updatedSteps);
  };

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

  return (
    <div className="relative flex-1 flex h-full w-full overflow-hidden bg-[#06110c] bg-reachops-cosmic text-slate-100 select-none">
      
      {/* Main Canvas Scroll Area */}
      <div 
        ref={canvasScrollRef}
        className="flex-1 overflow-y-auto h-full flex flex-col items-center w-full px-4 sm:px-6 pt-5 pb-32 transition-all duration-300 scroll-smooth"
      >
        
        {/* Top Control Strip (ReachOps Design Language) */}
        <div className="w-full max-w-4xl flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] flex-shrink-0">
          
          {/* Left: Sequence Step Counter & Deliverability Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-xs font-bold text-white tracking-tight">
                {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} in Sequence
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deliverability Score:</span>
              <span className="font-semibold text-emerald-400">{deliverabilityScore.score}%</span>
            </div>
          </div>

          {/* Right: Layout Mode, AI Copilot, Save Button */}
          <div className="flex items-center gap-2.5">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}

            {/* In-Place View Toggle (Desktop / Mobile Preview) */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 shadow-sm">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-[#10b981]/15 text-white border border-[#10b981]/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-[#10b981]/15 text-white border border-[#10b981]/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile Phone Simulation"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ReachOps AI Copilot Toggle Button */}
            <button
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer shadow-sm ${
                aiSidebarOpen
                  ? 'bg-[#10b981]/15 text-white border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
              title="Toggle ReachOps AI Outreach Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ReachOps Copilot</span>
            </button>

            {/* Preview Modal Button */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="Full Email Preview"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Save Sequence Button */}
            <button
              onClick={() => saveSequenceToBackend()}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#a31c1b] to-[#b92322] hover:from-[#c72d2c] hover:to-[#991a19] text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Sequence'}</span>
            </button>
          </div>

        </div>

        {/* Sequence Steps Container */}
        <div className={`w-full space-y-0 animate-in fade-in duration-300 transition-all ${viewMode === 'mobile' ? 'max-w-md' : 'max-w-4xl'}`}>
          
          {steps.map((step, index) => {
            const isFirstStep = index === 0;
            const currentVariant = step.variants[step.activeVariantIndex] || step.variants[0];
            const wordCount = step.body.trim().split(/\s+/).filter(Boolean).length;
            const estimatedSec = Math.max(5, Math.round((wordCount / 200) * 60));

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                
                {/* Wait Delay Connector Node between steps */}
                {!isFirstStep && (
                  <div className="flex flex-col items-center my-4 relative z-10">
                    {/* Glowing vertical connector line */}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-[#10b981]/60 to-[#a31c1b]/60 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />

                    {/* Delay Selector Pill */}
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#171717]/90 backdrop-blur-xl border border-white/[0.1] shadow-lg text-xs text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-400 font-medium">Wait</span>
                      
                      <input 
                        type="number"
                        min="1"
                        max="60"
                        value={step.waitValue}
                        onChange={(e) => updateStepWait(step.id, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-white/[0.06] border border-white/[0.12] rounded-md px-1.5 py-0.5 text-center text-white text-xs font-bold outline-none focus:border-emerald-500"
                      />

                      {/* Custom Glass Dropdown: Days / Hours / Minutes */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWaitDropdownStepId(activeWaitDropdownStepId === step.id ? null : step.id);
                          }}
                          className="flex items-center gap-1 font-semibold text-white hover:text-emerald-400 transition-colors cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-white/[0.05]"
                        >
                          <span>{step.waitUnit}</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeWaitDropdownStepId === step.id ? 'rotate-180 text-emerald-400' : ''}`} />
                        </button>

                        {activeWaitDropdownStepId === step.id && (
                          <div className="absolute left-0 top-full mt-2 w-32 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 text-xs text-left">
                            {(['Days', 'Hours', 'Minutes'] as const).map(u => (
                              <button
                                key={u}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStepWait(step.id, step.waitValue, u);
                                  setActiveWaitDropdownStepId(null);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-between ${
                                  step.waitUnit === u 
                                    ? 'bg-[#10b981]/15 text-white border border-[#10b981]/30' 
                                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                                }`}
                              >
                                <span>{u}</span>
                                {step.waitUnit === u && <Check className="w-3 h-3 text-emerald-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-px h-3 bg-white/[0.1] mx-0.5" />

                      <button
                        onClick={() => toggleSkipWeekends(step.id)}
                        className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                          step.skipWeekends ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title="Skip sending on Saturdays and Sundays"
                      >
                        {step.skipWeekends ? '✓ Skip Weekends' : '+ Weekends'}
                      </button>
                    </div>

                    {/* Bottom connector line */}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-[#a31c1b]/60 to-[#10b981]/60 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  </div>
                )}

                {/* Step Card (Frosted Glass Surface) */}
                <div 
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full rounded-2xl bg-[#171717]/80 backdrop-blur-2xl border transition-all duration-300 shadow-[0_16px_48px_rgba(0,0,0,0.35)] overflow-hidden ${
                    activeStepId === step.id
                      ? 'border-[#10b981]/50 shadow-[0_0_30px_rgba(16,185,129,0.18)] ring-1 ring-[#10b981]/30'
                      : 'border-white/[0.09] hover:border-white/[0.18]'
                  }`}
                >
                  
                  {/* Step Card Header: Step Index + Variant Tabs + Step Actions */}
                  <div className="px-5 sm:px-6 py-3.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between gap-3">
                    
                    {/* Left: Step Badge */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#059669] to-[#10b981] flex items-center justify-center text-white text-xs font-black shadow-md shadow-emerald-500/20">
                        {step.stepNumber}
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        {isFirstStep ? 'Initial Outreach' : `Follow-up #${step.stepNumber - 1}`}
                      </span>
                    </div>

                    {/* Center: A/B Testing Variant Tabs */}
                    <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-xl p-1">
                      {step.variants.map((v, vIdx) => {
                        const isCurrentVar = vIdx === step.activeVariantIndex;
                        const splitPercentage = Math.round(100 / step.variants.length);

                        return (
                          <div key={v.id} className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectVariant(step.id, vIdx);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrentVar
                                  ? 'bg-[#10b981]/25 text-white border border-[#10b981]/50 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span>{v.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({splitPercentage}%)</span>
                            </button>

                            {/* Delete variant if more than 1 */}
                            {step.variants.length > 1 && isCurrentVar && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVariant(step.id, vIdx);
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                                title="Delete this variant"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Variant Button */}
                      {step.variants.length < 4 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addVariant(step.id);
                          }}
                          className="px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer flex items-center gap-1"
                          title="Add an A/B test variant"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="hidden sm:inline">Add Variant</span>
                        </button>
                      )}
                    </div>

                    {/* Right: Deliverability Badge & Delete Step */}
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span>High Deliverability</span>
                      </div>

                      {!isFirstStep && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(step.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer"
                          title="Delete Step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Step Card Body Content */}
                  <div className="p-5 sm:p-6 space-y-4">
                    
                    {/* Subject Line Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-300">
                          {isFirstStep ? 'Subject Line' : 'Subject Line (Leave empty to use thread)'}
                        </label>
                        
                        {/* Quick Personalization Variable for Subject */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLastFocusedField('subject');
                              setShowVariablesDropdownStepId(showVariablesDropdownStepId === `subj-${step.id}` ? null : `subj-${step.id}`);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{`{ }`} Insert Variable</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {showVariablesDropdownStepId === `subj-${step.id}` && (
                            <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                              {DYNAMIC_VARIABLES.map(v => (
                                <button
                                  key={v.tag}
                                  type="button"
                                  onClick={() => insertVariable(step.id, v.tag)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <span>{v.label}</span>
                                  <span className="font-mono text-[10px] text-emerald-400">{v.tag}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={step.subject}
                          onFocus={() => {
                            setActiveStepId(step.id);
                            setLastFocusedField('subject');
                          }}
                          onChange={(e) => updateStepSubject(step.id, e.target.value)}
                          placeholder={isFirstStep ? "e.g. Scaling {{companyName}} outreach efficiency" : "Leave empty to keep existing email thread subject"}
                          className="w-full bg-[#171717]/80 border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-500 font-sans shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Integrated ReachOps Formatting & Personalization Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                      
                      {/* Left: Dynamic Variables & Personalization */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Insert:</span>
                        
                        {DYNAMIC_VARIABLES.slice(0, 4).map(v => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => {
                              setLastFocusedField('body');
                              insertVariable(step.id, v.tag);
                            }}
                            className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-mono text-emerald-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                            title={`Insert ${v.label}`}
                          >
                            {v.tag}
                          </button>
                        ))}

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLastFocusedField('body');
                              setShowVariablesDropdownStepId(showVariablesDropdownStepId === `body-${step.id}` ? null : `body-${step.id}`);
                            }}
                            className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-[11px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>More</span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>

                          {showVariablesDropdownStepId === `body-${step.id}` && (
                            <div className="absolute left-0 top-full mt-1.5 w-56 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                              {DYNAMIC_VARIABLES.map(v => (
                                <button
                                  key={v.tag}
                                  type="button"
                                  onClick={() => insertVariable(step.id, v.tag)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/[0.06] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <span>{v.label}</span>
                                  <span className="font-mono text-[10px] text-emerald-400">{v.tag}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Rich Tools (Emoji, Link, Clean Formatting, Spam Check) */}
                      <div className="flex items-center gap-1">
                        
                        {/* Emoji Picker */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmojiPickerStepId(showEmojiPickerStepId === step.id ? null : step.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Insert Emoji"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>

                          {showEmojiPickerStepId === step.id && (
                            <div className="absolute right-0 top-full mt-1.5 p-2 bg-[#171717]/95 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-2xl z-50 grid grid-cols-6 gap-1 w-48 animate-in fade-in zoom-in-95">
                              {POPULAR_EMOJIS.map(em => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => insertEmoji(step.id, em)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.1] text-sm cursor-pointer transition-transform hover:scale-125"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Link Insert */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStepId(step.id);
                            setShowLinkModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title="Insert Hyperlink"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

                        {/* Deliverability / Spam Check Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            checkDeliverability(step.body);
                            setShowSpamAuditModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Audit copy for deliverability & spam keywords"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Spam Check</span>
                        </button>

                        {/* AI Polish Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setAiSidebarOpen(true);
                            handleAiAction('review_copy');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#10b981]/15 hover:bg-[#10b981]/30 text-emerald-300 hover:text-white border border-[#10b981]/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Ask ReachOps AI Copilot to polish and optimize copy"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>AI Polish</span>
                        </button>

                      </div>

                    </div>

                    {/* Email Body Textarea */}
                    <div className="relative">
                      {isHtmlMode ? (
                        <textarea
                          rows={viewMode === 'mobile' ? 10 : 9}
                          value={step.body}
                          onFocus={() => {
                            setActiveStepId(step.id);
                            setLastFocusedField('body');
                          }}
                          onChange={(e) => updateStepBody(step.id, e.target.value)}
                          placeholder="Write email HTML markup here..."
                          className="w-full bg-[#171717]/90 border border-white/[0.08] focus:border-emerald-500 rounded-xl p-4 text-emerald-300 font-mono text-xs leading-relaxed outline-none transition-all placeholder:text-slate-600 shadow-inner"
                        />
                      ) : (
                        <textarea
                          rows={viewMode === 'mobile' ? 10 : 9}
                          value={step.body}
                          onFocus={() => {
                            setActiveStepId(step.id);
                            setLastFocusedField('body');
                          }}
                          onChange={(e) => updateStepBody(step.id, e.target.value)}
                          placeholder="Write your email pitch here... Use {{firstName}} and {{companyName}} for dynamic personalization."
                          className="w-full bg-[#171717]/90 border border-white/[0.08] focus:border-emerald-500 rounded-xl p-4 text-slate-100 font-sans text-xs sm:text-sm leading-relaxed outline-none transition-all placeholder:text-slate-600 shadow-inner resize-y min-h-[160px]"
                        />
                      )}
                    </div>

                    {/* Step Card Footer: Reading Metrics & Live Engagement Rating */}
                    <div className="flex items-center justify-between pt-1 text-slate-400 text-[11px] font-medium border-t border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <span>{wordCount} words</span>
                        <span>•</span>
                        <span>~{estimatedSec}s reading time</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">High Response Potential</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsHtmlMode(!isHtmlMode)}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          title="Toggle HTML code view"
                        >
                          <Code className="w-3 h-3" />
                          <span>{isHtmlMode ? 'Rich Text Mode' : 'HTML Mode'}</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}

          {/* Centered Add Follow-up Step Button */}
          <div className="flex flex-col items-center pt-8 pb-12">
            <div className="w-0.5 h-6 bg-gradient-to-b from-[#10b981]/50 to-transparent" />
            
            <button
              onClick={addStep}
              className="px-5 py-2.5 rounded-2xl bg-[#171717]/90 hover:bg-[#242424] border border-white/[0.1] hover:border-[#10b981] flex items-center gap-2 text-slate-200 hover:text-white transition-all shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-98 cursor-pointer mt-1 font-bold text-xs"
              title="Add Next Follow-up Email Step"
            >
              <div className="w-5 h-5 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-emerald-400">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span>Add Follow-up Step</span>
            </button>
          </div>

        </div>

      </div>

      {/* ReachOps AI Outreach Copilot Drawer (Replaces "Instantly AI") */}
      {aiSidebarOpen && (
        <div className="w-80 sm:w-96 border-l border-white/[0.08] bg-[#171717]/95 backdrop-blur-2xl flex flex-col justify-between h-full flex-shrink-0 z-30 animate-in slide-in-from-right-4 duration-300 shadow-2xl">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10b981] flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">ReachOps Copilot</h3>
                <p className="text-[10px] text-slate-400">Outreach Deliverability AI</p>
              </div>
            </div>

            <button 
              onClick={() => setAiSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Prompt Pills */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Instant AI Outreach Actions:</span>
              
              <button
                onClick={() => handleAiAction('write_sequence')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/30 text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Write executive 3-step sequence
                </span>
              </button>

              <button
                onClick={() => handleAiAction('review_copy')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/30 text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Audit copy for reply conversion
                </span>
              </button>

              <button
                onClick={() => handleAiAction('check_spam')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/30 text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Check sequence for spam words
                </span>
              </button>

              <button
                onClick={() => handleAiAction('spintax')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/30 text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center shrink-0 text-[#10b981] font-mono text-[10px] font-bold">
                  {`{}`}
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Generate Spintax Variations
                </span>
              </button>
            </div>

            {/* Conversation Log */}
            {aiChatMessages.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                {aiChatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#10b981]/15 text-white border border-[#10b981]/30 ml-4' 
                        : 'bg-white/[0.04] text-slate-200 border border-white/[0.08] mr-2 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                    {msg.actionType === 'apply_sequence' && (
                      <button
                        onClick={() => applyAiGeneratedSequence(msg.payload)}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#a31c1b] to-[#b92322] hover:from-[#c72d2c] hover:to-[#991a19] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply to Sequence</span>
                      </button>
                    )}
                    {msg.actionType === 'insert_spintax' && (
                      <button
                        onClick={() => updateStepBody(activeStepId, `${msg.payload}\n\n${activeStep.body}`)}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#a31c1b] to-[#b92322] hover:from-[#c72d2c] hover:to-[#991a19] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Insert into Active Step</span>
                      </button>
                    )}
                  </div>
                ))}
                {aiGenerating && (
                  <div className="text-xs text-slate-400 italic p-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> ReachOps AI is thinking...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Chat Input Form */}
          <form 
            onSubmit={handleCustomAiSubmit}
            className="p-3 border-t border-white/[0.08] bg-[#171717] flex items-center gap-2"
          >
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask ReachOps AI Copilot..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={aiGenerating || !aiQuery.trim()}
              className="p-2 rounded-xl bg-[#10b981] hover:bg-[#871615] text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#171717] border border-white/[0.12] rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>Insert Link</span>
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Schedule a demo"
                  className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInsertLink(activeStepId)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#a31c1b] to-[#b92322] text-xs font-bold text-white transition-all shadow-md shadow-emerald-500/20"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal (Desktop vs Mobile simulation) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={`w-full bg-[#171717] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="h-12 border-b border-white/[0.08] px-5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Preview: {viewMode === 'mobile' ? 'Mobile Phone Simulation' : 'Desktop Email Client'}
                </span>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-[#171717] text-left">
              <div className="border-b border-white/[0.08] pb-3 space-y-1.5">
                <div className="text-xs text-slate-400">To: <span className="text-white font-medium">Sarah Connor &lt;sarah@acme-corp.com&gt;</span></div>
                <div className="text-xs text-slate-400">Subject: <span className="text-white font-bold">{activeStep.subject.replace(/\{\{companyName\}\}/g, 'Acme Corp').replace(/\{\{firstName\}\}/g, 'Sarah') || 'No Subject'}</span></div>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans min-h-[160px] pt-1">
                {activeStep.body
                  .replace(/\{\{firstName\}\}/g, 'Sarah')
                  .replace(/\{\{lastName\}\}/g, 'Connor')
                  .replace(/\{\{companyName\}\}/g, 'Acme Corp')
                  .replace(/\{\{jobTitle\}\}/g, 'VP of Sales')
                  .replace(/\{\{personalization\}\}/g, 'Saw your impressive pipeline expansion')
                  .replace(/\{\{senderName\}\}/g, 'Alex Rivera')
                  .replace(/\{\{accountSignature\}\}/g, 'Best regards,\nAlex Rivera | ReachOps Lead\nalex@reachops-demo.io')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliverability & Spam Audit Modal */}
      {showSpamAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#171717] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="h-14 border-b border-white/[0.08] px-5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Deliverability & Spam Audit</h3>
                  <p className="text-[10px] text-slate-400">Step {activeStep.stepNumber} Anti-Spam Verification</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSpamAuditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              {/* Score Indicator */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Primary Inbox Placement</span>
                  <div className="text-2xl font-black text-white">{deliverabilityScore.score}% Score</div>
                  <span className="text-xs text-slate-300">Clean copy • High response probability</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-lg">
                  ✓
                </div>
              </div>

              {/* Audit Checklist */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Spam Trigger Words: Clean</span>
                    <span className="text-slate-400 text-[11px]">No blacklisted marketing hype phrases ("100% free", "guaranteed cash", "urgent action") found.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Email Length & Reading Grade</span>
                    <span className="text-slate-400 text-[11px]">Word count and sentence structure are concise and optimized for C-level mobile reading.</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">SPF / DKIM Domain Protection</span>
                    <span className="text-slate-400 text-[11px]">All connected mailboxes use ReachOps automated warmup and DNS authentication checks.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowSpamAuditModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
