import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, Plus, ArrowRight, CheckCircle2, Clock, MailOpen, Reply, AlertCircle } from 'lucide-react';

export default function CampaignSubsequences() {
  const [subsequences, setSubsequences] = useState([
    {
      id: 'sub-1',
      name: 'High-Intent Engagement Sequence',
      trigger: 'When lead clicks any link but does not reply within 48h',
      status: 'Active',
      enrolled: 12,
      stepsCount: 3,
      conversionRate: '25.0%'
    },
    {
      id: 'sub-2',
      name: 'Executive Re-engagement Branch',
      trigger: 'When email is opened 3+ times without reply',
      status: 'Active',
      enrolled: 8,
      stepsCount: 2,
      conversionRate: '12.5%'
    }
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Subsequences & Conditional Branches
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Trigger targeted follow-up workflows based on recipient behavior (opens, clicks, or intent).
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 font-medium shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Subsequence
        </Button>
      </div>

      {/* Subsequences List */}
      <div className="grid gap-4 md:grid-cols-2">
        {subsequences.map((sub) => (
          <div 
            key={sub.id}
            className="p-5 rounded-2xl bg-[#121319] border border-[#222430] hover:border-blue-500/40 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{sub.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {sub.trigger}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1c1e29]">
              <div className="p-2.5 rounded-xl bg-[#161722] border border-[#242636]">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Enrolled</p>
                <p className="text-base font-bold text-white mt-0.5">{sub.enrolled}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161722] border border-[#242636]">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Steps</p>
                <p className="text-base font-bold text-white mt-0.5">{sub.stepsCount} emails</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161722] border border-[#242636]">
                <p className="text-[10px] text-slate-400 uppercase font-medium">Conversions</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{sub.conversionRate}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Anti-spam deliverability protection active</span>
              <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs h-8">
                Edit Branch <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Trigger Card */}
      <div className="p-8 rounded-2xl border-2 border-dashed border-[#262838] bg-[#121319]/50 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#181a24] border border-[#2c2f42] flex items-center justify-center text-slate-400">
          <GitBranch className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Smart Behavior Splitter</h4>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Automate branching paths when leads show high interest or fail to respond without risking your domain sender reputation.
          </p>
        </div>
        <Button variant="outline" className="border-[#2b2e40] bg-[#171924] hover:bg-[#1e202f] text-slate-200 text-xs h-8">
          Configure Smart Branch
        </Button>
      </div>

    </div>
  );
}
