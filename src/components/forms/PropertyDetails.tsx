import type { PropertyDetails as PropertyDetailsType } from '../../types/investment';

interface Props {
  data: PropertyDetailsType;
  symbol: string;
  rate: number;
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

export function PropertyDetails({ data, symbol, rate, displayPrice, onUpdate, onPriceChange }: Props) {
  
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
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">villa</span>
        <h2 className="text-xl font-bold text-white">Property Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Project Name</span>
          <input
            type="text"
            value={data.projectName}
            onChange={(e) => onUpdate('projectName', e.target.value)}
            placeholder="e.g., Villa Matahari Phase 1"
            className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
          />
        </label>

        {/* Location */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Location (Region)</span>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
              location_on
            </span>
            <input
              type="text"
              list="locations"
              value={data.location}
              onChange={(e) => onUpdate('location', e.target.value)}
              placeholder="e.g., Canggu, Bali"
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 pl-10 text-white placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
            <datalist id="locations">
              {LOCATIONS.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
        </label>

        {/* Total Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Total Price</span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
              {symbol}
            </span>
            <input
              type="text"
              value={displayPrice > 0 ? formatNumber(displayPrice) : ''}
              onChange={(e) => onPriceChange(parseInput(e.target.value))}
              placeholder="3,500,000,000"
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 pl-12 text-white font-mono text-lg placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
            />
          </div>
        </label>

        {/* Handover Date */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Expected Handover Date</span>
          <input
            type="date"
            value={data.handoverDate}
            onChange={(e) => onUpdate('handoverDate', e.target.value)}
            className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white focus:border-primary focus:outline-none h-[54px]"
          />
        </label>

        {/* Currency Selector */}
        <label className="flex flex-col gap-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Display Currency</span>
            {data.currency !== 'IDR' && (
              <span className="text-xs text-primary">
                1 {data.currency} = {rate.toLocaleString()} IDR
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={data.currency}
              onChange={(e) => onUpdate('currency', e.target.value as 'IDR' | 'USD' | 'AUD' | 'EUR')}
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white focus:border-primary focus:outline-none appearance-none"
            >
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="USD">USD - US Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              expand_more
            </span>
          </div>
          <p className="text-xs text-text-secondary/70">
            Currency only changes display. All calculations use IDR internally.
          </p>
        </label>
      </div>
    </section>
  );
}
