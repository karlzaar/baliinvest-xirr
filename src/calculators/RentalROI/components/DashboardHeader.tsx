import { useState } from 'react';
import type { YearlyData, CurrencyConfig } from '../types';
import { formatCurrencyAbbrev } from '../constants';

interface Props {
  data: YearlyData[];
  currency: CurrencyConfig;
}

function MiniTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-700 text-[8px] font-bold flex items-center justify-center transition-colors cursor-help ml-1"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        ?
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 text-white text-[10px] rounded-lg shadow-lg whitespace-normal w-48 z-50 normal-case tracking-normal font-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

const DashboardHeader: React.FC<Props> = ({ data, currency }) => {
  const avgProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0) / data.length;
  const avgROI = data.reduce((s, i) => s + i.roiAfterManagement, 0) / data.length;
  const totalRevenue = data.reduce((s, i) => s + i.totalRevenue, 0);
  const totalProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0);

  return (
    <div className="sticky top-24 flex flex-col gap-4 z-40">
      <Card
        title="Avg Annual Cash Flow"
        value={formatCurrencyAbbrev(avgProfit, currency)}
        label="Expected Owner Profit"
        tooltip="Average yearly cash you take home after all expenses, management fees, and taxes."
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        color="text-emerald-600"
        bg="bg-emerald-50"
        border="border-emerald-100"
      />
      <Card
        title="Annualized Net Yield"
        value={`${avgROI.toFixed(2)}%`}
        label="10 year average net ROI p.a."
        tooltip="Your average annual return on investment as a percentage of your initial capital, after all costs."
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        color="text-indigo-600"
        bg="bg-indigo-50"
        border="border-indigo-100"
      />
      <Card
        title="Total 10Y Earnings"
        value={formatCurrencyAbbrev(totalProfit, currency)}
        label="Cumulative Net Profit"
        tooltip="Total cash profit accumulated over the full 10-year period after all expenses."
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        color="text-blue-600"
        bg="bg-blue-50"
        border="border-blue-100"
      />
      <Card
        title="10Y Gross Potential"
        value={formatCurrencyAbbrev(totalRevenue, currency)}
        label="Total Revenue Projection"
        tooltip="Total gross revenue potential before any expenses, management fees, or taxes over 10 years."
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        color="text-slate-700"
        bg="bg-slate-100"
        border="border-slate-200"
      />
    </div>
  );
};

const Card: React.FC<{ title: string; value: string; label: string; tooltip?: string; icon: React.ReactNode; color: string; bg: string; border: string }> = ({ title, value, label, tooltip, icon, color, bg, border }) => (
  <div className={`bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border ${border} transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] group cursor-default`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wide">{title}</span>
          {tooltip && <MiniTooltip text={tooltip} />}
        </div>
        <div className={`text-xl font-bold ${color} tracking-tight leading-none mt-1.5`}>{value}</div>
      </div>
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color} shadow-inner transition-transform group-hover:scale-110 duration-300`}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text', 'bg')} opacity-60 animate-pulse`}></div>
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  </div>
);

export default DashboardHeader;
