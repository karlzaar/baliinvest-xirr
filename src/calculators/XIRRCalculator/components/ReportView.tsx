import { useState } from 'react';
import type { InvestmentData, XIRRResult } from '../../../types/investment';
import { AuthModal, type User } from '../../../components/ui/AuthModal';
import { generatePDFReport } from '../../../utils/pdfExport';
import { generatePaymentSchedule } from '../../../utils/xirr';

interface Props {
  data: InvestmentData;
  result: XIRRResult;
  currency: string;
  symbol: string;
  rate: number;
  formatDisplay: (idr: number) => string;
  formatAbbrev: (idr: number) => string;
  user: User | null;
  onLogin: (user: User) => void;
  onBack: () => void;
}

export function ReportView({
  data,
  result,
  currency,
  symbol,
  rate,
  formatDisplay,
  formatAbbrev,
  user,
  onLogin,
  onBack,
}: Props) {
  const [showAuth, setShowAuth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const toDisplay = (idr: number): number => Math.round(idr / rate);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      await generatePDFReport({
        data,
        result,
        currency,
        symbol,
        formatDisplay,
        formatAbbrev,
        rate,
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

  // Calculations
  const totalROI = result.totalInvested > 0 ? (result.netProfit / result.totalInvested) * 100 : 0;
  const appreciation = data.property.totalPrice > 0
    ? ((data.exit.projectedSalesPrice - data.property.totalPrice) / data.property.totalPrice) * 100
    : 0;
  const closingCosts = data.exit.projectedSalesPrice * (data.exit.closingCostPercent / 100);
  const netProceeds = data.exit.projectedSalesPrice - closingCosts;
  const pricePerSqm = data.property.propertySize > 0
    ? Math.round(toDisplay(data.property.totalPrice) / data.property.propertySize)
    : 0;
  const salePricePerSqm = data.property.propertySize > 0
    ? Math.round(toDisplay(data.exit.projectedSalesPrice) / data.property.propertySize)
    : 0;
  const downPayment = data.property.totalPrice * (data.payment.downPaymentPercent / 100);
  const schedule = generatePaymentSchedule(data);

  // Investment rating
  const getInvestmentRating = () => {
    const xirr = result.rate * 100;
    if (xirr >= 25) return { grade: 'A+', label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (xirr >= 18) return { grade: 'A', label: 'Very Good', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (xirr >= 12) return { grade: 'B+', label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (xirr >= 8) return { grade: 'B', label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (xirr >= 0) return { grade: 'C', label: 'Marginal', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'D', label: 'Loss', color: 'text-red-600', bg: 'bg-red-50' };
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
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm"
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
            className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <div className="bg-primary text-white w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl">R</div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">XIRR Investment Report</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              {data.property.projectName || 'Investment Analysis'}
            </h1>
            <p className="text-slate-500 font-medium">{data.property.location || 'Property Investment'}</p>
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
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Projected XIRR</div>
                <div className={`text-5xl font-black ${result.rate >= 0 ? 'text-primary' : 'text-red-600'}`}>
                  {(result.rate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-500 mt-1">Annualized Return</div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics Grid */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-primary rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Investment</div>
              <div className="text-2xl font-black text-slate-900">{symbol} {formatDisplay(toDisplay(result.totalInvested))}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Net Profit</div>
              <div className={`text-2xl font-black ${result.netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
                {result.netProfit >= 0 ? '+' : ''}{symbol} {formatDisplay(toDisplay(Math.abs(result.netProfit)))}
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total ROI</div>
              <div className={`text-2xl font-black ${totalROI >= 0 ? 'text-primary' : 'text-red-600'}`}>
                {totalROI >= 0 ? '+' : ''}{totalROI.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hold Period</div>
              <div className="text-2xl font-black text-slate-900">{result.holdPeriodMonths} mo</div>
            </div>
          </div>
        </section>

        {/* Property Details */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-slate-900 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Property Details</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-slate-100">
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Purchase Price</div>
                <div className="text-lg font-bold text-slate-900">{symbol} {formatDisplay(toDisplay(data.property.totalPrice))}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Property Size</div>
                <div className="text-lg font-bold text-slate-900">{data.property.propertySize} m²</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Price / m²</div>
                <div className="text-lg font-bold text-slate-900">{symbol} {pricePerSqm.toLocaleString()}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Down Payment</div>
                <div className="text-lg font-bold text-slate-900">{symbol} {formatDisplay(toDisplay(downPayment))} ({data.payment.downPaymentPercent}%)</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Installments</div>
                <div className="text-lg font-bold text-slate-900">{data.payment.installmentMonths} months</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Handover Date</div>
                <div className="text-lg font-bold text-slate-900">{data.property.handoverDate}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Exit Strategy */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Exit Strategy</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-100">
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Projected Sale</div>
                <div className="text-lg font-bold text-slate-900">{symbol} {formatDisplay(toDisplay(data.exit.projectedSalesPrice))}</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Appreciation</div>
                <div className={`text-lg font-bold ${appreciation >= 0 ? 'text-primary' : 'text-red-600'}`}>
                  {appreciation >= 0 ? '+' : ''}{appreciation.toFixed(1)}%
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Closing Costs</div>
                <div className="text-lg font-bold text-red-600">-{symbol} {formatDisplay(toDisplay(closingCosts))} ({data.exit.closingCostPercent}%)</div>
              </div>
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Net Proceeds</div>
                <div className="text-lg font-bold text-primary">{symbol} {formatDisplay(toDisplay(netProceeds))}</div>
              </div>
              {data.property.propertySize > 0 && (
                <>
                  <div className="p-5 col-span-2">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Sale Price / m²</div>
                    <div className="text-lg font-bold text-slate-900">{symbol} {salePricePerSqm.toLocaleString()}</div>
                  </div>
                  <div className="p-5 col-span-2">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Projected Sale Date</div>
                    <div className="text-lg font-bold text-slate-900">{data.exit.saleDate}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Cash Flow Timeline */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cash Flow Timeline</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs">Date</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-600 uppercase text-xs">Description</th>
                  <th className="text-right px-5 py-3 font-bold text-slate-600 uppercase text-xs">Amount</th>
                  <th className="text-right px-5 py-3 font-bold text-slate-600 uppercase text-xs">Type</th>
                </tr>
              </thead>
              <tbody>
                {schedule.slice(0, 8).map((item, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-5 py-3 font-medium">
                      {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {item.amount < 0 ? 'Payment' : 'Sale Proceeds'}
                    </td>
                    <td className={`px-5 py-3 font-bold text-right ${item.amount < 0 ? 'text-red-600' : 'text-primary'}`}>
                      {item.amount < 0 ? '-' : '+'}{symbol} {formatDisplay(Math.abs(toDisplay(item.amount)))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.amount < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {item.amount < 0 ? 'Outflow' : 'Inflow'}
                      </span>
                    </td>
                  </tr>
                ))}
                {schedule.length > 8 && (
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="px-5 py-3 text-center text-slate-500 text-sm font-medium">
                      + {schedule.length - 8} more entries in full PDF report
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-10 border-t border-slate-200 flex justify-between items-start opacity-60 text-sm">
          <div className="max-w-md">
            This document contains forward-looking financial projections based on current market assumptions.
            Actual performance may vary. Always consult with a financial advisor.
          </div>
          <div className="font-bold text-slate-900">ROI Calculate v2.0</div>
        </footer>
      </div>
    </div>
  );
}

export default ReportView;
