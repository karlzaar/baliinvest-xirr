import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  ComparisonState,
  RentalROIComparisonData,
  XIRRComparisonData,
  CalculatorType,
} from './comparison-types';
import { MAX_COMPARISONS } from './comparison-types';

const STORAGE_KEY = 'roi-calculate-comparisons';

interface ComparisonContextType {
  comparisons: ComparisonState;
  addRentalROIComparison: (data: Omit<RentalROIComparisonData, 'timestamp'>) => boolean;
  addXIRRComparison: (data: Omit<XIRRComparisonData, 'timestamp'>) => boolean;
  removeComparison: (type: CalculatorType, timestamp: number) => void;
  updateLabel: (type: CalculatorType, timestamp: number, newLabel: string) => void;
  clearAll: (type: CalculatorType) => void;
  getCount: (type: CalculatorType) => number;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

const loadFromStorage = (): ComparisonState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load comparisons from localStorage:', e);
  }
  return { rentalROI: [], xirr: [] };
};

const saveToStorage = (state: ComparisonState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save comparisons to localStorage:', e);
  }
};

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisons, setComparisons] = useState<ComparisonState>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(comparisons);
  }, [comparisons]);

  const addRentalROIComparison = useCallback((data: Omit<RentalROIComparisonData, 'timestamp'>): boolean => {
    if (comparisons.rentalROI.length >= MAX_COMPARISONS) {
      return false;
    }
    const newEntry: RentalROIComparisonData = {
      ...data,
      timestamp: Date.now(),
    };
    setComparisons(prev => ({
      ...prev,
      rentalROI: [...prev.rentalROI, newEntry],
    }));
    return true;
  }, [comparisons.rentalROI.length]);

  const addXIRRComparison = useCallback((data: Omit<XIRRComparisonData, 'timestamp'>): boolean => {
    if (comparisons.xirr.length >= MAX_COMPARISONS) {
      return false;
    }
    const newEntry: XIRRComparisonData = {
      ...data,
      timestamp: Date.now(),
    };
    setComparisons(prev => ({
      ...prev,
      xirr: [...prev.xirr, newEntry],
    }));
    return true;
  }, [comparisons.xirr.length]);

  const removeComparison = useCallback((type: CalculatorType, timestamp: number) => {
    setComparisons(prev => ({
      ...prev,
      [type === 'rental-roi' ? 'rentalROI' : 'xirr']:
        type === 'rental-roi'
          ? prev.rentalROI.filter(c => c.timestamp !== timestamp)
          : prev.xirr.filter(c => c.timestamp !== timestamp),
    }));
  }, []);

  const updateLabel = useCallback((type: CalculatorType, timestamp: number, newLabel: string) => {
    setComparisons(prev => ({
      ...prev,
      [type === 'rental-roi' ? 'rentalROI' : 'xirr']:
        type === 'rental-roi'
          ? prev.rentalROI.map(c => c.timestamp === timestamp ? { ...c, label: newLabel } : c)
          : prev.xirr.map(c => c.timestamp === timestamp ? { ...c, label: newLabel } : c),
    }));
  }, []);

  const clearAll = useCallback((type: CalculatorType) => {
    setComparisons(prev => ({
      ...prev,
      [type === 'rental-roi' ? 'rentalROI' : 'xirr']: [],
    }));
  }, []);

  const getCount = useCallback((type: CalculatorType): number => {
    return type === 'rental-roi' ? comparisons.rentalROI.length : comparisons.xirr.length;
  }, [comparisons]);

  return (
    <ComparisonContext.Provider value={{
      comparisons,
      addRentalROIComparison,
      addXIRRComparison,
      removeComparison,
      updateLabel,
      clearAll,
      getCount,
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within ComparisonProvider');
  }
  return context;
}
