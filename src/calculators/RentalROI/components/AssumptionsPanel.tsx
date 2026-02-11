
import { useState, useEffect } from 'react';
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
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm mt-6 mb-4">
      <div className="mb-6 flex items-center border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h2 className="text-xl font-bold text-white">Operational Assumptions</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
        {/* Cost Structure */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <h3 className="text-base font-semibold text-text-secondary">
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
            <h3 className="text-base font-semibold text-text-secondary">
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
            <h3 className="text-base font-semibold text-text-secondary">
              Annual Growth Rates (% p.a.)
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-x-8 gap-y-10">
            <SecondaryInput label="ADR Growth" value={assumptions.adrGrowth} placeholder={PLACEHOLDER_VALUES.adrGrowth} onChange={(v) => handleChange('adrGrowth', v)} isPercentage tooltip="Annual rate increase for room rates. Typically 3-6% in growing markets like Bali." />
            <SecondaryInput label="F&B Growth" value={assumptions.fbGrowth} placeholder={PLACEHOLDER_VALUES.fbGrowth} onChange={(v) => handleChange('fbGrowth', v)} isPercentage tooltip="Annual growth rate for Food & Beverage revenue. Typically 2-4%." />
            <SecondaryInput label="Wellness Growth" value={assumptions.spaGrowth} placeholder={PLACEHOLDER_VALUES.spaGrowth} onChange={(v) => handleChange('spaGrowth', v)} isPercentage tooltip="Annual growth rate for Spa/Wellness revenue. Typically 2-5%." />
            <SecondaryInput label="CAM Growth" value={assumptions.camGrowth} placeholder={PLACEHOLDER_VALUES.camGrowth} onChange={(v) => handleChange('camGrowth', v)} isPercentage tooltip="Annual increase in CAM (Common Area Maintenance) fees. Usually 2-3%." />
            <SecondaryInput label="Base Fee Growth" value={assumptions.baseFeeGrowth} placeholder={PLACEHOLDER_VALUES.baseFeeGrowth} onChange={(v) => handleChange('baseFeeGrowth', v)} isPercentage tooltip="Annual increase in base management fee. Usually tied to inflation (2-4%)." />
            <SecondaryInput label="Tech Fee Growth" value={assumptions.techFeeGrowth} placeholder={PLACEHOLDER_VALUES.techFeeGrowth} onChange={(v) => handleChange('techFeeGrowth', v)} isPercentage tooltip="Annual increase in technology/platform fee. Usually 2-4%." />
          </div>
        </section>

        {/* Management Fees */}
        <section className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h3 className="text-base font-semibold text-text-secondary">
              Management Fees
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <CurrencyInput label="CAM Fee/Unit/Mo" value={assumptions.camFeePerUnit} placeholder={PLACEHOLDER_VALUES.camFeePerUnit} onChange={(v) => handleChange('camFeePerUnit', v)} currency={currency} tooltip="Monthly CAM fee per unit. Formula: CAM × 12 × keys. Only charged when property is operational." />
            <SecondaryInput label="Base Fee %" value={assumptions.baseFeePercent} placeholder={PLACEHOLDER_VALUES.baseFeePercent} onChange={(v) => handleChange('baseFeePercent', v)} isPercentage tooltip="Base management fee as % of total revenue (first operational year), then grows with fee growth rate." />
            <CurrencyInput label="Tech Fee/Unit/Mo" value={assumptions.techFeePerUnit} placeholder={PLACEHOLDER_VALUES.techFeePerUnit} onChange={(v) => handleChange('techFeePerUnit', v)} currency={currency} tooltip="Monthly tech fee per unit. Formula: Tech × 12 × keys. Charged even during development phase." />
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
  const [inputValue, setInputValue] = useState<string>(value ? value.toString() : '');

  useEffect(() => {
    if (value === 0 || !value) {
      setInputValue('');
    } else if (parseFloat(inputValue.replace(',', '.')) !== value) {
      setInputValue(value.toString());
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeDecimalInput(raw);
    setInputValue(sanitized);

    if (sanitized === '' || sanitized === '.' || sanitized === ',') {
      onChange(0);
    } else {
      const num = parseDecimalInput(sanitized);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

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
          value={inputValue}
          placeholder={placeholder?.toString() || '0'}
          onChange={handleInputChange}
          className="w-full bg-[#fcfdfe] border border-border rounded-2xl px-6 py-5 text-[17px] font-bold text-white placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-surface transition-all tabular-nums"
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
  const displayPlaceholder = placeholder ? (placeholder / currency.rate) : 0;
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value / currency.rate);
  });

  useEffect(() => {
    if (value === 0 || !value) {
      setInputValue('');
    } else {
      // Only update if the numeric value changed (not just formatting)
      const currentNum = parseDecimalInput(inputValue);
      const newDisplayValue = value / currency.rate;
      if (Math.abs(currentNum - newDisplayValue) > 0.001) {
        setInputValue(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(newDisplayValue));
      }
    }
  }, [value, currency.rate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits, commas, and periods
    const sanitized = raw.replace(/[^0-9.,]/g, '');
    setInputValue(sanitized);

    const num = parseDecimalInput(sanitized);
    if (!isNaN(num)) {
      onChange(num * currency.rate);
    } else if (sanitized === '' || sanitized === ',' || sanitized === '.') {
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
          inputMode="decimal"
          value={inputValue}
          placeholder={formatNumber(displayPlaceholder)}
          onChange={handleInputChange}
          className="w-full bg-[#fcfdfe] border border-border rounded-2xl pl-12 pr-6 py-5 text-[17px] font-bold text-white placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-surface transition-all tabular-nums"
        />
      </div>
    </div>
  );
};

export default AssumptionsPanel;
