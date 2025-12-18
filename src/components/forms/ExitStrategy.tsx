import type { ExitStrategy as ExitStrategyType } from '../../types/investment';

interface Props {
  data: ExitStrategyType;
  totalPriceIDR: number;
  displayExitPrice: string;
  currencySymbol: string;
  formatAmount: (idrAmount: number) => string;
  onUpdate: <K extends keyof ExitStrategyType>(key: K, value: ExitStrategyType[K]) => void;
  onExitPriceChange: (displayAmount: number) => void;
}

export function ExitStrategy({ 
  data, 
  totalPriceIDR, 
  displayExitPrice,
  currencySymbol, 
  formatAmount,
  onUpdate,
  onExitPriceChange
}: Props) {
  const closingCostIDR = data.projectedSalesPrice * (data.closingCostPercent / 100);
  const appreciationPercent = totalPriceIDR > 0 
    ? ((data.projectedSalesPrice - totalPriceIDR) / totalPriceIDR * 100).toFixed(1)
    : '0';

  const parseNumber = (str: string): number => {
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
  };

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">flight_takeoff</span>
        <h2 className="text-xl font-bold text-white">Exit Investment Strategy</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projected Sales Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Projected Sales Price</span>
          <span className="text-xs text-text-secondary/70">
            Estimated market value upon completion (Currently: +{appreciationPercent}%)
          </span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
              {currencySymbol}
            </span>
            <input
              type="text"
              value={displayExitPrice}
              onChange={(e) => onExitPriceChange(parseNumber(e.target.value))}
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 pl-12 text-white font-mono text-lg placeholder-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </label>

        {/* Closing Costs */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Closing Costs</span>
          <span className="text-xs text-text-secondary/70">Taxes, notary fees, agent commissions</span>
          <div className="flex gap-3">
            <div className="relative w-24 flex-shrink-0">
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={data.closingCostPercent}
                onChange={(e) => onUpdate('closingCostPercent', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg bg-surface-dark border border-border-dark px-3 py-3 text-white font-mono text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">%</span>
            </div>
            <div className="relative flex-grow">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
                {currencySymbol}
              </span>
              <input
                type="text"
                value={formatAmount(closingCostIDR)}
                readOnly
                className="w-full rounded-lg bg-surface-dark/50 border border-border-dark px-4 py-3 pl-12 text-white font-mono text-lg placeholder-text-secondary/50 cursor-not-allowed"
              />
            </div>
          </div>
        </label>
      </div>

      {/* Quick Appreciation Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-text-secondary mr-2 self-center">Quick set appreciation:</span>
        {[10, 15, 20, 25, 30].map(percent => {
          const targetPrice = totalPriceIDR * (1 + percent / 100);
          const isActive = Math.abs((data.projectedSalesPrice / totalPriceIDR - 1) * 100 - percent) < 1;
          return (
            <button
              key={percent}
              onClick={() => onUpdate('projectedSalesPrice', targetPrice)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-[#112217]'
                  : 'bg-surface-dark text-text-secondary hover:text-white hover:bg-border-dark'
              }`}
            >
              +{percent}%
            </button>
          );
        })}
      </div>
    </section>
  );
}
