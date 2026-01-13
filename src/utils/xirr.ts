import type { CashFlow, InvestmentData, XIRRResult, CashFlowEntry } from '../types/investment';

/**
 * Calculate XIRR using Newton-Raphson method
 * XIRR = Internal Rate of Return for irregular cash flows
 */
export function calculateXIRR(cashFlows: CashFlow[], guess: number = 0.1): number {
  if (cashFlows.length < 2) {
    return 0;
  }

  // Check if all amounts are zero or negligible
  const totalAbsAmount = cashFlows.reduce((sum, cf) => sum + Math.abs(cf.amount), 0);
  if (totalAbsAmount < 1) {
    return 0;
  }

  // Check if there are both inflows and outflows
  const hasInflow = cashFlows.some(cf => cf.amount > 0);
  const hasOutflow = cashFlows.some(cf => cf.amount < 0);
  if (!hasInflow || !hasOutflow) {
    return 0;
  }
  
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

  // Use purchase date if set, otherwise fall back to today
  const purchaseDate = property.purchaseDate
    ? new Date(property.purchaseDate)
    : new Date();

  // Use handover date if set, otherwise fall back to purchase date
  const handoverDate = property.handoverDate
    ? new Date(property.handoverDate)
    : purchaseDate;

  // Booking fee is part of the total price, not an additional cost
  // It's typically paid first and deducted from the down payment
  const bookingFee = payment.bookingFee > 0 ? payment.bookingFee : 0;
  const bookingFeeDate = payment.bookingFeeDate
    ? new Date(payment.bookingFeeDate)
    : purchaseDate;

  if (payment.type === 'full') {
    // Full payment upfront
    if (property.totalPrice > 0) {
      if (bookingFee > 0) {
        // Add booking fee as separate cash flow on its date
        cashFlows.push({
          date: bookingFeeDate,
          amount: -bookingFee
        });
        // Remaining amount on purchase date
        const remainingPayment = property.totalPrice - bookingFee;
        if (remainingPayment > 0) {
          cashFlows.push({
            date: purchaseDate,
            amount: -remainingPayment
          });
        }
      } else {
        // No booking fee, full amount on purchase date
        cashFlows.push({
          date: purchaseDate,
          amount: -property.totalPrice
        });
      }
    }
  } else {
    // Payment plan
    const downPayment = property.totalPrice * (payment.downPaymentPercent / 100);

    // Booking fee is deducted from down payment
    const remainingDownPayment = Math.max(0, downPayment - bookingFee);

    // Add booking fee as separate cash flow on its date (if any)
    if (bookingFee > 0) {
      cashFlows.push({
        date: bookingFeeDate,
        amount: -bookingFee
      });
    }

    // Remaining down payment on purchase date (only if positive)
    if (remainingDownPayment > 0) {
      cashFlows.push({
        date: purchaseDate,
        amount: -remainingDownPayment
      });
    }

    // Use stored schedule if available (has correct remainder adjustment)
    if (payment.schedule && payment.schedule.length > 0) {
      payment.schedule.forEach((entry) => {
        const entryDate = new Date(entry.date);
        // Only add if date is valid and amount is non-zero
        if (!isNaN(entryDate.getTime()) && entry.amount > 0) {
          cashFlows.push({
            date: entryDate,
            amount: -entry.amount
          });
        }
      });
    } else {
      // Fallback: calculate schedule dynamically from purchase date
      const remaining = property.totalPrice - downPayment;
      const baseMonthlyPayment = Math.floor(remaining / payment.installmentMonths);
      const remainder = remaining - (baseMonthlyPayment * payment.installmentMonths);

      for (let i = 1; i <= payment.installmentMonths; i++) {
        const paymentDate = new Date(purchaseDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        // Don't exceed handover date
        if (paymentDate <= handoverDate) {
          const isLastInstallment = i === payment.installmentMonths ||
            (i < payment.installmentMonths && (() => {
              const nextDate = new Date(purchaseDate);
              nextDate.setMonth(nextDate.getMonth() + i + 1);
              return nextDate > handoverDate;
            })());

          // Add remainder to the last installment
          const amount = isLastInstallment
            ? baseMonthlyPayment + remainder
            : baseMonthlyPayment;

          cashFlows.push({
            date: paymentDate,
            amount: -amount
          });
        }
      }
    }
  }
  
  // Add additional cash flows (furniture, rental income, etc.)
  additionalCashFlows.forEach((cf: CashFlowEntry) => {
    const cfDate = new Date(cf.date);
    const cfAmount = cf.type === 'inflow' ? cf.amount : -cf.amount;
    // Only add if date is valid and amount is non-zero
    if (!isNaN(cfDate.getTime()) && cf.amount > 0) {
      cashFlows.push({
        date: cfDate,
        amount: cfAmount
      });
    }
  });

  // Exit: Sale at sale date + closing costs
  const closingCosts = exit.projectedSalesPrice * (exit.closingCostPercent / 100);
  const saleDate = exit.saleDate ? new Date(exit.saleDate) : handoverDate;
  const saleProceeds = exit.projectedSalesPrice - closingCosts;

  // Only add sale if there's a valid date and positive proceeds
  if (!isNaN(saleDate.getTime()) && saleProceeds > 0) {
    cashFlows.push({
      date: saleDate,
      amount: saleProceeds
    });
  }
  
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

  // Validate dates
  const firstTime = firstDate.getTime();
  const lastTime = lastDate.getTime();
  let holdPeriodMonths = 0;

  if (!isNaN(firstTime) && !isNaN(lastTime) && lastTime > firstTime) {
    holdPeriodMonths = Math.round((lastTime - firstTime) / (30 * 24 * 60 * 60 * 1000));
  }

  // Clamp rate to reasonable bounds (-100% to 1000%)
  let finalRate = isNaN(rate) ? 0 : rate;
  if (finalRate < -1) finalRate = -1;
  if (finalRate > 10) finalRate = 10;

  return {
    rate: finalRate,
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
