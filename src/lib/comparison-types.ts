// Comparison Feature Types

export type CalculatorType = 'rental-roi' | 'xirr';

export interface ComparisonMetrics {
  // Common
  label: string;
  timestamp: number;
  calculatorType: CalculatorType;
}

export interface RentalROIComparisonData extends ComparisonMetrics {
  calculatorType: 'rental-roi';
  // Key inputs
  initialInvestment: number;
  y1ADR: number;
  y1Occupancy: number;
  currency: string;
  // Key outputs
  avgROI: number;
  totalRevenue: number;
  totalProfit: number;
  paybackYears: number;
  avgGopMargin: number;
  investmentRating: {
    grade: string;
    label: string;
  };
}

export interface XIRRComparisonData extends ComparisonMetrics {
  calculatorType: 'xirr';
  // Key inputs
  totalPrice: number;
  projectedSalesPrice: number;
  currency: string;
  location: string;
  // Key outputs
  xirr: number;
  totalInvested: number;
  netProfit: number;
  holdPeriodMonths: number;
  investmentRating: {
    grade: string;
    label: string;
  };
}

export type ComparisonData = RentalROIComparisonData | XIRRComparisonData;

export interface ComparisonState {
  rentalROI: RentalROIComparisonData[];
  xirr: XIRRComparisonData[];
}

export const MAX_COMPARISONS = 5;
