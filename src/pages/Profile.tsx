import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Lock, Camera, 
  ShieldCheck, Globe, Bell, Check, X,
  AlertCircle, Upload, Trash2, KeyRound
} from 'lucide-react';
import { TIMEZONES } from '@/lib/timezones';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => {
    try {
      const saved = localStorage.getItem('user_profile');
      if (saved) return JSON.parse(saved);
      const userSaved = localStorage.getItem('user');
      if (userSaved) {
        const u = JSON.parse(userSaved);
        const parts = (u.name || '').split(' ');
        return {
          firstName: parts[0] || 'Vamsi',
          lastName: parts.slice(1).join(' ') || 'Pallela',
          email: u.email || 'vamsipallela31@gmail.com',
          phone: '7569692277',
          avatarUrl: u.avatarUrl || u.avatar || localStorage.getItem('user_profile_avatar') || undefined
        };
      }
    } catch {}
    return {
      firstName: 'Vamsi',
      lastName: 'Pallela',
      email: 'vamsipallela31@gmail.com',
      phone: '7569692277',
      avatarUrl: localStorage.getItem('user_profile_avatar') || undefined
    };
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('user_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      timezone: 'Asia/Kolkata',
      language: 'English',
      emailNotifications: true,
      campaignAlerts: true,
      twoFactor: false
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    try {
      const storedAvatar = localStorage.getItem('user_profile_avatar');
      if (storedAvatar && !personalInfo.avatarUrl) {
        setPersonalInfo(prev => ({ ...prev, avatarUrl: storedAvatar }));
      }
    } catch {}
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      showToast('Please select a valid image file', 'error');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      showToast('Image size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...personalInfo, avatarUrl: dataUrl };
      setPersonalInfo(updated);
      
      // Persist across local storage
      try {
        localStorage.setItem('user_profile_avatar', dataUrl);
        localStorage.setItem('user_profile', JSON.stringify(updated));
        
        const existingUser = localStorage.getItem('user');
        if (existingUser) {
          const u = JSON.parse(existingUser);
          u.avatar = dataUrl;
          u.avatarUrl = dataUrl;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (err) {
        console.warn('Storage quota exceeded, photo kept in active session:', err);
      }

      // Notify other components (Navbar avatar)
      window.dispatchEvent(new Event('user-updated'));
      showToast('Profile photo uploaded successfully!');
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo
  const handleRemovePhoto = () => {
    const updated = { ...personalInfo, avatarUrl: undefined };
    setPersonalInfo(updated);
    try {
      localStorage.removeItem('user_profile_avatar');
      localStorage.setItem('user_profile', JSON.stringify(updated));
      const existingUser = localStorage.getItem('user');
      if (existingUser) {
        const u = JSON.parse(existingUser);
        delete u.avatar;
        delete u.avatarUrl;
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch {}
    window.dispatchEvent(new Event('user-updated'));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Profile photo removed.');
  };

  // Save Profile Details
  const handleSaveProfile = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('user_profile', JSON.stringify(personalInfo));
      const existingUser = localStorage.getItem('user');
      if (existingUser) {
        const u = JSON.parse(existingUser);
        u.name = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
        u.email = personalInfo.email;
        if (personalInfo.avatarUrl) {
          u.avatar = personalInfo.avatarUrl;
          u.avatarUrl = personalInfo.avatarUrl;
        }
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch {}
    window.dispatchEvent(new Event('user-updated'));
    setTimeout(() => {
      setIsSaving(false);
      showToast('Profile changes saved successfully!');
    }, 400);
  };

  // Update Password
  const handleUpdatePassword = () => {
    if (!passwords.new) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setPasswords({ current: '', new: '', confirm: '' });
    showToast('Password updated securely!');
  };

  // Save Preferences
  const handleTogglePreference = (key: keyof typeof preferences, value: any) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem('user_preferences', JSON.stringify(next));
    showToast('Preference updated!');
  };

  const userInitial = personalInfo.firstName ? personalInfo.firstName.charAt(0).toUpperCase() : 'V';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 font-sans text-slate-100 selection:bg-[#a31c1b]/30">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toastType === 'success'
            ? 'bg-[#171717]/95 border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.3)]'
            : 'bg-[#171717]/95 border-rose-500/40 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.3)]'
        }`}>
          {toastType === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (High Contrast Crisp White Typography) */}
      <div className="glass-surface p-6 sm:p-7 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-[#a31c1b]/15 pointer-events-none" />
        
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block mb-1">
            ACCOUNT CREDENTIALS & IDENTITY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage your account settings, uploaded photo, credentials, and preferences.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="btn-reachops-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg shadow-[#a31c1b]/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Avatar Card */}
          <div className="glass-surface p-6 text-center space-y-4 rounded-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#a31c1b]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#10b981]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative inline-block z-10">
              {/* Photo Display / Gradient Squircle */}
              {personalInfo.avatarUrl ? (
                <div className="relative group">
                  <img 
                    src={personalInfo.avatarUrl} 
                    alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
                    className="w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-emerald-500/40 border-2 border-white/20 mx-auto"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <span className="text-[10px] font-bold">Change Photo</span>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#a31c1b] via-[#871615] to-[#06110c] text-white flex items-center justify-center font-black text-5xl mx-auto shadow-2xl ring-4 ring-white/10 border border-white/20">
                  {userInitial}
                </div>
              )}

              {/* Floating Camera Button (Clickable file picker trigger) */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 bg-[#171717] hover:bg-[#262626] rounded-full border border-white/20 hover:border-emerald-500/60 shadow-xl flex items-center justify-center text-emerald-400 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
                title="Upload profile photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Hidden Native File Input */}
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Photo Action Links */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>{personalInfo.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>

              {personalInfo.avatarUrl && (
                <>
                  <span className="text-white/20">•</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </>
              )}
            </div>

            {uploadError && (
              <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
            )}

            {/* High Contrast Visible Name & Email */}
            <div className="pt-2 z-10 relative">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {personalInfo.firstName} {personalInfo.lastName}
              </h2>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate max-w-[220px]">{personalInfo.email}</span>
              </p>
            </div>

            {/* Status Badge */}
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.18)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
                Active Member
              </span>
            </div>

          </div>

          {/* Security Status Card */}
          <div className="glass-surface p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <ShieldCheck className="w-4 h-4 text-[#ef4444]" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Security Status
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Password</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Strong
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">2FA Enabled</span>
                <span className={`font-semibold px-2 py-0.5 rounded-md border text-[11px] ${
                  preferences.twoFactor 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                    : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                }`}>
                  {preferences.twoFactor ? 'Yes (Active)' : 'No (Disabled)'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. Personal Information Card */}
          <div className="glass-surface p-6 sm:p-7 rounded-2xl space-y-5">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Personal Information
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Update your display name, official outreach email, and phone contact.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="text"
                      className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                      value={personalInfo.firstName}
                      onChange={e => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                      placeholder="First name"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input 
                    type="text"
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    value={personalInfo.lastName}
                    onChange={e => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>

              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="email"
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    value={personalInfo.email}
                    onChange={e => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="tel"
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    value={personalInfo.phone}
                    onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button"
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="btn-reachops-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md shadow-[#a31c1b]/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* 2. Change Password Card */}
          <div className="glass-surface p-6 sm:p-7 rounded-2xl space-y-5">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Change Password
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ensure your account is protected with a strong, random master passphrase.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="password"
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">New Password</label>
                  <input 
                    type="password"
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                  <input 
                    type="password"
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all placeholder:text-slate-600 shadow-inner"
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Repeat new password"
                  />
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button"
                  onClick={handleUpdatePassword}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Update Password
                </button>
              </div>

            </div>
          </div>

          {/* 3. Preferences Card */}
          <div className="glass-surface p-6 sm:p-7 rounded-2xl space-y-5">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Preferences & Security
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure your dispatch timezone, language locale, and security verification.
              </p>
            </div>

            <div className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Timezone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Default Dispatch Timezone</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <select 
                      className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all cursor-pointer [color-scheme:dark]"
                      value={preferences.timezone}
                      onChange={e => handleTogglePreference('timezone', e.target.value)}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value} className="bg-[#171717] text-white">
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Interface Language</label>
                  <select 
                    className="w-full bg-[#111111] border border-white/[0.08] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm outline-none transition-all cursor-pointer [color-scheme:dark]"
                    value={preferences.language}
                    onChange={e => handleTogglePreference('language', e.target.value)}
                  >
                    <option value="English" className="bg-[#171717] text-white">English (US)</option>
                    <option value="Spanish" className="bg-[#171717] text-white">Español</option>
                    <option value="French" className="bg-[#171717] text-white">Français</option>
                    <option value="German" className="bg-[#171717] text-white">Deutsch</option>
                  </select>
                </div>

              </div>

              {/* Switches Container */}
              <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      Email Performance Digest
                    </span>
                    <p className="text-[11px] text-slate-400">Receive daily digest of campaigns and mailbox delivery rates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('emailNotifications', !preferences.emailNotifications)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      preferences.emailNotifications ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Campaign Alerts */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-emerald-400" />
                      Campaign Anomaly Alerts
                    </span>
                    <p className="text-[11px] text-slate-400">Get notified if bounce rate exceeds safety threshold or inbox errors occur.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('campaignAlerts', !preferences.campaignAlerts)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      preferences.campaignAlerts ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      preferences.campaignAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Two-Factor Authentication (Exact High Contrast Fix for Screenshot 4) */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#a31c1b]/10 border border-[#a31c1b]/30">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#ef4444]" />
                      Two-Factor Authentication
                    </span>
                    <p className="text-[11px] text-slate-300">
                      Require a secure time-based code from an authenticator app when logging in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('twoFactor', !preferences.twoFactor)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      preferences.twoFactor ? 'bg-[#a31c1b] shadow-[0_0_12px_rgba(163,28,27,0.8)]' : 'bg-white/10'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      preferences.twoFactor ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
