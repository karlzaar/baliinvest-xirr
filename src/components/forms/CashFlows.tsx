import type { CashFlowEntry } from '../../types/investment';
import { useState } from 'react';

interface Props {
  entries: CashFlowEntry[];
  symbol: string;
  formatDisplay: (idr: number) => string;
  onAdd: (entry: Omit<CashFlowEntry, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CashFlowEntry>) => void;
}

export function CashFlows({ entries, symbol, formatDisplay, onAdd, onRemove, onUpdate }: Props) {
  const [newEntry, setNewEntry] = useState({
    date: '',
    description: '',
    type: 'outflow' as 'inflow' | 'outflow',
    amount: 0
  });

  const parseInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const handleAdd = () => {
    if (newEntry.date && newEntry.description && newEntry.amount > 0) {
      onAdd(newEntry);
      setNewEntry({ date: '', description: '', type: 'outflow', amount: 0 });
    }
  };

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">calendar_month</span>
        <h2 className="text-xl font-bold text-white">Additional Cash Flows</h2>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Add operational costs or rental income during holding period.
      </p>

      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-text-secondary uppercase border-b border-border-dark mb-2">
        <div className="col-span-3">Date</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3 text-right">Amount</div>
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div key={entry.id} className="group grid grid-cols-12 gap-3 items-center rounded-lg bg-surface-dark/50 p-3 hover:bg-surface-dark transition-colors">
            <div className="col-span-3 text-sm text-white">{entry.date}</div>
            <div className="col-span-4 text-sm text-white">{entry.description}</div>
            <div className="col-span-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                entry.type === 'inflow' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {entry.type === 'inflow' ? '+' : '-'}
              </span>
            </div>
            <div className="col-span-3 flex items-center justify-end gap-2">
              <span className="font-mono text-white text-sm">
                {symbol} {formatDisplay(entry.amount)}
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

        {/* New Entry Form */}
        <div className="grid grid-cols-12 gap-3 items-center rounded-lg border border-dashed border-border-dark p-3 mt-2">
          <div className="col-span-3">
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm focus:border-primary"
            />
          </div>
          <div className="col-span-4">
            <input
              type="text"
              placeholder="Description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm focus:border-primary"
            />
          </div>
          <div className="col-span-2">
            <select
              value={newEntry.type}
              onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'inflow' | 'outflow' })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm focus:border-primary"
            >
              <option value="outflow">Out (-)</option>
              <option value="inflow">In (+)</option>
            </select>
          </div>
          <div className="col-span-3">
            <input
              type="text"
              placeholder="Amount"
              value={newEntry.amount > 0 ? formatNumber(newEntry.amount) : ''}
              onChange={(e) => setNewEntry({ ...newEntry, amount: parseInput(e.target.value) })}
              className="w-full rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-sm text-right font-mono focus:border-primary"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Add Entry
      </button>
    </section>
  );
}
