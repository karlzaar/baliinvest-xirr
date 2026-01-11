import { useState, useEffect, useCallback } from 'react';

interface ExchangeRateData {
  rates: Record<string, number>;
  lastUpdated: string;
  source: 'api' | 'cache' | 'fallback';
}

// Fallback rates in case API fails (IDR per 1 unit of currency)
const FALLBACK_RATES: Record<string, number> = {
  IDR: 1,
  USD: 16000,
  AUD: 10300,
  EUR: 17000,
  GBP: 20000,
  INR: 190,
  CNY: 2200,
  AED: 4350,
  RUB: 160,
};

const CACHE_KEY = 'baliinvest_exchange_rates';
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours (refresh twice daily)

// Free API - no key needed, uses USD as base
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export function useExchangeRates() {
  const [rateData, setRateData] = useState<ExchangeRateData>({
    rates: FALLBACK_RATES,
    lastUpdated: new Date().toISOString(),
    source: 'fallback'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from cache
  const loadFromCache = useCallback((): ExchangeRateData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime();
      
      // Cache valid for 12 hours
      if (cacheAge < CACHE_DURATION_MS) {
        return { ...parsed, source: 'cache' as const };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((data: ExchangeRateData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // localStorage might be full or unavailable
    }
  }, []);

  // Fetch fresh rates from API
  const fetchRates = useCallback(async (): Promise<ExchangeRateData | null> => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      // API returns rates FROM USD
      // e.g., USD:1, IDR:16669, AUD:1.51, EUR:0.852
      // We need: how many IDR per 1 unit of each currency
      const idrPerUsd = data.rates.IDR || 16000;

      const rates: Record<string, number> = {
        IDR: 1,
        USD: Math.round(idrPerUsd), // 1 USD = ~16669 IDR
        AUD: Math.round(idrPerUsd / data.rates.AUD), // 1 AUD = IDR/AUD rate
        EUR: Math.round(idrPerUsd / data.rates.EUR), // 1 EUR = IDR/EUR rate
        GBP: Math.round(idrPerUsd / data.rates.GBP), // 1 GBP = IDR/GBP rate
        INR: Math.round(idrPerUsd / data.rates.INR), // 1 INR = IDR/INR rate
        CNY: Math.round(idrPerUsd / data.rates.CNY), // 1 CNY = IDR/CNY rate
        AED: Math.round(idrPerUsd / data.rates.AED), // 1 AED = IDR/AED rate
        RUB: Math.round(idrPerUsd / data.rates.RUB), // 1 RUB = IDR/RUB rate
      };
      
      console.log('Fetched exchange rates:', rates);
      
      return {
        rates,
        lastUpdated: new Date().toISOString(),
        source: 'api'
      };
    } catch (err) {
      console.error('Failed to fetch exchange rates:', err);
      return null;
    }
  }, []);

  // Force refresh rates
  const refreshRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const freshData = await fetchRates();
    if (freshData) {
      setRateData(freshData);
      saveToCache(freshData);
    } else {
      setError('Failed to fetch latest rates');
    }
    
    setLoading(false);
  }, [fetchRates, saveToCache]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Try cache first
      const cached = loadFromCache();
      if (cached) {
        setRateData(cached);
        setLoading(false);
        
        // Still fetch fresh in background if cache is > 6 hours old
        const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
        if (cacheAge > CACHE_DURATION_MS / 2) {
          const fresh = await fetchRates();
          if (fresh) {
            setRateData(fresh);
            saveToCache(fresh);
          }
        }
        return;
      }
      
      // No cache, fetch fresh
      const fresh = await fetchRates();
      if (fresh) {
        setRateData(fresh);
        saveToCache(fresh);
      } else {
        setError('Using fallback rates - API unavailable');
      }
      setLoading(false);
    };
    
    init();
  }, [loadFromCache, fetchRates, saveToCache]);

  // Get rate for a currency (how many IDR per 1 unit)
  const getRate = useCallback((currency: string): number => {
    return rateData.rates[currency] || FALLBACK_RATES[currency] || 1;
  }, [rateData.rates]);

  // Format last updated time
  const lastUpdatedFormatted = new Date(rateData.lastUpdated).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    rates: rateData.rates,
    getRate,
    loading,
    error,
    source: rateData.source,
    lastUpdated: rateData.lastUpdated,
    lastUpdatedFormatted,
    refreshRates,
  };
}
