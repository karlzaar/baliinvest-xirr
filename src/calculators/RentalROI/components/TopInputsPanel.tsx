
import { useState, useEffect, useRef } from 'react';
import type { Assumptions, CurrencyConfig } from '../types';
import { PLACEHOLDER_VALUES } from '../constants';
import { Tooltip } from '../../../components/ui/Tooltip';
import { parseDecimalInput, sanitizeDecimalInput } from '../../../utils/numberParsing';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthYearPickerProps {
  value: string; // YYYY-MM format
  onChange: (value: string) => void;
  minYear: number;
  maxYear: number;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange, minYear, maxYear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => {
    if (value) {
      const [year] = value.split('-');
      return parseInt(year);
    }
    return minYear;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const currentMonth = value ? parseInt(value.split('-')[1]) - 1 : -1;
  const currentYear = value ? parseInt(value.split('-')[0]) : -1;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, '0');
    onChange(`${selectedYear}-${month}`);
    setIsOpen(false);
  };

  const displayValue = value
    ? `${MONTHS[currentMonth]} ${currentYear}`
    : 'Select date';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-w-[160px]"
      >
        <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? 'text-white' : 'text-text-muted'}>{displayValue}</span>
        <svg className={`w-4 h-4 text-text-muted ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 min-w-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Year selector */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <button
              type="button"
              onClick={() => setSelectedYear(Math.max(minYear, selectedYear - 1))}
              disabled={selectedYear <= minYear}
              className="p-1.5 rounded-lg hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-bold text-white">{selectedYear}</span>
            <button
              type="button"
              onClick={() => setSelectedYear(Math.min(maxYear, selectedYear + 1))}
              disabled={selectedYear >= maxYear}
              className="p-1.5 rounded-lg hover:bg-surface-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((month, idx) => {
              const isSelected = currentMonth === idx && currentYear === selectedYear;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthSelect(idx)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : 'text-text-secondary hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="flex justify-between mt-4 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-text-muted hover:text-text-secondary transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                onChange(`${now.getFullYear()}-${month}`);
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-primary hover:text-indigo-700 transition-colors"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  currency: CurrencyConfig;
}

const TopInputsPanel: React.FC<Props> = ({ assumptions, onChange, currency }) => {
  const [showOccupancyGrowth, setShowOccupancyGrowth] = useState(false);

  // Helper to derive baseYear from purchaseDate
  const getBaseYear = (purchaseDate: string) => {
    if (purchaseDate) {
      const [year] = purchaseDate.split('-').map(Number);
      return year;
    }
    return new Date().getFullYear();
  };

  const handleChange = (field: keyof Assumptions, value: any) => {
    let updatedAssumptions = { ...assumptions, [field]: value };

    // When propertyReadyDate changes, pre-fill occupancy increases with 0 for pre-operational years
    if (field === 'propertyReadyDate' && value) {
      const [readyYear] = value.split('-').map(Number);
      const baseYear = getBaseYear(assumptions.purchaseDate);

      // Calculate which years are before the property becomes operational
      // occupancyIncreases[0] = Y2, [1] = Y3, etc.
      const newOccupancyIncreases = [...assumptions.occupancyIncreases];
      for (let i = 0; i < 9; i++) {
        const yearForIndex = baseYear + i + 1; // Y2 = baseYear + 1, Y3 = baseYear + 2, etc.
        if (yearForIndex < readyYear) {
          newOccupancyIncreases[i] = 0;
        }
      }
      updatedAssumptions.occupancyIncreases = newOccupancyIncreases;
    }

    // When purchaseDate changes and propertyReadyDate is set, recalculate pre-filled zeros
    if (field === 'purchaseDate' && assumptions.propertyReadyDate && !assumptions.isPropertyReady) {
      const [readyYear] = assumptions.propertyReadyDate.split('-').map(Number);
      const newBaseYear = getBaseYear(value);

      const newOccupancyIncreases = [...assumptions.occupancyIncreases];
      for (let i = 0; i < 9; i++) {
        const yearForIndex = newBaseYear + i + 1;
        if (yearForIndex < readyYear) {
          newOccupancyIncreases[i] = 0;
        } else if (assumptions.occupancyIncreases[i] === 0) {
          // Reset previously zeroed values if they're now operational years
          newOccupancyIncreases[i] = null;
        }
      }
      updatedAssumptions.occupancyIncreases = newOccupancyIncreases;
    }

    // When isPropertyReady is set to true (checkbox unchecked), clear the pre-filled zeros
    if (field === 'isPropertyReady' && value === true) {
      // Reset occupancy increases to null (will use placeholders)
      updatedAssumptions.occupancyIncreases = [null, null, null, null, null, null, null, null, null];
      updatedAssumptions.propertyReadyDate = '';
    }

    onChange(updatedAssumptions);
  };

  const handleOccupancyIncreaseChange = (index: number, value: number | null) => {
    const newIncreases = [...assumptions.occupancyIncreases];
    newIncreases[index] = value;
    handleChange('occupancyIncreases', newIncreases);
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm mb-8">
      <div className="mb-6 flex items-center border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">savings</span>
          <h2 className="text-xl font-bold text-white">Investment Overview</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Core Investment Section */}
        <section className="space-y-6">
          <h3 className="text-base font-semibold text-text-secondary mb-4">Core Investment</h3>
          <div className="grid grid-cols-1 gap-6">
            <TopInputGroup
              label={`Initial Capex (${currency.code})`}
              value={assumptions.initialInvestment}
              placeholder={PLACEHOLDER_VALUES.initialInvestment}
              onChange={(v) => handleChange('initialInvestment', v)}
              currency={currency}
              icon={currency.symbol}
              autoFocus
              tooltip="Total capital expenditure including property purchase price, construction costs, furniture, and setup fees."
            />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
                  Purchase Date
                  <Tooltip text="The date when investment begins. Year 1 projections start from this year." />
                </label>
                <MonthYearPicker
                  value={assumptions.purchaseDate}
                  onChange={(value) => handleChange('purchaseDate', value)}
                  minYear={new Date().getFullYear() - 5}
                  maxYear={new Date().getFullYear() + 10}
                />
              </div>
              <TopInputGroup
                label="Keys (Units)"
                value={assumptions.keys}
                placeholder={PLACEHOLDER_VALUES.keys}
                onChange={(v) => handleChange('keys', Math.max(1, Math.round(v)))}
                noSeparator
                tooltip="Number of rental units/keys in the property. Used to calculate room revenue and per-unit fees."
              />
            </div>
          </div>
        </section>

        {/* First Operational Year Section */}
        <section className="space-y-6">
          <h3 className="text-base font-semibold text-text-secondary mb-4">First Operational Year</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
            <TopInputGroup
              label="Occupancy %"
              value={assumptions.y1Occupancy}
              placeholder={PLACEHOLDER_VALUES.y1Occupancy}
              onChange={(v) => handleChange('y1Occupancy', v)}
              isPercentage
              tooltip="Percentage of available room nights that are booked in Year 1. New properties typically start at 50-60%."
            />
            <TopInputGroup
              label={`ADR (${currency.code})`}
              value={assumptions.y1ADR}
              placeholder={PLACEHOLDER_VALUES.y1ADR}
              onChange={(v) => handleChange('y1ADR', v)}
              currency={currency}
              tooltip="Average Daily Rate - the average price per room night. This is your nightly rate before any discounts."
            />
            <TopInputGroup
              label="F&B Base"
              value={assumptions.y1FB}
              placeholder={PLACEHOLDER_VALUES.y1FB}
              onChange={(v) => handleChange('y1FB', v)}
              currency={currency}
              tooltip="Year 1 Food & Beverage revenue from restaurant, in-room dining, and minibar services."
            />
            <TopInputGroup
              label="Wellness Base"
              value={assumptions.y1Spa}
              placeholder={PLACEHOLDER_VALUES.y1Spa}
              onChange={(v) => handleChange('y1Spa', v)}
              currency={currency}
              tooltip="Year 1 Spa & Wellness revenue from massage, treatments, yoga classes, and wellness packages."
            />
          </div>

          <button
            onClick={() => setShowOccupancyGrowth(!showOccupancyGrowth)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-primary/10 hover:bg-primary/20 text-primary font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-transparent"
          >
            Configure Yearly Step-ups
            <svg className={`w-3.5 h-3.5 transition-transform ${showOccupancyGrowth ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </section>
      </div>

      {showOccupancyGrowth && (
        <div className="mt-8 pt-8 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Property Readiness */}
          <div className="mb-8 p-5 bg-surface-alt rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!assumptions.isPropertyReady}
                  onChange={(e) => handleChange('isPropertyReady', !e.target.checked)}
                  className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-text-secondary">Property is not ready yet</span>
              </label>
              <Tooltip text="Check this if the property is still under construction or not yet operational. The ready date will affect Year 1 occupancy calculations." />
            </div>

            {!assumptions.isPropertyReady && (
              <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-medium text-text-muted">Property Ready Date:</label>
                <MonthYearPicker
                  value={assumptions.propertyReadyDate}
                  onChange={(value) => handleChange('propertyReadyDate', value)}
                  minYear={getBaseYear(assumptions.purchaseDate)}
                  maxYear={getBaseYear(assumptions.purchaseDate) + 10}
                />
                {assumptions.propertyReadyDate && (
                  <span className="text-xs text-text-muted bg-surface px-3 py-1.5 rounded-lg border border-border">
                    Occupancy adjusted until property is ready
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-6">
            <h4 className="text-sm font-semibold text-text-secondary">Yearly Occupancy Point Increase</h4>
            <Tooltip text="Percentage points added to occupancy each year. E.g., if Y1 is 55% and Y2 increase is 4%, then Y2 occupancy becomes 59%." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {assumptions.occupancyIncreases.map((val, idx) => (
              <OccupancyIncreaseInput
                key={idx}
                index={idx}
                value={val}
                placeholder={PLACEHOLDER_VALUES.occupancyIncreases[idx] ?? 0}
                onChange={handleOccupancyIncreaseChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OccupancyIncreaseInput: React.FC<{
  index: number;
  value: number | null;
  placeholder: number;
  onChange: (index: number, value: number | null) => void;
}> = ({ index, value, placeholder, onChange }) => {
  const [inputValue, setInputValue] = useState<string>(value !== null ? value.toString() : '');

  useEffect(() => {
    if (value === null) {
      setInputValue('');
    } else if (parseFloat(inputValue) !== value) {
      setInputValue(value.toString());
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeDecimalInput(raw);
    setInputValue(sanitized);

    if (sanitized === '' || sanitized === '.' || sanitized === ',') {
      onChange(index, null);
    } else {
      const num = parseDecimalInput(sanitized);
      if (!isNaN(num)) {
        onChange(index, num);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-muted">Y{index + 2}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          placeholder={placeholder.toString()}
          onChange={handleInputChange}
          className="w-full bg-surface-alt/50 border border-border rounded-xl px-3 py-2 text-[13px] font-bold text-white placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">%</span>
      </div>
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
  autoFocus?: boolean;
  tooltip?: string;
}> = ({ label, value, placeholder, onChange, isPercentage, noSeparator, icon, currency, autoFocus, tooltip }) => {
  const displayValue = currency ? (value / currency.rate) : value;
  const displayPlaceholder = currency && placeholder ? (placeholder / currency.rate) : (placeholder || 0);
  const [inputValue, setInputValue] = useState<string>(displayValue ? displayValue.toString() : '');
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef<number>(value);

  // Only sync from props when value changes externally (not from user typing)
  // This prevents the useEffect from overwriting user input during typing
  useEffect(() => {
    // Skip if user is actively typing (focused) and this is our own change
    if (isFocused && value === lastValueRef.current) {
      return;
    }
    lastValueRef.current = value;

    if (displayValue === 0 || !displayValue) {
      setInputValue('');
    } else {
      const formatted = (isPercentage || noSeparator)
        ? displayValue.toString()
        : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(displayValue);
      // Only apply formatting if not focused (user not typing)
      if (!isFocused) {
        setInputValue(formatted);
      }
    }
  }, [displayValue, isPercentage, noSeparator, isFocused, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // For currency inputs, allow commas as thousand separators; for percentages, allow as decimal
    const sanitized = isPercentage || noSeparator
      ? sanitizeDecimalInput(raw)
      : raw.replace(/[^0-9.,]/g, '');
    setInputValue(sanitized);

    // Allow comma as decimal separator for all fields
    const num = parseDecimalInput(sanitized);

    if (!isNaN(num)) {
      const modelValue = currency ? (num * currency.rate) : num;
      lastValueRef.current = modelValue;
      onChange(modelValue);
    } else if (sanitized === '' || sanitized === ',' || sanitized === '.') {
      lastValueRef.current = 0;
      onChange(0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format the number on blur for nice display
    if (displayValue === 0 || !displayValue) {
      setInputValue('');
    } else {
      const formatted = (isPercentage || noSeparator)
        ? displayValue.toString()
        : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(displayValue);
      setInputValue(formatted);
    }
  };

  const placeholderText = (isPercentage || noSeparator)
    ? displayPlaceholder.toString()
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(displayPlaceholder);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-text-muted">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <div className="relative group">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-text-muted pointer-events-none group-focus-within:text-primary transition-colors">{icon}</span>
        )}
        <input
          type="text"
          value={inputValue}
          placeholder={placeholderText}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          className="w-full bg-surface-alt/50 border border-border rounded-2xl py-4 text-[16px] font-bold text-white placeholder:text-text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all tabular-nums"
          style={{ paddingLeft: icon ? '2.75rem' : '1.25rem', paddingRight: '1rem' }}
        />
        {isPercentage && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-text-muted">%</span>
        )}
      </div>
    </div>
  );
};

export default TopInputsPanel;
