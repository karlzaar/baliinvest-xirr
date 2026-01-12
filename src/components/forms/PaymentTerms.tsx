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
  const downPaymentPercent = data.downPaymentPercent;
  const downPaymentIDR = totalPriceIDR * (downPaymentPercent / 100);

  const hasSchedule = data.schedule && data.schedule.length > 0;
  const scheduleTotalIDR = hasSchedule
    ? data.schedule.reduce((sum, entry) => sum + entry.amount, 0)
    : 0;
  const scheduleTotalDisplay = idrToDisplay(scheduleTotalIDR);

  const expectedRemainingIDR = totalPriceIDR * (1 - downPaymentPercent / 100);
  const expectedRemainingDisplay = idrToDisplay(expectedRemainingIDR);

  const parseAmountInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
        <h2 className="text-xl font-bold text-text-primary">Payment Terms</h2>
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
          <div className="p-4 rounded-lg border border-border bg-surface-alt peer-checked:border-primary peer-checked:bg-primary-light transition-all flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-text-muted flex items-center justify-center">
              {data.type === 'full' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="font-bold text-text-primary">Full Payment</div>
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
          <div className="p-4 rounded-lg border border-border bg-surface-alt peer-checked:border-primary peer-checked:bg-primary-light transition-all flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-text-muted flex items-center justify-center">
              {data.type === 'plan' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
            <div>
              <div className="font-bold text-text-primary">Payment Plan</div>
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
              Down Payment ({downPaymentPercent}%)
            </div>

            {/* Amount Input */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">
                {symbol}
              </span>
              <input
                type="text"
                value={totalPriceIDR > 0 ? formatNumber(idrToDisplay(downPaymentIDR)) : ''}
                onChange={(e) => {
                  const displayValue = parseAmountInput(e.target.value);
                  if (totalPriceIDR > 0) {
                    const newPercent = Math.min(100, Math.max(0, Math.round((displayToIdr(displayValue) / totalPriceIDR) * 100)));
                    onUpdate('downPaymentPercent', newPercent);
                  }
                }}
                placeholder="0"
                className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pl-12 text-2xl text-text-primary font-mono placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Slider */}
            <div className="flex items-center gap-4 mb-2">
              <input
                type="range"
                min="0"
                max="100"
                value={downPaymentPercent}
                onChange={(e) => {
                  const newPercent = parseInt(e.target.value);
                  onUpdate('downPaymentPercent', newPercent);
                }}
                className="flex-1 h-3 bg-border-light rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${downPaymentPercent}%, var(--color-border-light) ${downPaymentPercent}%, var(--color-border-light) 100%)`
                }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={downPaymentPercent}
                onChange={(e) => {
                  const newPercent = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  onUpdate('downPaymentPercent', newPercent);
                }}
                className="w-16 rounded bg-surface-alt border border-border px-2 py-1.5 text-text-primary text-sm text-center font-mono focus:border-primary focus:outline-none"
              />
              <span className="text-primary font-bold">%</span>
            </div>

            <p className="text-sm text-text-secondary">Due immediately upon signing.</p>
          </div>

          {/* Remaining Payment Schedule */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                <h3 className="font-bold text-text-primary">Remaining Payment Schedule</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={data.installmentMonths}
                  onChange={(e) => {
                    const newMonths = parseInt(e.target.value) || 1;
                    onRegenerateSchedule(newMonths);
                  }}
                  className="w-14 rounded bg-surface-alt border border-border px-2 py-1.5 text-text-primary text-sm text-center focus:border-primary focus:outline-none"
                />
                <span className="text-sm text-text-secondary">months</span>
              </div>
            </div>

            {!hasSchedule && totalPriceIDR > 0 && (
              <div className="text-center py-6 text-text-secondary border border-dashed border-border rounded-lg">
                <p className="text-sm">Change the number of months to generate schedule</p>
              </div>
            )}

            {hasSchedule && (
              <div className="rounded-lg border border-border bg-surface-alt overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-xs font-semibold text-text-secondary uppercase bg-background py-3 px-4 border-b border-border">
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
                  {(() => {
                    const displayAmounts: number[] = [];
                    let runningSum = 0;

                    for (let i = 0; i < data.schedule.length; i++) {
                      if (i === data.schedule.length - 1) {
                        displayAmounts.push(scheduleTotalDisplay - runningSum);
                      } else {
                        const amt = idrToDisplay(data.schedule[i].amount);
                        displayAmounts.push(amt);
                        runningSum += amt;
                      }
                    }

                    return data.schedule.map((entry, i) => {
                    const displayAmount = displayAmounts[i];

                    return (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-12 items-center py-2 px-4 ${
                          i < data.schedule.length - 1 ? 'border-b border-border-light' : ''
                        }`}
                      >
                        <div className="col-span-1 text-text-muted text-sm">{i + 1}</div>
                        <div className="col-span-5">
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => onUpdateScheduleEntry(entry.id, { date: e.target.value })}
                            className="w-full bg-transparent text-text-primary text-sm rounded px-2 py-1 cursor-pointer hover:bg-background focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/50 transition-colors"
                          />
                        </div>
                        <div className="col-span-6 flex items-center justify-end gap-1">
                          <span className="text-text-muted text-sm">{symbol}</span>
                          <input
                            type="text"
                            value={formatNumber(displayAmount)}
                            onChange={(e) => {
                              const displayValue = parseAmountInput(e.target.value);
                              const idrValue = displayToIdr(displayValue);
                              onUpdateScheduleEntry(entry.id, { amount: idrValue });
                            }}
                            className="w-32 bg-transparent text-text-primary font-mono text-sm text-right rounded px-2 py-1 hover:bg-background focus:outline-none focus:bg-background focus:ring-1 focus:ring-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>

                {/* Total Row */}
                <div className="grid grid-cols-12 items-center py-3 px-4 bg-background border-t border-border">
                  <div className="col-span-1"></div>
                  <div className="col-span-5 text-text-secondary font-medium text-sm">
                    Total Scheduled
                    {scheduleTotalIDR !== expectedRemainingIDR && (
                      <span className="ml-2 text-xs text-warning" title={`Schedule total doesn't match expected ${100 - downPaymentPercent}%`}>
                        Expected: {symbol} {formatNumber(expectedRemainingDisplay)}
                      </span>
                    )}
                  </div>
                  <div className="col-span-6 text-right">
                    <span className={`font-mono font-bold ${scheduleTotalIDR === expectedRemainingIDR ? 'text-primary' : 'text-warning'}`}>
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
        <div className="p-4 rounded-lg bg-surface-alt border border-border">
          <div className="text-sm text-text-secondary mb-2">Total Due Upon Signing</div>
          <div className="text-3xl font-mono text-text-primary">
            {symbol} {formatDisplay(totalPriceIDR)}
          </div>
          <p className="text-sm text-text-secondary mt-2">Full payment required at contract signing.</p>
        </div>
      )}

      {/* Booking Fee Section */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
          <span className="text-sm font-medium text-text-secondary">Booking Fee (Optional)</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">
                {symbol}
              </span>
              <input
                type="text"
                value={idrToDisplay(data.bookingFee) > 0 ? formatNumber(idrToDisplay(data.bookingFee)) : ''}
                onChange={(e) => {
                  const displayValue = parseAmountInput(e.target.value);
                  const idrValue = displayToIdr(displayValue);
                  onUpdate('bookingFee', idrValue);
                }}
                placeholder="0"
                className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pl-12 text-text-primary font-mono placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted">Date</label>
            <input
              type="date"
              value={data.bookingFeeDate || ''}
              onChange={(e) => onUpdate('bookingFeeDate', e.target.value)}
              className="w-full rounded-lg bg-surface-alt border border-border px-4 py-3 text-text-primary focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Initial fee paid to secure the property. Usually refundable or deducted from total price.
        </p>
      </div>
    </section>
  );
}
