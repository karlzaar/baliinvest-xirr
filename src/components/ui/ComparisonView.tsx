import { useState } from 'react';
import { useComparison } from '../../lib/comparison-context';
import type { CalculatorType } from '../../lib/comparison-types';
import { MAX_COMPARISONS } from '../../lib/comparison-types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  calculatorType: CalculatorType;
}

const formatCurrency = (value: number, currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', AUD: 'A$', GBP: '£', INR: '₹', CNY: '¥', AED: 'د.إ', RUB: '₽', IDR: 'Rp',
  };
  const symbol = symbols[currency] || currency;
  if (value >= 1_000_000_000) {
    return `${symbol} ${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${symbol} ${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${symbol} ${(value / 1_000).toFixed(1)}K`;
  }
  return `${symbol} ${value.toLocaleString()}`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRatingColor = (grade: string): string => {
  if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-50';
  if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
  if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const getBestWorst = (values: number[], higherIsBetter: boolean): { best: number; worst: number } => {
  const sorted = [...values].sort((a, b) => higherIsBetter ? b - a : a - b);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
};

const getValueClass = (value: number, best: number, worst: number): string => {
  if (value === best) return 'text-emerald-600 font-bold';
  if (value === worst && best !== worst) return 'text-red-500';
  return '';
};

export function ComparisonView({ isOpen, onClose, calculatorType }: Props) {
  const { comparisons, removeComparison, updateLabel, clearAll } = useComparison();
  const [editingLabel, setEditingLabel] = useState<number | null>(null);
  const [labelValue, setLabelValue] = useState('');

  if (!isOpen) return null;

  const data = calculatorType === 'rental-roi' ? comparisons.rentalROI : comparisons.xirr;

  const handleEditLabel = (timestamp: number, currentLabel: string) => {
    setEditingLabel(timestamp);
    setLabelValue(currentLabel);
  };

  const handleSaveLabel = (timestamp: number) => {
    updateLabel(calculatorType, timestamp, labelValue);
    setEditingLabel(null);
  };

  const renderRentalROIComparison = () => {
    const items = comparisons.rentalROI;
    if (items.length === 0) {
      return (
        <div className="text-center py-16 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold mb-2">No calculations saved yet</p>
          <p className="text-sm">Use "Save to Compare" on your Rental ROI calculations to add them here</p>
        </div>
      );
    }

    // Calculate best/worst for each metric
    const roiValues = items.map(i => i.avgROI);
    const profitValues = items.map(i => i.totalProfit);
    const paybackValues = items.map(i => i.paybackYears);
    const gopValues = items.map(i => i.avgGopMargin);

    const roiBW = getBestWorst(roiValues, true);
    const profitBW = getBestWorst(profitValues, true);
    const paybackBW = getBestWorst(paybackValues, false);
    const gopBW = getBestWorst(gopValues, true);

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider w-48">Metric</th>
              {items.map((item) => (
                <th key={item.timestamp} className="text-center py-3 px-4 min-w-[150px]">
                  <div className="flex flex-col items-center gap-1">
                    {editingLabel === item.timestamp ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={labelValue}
                          onChange={(e) => setLabelValue(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-slate-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveLabel(item.timestamp)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditLabel(item.timestamp, item.label)}
                        className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        {item.label}
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400">{formatDate(item.timestamp)}</span>
                    <button
                      onClick={() => removeComparison('rental-roi', item.timestamp)}
                      className="text-red-400 hover:text-red-600 transition-colors mt-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <MetricRow
              label="Investment Rating"
              items={items}
              render={(item) => (
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRatingColor(item.investmentRating.grade)}`}>
                  {item.investmentRating.grade}
                </span>
              )}
            />
            <MetricRow
              label="Initial Investment"
              items={items}
              render={(item) => formatCurrency(item.initialInvestment, item.currency)}
            />
            <MetricRow
              label="Year 1 ADR"
              items={items}
              render={(item) => formatCurrency(item.y1ADR, item.currency)}
            />
            <MetricRow
              label="Year 1 Occupancy"
              items={items}
              render={(item) => `${item.y1Occupancy}%`}
            />
            <MetricRow
              label="10-Year Avg ROI"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.avgROI, roiBW.best, roiBW.worst)}>
                  {item.avgROI.toFixed(2)}%
                </span>
              )}
            />
            <MetricRow
              label="Total Revenue (10Y)"
              items={items}
              render={(item) => formatCurrency(item.totalRevenue, item.currency)}
            />
            <MetricRow
              label="Total Profit (10Y)"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.totalProfit, profitBW.best, profitBW.worst)}>
                  {formatCurrency(item.totalProfit, item.currency)}
                </span>
              )}
            />
            <MetricRow
              label="Payback Period"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.paybackYears, paybackBW.best, paybackBW.worst)}>
                  {item.paybackYears.toFixed(1)} years
                </span>
              )}
            />
            <MetricRow
              label="Avg GOP Margin"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.avgGopMargin, gopBW.best, gopBW.worst)}>
                  {item.avgGopMargin.toFixed(1)}%
                </span>
              )}
            />
          </tbody>
        </table>
      </div>
    );
  };

  const renderXIRRComparison = () => {
    const items = comparisons.xirr;
    if (items.length === 0) {
      return (
        <div className="text-center py-16 text-slate-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold mb-2">No calculations saved yet</p>
          <p className="text-sm">Use "Save to Compare" on your XIRR calculations to add them here</p>
        </div>
      );
    }

    // Calculate best/worst
    const xirrValues = items.map(i => i.xirr);
    const profitValues = items.map(i => i.netProfit);
    const holdValues = items.map(i => i.holdPeriodMonths);

    const xirrBW = getBestWorst(xirrValues, true);
    const profitBW = getBestWorst(profitValues, true);
    const holdBW = getBestWorst(holdValues, false);

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider w-48">Metric</th>
              {items.map((item) => (
                <th key={item.timestamp} className="text-center py-3 px-4 min-w-[150px]">
                  <div className="flex flex-col items-center gap-1">
                    {editingLabel === item.timestamp ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={labelValue}
                          onChange={(e) => setLabelValue(e.target.value)}
                          className="w-24 px-2 py-1 text-xs border border-slate-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveLabel(item.timestamp)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditLabel(item.timestamp, item.label)}
                        className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        {item.label}
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400">{formatDate(item.timestamp)}</span>
                    <button
                      onClick={() => removeComparison('xirr', item.timestamp)}
                      className="text-red-400 hover:text-red-600 transition-colors mt-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <MetricRow
              label="Investment Rating"
              items={items}
              render={(item) => (
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRatingColor(item.investmentRating.grade)}`}>
                  {item.investmentRating.grade}
                </span>
              )}
            />
            <MetricRow
              label="Location"
              items={items}
              render={(item) => item.location || '-'}
            />
            <MetricRow
              label="Purchase Price"
              items={items}
              render={(item) => formatCurrency(item.totalPrice, item.currency)}
            />
            <MetricRow
              label="Projected Sale"
              items={items}
              render={(item) => formatCurrency(item.projectedSalesPrice, item.currency)}
            />
            <MetricRow
              label="XIRR"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.xirr, xirrBW.best, xirrBW.worst)}>
                  {(item.xirr * 100).toFixed(2)}%
                </span>
              )}
            />
            <MetricRow
              label="Total Invested"
              items={items}
              render={(item) => formatCurrency(item.totalInvested, item.currency)}
            />
            <MetricRow
              label="Net Profit"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.netProfit, profitBW.best, profitBW.worst)}>
                  {formatCurrency(item.netProfit, item.currency)}
                </span>
              )}
            />
            <MetricRow
              label="Hold Period"
              items={items}
              render={(item) => (
                <span className={getValueClass(item.holdPeriodMonths, holdBW.best, holdBW.worst)}>
                  {item.holdPeriodMonths} months
                </span>
              )}
            />
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Compare {calculatorType === 'rental-roi' ? 'Rental ROI' : 'XIRR'} Calculations
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {data.length} of {MAX_COMPARISONS} slots used
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data.length > 0 && (
              <button
                onClick={() => clearAll(calculatorType)}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {calculatorType === 'rental-roi' ? renderRentalROIComparison() : renderXIRRComparison()}
        </div>

        {/* Legend */}
        {data.length > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center gap-6 text-xs">
            <span className="text-slate-500 font-medium">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Best value</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="text-slate-600">Worst value</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for table rows
function MetricRow<T>({
  label,
  items,
  render,
}: {
  label: string;
  items: T[];
  render: (item: T) => React.ReactNode;
}) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 font-medium text-slate-700 text-sm">{label}</td>
      {items.map((item, idx) => (
        <td key={idx} className="py-3 px-4 text-center text-sm text-slate-900">
          {render(item)}
        </td>
      ))}
    </tr>
  );
}
