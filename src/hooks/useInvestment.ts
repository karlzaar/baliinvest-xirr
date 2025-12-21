import { useState, useMemo, useCallback, useEffect } from 'react';
import type { InvestmentData, XIRRResult, CashFlowEntry, ExitStrategyType, PaymentScheduleEntry } from '../types/investment';
import { calculateInvestmentReturn } from '../utils/xirr';
import { useExchangeRates } from './useExchangeRates';
import { v4 as uuidv4 } from 'uuid';

// All values stored in IDR internally
// Empty defaults - users fill in their own data with placeholder guidance
const DEFAULT_INVESTMENT: InvestmentData = {
  property: {
    projectName: '',
    location: '',
    totalPrice: 0,
    purchaseDate: '',
    handoverDate: '',
    currency: 'IDR'
  },
  payment: {
    type: 'plan',
    downPaymentPercent: 50,
    installmentMonths: 6,
    schedule: []
  },
  exit: {
    strategyType: 'flip',
    projectedSalesPrice: 0,
    closingCostPercent: 2.5,
    holdPeriodYears: 0,
    saleDate: ''
  },
  additionalCashFlows: []
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
  
  // Helper to calculate months until a date
  const getMonthsUntil = (dateStr: string): number => {
    if (!dateStr) return 6; // default
    const target = new Date(dateStr);
    const now = new Date();
    const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    return Math.max(1, months); // minimum 1 month
  };

  // Helper to generate schedule inline
  const createSchedule = (
    totalPrice: number,
    downPaymentPercent: number,
    installmentMonths: number
  ): PaymentScheduleEntry[] => {
    if (totalPrice <= 0 || installmentMonths <= 0) return [];
    const remaining = totalPrice * (1 - downPaymentPercent / 100);
    const basePayment = Math.floor(remaining / installmentMonths);

    return Array.from({ length: installmentMonths }, (_, i) => {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);
      const isLast = i === installmentMonths - 1;
      const previousTotal = basePayment * i;
      const amount = isLast ? remaining - previousTotal : basePayment;

      return {
        id: uuidv4(),
        date: paymentDate.toISOString().split('T')[0],
        amount
      };
    });
  };

  // Update handlers
  const updateProperty = useCallback(<K extends keyof InvestmentData['property']>(
    key: K,
    value: InvestmentData['property'][K]
  ) => {
    setData(prev => {
      const newProperty = { ...prev.property, [key]: value };

      // When handover date changes, update installment months and regenerate schedule
      if (key === 'handoverDate' && typeof value === 'string' && value) {
        const monthsUntilHandover = getMonthsUntil(value);
        const newSchedule = createSchedule(
          prev.property.totalPrice,
          prev.payment.downPaymentPercent,
          monthsUntilHandover
        );
        return {
          ...prev,
          property: newProperty,
          payment: {
            ...prev.payment,
            installmentMonths: monthsUntilHandover,
            schedule: newSchedule
          }
        };
      }

      return {
        ...prev,
        property: newProperty
      };
    });
  }, []);

  const updatePriceFromDisplay = useCallback((displayValue: number) => {
    const idr = displayToIdr(displayValue);
    setData(prev => {
      // Auto-generate schedule if handover date is set
      if (prev.property.handoverDate && idr > 0) {
        const newSchedule = createSchedule(
          idr,
          prev.payment.downPaymentPercent,
          prev.payment.installmentMonths
        );
        return {
          ...prev,
          property: { ...prev.property, totalPrice: idr },
          payment: { ...prev.payment, schedule: newSchedule }
        };
      }
      return {
        ...prev,
        property: { ...prev.property, totalPrice: idr }
      };
    });
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

  // Generate payment schedule based on current settings
  const generateSchedule = useCallback((
    totalPrice: number,
    downPaymentPercent: number,
    installmentMonths: number
  ): PaymentScheduleEntry[] => {
    const remaining = totalPrice * (1 - downPaymentPercent / 100);
    const basePayment = Math.floor(remaining / installmentMonths);

    return Array.from({ length: installmentMonths }, (_, i) => {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);

      // Last payment gets any rounding difference
      const isLast = i === installmentMonths - 1;
      const previousTotal = basePayment * i;
      const amount = isLast ? remaining - previousTotal : basePayment;

      return {
        id: uuidv4(),
        date: paymentDate.toISOString().split('T')[0],
        amount
      };
    });
  }, []);

  // Regenerate schedule (called when user changes months or wants to reset)
  // Optionally accepts new months value for atomic update
  const regenerateSchedule = useCallback((newMonths?: number) => {
    setData(prev => {
      const months = newMonths ?? prev.payment.installmentMonths;
      return {
        ...prev,
        payment: {
          ...prev.payment,
          installmentMonths: months,
          schedule: generateSchedule(
            prev.property.totalPrice,
            prev.payment.downPaymentPercent,
            months
          )
        }
      };
    });
  }, [generateSchedule]);

  // Update individual schedule entry
  const updateScheduleEntry = useCallback((id: string, updates: Partial<Pick<PaymentScheduleEntry, 'date' | 'amount'>>) => {
    setData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        schedule: prev.payment.schedule.map(entry =>
          entry.id === id ? { ...entry, ...updates } : entry
        )
      }
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

  const updateExitStrategy = useCallback((
    strategyId: ExitStrategyType,
    defaults: { appreciation: number; holdYears: number }
  ) => {
    setData(prev => {
      const newSalesPrice = prev.property.totalPrice * (1 + defaults.appreciation / 100);

      // Use fallback date if handover date is not set
      const handoverDateStr = prev.property.handoverDate;
      const handoverDate = handoverDateStr
        ? new Date(handoverDateStr)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default: 1 year from now

      // For "Flip at Completion", sale date = handover date (sell immediately)
      // For other strategies, add hold period to handover date
      let saleDate: Date;
      if (strategyId === 'flip') {
        saleDate = new Date(handoverDate);
      } else {
        saleDate = new Date(handoverDate);
        saleDate.setFullYear(saleDate.getFullYear() + Math.floor(defaults.holdYears));
        saleDate.setMonth(saleDate.getMonth() + Math.round((defaults.holdYears % 1) * 12));
      }

      return {
        ...prev,
        exit: {
          ...prev.exit,
          strategyType: strategyId,
          projectedSalesPrice: newSalesPrice,
          holdPeriodYears: strategyId === 'flip' ? 0 : defaults.holdYears,
          saleDate: saleDate.toISOString().split('T')[0],
        }
      };
    });
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
    regenerateSchedule,
    updateScheduleEntry,
    updateExit,
    updateExitStrategy,
    addCashFlow,
    removeCashFlow,
    updateCashFlow,
    reset,
  };
}
