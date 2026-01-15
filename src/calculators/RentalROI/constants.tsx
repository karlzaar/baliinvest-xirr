
import type { Assumptions, CurrencyConfig, CurrencyCode } from './types';

// Empty state for reset - all zeros
export const EMPTY_ASSUMPTIONS: Assumptions = {
  initialInvestment: 0,
  purchaseDate: '',
  keys: 1,

  isPropertyReady: true,
  propertyReadyDate: '',

  y1Occupancy: 0,
  y1ADR: 0,
  y1FB: 0,
  y1Spa: 0,
  y1OODs: 0,
  y1Misc: 0,

  occupancyIncreases: [null, null, null, null, null, null, null, null, null],
  adrGrowth: 0,
  fbGrowth: 0,
  spaGrowth: 0,
  camGrowth: 0,
  baseFeeGrowth: 0,
  techFeeGrowth: 0,

  roomsCostPct: 0,
  fbCostPct: 0,
  spaCostPct: 0,
  otherCostPct: 0,
  miscCostPct: 0,
  utilitiesPct: 0,

  adminPct: 0,
  salesPct: 0,
  maintPct: 0,

  y1CAM: 0,
  y1BaseFee: 0,
  y1TechFee: 0,
  incentiveFeePct: 0
};

// Example values shown as placeholders
export const PLACEHOLDER_VALUES: Assumptions = {
  initialInvestment: 2375000000,
  purchaseDate: '2026-01',
  keys: 1,

  isPropertyReady: true,
  propertyReadyDate: '',

  y1Occupancy: 70,
  y1ADR: 1600000,
  y1FB: 12000000,
  y1Spa: 0,
  y1OODs: 0,
  y1Misc: 0,

  occupancyIncreases: [4, 3, 2, 1.5, 1.5, 1, 1, 1, 1],
  adrGrowth: 4,
  fbGrowth: 3,
  spaGrowth: 0,
  camGrowth: 2,
  baseFeeGrowth: 3,
  techFeeGrowth: 3,

  roomsCostPct: 20,
  fbCostPct: 85,
  spaCostPct: 0,
  otherCostPct: 0,
  miscCostPct: 0,
  utilitiesPct: 7,

  adminPct: 1,
  salesPct: 5,
  maintPct: 3,

  y1CAM: 15000000,
  y1BaseFee: 12000000,
  y1TechFee: 12000000,
  incentiveFeePct: 0
};

// Initial state - use empty for fresh start (like XIRR)
export const INITIAL_ASSUMPTIONS = EMPTY_ASSUMPTIONS;

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', rate: 1 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', rate: 16000 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', rate: 17500 },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', rate: 10500 },
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', rate: 190 },
  CNY: { code: 'CNY', symbol: '¥', locale: 'zh-CN', rate: 2200 },
  AED: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', rate: 4350 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', rate: 20500 },
  RUB: { code: 'RUB', symbol: '₽', locale: 'ru-RU', rate: 175 },
};

export const formatCurrency = (val: number, currency: CurrencyConfig) => {
  // Convert IDR value to target currency
  const converted = val / currency.rate;

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: converted > 1000 ? 0 : 2,
  }).format(converted);
};

// Format with M/B abbreviations for large numbers
export const formatCurrencyAbbrev = (val: number, currency: CurrencyConfig) => {
  // Convert IDR value to target currency
  const converted = val / currency.rate;
  const abs = Math.abs(converted);
  const sign = converted < 0 ? '-' : '';

  if (currency.code === 'IDR') {
    // IDR uses billions (B) and millions (M)
    if (abs >= 1000000000) {
      return `${sign}${currency.symbol} ${(abs / 1000000000).toFixed(2)}B`;
    }
    if (abs >= 1000000) {
      return `${sign}${currency.symbol} ${Math.round(abs / 1000000)}M`;
    }
    return `${sign}${currency.symbol} ${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  } else {
    // Other currencies use millions (M) and thousands (K)
    if (abs >= 1000000) {
      return `${sign}${currency.symbol}${(abs / 1000000).toFixed(2)}M`;
    }
    if (abs >= 1000) {
      return `${sign}${currency.symbol}${Math.round(abs / 1000)}K`;
    }
    return `${sign}${currency.symbol}${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
};

export const FORMAT_PCT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
