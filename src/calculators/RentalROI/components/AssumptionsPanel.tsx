
import type { Assumptions, CurrencyConfig } from '../types';
import { PLACEHOLDER_VALUES } from '../constants';

interface Props {
  assumptions: Assumptions;
  onChange: (a: Assumptions) => void;
  currency: CurrencyConfig;
}

const AssumptionsPanel = ({ assumptions, onChange }: Props) => {
  const handleChange = (field: keyof Assumptions, value: any) => {
    onChange({ ...assumptions, [field]: value });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-12 mt-12 mb-4">
      <div className="flex items-center gap-4 mb-16">
        <div className="w-1.5 h-7 bg-slate-200 rounded-full"></div>
        <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.25em]">Operational Dynamics & Growth Variables</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-16">
        {/* Cost Structure */}
        <section className="space-y-10">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">
              Operating Cost Basis (% Revenue)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <SecondaryInput label="ROOMS COST" value={assumptions.roomsCostPct} placeholder={PLACEHOLDER_VALUES.roomsCostPct} onChange={(v) => handleChange('roomsCostPct', v)} isPercentage />
            <SecondaryInput label="F&B COST" value={assumptions.fbCostPct} placeholder={PLACEHOLDER_VALUES.fbCostPct} onChange={(v) => handleChange('fbCostPct', v)} isPercentage />
            <SecondaryInput label="WELLNESS" value={assumptions.spaCostPct} placeholder={PLACEHOLDER_VALUES.spaCostPct} onChange={(v) => handleChange('spaCostPct', v)} isPercentage />
            <SecondaryInput label="UTILITIES" value={assumptions.utilitiesPct} placeholder={PLACEHOLDER_VALUES.utilitiesPct} onChange={(v) => handleChange('utilitiesPct', v)} isPercentage />
          </div>
        </section>

        {/* Growth & Fee Escalation */}
        <section className="space-y-10">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">
              Growth & Fee Escalation (% p.a.)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-10">
            <SecondaryInput label="ADR GROWTH" value={assumptions.adrGrowth} placeholder={PLACEHOLDER_VALUES.adrGrowth} onChange={(v) => handleChange('adrGrowth', v)} isPercentage />
            <SecondaryInput label="BASE FEE GROWTH" value={assumptions.baseFeeGrowth} placeholder={PLACEHOLDER_VALUES.baseFeeGrowth} onChange={(v) => handleChange('baseFeeGrowth', v)} isPercentage />
            <SecondaryInput label="SALES & MKT %" value={assumptions.salesPct} placeholder={PLACEHOLDER_VALUES.salesPct} onChange={(v) => handleChange('salesPct', v)} isPercentage />
            <SecondaryInput label="ADMIN & GEN %" value={assumptions.adminPct} placeholder={PLACEHOLDER_VALUES.adminPct} onChange={(v) => handleChange('adminPct', v)} isPercentage />
          </div>
        </section>
      </div>
    </div>
  );
};

const SecondaryInput: React.FC<{
  label: string;
  value: number;
  placeholder?: number;
  onChange: (v: number) => void;
  isPercentage?: boolean;
}> = ({ label, value, placeholder, onChange, isPercentage }) => {
  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-tighter ml-0.5">
        {label}
      </label>
      <div className="relative group">
        <input
          type="number"
          step="0.1"
          value={value || ''}
          placeholder={placeholder?.toString() || '0'}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-[#fcfdfe] border border-slate-200 rounded-2xl px-6 py-5 text-[17px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all tabular-nums"
        />
        {isPercentage && (
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-300">%</span>
        )}
      </div>
    </div>
  );
};

export default AssumptionsPanel;
