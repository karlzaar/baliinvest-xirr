export interface PropertyDetails {
  projectName: string;
  location: string;
  totalPrice: number;  // Always stored in IDR
  handoverDate: string;
  currency: 'IDR' | 'USD' | 'AUD' | 'EUR';
}

export interface PaymentTerms {
  type: 'full' | 'plan';
  downPaymentPercent: number;
  installmentMonths: number;
}

export interface ExitStrategy {
  projectedSalesPrice: number;  // Always stored in IDR
  closingCostPercent: number;
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
