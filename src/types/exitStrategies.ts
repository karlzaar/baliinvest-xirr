import type { ExitStrategyType } from './investment';

export interface ExitStrategyOption {
  id: ExitStrategyType;
  name: string;
  subtitle: string;
  description: string;
  roi: string;
  roiLabel: string;
  duration: string;
  durationLabel: string;
  defaultHoldYears: number;
  defaultAppreciation: number; // percentage
  features: Array<{
    icon: string;
    text: string;
  }>;
  color: 'cyan' | 'purple' | 'amber';
}

export const EXIT_STRATEGIES: ExitStrategyOption[] = [
  {
    id: 'flip',
    name: 'Flip at Completion',
    subtitle: 'Short-term Arbitrage',
    description: 'Buy during pre-construction and sell immediately upon handover. Capitalizes on the price appreciation gap.',
    roi: '35-50%',
    roiLabel: 'Proj. ROI',
    duration: 'At Handover',
    durationLabel: 'Sale Date',
    defaultHoldYears: 0,
    defaultAppreciation: 40,
    features: [
      { icon: 'trending_up', text: 'Quick capital recycling' },
      { icon: 'block', text: 'Zero operational mgmt' },
      { icon: 'payments', text: 'Maximize annualized returns' },
    ],
    color: 'cyan',
  },
];

