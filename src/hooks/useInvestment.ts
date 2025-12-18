import { useState, useMemo, useCallback, useEffect } from 'react';
import type { InvestmentData, XIRRResult, CashFlowEntry } from '../types/investment';
import { calculateInvestmentReturn } from '../utils/xirr';
import { useExchangeRates } from './useExchangeRates';
import { v4 as uuidv4 } from 'uuid';

// All values stored in IDR internally - NEVER changes
const DEFAULT_INVESTMENT: InvestmentData = {
  property: {
    projectName: 'Villa Matahari Phase 1',
    location: 'Canggu, Bali',
    totalPrice: 3500000000, // 3.5 billion IDR
    handoverDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'IDR'
  },
  payment: {
    type: 'plan',
    downPaymentPercent: 50,
    installmentMonths: 5
  },
  exit: {
    projectedSalesPrice: 4200000000, // 4.2 billion IDR
    closingCostPercent: 2.5
  },
  additionalCashFlows: [
    {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      description: 'Furniture Package',
      type: 'outflow',
      amount: 150000000 // 150 million IDR
    }
  ]
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  IDR: 'Rp',
  USD: '$',
  AUD: 'A$',
  EUR: '€'
};

export function useInvestment() {
  const [data, setData] = useState<InvestmentData>(DEFAULT_INVESTMENT);
  
  // Live exchange rates
  const { 
    getRate, 
    loading: ratesLoading, 
    error: ratesError,
    source: ratesSource,
    lastUpdatedFormatted: ratesLastUpdated,
    refreshRates 
  } = useExchangeRates();

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("baliinvest_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.data) {
          setData(draft.data);
        }
      }
    } catch (e) {
      console.error("Failed to load draft:", e);
    }
  }, []);
  
  const currency = data.property.currency;
  const rate = getRate(currency);
  const symbol = CURRENCY_SYMBOLS[currency] || 'Rp';
  
  // XIRR always calculated from IDR values
  const result: XIRRResult = useMemo(() => {
    return calculateInvestmentReturn(data);
  }, [data]);
  
  // Simple conversion functions
  const idrToDisplay = useCallback((idr: number): number => {
    return Math.round(idr / rate);
  }, [rate]);
  
  const displayToIdr = useCallback((display: number): number => {
    return Math.round(display * rate);
  }, [rate]);
  
  // Format for display (no decimals, comma separators)
  const formatDisplay = useCallback((idr: number): string => {
    const display = idrToDisplay(idr);
    return display.toLocaleString('en-US');
  }, [idrToDisplay]);
  
  // Format abbreviated for sidebar
  const formatAbbrev = useCallback((idr: number): string => {
    const display = idrToDisplay(idr);
    const abs = Math.abs(display);
    
    if (currency === 'IDR') {
      if (abs >= 1000000000) return `${(display / 1000000000).toFixed(2)}B`;
      if (abs >= 1000000) return `${Math.round(display / 1000000)}M`;
      return display.toLocaleString('en-US');
    } else {
      if (abs >= 1000000) return `${(display / 1000000).toFixed(2)}M`;
      if (abs >= 1000) return `${Math.round(display / 1000)}K`;
      return display.toLocaleString('en-US');
    }
  }, [currency, idrToDisplay]);
  
  // Update handlers
  const updateProperty = useCallback(<K extends keyof InvestmentData['property']>(
    key: K,
    value: InvestmentData['property'][K]
  ) => {
    setData(prev => ({
      ...prev,
      property: { ...prev.property, [key]: value }
    }));
  }, []);
  
  const updatePriceFromDisplay = useCallback((displayValue: number) => {
    const idr = displayToIdr(displayValue);
    setData(prev => ({
      ...prev,
      property: { ...prev.property, totalPrice: idr }
    }));
  }, [displayToIdr]);
  
  const updateExitPriceFromDisplay = useCallback((displayValue: number) => {
    const idr = displayToIdr(displayValue);
    setData(prev => ({
      ...prev,
      exit: { ...prev.exit, projectedSalesPrice: idr }
    }));
  }, [displayToIdr]);
  
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
    const idr = displayToIdr(entry.amount);
    setData(prev => ({
      ...prev,
      additionalCashFlows: [
        ...prev.additionalCashFlows,
        { ...entry, amount: idr, id: uuidv4() }
      ]
    }));
  }, [displayToIdr]);
  
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
  
  const reset = useCallback(() => {
    setData(DEFAULT_INVESTMENT);
  }, []);
  
  return {
    data,
    result,
    currency,
    symbol,
    rate,
    // Exchange rate info
    ratesLoading,
    ratesError,
    ratesSource,
    ratesLastUpdated,
    refreshRates,
    // Formatting
    formatDisplay,
    formatAbbrev,
    idrToDisplay,
    displayToIdr,
    // Updates
    updateProperty,
    updatePriceFromDisplay,
    updateExitPriceFromDisplay,
    updatePayment,
    updateExit,
    addCashFlow,
    removeCashFlow,
    updateCashFlow,
    reset,
  };
}
