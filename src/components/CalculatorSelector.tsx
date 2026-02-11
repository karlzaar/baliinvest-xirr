import type { CalculatorConfig } from '../calculators/types';

interface Props {
  calculators: CalculatorConfig[];
  activeId: string;
  onSelect: (id: string) => void;
}

const COLOR_CLASSES: Record<CalculatorConfig['color'], { bg: string; text: string; border: string; activeBg: string }> = {
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    activeBg: 'bg-green-500/20',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    activeBg: 'bg-indigo-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    activeBg: 'bg-orange-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    activeBg: 'bg-cyan-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    activeBg: 'bg-purple-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    activeBg: 'bg-rose-500/20',
  },
};

export function CalculatorSelector({ calculators, activeId, onSelect }: Props) {
  return (
    <div className="bg-surface/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20">
        <div className="flex items-center gap-3 py-2 overflow-x-auto scrollbar-hide">
          {calculators.map((calc) => {
            const isActive = calc.id === activeId;
            const colors = COLOR_CLASSES[calc.color];

            return (
              <button
                key={calc.id}
                onClick={() => onSelect(calc.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                  transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? `glass-panel ${colors.text} border-primary/30`
                    : 'text-text-muted hover:text-text-secondary hover:bg-surface/50'
                  }
                `}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? colors.text : 'text-text-muted'}`}>
                  {calc.icon}
                </span>
                <span>{calc.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
