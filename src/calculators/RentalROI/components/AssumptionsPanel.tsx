
import type { Assumptions, CurrencyConfig } from '../types';
import { PLACEHOLDER_VALUES } from '../constants';
import { Tooltip } from '../../../components/ui/Tooltip';
import { parseDecimalInput, sanitizeDecimalInput } from '../../../utils/numberParsing';

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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mt-6 mb-4">
      <div className="mb-6 flex items-center border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">tune</span>
          <h2 className="text-xl font-bold text-slate-900">Operational Assumptions</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
        {/* Cost Structure */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <h3 className="text-base font-semibold text-slate-700">
              Operating Cost Basis (% Revenue)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <SecondaryInput label="Rooms Cost" value={assumptions.roomsCostPct} placeholder={PLACEHOLDER_VALUES.roomsCostPct} onChange={(v) => handleChange('roomsCostPct', v)} isPercentage tooltip="Direct cost of room operations as % of room revenue. Includes housekeeping, amenities, laundry, and linens." />
            <SecondaryInput label="F&B Cost" value={assumptions.fbCostPct} placeholder={PLACEHOLDER_VALUES.fbCostPct} onChange={(v) => handleChange('fbCostPct', v)} isPercentage tooltip="Cost of goods sold for F&B as % of F&B revenue. Includes ingredients, beverages, and kitchen supplies." />
            <SecondaryInput label="Wellness" value={assumptions.spaCostPct} placeholder={PLACEHOLDER_VALUES.spaCostPct} onChange={(v) => handleChange('spaCostPct', v)} isPercentage tooltip="Direct spa costs as % of spa revenue. Includes therapist wages, oils, products, and equipment." />
            <SecondaryInput label="Utilities" value={assumptions.utilitiesPct} placeholder={PLACEHOLDER_VALUES.utilitiesPct} onChange={(v) => handleChange('utilitiesPct', v)} isPercentage tooltip="Electricity, water, gas, and internet costs as % of total revenue." />
          </div>
        </section>

        {/* Undistributed Expenses */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <h3 className="text-base font-semibold text-slate-700">
              Undistributed Expenses (% Revenue)
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-10">
            <SecondaryInput label="Admin & General" value={assumptions.adminPct} placeholder={PLACEHOLDER_VALUES.adminPct} onChange={(v) => handleChange('adminPct', v)} isPercentage tooltip="Administrative costs as % of revenue. Includes accounting, HR, insurance, and general office expenses." />
            <SecondaryInput label="Sales & Marketing" value={assumptions.salesPct} placeholder={PLACEHOLDER_VALUES.salesPct} onChange={(v) => handleChange('salesPct', v)} isPercentage tooltip="Sales & Marketing costs as % of revenue. Includes OTA commissions, advertising, and promotional activities." />
            <SecondaryInput label="Property Ops" value={assumptions.maintPct} placeholder={PLACEHOLDER_VALUES.maintPct} onChange={(v) => handleChange('maintPct', v)} isPercentage tooltip="Property operations and maintenance as % of revenue. Includes repairs, landscaping, and general upkeep." />
          </div>
        </section>

        {/* Growth Rates */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-base font-semibold text-slate-700">
              Annual Growth Rates (% p.a.)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <SecondaryInput label="ADR Growth" value={assumptions.adrGrowth} placeholder={PLACEHOLDER_VALUES.adrGrowth} onChange={(v) => handleChange('adrGrowth', v)} isPercentage tooltip="Annual rate increase for room rates. Typically 3-6% in growing markets like Bali." />
            <SecondaryInput label="Fee Growth" value={assumptions.baseFeeGrowth} placeholder={PLACEHOLDER_VALUES.baseFeeGrowth} onChange={(v) => handleChange('baseFeeGrowth', v)} isPercentage tooltip="Annual increase in management fees (CAM, Base, Tech). Usually tied to inflation (3-5%)." />
          </div>
        </section>

        {/* Management Fees - Year 1 Bases */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h3 className="text-base font-semibold text-slate-700">
              Year 1 Management Fees ({currency.code})
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <CurrencyInput label="CAM Fee" value={assumptions.y1CAM} placeholder={PLACEHOLDER_VALUES.y1CAM} onChange={(v) => handleChange('y1CAM', v)} currency={currency} tooltip="Common Area Maintenance fee per year. Covers shared facilities, landscaping, and common area upkeep." />
            <CurrencyInput label="Base Fee" value={assumptions.y1BaseFee} placeholder={PLACEHOLDER_VALUES.y1BaseFee} onChange={(v) => handleChange('y1BaseFee', v)} currency={currency} tooltip="Base management fee per year. Fixed fee paid to property management company." />
            <CurrencyInput label="Tech Fee" value={assumptions.y1TechFee} placeholder={PLACEHOLDER_VALUES.y1TechFee} onChange={(v) => handleChange('y1TechFee', v)} currency={currency} tooltip="Technology fee per year. Covers PMS, booking systems, and IT infrastructure." />
            <SecondaryInput label="Incentive %" value={assumptions.incentiveFeePct} placeholder={PLACEHOLDER_VALUES.incentiveFeePct} onChange={(v) => handleChange('incentiveFeePct', v)} isPercentage tooltip="Incentive fee as % of GOP. Performance-based fee paid when profitability targets are exceeded." />
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
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 ml-0.5">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative group">
        <input
          type="text"
          inputMode="decimal"
          value={value || ''}
          placeholder={placeholder?.toString() || '0'}
          onChange={(e) => {
            const inputVal = sanitizeDecimalInput(e.target.value);
            if (inputVal === '' || inputVal === '.' || inputVal === ',') {
              onChange(0);
            } else {
              const num = parseDecimalInput(inputVal);
              onChange(isNaN(num) ? 0 : num);
            }
          }}
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
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 ml-0.5">
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
