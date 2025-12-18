import type { XIRRResult } from '../../types/investment';

interface Props {
  result: XIRRResult;
  location: string;
  currency: string;
  formatAbbreviated: (idrAmount: number) => string;
  onCalculate: () => void;
}

export function ProjectForecast({ result, location, currency, formatAbbreviated, onCalculate }: Props) {
  const xirrPercent = (result.rate * 100).toFixed(1);
  const isPositive = result.rate >= 0;

  return (
    <div className="sticky top-28 flex flex-col gap-6">
      {/* Main Forecast Card */}
      <div className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-white">Project Forecast</h3>
        
        {/* XIRR Display */}
        <div className="mb-6 rounded-lg bg-surface-dark p-4 text-center border border-border-dark">
          <p className="text-sm font-medium text-text-secondary mb-1">Estimated XIRR</p>
          <div className="flex items-end justify-center gap-2">
            <span className={`text-4xl font-black tracking-tight ${isPositive ? 'text-primary' : 'text-red-400'}`}>
              {xirrPercent}%
            </span>
            <span className={`text-xs font-medium mb-1.5 flex items-center ${isPositive ? 'text-primary' : 'text-red-400'}`}>
              <span className="material-symbols-outlined text-sm">
                {isPositive ? 'trending_up' : 'trending_down'}
              </span>
              Annualized
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-dark/50 pb-2">
            <span className="text-sm text-text-secondary">Total Invested</span>
            <span className="text-sm font-mono font-medium text-white">
              {formatAbbreviated(result.totalInvested)} {currency}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border-dark/50 pb-2">
            <span className="text-sm text-text-secondary">Net Profit</span>
            <span className={`text-sm font-mono font-medium ${result.netProfit >= 0 ? 'text-primary' : 'text-red-400'}`}>
              {result.netProfit >= 0 ? '+' : ''}{formatAbbreviated(result.netProfit)} {currency}
            </span>
          </div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm text-text-secondary">Hold Period</span>
            <span className="text-sm font-medium text-white">
              {result.holdPeriodMonths} Months
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={onCalculate}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 px-4 text-[#112217] text-base font-bold shadow-[0_0_20px_rgba(19,236,91,0.2)] hover:bg-[#10d652] hover:shadow-[0_0_25px_rgba(19,236,91,0.3)] transition-all"
          >
            <span className="material-symbols-outlined">calculate</span>
            Calculate Final XIRR
          </button>
          <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-transparent border border-border-dark py-3 px-4 text-text-secondary text-sm font-medium hover:text-white hover:border-white/20 transition-all">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Location Map Card */}
      <div className="relative overflow-hidden rounded-xl border border-border-dark aspect-video group">
        <div className="absolute inset-0 bg-gradient-to-t from-[#112217] via-transparent to-transparent z-10" />
        <img
          alt="Map location"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwHT2VzPph9qs6JsqZp07mMJ3srl2KJqejoXd72EKf4wQ3xUm8zCJcOIe7tttl9IzEVp2l1tfiUBu4CxZd_OD52pyvy4uVPm6O7_ND5brY9xleq0LXuaD7uX3gQ9OoV4cbTozO4QGUkWHxSldAJdWU_1BNM7VSkn02aBmu_0DvrtCuFy7G0lfGJYbw73OMh-0h-aoxo6bUXkCJNh8vcBsih1nKxJwwPHatoc8Bngx0H3jD_-Qu9wbKxSkTJhd5JHvGi0LKlRXaSW2c"
          className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
        />
        <div className="absolute bottom-4 left-4 z-20">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Region</p>
          <p className="text-white font-bold">{location}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg bg-surface-dark/50 p-4 border border-border-dark/50">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-text-secondary">info</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            XIRR calculation assumes irregular intervals. The payment plan generates automatic 
            cash outflows based on the handover date.
          </p>
        </div>
      </div>
    </div>
  );
}
