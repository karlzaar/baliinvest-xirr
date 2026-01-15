import { useState } from 'react';
import type { YearlyData, Assumptions, CurrencyConfig, User } from '../types';
import AuthModal from './AuthModal';
import { generateRentalROIPDF } from '../utils/pdfExport';
import { formatCurrency } from '../constants';

interface Props {
  data: YearlyData[];
  averages: Partial<YearlyData>;
  assumptions: Assumptions;
  currency: CurrencyConfig;
  user: User | null;
  onLogin: (user: User) => void;
  onBack: () => void;
}

const ReportView: React.FC<Props> = ({ data, assumptions, currency, user, onLogin, onBack }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      await generateRentalROIPDF({
        data,
        assumptions,
        currency,
        projectName: 'Property Investment',
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
    setTimeout(() => {
      exportPDF();
    }, 500);
  };

  // Calculated metrics
  const avgProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0) / data.length;
  const avgROI = data.reduce((s, i) => s + i.roiAfterManagement, 0) / data.length;
  const totalRevenue = data.reduce((s, i) => s + i.totalRevenue, 0);
  const totalProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0);
  const avgGopMargin = data.reduce((s, i) => s + i.gopMargin, 0) / data.length;
  const paybackYears = assumptions.initialInvestment / (totalProfit / 10);

  // Investment rating based on ROI
  const getInvestmentRating = () => {
    if (avgROI >= 12) return { grade: 'A+', label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (avgROI >= 10) return { grade: 'A', label: 'Very Good', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (avgROI >= 8) return { grade: 'B+', label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (avgROI >= 6) return { grade: 'B', label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (avgROI >= 4) return { grade: 'C', label: 'Marginal', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'D', label: 'Poor', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const rating = getInvestmentRating();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Calculator
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200/50 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      <div className="max-w-5xl mx-auto px-6 pt-12">
        {/* Header */}
        <header className="mb-12 border-b-4 border-slate-900 pb-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl">R</div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">10-Year ROI Report</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              Property Investment
            </h1>
            <p className="text-slate-500 font-medium">Annualized Return Analysis</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Generated On</div>
            <div className="text-lg font-bold text-slate-900">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Investment Rating Card */}
        <section className="mb-10">
          <div className={`${rating.bg} rounded-2xl p-8 border-2 border-current/10`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Investment Rating</div>
                <div className="flex items-baseline gap-4">
                  <span className={`text-6xl font-black ${rating.color}`}>{rating.grade}</span>
                  <span className={`text-2xl font-bold ${rating.color}`}>{rating.label}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Annualized Net Yield</div>
                <div className={`text-5xl font-black ${avgROI >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  {avgROI.toFixed(2)}%
                </div>
                <div className="text-sm text-slate-500 mt-1">10-Year Average ROI</div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics Grid */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Investment</div>
              <div className="text-2xl font-black text-slate-900">{formatCurrency(assumptions.initialInvestment, currency)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Annual Cash Flow</div>
              <div className={`text-2xl font-black ${avgProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(avgProfit, currency)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">10Y Total Profit</div>
              <div className={`text-2xl font-black ${totalProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                {formatCurrency(totalProfit, currency)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payback Period</div>
              <div className="text-2xl font-black text-slate-900">{paybackYears.toFixed(1)} yrs</div>
            </div>
          </div>
        </section>

        {/* Investment Parameters */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-slate-900 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Investment Parameters</h2>
          </div>
          {/* Property Readiness Notice */}
          {!assumptions.isPropertyReady && assumptions.propertyReadyDate && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-amber-600 text-xl">⏳</span>
              <div>
                <div className="text-sm font-bold text-amber-800">Property Not Yet Ready</div>
                <div className="text-xs text-amber-600">
                  Expected ready date: {new Date(assumptions.propertyReadyDate + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {' '}- Occupancy prorated accordingly
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-slate-100">
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Initial Investment</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(assumptions.initialInvestment, currency)}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Starting ADR</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(assumptions.y1ADR, currency)}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Y1 Occupancy</div>
                <div className="text-lg font-bold text-slate-900">{assumptions.y1Occupancy}%</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">ADR Growth</div>
                <div className="text-lg font-bold text-slate-900">{assumptions.adrGrowth}% p.a.</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Incentive Fee</div>
                <div className="text-lg font-bold text-slate-900">{assumptions.incentiveFeePct}%</div>
              </div>
            </div>
          </div>
        </section>

        {/* Operating Metrics */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Operating Performance</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-100">
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">10Y Gross Revenue</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(totalRevenue, currency)}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Avg GOP Margin</div>
                <div className="text-lg font-bold text-emerald-600">{avgGopMargin.toFixed(1)}%</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">10Y Net Profit</div>
                <div className="text-lg font-bold text-indigo-600">{formatCurrency(totalProfit, currency)}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Avg Annual ROI</div>
                <div className="text-lg font-bold text-indigo-600">{avgROI.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </section>

        {/* 10-Year Projections Table */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">10-Year Projections</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 uppercase text-xs">Year</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase text-xs">Occupancy</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase text-xs">ADR</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase text-xs">Revenue</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase text-xs">GOP</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase text-xs">Net Profit</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600 uppercase text-xs">ROI</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.year} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold">Year {row.year}</td>
                    <td className="px-4 py-3 text-right">{row.occupancy.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.adr, currency)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.totalRevenue, currency)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{row.gopMargin.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(row.takeHomeProfit, currency)}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{row.roiAfterManagement.toFixed(2)}%</td>
                  </tr>
                ))}
                {/* Averages row */}
                <tr className="bg-slate-100 font-bold">
                  <td className="px-4 py-3">Average</td>
                  <td className="px-4 py-3 text-right">{(data.reduce((s, r) => s + r.occupancy, 0) / data.length).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(data.reduce((s, r) => s + r.adr, 0) / data.length, currency)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(data.reduce((s, r) => s + r.totalRevenue, 0) / data.length, currency)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{avgGopMargin.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(avgProfit, currency)}</td>
                  <td className="px-4 py-3 text-right text-indigo-600">{avgROI.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-10 border-t border-slate-200 flex justify-between items-start opacity-60 text-sm">
          <div className="max-w-md">
            This document contains forward-looking financial projections based on current market assumptions.
            Actual performance may vary based on economic conditions and operational management efficiency.
          </div>
          <div className="font-bold text-slate-900">ROI Calculate v2.0</div>
        </footer>
      </div>
    </div>
  );
};

export default ReportView;
