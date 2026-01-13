
import type { Assumptions, CurrencyConfig } from '../types';
import { PLACEHOLDER_VALUES } from '../constants';
import { Tooltip } from '../../../components/ui/Tooltip';

interface Props {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  currency: CurrencyConfig;
}

const AssumptionsPanel = ({ assumptions, onChange, currency }: Props) => {
  const handleChange = (field: keyof Assumptions, value: any) => {
    onChange({ ...assumptions, [field]: value });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-12 mt-12 mb-4">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
        <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">Operational Dynamics & Growth Variables</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-16">
        {/* Cost Structure */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Operating Cost Basis (% Revenue)
            </h3>
            <Tooltip text="Direct operating costs expressed as a percentage of their respective revenue streams. These costs vary directly with occupancy and service delivery." />
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <SecondaryInput label="ROOMS COST" value={assumptions.roomsCostPct} placeholder={PLACEHOLDER_VALUES.roomsCostPct} onChange={(v) => handleChange('roomsCostPct', v)} isPercentage tooltip="Direct cost of room operations as % of room revenue. Includes housekeeping, amenities, laundry, and linens." />
            <SecondaryInput label="F&B COST" value={assumptions.fbCostPct} placeholder={PLACEHOLDER_VALUES.fbCostPct} onChange={(v) => handleChange('fbCostPct', v)} isPercentage tooltip="Cost of goods sold for F&B as % of F&B revenue. Includes ingredients, beverages, and kitchen supplies." />
            <SecondaryInput label="WELLNESS" value={assumptions.spaCostPct} placeholder={PLACEHOLDER_VALUES.spaCostPct} onChange={(v) => handleChange('spaCostPct', v)} isPercentage tooltip="Direct spa costs as % of spa revenue. Includes therapist wages, oils, products, and equipment." />
            <SecondaryInput label="UTILITIES" value={assumptions.utilitiesPct} placeholder={PLACEHOLDER_VALUES.utilitiesPct} onChange={(v) => handleChange('utilitiesPct', v)} isPercentage tooltip="Electricity, water, gas, and internet costs as % of total revenue." />
          </div>
        </section>

        {/* Undistributed Expenses */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Undistributed Expenses (% Revenue)
            </h3>
            <Tooltip text="Overhead costs not directly tied to specific departments. These are expressed as a percentage of total revenue." />
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-10">
            <SecondaryInput label="ADMIN & GEN" value={assumptions.adminPct} placeholder={PLACEHOLDER_VALUES.adminPct} onChange={(v) => handleChange('adminPct', v)} isPercentage tooltip="Administrative costs as % of revenue. Includes accounting, HR, insurance, and general office expenses." />
            <SecondaryInput label="SALES & MKT" value={assumptions.salesPct} placeholder={PLACEHOLDER_VALUES.salesPct} onChange={(v) => handleChange('salesPct', v)} isPercentage tooltip="Sales & Marketing costs as % of revenue. Includes OTA commissions, advertising, and promotional activities." />
            <SecondaryInput label="PROPERTY OPS" value={assumptions.maintPct} placeholder={PLACEHOLDER_VALUES.maintPct} onChange={(v) => handleChange('maintPct', v)} isPercentage tooltip="Property operations and maintenance as % of revenue. Includes repairs, landscaping, and general upkeep." />
          </div>
        </section>

        {/* Growth Rates */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Annual Growth Rates (% p.a.)
            </h3>
            <Tooltip text="Year-over-year growth rates that compound throughout the 10-year projection period." />
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <SecondaryInput label="ADR GROWTH" value={assumptions.adrGrowth} placeholder={PLACEHOLDER_VALUES.adrGrowth} onChange={(v) => handleChange('adrGrowth', v)} isPercentage tooltip="Annual rate increase for room rates. Typically 3-6% in growing markets like Bali." />
            <SecondaryInput label="FEE GROWTH" value={assumptions.baseFeeGrowth} placeholder={PLACEHOLDER_VALUES.baseFeeGrowth} onChange={(v) => handleChange('baseFeeGrowth', v)} isPercentage tooltip="Annual increase in management fees (CAM, Base, Tech). Usually tied to inflation (3-5%)." />
          </div>
        </section>

        {/* Management Fees - Year 1 Bases */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Year 1 Management Fees ({currency.code})
            </h3>
            <Tooltip text="Fixed management fees for Year 1. These grow annually based on the fee growth rate defined above." />
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <CurrencyInput label="CAM FEE" value={assumptions.y1CAM} placeholder={PLACEHOLDER_VALUES.y1CAM} onChange={(v) => handleChange('y1CAM', v)} currency={currency} tooltip="Common Area Maintenance fee per year. Covers shared facilities, landscaping, and common area upkeep." />
            <CurrencyInput label="BASE FEE" value={assumptions.y1BaseFee} placeholder={PLACEHOLDER_VALUES.y1BaseFee} onChange={(v) => handleChange('y1BaseFee', v)} currency={currency} tooltip="Base management fee per year. Fixed fee paid to property management company." />
            <CurrencyInput label="TECH FEE" value={assumptions.y1TechFee} placeholder={PLACEHOLDER_VALUES.y1TechFee} onChange={(v) => handleChange('y1TechFee', v)} currency={currency} tooltip="Technology fee per year. Covers PMS, booking systems, and IT infrastructure." />
            <SecondaryInput label="INCENTIVE %" value={assumptions.incentiveFeePct} placeholder={PLACEHOLDER_VALUES.incentiveFeePct} onChange={(v) => handleChange('incentiveFeePct', v)} isPercentage tooltip="Incentive fee as % of GOP. Performance-based fee paid when profitability targets are exceeded." />
          </div>
        </section>
      </div>
    </div>
  );
};

const SecondaryInput: React.FC<{
  label: string;
  value: number;
  placeholder?: number;
  onChange: (v: number) => void;
  isPercentage?: boolean;
  tooltip?: string;
}> = ({ label, value, placeholder, onChange, isPercentage, tooltip }) => {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide ml-0.5">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative group">
        <input
          type="number"
          step="0.1"
          value={value || ''}
          placeholder={placeholder?.toString() || '0'}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-[#fcfdfe] border border-slate-200 rounded-2xl px-6 py-5 text-[17px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all tabular-nums"
        />
        {isPercentage && (
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-300">%</span>
        )}
      </div>
    </div>
  );
};

const CurrencyInput: React.FC<{
  label: string;
  value: number;
  placeholder?: number;
  onChange: (v: number) => void;
  currency: CurrencyConfig;
  tooltip?: string;
}> = ({ label, value, placeholder, onChange, currency, tooltip }) => {
  const displayValue = value ? (value / currency.rate) : '';
  const displayPlaceholder = placeholder ? (placeholder / currency.rate) : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      onChange(num * currency.rate);
    } else if (rawValue === '') {
      onChange(0);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide ml-0.5">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative group">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-300">{currency.symbol}</span>
        <input
          type="text"
          value={displayValue ? formatNumber(Number(displayValue)) : ''}
          placeholder={formatNumber(displayPlaceholder)}
          onChange={handleInputChange}
          className="w-full bg-[#fcfdfe] border border-slate-200 rounded-2xl pl-12 pr-6 py-5 text-[17px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all tabular-nums"
        />
      </div>
    </div>
  );
};

export default AssumptionsPanel;
