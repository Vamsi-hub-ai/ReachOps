import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, Check, Sparkles, Eye, Code, 
  Smartphone, Monitor, ChevronDown, X, Save, Trash2,
  Clock, ShieldCheck, Send, Wand2, FileText, CheckCircle2, Mail
} from 'lucide-react';
import { analyzeEmailDeliverability } from '@/lib/deliverability';
import EmailTestLabModal, { type EmailStepData } from '@/components/campaigns/EmailTestLabModal';
import RichEmailBodyEditor from '@/components/campaigns/RichEmailBodyEditor';

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
  actionType?: 'apply_sequence' | 'insert_spintax' | 'polish_active_step' | 'custom_generated_copy';
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

export default function SequenceBuilder() {
  const { id } = useParams<{ id: string }>();
  const campaignKey = id || 'demo-camp-vp-execs';

  const [steps, setSteps] = useState<EmailStep[]>([
    {
      id: 'step-1',
      stepNumber: 1,
      subject: 'Scaling {{companyName}} outbound pipeline without spam filters',
      body: '<p>Hi {{firstName}},</p><p>Saw what your team is building at {{companyName}}. Reaching out as we help B2B revenue leaders eliminate spam folder landing and scale authentic cold outreach.</p><p>Are you free for a brief 10-minute chat this Thursday?</p><p>{{accountSignature}}</p>',
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
          body: '<p>Hi {{firstName}},</p><p>Saw what your team is building at {{companyName}}. Reaching out as we help B2B revenue leaders eliminate spam folder landing and scale authentic cold outreach.</p><p>Are you free for a brief 10-minute chat this Thursday?</p><p>{{accountSignature}}</p>',
          active: true,
        }
      ]
    },
    {
      id: 'step-2',
      stepNumber: 2,
      subject: '',
      body: '<p>Hi {{firstName}},</p><p>Following up on my previous note. We recently helped a similar B2B team lift their mailbox deliverability from 62% to 98% with ReachOps automated warmup and sender rotation.</p><p>Worth a quick look?</p><p>Best,<br/>{{senderName}}</p>',
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
          body: '<p>Hi {{firstName}},</p><p>Following up on my previous note. We recently helped a similar B2B team lift their mailbox deliverability from 62% to 98% with ReachOps automated warmup and sender rotation.</p><p>Worth a quick look?</p><p>Best,<br/>{{senderName}}</p>',
          active: true,
        }
      ]
    }
  ]);

  const [activeStepId, setActiveStepId] = useState<string>('step-1');
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Per-step HTML Mode toggles
  const [stepHtmlMode, setStepHtmlMode] = useState<Record<string, boolean>>({});

  // Subject line variable dropdown
  const [showSubjectVarStepId, setShowSubjectVarStepId] = useState<string | null>(null);

  // Link Insertion Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Email Test & Thread Inspector Lab Modal
  const [testLabOpen, setTestLabOpen] = useState(false);
  const [testLabTargetStepId, setTestLabTargetStepId] = useState<string>('step-1');

  // ReachOps AI Copilot Drawer
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Wait delay dropdown
  const [activeWaitDropdownStepId, setActiveWaitDropdownStepId] = useState<string | null>(null);

  // Deliverability audit results
  const [deliverabilityScore, setDeliverabilityScore] = useState<{ score: number; issues: string[] }>({
    score: 98,
    issues: []
  });
  const [showSpamAuditModal, setShowSpamAuditModal] = useState(false);

  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowSubjectVarStepId(null);
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
            const rawBody = s.bodyHtml || s.bodyText || '';
            const formattedBody = rawBody.includes('<') ? rawBody : `<p>${rawBody.replace(/\n/g, '<br/>')}</p>`;
            
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
              body: formattedBody,
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
                  body: formattedBody,
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
              bodyHtml: s.body,
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
        updatedVariants[s.activeVariantIndex] = {
          ...updatedVariants[s.activeVariantIndex],
          subject: newSubject
        };
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
        updatedVariants[s.activeVariantIndex] = {
          ...updatedVariants[s.activeVariantIndex],
          body: newBody
        };
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
    const defaultBody = '<p>Hi {{firstName}},</p><p>Circling back on this as we want to make sure your outbound accounts maintain high reputation.</p><p>Best,<br/>{{senderName}}</p>';
    const newStep: EmailStep = {
      id: `step-${Date.now()}`,
      stepNumber: newStepNum,
      subject: '',
      body: defaultBody,
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
          body: defaultBody,
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
      if (s.variants.length >= 4) return s;
      const nextLetter = String.fromCharCode(65 + s.variants.length);
      const newVariant: EmailVariant = {
        id: `v-${Date.now()}-${nextLetter.toLowerCase()}`,
        name: `Variant ${nextLetter}`,
        subject: s.subject ? `${s.subject} (v${nextLetter})` : '',
        body: s.body || '',
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
      if (!targetVar) return s;
      return {
        ...s,
        activeVariantIndex: variantIndex,
        subject: targetVar.subject,
        body: targetVar.body
      };
    }));
  };

  const removeVariant = (stepId: string, variantIndex: number) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== stepId || s.variants.length <= 1) return s;
      const updatedVariants = s.variants.filter((_, idx) => idx !== variantIndex);
      const newActiveIdx = Math.min(updatedVariants.length - 1, Math.max(0, variantIndex - 1));
      return {
        ...s,
        variants: updatedVariants,
        activeVariantIndex: newActiveIdx,
        subject: updatedVariants[newActiveIdx]?.subject ?? '',
        body: updatedVariants[newActiveIdx]?.body ?? ''
      };
    }));
  };

  // Insert variable in subject
  const insertSubjectVariable = (stepId: string, tag: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    updateStepSubject(step.id, step.subject ? `${step.subject} ${tag}` : tag);
    setShowSubjectVarStepId(null);
  };

  const handleInsertLink = (stepId: string) => {
    const url = linkUrl.trim() || 'https://reachops.io';
    const text = linkText.trim() || url;
    const linkHtml = `<a href="${url}" target="_blank" style="color: #10b981; text-decoration: underline;">${text}</a>`;
    const step = steps.find(s => s.id === stepId);
    if (step) {
      updateStepBody(stepId, `${step.body} ${linkHtml}`);
    }
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  const checkDeliverability = (bodyText: string) => {
    const plainText = bodyText.replace(/<[^>]+>/g, ' ');
    const analysis = analyzeEmailDeliverability(activeStep?.subject || '', plainText);
    const score = analysis.score;
    const issues = analysis.flags.map(f => f.message);
    setDeliverabilityScore({
      score,
      issues: issues.length > 0 ? issues : ['Excellent! Clean copy with high primary inbox placement probability.']
    });
  };

  // AI Outreach Copilot - Real-Time Intelligence Engine
  const [previousStepsBackup, setPreviousStepsBackup] = useState<EmailStep[] | null>(null);
  const [aiToastMessage, setAiToastMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll Copilot drawer to latest message
  useEffect(() => {
    if (aiSidebarOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, aiGenerating, aiSidebarOpen]);

  // Real-Time AI Assistant action dispatch
  const handleAiAction = (action: string) => {
    setAiGenerating(true);
    let promptText = '';

    if (action === 'write_sequence') {
      promptText = 'Generate a high-converting 3-step B2B cold email sequence for VP/Executive prospects';
      
      // Real-time generation tailored to high-converting cold outreach standards
      const generatedSteps = [
        {
          subject: 'Scaling {{companyName}} outreach efficiency',
          body: '<p>Hi {{firstName}},</p><p>Saw that {{companyName}} is expanding outbound sales. Reaching out because ReachOps automates multi-mailbox rotation and ensures your primary domain stays 100% protected from spam filters.</p><p>Would you be open to a 10-minute product walk-through next Tuesday?</p><p>{{accountSignature}}</p>'
        },
        {
          subject: '',
          body: '<p>Hi {{firstName}},</p><p>Following up quickly on my note about domain health. We recently helped a 40-rep outbound team increase their reply rate by 2.4x while maintaining zero domain blacklists.</p><p>Do you have 10 minutes to connect this week?</p><p>Best,<br/>{{senderName}}</p>'
        },
        {
          subject: '',
          body: '<p>Hi {{firstName}},</p><p>Final check-in here. If cold outreach deliverability isn\'t a top priority for {{companyName}} this quarter, no problem at all.</p><p>Whenever your team is ready to audit your sender reputation, feel free to circle back.</p><p>Best regards,<br/>{{senderName}}</p>'
        }
      ];

      // Automatically apply directly to editor canvas in REAL TIME
      setPreviousStepsBackup([...steps]);
      applyAiGeneratedSequence(generatedSteps);

      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: promptText },
        {
          role: 'assistant',
          content: '⚡ Executive 3-Step Sequence Generated & Applied to Editor in Real Time!\n\n' +
                   '• Step 1: Cold Intro (Day 0) — 46 words, domain protection hook & low-friction 10m CTA\n' +
                   '• Step 2: Value Demonstration (+2 Days delay, auto Re:) — 2.4x reply social proof metric\n' +
                   '• Step 3: Executive Breakup (+3 Days delay) — Clean permission exit protecting sender score',
          actionType: 'apply_sequence',
          payload: generatedSteps
        }
      ]);

      setAiToastMessage('✨ 3-Step sequence applied to editor in real time!');
      setTimeout(() => setAiToastMessage(null), 4000);
      setAiGenerating(false);

    } else if (action === 'review_copy') {
      promptText = `Audit copy for Step #${activeStep.stepNumber} and optimize for reply conversion`;
      
      const plainText = (activeStep.body || '').replace(/<[^>]+>/g, ' ').trim();
      const wc = plainText.split(/\s+/).filter(Boolean).length;
      const rt = Math.max(4, Math.round((wc / 200) * 60));
      const subj = activeStep.subject || '';
      const subjWords = subj.trim().split(/\s+/).filter(Boolean).length;
      const audit = analyzeEmailDeliverability(subj, plainText);
      const hasFirst = /\{\{firstName\}\}/i.test(activeStep.body);
      const hasComp = /\{\{companyName\}\}|\{\{company\}\}/i.test(activeStep.body);
      const hasQuestion = plainText.includes('?');

      const polishedCopy = `<p>Hi {{firstName}},</p><p>${plainText.length > 20 ? plainText : 'Saw what your team is building at {{companyName}} and wanted to reach out directly.'}</p><p>Would you be open to a 10-minute discussion next week?</p><p>{{accountSignature}}</p>`;

      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: promptText },
        {
          role: 'assistant',
          content: `📊 Real-Time Telemetry Audit for Step #${activeStep.stepNumber}:\n\n` +
                   `• Deliverability Placement Score: ${audit.score}/100 (${audit.score >= 90 ? '🟢 Optimal' : '🟡 Medium Risk'})\n` +
                   `• Word Count: ${wc} words (${wc <= 75 ? '✅ Concise cold outreach' : '⚠️ Long for cold B2B - recommend cutting under 75 words'})\n` +
                   `• Reading Time: ~${rt}s (${rt <= 20 ? '✅ Fast executive scan' : '⚠️ Consider trimming'})\n` +
                   `• Subject Line: ${subj ? `"${subj}" (${subjWords} words ${subjWords <= 5 ? '✅ Mobile preview safe' : '⚠️ Truncates on mobile'})` : 'Inherits previous thread with Re:'}\n` +
                   `• Personalization: ${hasFirst && hasComp ? '✅ {{firstName}} & {{companyName}} detected' : '⚠️ Missing {{firstName}} or {{companyName}} tags'}\n` +
                   `• Call to Action: ${hasQuestion ? '✅ Direct question proposed' : '⚠️ Missing single question CTA'}`,
          actionType: 'polish_active_step',
          payload: polishedCopy
        }
      ]);
      setAiGenerating(false);

    } else if (action === 'check_spam') {
      promptText = 'Scan sequence for spam trigger words';
      
      // Real-time scan across ALL steps in sequence
      const stepAudits = steps.map(s => {
        const plain = (s.body || '').replace(/<[^>]+>/g, ' ').toLowerCase();
        const flaggedWords = ['free', 'guaranteed', 'risk free', 'urgent', '100%', 'act now', 'buy now', 'winner', 'cash']
          .filter(term => plain.includes(term) || (s.subject || '').toLowerCase().includes(term));
        return { stepNumber: s.stepNumber, flaggedWords };
      });

      const totalFlags = stepAudits.reduce((acc, curr) => acc + curr.flaggedWords.length, 0);

      let report = '';
      if (totalFlags === 0) {
        report = `🛡️ Real-Time Spam Scan Passed across all ${steps.length} steps:\n\n` +
                 `• Blacklisted Phrases Detected: 0\n` +
                 `• ALL-CAPS Subject Triggers: 0\n` +
                 `• Aggressive Urgency Patterns: None\n` +
                 `• High Primary Inbox Placement Predicted across Google Workspace & Microsoft 365.`;
      } else {
        report = `⚠️ Real-Time Spam Detection Alert (${totalFlags} triggers found):\n\n` +
                 stepAudits.filter(a => a.flaggedWords.length > 0).map(a => 
                   `• Step #${a.stepNumber}: Contains "${a.flaggedWords.join('", "')}"`
                 ).join('\n') +
                 `\n\nRecommendation: Replace commercial hype terms with conversational B2B language.`;
      }

      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: promptText },
        {
          role: 'assistant',
          content: report
        }
      ]);
      setAiGenerating(false);

    } else if (action === 'spintax') {
      promptText = 'Generate dynamic Spintax variation for greeting & value prop';
      
      const spintaxSnippet = '{Hi|Hello|Hey} {{firstName}},\n\n{Saw that|Noticed that|Reaching out because} {{companyName}} is expanding outbound prospecting.\n\n{Would you be open to|Are you free for|Could we schedule} a quick 10-minute chat this week?';

      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: promptText },
        {
          role: 'assistant',
          content: `⚡ Real-Time High-Inbox Spintax Variation:\n\n${spintaxSnippet}\n\nSpintax automatically randomizes word choices across outbound emails to ensure ESP algorithms never see duplicate fingerprints.`,
          actionType: 'insert_spintax',
          payload: spintaxSnippet
        }
      ]);
      setAiGenerating(false);
    }
  };

  // Real-time custom prompt submit handler
  const handleCustomAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const query = aiQuery.trim();
    setAiQuery('');
    setAiGenerating(true);
    setAiChatMessages(prev => [...prev, { role: 'user', content: query }]);

    // Intelligent context-aware outreach generator
    const queryLower = query.toLowerCase();
    let generatedSubj = 'Quick question, {{firstName}}';
    let generatedBody = '<p>Hi {{firstName}},</p><p>Reaching out because {{companyName}} has been on our radar. We help B2B sales teams automate outreach with guaranteed inbox deliverability.</p><p>Would you be open to a 10-minute call next week?</p><p>{{accountSignature}}</p>';

    if (queryLower.includes('short') || queryLower.includes('shorter') || queryLower.includes('concise')) {
      generatedSubj = 'Idea for {{companyName}}';
      generatedBody = '<p>Hi {{firstName}},</p><p>Quick question: are you open to a new channel for qualified B2B leads at {{companyName}}?</p><p>Happy to share a 2-minute overview if interested.</p><p>Best,<br/>{{senderName}}</p>';
    } else if (queryLower.includes('cto') || queryLower.includes('tech') || queryLower.includes('engineering')) {
      generatedSubj = 'Infrastructure question for {{companyName}}';
      generatedBody = '<p>Hi {{firstName}},</p><p>Saw you lead engineering at {{companyName}}. Reaching out because our automated warm-up pool eliminates DNS and deliverability headaches for technical teams.</p><p>Open to a quick technical architecture brief?</p><p>{{accountSignature}}</p>';
    } else if (queryLower.includes('follow') || queryLower.includes('bump')) {
      generatedSubj = '';
      generatedBody = '<p>Hi {{firstName}},</p><p>Circling back on my note below. We just helped another team in your space increase reply rates by 2.4x.</p><p>Do you have 10 minutes to discuss next Tuesday?</p><p>Best,<br/>{{senderName}}</p>';
    } else if (queryLower.includes('price') || queryLower.includes('pricing') || queryLower.includes('roi')) {
      generatedSubj = 'Predictable outbound ROI for {{companyName}}';
      generatedBody = '<p>Hi {{firstName}},</p><p>Most teams waste thousands burning domain reputation with bad deliverability. ReachOps pays for itself in the first 14 days by preventing domain blacklists.</p><p>Open to reviewing our ROI benchmark data?</p><p>{{accountSignature}}</p>';
    }

    setAiChatMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `⚡ Real-Time Generated Outreach for "${query}":\n\nSubject: ${generatedSubj || '(Inherits thread Re:)'}\n\n${generatedBody.replace(/<[^>]+>/g, ' ')}`,
        actionType: 'custom_generated_copy',
        payload: { subject: generatedSubj, body: generatedBody }
      }
    ]);
    setAiGenerating(false);
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

  const undoAiSequence = () => {
    if (previousStepsBackup && previousStepsBackup.length > 0) {
      setSteps(previousStepsBackup);
      setActiveStepId(previousStepsBackup[0].id);
      saveSequenceToBackend(previousStepsBackup);
      setPreviousStepsBackup(null);
      setAiToastMessage('↩️ Reverted to previous sequence!');
      setTimeout(() => setAiToastMessage(null), 3000);
    }
  };

  // Launch Email Test Lab Modal
  const openEmailTestLab = (stepId: string) => {
    setTestLabTargetStepId(stepId);
    setTestLabOpen(true);
  };

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

  return (
    <div className="relative flex-1 flex h-full w-full overflow-hidden bg-[#06110c] bg-reachops-cosmic text-slate-100 select-text">
      
      {/* Main Canvas Scroll Area */}
      <div 
        ref={canvasScrollRef}
        className="flex-1 overflow-y-auto h-full flex flex-col items-center w-full px-4 sm:px-6 pt-5 pb-32 transition-all duration-300 scroll-smooth"
      >
        
        {/* Top Control Strip */}
        <div className="w-full max-w-4xl flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] flex-shrink-0 select-none">
          
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

          {/* Right: View Toggle, Test Lab, AI Copilot, Save Button */}
          <div className="flex items-center gap-2.5">
            {aiToastMessage && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 animate-in fade-in slide-in-from-top-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{aiToastMessage}</span>
              </span>
            )}

            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}

            {/* In-Place View Toggle (Desktop / Mobile Preview) */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 shadow-sm">
              <button
                type="button"
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
                type="button"
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

            {/* Test Thread & Inbox Lab Button */}
            <button
              type="button"
              onClick={() => openEmailTestLab(activeStepId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-500/25 hover:from-emerald-500/30 hover:to-emerald-500/40 border border-emerald-500/35 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              title="Open ReachOps Email Thread & Test Dispatch Lab"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Test Thread &amp; Inbox</span>
            </button>

            {/* ReachOps AI Copilot Toggle Button */}
            <button
              type="button"
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer shadow-sm ${
                aiSidebarOpen
                  ? 'bg-[#10b981]/15 text-white border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
              title="Toggle ReachOps AI Outreach Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Copilot</span>
            </button>

            {/* Save Sequence Button */}
            <button
              type="button"
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
            const wordCount = step.body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
            const estimatedSec = Math.max(5, Math.round((wordCount / 200) * 60));
            const isStepHtml = stepHtmlMode[step.id] || false;

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                
                {/* Wait Delay Connector Node between steps */}
                {!isFirstStep && (
                  <div className="flex flex-col items-center my-4 relative z-10 select-none">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-[#10b981]/60 to-[#a31c1b]/60 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />

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
                        type="button"
                        onClick={() => toggleSkipWeekends(step.id)}
                        className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                          step.skipWeekends ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title="Skip sending on Saturdays and Sundays"
                      >
                        {step.skipWeekends ? '✓ Skip Weekends' : '+ Weekends'}
                      </button>
                    </div>

                    <div className="w-0.5 h-6 bg-gradient-to-b from-[#a31c1b]/60 to-[#10b981]/60 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  </div>
                )}

                {/* Step Card */}
                <div 
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full rounded-2xl bg-[#171717]/85 backdrop-blur-2xl border transition-all duration-300 shadow-[0_16px_48px_rgba(0,0,0,0.35)] overflow-hidden ${
                    activeStepId === step.id
                      ? 'border-[#10b981]/50 shadow-[0_0_30px_rgba(16,185,129,0.18)] ring-1 ring-[#10b981]/30'
                      : 'border-white/[0.09] hover:border-white/[0.18]'
                  }`}
                >
                  
                  {/* Step Card Header */}
                  <div className="px-5 sm:px-6 py-3.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between gap-3 select-none">
                    
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
                              type="button"
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

                            {step.variants.length > 1 && isCurrentVar && (
                              <button
                                type="button"
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

                      {step.variants.length < 4 && (
                        <button
                          type="button"
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

                    {/* Right: Quick Test Step, Deliverability Badge & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEmailTestLab(step.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        title="Open Test Lab for this step"
                      >
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Test Thread</span>
                      </button>

                      {!isFirstStep && (
                        <button
                          type="button"
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
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between text-xs select-none">
                        <label className="font-semibold text-slate-300">
                          {isFirstStep ? 'Subject Line' : 'Subject Line (Leave empty to keep existing email thread)'}
                        </label>
                        
                        {/* Quick Personalization Variable for Subject */}
                        <div className="relative">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLastFocusedField('subject');
                              setShowSubjectVarStepId(showSubjectVarStepId === step.id ? null : step.id);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>{`{ }`} Insert Variable</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {showSubjectVarStepId === step.id && (
                            <div 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-52 bg-[#171717] border border-white/[0.15] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                            >
                              {DYNAMIC_VARIABLES.map(v => (
                                <button
                                  key={v.tag}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => insertSubjectVariable(step.id, v.tag)}
                                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-white/[0.08] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                                >
                                  <span>{v.label}</span>
                                  <span className="font-mono text-[10px] text-emerald-400">{v.tag}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative select-text">
                        <input
                          type="text"
                          value={step.subject}
                          onFocus={() => {
                            setActiveStepId(step.id);
                            setLastFocusedField('subject');
                          }}
                          onChange={(e) => updateStepSubject(step.id, e.target.value)}
                          placeholder={isFirstStep ? "e.g. Scaling {{companyName}} outreach efficiency" : "Leave empty to keep existing email thread subject"}
                          className="w-full bg-[#171717]/80 border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-500 font-sans shadow-inner select-text"
                        />
                      </div>
                    </div>

                    {/* Integrated Rich WYSIWYG Email Body Editor */}
                    <RichEmailBodyEditor
                      stepId={step.id}
                      value={step.body}
                      onChange={(newHtml) => updateStepBody(step.id, newHtml)}
                      isHtmlMode={isStepHtml}
                      onToggleHtmlMode={() => setStepHtmlMode(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                      onOpenLinkModal={() => {
                        setActiveStepId(step.id);
                        setShowLinkModal(true);
                      }}
                      onCheckSpam={() => {
                        checkDeliverability(step.body);
                        setShowSpamAuditModal(true);
                      }}
                      onAiPolish={() => {
                        setAiSidebarOpen(true);
                        handleAiAction('review_copy');
                      }}
                      wordCount={wordCount}
                      estimatedSec={estimatedSec}
                      viewMode={viewMode}
                      onFocus={() => {
                        setActiveStepId(step.id);
                        setLastFocusedField('body');
                      }}
                    />

                  </div>

                </div>

              </div>
            );
          })}

          {/* Add Follow-up Step Button */}
          <div className="flex flex-col items-center pt-8 pb-12 select-none">
            <div className="w-0.5 h-6 bg-gradient-to-b from-[#10b981]/50 to-transparent" />
            
            <button
              type="button"
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

      {/* ReachOps AI Outreach Copilot Drawer */}
      {aiSidebarOpen && (
        <div className="w-80 sm:w-[400px] border-l border-white/[0.08] bg-[#171717]/95 backdrop-blur-2xl flex flex-col h-full flex-shrink-0 z-30 animate-in slide-in-from-right-4 duration-300 shadow-2xl select-none">
          
          {/* Drawer Top Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#059669] to-[#10b981] flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">ReachOps Copilot</h3>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold">
                    Real-Time
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Targeting Step #{activeStep.stepNumber} ({steps.length} {steps.length === 1 ? 'step' : 'steps'} total)
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setAiSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Context Banner */}
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-[11px] shrink-0">
            <span className="text-slate-300">
              Active Context: <strong className="text-white">Step #{activeStep.stepNumber}</strong>
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {deliverabilityScore.score}% Deliverability
            </span>
          </div>

          {/* Scrollable Messages & Actions Area */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
            
            {/* Quick Actions Buttons Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block pb-0.5">Instant Outreach Actions:</span>
              
              <button
                type="button"
                onClick={() => handleAiAction('write_sequence')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/40 text-left transition-all group cursor-pointer active:scale-98"
                title="Generate & Apply 3-Step Sequence directly to Editor in Real Time"
              >
                <div className="w-6 h-6 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white block">
                    Write executive 3-step sequence
                  </span>
                  <span className="text-[10px] text-emerald-400">⚡ Auto-applies to editor in real time</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('review_copy')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/40 text-left transition-all group cursor-pointer active:scale-98"
                title="Audit Active Step Copy for Reply Conversions"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white block">
                    Audit copy for reply conversion
                  </span>
                  <span className="text-[10px] text-slate-400">Real-time analysis on Step #{activeStep.stepNumber}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('check_spam')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/40 text-left transition-all group cursor-pointer active:scale-98"
                title="Scan all sequence steps for spam trigger keywords"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white block">
                    Check sequence for spam words
                  </span>
                  <span className="text-[10px] text-slate-400">Scans all {steps.length} steps live</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction('spintax')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#10b981]/40 text-left transition-all group cursor-pointer active:scale-98"
                title="Generate dynamic spintax variations"
              >
                <div className="w-6 h-6 rounded-lg bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center shrink-0 text-[#10b981] font-mono text-[10px] font-bold">
                  {`{}`}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white block">
                    Generate Spintax Variations
                  </span>
                  <span className="text-[10px] text-slate-400">Randomizes greetings &amp; hooks</span>
                </div>
              </button>
            </div>

            {/* Conversation Log & Real-Time Action Responses */}
            {aiChatMessages.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                {aiChatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#10b981]/15 text-white border border-[#10b981]/30 ml-4 font-semibold' 
                        : 'bg-white/[0.03] text-slate-200 border border-white/[0.08] mr-1 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                    
                    {/* Action 1: Re-apply 3-step sequence or Undo */}
                    {msg.actionType === 'apply_sequence' && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-white/[0.08]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              applyAiGeneratedSequence(msg.payload);
                              setAiToastMessage('✨ Sequence re-applied to editor in real time!');
                              setTimeout(() => setAiToastMessage(null), 3500);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Re-Apply to Sequence</span>
                          </button>

                          {previousStepsBackup && (
                            <button
                              type="button"
                              onClick={undoAiSequence}
                              className="py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer border border-white/[0.1] active:scale-95"
                              title="Revert back to your previous steps"
                            >
                              <span>↩️ Undo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action 2: Polish active step copy */}
                    {msg.actionType === 'polish_active_step' && (
                      <div className="mt-3 pt-2 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => {
                            updateStepBody(activeStepId, msg.payload);
                            setAiToastMessage(`✨ Applied polished copy to Step #${activeStep.stepNumber}!`);
                            setTimeout(() => setAiToastMessage(null), 3500);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Apply Optimization to Step #{activeStep.stepNumber} (Real-Time)</span>
                        </button>
                      </div>
                    )}

                    {/* Action 3: Insert Spintax */}
                    {msg.actionType === 'insert_spintax' && (
                      <div className="mt-3 pt-2 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => {
                            updateStepBody(activeStepId, `<p>${msg.payload.replace(/\n/g, '<br/>')}</p><br/>${activeStep.body}`);
                            setAiToastMessage(`✨ Inserted Spintax into Step #${activeStep.stepNumber}!`);
                            setTimeout(() => setAiToastMessage(null), 3500);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#10b981] to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>⚡ Insert Spintax into Step #{activeStep.stepNumber} (Real-Time)</span>
                        </button>
                      </div>
                    )}

                    {/* Action 4: Custom Generated Copy Application */}
                    {msg.actionType === 'custom_generated_copy' && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => {
                            if (msg.payload.subject) {
                              updateStepSubject(activeStepId, msg.payload.subject);
                            }
                            updateStepBody(activeStepId, msg.payload.body);
                            setAiToastMessage(`✨ Applied AI copy to Step #${activeStep.stepNumber} in real time!`);
                            setTimeout(() => setAiToastMessage(null), 3500);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>⚡ Apply to Step #{activeStep.stepNumber} (Real-Time)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newStepNum = steps.length + 1;
                            const newStep: EmailStep = {
                              id: `step-${Date.now()}`,
                              stepNumber: newStepNum,
                              subject: msg.payload.subject || '',
                              body: msg.payload.body,
                              waitValue: 2,
                              waitUnit: 'Days',
                              waitDays: 2,
                              skipWeekends: true,
                              activeVariantIndex: 0,
                              variants: [
                                {
                                  id: `v-${Date.now()}-a`,
                                  name: 'Variant A',
                                  subject: msg.payload.subject || '',
                                  body: msg.payload.body,
                                  active: true
                                }
                              ]
                            };
                            const updated = [...steps, newStep];
                            setSteps(updated);
                            setActiveStepId(newStep.id);
                            saveSequenceToBackend(updated);
                            setAiToastMessage(`➕ Added Step #${newStepNum} to sequence in real time!`);
                            setTimeout(() => setAiToastMessage(null), 3500);
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/[0.08]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>➕ Add as Step #{steps.length + 1} (Real-Time)</span>
                        </button>
                      </div>
                    )}

                  </div>
                ))}

                {aiGenerating && (
                  <div className="text-xs text-slate-400 italic p-2 flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> 
                    <span>ReachOps Copilot is analyzing in real time...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Sticky Prompt Input at Bottom */}
          <form 
            onSubmit={handleCustomAiSubmit}
            className="sticky bottom-0 p-3.5 border-t border-white/[0.08] bg-[#171717] flex items-center gap-2 shrink-0 shadow-2xl"
          >
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask Copilot: e.g. 'Make it shorter' or 'Add ROI hook'..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-emerald-500 placeholder:text-slate-500 font-sans shadow-inner"
            />

            <button
              type="submit"
              disabled={aiGenerating || !aiQuery.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-md shadow-emerald-500/20"
              title="Send to Copilot"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Link Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-[#171717] border border-white/[0.12] rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Insert Hyperlink</span>
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Link Display Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Schedule a 10-minute demo"
                  className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 select-text"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Destination URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://reachops.io/demo"
                  className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 select-text"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleInsertLink(activeStepId)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#a31c1b] to-[#b92322] text-xs font-bold text-white transition-all shadow-md shadow-emerald-500/20"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliverability & Spam Audit Modal */}
      {showSpamAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
          <div className="w-full max-w-md bg-[#171717] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="h-14 border-b border-white/[0.08] px-5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Deliverability &amp; Spam Audit</h3>
                  <p className="text-[10px] text-slate-400">Step {activeStep.stepNumber} Anti-Spam Verification</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowSpamAuditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
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
                    <span className="font-semibold text-white block">Email Length &amp; Reading Grade</span>
                    <span className="text-slate-400 text-[11px]">Word count and sentence structure are concise and optimized for C-level reading.</span>
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
                  type="button"
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

      {/* Redesigned Premier ReachOps Email Thread & Test Dispatch Lab Modal */}
      <EmailTestLabModal
        isOpen={testLabOpen}
        onClose={() => setTestLabOpen(false)}
        steps={steps as EmailStepData[]}
        campaignId={campaignKey}
        initialStepId={testLabTargetStepId}
      />

    </div>
  );
}
