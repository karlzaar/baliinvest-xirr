export interface PropertyDetails {
  projectName: string;
  location: string;
  totalPrice: number;  // Always stored in IDR
  propertySize: number;  // Size in square meters (sqm)
  purchaseDate: string;
  handoverDate: string;
  currency: 'IDR' | 'USD' | 'AUD' | 'EUR' | 'GBP' | 'INR' | 'CNY' | 'AED' | 'RUB';
}

export interface PaymentScheduleEntry {
  id: string;
  date: string;
  amount: number;  // Always stored in IDR
}

export interface PaymentTerms {
  type: 'full' | 'plan';
  downPaymentPercent: number;
  installmentMonths: number;
  schedule: PaymentScheduleEntry[];  // Individual payment entries
  bookingFee: number;  // Initial booking fee in IDR (paid upfront, separate from down payment)
  bookingFeeDate: string;  // Date when booking fee is paid
}

export type ExitStrategyType = 'flip' | 'rent-resell' | 'milk-cow';

export interface ExitStrategy {
  strategyType: ExitStrategyType;
  projectedSalesPrice: number;  // Always stored in IDR
  closingCostPercent: number;
  holdPeriodYears: number;      // Expected hold period based on strategy
  saleDate: string;             // Projected sale date
}

export interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  type: 'inflow' | 'outflow';
  amount: number;  // Always stored in IDR
}

export interface InvestmentData {
  property: PropertyDetails;
  payment: PaymentTerms;
  exit: ExitStrategy;
  additionalCashFlows: CashFlowEntry[];
}

export interface XIRRResult {
  rate: number;
  totalInvested: number;  // In IDR
  netProfit: number;      // In IDR
  holdPeriodMonths: number;
}

export interface CashFlow {
  date: Date;
  amount: number;  // In IDR
}
