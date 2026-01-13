import { useState, useMemo, useEffect, useCallback } from 'react';
import { INITIAL_ASSUMPTIONS, EMPTY_ASSUMPTIONS, CURRENCIES } from './constants';
import type { CurrencyCode, User, Assumptions } from './types';
import { calculateProjections, calculateAverage } from './utils/calculations';
import { generateRentalROIPDF } from './utils/pdfExport';
import DashboardHeader from './components/DashboardHeader';
import TopInputsPanel from './components/TopInputsPanel';
import AssumptionsPanel from './components/AssumptionsPanel';
import ProjectionsTable from './components/ProjectionsTable';
import ReportView from './components/ReportView';
import AuthModal from './components/AuthModal';
import { Toast } from '../../components/ui/Toast';
import { DraftSelector } from '../../components/ui/DraftSelector';
import { useArchivedDrafts, type ArchivedDraft } from '../../hooks/useArchivedDrafts';

const DRAFT_STORAGE_KEY = 'rental_roi_draft';

export function RentalROICalculator() {
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard');
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('roi_calculate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showAuth, setShowAuth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('rental_roi_currency');
    return (saved as CurrencyCode) || 'IDR';
  });

  const currency = useMemo(() => CURRENCIES[currencyCode], [currencyCode]);

  useEffect(() => {
    localStorage.setItem('rental_roi_currency', currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('roi_calculate_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('roi_calculate_user');
    }
  }, [user]);

  const [assumptions, setAssumptions] = useState<Assumptions>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    return INITIAL_ASSUMPTIONS;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentDraftName, setCurrentDraftName] = useState<string | undefined>();

  const { drafts, saveDraft: saveArchivedDraft, deleteDraft } = useArchivedDrafts<Assumptions>('rental-roi');

  const handleSaveDraft = useCallback(() => {
    setIsSaving(true);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(assumptions));
      setTimeout(() => {
        setIsSaving(false);
        setToast({ message: 'Draft saved successfully!', type: 'success' });
      }, 300);
    } catch (e) {
      console.error('Failed to save draft:', e);
      setIsSaving(false);
      setToast({ message: 'Failed to save draft', type: 'error' });
    }
  }, [assumptions]);

  const handleReset = useCallback(() => {
    if (showResetConfirm) {
      setAssumptions(EMPTY_ASSUMPTIONS);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setResetKey(k => k + 1);
      setCurrentDraftName(undefined);
      setShowResetConfirm(false);
      setToast({ message: 'All values reset', type: 'success' });
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  }, [showResetConfirm]);

  const handleSelectDraft = useCallback((draft: ArchivedDraft<Assumptions>) => {
    setAssumptions(draft.data);
    setCurrentDraftName(draft.name);
    setResetKey(k => k + 1);
    setToast({ message: `Loaded "${draft.name}"`, type: 'success' });
  }, []);

  const handleSaveArchive = useCallback((name: string) => {
    saveArchivedDraft(name, assumptions);
    setCurrentDraftName(name);
    setToast({ message: `Saved "${name}"`, type: 'success' });
  }, [saveArchivedDraft, assumptions]);

  const handleDeleteDraft = useCallback((id: string) => {
    deleteDraft(id);
    setToast({ message: 'Draft deleted', type: 'success' });
  }, [deleteDraft]);

  const data = useMemo(() => calculateProjections(assumptions), [assumptions]);
  const averages = useMemo(() => calculateAverage(data), [data]);

  const exportPDF = useCallback(() => {
    setIsExporting(true);
    try {
      generateRentalROIPDF({
        data,
        assumptions,
        currency,
        projectName: `${assumptions.keys}-Key Property`,
      });
      setToast({ message: 'PDF downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      setToast({ message: 'Failed to export PDF', type: 'error' });
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [data, assumptions, currency]);

  const handleDownloadPDF = useCallback(() => {
    if (!user) {
      setShowAuth(true);
    } else {
      exportPDF();
    }
  }, [user, exportPDF]);

  const handleAuthSuccess = useCallback((u: User) => {
    setUser(u);
    setShowAuth(false);
    setTimeout(() => {
      exportPDF();
    }, 500);
  }, [exportPDF]);

  if (view === 'report') {
    return (
      <ReportView
        data={data}
        averages={averages}
        assumptions={assumptions}
        currency={currency}
        user={user}
        onLogin={setUser}
        onBack={() => setView('dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 -mx-4 md:-mx-10 lg:-mx-20 -my-8 px-6 py-8">
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-[100%] mx-auto">
        <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-lg shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">10 Year Annualized ROI</h1>
              <p className="text-slate-500 text-xs mt-1 max-w-md">
                Project your rental property returns with revenue streams, operating costs, and management fees over 10 years
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Currency</span>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
                className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer appearance-none pr-4"
              >
                {Object.values(CURRENCIES).map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                ))}
              </select>
            </div>

            <DraftSelector
              drafts={drafts}
              onSelect={handleSelectDraft}
              onSave={handleSaveArchive}
              onDelete={handleDeleteDraft}
              currentName={currentDraftName}
            />

            <button
              onClick={handleReset}
              className={`px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 ${
                showResetConfirm
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {showResetConfirm ? 'Click to Confirm' : 'Reset Values'}
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Draft</span>
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-9 space-y-6">
            <TopInputsPanel key={resetKey} assumptions={assumptions} onChange={setAssumptions} currency={currency} />

            <AssumptionsPanel key={`assumptions-${resetKey}`} assumptions={assumptions} onChange={setAssumptions} currency={currency} />

            <ProjectionsTable data={data} avg={averages} currency={currency} />

            <div className="flex flex-col items-center justify-center pt-8 pb-20 border-t border-slate-200 mt-12">
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-all active:scale-95 flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownloadPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] text-center max-w-md">
                  Full 10-Year Analysis with AI Deal Rating, Key Metrics & Financial Projections
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-indigo-600 font-black tracking-widest uppercase">Ready to download</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar - Right Side */}
          <div className="lg:col-span-3">
            <DashboardHeader data={data} currency={currency} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentalROICalculator;
