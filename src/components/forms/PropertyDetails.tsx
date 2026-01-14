import type { PropertyDetails as PropertyDetailsType } from '../../types/investment';

interface Props {
  data: PropertyDetailsType;
  symbol: string;
  displayPrice: number;
  onUpdate: <K extends keyof PropertyDetailsType>(key: K, value: PropertyDetailsType[K]) => void;
  onPriceChange: (displayValue: number) => void;
}

const LOCATIONS = [
  'Canggu, Bali',
  'Seminyak, Bali',
  'Ubud, Bali',
  'Uluwatu, Bali',
  'Sanur, Bali',
  'Nusa Dua, Bali'
];

export function PropertyDetails({ data, symbol, displayPrice, onUpdate, onPriceChange }: Props) {
  
  // Parse input: remove all non-digits, convert to number
  const parseInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-6 flex items-center border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">villa</span>
          <h2 className="text-xl font-bold text-text-primary">Property Details</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Project Name
          </span>
          <input
            type="text"
            value={data.projectName}
            onChange={(e) => onUpdate('projectName', e.target.value)}
            placeholder="e.g., Villa Matahari Phase 1"
            className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </label>

        {/* Location */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Location (Region)
          </span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
              location_on
            </span>
            <input
              type="text"
              list="locations"
              value={data.location}
              onChange={(e) => onUpdate('location', e.target.value)}
              placeholder="e.g., Canggu, Bali"
              className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pl-10 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <datalist id="locations">
              {LOCATIONS.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
        </label>

        {/* Total Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Total Price
          </span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">
              {symbol}
            </span>
            <input
              type="text"
              value={displayPrice > 0 ? formatNumber(displayPrice) : ''}
              onChange={(e) => onPriceChange(parseInput(e.target.value))}
              placeholder="3,500,000,000"
              className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pl-12 text-text-primary font-mono text-lg placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </label>

        {/* Property Size */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Property Size
          </span>
          <div className="relative">
            <input
              type="text"
              value={data.propertySize > 0 ? formatNumber(data.propertySize) : ''}
              onChange={(e) => onUpdate('propertySize', parseInput(e.target.value))}
              placeholder="100"
              className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pr-12 text-text-primary font-mono placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              m²
            </span>
          </div>
          {data.propertySize > 0 && displayPrice > 0 && (
            <span className="text-xs text-primary">
              {symbol} {formatNumber(Math.round(displayPrice / data.propertySize))} / m²
            </span>
          )}
        </label>

        {/* Purchase Date */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Purchase Date
          </span>
          <input
            type="date"
            value={data.purchaseDate}
            onChange={(e) => onUpdate('purchaseDate', e.target.value)}
            className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 text-text-primary focus:border-primary focus:outline-none h-[54px]"
          />
        </label>

        {/* Handover Date */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">
            Expected Handover Date
          </span>
          <input
            type="date"
            value={data.handoverDate}
            onChange={(e) => onUpdate('handoverDate', e.target.value)}
            className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 text-text-primary focus:border-primary focus:outline-none h-[54px]"
          />
        </label>
      </div>
    </section>
  );
}
