import type { ExitStrategy as ExitStrategyType } from '../../types/investment';

interface Props {
  data: ExitStrategyType;
  totalPriceIDR: number;
  displayExitPrice: number;
  symbol: string;
  formatDisplay: (idr: number) => string;
  onUpdate: <K extends keyof ExitStrategyType>(key: K, value: ExitStrategyType[K]) => void;
  onExitPriceChange: (displayValue: number) => void;
}

export function ExitStrategy({ 
  data, 
  totalPriceIDR, 
  displayExitPrice,
  symbol, 
  formatDisplay,
  onUpdate,
  onExitPriceChange
}: Props) {
  const closingCostIDR = data.projectedSalesPrice * (data.closingCostPercent / 100);
  
  const appreciation = totalPriceIDR > 0 
    ? ((data.projectedSalesPrice - totalPriceIDR) / totalPriceIDR * 100)
    : 0;

  const parseInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">flight_takeoff</span>
        <h2 className="text-xl font-bold text-white">Exit Strategy</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projected Sales Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Projected Sales Price</span>
          <span className="text-xs text-text-secondary/70">
            Appreciation: +{appreciation.toFixed(1)}%
          </span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
              {symbol}
            </span>
            <input
              type="text"
              value={formatNumber(displayExitPrice)}
              onChange={(e) => onExitPriceChange(parseInput(e.target.value))}
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 pl-12 text-white font-mono text-lg focus:border-primary focus:outline-none"
            />
          </div>
        </label>

        {/* Closing Costs */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Closing Costs</span>
          <span className="text-xs text-text-secondary/70">Taxes, fees, commissions</span>
          <div className="flex gap-3">
            <div className="relative w-20">
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={data.closingCostPercent}
                onChange={(e) => onUpdate('closingCostPercent', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg bg-surface-dark border border-border-dark px-3 py-3 text-white font-mono text-center focus:border-primary focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">%</span>
            </div>
            <div className="relative flex-grow">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
                {symbol}
              </span>
              <input
                type="text"
                value={formatDisplay(closingCostIDR)}
                readOnly
                className="w-full rounded-lg bg-surface-dark/50 border border-border-dark px-4 py-3 pl-12 text-white font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </label>
      </div>

      {/* Quick Appreciation Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-text-secondary mr-2 self-center">Quick set:</span>
        {[10, 15, 20, 25, 30].map(pct => {
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
