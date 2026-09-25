import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, ShieldAlert, AlertTriangle, Save } from 'lucide-react';

export default function CampaignSettings() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Campaign Settings</h2>
          <p className="text-sm text-gray-500">Manage rules, limits, and danger zone actions.</p>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white min-w-[120px]">
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Settings className="w-5 h-5" />
            <CardTitle className="text-lg">General Information</CardTitle>
          </div>
          <CardDescription>Basic identifiers for this campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label className="text-gray-700 font-semibold">Campaign Name</Label>
            <Input defaultValue="Q4 Enterprise Outreach" className="bg-white shadow-sm" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldAlert className="w-5 h-5" />
            <CardTitle className="text-lg">Safety & Limits</CardTitle>
          </div>
          <CardDescription>Protect your domain reputation and control outreach volume.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-4 max-w-md">
            <div>
              <Label className="text-gray-700 font-semibold flex justify-between">
                <span>Max Daily Emails</span>
                <span className="text-primary">200</span>
              </Label>
              <input type="range" min="10" max="500" defaultValue="200" className="w-full accent-primary mt-2" />
              <p className="text-xs text-gray-500 mt-1">Total emails sent per day across all accounts in this campaign.</p>
            </div>
            
            <div className="pt-2">
              <Label className="text-gray-700 font-semibold flex justify-between">
                <span>Max New Prospects / Day</span>
                <span className="text-primary">50</span>
              </Label>
              <input type="range" min="5" max="200" defaultValue="50" className="w-full accent-primary mt-2" />
              <p className="text-xs text-gray-500 mt-1">How many net-new people to contact daily.</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-1">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Stop on Reply</span>
                <span className="text-sm text-gray-500 block">Automatically remove prospects from the sequence when they reply.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-1">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Include Unsubscribe Link</span>
                <span className="text-sm text-gray-500 block">Append a safe opt-out link to the bottom of all emails.</span>
              </div>
            </label>
          </div>

        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/30 shadow-sm mt-8">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <CardTitle className="text-lg">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-600/80">Destructive actions that affect this campaign immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-red-200 rounded-lg bg-white">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Pause Campaign</h4>
              <p className="text-xs text-gray-500">Temporarily stop all sending. Scheduled emails will be queued.</p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Pause Campaign</Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-red-200 rounded-lg bg-white mt-4">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Archive Campaign</h4>
              <p className="text-xs text-gray-500">Permanently archive this campaign. It will be removed from active views.</p>
            </div>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Archive Campaign</Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
