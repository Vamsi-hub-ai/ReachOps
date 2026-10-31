import React, { useState, useEffect, useRef } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Quote, List, ListOrdered, Type,
  Link2, Smile, ChevronDown, Check, Code, ShieldCheck, Wand2, X
} from 'lucide-react';

export interface RichEmailBodyEditorProps {
  stepId: string;
  value: string;
  onChange: (html: string) => void;
  isHtmlMode: boolean;
  onToggleHtmlMode: () => void;
  onOpenLinkModal: () => void;
  onCheckSpam: () => void;
  onAiPolish: () => void;
  wordCount: number;
  estimatedSec: number;
  viewMode?: 'desktop' | 'mobile';
  onFocus?: () => void;
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

const EMOJI_CATEGORIES = [
  {
    id: 'outreach',
    name: '🔥 Outreach',
    emojis: ['👋', '🚀', '💡', '🔥', '📈', '🤝', '🎯', '✨', '☕', '⚡', '📊', '📩', '💼', '💰', '📞', '🗓️'],
  },
  {
    id: 'faces',
    name: '😊 Faces',
    emojis: ['😀', '😊', '😉', '🤩', '🙌', '👍', '👏', '🙏', '😎', '💡', '🤝', '👀', '💪', '🎉', '✌️', '🌟'],
  },
  {
    id: 'growth',
    name: '📈 Growth',
    emojis: ['📈', '🚀', '⭐', '🎯', '💡', '🔥', '⚡', '✅', '📌', '🔗', '✉️', '📬', '📊', '💼', '🏢', '💻'],
  },
  {
    id: 'symbols',
    name: '🎯 Symbols',
    emojis: ['🎯', '⭐', '🔥', '✨', '💎', '🏆', '🔔', '📢', '🔑', '🏷️', '✅', '❗', '❓', '➡️', '🚀', '💯'],
  },
];

const FONT_SIZES = [
  { label: 'Small (12px)', size: '12px', execSize: '1' },
  { label: 'Normal (14px)', size: '14px', execSize: '2' },
  { label: 'Medium (16px)', size: '16px', execSize: '3' },
  { label: 'Large (18px)', size: '18px', execSize: '5' },
  { label: 'Title (22px)', size: '22px', execSize: '6' },
];

const PARAGRAPH_STYLES = [
  { label: '¶ Normal Text', tag: 'p', blockTag: '<p>' },
  { label: 'H1 Large Heading', tag: 'h1', blockTag: '<h1>' },
  { label: 'H2 Subheading', tag: 'h2', blockTag: '<h2>' },
  { label: 'H3 Section Title', tag: 'h3', blockTag: '<h3>' },
  { label: '❝ Blockquote', tag: 'blockquote', blockTag: '<blockquote>' },
  { label: '• Bulleted List', tag: 'ul', blockTag: 'ul' },
  { label: '1. Numbered List', tag: 'ol', blockTag: 'ol' },
];

export default function RichEmailBodyEditor({
  stepId,
  value,
  onChange,
  isHtmlMode,
  onToggleHtmlMode,
  onOpenLinkModal,
  onCheckSpam,
  onAiPolish,
  wordCount,
  estimatedSec,
  viewMode = 'desktop',
  onFocus,
}: RichEmailBodyEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [activeDropdown, setActiveDropdown] = useState<'paragraph' | 'fontSize' | 'emoji' | 'variables' | null>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>('outreach');
  const [currentFontSizeLabel, setCurrentFontSizeLabel] = useState<string>('Size');
  const [currentParagraphLabel, setCurrentParagraphLabel] = useState<string>('Paragraph');

  // Keep editor content synchronized with value
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      const currentHtml = editorRef.current.innerHTML;
      const formattedValue = value ? (value.includes('<') ? value : value.replace(/\n/g, '<br/>')) : '';
      if (currentHtml !== formattedValue && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = formattedValue;
      }
    }
  }, [value, isHtmlMode, stepId]);

  // Close dropdowns only on true outside click (ignoring clicks inside toolbar or open dropdowns)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return; // Click was inside toolbar/dropdown, do not close!
      }
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Format contentEditable input
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  // Helper to execute document.execCommand without losing focus
  const executeFormat = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleEditorInput();
  };

  // Apply Paragraph or Heading style
  const handleApplyParagraphStyle = (style: typeof PARAGRAPH_STYLES[0]) => {
    setActiveDropdown(null);
    setCurrentParagraphLabel(style.label.split(' ')[1] || 'Paragraph');
    if (isHtmlMode) return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    if (style.tag === 'ul') {
      document.execCommand('insertUnorderedList', false);
    } else if (style.tag === 'ol') {
      document.execCommand('insertOrderedList', false);
    } else {
      document.execCommand('formatBlock', false, style.blockTag);
    }
    handleEditorInput();
  };

  // Apply Font Size
  const handleApplyFontSize = (fontOption: typeof FONT_SIZES[0]) => {
    setActiveDropdown(null);
    setCurrentFontSizeLabel(fontOption.size);
    if (isHtmlMode) return;

    if (editorRef.current) {
      editorRef.current.focus();
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = fontOption.size;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
      handleEditorInput();
    } else {
      document.execCommand('fontSize', false, fontOption.execSize);
      handleEditorInput();
    }
  };

  // Insert variable at cursor
  const handleInsertVariable = (tag: string) => {
    setActiveDropdown(null);
    if (isHtmlMode) {
      if (textareaRef.current) {
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const updated = text.substring(0, start) + tag + ' ' + text.substring(end);
        onChange(updated);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
        }, 50);
      } else {
        onChange(value + ' ' + tag);
      }
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertText', false, tag + ' ');
    handleEditorInput();
  };

  // Insert emoji at cursor (keep picker open so user can click multiple emojis without having to reopen every time)
  const handleInsertEmoji = (emoji: string) => {
    // Note: Do NOT call setActiveDropdown(null) here so user can insert multiple emojis consecutively!
    if (isHtmlMode) {
      if (textareaRef.current) {
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const updated = text.substring(0, start) + emoji + text.substring(end);
        onChange(updated);
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 50);
      } else {
        onChange(value + emoji);
      }
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertText', false, emoji);
    handleEditorInput();
  };

  // Auto format HTML code
  const handleAutoFormatHtml = () => {
    if (!value) return;
    const formatted = value
      .replace(/></g, '>\n<')
      .replace(/\n\s*\n/g, '\n');
    onChange(formatted);
  };

  return (
    <div className="space-y-2 select-text text-left">
      
      {/* Rich Outreach Formatting & Personalization Toolbar */}
      <div 
        ref={toolbarRef}
        className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-sm select-none"
      >
        
        {/* Left Formatting Group */}
        <div className="flex flex-wrap items-center gap-1">
          
          {/* 1. Paragraph Style Dropdown */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'paragraph' ? null : 'paragraph');
              }}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              title="Paragraph Style (Normal text, H1, H2, Blockquote, Lists)"
            >
              <span>{currentParagraphLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {activeDropdown === 'paragraph' && (
              <div 
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-48 bg-[#171717] border border-white/[0.15] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 text-xs text-left"
              >
                {PARAGRAPH_STYLES.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyParagraphStyle(p)}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/[0.1] text-slate-200 hover:text-white flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="font-semibold">{p.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Text Size Dropdown */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'fontSize' ? null : 'fontSize');
              }}
              className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              title="Font Size (12px, 14px, 16px, 18px, 22px)"
            >
              <Type className="w-3 h-3 text-slate-400" />
              <span>{currentFontSizeLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {activeDropdown === 'fontSize' && (
              <div 
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-40 bg-[#171717] border border-white/[0.15] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 text-xs text-left"
              >
                {FONT_SIZES.map((f) => (
                  <button
                    key={f.size}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyFontSize(f)}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/[0.1] text-slate-200 hover:text-white flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          {/* 3. Text Formatting (Bold, Italic, Underline, Strikethrough) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('bold')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('italic')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('underline')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('strikeThrough')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          {/* 4. Text Alignment */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('justifyLeft')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('justifyCenter')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeFormat('justifyRight')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-white/[0.1] mx-0.5" />

          {/* 5. Hyperlink */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenLinkModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Insert Hyperlink"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {/* 6. Categorized Emoji Picker (Fixed: Never closes prematurely on category click) */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'emoji' ? null : 'emoji');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Insert Emoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {activeDropdown === 'emoji' && (
              <div 
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 p-3.5 bg-[#171717] border border-white/[0.15] rounded-2xl shadow-2xl z-50 w-[350px] sm:w-[380px] animate-in fade-in zoom-in-95"
              >
                {/* Header with Title and Close Button */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Smile className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Insert Outreach Emojis</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Close Emoji Picker"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Categories Tab Strip: Clean 4-Column Grid, Zero Clipping */}
                <div className="grid grid-cols-4 gap-1 pb-2.5 mb-2.5 border-b border-white/[0.08] text-[11px]">
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEmojiCategory(cat.id);
                      }}
                      className={`px-1.5 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer truncate ${
                        activeEmojiCategory === cat.id
                          ? 'bg-[#10b981]/25 text-white border border-[#10b981]/50 shadow-sm'
                          : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]'
                      }`}
                      title={cat.name}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Emojis Grid (Clicking inserts directly without closing popup) */}
                <div className="grid grid-cols-8 gap-1.5 max-h-44 overflow-y-auto p-1">
                  {(EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCategory)?.emojis || EMOJI_CATEGORIES[0].emojis).map((em) => (
                    <button
                      key={em}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertEmoji(em);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.1] text-base cursor-pointer transition-transform hover:scale-125 active:scale-95"
                      title={`Insert ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                  <span>Click emoji to insert into text</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(null);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* 7. Variables Menu */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdown(activeDropdown === 'variables' ? null : 'variables');
              }}
              className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-mono text-emerald-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
              title="Insert Dynamic Variable"
            >
              <span>{`{ }`} Var</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {activeDropdown === 'variables' && (
              <div 
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-56 bg-[#171717] border border-white/[0.15] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 text-xs text-left"
              >
                {DYNAMIC_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInsertVariable(v.tag)}
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

        {/* Right Tools (Spam Check, AI Polish, HTML Mode) */}
        <div className="flex items-center gap-1.5">
          
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onCheckSpam}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
            title="Audit copy for deliverability & spam keywords"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Spam Check</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onAiPolish}
            className="px-2.5 py-1 rounded-xl bg-[#10b981]/15 hover:bg-[#10b981]/30 text-emerald-300 hover:text-white border border-[#10b981]/30 text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
            title="Ask ReachOps AI Copilot to polish and optimize copy"
          >
            <Wand2 className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">AI Polish</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleHtmlMode}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isHtmlMode
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm font-black'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border-white/[0.08]'
            }`}
            title="Toggle Raw HTML Source Code Mode"
          >
            <Code className="w-3 h-3" />
            <span>{isHtmlMode ? 'Visual Mode' : 'HTML Mode'}</span>
          </button>

        </div>

      </div>

      {/* Editor Body Area: Visual WYSIWYG vs Raw HTML Code Editor */}
      <div className="relative select-text">
        {isHtmlMode ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 px-1 font-mono">
              <span>&lt;&gt; HTML Source Mode Active (Direct Markup Editing)</span>
              <button
                type="button"
                onClick={handleAutoFormatHtml}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Auto-Format Tags
              </button>
            </div>

            <textarea
              ref={textareaRef}
              rows={viewMode === 'mobile' ? 12 : 10}
              value={value}
              onFocus={onFocus}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Write or paste your custom email HTML markup here... (e.g. <p>Hello <strong>{{firstName}}</strong></p>)"
              className="w-full bg-[#0d1611] border border-emerald-500/40 focus:border-emerald-400 rounded-xl p-4 text-emerald-300 font-mono text-xs leading-relaxed outline-none transition-all placeholder:text-emerald-800 shadow-inner select-text"
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable={true}
            onFocus={onFocus}
            onInput={handleEditorInput}
            role="textbox"
            aria-multiline="true"
            data-placeholder="Write your email pitch here... Highlight text to format or insert {{firstName}}."
            className="w-full bg-[#171717]/90 border border-white/[0.08] focus:border-emerald-500 rounded-xl p-4 text-slate-100 font-sans text-xs sm:text-sm leading-relaxed outline-none transition-all shadow-inner min-h-[190px] select-text selection:bg-emerald-500 selection:text-black focus:ring-1 focus:ring-emerald-500/30 overflow-y-auto"
            style={{
              wordBreak: 'break-word',
            }}
          />
        )}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-1 text-slate-400 text-[11px] font-medium border-t border-white/[0.05] select-none">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>~{estimatedSec}s reading time</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">High Response Potential</span>
        </div>

        <button
          type="button"
          onClick={onToggleHtmlMode}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <Code className="w-3 h-3" />
          <span>{isHtmlMode ? 'Switch to Visual Rich Text' : 'Switch to Raw HTML Mode'}</span>
        </button>
      </div>

    </div>
  );
}

