import type { ExitStrategy as ExitStrategyData } from '../../types/investment';

interface Props {
  data: ExitStrategyData;
  totalPriceIDR: number;
  displayExitPrice: number;
  symbol: string;
  handoverDate: string;
  formatDisplay: (idr: number) => string;
  onUpdate: <K extends keyof ExitStrategyData>(key: K, value: ExitStrategyData[K]) => void;
  onExitPriceChange: (displayValue: number) => void;
}

export function ExitStrategySection({
  data,
  totalPriceIDR,
  displayExitPrice,
  symbol,
  handoverDate,
  formatDisplay,
  onUpdate,
  onExitPriceChange,
}: Props) {
  const closingCostIDR = data.projectedSalesPrice * (data.closingCostPercent / 100);

  const appreciation =
    totalPriceIDR > 0
      ? ((data.projectedSalesPrice - totalPriceIDR) / totalPriceIDR) * 100
      : 0;

  const parseInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  // Format handover date for display
  const formattedHandoverDate = handoverDate
    ? new Date(handoverDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Set handover date above';

  return (
    <section className="rounded-xl border border-border-dark bg-background-dark p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">flight_takeoff</span>
        <h2 className="text-xl font-bold text-white">Exit Strategy</h2>
        <span className="ml-auto text-sm text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">
          Flip at Completion
        </span>
      </div>

      {/* Financial Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projected Sales Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Projected Sales Price</span>
          <span className="text-xs text-text-secondary/70">
            {totalPriceIDR > 0 ? `Appreciation: +${appreciation.toFixed(1)}%` : 'Set purchase price first'}
          </span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
              {symbol}
            </span>
            <input
              type="text"
              value={displayExitPrice > 0 ? formatNumber(displayExitPrice) : ''}
              onChange={(e) => onExitPriceChange(parseInput(e.target.value))}
              placeholder="4,375,000,000"
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 pl-12 text-white font-mono text-lg placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>
        </label>

        {/* Sale Date (equals handover for flip) */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Sale Date</span>
          <span className="text-xs text-text-secondary/70">Sell immediately at handover</span>
          <div className="w-full rounded-lg bg-surface-dark/50 border border-border-dark px-4 py-3 text-white font-mono">
            {formattedHandoverDate}
          </div>
        </div>

        {/* Closing Costs */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Closing Costs</span>
          <span className="text-xs text-text-secondary/70">Taxes, fees, commissions</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-surface-dark border border-border-dark px-3 py-3">
              <input
                type="text"
                inputMode="decimal"
                value={data.closingCostPercent}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const num = parseFloat(val);
                  if (!isNaN(num) && num >= 0 && num <= 20) {
                    onUpdate('closingCostPercent', num);
                  } else if (val === '' || val === '.') {
                    onUpdate('closingCostPercent', 0);
                  }
                }}
                className="w-12 bg-transparent text-white font-mono text-right focus:outline-none"
              />
              <span className="text-text-secondary font-mono">%</span>
            </div>
            <span className="text-text-secondary">=</span>
            <div className="flex-grow rounded-lg bg-surface-dark/50 border border-border-dark px-4 py-3 text-white font-mono">
              {symbol} {formatDisplay(closingCostIDR)}
            </div>
          </div>
        </label>
      </div>

      {/* Quick Appreciation Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-text-secondary mr-2 self-center">Quick set:</span>
        {[10, 15, 20, 25, 30, 40, 50].map((pct) => {
          const isActive = Math.abs(appreciation - pct) < 1;
          return (
            <button
              key={pct}
              onClick={() => onUpdate('projectedSalesPrice', totalPriceIDR * (1 + pct / 100))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-[#112217]'
                  : 'bg-surface-dark text-text-secondary hover:text-white'
              }`}
            >
              +{pct}%
            </button>
          );
        })}
      </div>
    </section>
  );
}
