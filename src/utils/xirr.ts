import type { CashFlow, InvestmentData, XIRRResult, CashFlowEntry } from '../types/investment';

/**
 * Calculate XIRR using Newton-Raphson method
 * XIRR = Internal Rate of Return for irregular cash flows
 */
export function calculateXIRR(cashFlows: CashFlow[], guess: number = 0.1): number {
  if (cashFlows.length < 2) return 0;
  
  const maxIterations = 100;
  const tolerance = 1e-7;
  
  // Sort cash flows by date
  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const firstDate = sorted[0].date;
  
  // Convert dates to years from first date
  const yearFractions = sorted.map(cf => 
    (cf.date.getTime() - firstDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
  );
  const amounts = sorted.map(cf => cf.amount);
  
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivativeNpv = 0;
    
    for (let j = 0; j < amounts.length; j++) {
      const t = yearFractions[j];
      const discountFactor = Math.pow(1 + rate, -t);
      npv += amounts[j] * discountFactor;
      derivativeNpv -= t * amounts[j] * Math.pow(1 + rate, -t - 1);
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate;
    }
    
    if (derivativeNpv === 0) {
      return NaN;
    }
    
    const newRate = rate - npv / derivativeNpv;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    
    rate = newRate;
    
    // Prevent divergence
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }
  
  return rate;
}

/**
 * Generate payment schedule based on investment data
 * All amounts are in IDR
 */
export function generatePaymentSchedule(data: InvestmentData): CashFlow[] {
  const cashFlows: CashFlow[] = [];
  const { property, payment, exit, additionalCashFlows } = data;
  
  const today = new Date();
  const handoverDate = new Date(property.handoverDate);
  
  if (payment.type === 'full') {
    // Full payment upfront
    cashFlows.push({
      date: today,
      amount: -property.totalPrice
    });
  } else {
    // Payment plan
    const downPayment = property.totalPrice * (payment.downPaymentPercent / 100);
    const remaining = property.totalPrice - downPayment;
    const monthlyPayment = remaining / payment.installmentMonths;
    
    // Down payment today
    cashFlows.push({
      date: today,
      amount: -downPayment
    });
    
    // Monthly installments
    for (let i = 1; i <= payment.installmentMonths; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      // Don't exceed handover date
      if (paymentDate <= handoverDate) {
        cashFlows.push({
          date: paymentDate,
          amount: -monthlyPayment
        });
      }
    }
  }
  
  // Add additional cash flows (furniture, rental income, etc.)
  additionalCashFlows.forEach((cf: CashFlowEntry) => {
    cashFlows.push({
      date: new Date(cf.date),
      amount: cf.type === 'inflow' ? cf.amount : -cf.amount
    });
  });
  
  // Exit: Sale at handover + closing costs
  const closingCosts = exit.projectedSalesPrice * (exit.closingCostPercent / 100);
  cashFlows.push({
    date: handoverDate,
    amount: exit.projectedSalesPrice - closingCosts
  });
  
  return cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate full XIRR result with metrics
 * All amounts are in IDR
 */
export function calculateInvestmentReturn(data: InvestmentData): XIRRResult {
  const cashFlows = generatePaymentSchedule(data);
  const rate = calculateXIRR(cashFlows);
  
  // Calculate totals
  const outflows = cashFlows.filter(cf => cf.amount < 0);
  const inflows = cashFlows.filter(cf => cf.amount > 0);
  
  const totalInvested = Math.abs(outflows.reduce((sum, cf) => sum + cf.amount, 0));
  const totalReturns = inflows.reduce((sum, cf) => sum + cf.amount, 0);
  const netProfit = totalReturns - totalInvested;
  
  // Calculate hold period
  const firstDate = cashFlows[0]?.date || new Date();
  const lastDate = cashFlows[cashFlows.length - 1]?.date || new Date();
  const holdPeriodMonths = Math.round(
    (lastDate.getTime() - firstDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  
  return {
    rate: isNaN(rate) ? 0 : rate,
    totalInvested,
    netProfit,
    holdPeriodMonths
  };
}

/**
 * Format currency in Indonesian Rupiah
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format currency with abbreviation (B for billion, M for million)
 */
export function formatIDRAbbreviated(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}M`;
  }
  return formatIDR(amount);
}

/**
 * Parse formatted currency string to number
 */
export function parseIDR(formatted: string): number {
  return parseInt(formatted.replace(/[^0-9-]/g, ''), 10) || 0;
}
