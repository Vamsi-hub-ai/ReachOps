import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  X, Check, Sparkles, CalendarCheck 
} from 'lucide-react';
import { TIMEZONES } from '@/lib/timezones';

interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateStr: string, timeStr: string, formattedLabel: string, timezone?: string, notes?: string) => void;
  initialDate?: string;
  initialTime?: string;
  prospectName?: string;
  prospectEmail?: string;
  campaignName?: string;
  isSuppressed?: boolean;
  suppressReason?: string;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TIME_PRESETS = [
  { label: '09:00 AM', hour: '09', min: '00', meridiem: 'AM', title: 'Morning' },
  { label: '11:30 AM', hour: '11', min: '30', meridiem: 'AM', title: 'Midday' },
  { label: '02:00 PM', hour: '02', min: '00', meridiem: 'PM', title: 'Afternoon' },
  { label: '05:00 PM', hour: '05', min: '00', meridiem: 'PM', title: 'End of Day' },
];

export default function ScheduleFollowUpModal({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  initialTime,
  prospectName = 'this prospect',
  prospectEmail = '',
  campaignName = 'Active Sequence',
  isSuppressed = false,
  suppressReason = '',
}: ScheduleFollowUpModalProps) {
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('Re: Quick question regarding outreach');
  const now = useMemo(() => new Date(), []);
  
  // Format YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Default to tomorrow 09:00 AM if not provided
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate) return initialDate;
    return formatYMD(tomorrow);
  });

  const [selectedHour, setSelectedHour] = useState<string>(() => {
    if (initialTime) {
      const [h] = initialTime.split(':');
      const numH = parseInt(h, 10);
      const h12 = numH === 0 ? 12 : numH > 12 ? numH - 12 : numH;
      return String(h12).padStart(2, '0');
    }
    return '09';
  });

  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    if (initialTime) {
      const [, m] = initialTime.split(':');
      return m || '00';
    }
    return '00';
  });

  const [selectedMeridiem, setSelectedMeridiem] = useState<'AM' | 'PM'>(() => {
    if (initialTime) {
      const [h] = initialTime.split(':');
      return parseInt(h, 10) >= 12 ? 'PM' : 'AM';
    }
    return 'AM';
  });

  // Calendar View State
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (initialDate) {
      const [y, m, d] = initialDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return tomorrow;
  });

  const [activePreset, setActivePreset] = useState<string>('tomorrow');

  // Compute 24-hr time string (HH:MM)
  const time24 = useMemo(() => {
    let h = parseInt(selectedHour, 10);
    if (isNaN(h)) h = 9;
    if (selectedMeridiem === 'PM' && h < 12) h += 12;
    if (selectedMeridiem === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${selectedMinute}`;
  }, [selectedHour, selectedMinute, selectedMeridiem]);

  // Compute Formatted Schedule Display
  const formattedSchedule = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const datePart = dt.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${datePart} at ${selectedHour}:${selectedMinute} ${selectedMeridiem}`;
    } catch {
      return `${selectedDate} at ${selectedHour}:${selectedMinute} ${selectedMeridiem}`;
    }
  }, [selectedDate, selectedHour, selectedMinute, selectedMeridiem]);

  // Calendar Grid Calculations
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // First day of current month (0: Sunday, 1: Monday, ... 6: Saturday)
    // Convert to Monday = 0, Sunday = 6
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

    // Previous month total days
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: {
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
    }[] = [];

    const todayStr = formatYMD(now);

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatYMD(prevDate);
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: dateStr < todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = formatYMD(curDate);
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: dateStr < todayStr,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = formatYMD(nextDate);
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: dateStr < todayStr,
      });
    }

    return days;
  }, [viewDate, selectedDate, now]);

  if (!isOpen) return null;

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActivePreset('custom');
  };

  // Smart Presets
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const target = new Date();
    
    if (presetKey === 'tomorrow') {
      target.setDate(target.getDate() + 1);
      setSelectedDate(formatYMD(target));
      setViewDate(target);
      setSelectedHour('09');
      setSelectedMinute('00');
      setSelectedMeridiem('AM');
    } else if (presetKey === 'in_2_days') {
      target.setDate(target.getDate() + 2);
      setSelectedDate(formatYMD(target));
      setViewDate(target);
      setSelectedHour('10');
      setSelectedMinute('00');
      setSelectedMeridiem('AM');
    } else if (presetKey === 'next_week') {
      // Next Monday
      const day = target.getDay();
      const diff = day === 0 ? 1 : (8 - day);
      target.setDate(target.getDate() + diff);
      setSelectedDate(formatYMD(target));
      setViewDate(target);
      setSelectedHour('09');
      setSelectedMinute('00');
      setSelectedMeridiem('AM');
    }
  };

  const handleConfirm = () => {
    if (!selectedDate || isSuppressed) return;
    onConfirm(selectedDate, time24, formattedSchedule, selectedTimezone, scheduleNotes);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="bg-[#171717]/98 border border-white/[0.12] text-slate-100 rounded-3xl p-5 sm:p-6 shadow-[0_24px_70px_rgba(0,0,0,0.8)] w-full max-w-[440px] relative overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        
        {/* Subtle Ambient Reflections */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#a31c1b]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444] shadow-md shadow-[#a31c1b]/20 shrink-0">
              <CalendarCheck className="w-5 h-5 text-[#ef4444]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight leading-tight">
                Schedule Follow-up
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[240px] sm:max-w-[280px]">
                Queue automated follow-up for <span className="text-slate-200 font-semibold">{prospectName}</span>
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Smart Presets */}
        <div className="relative z-10 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => applyPreset('tomorrow')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                activePreset === 'tomorrow'
                  ? 'bg-[#10b981]/20 border-[#10b981]/40 text-emerald-400 shadow-sm shadow-[#10b981]/20 font-bold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Tomorrow 9 AM</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('in_2_days')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${
                activePreset === 'in_2_days'
                  ? 'bg-[#10b981]/20 border-[#10b981]/40 text-emerald-400 shadow-sm shadow-[#10b981]/20 font-bold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <span>In 2 Days</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('next_week')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer border ${
                activePreset === 'next_week'
                  ? 'bg-[#10b981]/20 border-[#10b981]/40 text-emerald-400 shadow-sm shadow-[#10b981]/20 font-bold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-slate-300 hover:text-white'
              }`}
            >
              <span>Next Monday</span>
            </button>
          </div>
        </div>

        {/* Custom Calendar Surface */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-3.5 relative z-10 shadow-inner">
          
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-white tracking-wide">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-0.5">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isCurrentDay = item.isToday;
              const isSelected = item.isSelected;
              const isDim = !item.isCurrentMonth;
              const isPast = item.isPast;

              return (
                <button
                  key={`${item.dateStr}-${idx}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDay(item.dateStr)}
                  className={`
                    h-8 rounded-xl text-xs font-medium transition-all flex items-center justify-center relative
                    ${isPast ? 'text-slate-600 cursor-not-allowed opacity-40' : 'cursor-pointer'}
                    ${isSelected 
                      ? 'bg-[#a31c1b] text-white font-bold shadow-md shadow-[#a31c1b]/40 scale-105 z-10' 
                      : isDim 
                        ? 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.03]' 
                        : 'text-slate-200 hover:text-white hover:bg-white/[0.08]'}
                  `}
                >
                  <span>{item.day}</span>
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#10b981]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selector Section */}
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ef4444]" />
              <span>Dispatch Time</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedHour}:{selectedMinute} {selectedMeridiem}
            </span>
          </div>

          {/* Quick Time Chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_PRESETS.map((t) => {
              const isTimeSelected = 
                selectedHour === t.hour && 
                selectedMinute === t.min && 
                selectedMeridiem === t.meridiem;

              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setSelectedHour(t.hour);
                    setSelectedMinute(t.min);
                    setSelectedMeridiem(t.meridiem as 'AM' | 'PM');
                    setActivePreset('custom');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all border text-center cursor-pointer ${
                    isTimeSelected
                      ? 'bg-[#a31c1b]/20 border-[#a31c1b]/50 text-white shadow-sm shadow-[#a31c1b]/25 font-bold'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="block leading-tight">{t.label}</span>
                  <span className="block text-[8px] text-slate-400 font-normal mt-0.5 leading-tight">{t.title}</span>
                </button>
              );
            })}
          </div>

          {/* Precision Hour, Minute & AM/PM Controls */}
          <div className="flex items-center gap-2 pt-1">
            
            {/* Hour Selector */}
            <div className="flex-1 flex items-center bg-[#111111] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono mr-2">Hour</span>
              <select
                value={selectedHour}
                onChange={(e) => {
                  setSelectedHour(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent text-white font-bold text-xs outline-none w-full cursor-pointer [color-scheme:dark]"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                  <option key={h} value={h} className="bg-[#171717] text-white">
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Separator */}
            <span className="text-slate-400 font-bold">:</span>

            {/* Minute Selector */}
            <div className="flex-1 flex items-center bg-[#111111] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono mr-2">Min</span>
              <select
                value={selectedMinute}
                onChange={(e) => {
                  setSelectedMinute(e.target.value);
                  setActivePreset('custom');
                }}
                className="bg-transparent text-white font-bold text-xs outline-none w-full cursor-pointer [color-scheme:dark]"
              >
                {['00', '15', '30', '45'].map((m) => (
                  <option key={m} value={m} className="bg-[#171717] text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* AM / PM Toggle Pill */}
            <div className="flex p-0.5 bg-[#111111] border border-white/[0.1] rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedMeridiem('AM');
                  setActivePreset('custom');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMeridiem === 'AM'
                    ? 'bg-[#a31c1b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMeridiem('PM');
                  setActivePreset('custom');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMeridiem === 'PM'
                    ? 'bg-[#a31c1b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PM
              </button>
            </div>

          </div>
        </div>

        {/* Live Follow-up Preview Banner & Timezone */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 relative z-10 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
              <span className="text-slate-400 truncate">Queue dispatch:</span>
              <span className="text-white font-semibold truncate">{formattedSchedule}</span>
            </div>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="bg-[#171717] border border-white/[0.1] text-slate-300 text-[10px] rounded-lg px-2 py-0.5 outline-none cursor-pointer max-w-[200px] truncate [&>option]:bg-[#171717] [&>option]:text-white"
            >
              {!TIMEZONES.some(tz => tz.value === selectedTimezone || tz.label === selectedTimezone) && (
                <option value={selectedTimezone} className="bg-[#171717] text-white">
                  {selectedTimezone}
                </option>
              )}
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-[#171717] text-white">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pt-1">
            <input
              type="text"
              placeholder="Internal scheduling notes (optional)..."
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              className="w-full bg-[#111111] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Suppression Alert Banner if Prospect Ineligible */}
        {isSuppressed && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5 relative z-10 animate-in fade-in">
            <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Scheduling Blocked (Compliance & Hygiene)</p>
              <p className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">
                {suppressReason || 'This prospect has replied, bounced, or is marked as unsubscribed. Under CAN-SPAM regulations, further follow-ups cannot be scheduled.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1 relative z-10">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.18] transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={isSuppressed}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 border-none ${isSuppressed ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' : 'btn-reachops-primary shadow-lg shadow-[#a31c1b]/30 hover:scale-[1.02] active:scale-95 cursor-pointer'}`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Schedule</span>
          </button>
        </div>

      </div>
    </div>
  );
}

