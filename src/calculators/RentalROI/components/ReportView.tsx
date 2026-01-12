
import { useState } from 'react';
import type { YearlyData, Assumptions, CurrencyConfig, User } from '../types';
import ProjectionsTable from './ProjectionsTable';
import AISummary from './AISummary';
import DashboardHeader from './DashboardHeader';
import AuthModal from './AuthModal';
import { generateRentalROIPDF } from '../utils/pdfExport';

interface Props {
  data: YearlyData[];
  averages: Partial<YearlyData>;
  assumptions: Assumptions;
  currency: CurrencyConfig;
  user: User | null;
  onLogin: (user: User) => void;
  onBack: () => void;
}

const ReportView: React.FC<Props> = ({ data, averages, assumptions, currency, user, onLogin, onBack }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = () => {
    setIsExporting(true);
    try {
      generateRentalROIPDF({
        data,
        assumptions,
        currency,
        projectName: `${assumptions.keys}-Key Property`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const handleDownload = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      exportPDF();
    }
  };

  const handleAuthSuccess = (u: User) => {
    onLogin(u);
    setShowAuth(false);
    // Automatically trigger PDF export after auth success
    setTimeout(() => {
      exportPDF();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onSuccess={handleAuthSuccess} 
      />

      {/* Report Navigation Bar */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <span>Download PDF Report</span>
            )}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12">
        {/* Memo Header */}
        <header className="mb-16 border-b-4 border-slate-900 pb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-slate-900 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl italic">R</div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Prop-Investment Memo</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Investment Performance Summary</h1>
            <p className="text-slate-500 font-medium">Full 10-Year Projections & AI Strategic Analysis</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Generated On</div>
            <div className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </header>

        {/* AI Analysis Section */}
        <section className="mb-16">
          <AISummary data={data} assumptions={assumptions} currency={currency} />
        </section>

        {/* Executive Dashboard */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Executive Metrics</h2>
          </div>
          <DashboardHeader data={data} currency={currency} />
        </section>

        {/* The Big Table */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-6 bg-slate-900 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Full 10-Year Fiscal Modeling</h2>
          </div>
          <ProjectionsTable data={data} avg={averages} currency={currency} />
        </section>

        {/* Footer for Report */}
        <footer className="mt-20 pt-10 border-t border-slate-200 flex justify-between items-start opacity-60 italic text-sm">
          <div className="max-w-md">
            This document contains forward-looking financial projections based on current market assumptions. 
            Actual performance may vary based on economic conditions and operational management efficiency.
          </div>
          <div className="font-bold text-slate-900">Prop-Tech ROI Modeler v2.5</div>
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page-break-before { page-break-before: always; }
          nav { position: static !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportView;
