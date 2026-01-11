
import { useState, useEffect } from 'react';
import type { Assumptions, CurrencyConfig } from '../types';
import { PLACEHOLDER_VALUES } from '../constants';

interface Props {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  currency: CurrencyConfig;
}

const TopInputsPanel: React.FC<Props> = ({ assumptions, onChange, currency }) => {
  const [showOccupancyGrowth, setShowOccupancyGrowth] = useState(false);

  const handleChange = (field: keyof Assumptions, value: any) => {
    onChange({ ...assumptions, [field]: value });
  };

  const handleOccupancyIncreaseChange = (index: number, value: number) => {
    const newIncreases = [...assumptions.occupancyIncreases];
    newIncreases[index] = value;
    handleChange('occupancyIncreases', newIncreases);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Core Investment Section */}
        <section className="space-y-6">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4">Core Investment</h3>
          <div className="grid grid-cols-1 gap-6">
            <TopInputGroup
              label={`Initial Capex (${currency.code})`}
              value={assumptions.initialInvestment}
              placeholder={PLACEHOLDER_VALUES.initialInvestment}
              onChange={(v) => handleChange('initialInvestment', v)}
              currency={currency}
              icon={currency.symbol}
            />
            <TopInputGroup
              label="Start Year"
              value={assumptions.baseYear}
              placeholder={PLACEHOLDER_VALUES.baseYear}
              onChange={(v) => handleChange('baseYear', v)}
              noSeparator
              active
            />
          </div>
        </section>

        {/* Year 1 Targets Section */}
        <section className="space-y-6">
          <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em] mb-4">Year 1 Targets</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
            <TopInputGroup
              label="Occupancy %"
              value={assumptions.y1Occupancy}
              placeholder={PLACEHOLDER_VALUES.y1Occupancy}
              onChange={(v) => handleChange('y1Occupancy', v)}
              isPercentage
            />
            <TopInputGroup
              label={`ADR (${currency.code})`}
              value={assumptions.y1ADR}
              placeholder={PLACEHOLDER_VALUES.y1ADR}
              onChange={(v) => handleChange('y1ADR', v)}
              currency={currency}
            />
            <TopInputGroup
              label="F&B Base"
              value={assumptions.y1FB}
              placeholder={PLACEHOLDER_VALUES.y1FB}
              onChange={(v) => handleChange('y1FB', v)}
              currency={currency}
            />
            <TopInputGroup
              label="Wellness Base"
              value={assumptions.y1Spa}
              placeholder={PLACEHOLDER_VALUES.y1Spa}
              onChange={(v) => handleChange('y1Spa', v)}
              currency={currency}
            />
          </div>

          <button
            onClick={() => setShowOccupancyGrowth(!showOccupancyGrowth)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-[#f5f8ff] hover:bg-[#ebf1ff] text-[#4f46e5] font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-transparent"
          >
            Configure Yearly Step-ups
            <svg className={`w-3.5 h-3.5 transition-transform ${showOccupancyGrowth ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </section>
      </div>

      {showOccupancyGrowth && (
        <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Yearly Occupancy Point Increase</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {assumptions.occupancyIncreases.map((val, idx) => (
              <div key={idx} className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase">Y{idx + 2}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={val || ''}
                    placeholder={PLACEHOLDER_VALUES.occupancyIncreases[idx]?.toString() || '0'}
                    onChange={(e) => handleOccupancyIncreaseChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#fcfdfe] border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-bold text-slate-900 placeholder:text-slate-300 focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] outline-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TopInputGroup: React.FC<{
  label: string;
  value: number;
  placeholder?: number;
  onChange: (v: number) => void;
  isPercentage?: boolean;
  noSeparator?: boolean;
  icon?: string;
  currency?: CurrencyConfig;
  active?: boolean;
}> = ({ label, value, placeholder, onChange, isPercentage, noSeparator, icon, currency, active }) => {
  const displayValue = currency ? (value / currency.rate) : value;
  const displayPlaceholder = currency && placeholder ? (placeholder / currency.rate) : (placeholder || 0);
  const [inputValue, setInputValue] = useState<string>(displayValue ? displayValue.toString() : '');

  useEffect(() => {
    if (displayValue === 0 || !displayValue) {
      setInputValue('');
    } else {
      const formatted = (isPercentage || noSeparator)
        ? displayValue.toString()
        : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(displayValue);
      setInputValue(formatted);
    }
  }, [displayValue, isPercentage, noSeparator]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    setInputValue(e.target.value);
    const num = parseFloat(rawValue);
    if (!isNaN(num)) {
      const modelValue = currency ? (num * currency.rate) : num;
      onChange(modelValue);
    } else if (rawValue === '') {
      onChange(0);
    }
  };

  const placeholderText = (isPercentage || noSeparator)
    ? displayPlaceholder.toString()
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(displayPlaceholder);

  return (
    <div className="space-y-2">
      <label className={`block text-[10px] font-black uppercase tracking-widest ${active ? 'text-[#4f46e5]' : 'text-slate-600'}`}>
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-slate-300 pointer-events-none group-focus-within:text-[#4f46e5] transition-colors">{icon}</span>
        )}
        <input
          type="text"
          value={inputValue}
          placeholder={placeholderText}
          onChange={handleInputChange}
          className={`w-full bg-[#fcfdfe] border ${active ? 'border-[#4f46e5] ring-1 ring-[#4f46e5]' : 'border-slate-200'} rounded-2xl ${icon ? 'pl-11 pr-4' : 'px-5'} py-4 text-[16px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all tabular-nums`}
        />
        {isPercentage && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-300">%</span>
        )}
      </div>
    </div>
  );
};

export default TopInputsPanel;
