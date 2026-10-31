import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, 
  ExternalLink, Unlink, ShieldCheck, ArrowRight, Table, 
  Sparkles, Layers, Check, X, Info, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleSheetsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  initialSpreadsheetUrl?: string;
  initialSheetName?: string;
  onConnected?: (data: {
    spreadsheetId: string;
    spreadsheetUrl: string;
    sheetName: string;
    inspection: any;
  }) => void;
}

export default function GoogleSheetsManagerModal({
  isOpen,
  onClose,
  campaignId,
  initialSpreadsheetUrl = '',
  initialSheetName = 'Sheet1',
  onConnected,
}: GoogleSheetsManagerModalProps) {
  const [spreadsheetInput, setSpreadsheetInput] = useState(initialSpreadsheetUrl);
  const [sheetName, setSheetName] = useState(initialSheetName);
  const [availableSheets, setAvailableSheets] = useState<{ id: string; name: string }[]>([]);
  const [worksheets, setWorksheets] = useState<{ id?: number; title: string }[]>([]);
  
  // Connection states
  const [isConnected, setIsConnected] = useState(true);
  const [connectedEmail, setConnectedEmail] = useState('team.outbound@reachops-demo.example');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; read?: boolean; write?: boolean } | null>(null);
  
  // Inspection & Schema states
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initSuccessMessage, setInitSuccessMessage] = useState<string | null>(null);
  
  // Toast / Error state
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load available sheets from Google Drive API on modal open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/sheets/list')
        .then(res => res.json())
        .then(data => {
          if (data?.spreadsheets && Array.isArray(data.spreadsheets)) {
            setAvailableSheets(data.spreadsheets);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Test Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl: spreadsheetInput || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Google Sheets API connection verified! Read & Write permissions active.',
          read: data.readPermission,
          write: data.writePermission,
        });
        showToast('Google Sheets connection verified!', 'success');
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to verify spreadsheet permissions.',
        });
        showToast(data.error || 'Connection failed', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error testing Google Sheets connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Inspect Spreadsheet
  const handleInspect = async (inputUrl?: string) => {
    const targetUrl = inputUrl || spreadsheetInput;
    if (!targetUrl) {
      showToast('Please provide a Google Sheet URL or ID', 'error');
      return;
    }
    setIsInspecting(true);
    setInspectionResult(null);
    setInitSuccessMessage(null);
    try {
      const res = await fetch('/api/sheets/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl: targetUrl,
          sheetName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInspectionResult(data);
        if (data.worksheets && Array.isArray(data.worksheets)) {
          setWorksheets(data.worksheets);
          if (!sheetName && data.worksheets.length > 0) {
            setSheetName(data.worksheets[0].title);
          }
        }
        showToast('Spreadsheet inspected successfully!', 'success');
      } else {
        showToast(data.error || 'Inspection failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error inspecting sheet', 'error');
    } finally {
      setIsInspecting(false);
    }
  };

  // Auto-Generate or Append Missing Columns
  const handleInitializeSchema = async () => {
    if (!spreadsheetInput) {
      showToast('Spreadsheet URL or ID is required', 'error');
      return;
    }
    setIsInitializing(true);
    try {
      const res = await fetch('/api/sheets/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl: spreadsheetInput,
          sheetName,
          campaignId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInitSuccessMessage(data.message || 'ReachOps schema initialized successfully!');
        showToast(data.message || 'ReachOps schema applied!', 'success');
        // Re-inspect to refresh mapping report
        await handleInspect();
        if (onConnected) {
          onConnected({
            spreadsheetId: data.spreadsheetId || inspectionResult?.spreadsheetId,
            spreadsheetUrl: spreadsheetInput,
            sheetName,
            inspection: inspectionResult,
          });
        }
      } else {
        showToast(data.error || 'Failed to initialize schema', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error initializing schema', 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  // Google OAuth reconnect
  const handleConnectGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        showToast('Google OAuth authorization URL not available', 'error');
      }
    } catch {
      showToast('Failed to start Google OAuth flow', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
          toastMsg.type === 'success' 
            ? 'bg-[#06110c] border-emerald-500/40 text-emerald-300' 
            : 'bg-[#171717] border-[#a31c1b]/40 text-red-300'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel bg-[#171717]/95 border border-white/[0.12] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-6 sm:p-8 text-white">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Google Sheets Outreach Database</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Live Sync Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your spreadsheet as the central database for prospects, follow-up state, and tags.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: OAuth Account Status */}
        <div className="mt-5 p-4 rounded-2xl bg-[#06110c]/80 border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white">Google OAuth Authorization</p>
              <p className="text-[11px] text-slate-400">
                Connected to <span className="text-emerald-400 font-medium">{connectedEmail}</span> (Read & Write Scopes Active)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="text-xs h-8 px-3 rounded-xl bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08] text-slate-200"
            >
              {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />}
              <span>Test Connection</span>
            </Button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className={`mt-3 p-3.5 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in duration-150 ${
            testResult.success 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-red-950/40 border-[#a31c1b]/50 text-red-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
            <div className="flex-1">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.read && testResult.write && (
                <p className="text-[10px] text-emerald-400/80 mt-0.5">Permissions: Full Read & Write enabled. Batch updates authorized.</p>
              )}
            </div>
          </div>
        )}

        {/* Section 2: Spreadsheet Selection / URL Input */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>Spreadsheet URL or Identifier</span>
                <span className="text-emerald-400">*</span>
              </label>
              {availableSheets.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  {availableSheets.length} Drive spreadsheets found
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit or Spreadsheet ID"
                className="w-full bg-[#06110c]/90 border border-white/[0.12] focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all pr-24 font-mono"
              />
              <button
                type="button"
                onClick={() => handleInspect()}
                disabled={isInspecting || !spreadsheetInput}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] text-white disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isInspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Inspect</span>
              </button>
            </div>
          </div>

          {/* Quick Select Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Quick Select:</span>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
                setSpreadsheetInput(sample);
                handleInspect(sample);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 transition-colors"
            >
              Default Outreach Sample
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://docs.google.com/spreadsheets/d/empty-prospects-database-new/edit';
                setSpreadsheetInput(sample);
                handleInspect(sample);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Test Empty Sheet (Auto-Generate)</span>
            </button>
          </div>

          {/* Worksheet / Tab selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Worksheet / Tab Name
              </label>
              {worksheets.length > 0 ? (
                <select
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full bg-[#06110c]/90 border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500/60 transition-all cursor-pointer"
                >
                  {worksheets.map(ws => (
                    <option key={ws.title} value={ws.title} className="bg-[#171717] text-white">
                      {ws.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Sheet1"
                  className="w-full bg-[#06110c]/90 border border-white/[0.12] focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Schema Architecture
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 flex items-center justify-between">
                <span>ReachOps Standard Schema</span>
                <span className="font-mono text-emerald-400 text-[11px]">v2.0 (66 Cols)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Inspection Report & Auto-Column Generation */}
        {inspectionResult && (
          <div className="mt-6 p-4 rounded-2xl bg-[#06110c]/90 border border-white/[0.1] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Spreadsheet Inspection Report
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                inspectionResult.isEmpty 
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                {inspectionResult.isEmpty ? 'Empty Sheet (No Headers)' : 'Existing Data Detected'}
              </span>
            </div>

            {/* Case 1: Empty Spreadsheet */}
            {inspectionResult.isEmpty ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                  <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Zero manual setup needed!
                  </p>
                  ReachOps will automatically generate all 66 system columns across all 10 categories, freeze the header row, apply dark charcoal formatting (#171717), and configure column widths and filters.
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-400">
                    Target: <span className="font-mono text-white">{inspectionResult.sheetTitle}</span> (Row 1 Header)
                  </div>
                  <Button
                    onClick={handleInitializeSchema}
                    disabled={isInitializing}
                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5"
                  >
                    {isInitializing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-black" />}
                    <span>Auto-Generate ReachOps Columns</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Case 2: Existing Spreadsheet */
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Found <span className="font-bold text-white">{inspectionResult.existingHeaders.length}</span> existing columns in this worksheet. ReachOps will safely preserve all user columns and append missing system tracking columns.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recognized</span>
                    <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                      {inspectionResult.recognizedColumns?.length || 0} columns
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Custom User Columns</span>
                    <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                      {inspectionResult.customColumns?.length || 0} preserved
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Missing ReachOps</span>
                    <span className="font-bold text-amber-400 text-sm mt-0.5 block">
                      {inspectionResult.missingColumns?.length || 0} to append
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Never overwrites existing data or renames custom columns.</span>
                  </div>
                  <Button
                    onClick={handleInitializeSchema}
                    disabled={isInitializing || inspectionResult.missingColumns?.length === 0}
                    className="h-9 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] text-white font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    {isInitializing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Table className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Safely Append Missing Columns</span>
                  </Button>
                </div>
              </div>
            )}

            {initSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{initSuccessMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => {
                if (onConnected && inspectionResult) {
                  onConnected({
                    spreadsheetId: inspectionResult.spreadsheetId,
                    spreadsheetUrl: spreadsheetInput,
                    sheetName,
                    inspection: inspectionResult,
                  });
                }
                showToast('Google Sheet database configuration saved!', 'success');
                onClose();
              }}
              disabled={!spreadsheetInput}
              className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#a31c1b] to-[#b92322] hover:from-[#b92322] hover:to-[#871615] text-white font-bold text-xs shadow-[0_0_20px_rgba(163,28,27,0.35)] transition-all cursor-pointer"
            >
              <span>Save & Connect Database</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

