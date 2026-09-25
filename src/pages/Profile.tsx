import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  User, Mail, Phone, Lock, Camera, 
  ShieldCheck, Globe, Bell
} from 'lucide-react';
import { TIMEZONES } from '@/lib/timezones';

export default function Profile() {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [preferences, setPreferences] = useState({
    timezone: 'America/New_York',
    language: 'English',
    emailNotifications: true,
    campaignAlerts: true,
    twoFactor: false
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column (Avatar & Quick Info) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white flex items-center justify-center font-bold text-5xl mx-auto shadow-md ring-4 ring-white">
                  {personalInfo.firstName ? personalInfo.firstName.charAt(0) : 'U'}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-primary transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">{personalInfo.firstName} {personalInfo.lastName}</h2>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {personalInfo.email}
              </p>
              <div className="mt-6">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active Member
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center text-gray-700">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Password</span>
                <span className="text-green-600 font-medium">Strong</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-gray-600">2FA Enabled</span>
                <span className={preferences.twoFactor ? "text-green-600 font-medium" : "text-gray-400"}>
                  {preferences.twoFactor ? 'Yes' : 'No'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Forms) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your basic profile details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="firstName" 
                      className="pl-9" 
                      value={personalInfo.firstName}
                      onChange={e => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={personalInfo.lastName}
                    onChange={e => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    className="pl-9" 
                    value={personalInfo.email}
                    onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    className="pl-9" 
                    value={personalInfo.phone}
                    onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="current-password" 
                    type="password" 
                    className="pl-9"
                    value={passwords.current}
                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="secondary">Update Password</Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select 
                      id="timezone"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={preferences.timezone}
                      onChange={e => setPreferences({...preferences, timezone: e.target.value})}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select 
                    id="language"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={preferences.language}
                    onChange={e => setPreferences({...preferences, language: e.target.value})}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive daily digest of campaign performance.</p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications}
                    onCheckedChange={(c: boolean) => setPreferences({...preferences, emailNotifications: c})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center">
                      <Bell className="w-4 h-4 mr-2 text-gray-400" />
                      Campaign Alerts
                    </Label>
                    <p className="text-sm text-gray-500">Get notified when a campaign finishes or errors out.</p>
                  </div>
                  <Switch 
                    checked={preferences.campaignAlerts}
                    onCheckedChange={(c: boolean) => setPreferences({...preferences, campaignAlerts: c})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-gray-900 flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-gray-500">Require a code from an authenticator app when logging in.</p>
                  </div>
                  <Switch 
                    checked={preferences.twoFactor}
                    onCheckedChange={(c: boolean) => setPreferences({...preferences, twoFactor: c})}
                  />
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
