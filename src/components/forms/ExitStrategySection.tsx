import type { ExitStrategy as ExitStrategyData } from '../../types/investment';

interface Props {
  data: ExitStrategyData;
  totalPriceIDR: number;
  displayExitPrice: number;
  symbol: string;
  handoverDate: string;
  propertySize?: number;
  displayToIdr: (display: number) => number;
  idrToDisplay: (idr: number) => number;
  onUpdate: <K extends keyof ExitStrategyData>(key: K, value: ExitStrategyData[K]) => void;
  onExitPriceChange: (displayValue: number) => void;
}

export function ExitStrategySection({
  data,
  totalPriceIDR,
  displayExitPrice,
  symbol,
  handoverDate,
  displayToIdr,
  idrToDisplay,
  onUpdate,
  onExitPriceChange,
}: Props) {
  const closingCostIDR = data.projectedSalesPrice * (data.closingCostPercent / 100);
  const closingCostDisplay = idrToDisplay(closingCostIDR);

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

  // Format appreciation with reasonable display
  const formatAppreciation = (): string => {
    if (appreciation >= 1000) {
      return `+${(appreciation / 1000).toFixed(0)}K%`;
    }
    return `+${appreciation.toFixed(1)}%`;
  };

  // Handle closing cost currency input - convert to percentage
  const handleClosingCostAmountChange = (displayValue: number) => {
    if (data.projectedSalesPrice > 0) {
      const idrValue = displayToIdr(displayValue);
      const newPercent = (idrValue / data.projectedSalesPrice) * 100;
      // Clamp to reasonable range and round to 2 decimals
      const clampedPercent = Math.min(20, Math.max(0, Math.round(newPercent * 100) / 100));
      onUpdate('closingCostPercent', clampedPercent);
    }
  };

  const formattedHandoverDate = handoverDate
    ? new Date(handoverDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Set handover date above';

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
        <span className="material-symbols-outlined text-primary">flight_takeoff</span>
        <h2 className="text-xl font-bold text-text-primary">Exit Strategy</h2>
        <span className="ml-auto text-sm text-primary bg-primary-light px-3 py-1 rounded-full font-medium">
          Flip at Completion
        </span>
      </div>

      {/* Financial Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Projected Sales Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Projected Sales Price</span>
          <span className="text-xs text-text-muted truncate" title={totalPriceIDR > 0 ? `Appreciation: +${appreciation.toFixed(2)}%` : undefined}>
            {totalPriceIDR > 0 ? `Appreciation: ${formatAppreciation()}` : 'Set purchase price first'}
          </span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">
              {symbol}
            </span>
            <input
              type="text"
              value={displayExitPrice > 0 ? formatNumber(displayExitPrice) : ''}
              onChange={(e) => onExitPriceChange(parseInput(e.target.value))}
              placeholder="4,375,000,000"
              className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pl-12 text-text-primary font-mono text-base placeholder:text-text-muted focus:border-primary focus:outline-none overflow-hidden text-ellipsis"
            />
          </div>
        </label>

        {/* Sale Date */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Sale Date</span>
          <span className="text-xs text-text-muted">
            {handoverDate ? `Handover: ${formattedHandoverDate}` : 'Set handover date above'}
          </span>
          <input
            type="date"
            value={data.saleDate || ''}
            onChange={(e) => onUpdate('saleDate', e.target.value)}
            className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 text-text-primary focus:border-primary focus:outline-none"
          />
        </label>

        {/* Closing Costs */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Closing Costs</span>
          <span className="text-xs text-text-muted">Taxes, fees, commissions</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-surface-alt border border-border px-3 py-3 flex-shrink-0">
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
                className="w-12 bg-transparent text-text-primary font-mono text-right focus:outline-none"
              />
              <span className="text-text-muted font-mono">%</span>
            </div>
            <span className="text-text-muted flex-shrink-0">=</span>
            <div className="flex-1 min-w-0 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">
                {symbol}
              </span>
              <input
                type="text"
                value={closingCostDisplay > 0 ? formatNumber(closingCostDisplay) : ''}
                onChange={(e) => handleClosingCostAmountChange(parseInput(e.target.value))}
                placeholder="0"
                title={closingCostDisplay > 0 ? `${symbol} ${formatNumber(closingCostDisplay)}` : undefined}
                className="w-full rounded-lg bg-surface-alt border border-border px-3 py-3 pl-10 text-text-primary font-mono text-sm focus:border-primary focus:outline-none truncate"
              />
            </div>
          </div>
        </label>
      </div>

      {/* Quick Appreciation Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[10, 15, 20, 25, 30, 40, 50].map((pct) => {
          const isActive = Math.abs(appreciation - pct) < 1;
          return (
            <button
              key={pct}
              onClick={() => onUpdate('projectedSalesPrice', totalPriceIDR * (1 + pct / 100))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt border border-border text-text-secondary hover:text-text-primary hover:border-primary'
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
