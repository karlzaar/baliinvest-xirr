
import type { YearlyData, CurrencyConfig } from '../types';
import { formatCurrency } from '../constants';

interface Props {
  data: YearlyData[];
  currency: CurrencyConfig;
}

const DashboardHeader: React.FC<Props> = ({ data, currency }) => {
  const avgProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0) / data.length;
  const avgROI = data.reduce((s, i) => s + i.roiAfterManagement, 0) / data.length;
  const totalRevenue = data.reduce((s, i) => s + i.totalRevenue, 0);
  const totalProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0);

  return (
    <div className="sticky top-24 flex flex-col gap-4">
      <Card
        title="Avg Annual Cash Flow"
        value={formatCurrency(avgProfit, currency)}
        label="Expected Owner Profit"
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        color="text-emerald-600"
        bg="bg-emerald-50"
        border="border-emerald-100"
      />
      <Card
        title="Annualized Net Yield"
        value={`${avgROI.toFixed(2)}%`}
        label="10 year average net ROI p.a."
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        color="text-indigo-600"
        bg="bg-indigo-50"
        border="border-indigo-100"
      />
      <Card
        title="Total 10Y Earnings"
        value={formatCurrency(totalProfit, currency)}
        label="Cumulative Net Profit"
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        color="text-blue-600"
        bg="bg-blue-50"
        border="border-blue-100"
      />
      <Card
        title="10Y Gross Potential"
        value={formatCurrency(totalRevenue, currency)}
        label="Total Revenue Projection"
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        color="text-slate-700"
        bg="bg-slate-100"
        border="border-slate-200"
      />
    </div>
  );
};

const Card: React.FC<{ title: string; value: string; label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = ({ title, value, label, icon, color, bg, border }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border ${border} transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] group cursor-default`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.15em] block mb-1">{title}</span>
        <div className={`text-xl font-[800] ${color} tracking-tight leading-none`}>{value}</div>
      </div>
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color} shadow-inner transition-transform group-hover:scale-110 duration-300`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text', 'bg')} opacity-60 animate-pulse`}></div>
      <span className="text-[9px] font-[700] text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  </div>
);

export default DashboardHeader;
