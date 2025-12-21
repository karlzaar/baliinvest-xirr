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
    duration: '3-6 Mo',
    durationLabel: 'Duration',
    defaultHoldYears: 0.5,
    defaultAppreciation: 40,
    features: [
      { icon: 'trending_up', text: 'Quick capital recycling' },
      { icon: 'block', text: 'Zero operational mgmt' },
      { icon: 'payments', text: 'Maximize annualized returns' },
    ],
    color: 'cyan',
  },
  {
    id: 'rent-resell',
    name: 'Rent & Resell',
    subtitle: 'Balanced Hybrid',
    description: 'Operate the villa to recover capital through yields, then sell as a turnkey business with proven cash flow.',
    roi: '20-25%',
    roiLabel: 'Target IRR',
    duration: '5-7 Years',
    durationLabel: 'Timeframe',
    defaultHoldYears: 6,
    defaultAppreciation: 25,
    features: [
      { icon: 'verified', text: '"Proof of Concept" premium' },
      { icon: 'currency_exchange', text: 'Recover capital via rent' },
      { icon: 'balance', text: 'Balanced risk/reward' },
    ],
    color: 'purple',
  },
  {
    id: 'milk-cow',
    name: 'Milk the Cow',
    subtitle: 'Recurring Income',
    description: 'Hold indefinitely to collect recurring rental income until leasehold expires. Maximizes cash-on-cash return.',
    roi: '12-16%',
    roiLabel: 'Avg Yield',
    duration: '25+ Years',
    durationLabel: 'Horizon',
    defaultHoldYears: 25,
    defaultAppreciation: 15,
    features: [
      { icon: 'indeterminate_question_box', text: 'Passive income machine' },
      { icon: 'real_estate_agent', text: 'Leverage for financing' },
      { icon: 'hourglass_top', text: 'Retirement planning' },
    ],
    color: 'amber',
  },
];

