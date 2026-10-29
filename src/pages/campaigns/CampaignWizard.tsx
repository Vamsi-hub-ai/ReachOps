import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Megaphone, Mail, 
  Check, Loader2, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';

interface CampaignTypeOption {
  id: string;
  title: string;
  description: string;
  icon: typeof Megaphone;
  gradient: string;
  badge?: string;
  defaultSubject: string;
  defaultBody: string;
}

const CAMPAIGN_OPTIONS: CampaignTypeOption[] = [
  {
    id: 'cold-outreach',
    title: 'Cold Outreach Campaign',
    description: 'Multi-step email sequences for cold leads and prospecting.',
    icon: Megaphone,
    gradient: 'from-[#d97706] via-[#ea580c] to-[#b45309]', // Warm sunset bronze gradient matching screenshot
    defaultSubject: 'Quick question regarding {{company}} outreach',
    defaultBody: `Hi {{firstName}},\n\nI noticed what your team is building at {{company}}.\n\nWe help high-growth teams automate cold outreach, manage sender deliverability, and book qualified meetings.\n\nWould you be open to a 10-minute chat next Tuesday?\n\nBest,\n{{senderName}}`
  },
  {
    id: 'newsletter-blast',
    title: 'Newsletter & Broadcast',
    description: 'One-off announcements or newsletters sent to your subscriber lists.',
    icon: Mail,
    gradient: 'from-[#2563eb] via-[#3b82f6] to-[#0ea5e9]', // Sapphire blue gradient
    defaultSubject: 'Important update: New features now live on ReachOps',
    defaultBody: `Hey {{firstName}},\n\nWe're thrilled to share our latest product updates designed to boost your sender deliverability and response rates.\n\nCheck out the full changelog here!\n\nBest,\n{{senderName}}`
  }
];

export default function CampaignWizard() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('cold-outreach');
  const [campaignName, setCampaignName] = useState<string>('Untitled Campaign');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateCampaign = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const chosenOption = CAMPAIGN_OPTIONS.find(o => o.id === selectedType) || CAMPAIGN_OPTIONS[0];
    const finalName = campaignName.trim() || 'Untitled Campaign';

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          status: 'DRAFT',
          dailyLimit: 100,
          timezone: 'US/Eastern (EST)',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create campaign');
      }

      const created = await res.json();
      const campaignId = created.id;

      // Update sequence with chosen template
      try {
        await fetch(`/api/campaigns/${campaignId}/sequence`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            steps: [
              {
                stepNumber: 1,
                delayDays: 0,
                subject: chosenOption.defaultSubject,
                bodyText: chosenOption.defaultBody,
                bodyHtml: `<p>${chosenOption.defaultBody.replace(/\n/g, '<br/>')}</p>`,
              }
            ]
          }),
        });
      } catch (seqErr) {
        console.warn('Initial sequence update error (non-fatal):', seqErr);
      }

      // Navigate straight to the modern Sequence Editor (Image 5)
      navigate(`/campaigns/${campaignId}/editor`);
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setErrorMsg(err.message || 'Something went wrong creating the campaign.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col -m-6 p-6 sm:p-10 select-none">
      
      {/* Top Header: Back button matching Image 4 */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <button 
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer py-2 px-3 -ml-3 rounded-lg hover:bg-[#12141e]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Centered Content Area matching Image 4 */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center items-center py-8 sm:py-14 animate-in fade-in duration-300">
        
        {/* Main Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-center mb-3">
          What Would You Like To Create?
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8 max-w-md">
          Select an outreach style to customize your sequences, leads, and inbox routing.
        </p>

        {/* Campaign Type Options (Check Option Cards) */}
        <div className="w-full space-y-3.5 mb-8">
          {CAMPAIGN_OPTIONS.map((option) => {
            const isChecked = selectedType === option.id;
            const IconComponent = option.icon;

            return (
              <div
                key={option.id}
                onClick={() => setSelectedType(option.id)}
                className={`relative flex items-center justify-between p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border ${
                  isChecked
                    ? 'bg-[#10131d] border-[#0080FF] shadow-lg shadow-[#0080FF]/15 ring-1 ring-[#0080FF]'
                    : 'bg-[#0d0f17] border-[#1d202e] hover:border-[#2e3347] hover:bg-[#11131c]'
                }`}
              >
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* Left: Gradient Icon Box matching Image 4 */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${option.gradient} p-0.5 shadow-md flex items-center justify-center flex-shrink-0`}>
                    <div className="w-full h-full rounded-2xl bg-black/15 backdrop-blur-[2px] flex items-center justify-center">
                      <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                    </div>
                  </div>

                  {/* Option Title and Description */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {option.title}
                      </h3>
                      {option.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0080FF]/20 text-[#0080FF] border border-[#0080FF]/40">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-snug">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Right: Check Option Indicator */}
                <div className="ml-4 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${
                    isChecked
                      ? 'bg-[#0080FF] border-[#0080FF] text-white shadow-sm'
                      : 'border-[#2e3347] bg-[#141622]'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Campaign Name Input Card */}
        <div className="w-full bg-[#0d0f17] border border-[#1d202e] rounded-2xl p-5 mb-6 text-left">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
            placeholder="e.g. Q4 Enterprise Outreach - CTOs"
            className="w-full bg-[#12141e] border border-[#25283a] focus:border-[#0080FF] text-white font-medium text-sm px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-500"
          />
          <p className="text-[11px] text-slate-500 mt-2">
            You can always rename this campaign later from inside the sequence editor.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs mb-4 text-center">
            {errorMsg}
          </div>
        )}

        {/* Bottom Action Button */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-[#0080FF]" />
            <span>Opens directly in the multi-step sequence builder</span>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0080FF] hover:bg-[#0070E0] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0080FF]/25 hover:shadow-[#0080FF]/40 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Campaign...</span>
              </>
            ) : (
              <>
                <span>Continue to Sequence Editor</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
