import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Check, Save } from 'lucide-react';
import { TIMEZONES } from '@/lib/timezones';

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export default function CampaignSchedule() {
  const [activeDays, setActiveDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [timezone, setTimezone] = useState('US/Eastern (EST)');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (dayId: string) => {
    if (activeDays.includes(dayId)) {
      setActiveDays(activeDays.filter(d => d !== dayId));
    } else {
      setActiveDays([...activeDays, dayId]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sending Schedule</h2>
          <p className="text-sm text-gray-500">Configure exactly when emails are allowed to be sent for this campaign.</p>
        </div>
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white min-w-[120px]">
          {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Calendar className="w-5 h-5" />
            <CardTitle className="text-lg">Active Days</CardTitle>
          </div>
          <CardDescription>Select which days of the week the campaign should run.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {DAYS.map(day => {
              const isActive = activeDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`
                    w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200
                    ${isActive 
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' 
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  <span className="text-sm">{day.label}</span>
                  {isActive && <Check className="w-4 h-4 mt-1" />}
                </button>
              );
            })}
          </div>
          {activeDays.length === 0 && (
            <p className="text-sm text-red-500 mt-4">Warning: No days selected. The campaign will be paused.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Clock className="w-5 h-5" />
            <CardTitle className="text-lg">Time Window & Timezone</CardTitle>
          </div>
          <CardDescription>Set the operating hours and reference timezone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2 max-w-md">
            <Label className="text-gray-700 font-semibold">Reference Timezone</Label>
            <select 
              className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <Label className="text-gray-700 font-semibold">Daily Time Window</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11 w-40 bg-white shadow-sm font-medium"
                />
              </div>
              <span className="text-gray-400 font-medium">to</span>
              <div className="relative">
                <Input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 w-40 bg-white shadow-sm font-medium" 
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Emails will only be sent between {startTime} and {endTime} {timezone}.</p>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
