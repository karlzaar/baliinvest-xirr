import type { ReactElement } from 'react';
import type { PaymentTerms as PaymentTermsType, PaymentScheduleEntry } from '../../types/investment';
import { Tooltip } from '../ui/Tooltip';
import { parseDecimalInput, sanitizeDecimalInput } from '../../utils/numberParsing';

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
  isPaymentValid?: boolean;
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
  onUpdateScheduleEntry,
  isPaymentValid = true
}: Props) {
  const downPaymentPercent = data.downPaymentPercent;
  const downPaymentIDR = totalPriceIDR * (downPaymentPercent / 100);

  const hasSchedule = data.schedule && data.schedule.length > 0;

  const parseAmountInput = (value: string): number => {
    const digits = value.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
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

      {/* Booking Fee Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
          <span className="text-sm font-medium text-text-secondary">Booking Fee (Optional)</span>
          <Tooltip text="Initial deposit to reserve the property. Usually refundable or deducted from total price. This is your first cash outflow." />
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
                placeholder={totalPriceIDR > 0 ? "0" : "Enter total price first"}
                disabled={totalPriceIDR === 0}
                className={`w-full rounded-lg bg-surface-alt border border-border px-4 py-3 pl-12 text-2xl text-text-primary font-mono placeholder:text-text-muted focus:border-primary focus:outline-none ${totalPriceIDR === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            {totalPriceIDR === 0 && (
              <p className="text-xs text-amber-600 mb-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Enter the total property price above to set down payment amount
              </p>
            )}

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
                type="text"
                inputMode="decimal"
                value={downPaymentPercent}
                onChange={(e) => {
                  const inputVal = sanitizeDecimalInput(e.target.value);
                  if (inputVal === '' || inputVal === '.' || inputVal === ',') {
                    onUpdate('downPaymentPercent', 0);
                  } else {
                    const num = parseDecimalInput(inputVal);
                    const newPercent = Math.min(100, Math.max(0, isNaN(num) ? 0 : num));
                    onUpdate('downPaymentPercent', newPercent);
                  }
                }}
                className="w-16 rounded bg-surface-alt border border-border px-2 py-1.5 text-text-primary text-sm text-center font-mono focus:border-primary focus:outline-none"
              />
              <span className="text-primary font-bold">%</span>
            </div>

            <p className="text-sm text-text-secondary">Due immediately upon signing.</p>
          </div>

          {/* Full Payment Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">event_note</span>
                <h3 className="font-bold text-text-primary">Payment Schedule</h3>
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
                <span className="text-sm text-text-secondary">installments</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Complete payment breakdown showing booking fee, down payment, and installments.
            </p>

            {totalPriceIDR > 0 && (
              <div className="rounded-lg border border-border bg-surface-alt overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-xs font-semibold text-text-secondary uppercase bg-background py-3 px-4 border-b border-border">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-4">Due Date</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>

                {/* Payment Rows */}
                <div className="max-h-80 overflow-y-auto">
                  {(() => {
                    const bookingFeeIDR = data.bookingFee || 0;
                    const remainingDownPaymentIDR = Math.max(0, downPaymentIDR - bookingFeeIDR);
                    const installmentTotalIDR = totalPriceIDR - bookingFeeIDR - remainingDownPaymentIDR;

                    let rowNumber = 0;
                    const rows: ReactElement[] = [];

                    // 1. Booking Fee (if any)
                    if (bookingFeeIDR > 0) {
                      rowNumber++;
                      rows.push(
                        <div key="booking-fee" className="grid grid-cols-12 items-center py-2 px-4 border-b border-border-light bg-amber-50/50">
                          <div className="col-span-1 text-text-muted text-sm">{rowNumber}</div>
                          <div className="col-span-3">
                            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Booking Fee</span>
                          </div>
                          <div className="col-span-4 text-text-primary text-sm">
                            {data.bookingFeeDate ? formatDate(data.bookingFeeDate) : 'Date not set'}
                          </div>
                          <div className="col-span-4 flex items-center justify-end gap-1">
                            <span className="text-text-muted text-sm">{symbol}</span>
                            <span className="font-mono text-sm text-text-primary">{formatNumber(idrToDisplay(bookingFeeIDR))}</span>
                          </div>
                        </div>
                      );
                    }

                    // 2. Down Payment (remaining after booking fee)
                    if (remainingDownPaymentIDR > 0) {
                      rowNumber++;
                      rows.push(
                        <div key="down-payment" className="grid grid-cols-12 items-center py-2 px-4 border-b border-border-light bg-blue-50/50">
                          <div className="col-span-1 text-text-muted text-sm">{rowNumber}</div>
                          <div className="col-span-3">
                            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Down Payment</span>
                          </div>
                          <div className="col-span-4 text-text-primary text-sm">
                            Upon signing
                          </div>
                          <div className="col-span-4 flex items-center justify-end gap-1">
                            <span className="text-text-muted text-sm">{symbol}</span>
                            <span className="font-mono text-sm text-text-primary">{formatNumber(idrToDisplay(remainingDownPaymentIDR))}</span>
                          </div>
                        </div>
                      );
                    }

                    // 3. Installments
                    if (hasSchedule && installmentTotalIDR > 0) {
                      const numInstallments = data.schedule.length;
                      const baseInstallment = Math.floor(installmentTotalIDR / numInstallments);
                      const remainder = installmentTotalIDR - (baseInstallment * numInstallments);

                      data.schedule.forEach((entry, i) => {
                        rowNumber++;
                        const isLast = i === numInstallments - 1;
                        const installmentAmount = isLast ? baseInstallment + remainder : baseInstallment;

                        rows.push(
                          <div
                            key={entry.id}
                            className={`grid grid-cols-12 items-center py-2 px-4 ${
                              i < data.schedule.length - 1 ? 'border-b border-border-light' : ''
                            }`}
                          >
                            <div className="col-span-1 text-text-muted text-sm">{rowNumber}</div>
                            <div className="col-span-3">
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Installment {i + 1}</span>
                            </div>
                            <div className="col-span-4">
                              <input
                                type="date"
                                value={entry.date}
                                onChange={(e) => onUpdateScheduleEntry(entry.id, { date: e.target.value })}
                                className="w-full bg-background/50 border border-transparent text-text-primary text-sm rounded-md px-2 py-1.5 cursor-pointer hover:border-primary/50 hover:bg-background focus:outline-none focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                              />
                            </div>
                            <div className="col-span-4 flex items-center justify-end gap-1">
                              <span className="text-text-muted text-sm">{symbol}</span>
                              <span className="font-mono text-sm text-text-primary">{formatNumber(idrToDisplay(installmentAmount))}</span>
                            </div>
                          </div>
                        );
                      });
                    }

                    return rows;
                  })()}
                </div>

                {/* Total Row */}
                <div className="grid grid-cols-12 items-center py-3 px-4 bg-background border-t border-border">
                  <div className="col-span-1"></div>
                  <div className="col-span-7 text-text-secondary font-medium text-sm">
                    Total Investment
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="font-mono font-bold text-primary">
                      {symbol} {formatNumber(idrToDisplay(totalPriceIDR))}
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

      {/* Payment Validation Error */}
      {!isPaymentValid && data.type === 'plan' && totalPriceIDR > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <div>
              <p className="text-sm font-medium text-red-700">Payment amounts don't match total price</p>
              <p className="text-xs text-red-600 mt-1">
                Down payment ({downPaymentPercent}%) + scheduled payments must equal the total property price.
                Adjust the schedule or regenerate it to fix this.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
