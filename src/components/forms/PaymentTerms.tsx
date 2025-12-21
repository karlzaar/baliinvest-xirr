import type { PaymentTerms as PaymentTermsType, PaymentScheduleEntry } from '../../types/investment';

interface Props {
  data: PaymentTermsType;
  totalPriceIDR: number;
  symbol: string;
  formatDisplay: (idr: number) => string;
  displayToIdr: (display: number) => number;
  idrToDisplay: (idr: number) => number;
  onUpdate: <K extends keyof PaymentTermsType>(key: K, value: PaymentTermsType[K]) => void;
  onRegenerateSchedule: (newMonths?: number) => void;
  onUpdateScheduleEntry: (id: string, updates: Partial<Pick<PaymentScheduleEntry, 'date' | 'amount'>>) => void;
}

export function PaymentTerms({
  data,
  totalPriceIDR,
  symbol,
  formatDisplay,
  displayToIdr,
  idrToDisplay,
  onUpdate,
  onRegenerateSchedule,
  onUpdateScheduleEntry
}: Props) {
  // Fixed 50% down payment - company policy
  const DOWN_PAYMENT_PERCENT = 50;
  const downPaymentIDR = totalPriceIDR * (DOWN_PAYMENT_PERCENT / 100);

  // Use schedule if available, otherwise calculate
  const hasSchedule = data.schedule && data.schedule.length > 0;
  // Calculate actual total from stored schedule amounts in IDR first, then convert
  // This avoids rounding errors from summing individually-converted amounts
  const scheduleTotalIDR = hasSchedule
    ? data.schedule.reduce((sum, entry) => sum + entry.amount, 0)
    : 0;
  const scheduleTotalDisplay = idrToDisplay(scheduleTotalIDR);

  // Expected remaining (50% of total price)
  const expectedRemainingIDR = totalPriceIDR * (1 - DOWN_PAYMENT_PERCENT / 100);
  const expectedRemainingDisplay = idrToDisplay(expectedRemainingIDR);

  const parseAmountInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
        <h2 className="text-xl font-bold text-white">Payment Terms</h2>
      </div>

      {/* Payment Type Selection */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="payment_type"
            checked={data.type === 'full'}
            onChange={() => onUpdate('type', 'full')}
            className="sr-only peer"
          />
          <div className="p-4 rounded-lg border border-border-dark bg-surface-dark peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-text-secondary peer-checked:border-primary flex items-center justify-center">
              {data.type === 'full' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="font-bold text-white">Full Payment</div>
              <div className="text-sm text-text-secondary">100% upon signing</div>
            </div>
          </div>
        </label>

        <label className="cursor-pointer">
          <input
            type="radio"
            name="payment_type"
            checked={data.type === 'plan'}
            onChange={() => onUpdate('type', 'plan')}
            className="sr-only peer"
          />
          <div className="p-4 rounded-lg border border-border-dark bg-surface-dark peer-checked:border-primary peer-checked:bg-primary/10 transition-all flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-text-secondary peer-checked:border-primary flex items-center justify-center">
              {data.type === 'plan' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="font-bold text-white">Payment Plan</div>
              <div className="text-sm text-text-secondary">Split payments until handover</div>
            </div>
          </div>
        </label>
      </div>

      {/* Payment Plan Details */}
      {data.type === 'plan' && (
        <div className="space-y-8">
          {/* Down Payment Section */}
          <div>
            <div className="text-sm text-text-secondary mb-2">
              Down Payment ({DOWN_PAYMENT_PERCENT}%)
            </div>
            <div className="text-3xl font-mono text-white mb-1">
              {symbol} {formatDisplay(downPaymentIDR)}
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4 mt-4 mb-2">
              <div className="flex-1 h-3 bg-surface-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${DOWN_PAYMENT_PERCENT}%` }}
                />
              </div>
              <span className="text-primary font-bold">{DOWN_PAYMENT_PERCENT}%</span>
            </div>
            
            <p className="text-sm text-text-secondary">Due immediately upon signing.</p>
          </div>

          {/* Remaining Payment Schedule */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                <h3 className="font-bold text-white">Remaining Payment Schedule</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={data.installmentMonths}
                  onChange={(e) => {
                    const newMonths = parseInt(e.target.value) || 1;
                    // Atomic update: set months and regenerate schedule in one go
                    onRegenerateSchedule(newMonths);
                  }}
                  className="w-14 rounded bg-surface-dark border border-border-dark px-2 py-1.5 text-white text-sm text-center focus:border-primary focus:outline-none"
                />
                <span className="text-sm text-text-secondary">months</span>
              </div>
            </div>

            {!hasSchedule && totalPriceIDR > 0 && (
              <div className="text-center py-6 text-text-secondary border border-dashed border-border-dark rounded-lg">
                <p className="text-sm">Change the number of months to generate schedule</p>
              </div>
            )}

            {hasSchedule && (
              <div className="rounded-lg border border-border-dark bg-surface-dark overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-xs font-semibold text-text-secondary uppercase bg-[#0d1a12] py-3 px-4 border-b border-border-dark">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5 flex items-center gap-1">
                    Due Date
                    <span className="material-symbols-outlined text-xs opacity-50">edit</span>
                  </div>
                  <div className="col-span-6 text-right flex items-center justify-end gap-1">
                    Amount
                    <span className="material-symbols-outlined text-xs opacity-50">edit</span>
                  </div>
                </div>

                {/* Payment Rows */}
                <div className="max-h-64 overflow-y-auto">
                  {data.schedule.map((entry, i) => {
                    // Show ACTUAL stored amount - preserves manual edits
                    const displayAmount = idrToDisplay(entry.amount);

                    return (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-12 items-center py-2 px-4 ${
                          i < data.schedule.length - 1 ? 'border-b border-border-dark/50' : ''
                        }`}
                      >
                        <div className="col-span-1 text-text-secondary text-sm">{i + 1}</div>
                        <div className="col-span-5">
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => onUpdateScheduleEntry(entry.id, { date: e.target.value })}
                            className="w-full bg-transparent text-white text-sm rounded px-2 py-1 cursor-pointer hover:bg-white/5 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-colors"
                          />
                        </div>
                        <div className="col-span-6 flex items-center justify-end gap-1">
                          <span className="text-text-secondary text-sm">{symbol}</span>
                          <input
                            type="text"
                            value={formatNumber(displayAmount)}
                            onChange={(e) => {
                              const displayValue = parseAmountInput(e.target.value);
                              const idrValue = displayToIdr(displayValue);
                              onUpdateScheduleEntry(entry.id, { amount: idrValue });
                            }}
                            className="w-32 bg-transparent text-white font-mono text-sm text-right rounded px-2 py-1 hover:bg-white/5 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Row */}
                <div className="grid grid-cols-12 items-center py-3 px-4 bg-[#0d1a12] border-t border-border-dark">
                  <div className="col-span-1"></div>
                  <div className="col-span-5 text-text-secondary font-medium text-sm">
                    Total Scheduled
                    {scheduleTotalIDR !== expectedRemainingIDR && (
                      <span className="ml-2 text-xs text-yellow-400" title="Schedule total doesn't match expected 50%">
                        ⚠️ Expected: {symbol} {formatNumber(expectedRemainingDisplay)}
                      </span>
                    )}
                  </div>
                  <div className="col-span-6 text-right">
                    <span className={`font-mono font-bold ${scheduleTotalIDR === expectedRemainingIDR ? 'text-primary' : 'text-yellow-400'}`}>
                      {symbol} {formatNumber(scheduleTotalDisplay)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Payment Details */}
      {data.type === 'full' && (
        <div className="p-4 rounded-lg bg-surface-dark/30 border border-border-dark/50">
          <div className="text-sm text-text-secondary mb-2">Total Due Upon Signing</div>
          <div className="text-3xl font-mono text-white">
            {symbol} {formatDisplay(totalPriceIDR)}
          </div>
          <p className="text-sm text-text-secondary mt-2">Full payment required at contract signing.</p>
        </div>
      )}
    </section>
  );
}
