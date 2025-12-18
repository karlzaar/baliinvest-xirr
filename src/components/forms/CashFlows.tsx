import type { CashFlowEntry } from '../../types/investment';
import { useState } from 'react';

interface Props {
  entries: CashFlowEntry[];
  currencySymbol: string;
  formatAmount: (idrAmount: number) => string;
  toDisplayCurrency: (idrAmount: number) => number;
  onAdd: (entry: Omit<CashFlowEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CashFlowEntry>) => void;
  onAmountChange: (id: string, displayAmount: number) => void;
}

export function CashFlows({ 
  entries, 
  currencySymbol, 
  formatAmount,
  toDisplayCurrency,
  onAdd, 
  onRemove, 
  onUpdate,
  onAmountChange
}: Props) {
  const [newEntry, setNewEntry] = useState({
    date: '',
    description: '',
    type: 'outflow' as 'inflow' | 'outflow',
    amount: 0
  });

  const handleAddEntry = () => {
    if (newEntry.date && newEntry.description && newEntry.amount > 0) {
      onAdd(newEntry);
      setNewEntry({
        date: '',
        description: '',
        type: 'outflow',
        amount: 0
      });
    }
  };

  const parseNumber = (str: string): number => {
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
  };

  const formatDisplayNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  };

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">calendar_month</span>
          <h2 className="text-xl font-bold text-white">Additional Cash Flows</h2>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-white transition-colors">
          <span className="material-symbols-outlined text-lg">upload_file</span>
          Import CSV
        </button>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Add any operational costs or rental income expected during the holding period.
      </p>

      {/* Header Row */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-dark mb-2">
        <div className="col-span-3">Date</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3 text-right">Amount</div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Existing Entries */}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group relative grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-lg bg-surface-dark/50 border border-transparent hover:border-border-dark p-3 transition-all"
          >
            <div className="md:col-span-3">
              <input
                type="date"
                value={entry.date}
                onChange={(e) => onUpdate(entry.id, { date: e.target.value })}
                className="w-full bg-transparent text-white border-none p-0 focus:ring-0 text-sm h-auto"
              />
            </div>
            <div className="md:col-span-4">
              <input
                type="text"
                value={entry.description}
                onChange={(e) => onUpdate(entry.id, { description: e.target.value })}
                className="w-full bg-transparent text-white border-none p-0 focus:ring-0 text-sm placeholder-text-secondary/50"
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={() => onUpdate(entry.id, { type: entry.type === 'inflow' ? 'outflow' : 'inflow' })}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  entry.type === 'inflow'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {entry.type === 'inflow' ? 'Inflow' : 'Outflow'}
              </button>
            </div>
            <div className="md:col-span-3 flex items-center justify-end gap-3">
              <span className="font-mono text-white text-sm">
                {entry.type === 'inflow' ? '+' : '-'}{currencySymbol} {formatAmount(entry.amount)}
              </span>
              <button
                onClick={() => onRemove(entry.id)}
                className="text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}

        {/* New Entry Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-lg border border-dashed border-border-dark p-3 bg-surface-dark/20 mt-2">
          <div className="md:col-span-3">
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-4">
            <input
              type="text"
              placeholder="Description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <select
              value={newEntry.type}
              onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'inflow' | 'outflow' })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="inflow">Inflow (+)</option>
              <option value="outflow">Outflow (-)</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Amount"
              value={newEntry.amount > 0 ? formatDisplayNumber(newEntry.amount) : ''}
              onChange={(e) => setNewEntry({ ...newEntry, amount: parseNumber(e.target.value) })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm text-right font-mono focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleAddEntry}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Add Entry
      </button>
    </section>
  );
}
