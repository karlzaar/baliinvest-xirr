import { useState } from 'react';
import type { XIRRResult, InvestmentData } from '../../types/investment';
import { Tooltip } from '../ui/Tooltip';
import { useComparison } from '../../lib/comparison-context';
import { MAX_COMPARISONS } from '../../lib/comparison-types';

interface Props {
  result: XIRRResult;
  symbol: string;
  currency: string;
  data: InvestmentData;
  formatDisplay: (idr: number) => string;
  onExportPDF?: () => void;
  onComparisonSaved?: () => void;
  isPaymentValid?: boolean;
  isExporting?: boolean;
}

export function ProjectForecast({ result, symbol, currency, data, formatDisplay, onExportPDF, onComparisonSaved, isPaymentValid = true, isExporting = false }: Props) {
  const { addXIRRComparison, getCount } = useComparison();
  const [saveLabel, setSaveLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);

  const xirrValue = result.rate * 100;
  const xirrPercent = xirrValue.toFixed(1);
  const isPositive = result.rate >= 0;

  // Determine font size based on XIRR value length
  const getXirrFontSize = () => {
    const len = xirrPercent.length;
    if (len <= 4) return 'text-4xl';
    if (len <= 6) return 'text-3xl';
    if (len <= 8) return 'text-2xl';
    return 'text-xl';
  };

  // Format currency with abbreviation for large numbers
  const formatCompact = (value: number): string => {
    const absValue = Math.abs(value);
    const formatted = formatDisplay(absValue);
    // If the formatted string is too long, use abbreviations
    if (formatted.length > 12) {
      if (absValue >= 1e12) return (absValue / 1e12).toFixed(1) + 'T';
      if (absValue >= 1e9) return (absValue / 1e9).toFixed(1) + 'B';
      if (absValue >= 1e6) return (absValue / 1e6).toFixed(1) + 'M';
      if (absValue >= 1e3) return (absValue / 1e3).toFixed(1) + 'K';
    }
    return formatted;
  };

  const getInvestmentRating = () => {
    const xirr = result.rate * 100;
    if (xirr >= 25) return { grade: 'A+', label: 'Excellent' };
    if (xirr >= 20) return { grade: 'A', label: 'Very Good' };
    if (xirr >= 15) return { grade: 'B+', label: 'Good' };
    if (xirr >= 10) return { grade: 'B', label: 'Fair' };
    if (xirr >= 5) return { grade: 'C', label: 'Marginal' };
    return { grade: 'D', label: 'Poor' };
  };

  const handleSaveToCompare = () => {
    if (!showLabelInput) {
      setShowLabelInput(true);
      return;
    }

    const label = saveLabel.trim() || `Calculation ${getCount('xirr') + 1}`;
    const success = addXIRRComparison({
      calculatorType: 'xirr',
      label,
      totalPrice: data.property.totalPrice,
      projectedSalesPrice: data.exit.projectedSalesPrice,
      currency,
      location: data.property.location,
      xirr: result.rate,
      totalInvested: result.totalInvested,
      netProfit: result.netProfit,
      holdPeriodMonths: result.holdPeriodMonths,
      investmentRating: getInvestmentRating(),
    });

    if (success) {
      onComparisonSaved?.();
      setSaveLabel('');
      setShowLabelInput(false);
    }
  };

  const comparisonCount = getCount('xirr');
  const isFull = comparisonCount >= MAX_COMPARISONS;

  return (
    <div className="sticky top-36 flex flex-col gap-6">
      {/* Main Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-bold text-text-primary">Project Forecast</h3>

        {/* XIRR Display */}
        <div className="mb-6 rounded-lg bg-primary-light p-4 text-center border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-sm text-text-secondary">Estimated XIRR</p>
            <Tooltip text="Extended Internal Rate of Return - measures the annualized return of your investment accounting for irregular cash flows and timing. Higher is better." />
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className={`${getXirrFontSize()} font-black ${isPositive ? 'text-primary' : 'text-negative'} break-all`}>
              {xirrPercent}%
            </span>
            <span className={`text-xs flex items-center ${isPositive ? 'text-primary' : 'text-negative'}`}>
              <span className="material-symbols-outlined text-sm">
                {isPositive ? 'trending_up' : 'trending_down'}
              </span>
              Annualized
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2 gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-text-secondary">Total Invested</span>
              <Tooltip text="Sum of all cash outflows including down payment, installments, and additional costs." />
            </div>
            <span className="text-sm font-mono text-text-primary truncate text-right" title={`${symbol} ${formatDisplay(result.totalInvested)}`}>
              {symbol} {formatCompact(result.totalInvested)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-2 gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-text-secondary">Net Profit</span>
              <Tooltip text="Your total return after deducting all investments and closing costs from the projected sale price." />
            </div>
            <span className={`text-sm font-mono truncate text-right ${result.netProfit >= 0 ? 'text-primary' : 'text-negative'}`} title={`${result.netProfit >= 0 ? '+' : ''}${symbol} ${formatDisplay(Math.abs(result.netProfit))}`}>
              {result.netProfit >= 0 ? '+' : ''}{symbol} {formatCompact(result.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Investment Period</span>
              <Tooltip text="Time from your first payment date until the projected sale date." />
            </div>
            <span className="text-sm text-text-primary">{result.holdPeriodMonths} Months</span>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6">
          <button
            onClick={onExportPDF}
            disabled={!isPaymentValid || isExporting}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-bold transition-colors ${
              isPaymentValid && !isExporting
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isExporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">picture_as_pdf</span>
                Export PDF Report
              </>
            )}
          </button>
          {!isPaymentValid && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Fix payment validation errors before exporting
            </p>
          )}
        </div>

        {/* Save to Compare */}
        <div className="mt-4 pt-4 border-t border-border">
          {showLabelInput ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Enter label (optional)"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:border-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveToCompare()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveToCompare}
                  className="flex-1 bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowLabelInput(false); setSaveLabel(''); }}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-text-muted hover:bg-surface-alt transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSaveToCompare}
              disabled={isFull}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                isFull
                  ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                  : 'bg-primary-light text-primary hover:bg-primary/20'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>{isFull ? 'Comparison Full' : 'Save to Compare'}</span>
              <span className="ml-1 text-xs opacity-70">({comparisonCount}/{MAX_COMPARISONS})</span>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-surface-alt p-4 border border-border">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-text-muted">info</span>
          <p className="text-xs text-text-muted">
            XIRR calculation uses irregular intervals. All values stored in IDR internally.
          </p>
        </div>
      </div>
    </div>
  );
}
