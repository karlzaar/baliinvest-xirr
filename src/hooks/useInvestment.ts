import { useState, useMemo, useCallback } from 'react';
import type { InvestmentData, XIRRResult, CashFlowEntry } from '../types/investment';
import { calculateInvestmentReturn } from '../utils/xirr';
import { v4 as uuidv4 } from 'uuid';

// All values stored in IDR internally
const DEFAULT_INVESTMENT: InvestmentData = {
  property: {
    projectName: 'Villa Matahari Phase 1',
    location: 'Canggu, Bali',
    totalPrice: 3_500_000_000, // IDR
    handoverDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'IDR'
  },
  payment: {
    type: 'plan',
    downPaymentPercent: 50,
    installmentMonths: 5
  },
  exit: {
    projectedSalesPrice: 4_200_000_000, // IDR
    closingCostPercent: 2.5
  },
  additionalCashFlows: [
    {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      description: 'Furniture Package',
      type: 'outflow',
      amount: 150_000_000 // IDR
    }
  ]
};

// Exchange rates (IDR as base = 1)
const EXCHANGE_RATES: Record<string, number> = {
  IDR: 1,
  USD: 16000,      // 1 USD = 16,000 IDR
  AUD: 10300,      // 1 AUD = 10,300 IDR
  EUR: 17000,      // 1 EUR = 17,000 IDR
};

export function useInvestment() {
  const [data, setData] = useState<InvestmentData>(DEFAULT_INVESTMENT);
  
  // Calculate XIRR using IDR values (internal)
  const result: XIRRResult = useMemo(() => {
    return calculateInvestmentReturn(data);
  }, [data]);
  
  // Convert IDR to display currency
  const toDisplayCurrency = useCallback((idrAmount: number): number => {
    const rate = EXCHANGE_RATES[data.property.currency] || 1;
    return idrAmount / rate;
  }, [data.property.currency]);
  
  // Convert display currency to IDR for storage
  const toIDR = useCallback((displayAmount: number): number => {
    const rate = EXCHANGE_RATES[data.property.currency] || 1;
    return displayAmount * rate;
  }, [data.property.currency]);
  
  // Get currency symbol
  const getCurrencySymbol = useCallback((): string => {
    const symbols: Record<string, string> = {
      IDR: 'Rp',
      USD: '$',
      AUD: 'A$',
      EUR: '€'
    };
    return symbols[data.property.currency] || 'Rp';
  }, [data.property.currency]);
  
  // Format number for display
  const formatAmount = useCallback((idrAmount: number): string => {
    const displayAmount = toDisplayCurrency(idrAmount);
    const decimals = data.property.currency === 'IDR' ? 0 : 2;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(displayAmount);
  }, [data.property.currency, toDisplayCurrency]);
  
  // Format abbreviated (for sidebar)
  const formatAbbreviated = useCallback((idrAmount: number): string => {
    const displayAmount = toDisplayCurrency(idrAmount);
    const currency = data.property.currency;
    
    if (currency === 'IDR') {
      if (Math.abs(displayAmount) >= 1_000_000_000) {
        return `${(displayAmount / 1_000_000_000).toFixed(2)}B`;
      }
      if (Math.abs(displayAmount) >= 1_000_000) {
        return `${(displayAmount / 1_000_000).toFixed(0)}M`;
      }
    } else {
      if (Math.abs(displayAmount) >= 1_000_000) {
        return `${(displayAmount / 1_000_000).toFixed(2)}M`;
      }
      if (Math.abs(displayAmount) >= 1_000) {
        return `${(displayAmount / 1_000).toFixed(0)}K`;
      }
    }
    return formatAmount(idrAmount);
  }, [data.property.currency, toDisplayCurrency, formatAmount]);
  
  const updateProperty = useCallback(<K extends keyof InvestmentData['property']>(
    key: K,
    value: InvestmentData['property'][K]
  ) => {
    setData(prev => ({
      ...prev,
      property: { ...prev.property, [key]: value }
    }));
  }, []);
  
  // Special handler for price updates (converts from display to IDR)
  const updatePrice = useCallback((displayAmount: number) => {
    const idrAmount = toIDR(displayAmount);
    setData(prev => ({
      ...prev,
      property: { ...prev.property, totalPrice: idrAmount }
    }));
  }, [toIDR]);
  
  // Special handler for exit price updates
  const updateExitPrice = useCallback((displayAmount: number) => {
    const idrAmount = toIDR(displayAmount);
    setData(prev => ({
      ...prev,
      exit: { ...prev.exit, projectedSalesPrice: idrAmount }
    }));
  }, [toIDR]);
  
  const updatePayment = useCallback(<K extends keyof InvestmentData['payment']>(
    key: K,
    value: InvestmentData['payment'][K]
  ) => {
    setData(prev => ({
      ...prev,
      payment: { ...prev.payment, [key]: value }
    }));
  }, []);
  
  const updateExit = useCallback(<K extends keyof InvestmentData['exit']>(
    key: K,
    value: InvestmentData['exit'][K]
  ) => {
    setData(prev => ({
      ...prev,
      exit: { ...prev.exit, [key]: value }
    }));
  }, []);
  
  const addCashFlow = useCallback((entry: Omit<CashFlowEntry, 'id'>) => {
    // Convert display amount to IDR before storing
    const idrAmount = toIDR(entry.amount);
    setData(prev => ({
      ...prev,
      additionalCashFlows: [
        ...prev.additionalCashFlows,
        { ...entry, amount: idrAmount, id: uuidv4() }
      ]
    }));
  }, [toIDR]);
  
  const removeCashFlow = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      additionalCashFlows: prev.additionalCashFlows.filter(cf => cf.id !== id)
    }));
  }, []);
  
  const updateCashFlow = useCallback((id: string, updates: Partial<CashFlowEntry>) => {
    setData(prev => ({
      ...prev,
      additionalCashFlows: prev.additionalCashFlows.map(cf =>
        cf.id === id ? { ...cf, ...updates } : cf
      )
    }));
  }, []);
  
  // Update cash flow amount (converts from display to IDR)
  const updateCashFlowAmount = useCallback((id: string, displayAmount: number) => {
    const idrAmount = toIDR(displayAmount);
    setData(prev => ({
      ...prev,
      additionalCashFlows: prev.additionalCashFlows.map(cf =>
        cf.id === id ? { ...cf, amount: idrAmount } : cf
      )
    }));
  }, [toIDR]);
  
  const reset = useCallback(() => {
    setData(DEFAULT_INVESTMENT);
  }, []);
  
  return {
    data,
    result,
    // Property updates
    updateProperty,
    updatePrice,
    updateExitPrice,
    // Other updates
    updatePayment,
    updateExit,
    // Cash flow management
    addCashFlow,
    removeCashFlow,
    updateCashFlow,
    updateCashFlowAmount,
    // Reset
    reset,
    // Currency utilities
    toDisplayCurrency,
    toIDR,
    getCurrencySymbol,
    formatAmount,
    formatAbbreviated,
    exchangeRate: EXCHANGE_RATES[data.property.currency] || 1
  };
}
