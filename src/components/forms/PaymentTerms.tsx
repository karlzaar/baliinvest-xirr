import type { PaymentTerms as PaymentTermsType } from '../../types/investment';

interface Props {
  data: PaymentTermsType;
  totalPriceIDR: number;
  currencySymbol: string;
  formatAmount: (idrAmount: number) => string;
  onUpdate: <K extends keyof PaymentTermsType>(key: K, value: PaymentTermsType[K]) => void;
}

export function PaymentTerms({ data, totalPriceIDR, currencySymbol, formatAmount, onUpdate }: Props) {
  const downPaymentIDR = totalPriceIDR * (data.downPaymentPercent / 100);
  const remainingIDR = totalPriceIDR - downPaymentIDR;
  const monthlyIDR = data.installmentMonths > 0 ? remainingIDR / data.installmentMonths : 0;

  // Calculate end date based on installments
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + data.installmentMonths);
  const endDateStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
      <div className="mb-6 flex items-center justify-between border-b border-border-dark pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          <h2 className="text-xl font-bold text-white">Payment Terms</h2>
        </div>
      </div>

      {/* Payment Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <label className="cursor-pointer relative group">
          <input
            type="radio"
            name="payment_type"
            checked={data.type === 'full'}
            onChange={() => onUpdate('type', 'full')}
            className="radio-card-input sr-only"
          />
          <div className="radio-card-content p-4 rounded-lg border border-border-dark bg-surface-dark hover:border-primary/50 transition-all h-full flex items-center gap-3">
            <div className="radio-indicator w-5 h-5 rounded-full border-2 border-text-secondary flex items-center justify-center flex-shrink-0 transition-colors">
              <div className="w-2.5 h-2.5 bg-background-dark rounded-full opacity-0 transition-opacity" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Full Payment</div>
              <div className="text-xs text-text-secondary mt-0.5">100% upon signing</div>
            </div>
          </div>
        </label>

        <label className="cursor-pointer relative group">
          <input
            type="radio"
            name="payment_type"
            checked={data.type === 'plan'}
            onChange={() => onUpdate('type', 'plan')}
            className="radio-card-input sr-only"
          />
          <div className="radio-card-content p-4 rounded-lg border border-border-dark bg-surface-dark hover:border-primary/50 transition-all h-full flex items-center gap-3">
            <div className="radio-indicator w-5 h-5 rounded-full border-2 border-text-secondary flex items-center justify-center flex-shrink-0 transition-colors">
              <div className="w-2.5 h-2.5 bg-[#112217] rounded-full opacity-0 transition-opacity" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Payment Plan</div>
              <div className="text-xs text-text-secondary mt-0.5">Split payments until handover</div>
            </div>
          </div>
        </label>
      </div>

      {/* Payment Plan Details */}
      {data.type === 'plan' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Down Payment Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg bg-surface-dark/30 border border-border-dark/50">
            <div>
              <span className="block text-sm font-medium text-text-secondary mb-1">
                Down Payment ({data.downPaymentPercent}%)
              </span>
              <div className="flex items-center gap-2 text-white font-mono text-lg font-semibold">
                <span className="text-text-secondary font-normal">{currencySymbol}</span>
                {formatAmount(downPaymentIDR)}
              </div>
              <p className="text-xs text-text-secondary mt-2">Due immediately upon signing.</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={data.downPaymentPercent}
                onChange={(e) => onUpdate('downPaymentPercent', parseInt(e.target.value))}
                className="flex-1 h-2.5 bg-surface-dark rounded-full appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-bold text-primary w-12 text-right">
                {data.downPaymentPercent}%
              </span>
            </div>
          </div>

          {/* Installment Schedule */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-text-secondary">calendar_clock</span>
              Remaining Payment Schedule
            </h3>
            
            <div className="rounded-lg border border-border-dark bg-surface-dark overflow-hidden">
              <div className="grid grid-cols-12 text-xs font-semibold text-text-secondary uppercase bg-[#112217] py-2 px-4 border-b border-border-dark">
                <div className="col-span-4">Schedule</div>
                <div className="col-span-4 text-center">Breakdown</div>
                <div className="col-span-4 text-right">Amount / Month</div>
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">Monthly until {endDateStr}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={data.installmentMonths}
                      onChange={(e) => onUpdate('installmentMonths', parseInt(e.target.value) || 1)}
                      className="w-16 rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-xs focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-text-secondary">Installments</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {((100 - data.downPaymentPercent) / data.installmentMonths).toFixed(1)}% per month
                  </span>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-mono text-white">{currencySymbol} {formatAmount(monthlyIDR)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
