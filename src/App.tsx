import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import EmailAccounts from './pages/EmailAccounts';
import CampaignWizard from './pages/campaigns/CampaignWizard';
import SequenceBuilder from './pages/campaigns/SequenceBuilder';
import CampaignAnalytics from './pages/campaigns/CampaignAnalytics';
import ActivityLog from './pages/ActivityLog';
import CampaignList from './pages/campaigns/CampaignList';
import ProspectList from './pages/prospects/ProspectList';
import UnifiedInbox from './pages/inbox/UnifiedInbox';
import TemplateList from './pages/templates/TemplateList';
import TemplateEditor from './pages/templates/TemplateEditor';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CampaignDetailLayout from './layouts/CampaignDetailLayout';

import CampaignAccounts from './pages/campaigns/tabs/CampaignAccounts';
import CampaignTemplates from './pages/campaigns/tabs/CampaignTemplates';
import CampaignLeads from './pages/campaigns/tabs/CampaignLeads';
import CampaignSchedule from './pages/campaigns/tabs/CampaignSchedule';
import CampaignActivity from './pages/campaigns/tabs/CampaignActivity';
import CampaignSettings from './pages/campaigns/tabs/CampaignSettings';
import CampaignSubsequences from './pages/campaigns/tabs/CampaignSubsequences';

import SuppressionList from './pages/SuppressionList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<CampaignList />} />
          <Route path="/campaigns/new" element={<CampaignWizard />} />
          
          {/* Instantly.ai Styled Campaign Workspace */}
          <Route path="/campaigns/:id" element={<CampaignDetailLayout />}>
            <Route index element={<Navigate to="analytics" replace />} />
            <Route path="analytics" element={<CampaignAnalytics />} />
            <Route path="editor" element={<SequenceBuilder />} />
            <Route path="sequence" element={<Navigate to="../editor" replace />} />
            <Route path="leads" element={<CampaignLeads />} />
            <Route path="subsequences" element={<CampaignSubsequences />} />
            <Route path="settings" element={<CampaignSettings />} />
            {/* Backward compatibility aliases */}
            <Route path="overview" element={<Navigate to="../analytics" replace />} />
            <Route path="templates" element={<CampaignTemplates />} />
            <Route path="accounts" element={<CampaignAccounts />} />
            <Route path="schedule" element={<CampaignSchedule />} />
            <Route path="inbox" element={<UnifiedInbox />} />
            <Route path="activity" element={<CampaignActivity />} />
          </Route>

          <Route path="/prospects" element={<ProspectList />} />
          <Route path="/email-accounts" element={<EmailAccounts />} />
          <Route path="/suppression" element={<SuppressionList />} />
          <Route path="/activity" element={<ActivityLog />} />
          
          <Route path="/inbox" element={<UnifiedInbox />} />
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/:id" element={<TemplateEditor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          {/* Catch-all */}
          <Route path="*" element={<div className="p-4 flex flex-col items-center justify-center h-full text-gray-500"><h2 className="text-2xl font-bold mb-2">Coming Soon</h2><p>This page is part of the planned roadmap.</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
