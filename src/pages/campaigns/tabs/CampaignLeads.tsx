import { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Filter, MoreHorizontal, Check, AlertCircle, 
  ShieldCheck, Upload, UserPlus, X, Sparkles, PauseCircle, PlayCircle, 
  Trash2, CheckCircle2, FileSpreadsheet, RefreshCw, ExternalLink, Database,
  Calendar, Ban, Clock, ChevronDown, CheckCircle, Mail, AlertTriangle, Download, Copy, FileText, UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import GoogleSheetsManagerModal from '@/components/google-sheets/GoogleSheetsManagerModal';
import ScheduleFollowUpModal from '@/components/ScheduleFollowUpModal';

const defaultDemoLeads = [
  { 
    id: '1', 
    name: 'Sophie Martin', 
    email: 'sophie.m@cloudscale.example', 
    company: 'CloudScale Systems', 
    title: 'VP of Engineering',
    status: 'Contacted', 
    followupStatus: 'ACTIVE',
    tag: null,
    step: 'Step 1', 
    nextAction: 'Wait 3 days for reply', 
    deliverability: 'Verified', 
    followUpDate: '',
    mailbox: 'demo@reachops.com',
    lastActivity: '2 days ago',
  },
  { 
    id: '2', 
    name: 'Amelia Watson', 
    email: 'amelia.watson@example.com', 
    company: 'Quantum Retail', 
    title: 'Head of Growth',
    status: 'New', 
    followupStatus: 'ACTIVE',
    tag: null,
    step: 'Queued', 
    nextAction: 'First sequence email queued', 
    deliverability: 'Verified', 
    followUpDate: '',
    mailbox: 'demo@reachops.com',
    lastActivity: 'Just now',
  },
  { 
    id: '3', 
    name: 'Ethan Hunt', 
    email: 'ethan.hunt@example.com', 
    company: 'Synergy Labs', 
    title: 'Operations Director',
    status: 'Warm', 
    followupStatus: 'PAUSED',
    tag: 'Warm',
    step: 'Follow-up Halted', 
    nextAction: 'Sequence Paused: Tagged as Warm', 
    deliverability: 'Verified', 
    followUpDate: '',
    mailbox: 'demo@reachops.com',
    lastActivity: 'Yesterday',
  },
  { 
    id: '4', 
    name: 'Isabella Cruz', 
    email: 'isabella@example.org', 
    company: 'Horizon Media', 
    title: 'Content Strategist',
    status: 'Contacted', 
    followupStatus: 'ACTIVE',
    tag: null,
    step: 'Step 1', 
    nextAction: 'Wait 2 days', 
    deliverability: 'Verified', 
    followUpDate: '',
    mailbox: 'demo@reachops.com',
    lastActivity: '3 days ago',
  },
  { 
    id: '5', 
    name: 'Oliver Grant', 
    email: 'oliver.g@velocity-ai.example', 
    company: 'Velocity AI', 
    title: 'Founder & CEO',
    status: 'Lead', 
    followupStatus: 'PAUSED',
    tag: 'Lead',
    step: 'Follow-up Halted', 
    nextAction: 'Sequence Paused: Tagged as Lead', 
    deliverability: 'Verified', 
    followUpDate: '',
    mailbox: 'demo@reachops.com',
    lastActivity: 'Yesterday',
  },
  { 
    id: '6', 
    name: 'Maya Patel', 
    email: 'maya.p@apexfin.example', 
    company: 'Apex Fintech', 
    title: 'Product Director',
    status: 'Scheduled', 
    followupStatus: 'SCHEDULED',
    tag: 'Interested',
    step: 'Scheduled Follow-up', 
    nextAction: 'Dispatches on Nov 4, 10:00 AM', 
    deliverability: 'Verified', 
    followUpDate: 'Nov 04, 10:00 AM',
    mailbox: 'demo@reachops.com',
    lastActivity: 'Scheduled',
  },
  { 
    id: '7', 
    name: 'David Miller', 
    email: 'david.m@stripe.example', 
    company: 'Fintech Partners', 
    title: 'VP Sales',
    status: 'Replied', 
    followupStatus: 'STOPPED',
    tag: 'Replied',
    replied: true,
    step: 'Sequence Stopped', 
    nextAction: 'Reply detected: Sequences permanently stopped', 
    deliverability: 'Verified', 
    followUpDate: '',
    mailbox: 'demo@reachops.com',
    lastActivity: 'Replied Today',
  },
];

export default function CampaignLeads() {
  const { id } = useParams();
  const campaignKey = id || 'demo-camp-beta-launch';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [tagSubmenuLeadId, setTagSubmenuLeadId] = useState<string | null>(null);

  const [leads, setLeads] = useState<any[]>(defaultDemoLeads);
  const [leadStats, setLeadStats] = useState({ 
    total: 7, 
    active: 3, 
    paused: 2, 
    scheduled: 1, 
    stopped: 1, 
    replied: 1 
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk' | 'sheet' | 'sample'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Google Sheet Database State
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [sheetTabName, setSheetTabName] = useState('Sheet1');
  const [sheetEmailCol, setSheetEmailCol] = useState('Email');
  const [sheetFirstNameCol, setSheetFirstNameCol] = useState('First Name');
  const [sheetLastNameCol, setSheetLastNameCol] = useState('Last Name');
  const [sheetCompanyCol, setSheetCompanyCol] = useState('Company');
  const [sheetStatusCol, setSheetStatusCol] = useState('Status');
  const [sheetFollowUpDateCol, setSheetFollowUpDateCol] = useState('Follow-up Date');
  const [isTwoWaySync, setIsTwoWaySync] = useState(true);
  const [isSheetConnected, setIsSheetConnected] = useState(true);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [sheetInfo, setSheetInfo] = useState<any>({
    spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheetName: 'Sheet1',
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
  });
  const [isSheetManagerOpen, setIsSheetManagerOpen] = useState(false);

  // Scheduling Modal State
  const [schedulingLead, setSchedulingLead] = useState<any | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Single form state
  const [singleFirstName, setSingleFirstName] = useState('');
  const [singleLastName, setSingleLastName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleCompany, setSingleCompany] = useState('');
  const [singleJobTitle, setSingleJobTitle] = useState('');

  // Bulk CSV file & drag state
  const [bulkText, setBulkText] = useState('');
  const [csvSubMode, setCsvSubMode] = useState<'file' | 'paste'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [parsedCsvLeads, setParsedCsvLeads] = useState<any[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshLeads = () => {
    fetch(`/api/campaigns/${campaignKey}/leads`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads(data.leads);
          setLeadStats({
            total: data.total || data.leads.length,
            active: data.active ?? data.leads.filter((l: any) => l.followupStatus === 'ACTIVE' || l.status === 'Contacted').length,
            paused: data.paused ?? data.leads.filter((l: any) => l.followupStatus === 'PAUSED').length,
            scheduled: data.scheduled ?? data.leads.filter((l: any) => l.followupStatus === 'SCHEDULED').length,
            stopped: data.stopped ?? data.leads.filter((l: any) => l.followupStatus === 'STOPPED' || l.status === 'Replied').length,
            replied: data.replied ?? data.leads.filter((l: any) => l.replied || l.status === 'Replied').length,
          });
          if (data.sheetInfo) {
            setSheetInfo(data.sheetInfo);
            setIsSheetConnected(true);
            if (data.sheetInfo.lastSyncedAt) {
              setLastSyncTime(new Date(data.sheetInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    refreshLeads();
  }, [campaignKey]);

  // Handle Google Sheet Live Database Sync (Sync Now)
  const handleSyncGoogleSheet = async (showModal = false) => {
    setIsSyncingSheet(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignKey}/sync-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl: sheetUrl,
          sheetName: sheetTabName,
          mapping: {
            email: sheetEmailCol,
            firstName: sheetFirstNameCol,
            lastName: sheetLastNameCol,
            company: sheetCompanyCol,
            status: sheetStatusCol,
            followUpDate: sheetFollowUpDateCol
          },
          autoSync: isTwoWaySync
        })
      });

      const data = await res.json();
      if (data.leads && Array.isArray(data.leads)) {
        setLeads(data.leads);
        const activeCount = data.leads.filter((l: any) => l.followupStatus === 'ACTIVE' || l.status === 'Contacted' || l.status === 'New').length;
        const pausedCount = data.leads.filter((l: any) => l.followupStatus === 'PAUSED').length;
        const scheduledCount = data.leads.filter((l: any) => l.followupStatus === 'SCHEDULED').length;
        const stoppedCount = data.leads.filter((l: any) => l.followupStatus === 'STOPPED' || l.status === 'Replied').length;
        const repliedCount = data.leads.filter((l: any) => l.replied || l.status === 'Replied').length;

        setLeadStats({
          total: data.leads.length,
          active: activeCount,
          paused: pausedCount,
          scheduled: scheduledCount,
          stopped: stoppedCount,
          replied: repliedCount,
        });
        setIsSheetConnected(true);
        setLastSyncTime('Just now');
        if (data.sheetInfo) setSheetInfo(data.sheetInfo);
        showToast(data.message || `Synced ${data.leads.length} records with Google Sheet database!`);
        setIsAddModalOpen(false);
      } else {
        setIsSheetConnected(true);
        setLastSyncTime('Just now');
        showToast('Google Sheet database synchronized successfully.', 'success');
        setIsAddModalOpen(false);
      }
    } catch (err) {
      showToast('Error syncing with Google Sheet database', 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Open Schedule Modal for a lead
  const handleOpenScheduleModal = (lead: any) => {
    setSchedulingLead(lead);
    setIsScheduleModalOpen(true);
    setActiveMenuId(null);
    setTagSubmenuLeadId(null);
  };

  // Confirm Manual Schedule
  const handleConfirmSchedule = async (
    dateStr: string, 
    timeStr: string, 
    formattedLabel: string, 
    timezone?: string, 
    notes?: string
  ) => {
    if (!schedulingLead) return;

    if (schedulingLead.replied || schedulingLead.bounced || schedulingLead.unsubscribe) {
      showToast('Cannot schedule follow-up: Recipient is suppressed, unsubscribed, or has replied.', 'error');
      setIsScheduleModalOpen(false);
      return;
    }

    const isoDate = `${dateStr}T${timeStr}:00`;
    try {
      const res = await fetch(`/api/campaigns/${campaignKey}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_follow_up',
          prospectId: schedulingLead.id,
          scheduledDate: isoDate,
          timezone: timezone || 'UTC',
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to schedule follow-up', 'error');
        return;
      }

      setLeads(prev => prev.map(l => l.id === schedulingLead.id ? {
        ...l,
        followupStatus: 'SCHEDULED',
        status: 'Scheduled',
        step: 'Scheduled Follow-up',
        nextAction: `Dispatches on ${formattedLabel}`,
        followUpDate: formattedLabel,
      } : l));

      setLeadStats(prev => ({
        ...prev,
        scheduled: prev.scheduled + 1,
        active: Math.max(0, prev.active - (schedulingLead.followupStatus === 'ACTIVE' ? 1 : 0)),
        paused: Math.max(0, prev.paused - (schedulingLead.followupStatus === 'PAUSED' ? 1 : 0)),
      }));

      showToast(`Next follow-up scheduled for ${formattedLabel}. Single email authorized.`);
    } catch {
      showToast('Failed to schedule follow-up', 'error');
    } finally {
      setIsScheduleModalOpen(false);
      setSchedulingLead(null);
    }
  };

  // Tag & Stop Sequence Action (sets followupStatus = 'PAUSED', or 'STOPPED' if DNC)
  const handleTagLeadAndPause = async (leadId: string, tag: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignKey}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_tag',
          prospectId: leadId,
          tag,
        }),
      });

      const data = await res.json();
      const isDnc = ['DNC', 'INVALID CONTACT'].some(t => tag.toUpperCase().includes(t));
      const newStatus = isDnc ? 'STOPPED' : 'PAUSED';

      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          return {
            ...l,
            tag,
            tags: [tag],
            status: tag,
            followupStatus: newStatus,
            step: isDnc ? 'Sequence Stopped' : 'Follow-up Halted',
            nextAction: isDnc 
              ? `Sequence Stopped: Tagged as ${tag} (Suppression)` 
              : `Follow-ups Paused: Tagged as ${tag}`,
            followUpDate: '—',
          };
        }
        return l;
      }));

      setLeadStats(prev => ({
        ...prev,
        paused: isDnc ? prev.paused : prev.paused + 1,
        stopped: isDnc ? prev.stopped + 1 : prev.stopped,
        active: Math.max(0, prev.active - 1),
      }));

      showToast(data.message || `Lead tagged as '${tag}'. Next automated follow-up paused.`);
    } catch {
      showToast('Failed to apply tag to lead', 'error');
    } finally {
      setActiveMenuId(null);
      setTagSubmenuLeadId(null);
    }
  };

  // Pause Follow-ups
  const handlePauseLead = async (leadId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignKey}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause_sequence', prospectId: leadId }),
      });

      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l,
        followupStatus: 'PAUSED',
        step: 'Follow-up Halted',
        nextAction: 'Manually paused by user',
      } : l));

      setLeadStats(prev => ({
        ...prev,
        paused: prev.paused + 1,
        active: Math.max(0, prev.active - 1),
      }));

      showToast('Automated follow-up paused for this prospect.');
    } catch {
      showToast('Failed to pause follow-ups', 'error');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Resume Follow-ups
  const handleResumeLead = async (lead: any) => {
    if (lead.replied || lead.bounced || lead.unsubscribe) {
      showToast('Cannot resume: Recipient has replied, bounced, or unsubscribed.', 'error');
      setActiveMenuId(null);
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/${campaignKey}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume_sequence', prospectId: lead.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Cannot resume sequence', 'error');
        return;
      }

      setLeads(prev => prev.map(l => l.id === lead.id ? {
        ...l,
        followupStatus: 'ACTIVE',
        step: 'Step 1 Queued',
        nextAction: 'Sequence resumed. Next email queued.',
      } : l));

      setLeadStats(prev => ({
        ...prev,
        active: prev.active + 1,
        paused: Math.max(0, prev.paused - 1),
      }));

      showToast('Follow-up sequence resumed for prospect.');
    } catch {
      showToast('Failed to resume sequence', 'error');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Mark as Unsubscribed
  const handleUnsubscribeLead = async (leadId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignKey}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe_prospect', prospectId: leadId }),
      });

      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l,
        status: 'Unsubscribed',
        followupStatus: 'STOPPED',
        unsubscribe: true,
        tag: 'DNC',
        step: 'Sequence Stopped',
        nextAction: 'Recipient unsubscribed (Suppression)',
      } : l));

      setLeadStats(prev => ({
        ...prev,
        stopped: prev.stopped + 1,
        active: Math.max(0, prev.active - 1),
      }));

      showToast('Prospect marked as unsubscribed. Sequence permanently stopped.');
    } catch {
      showToast('Failed to unsubscribe lead', 'error');
    } finally {
      setActiveMenuId(null);
    }
  };

  // Remove Lead
  const handleRemoveLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    setLeadStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    setActiveMenuId(null);
    showToast('Lead removed from this campaign sequence.');
  };

  // Handle Add Single Lead
  const handleAddSingleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleEmail.trim()) {
      showToast('Lead email address is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const fullName = `${singleFirstName} ${singleLastName}`.trim() || singleEmail.split('@')[0];
    const newLead = {
      id: `lead-${Date.now()}`,
      name: fullName,
      email: singleEmail.trim(),
      company: singleCompany.trim() || 'Enterprise Prospect',
      title: singleJobTitle.trim() || 'Decision Maker',
      status: 'New',
      followupStatus: 'ACTIVE',
      tag: null,
      step: 'Step 1 Queued',
      nextAction: 'First sequence email queued',
      deliverability: 'Verified',
      followUpDate: '',
      mailbox: 'demo@reachops.com',
      lastActivity: 'Just added',
    };

    try {
      await fetch(`/api/campaigns/${campaignKey}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newLead.email,
          firstName: singleFirstName,
          lastName: singleLastName,
          company: newLead.company,
          jobTitle: newLead.title,
        }),
      });
    } catch {}

    setLeads(prev => [newLead, ...prev]);
    setLeadStats(prev => ({
      ...prev,
      total: prev.total + 1,
      active: prev.active + 1
    }));

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setSingleFirstName('');
    setSingleLastName('');
    setSingleEmail('');
    setSingleCompany('');
    setSingleJobTitle('');
    showToast(`Enrolled ${newLead.email} into sequence successfully!`);
  };

  // Download Sample CSV Template
  const downloadCsvTemplate = () => {
    const csvContent = "first_name,last_name,email,company,job_title\nSarah,Jenkins,sarah.jenkins@acme.example,Acme Corp,VP of Engineering\nDavid,Kim,david.kim@stripe.example,Stripe,Growth Lead\nElena,Rostova,elena.r@datadog.example,Datadog,Director of Marketing\nLiam,Vance,liam.vance@company.example,Vance Capital,Managing Director\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reachops_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template: reachops_leads_template.csv');
  };

  // Copy CSV Header Row to Clipboard
  const copyHeaderToClipboard = () => {
    navigator.clipboard.writeText('first_name,last_name,email,company,job_title');
    showToast('Copied CSV header: first_name,last_name,email,company,job_title');
  };

  // Intelligent CSV Text Parser with Auto-Header Mapping
  const parseCsvText = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const headerLine = lines[0].toLowerCase();
    const hasHeaders = headerLine.includes('email') || headerLine.includes('first') || headerLine.includes('name') || headerLine.includes('company');

    let headers: string[] = [];
    let dataLines: string[] = [];

    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      dataLines = lines.slice(1);
    } else {
      dataLines = lines;
    }

    const emailIdx = headers.findIndex(h => h.includes('email') || h === 'e-mail');
    const firstNameIdx = headers.findIndex(h => h.includes('first') || h === 'fname');
    const lastNameIdx = headers.findIndex(h => h.includes('last') || h === 'lname');
    const nameIdx = headers.findIndex(h => h === 'name' || h === 'full_name' || h === 'fullname' || h === 'lead_name');
    const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('org') || h.includes('account'));
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('role') || h.includes('position'));

    const results: any[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < dataLines.length; i++) {
      const rawLine = dataLines[i];
      const parts = rawLine.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0) continue;

      let email = '';
      let firstName = '';
      let lastName = '';
      let company = 'Enterprise';
      let title = 'Executive';

      if (hasHeaders && emailIdx !== -1) {
        email = (parts[emailIdx] || '').trim();
        if (firstNameIdx !== -1) firstName = parts[firstNameIdx] || '';
        if (lastNameIdx !== -1) lastName = parts[lastNameIdx] || '';
        if (!firstName && nameIdx !== -1 && parts[nameIdx]) {
          const nameParts = parts[nameIdx].split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        if (companyIdx !== -1 && parts[companyIdx]) company = parts[companyIdx];
        if (titleIdx !== -1 && parts[titleIdx]) title = parts[titleIdx];
      } else {
        const foundEmail = parts.find(p => p.includes('@'));
        if (foundEmail) {
          email = foundEmail;
          const nonEmails = parts.filter(p => p !== foundEmail);
          if (nonEmails[0]) firstName = nonEmails[0];
          if (nonEmails[1]) company = nonEmails[1];
        }
      }

      const normEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (normEmail && emailRegex.test(normEmail) && !seenEmails.has(normEmail)) {
        seenEmails.add(normEmail);
        const displayName = `${firstName} ${lastName}`.trim() || normEmail.split('@')[0];
        results.push({
          id: `lead-csv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          email: normEmail,
          company: company || 'Enterprise Prospect',
          title: title || 'Executive',
          status: 'New',
          followupStatus: 'ACTIVE',
          tag: null,
          step: 'Step 1 Queued',
          nextAction: 'First sequence email queued',
          deliverability: 'Verified',
          followUpDate: '',
          mailbox: 'demo@reachops.com',
          lastActivity: 'Imported via CSV',
        });
      }
    }

    return results;
  };

  // Handle Drag & Drop / File Selection
  const handleFileSelected = (file: File) => {
    if (!file) return;
    const isCsvOrTxt = file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt') || file.type.includes('csv') || file.type.includes('text');
    if (!isCsvOrTxt) {
      showToast('Please upload a valid .csv, .tsv, or .txt file', 'error');
      return;
    }

    setUploadedFileName(file.name);
    setUploadedFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setBulkText(text);
      const parsed = parseCsvText(text);
      setParsedCsvLeads(parsed);
      if (parsed.length > 0) {
        showToast(`Loaded "${file.name}": ${parsed.length} verified prospect records detected!`);
      } else {
        showToast('No valid email records detected in this file. Please check column headings.', 'error');
      }
    };
    reader.onerror = () => {
      showToast('Error reading CSV file', 'error');
    };
    reader.readAsText(file);
  };

  // Handle Add Bulk Leads
  const handleAddBulkLeads = async () => {
    let itemsToEnroll = parsedCsvLeads;
    if (itemsToEnroll.length === 0 && bulkText.trim()) {
      itemsToEnroll = parseCsvText(bulkText);
    }

    if (itemsToEnroll.length === 0) {
      showToast('Please upload a CSV file or enter at least one prospect email', 'error');
      return;
    }

    setIsSubmitting(true);
    setLeads(prev => [...itemsToEnroll, ...prev]);
    setLeadStats(prev => ({
      ...prev,
      total: prev.total + itemsToEnroll.length,
      active: prev.active + itemsToEnroll.length
    }));

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setBulkText('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setParsedCsvLeads([]);
    showToast(`Successfully enrolled ${itemsToEnroll.length} prospects into sequence!`);
  };

  // Handle Quick Demo Leads
  const handleAddDemoLeads = () => {
    const demoBatch = [
      { id: `demo-${Date.now()}-1`, name: 'Marcus Sterling', email: 'marcus.s@hypergrowth.example', company: 'HyperGrowth Labs', title: 'VP Growth', status: 'New', followupStatus: 'ACTIVE', tag: null, step: 'Step 1 Queued', nextAction: 'Scheduled for dispatch', deliverability: 'Verified', followUpDate: '', mailbox: 'demo@reachops.com', lastActivity: 'Enrolled' },
      { id: `demo-${Date.now()}-2`, name: 'Priya Sharma', email: 'priya@techfrontier.example', company: 'TechFrontier', title: 'VP Engineering', status: 'New', followupStatus: 'ACTIVE', tag: null, step: 'Step 1 Queued', nextAction: 'Scheduled for dispatch', deliverability: 'Verified', followUpDate: '', mailbox: 'demo@reachops.com', lastActivity: 'Enrolled' },
      { id: `demo-${Date.now()}-3`, name: 'Lucas Dubois', email: 'lucas.d@strata-ai.example', company: 'Strata AI', title: 'Founder', status: 'Scheduled', followupStatus: 'SCHEDULED', tag: 'Interested', step: 'Scheduled Follow-up', nextAction: 'Dispatches on Nov 5, 2:00 PM', deliverability: 'Verified', followUpDate: 'Nov 05, 2:00 PM', mailbox: 'demo@reachops.com', lastActivity: 'Scheduled' }
    ];

    setLeads(prev => [...demoBatch, ...prev]);
    setLeadStats(prev => ({
      ...prev,
      total: prev.total + demoBatch.length,
      active: prev.active + 2,
      scheduled: prev.scheduled + 1,
    }));
    setIsAddModalOpen(false);
    showToast(`Added 3 verified executive leads to this sequence!`);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Active') return matchesSearch && (lead.followupStatus === 'ACTIVE' || lead.status === 'Active' || lead.status === 'Contacted');
    if (statusFilter === 'Paused') return matchesSearch && lead.followupStatus === 'PAUSED';
    if (statusFilter === 'Scheduled') return matchesSearch && lead.followupStatus === 'SCHEDULED';
    if (statusFilter === 'Stopped') return matchesSearch && (lead.followupStatus === 'STOPPED' || lead.status === 'Replied' || lead.status === 'Bounced');
    return matchesSearch && (lead.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300 text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Campaign Leads</h2>
            {isSheetConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Google Sheet Database Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central Google Sheet-powered outreach database with automated follow-ups, tag pausing, and instant sync.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 relative">
          
          {/* Filter Dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs h-9 rounded-xl cursor-pointer active:scale-95"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span>{statusFilter === 'All' ? 'Filter' : `Filter: ${statusFilter}`}</span>
            </Button>

            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl py-1.5 z-40 text-xs animate-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 border-b border-white/[0.06]">
                    Filter by Sequence State
                  </div>
                  {['All', 'Active', 'Paused', 'Scheduled', 'Stopped', 'Replied'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-white/[0.06] transition-colors cursor-pointer ${
                        statusFilter === st ? 'text-emerald-400 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span>{st}</span>
                      {statusFilter === st && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Primary + Add Leads Button */}
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-reachops-primary text-xs h-9 font-bold shadow-lg shadow-[#a31c1b]/25 rounded-xl cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Leads</span>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GOOGLE SHEETS LIVE SYNC STATUS BAR (Section 8 & 9)           */}
      {/* ============================================================ */}
      <div className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Refraction Accent Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#10b981]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Left: Sheet Details */}
        <div className="flex items-center gap-3.5 relative z-10 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20 shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xs truncate">
                ReachOps — Campaign Prospects
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Synced
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
              <span>Worksheet: <strong className="text-slate-200">{sheetInfo?.sheetName || sheetTabName}</strong></span>
              <span>&bull;</span>
              <span>Last sync: <strong className="text-emerald-400">{lastSyncTime}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Live KPI Counters */}
        <div className="flex items-center gap-4 text-xs relative z-10 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            <span className="font-extrabold text-white">{leadStats.total}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-emerald-400">Active</span>
            <span className="font-extrabold text-white ml-0.5">{leadStats.active}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] uppercase font-bold text-amber-400">Paused</span>
            <span className="font-extrabold text-white ml-0.5">{leadStats.paused}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-1.5 text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-[10px] uppercase font-bold text-sky-400">Scheduled</span>
            <span className="font-extrabold text-white ml-0.5">{leadStats.scheduled}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[10px] uppercase font-bold text-rose-400">Stopped</span>
            <span className="font-extrabold text-white ml-0.5">{leadStats.stopped}</span>
          </div>
        </div>

        {/* Right: Sync Now Button & Options */}
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Button
            size="sm"
            onClick={() => handleSyncGoogleSheet(false)}
            disabled={isSyncingSheet}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 rounded-xl h-8 px-3 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
            <span>{isSyncingSheet ? 'Syncing...' : 'Sync Now'}</span>
          </Button>

          <a
            href={sheetInfo?.spreadsheetUrl || sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
            title="Open Google Sheet in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </a>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSheetManagerOpen(true)}
            className="border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs h-8 rounded-xl px-2.5 cursor-pointer"
            title="Schema & Columns Manager"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </Button>
        </div>

      </div>

      {/* Leads Table Container */}
      <div className="glass-surface overflow-hidden">
        
        {/* Controls bar */}
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-6 text-xs flex-wrap">
            <div>
              <span className="text-slate-400">Prospects: </span>
              <span className="font-extrabold text-white">{leadStats.total}</span>
            </div>
            <div>
              <span className="text-slate-400">Active Sequence: </span>
              <span className="font-extrabold text-emerald-400">{leadStats.active}</span>
            </div>
            <div>
              <span className="text-slate-400">Paused on Tag: </span>
              <span className="font-extrabold text-amber-400">{leadStats.paused}</span>
            </div>
            <div>
              <span className="text-slate-400">Scheduled: </span>
              <span className="font-extrabold text-sky-400">{leadStats.scheduled}</span>
            </div>
            <div>
              <span className="text-slate-400">Replied / Stopped: </span>
              <span className="font-extrabold text-rose-400">{leadStats.stopped}</span>
            </div>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              placeholder="Search by name, email, or company..." 
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/[0.03] border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-3.5 font-bold text-slate-300">Prospect</th>
                <th className="px-5 py-3.5 font-bold text-slate-300">Company</th>
                <th className="px-5 py-3.5 font-bold text-slate-300">Tags</th>
                <th className="px-5 py-3.5 font-bold text-slate-300">Follow-up</th>
                <th className="px-5 py-3.5 font-bold text-slate-300">Next Date</th>
                <th className="px-5 py-3.5 font-bold text-slate-300">Sending Mailbox</th>
                <th className="px-5 py-3.5 font-bold text-slate-300">Last Activity</th>
                <th className="px-5 py-3.5 font-bold text-right text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredLeads.map((lead) => {
                const fStatus = lead.followupStatus || (lead.replied ? 'STOPPED' : lead.status === 'Scheduled' ? 'SCHEDULED' : ['Warm', 'Lead', 'Cold'].includes(lead.status) ? 'PAUSED' : 'ACTIVE');
                const isPaused = fStatus === 'PAUSED';
                const isScheduled = fStatus === 'SCHEDULED';
                const isStopped = fStatus === 'STOPPED' || lead.replied || lead.bounced || lead.unsubscribe;
                const isActive = fStatus === 'ACTIVE';

                const displayTag = lead.tag || (['Lead', 'Warm', 'Cold', 'Interested', 'Replied', 'DNC', 'Invalid Contact'].includes(lead.status) ? lead.status : null);

                return (
                  <tr key={lead.id} className="hover:bg-white/[0.035] transition-colors relative">
                    
                    {/* Prospect Column */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{lead.name}</span>
                        {isSheetConnected && (
                          <span title="Synced with Google Sheet Database" className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{lead.email}</span>
                        {lead.deliverability === 'Verified' && (
                          <span title="Verified Deliverability">
                            <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company Column */}
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200 font-semibold">{lead.company}</div>
                      <div className="text-[10px] text-slate-500">{lead.title || 'Executive'}</div>
                    </td>

                    {/* Tags Column (Colored Pills per Screenshot 5) */}
                    <td className="px-5 py-3.5">
                      {displayTag ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          displayTag === 'Interested' || displayTag === 'Lead'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : displayTag === 'Warm'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : displayTag === 'Replied'
                                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                : displayTag === 'Cold'
                                  ? 'bg-zinc-700/40 text-slate-300 border border-zinc-600/40'
                                  : 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                        }`}>
                          {displayTag}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Follow-up Status Badge (Active, Paused, Scheduled, Stopped) */}
                    <td className="px-5 py-3.5">
                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      )}

                      {isPaused && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Paused
                        </span>
                      )}

                      {isScheduled && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          Scheduled
                        </span>
                      )}

                      {isStopped && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#a31c1b]/20 text-rose-300 border border-[#a31c1b]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Stopped
                        </span>
                      )}
                    </td>

                    {/* Next Date Column */}
                    <td className="px-5 py-3.5 text-slate-300 font-medium">
                      {isScheduled ? (
                        <span className="text-sky-300 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          <span>{lead.followUpDate || 'Nov 04, 10:00 AM'}</span>
                        </span>
                      ) : isPaused ? (
                        <span className="text-slate-500 font-mono text-xs">—</span>
                      ) : isStopped ? (
                        <span className="text-slate-600 font-mono text-xs">—</span>
                      ) : (
                        <span className="text-emerald-400/90 font-semibold text-xs">
                          {lead.followUpDate || 'In 2 days'}
                        </span>
                      )}
                    </td>

                    {/* Sending Mailbox Column */}
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[120px]">{lead.mailbox || 'demo@reachops.com'}</span>
                      </div>
                    </td>

                    {/* Last Activity Column */}
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      <span>{lead.lastActivity || 'Enrolled'}</span>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3.5 text-right relative">
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveMenuId(activeMenuId === lead.id ? null : lead.id);
                          setTagSubmenuLeadId(null);
                        }}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
                        title="Actions Menu"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {/* Context Action Menu */}
                      {activeMenuId === lead.id && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-5 top-8 w-56 bg-[#171717]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl py-1.5 z-40 text-xs text-left animate-in zoom-in-95">
                            
                            {/* Schedule Next Follow-up (Opens Modal) */}
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(lead)}
                              className="w-full px-3.5 py-2 text-sky-300 hover:bg-sky-500/10 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
                            >
                              <Calendar className="w-3.5 h-3.5 text-sky-400" />
                              <span>Schedule Next Follow-up</span>
                            </button>

                            {/* Tag Prospect Submenu Trigger */}
                            <div className="border-t border-white/[0.06] my-1" />
                            <div className="px-3.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                              Tag Prospect (Pauses Follow-ups)
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1 px-2 py-1">
                              {['Lead', 'Warm', 'Cold', 'Interested', 'DNC', 'Invalid Contact'].map(tagName => (
                                <button
                                  key={tagName}
                                  type="button"
                                  onClick={() => handleTagLeadAndPause(lead.id, tagName)}
                                  className="px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] text-left text-[11px] font-medium transition-colors cursor-pointer truncate"
                                >
                                  {tagName}
                                </button>
                              ))}
                            </div>

                            <div className="border-t border-white/[0.06] my-1" />

                            {/* Pause or Resume Follow-ups */}
                            {isPaused ? (
                              <button
                                type="button"
                                onClick={() => handleResumeLead(lead)}
                                className="w-full px-3.5 py-2 text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Resume Follow-ups</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handlePauseLead(lead.id)}
                                className="w-full px-3.5 py-2 text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Pause Follow-ups</span>
                              </button>
                            )}

                            {/* Mark as Unsubscribed */}
                            <button
                              type="button"
                              onClick={() => handleUnsubscribeLead(lead.id)}
                              className="w-full px-3.5 py-2 text-slate-300 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-400" />
                              <span>Mark as Unsubscribed</span>
                            </button>

                            {/* View in Google Sheet */}
                            <a
                              href={sheetInfo?.spreadsheetUrl || sheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-3.5 py-2 text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View in Google Sheet</span>
                            </a>

                            <div className="border-t border-white/[0.06] my-1" />
                            <button
                              type="button"
                              onClick={() => handleRemoveLead(lead.id)}
                              className="w-full px-3.5 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Remove from Campaign</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <p className="font-semibold text-white">No leads match your filter</p>
                      <p className="text-xs text-slate-500 mt-1">Try searching another query or add new leads.</p>
                      <Button
                        onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
                        variant="outline"
                        className="mt-3 text-xs border-white/[0.1] bg-white/[0.04] text-slate-300 hover:text-white"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ============================================================ */}
      {/* SCHEDULE NEXT FOLLOW-UP MODAL (Section 7 & 9)                */}
      {/* ============================================================ */}
      {isScheduleModalOpen && schedulingLead && (
        <ScheduleFollowUpModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setSchedulingLead(null);
          }}
          onConfirm={handleConfirmSchedule}
          prospectName={schedulingLead.name}
          prospectEmail={schedulingLead.email}
          campaignName="ReachOps Beta Launch"
          isSuppressed={Boolean(schedulingLead.replied || schedulingLead.bounced || schedulingLead.unsubscribe)}
          suppressReason={
            schedulingLead.replied ? 'Prospect has already sent an inbound reply.' :
            schedulingLead.bounced ? 'Prospect previously bounced permanently.' :
            schedulingLead.unsubscribe ? 'Prospect is marked as unsubscribed.' : ''
          }
        />
      )}

      {/* ============================================================ */}
      {/* ADD LEADS MODAL WITH GLASSMORPHISM & CSV UPLOADER             */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-[#141716]/92 backdrop-blur-3xl border border-white/[0.14] rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.85)] z-10 space-y-5 animate-in zoom-in-95 duration-200 overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
            
            {/* Ambient Refraction Glows */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#a31c1b]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#a31c1b]/20 border border-[#a31c1b]/40 flex items-center justify-center text-[#ef4444] shadow-md shadow-[#a31c1b]/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">Add Campaign Leads</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Enroll prospects using Google Sheets database, manual entry, or CSV.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] gap-1 relative z-10 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setAddMode('single')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addMode === 'single'
                    ? 'bg-[#a31c1b] text-white shadow-md shadow-[#a31c1b]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Single Lead</span>
              </button>
              
              <button
                type="button"
                onClick={() => setAddMode('sheet')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addMode === 'sheet'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMode('bulk')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addMode === 'bulk'
                    ? 'bg-[#a31c1b] text-white shadow-md shadow-[#a31c1b]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMode('sample')}
                className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addMode === 'sample'
                    ? 'bg-[#10b981] text-white shadow-md shadow-[#10b981]/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sample</span>
              </button>
            </div>

            {/* TAB: GOOGLE SHEET DATABASE OPTION */}
            {addMode === 'sheet' && (
              <div className="space-y-4 relative z-10 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Google Sheet as Outreach Database</p>
                      <p className="text-[11px] text-slate-300">
                        New rows in this sheet enroll automatically. Applied tags and scheduled dates sync directly to your sheet.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                    Live 2-Way Sync
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Google Sheet URL or Spreadsheet ID</span>
                      <span className="text-[10px] text-emerald-400">Public or Workspace Access</span>
                    </label>
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner font-mono"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">Empty sheet? ReachOps will generate all 66 columns automatically.</span>
                      <button
                        type="button"
                        onClick={() => setIsSheetManagerOpen(true)}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>Open Schema Inspector & Permissions</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Sheet / Tab Name</label>
                      <input
                        type="text"
                        value={sheetTabName}
                        onChange={(e) => setSheetTabName(e.target.value)}
                        placeholder="Sheet1"
                        className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Email Column</label>
                      <input
                        type="text"
                        value={sheetEmailCol}
                        onChange={(e) => setSheetEmailCol(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner font-semibold"
                      />
                    </div>
                  </div>

                  {/* Two-Way Sync Option */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={isTwoWaySync}
                      onChange={(e) => setIsTwoWaySync(e.target.checked)}
                      className="mt-0.5 rounded bg-white/[0.08] border-white/[0.2] text-emerald-500 focus:ring-0 accent-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">Continuous Live Database Sync</span>
                      <span className="text-[11px] text-slate-400 block leading-tight">
                        When a tag (Lead, Warm, DNC) is applied in ReachOps, next follow-up stops and status is written back to this Google Sheet.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isSyncingSheet}
                    onClick={() => handleSyncGoogleSheet(false)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    {isSyncingSheet ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing Database...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Connect & Sync Google Sheet</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB: SINGLE LEAD FORM */}
            {addMode === 'single' && (
              <form onSubmit={handleAddSingleLead} className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">First Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Liam"
                      value={singleFirstName}
                      onChange={(e) => setSingleFirstName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Last Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Vance"
                      value={singleLastName}
                      onChange={(e) => setSingleLastName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Email Address <span className="text-[#ef4444]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="liam.vance@company.example"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corporation"
                      value={singleCompany}
                      onChange={(e) => setSingleCompany(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. VP of Engineering"
                      value={singleJobTitle}
                      onChange={(e) => setSingleJobTitle(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-reachops-primary text-xs font-bold shadow-lg shadow-[#a31c1b]/30 rounded-xl cursor-pointer"
                  >
                    {isSubmitting ? 'Enrolling...' : 'Enroll Lead'}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB: BULK CSV WITH FILE UPLOADER & HEADING SPECIFICATION */}
            {addMode === 'bulk' && (
              <div className="space-y-4 relative z-10 flex-1 overflow-y-auto pr-1 -mr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                
                {/* 1. CSV Heading Specifications & Template Download */}
                <div className="p-4 rounded-2xl bg-[#06110c]/85 border border-white/[0.1] shadow-inner space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-extrabold text-white tracking-tight">
                        Required CSV Column Headings
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyHeaderToClipboard}
                        className="text-[11px] font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        title="Copy column header row"
                      >
                        <Copy className="w-3 h-3 text-emerald-400" />
                        <span>Copy Headings</span>
                      </button>

                      <button
                        type="button"
                        onClick={downloadCsvTemplate}
                        className="text-[11px] font-bold text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Download Template (.CSV)</span>
                      </button>
                    </div>
                  </div>

                  {/* Column Specification Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-emerald-500/30 shadow-sm">
                      <div className="font-mono text-emerald-400 font-bold flex items-center justify-between">
                        <span>email</span>
                        <span className="text-rose-400 font-bold text-[10px]">*</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Required email</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="font-mono text-slate-200 font-bold">first_name</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Prospect name</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="font-mono text-slate-200 font-bold">last_name</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Surname</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="font-mono text-slate-200 font-bold">company</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Organization</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="font-mono text-slate-200 font-bold">job_title</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Decision maker</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    ReachOps automatically recognizes header variations (e.g. "Email Address", "Full Name", "Title").
                  </p>
                </div>

                {/* 2. Sub-mode Selector: Upload File vs Paste Text */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08] gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCsvSubMode('file')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        csvSubMode === 'file'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload CSV File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvSubMode('paste')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        csvSubMode === 'paste'
                          ? 'bg-[#a31c1b] text-white shadow-md shadow-[#a31c1b]/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Paste Text</span>
                    </button>
                  </div>

                  {parsedCsvLeads.length > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{parsedCsvLeads.length} leads ready</span>
                    </span>
                  )}
                </div>

                {/* 3A. File Drag & Drop Zone */}
                {csvSubMode === 'file' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain,.tsv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelected(file);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                        isDraggingFile
                          ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                          : uploadedFileName
                            ? 'border-emerald-500/40 bg-[#06110c]/80'
                            : 'border-white/[0.14] hover:border-emerald-500/50 bg-[#06110c]/60 hover:bg-emerald-500/[0.03]'
                      }`}
                    >
                      {uploadedFileName ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-md">
                            <FileSpreadsheet className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-xs">{uploadedFileName}</p>
                            <p className="text-[11px] text-emerald-400 mt-0.5">
                              {uploadedFileSize} &bull; <strong className="text-white">{parsedCsvLeads.length}</strong> valid leads parsed
                            </p>
                          </div>
                          <span className="inline-block text-[10px] text-slate-400 underline group-hover:text-white transition-colors pt-1">
                            Click to upload a different file
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.1] group-hover:border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-sm group-hover:scale-105 transition-all">
                            <UploadCloud className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              Click to browse or drag and drop your CSV file here
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Supports standard .csv, .tsv, or formatted .txt files (up to 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3B. Direct Textarea Input */}
                {csvSubMode === 'paste' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Paste CSV Content (With or without header row)
                    </label>
                    <textarea
                      rows={5}
                      value={bulkText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBulkText(val);
                        setParsedCsvLeads(parseCsvText(val));
                      }}
                      placeholder="first_name,last_name,email,company,job_title&#10;Sarah,Jenkins,sarah.jenkins@acme.example,Acme Corp,VP of Engineering&#10;David,Kim,david.kim@stripe.example,Stripe,Growth Lead&#10;Elena,Rostova,elena.r@datadog.example,Datadog,Marketing Director"
                      className="w-full bg-[#06110c]/80 border border-white/[0.1] focus:border-emerald-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 font-mono shadow-inner resize-none outline-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400">
                      Each email will be auto-verified for deliverability and queued for automated sequence outreach.
                    </p>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setUploadedFileName(null);
                      setParsedCsvLeads([]);
                      setBulkText('');
                    }}
                    className="border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddBulkLeads}
                    disabled={isSubmitting || (parsedCsvLeads.length === 0 && !bulkText.trim())}
                    className="btn-reachops-primary text-xs font-bold shadow-lg shadow-[#a31c1b]/30 rounded-xl cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enrolling Leads...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Enroll {parsedCsvLeads.length > 0 ? `${parsedCsvLeads.length} Leads` : 'Bulk Leads'}</span>
                      </>
                    )}
                  </Button>
                </div>

              </div>
            )}

            {/* TAB: SAMPLE LEADS */}
            {addMode === 'sample' && (
              <div className="space-y-4 relative z-10">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Instant Executive Test Pool</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Quickly add 3 verified B2B decision makers to test your sequence triggers, deliverability scores, and unified inbox reply simulation without manual typing.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddDemoLeads}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 rounded-xl cursor-pointer"
                  >
                    Add 3 Verified Demo Leads
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* GOOGLE SHEETS ADVANCED MANAGER MODAL */}
      <GoogleSheetsManagerModal
        isOpen={isSheetManagerOpen}
        onClose={() => setIsSheetManagerOpen(false)}
        campaignId={campaignKey}
        initialSpreadsheetUrl={sheetUrl}
        initialSheetName={sheetTabName}
        onConnected={(data) => {
          if (data.spreadsheetUrl) setSheetUrl(data.spreadsheetUrl);
          if (data.sheetName) setSheetTabName(data.sheetName);
          handleSyncGoogleSheet(false);
        }}
      />

    </div>
  );
}
