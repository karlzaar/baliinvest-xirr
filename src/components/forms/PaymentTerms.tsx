import type { PaymentTerms as PaymentTermsType } from '../../types/investment';

interface Props {
  data: PaymentTermsType;
  totalPriceIDR: number;
  symbol: string;
  formatDisplay: (idr: number) => string;
  onUpdate: <K extends keyof PaymentTermsType>(key: K, value: PaymentTermsType[K]) => void;
}

export function PaymentTerms({ data, totalPriceIDR, symbol, formatDisplay, onUpdate }: Props) {
  const downPaymentIDR = totalPriceIDR * (data.downPaymentPercent / 100);
  const remainingIDR = totalPriceIDR - downPaymentIDR;
  const monthlyIDR = data.installmentMonths > 0 ? remainingIDR / data.installmentMonths : 0;

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + data.installmentMonths);
  const endDateStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <section className="rounded-xl border border-border-dark bg-[#102216] p-6 shadow-sm relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
      <div className="mb-6 flex items-center gap-2 border-b border-border-dark pb-4">
        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
        <h2 className="text-xl font-bold text-white">Payment Terms</h2>
      </div>

      {/* Payment Type */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="payment_type"
            checked={data.type === 'full'}
            onChange={() => onUpdate('type', 'full')}
            className="sr-only peer"
          />
          <div className="p-4 rounded-lg border border-border-dark bg-surface-dark peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
            <div className="font-bold text-white text-sm">Full Payment</div>
            <div className="text-xs text-text-secondary mt-0.5">100% upon signing</div>
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
          <div className="p-4 rounded-lg border border-border-dark bg-surface-dark peer-checked:border-primary peer-checked:bg-primary/10 transition-all">
            <div className="font-bold text-white text-sm">Payment Plan</div>
            <div className="text-xs text-text-secondary mt-0.5">Split payments</div>
          </div>
        </label>
      </div>

      {/* Payment Plan Details */}
      {data.type === 'plan' && (
        <div className="space-y-6">
          {/* Down Payment */}
          <div className="p-4 rounded-lg bg-surface-dark/30 border border-border-dark/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-secondary">
                Down Payment ({data.downPaymentPercent}%)
              </span>
              <span className="font-mono text-white">
                {symbol} {formatDisplay(downPaymentIDR)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={data.downPaymentPercent}
                onChange={(e) => onUpdate('downPaymentPercent', parseInt(e.target.value))}
                className="flex-1 h-2 bg-surface-dark rounded-full appearance-none cursor-pointer accent-primary"
              />
              <span className="text-sm font-bold text-primary w-12 text-right">
                {data.downPaymentPercent}%
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-2">Due immediately upon signing</p>
          </div>

          {/* Installments */}
          <div className="rounded-lg border border-border-dark bg-surface-dark overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-semibold text-text-secondary uppercase bg-[#112217] py-2 px-4 border-b border-border-dark">
              <div>Schedule</div>
              <div className="text-center">Breakdown</div>
              <div className="text-right">Per Month</div>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Monthly until {endDateStr}</p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={data.installmentMonths}
                    onChange={(e) => onUpdate('installmentMonths', parseInt(e.target.value) || 1)}
                    className="w-16 rounded bg-surface-dark border border-border-dark px-2 py-1 text-white text-xs focus:border-primary"
                  />
                  <span className="text-xs text-text-secondary">installments</span>
                </div>
              </div>
              
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {((100 - data.downPaymentPercent) / data.installmentMonths).toFixed(1)}% / mo
              </span>
              
              <span className="font-mono text-white text-sm">
                {symbol} {formatDisplay(monthlyIDR)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
