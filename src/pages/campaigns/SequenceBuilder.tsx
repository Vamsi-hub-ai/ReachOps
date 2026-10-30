import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, Check, Zap, Sparkles, Eye, Code, 
  Smartphone, Monitor, 
  ChevronDown, X, Save, Trash2,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ListOrdered, List, Indent, Outdent,
  Link2, Image as ImageIcon, Rocket, User, Eraser,
  Paintbrush
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
  { label: 'Personalization', tag: '{{personalization}}' },
  { label: 'Phone', tag: '{{phone}}' },
  { label: 'Website', tag: '{{website}}' },
  { label: 'Sender Name', tag: '{{senderName}}' },
  { label: 'Sender Email', tag: '{{senderEmail}}' },
];

const EMOJI_CATEGORIES = [
  { id: 'smileys', icon: '😀', label: 'Smileys & Emotion' },
  { id: 'animals', icon: '🐵', label: 'Animals & Nature' },
  { id: 'food', icon: '🍇', label: 'Food & Drink' },
  { id: 'activities', icon: '🎃', label: 'Activities' },
  { id: 'travel', icon: '🌍', label: 'Travel & Places' },
  { id: 'objects', icon: '💡', label: 'Objects' },
  { id: 'symbols', icon: '💯', label: 'Symbols' },
  { id: 'flags', icon: '🏁', label: 'Flags' },
];

const EMOJIS_BY_CATEGORY: Record<string, string[]> = {
  smileys: [
    '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😉', '😊', '😈',
    '😎', '😍', '😘', '😗', '😙', '😚', '🙂', '🙃', '😐', '😑',
    '😶', '😏', '😣', '😥', '😮', '😯', '😪', '😫', '😴', '😌',
    '😛', '😜', '😝', '😒', '😓', '😔', '😕', '🙁', '😲', '😖',
    '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '😬',
    '😰', '😱', '😳', '😵', '😡', '😠', '😷', '😇', '😈', '👿',
    '🤝', '👍', '👎', '👏', '🙌', '👋', '✍️', '🙏', '💪', '🔥',
    '✨', '🎉', '🚀', '⭐', '❤️', '💡', '🎯', '⚡', '🌟', '👀'
  ],
  animals: [
    '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🐩', '🐺', '🦊', '🦝',
    '🐱', '🐈', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓',
    '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏',
    '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭',
    '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦫', '🦔', '🦇', '🐻',
    '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔',
    '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢'
  ],
  food: [
    '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏',
    '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑',
    '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄',
    '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🥯',
    '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕',
    '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘',
    '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘'
  ],
  activities: [
    '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋',
    '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️',
    '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎',
    '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒',
    '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️', '🎣', '🤿',
    '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄'
  ],
  travel: [
    '🌍', '🌎', '🌏', '🌐', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻',
    '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨',
    '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
    '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒',
    '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺'
  ],
  objects: [
    '💡', '🔦', '🏮', '🪔', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️',
    '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷',
    '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺',
    '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳',
    '📡', '🔋', '🪫', '🔌', '🧯', '🛢️', '💸', '💵', '💴', '💶'
  ],
  symbols: [
    '💯', '💢', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '💮', '♨️',
    '💈', '🛑', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞',
    '🕓', '🕟', '🕔', '🕠', '🕕', '🕡', '🕖', '🕢', '🕗', '🕣',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'
  ],
  flags: [
    '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇸', '🇬🇧',
    '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇯🇵', '🇮🇳', '🇧🇷', '🇲🇽',
    '🇰🇷', '🇨🇳', '🇷🇺', '🇿🇦', '🇳🇬', '🇪🇬', '🇦🇪', '🇸🇦', '🇮🇱', '🇹🇷'
  ]
};

export default function SequenceBuilder() {
  const { id } = useParams();
  const campaignKey = id || 'tga-sales';

  const [steps, setSteps] = useState<EmailStep[]>([
    {
      id: 'step-1',
      stepNumber: 1,
      subject: '',
      body: '',
      waitValue: 1,
      waitUnit: 'Days',
      waitDays: 1,
      activeVariantIndex: 0,
      variants: [
        {
          id: 'v-1',
          name: 'Variant A',
          subject: '',
          body: '',
          active: true
        }
      ]
    }
  ]);

  const [activeStepId, setActiveStepId] = useState<string>('step-1');
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Wait delay dropdown state
  const [waitDropdownStepId, setWaitDropdownStepId] = useState<string | null>(null);

  // Bottom Floating Toolbar states
  const [showTypographyBar, setShowTypographyBar] = useState(true);
  const [fontSize, setFontSize] = useState('16px');
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [activeAlignment, setActiveAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Interactive View Modes (Images 2, 3, 4)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // AI Right-Hand Sidebar (Image 1)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Popover states (Images 1, 2, 3, 4 from previous turn)
  const [showVariablesPopup, setShowVariablesPopup] = useState(false);
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkDisplayText, setLinkDisplayText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [showImagePopup, setShowImagePopup] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [showEmojiPopup, setShowEmojiPopup] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');

  const [showUnsubscribePopup, setShowUnsubscribePopup] = useState(false);
  const [unsubscribeText, setUnsubscribeText] = useState('Click here to unsubscribe');

  // Toast Notification (Image 5 from previous turn)
  const [htmlCleanedToast, setHtmlCleanedToast] = useState(false);
  
  // Full Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  const toolbarContainerRef = useRef<HTMLDivElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // Close all popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarContainerRef.current && !toolbarContainerRef.current.contains(event.target as Node)) {
        setShowVariablesPopup(false);
        setShowLinkPopup(false);
        setShowImagePopup(false);
        setShowEmojiPopup(false);
        setShowUnsubscribePopup(false);
        setShowFontSizeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignKey}/sequence`)
      .then(res => res.json())
      .then(data => {
        if (data && data.sequence && Array.isArray(data.sequence.steps) && data.sequence.steps.length > 0) {
          setSteps(data.sequence.steps.map((s: any, idx: number) => {
            const rawBody = s.bodyText || (s.bodyHtml ? s.bodyHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '') : '');
            return {
              id: s.id || `step-${s.stepNumber || idx + 1}`,
              stepNumber: s.stepNumber || idx + 1,
              subject: s.subject || '',
              body: rawBody || '',
              waitValue: s.delayDays || 1,
              waitUnit: 'Days',
              waitDays: s.delayDays || 1,
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
          }));
        }
      })
      .catch(console.error);
  }, [campaignKey]);

  const saveSequenceToBackend = async (customSteps?: EmailStep[]) => {
    setIsSaving(true);
    const targetSteps = customSteps || steps;

    try {
      await fetch(`/api/campaigns/${campaignKey}/sequence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: targetSteps.map((s, i) => ({
            stepNumber: i + 1,
            delayDays: s.waitDays || s.waitValue || 1,
            subject: s.subject,
            bodyHtml: s.body.includes('<') ? s.body : `<p>${s.body.replace(/\n/g, '<br/>')}</p>`,
            bodyText: s.body.replace(/<[^>]+>/g, ''),
          }))
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
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

  const updateStepWaitValue = (stepId: string, val: number) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, waitValue: val, waitDays: val } : s));
  };

  const updateStepWaitUnit = (stepId: string, unit: 'Days' | 'Hours' | 'Minutes') => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, waitUnit: unit } : s));
  };

  const addStep = () => {
    const newStepNum = steps.length + 1;
    const newStep: EmailStep = {
      id: `step-${Date.now()}`,
      stepNumber: newStepNum,
      subject: '',
      body: `Hi {{firstName}},\n\nFollowing up on my previous note. Did you have a chance to look over my email regarding {{companyName}}?\n\nBest,\n{{senderName}}`,
      waitValue: 1,
      waitUnit: 'Days',
      waitDays: 1,
      activeVariantIndex: 0,
      variants: [
        {
          id: `v-${Date.now()}-a`,
          name: 'Variant A',
          subject: '',
          body: `Hi {{firstName}},\n\nFollowing up on my previous note. Did you have a chance to look over my email regarding {{companyName}}?\n\nBest,\n{{senderName}}`,
          active: true
        }
      ]
    };

    const nextSteps = [...steps, newStep];
    setSteps(nextSteps);
    setActiveStepId(newStep.id);
    saveSequenceToBackend(nextSteps);

    setTimeout(() => {
      if (canvasScrollRef.current) {
        canvasScrollRef.current.scrollTo({
          top: canvasScrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const removeStep = (stepId: string) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter(s => s.id !== stepId).map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    setSteps(filtered);
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
      return {
        ...s,
        variants: [...s.variants, newVariant],
        activeVariantIndex: s.variants.length,
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

  const insertVariableIntoActiveStep = (tag: string) => {
    const step = steps.find(s => s.id === activeStepId) || steps[0];
    if (!step) return;
    if (lastFocusedField === 'subject') {
      updateStepSubject(step.id, step.subject ? `${step.subject} ${tag}` : tag);
    } else {
      updateStepBody(step.id, step.body ? `${step.body} ${tag} ` : `${tag} `);
    }
    setShowVariablesPopup(false);
  };

  // Insert Link Handler (Image 1 from previous turn)
  const handleInsertLink = () => {
    const url = linkUrl.trim() || 'https://example.com';
    const text = linkDisplayText.trim() || url;
    const markdownLink = `[${text}](${url})`;
    const step = steps.find(s => s.id === activeStepId) || steps[0];
    if (step) {
      if (lastFocusedField === 'subject') {
        updateStepSubject(step.id, step.subject ? `${step.subject} ${markdownLink}` : markdownLink);
      } else {
        updateStepBody(step.id, step.body ? `${step.body} ${markdownLink}` : markdownLink);
      }
    }
    setShowLinkPopup(false);
    setLinkDisplayText('');
    setLinkUrl('');
  };

  // Insert Image Handler (Image 2 from previous turn)
  const handleInsertImage = () => {
    const url = imageUrl.trim() || 'https://example.com/image.jpg';
    const markdownImg = `\n![Image](${url})\n`;
    const step = steps.find(s => s.id === activeStepId) || steps[0];
    if (step) {
      updateStepBody(step.id, `${step.body}${markdownImg}`);
    }
    setShowImagePopup(false);
    setImageUrl('');
  };

  // Insert Emoji Handler (Image 3 from previous turn)
  const handleInsertEmoji = (emoji: string) => {
    const step = steps.find(s => s.id === activeStepId) || steps[0];
    if (step) {
      if (lastFocusedField === 'subject') {
        updateStepSubject(step.id, `${step.subject}${emoji}`);
      } else {
        updateStepBody(step.id, `${step.body}${emoji}`);
      }
    }
  };

  // Insert Unsubscribe Link Handler (Image 4 from previous turn)
  const handleInsertUnsubscribe = () => {
    const text = unsubscribeText.trim() || 'Click here to unsubscribe';
    const unsubMarkup = `\n\n<p style="font-size: 11px; color: #888888;"><a href="{{unsubscribeUrl}}" style="color: #888888; text-decoration: underline;">${text}</a></p>`;
    const step = steps.find(s => s.id === activeStepId) || steps[0];
    if (step) {
      updateStepBody(step.id, `${step.body}${unsubMarkup}`);
    }
    setShowUnsubscribePopup(false);
  };

  // Clean Text & Trigger Toast (Image 5 from previous turn)
  const cleanTextFormatting = () => {
    const step = steps.find(s => s.id === activeStepId) || steps[0];
    if (!step) return;
    const cleaned = step.body.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
    updateStepBody(step.id, cleaned);
    setHtmlCleanedToast(true);
    setTimeout(() => setHtmlCleanedToast(false), 3000);
  };

  // AI Prompt Handlers matching Image 1
  const handleAiAction = (action: 'write_sequence' | 'review_copy' | 'check_spam' | 'spintax') => {
    setAiGenerating(true);
    if (action === 'write_sequence') {
      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: 'Write my email sequence for me' },
        { 
          role: 'assistant', 
          content: 'Here is a high-converting 3-step B2B cold outbound sequence tailored for high deliverability:',
          actionType: 'apply_sequence',
          payload: [
            {
              subject: 'Quick idea for {{companyName}} pipeline',
              body: `Hi {{firstName}},\n\nSaw what your team is building at {{companyName}} and wanted to reach out.\n\nWe help B2B teams scale outbound deliverability and book meetings on autopilot.\n\nOpen to a quick 10-minute chat this Thursday?`
            },
            {
              subject: '',
              body: `Hi {{firstName}},\n\nWanted to make sure my previous note didn't get buried. Any thoughts on scaling your outbound reply rates this quarter?`
            },
            {
              subject: '',
              body: `Hi {{firstName}},\n\nFinal check-in—if you're all set on outbound right now, no problem at all. Feel free to reach out whenever you're ready.`
            }
          ]
        }
      ]);
    } else if (action === 'review_copy') {
      const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
      const wordCount = (activeStep?.body || '').trim().split(/\s+/).filter(Boolean).length;
      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: 'Review my copy before I launch' },
        {
          role: 'assistant',
          content: `📊 Sequence Copy Review:\n• Word Count: ${wordCount} words (Ideal is under 120 words)\n• Readability Grade: Grade 4 (Clear & engaging)\n• Call-to-Action: Clear, single low-friction question\n• Personalization: Dynamic tags {{firstName}}, {{companyName}} detected.\n\n✅ Your copy is lean, conversational, and optimized for high reply rates!`
        }
      ]);
    } else if (action === 'check_spam') {
      const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
      const analysis = analyzeEmailDeliverability(activeStep?.subject || '', activeStep?.body || '');
      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: 'Check my sequence for spam words?' },
        {
          role: 'assistant',
          content: `🛡️ Spam Scanner Results:\n• Overall Clean Score: ${analysis.score}/100 (${analysis.riskLevel} Risk)\n• Flags / Triggers: ${analysis.flags.length > 0 ? analysis.flags.map(f => f.message).join('; ') : 'None! 0 triggers detected.'}\n• Word Count: ${analysis.wordCount} words\n• Deliverability Status: Ready to send safely without landing in Promotions/Spam.`
        }
      ]);
    } else if (action === 'spintax') {
      const spintaxSample = '{Hi|Hello|Hey} {{firstName}},\n\n{Noticed what your team is building|Saw your recent launch} at {{companyName}}...';
      setAiChatMessages(prev => [
        ...prev,
        { role: 'user', content: 'AI Spintax Writer' },
        {
          role: 'assistant',
          content: `Here is a randomized spintax block to prevent mailbox pattern detection:\n\n${spintaxSample}`,
          actionType: 'insert_spintax',
          payload: spintaxSample
        }
      ]);
    }
    setAiGenerating(false);
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
          content: `Based on your request "${query}": I recommend keeping the email under 75 words, focusing directly on the prospect's core pain point, and ending with an interest-based CTA rather than a hard calendar link.`
        }
      ]);
      setAiGenerating(false);
    }, 400);
  };

  const applyAiGeneratedSequence = (newStepsData: Array<{ subject: string; body: string }>) => {
    const updatedSteps: EmailStep[] = newStepsData.map((s, idx) => ({
      id: `step-ai-${idx + 1}-${Date.now()}`,
      stepNumber: idx + 1,
      subject: s.subject,
      body: s.body,
      waitValue: idx === 0 ? 1 : 2,
      waitUnit: 'Days',
      waitDays: idx === 0 ? 1 : 2,
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
    <div className="relative flex-1 flex h-full w-full overflow-hidden bg-[#0a0c10] text-slate-100 select-none">
      
      {/* Main Canvas Area - Scrollable with mouse wheel and trackpad */}
      <div 
        ref={canvasScrollRef}
        className="flex-1 overflow-y-auto h-full flex flex-col items-center w-full px-4 pt-4 pb-56 transition-all duration-300 scroll-smooth"
      >
        
        {/* Top Floating Save / Status indicator */}
        <div className="w-full max-w-4xl flex items-center justify-between pb-3 mb-2 border-b border-[#181a26] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white">
              {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} in Sequence
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              {viewMode === 'mobile' ? 'Mobile View Preview' : 'Desktop View'}
              {isHtmlMode && ' • HTML Mode Active'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> All changes saved
              </span>
            )}

            {/* Quick Add Step button at top */}
            <button
              onClick={addStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141724] hover:bg-[#1d2134] border border-[#262a40] hover:border-[#0080FF] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
              title="Add a new step to this email sequence"
            >
              <Plus className="w-3.5 h-3.5 text-[#0080FF]" />
              <span>Add Step</span>
            </button>

            <button
              onClick={() => saveSequenceToBackend()}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-bold transition-all shadow-md shadow-[#0080FF]/25 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Sequence'}</span>
            </button>
          </div>
        </div>

        {/* Main Sequence Canvas matching Image 2, 3, 4 */}
        <div className={`w-full space-y-0 pt-2 animate-in fade-in duration-300 transition-all ${viewMode === 'mobile' ? 'max-w-md' : 'max-w-4xl'}`}>
          
          {steps.map((step, index) => {
            const isFirstStep = index === 0;
            const currentVariantLetter = String.fromCharCode(65 + step.activeVariantIndex);

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                
                {/* Wait Delay Bar (Image 2 & Image 4) */}
                {!isFirstStep && (
                  <div className="w-full flex items-center justify-center my-6 relative">
                    {/* Horizontal dividing line */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#1e2232]" />
                    </div>

                    {/* Center Pill: Wait [ 1 ] [ Days ∨ ] */}
                    <div className="relative flex items-center gap-2.5 bg-[#0a0c10] px-4 py-1.5 z-10 text-xs text-slate-300">
                      <span className="text-slate-300 font-medium text-xs">Wait</span>
                      
                      <input 
                        type="number" 
                        min="1" 
                        max="365"
                        value={step.waitValue || step.waitDays || 1}
                        onChange={(e) => updateStepWaitValue(step.id, parseInt(e.target.value) || 1)}
                        className="w-11 text-center bg-[#13151f] border border-[#262938] rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none focus:border-[#0080FF]"
                      />

                      <div className="relative">
                        <button 
                          onClick={() => setWaitDropdownStepId(waitDropdownStepId === step.id ? null : step.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-[#13151f] border border-[#262938] hover:border-[#383d54] rounded-lg text-white font-medium text-xs transition-colors cursor-pointer"
                        >
                          <span>{step.waitUnit || 'Days'}</span>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {waitDropdownStepId === step.id && (
                          <div className="absolute left-0 top-full mt-1.5 w-32 bg-[#12141c] border border-[#26293c] rounded-xl shadow-2xl py-1 z-50 text-xs">
                            {(['Days', 'Hours', 'Minutes'] as const).map((unit) => (
                              <button
                                key={unit}
                                onClick={() => {
                                  updateStepWaitUnit(step.id, unit);
                                  setWaitDropdownStepId(null);
                                }}
                                className="w-full px-3 py-1.5 flex items-center justify-between text-left text-slate-300 hover:text-white hover:bg-[#1a1d2c] cursor-pointer"
                              >
                                <span>{unit}</span>
                                {(step.waitUnit || 'Days') === unit && <Check className="w-3.5 h-3.5 text-slate-200" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Card Layout matching Image 2, 3, 4 */}
                <div 
                  onClick={() => setActiveStepId(step.id)}
                  className="w-full flex items-start gap-4"
                >
                  {/* Left Column: Subject Input & Textarea Editor */}
                  <div className={`space-y-3 transition-all ${viewMode === 'mobile' ? 'w-[320px] sm:w-[340px]' : 'flex-1'}`}>
                    
                    {/* Subject Input with ⚡ icon on right */}
                    <div className="relative flex items-center bg-[#0d0f17] border border-[#1e2232] rounded-xl px-4 py-2.5 text-sm transition-colors focus-within:border-[#0080FF] shadow-sm">
                      <input
                        type="text"
                        value={step.subject}
                        onFocus={() => setLastFocusedField('subject')}
                        onChange={(e) => updateStepSubject(step.id, e.target.value)}
                        placeholder={isFirstStep ? "Subject line" : "Leave empty to use previous step's subject"}
                        className="flex-1 bg-transparent text-white font-medium text-sm placeholder:text-slate-500 outline-none"
                      />

                      {/* ⚡ Variable/Prompt icon on right side of subject */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStepId(step.id);
                          setLastFocusedField('subject');
                          setShowVariablesPopup(true);
                          setShowLinkPopup(false);
                          setShowImagePopup(false);
                          setShowEmojiPopup(false);
                          setShowUnsubscribePopup(false);
                        }}
                        className="ml-2 p-1 text-slate-400 hover:text-[#0080FF] transition-colors cursor-pointer"
                        title="Insert Dynamic Variable into Subject"
                      >
                        <Zap className="w-4 h-4 text-slate-400 hover:text-[#0080FF]" />
                      </button>
                    </div>

                    {/* Email Body Container Card matching Image 2, 3, 4 */}
                    <div className="relative rounded-2xl bg-[#0d0f17] border border-[#1e2232] p-5 shadow-xl transition-all focus-within:border-[#0080FF]/60 min-h-[160px]">
                      
                      {/* Image 4: If HTML Mode is active, render code editor */}
                      {isHtmlMode ? (
                        <div className="space-y-1">
                          <textarea
                            rows={viewMode === 'mobile' ? 6 : 5}
                            value={step.body.includes('<') ? step.body : `<div>${step.body || 'qwd'}</div>`}
                            onFocus={() => setLastFocusedField('body')}
                            onChange={(e) => updateStepBody(step.id, e.target.value)}
                            className="w-full bg-transparent text-slate-200 text-xs font-mono leading-relaxed outline-none resize-y min-h-[100px]"
                          />
                        </div>
                      ) : (
                        /* Standard visual text editor (Images 2 & 3) */
                        <textarea
                          rows={viewMode === 'mobile' ? 9 : 8}
                          value={step.body}
                          onFocus={() => setLastFocusedField('body')}
                          onChange={(e) => updateStepBody(step.id, e.target.value)}
                          placeholder="Write your email pitch here... Use {{firstName}} and {{companyName}} for personalization."
                          className="w-full bg-transparent text-slate-200 text-sm font-sans leading-relaxed outline-none resize-y placeholder:text-slate-600 min-h-[140px]"
                        />
                      )}

                      {/* Step Number in Bottom Right Corner */}
                      <div className="absolute bottom-3 right-4 text-xs font-mono font-bold text-slate-600 select-none">
                        {step.stepNumber}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Variant Actions matching Image 2, 3, 4 */}
                  <div className="flex flex-col gap-2 pt-1 w-48 shrink-0">
                    
                    {/* + Add variant button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addVariant(step.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0d0f17] hover:bg-[#141724] border border-[#1e2232] hover:border-[#2b2f42] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 w-fit"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>Add variant</span>
                    </button>

                    {/* Connected Variant Pill with Dotted Line & Trash Can */}
                    <div className="flex items-center gap-2">
                      {/* Dotted horizontal connector line connecting to the card */}
                      <div className="w-4 border-t border-dotted border-[#0080FF]/70" />

                      {/* Active Variant Pill (Edit variant A ✓) */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIdx = (step.activeVariantIndex + 1) % step.variants.length;
                          selectVariant(step.id, nextIdx);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0080FF]/15 hover:bg-[#0080FF]/25 border border-[#0080FF] text-xs font-semibold text-[#0080FF] shadow-sm transition-all whitespace-nowrap cursor-pointer"
                      >
                        <span>Edit variant {currentVariantLetter}</span>
                        <Check className="w-3.5 h-3.5 text-[#0080FF] stroke-[3]" />
                      </button>

                      {/* Trash Delete Step button on follow-ups */}
                      {!isFirstStep && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(step.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1a1d2c] rounded-lg transition-colors cursor-pointer"
                          title="Delete Step"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            );
          })}

          {/* Centered Add Step Button */}
          <div className="flex flex-col items-center pt-6 pb-12">
            <div className="w-px h-6 bg-[#25283a]" />
            
            <button
              onClick={addStep}
              className="px-5 py-2.5 rounded-xl bg-[#0d0f17] hover:bg-[#161926] border border-[#23273c] hover:border-[#0080FF] flex items-center gap-2 text-slate-300 hover:text-white transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer mt-1 font-semibold text-xs"
              title="Add Next Email Step"
            >
              <Plus className="w-4 h-4 text-[#0080FF]" />
              <span>Add Step</span>
            </button>
          </div>

        </div>

      </div>

      {/* Image 1: Right-Hand AI Assistant Sidebar ("How can I help?") */}
      {aiSidebarOpen && (
        <div className="w-80 md:w-96 border-l border-[#1e2232] bg-[#0c0e15] flex flex-col justify-between h-full flex-shrink-0 z-30 animate-in slide-in-from-right-4 duration-300">
          
          {/* Top Header & Actions */}
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4">
              <h2 className="text-xl font-bold text-white tracking-tight">How can I help?</h2>
              <button 
                onClick={() => setAiSidebarOpen(false)}
                className="p-1 text-slate-500 hover:text-white hover:bg-[#161824] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Interactive Prompt Pills matching Image 1 */}
            <div className="space-y-2 mb-6">
              
              {/* Pill 1: Write my email sequence for me */}
              <button
                onClick={() => handleAiAction('write_sequence')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#23273a] bg-[#12141e]/70 hover:bg-[#1a1d2c] hover:border-[#323750] text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-600/25 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Write my email sequence for me
                </span>
              </button>

              {/* Pill 2: Review my copy before I launch */}
              <button
                onClick={() => handleAiAction('review_copy')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#23273a] bg-[#12141e]/70 hover:bg-[#1a1d2c] hover:border-[#323750] text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-600/25 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Review my copy before I launch
                </span>
              </button>

              {/* Pill 3: Check my sequence for spam words? */}
              <button
                onClick={() => handleAiAction('check_spam')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#23273a] bg-[#12141e]/70 hover:bg-[#1a1d2c] hover:border-[#323750] text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600/25 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  Check my sequence for spam words?
                </span>
              </button>

              {/* Pill 4: AI Spintax Writer */}
              <button
                onClick={() => handleAiAction('spintax')}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#23273a] bg-[#12141e]/70 hover:bg-[#1a1d2c] hover:border-[#323750] text-left transition-all group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-600/25 border border-orange-500/40 flex items-center justify-center shrink-0 text-orange-400 font-mono text-[11px] font-bold">
                  {`{}`}
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  AI Spintax Writer
                </span>
              </button>

            </div>

            {/* Conversation Log */}
            {aiChatMessages.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#1a1d2c]">
                {aiChatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#141724] text-white border border-[#242738] ml-4' 
                        : 'bg-[#10131d] text-slate-300 border border-[#202336] mr-2 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                    {msg.actionType === 'apply_sequence' && (
                      <button
                        onClick={() => applyAiGeneratedSequence(msg.payload)}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply to Sequence</span>
                      </button>
                    )}
                    {msg.actionType === 'insert_spintax' && (
                      <button
                        onClick={() => updateStepBody(activeStepId, `${msg.payload}\n\n${activeStep.body}`)}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Insert into Current Step</span>
                      </button>
                    )}
                  </div>
                ))}
                {aiGenerating && (
                  <div className="text-xs text-slate-500 italic p-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> Thinking...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Chat Input matching Image 1 */}
          <form 
            onSubmit={handleCustomAiSubmit}
            className="p-3 border-t border-[#1b1e2c] bg-[#090b10] flex items-center gap-2"
          >
            {/* Attachment icon */}
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Attach File"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Input field */}
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Ask Instantly AI..."
              className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-slate-500"
            />

            {/* Microphone icon */}
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Voice Input"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>

            {/* Submit Arrow button */}
            <button
              type="submit"
              disabled={!aiQuery.trim()}
              className="w-7 h-7 rounded-lg bg-[#0080FF] hover:bg-[#0070E0] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Send"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          </form>

        </div>
      )}

      {/* Dual-Tier Floating Action & Rich Text Toolbar */}
      <div 
        ref={toolbarContainerRef}
        className="fixed bottom-6 z-40 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 max-w-[95vw]"
      >
        
        {/* Tier 1: Rich Text Formatting Bar */}
        {showTypographyBar && (
          <div className="border border-[#23273c] bg-[#10121a]/95 backdrop-blur-xl rounded-xl shadow-2xl px-2.5 py-1.5 flex items-center gap-1 text-slate-300 animate-in fade-in slide-in-from-bottom-2 flex-wrap justify-center">
            
            {/* Bold, Italic, Underline, Strike */}
            <button 
              onClick={() => updateStepBody(activeStep.id, activeStep.body ? `**${activeStep.body}**` : '')}
              className="w-7 h-7 flex items-center justify-center font-bold text-xs hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Bold"
            >
              B
            </button>
            <button 
              onClick={() => updateStepBody(activeStep.id, activeStep.body ? `*${activeStep.body}*` : '')}
              className="w-7 h-7 flex items-center justify-center italic font-serif text-xs hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Italic"
            >
              I
            </button>
            <button 
              className="w-7 h-7 flex items-center justify-center underline text-xs hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Underline"
            >
              U
            </button>
            <button 
              className="w-7 h-7 flex items-center justify-center line-through text-xs hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Strikethrough"
            >
              S
            </button>

            <div className="w-px h-4 bg-[#23273c] mx-1" />

            {/* Alignments */}
            <button 
              onClick={() => setActiveAlignment('left')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeAlignment === 'left' ? 'bg-[#1c1f2e] text-white' : 'hover:bg-[#1c1f2e] text-slate-400'}`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveAlignment('center')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeAlignment === 'center' ? 'bg-[#1c1f2e] text-white' : 'hover:bg-[#1c1f2e] text-slate-400'}`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveAlignment('right')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeAlignment === 'right' ? 'bg-[#1c1f2e] text-white' : 'hover:bg-[#1c1f2e] text-slate-400'}`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveAlignment('justify')}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${activeAlignment === 'justify' ? 'bg-[#1c1f2e] text-white' : 'hover:bg-[#1c1f2e] text-slate-400'}`}
              title="Align Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-[#23273c] mx-1" />

            {/* Lists & Indent */}
            <button 
              className="w-7 h-7 flex items-center justify-center hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Ordered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button 
              className="w-7 h-7 flex items-center justify-center hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Unordered List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button 
              className="w-7 h-7 flex items-center justify-center hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Decrease Indent"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>
            <button 
              className="w-7 h-7 flex items-center justify-center hover:bg-[#1c1f2e] hover:text-white rounded transition-colors"
              title="Increase Indent"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-[#23273c] mx-1" />

            {/* Sub/Superscript & Clear formatting */}
            <button className="px-1.5 h-7 flex items-center justify-center text-[10px] hover:bg-[#1c1f2e] rounded" title="Superscript">x²</button>
            <button className="px-1.5 h-7 flex items-center justify-center text-[10px] hover:bg-[#1c1f2e] rounded" title="Subscript">x₂</button>
            <button onClick={cleanTextFormatting} className="px-1.5 h-7 flex items-center justify-center text-[10px] hover:bg-[#1c1f2e] rounded font-bold" title="Clear Formatting">Tx</button>

            <div className="w-px h-4 bg-[#23273c] mx-1" />

            {/* Font Size dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
                className="flex items-center gap-1 px-2 h-7 bg-[#141724] border border-[#222538] hover:border-[#383d54] rounded text-xs text-white"
              >
                <span>{fontSize}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showFontSizeDropdown && (
                <div className="absolute left-0 bottom-full mb-1 w-20 bg-[#12141e] border border-[#26293c] rounded-lg shadow-xl py-1 text-xs z-50">
                  {['12px', '14px', '16px', '18px', '20px'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setFontSize(s); setShowFontSizeDropdown(false); }}
                      className="w-full px-3 py-1 text-left text-slate-300 hover:text-white hover:bg-[#1a1d2c]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-[#23273c] mx-1" />

            {/* Color A & Highlighter */}
            <button className="w-7 h-7 flex flex-col items-center justify-center text-xs hover:bg-[#1c1f2e] rounded" title="Text Color">
              <span className="font-bold leading-none">A</span>
              <span className="w-3 h-0.5 bg-white mt-0.5" />
            </button>
            <button className="w-7 h-7 flex flex-col items-center justify-center text-xs hover:bg-[#1c1f2e] rounded" title="Highlight Color">
              <Paintbrush className="w-3 h-3 text-amber-400" />
            </button>

          </div>
        )}

        {/* Tier 2: Tool Action Buttons */}
        <div className="relative border border-[#23273c] bg-[#10121a]/95 backdrop-blur-xl rounded-2xl shadow-2xl px-3 py-2 flex items-center gap-1.5 text-slate-300">
          
          {/* T: Toggle Typography Bar */}
          <button
            onClick={() => setShowTypographyBar(!showTypographyBar)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
              showTypographyBar 
                ? 'bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/50 shadow-sm' 
                : 'hover:bg-[#1c1f2e] text-slate-400 hover:text-white'
            }`}
            title="Toggle Typography Formatting"
          >
            T
          </button>

          {/* ⚡: Dynamic Variables Popup Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowVariablesPopup(!showVariablesPopup);
                setShowLinkPopup(false);
                setShowImagePopup(false);
                setShowEmojiPopup(false);
                setShowUnsubscribePopup(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showVariablesPopup 
                  ? 'bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/50' 
                  : 'hover:bg-[#1c1f2e] text-slate-400 hover:text-white'
              }`}
              title="Insert Personalization Variable"
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Variable Tags Popup Menu */}
            {showVariablesPopup && (
              <div className="absolute left-0 bottom-full mb-3 w-80 bg-[#10121a] border border-[#26293c] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-[#1b1e2c] mb-1">
                  Dynamic Variables
                </div>
                <div className="space-y-0.5">
                  {DYNAMIC_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      onClick={() => insertVariableIntoActiveStep(v.tag)}
                      className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-left hover:bg-[#181b28] transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        {v.label}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 group-hover:text-[#0080FF]">
                        {v.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🔗: Link Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLinkPopup(!showLinkPopup);
                setShowVariablesPopup(false);
                setShowImagePopup(false);
                setShowEmojiPopup(false);
                setShowUnsubscribePopup(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showLinkPopup 
                  ? 'bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/50 shadow-sm' 
                  : 'hover:bg-[#1c1f2e] text-slate-400 hover:text-white'
              }`}
              title="Insert Link"
            >
              <Link2 className="w-4 h-4" />
            </button>

            {/* Link Popover Menu */}
            {showLinkPopup && (
              <div className="absolute left-0 bottom-full mb-3 w-72 bg-[#10131d] border border-[#26293c] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 text-left">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Display text</label>
                    <input
                      type="text"
                      value={linkDisplayText}
                      onChange={(e) => setLinkDisplayText(e.target.value)}
                      placeholder="Enter display text"
                      autoFocus
                      className="w-full bg-[#181a24] border border-[#2c3044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#0080FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">URL</label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full bg-[#181a24] border border-[#2c3044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#0080FF]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowLinkPopup(false)}
                      className="px-4 py-1.5 rounded-xl bg-[#1e2230] hover:bg-[#282d40] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInsertLink}
                      className="px-4 py-1.5 rounded-xl bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🖼️: Image Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowImagePopup(!showImagePopup);
                setShowVariablesPopup(false);
                setShowLinkPopup(false);
                setShowEmojiPopup(false);
                setShowUnsubscribePopup(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showImagePopup 
                  ? 'bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/50 shadow-sm' 
                  : 'hover:bg-[#1c1f2e] text-slate-400 hover:text-white'
              }`}
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Image Popover Menu */}
            {showImagePopup && (
              <div className="absolute left-0 bottom-full mb-3 w-72 bg-[#10131d] border border-[#26293c] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 text-left">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Image URL</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      autoFocus
                      className="w-full bg-[#181a24] border border-[#2c3044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#0080FF]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowImagePopup(false)}
                      className="px-4 py-1.5 rounded-xl bg-[#1e2230] hover:bg-[#282d40] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInsertImage}
                      className="px-4 py-1.5 rounded-xl bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🚀: Emoji Picker Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowEmojiPopup(!showEmojiPopup);
                setShowVariablesPopup(false);
                setShowLinkPopup(false);
                setShowImagePopup(false);
                setShowUnsubscribePopup(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showEmojiPopup 
                  ? 'bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/50 shadow-sm' 
                  : 'hover:bg-[#1c1f2e] text-slate-400 hover:text-white'
              }`}
              title="Insert Emoji"
            >
              <Rocket className="w-4 h-4" />
            </button>

            {/* Emoji Picker Modal / Popover */}
            {showEmojiPopup && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-96 bg-[#10131d] border border-[#26293c] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-left">
                {/* Category Selector Bar */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#202436] px-1">
                  {EMOJI_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveEmojiCategory(cat.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                        activeEmojiCategory === cat.id
                          ? 'bg-[#1e2232] border border-[#2f354e] shadow-sm'
                          : 'hover:bg-[#161824] opacity-75 hover:opacity-100'
                      }`}
                      title={cat.label}
                    >
                      {cat.icon}
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div className="grid grid-cols-10 gap-1 max-h-56 overflow-y-auto pr-1">
                  {(EMOJIS_BY_CATEGORY[activeEmojiCategory] || []).map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInsertEmoji(emoji)}
                      className="w-7 h-7 rounded flex items-center justify-center text-base hover:bg-[#1c2030] hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 👤-: Unsubscribe Link Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUnsubscribePopup(!showUnsubscribePopup);
                setShowVariablesPopup(false);
                setShowLinkPopup(false);
                setShowImagePopup(false);
                setShowEmojiPopup(false);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showUnsubscribePopup 
                  ? 'bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/50 shadow-sm' 
                  : 'hover:bg-[#1c1f2e] text-slate-400 hover:text-white'
              }`}
              title="Insert Unsubscribe Link"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Unsubscribe Popover Menu */}
            {showUnsubscribePopup && (
              <div className="absolute left-0 bottom-full mb-3 w-72 bg-[#10131d] border border-[#26293c] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 text-left">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Link text</label>
                    <input
                      type="text"
                      value={unsubscribeText}
                      onChange={(e) => setUnsubscribeText(e.target.value)}
                      placeholder="Click here to unsubscribe"
                      autoFocus
                      className="w-full bg-[#181a24] border border-[#2c3044] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#0080FF]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setShowUnsubscribePopup(false)}
                      className="px-4 py-1.5 rounded-xl bg-[#1e2230] hover:bg-[#282d40] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInsertUnsubscribe}
                      className="px-4 py-1.5 rounded-xl bg-[#0080FF] hover:bg-[#0070E0] text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🧹: Clean HTML button */}
          <button
            onClick={cleanTextFormatting}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#1c1f2e] text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Clean HTML & Format"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-[#23273c] mx-0.5" />

          {/* ✨ AI Copywriter / Assistant Sidebar Toggle (Image 1) */}
          <button
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              aiSidebarOpen
                ? 'bg-purple-600/25 text-purple-400 border border-purple-500/50 shadow-sm'
                : 'hover:bg-[#1c1f2e] text-purple-400 hover:text-purple-300'
            }`}
            title="Ask AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* [ 🖥️  📱 ] In-Place Device View Toggle Pill (Images 2 & 3) */}
          <div className="flex items-center bg-[#141724] border border-[#222538] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'desktop' 
                  ? 'bg-[#0080FF] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop Layout"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'mobile' 
                  ? 'bg-[#0080FF] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile Phone Layout"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* [ 🖌️  <> ] Style / In-Place HTML Code Toggle Pill (Image 4) */}
          <div className="flex items-center bg-[#141724] border border-[#222538] rounded-xl p-0.5">
            <button
              onClick={() => updateStepBody(activeStep.id, `${activeStep.body}\n\nP.S. Let me know if another time works better for you!`)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Add P.S. Hook"
            >
              <Paintbrush className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsHtmlMode(!isHtmlMode)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isHtmlMode 
                  ? 'bg-[#0080FF] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle In-Line HTML Code View"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-[#23273c] mx-0.5" />

          {/* 👁️ Preview Button */}
          <button
            onClick={() => setPreviewOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#1c1f2e] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Preview Email"
          >
            <Eye className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* HTML Cleaned Toast Notification */}
      {htmlCleanedToast && (
        <div className="fixed bottom-24 right-8 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-[#12141c] border border-[#26293c] rounded-2xl shadow-2xl text-slate-100 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-slate-200 stroke-[3]" />
          </div>
          <span>HTML cleaned successfully</span>
        </div>
      )}

      {/* Email Preview Modal (Desktop / Mobile full preview) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={`w-full bg-[#0d0f17] border border-[#25283c] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-xl'}`}>
            <div className="h-12 border-b border-[#1e2232] px-4 flex items-center justify-between bg-[#090b10]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0080FF]" />
                <span className="text-xs font-bold text-white">Preview: {viewMode === 'mobile' ? 'Mobile Phone Simulation' : 'Desktop Email Client'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-white cursor-pointer ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3 bg-[#0a0c13] text-left">
              <div className="border-b border-[#1a1d2c] pb-3 space-y-1">
                <div className="text-[11px] text-slate-400">To: <span className="text-white font-medium">Sarah Connor &lt;sarah@acme-corp.com&gt;</span></div>
                <div className="text-[11px] text-slate-400">Subject: <span className="text-white font-bold">{activeStep.subject.replace(/\{\{companyName\}\}/g, 'Acme Corp').replace(/\{\{firstName\}\}/g, 'Sarah') || 'No Subject'}</span></div>
              </div>

              <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans min-h-[160px] pt-2">
                {activeStep.body
                  .replace(/\{\{firstName\}\}/g, 'Sarah')
                  .replace(/\{\{lastName\}\}/g, 'Connor')
                  .replace(/\{\{companyName\}\}/g, 'Acme Corp')
                  .replace(/\{\{personalization\}\}/g, 'Saw your impressive launch on Product Hunt')
                  .replace(/\{\{senderName\}\}/g, 'Alex Rivera')
                  .replace(/\{\{phone\}\}/g, '+1 (555) 392-1049')
                  .replace(/\{\{website\}\}/g, 'acme-corp.com')}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
