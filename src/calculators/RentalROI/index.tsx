import { useState, useMemo, useEffect, useCallback } from 'react';
import { INITIAL_ASSUMPTIONS, EMPTY_ASSUMPTIONS, CURRENCIES } from './constants';
import type { CurrencyCode, User, Assumptions } from './types';
import { calculateProjections, calculateAverage } from './utils/calculations';
import DashboardHeader from './components/DashboardHeader';
import TopInputsPanel from './components/TopInputsPanel';
import AssumptionsPanel from './components/AssumptionsPanel';
import ProjectionsTable from './components/ProjectionsTable';
import ReportView from './components/ReportView';

const DRAFT_STORAGE_KEY = 'rental_roi_draft';

export function RentalROICalculator() {
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard');
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rental_roi_user');
    return saved ? JSON.parse(saved) : null;
  });

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
      localStorage.setItem('rental_roi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rental_roi_user');
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

  const handleSaveDraft = useCallback(() => {
    setIsSaving(true);
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(assumptions));
      setTimeout(() => setIsSaving(false), 300);
    } catch (e) {
      console.error('Failed to save draft:', e);
      setIsSaving(false);
    }
  }, [assumptions]);

  const handleReset = useCallback(() => {
    setAssumptions(EMPTY_ASSUMPTIONS);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const data = useMemo(() => calculateProjections(assumptions), [assumptions]);
  const averages = useMemo(() => calculateAverage(data), [data]);

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
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-500 font-medium text-xs">Rental Strategy Analysis</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium text-xs">10 Year Projections</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {user && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                  {user.name.charAt(0)}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.name}</span>
                <button
                  onClick={() => setUser(null)}
                  className="text-slate-300 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</span>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value as CurrencyCode)}
                className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer appearance-none pr-4"
              >
                {Object.values(CURRENCIES).map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReset}
              className="bg-red-500 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-red-600 transition-all active:scale-95"
            >
              Reset Values
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
            <TopInputsPanel assumptions={assumptions} onChange={setAssumptions} currency={currency} />

            <ProjectionsTable data={data} avg={averages} currency={currency} />

            <AssumptionsPanel assumptions={assumptions} onChange={setAssumptions} currency={currency} />

            <div className="flex flex-col items-center justify-center pt-8 pb-20 border-t border-slate-200 mt-12">
              <button
                className="bg-[#10b981] hover:bg-[#059669] text-white px-10 py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all active:scale-95 flex items-center gap-4"
                onClick={() => setView('report')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                GET FULL REPORT
              </button>
              <div className="mt-6 flex flex-col items-center gap-2.5">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] text-center max-w-md">
                  Includes Opportunity Score, Comparables, Investment Summary and more
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-emerald-600 font-black tracking-widest uppercase">Ready for delivery</span>
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
