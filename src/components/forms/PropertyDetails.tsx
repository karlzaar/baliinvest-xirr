import type { PropertyDetails as PropertyDetailsType } from '../../types/investment';

interface Props {
  data: PropertyDetailsType;
  displayPrice: string;
  currencySymbol: string;
  exchangeRate: number;
  onUpdate: <K extends keyof PropertyDetailsType>(key: K, value: PropertyDetailsType[K]) => void;
  onPriceChange: (displayAmount: number) => void;
}

const LOCATIONS = [
  'Canggu, Bali',
  'Seminyak, Bali',
  'Ubud, Bali',
  'Uluwatu, Bali',
  'Sanur, Bali',
  'Nusa Dua, Bali'
];

export function PropertyDetails({ 
  data, 
  displayPrice, 
  currencySymbol, 
  exchangeRate,
  onUpdate, 
  onPriceChange 
}: Props) {
  
  const parseNumber = (str: string): number => {
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayAmount = parseNumber(e.target.value);
    onPriceChange(displayAmount);
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
            placeholder="e.g. Villa Matahari Phase 1"
            className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white placeholder-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </label>

        {/* Location */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Location (Region)</span>
          <div className="relative">
            <input
              type="text"
              list="locations"
              value={data.location}
              onChange={(e) => onUpdate('location', e.target.value)}
              placeholder="Search location..."
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white placeholder-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all pl-10"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg">
              location_on
            </span>
            <datalist id="locations">
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
        </label>

        {/* Total Price */}
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Total Price</span>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-mono">
              {currencySymbol}
            </span>
            <input
              type="text"
              value={displayPrice}
              onChange={handlePriceChange}
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 pl-12 text-white font-mono text-lg placeholder-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
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
            className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white placeholder-text-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all h-[54px]"
          />
        </label>

        {/* Currency */}
        <label className="flex flex-col gap-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Base Currency</span>
            <span className="text-xs text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {data.currency !== 'IDR' ? `1 ${data.currency} = ${exchangeRate.toLocaleString()} IDR` : 'Base Currency'}
            </span>
          </div>
          <div className="relative">
            <select
              value={data.currency}
              onChange={(e) => onUpdate('currency', e.target.value as 'IDR' | 'USD' | 'AUD' | 'EUR')}
              className="w-full rounded-lg bg-surface-dark border border-border-dark px-4 py-3 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
            >
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="USD">USD - United States Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
              expand_more
            </span>
          </div>
          <p className="text-xs text-text-secondary/70">
            All calculations are performed in IDR. Changing currency only affects display.
          </p>
        </label>
      </div>
    </section>
  );
}
