import type { XIRRResult } from '../../types/investment';
import { Tooltip } from '../ui/Tooltip';

interface Props {
  result: XIRRResult;
  symbol: string;
  formatDisplay: (idr: number) => string;
  onExportPDF?: () => void;
}

export function ProjectForecast({ result, symbol, formatDisplay, onExportPDF }: Props) {
  const xirrPercent = (result.rate * 100).toFixed(1);
  const isPositive = result.rate >= 0;

  return (
    <div className="sticky top-28 flex flex-col gap-6">
      {/* Main Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-text-primary">Project Forecast</h3>

        {/* XIRR Display */}
        <div className="mb-6 rounded-lg bg-primary-light p-4 text-center border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-sm text-text-secondary">Estimated XIRR</p>
            <Tooltip text="Extended Internal Rate of Return - measures the annualized return of your investment accounting for irregular cash flows and timing. Higher is better." />
          </div>
          <div className="flex items-end justify-center gap-2">
            <span className={`text-4xl font-black ${isPositive ? 'text-primary' : 'text-negative'}`}>
              {xirrPercent}%
            </span>
            <span className={`text-xs mb-1.5 flex items-center ${isPositive ? 'text-primary' : 'text-negative'}`}>
              <span className="material-symbols-outlined text-sm">
                {isPositive ? 'trending_up' : 'trending_down'}
              </span>
              Annualized
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Total Invested</span>
              <Tooltip text="Sum of all cash outflows including down payment, installments, and additional costs." />
            </div>
            <span className="text-sm font-mono text-text-primary">
              {symbol} {formatDisplay(result.totalInvested)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Net Profit</span>
              <Tooltip text="Your total return after deducting all investments and closing costs from the projected sale price." />
            </div>
            <span className={`text-sm font-mono ${result.netProfit >= 0 ? 'text-primary' : 'text-negative'}`}>
              {result.netProfit >= 0 ? '+' : ''}{symbol} {formatDisplay(Math.abs(result.netProfit))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Investment Period</span>
              <Tooltip text="Time from your first payment (purchase date) until the projected sale date." />
            </div>
            <span className="text-sm text-text-primary">{result.holdPeriodMonths} Months</span>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6">
          <button
            onClick={onExportPDF}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-white font-bold hover:bg-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-surface-alt p-4 border border-border">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-text-muted">info</span>
          <p className="text-xs text-text-muted">
            XIRR calculation uses irregular intervals. All values stored in IDR internally.
          </p>
        </div>
      </div>
    </div>
  );
}
