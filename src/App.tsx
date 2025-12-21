import { useState, useCallback, useRef, useEffect } from 'react';
import { useInvestment } from './hooks/useInvestment';
import {
  Header,
  PropertyDetails,
  PaymentTerms,
  ExitStrategySection,
  ProjectForecast,
} from './components';
import { Toast } from './components/ui/Toast';
import { generatePDFReport } from './utils/pdfExport';

const DRAFT_STORAGE_KEY = 'baliinvest_draft';

function App() {
  const {
    data,
    result,
    currency,
    symbol,
    rate,
    ratesLoading,
    ratesError,
    ratesSource,
    ratesLastUpdated,
    refreshRates,
    formatDisplay,
    formatAbbrev,
    idrToDisplay,
    displayToIdr,
    updateProperty,
    updatePriceFromDisplay,
    updateExitPriceFromDisplay,
    updatePayment,
    regenerateSchedule,
    updateScheduleEntry,
    updateExit,
    reset,
  } = useInvestment();

  // Use refs to always have access to the latest data for PDF export
  // This prevents stale closure issues with useCallback
  const dataRef = useRef(data);
  const resultRef = useRef(result);
  const currencyRef = useRef(currency);
  const symbolRef = useRef(symbol);
  const rateRef = useRef(rate);
  const formatDisplayRef = useRef(formatDisplay);
  const formatAbbrevRef = useRef(formatAbbrev);

  // Keep refs up to date
  useEffect(() => {
    dataRef.current = data;
    resultRef.current = result;
    currencyRef.current = currency;
    symbolRef.current = symbol;
    rateRef.current = rate;
    formatDisplayRef.current = formatDisplay;
    formatAbbrevRef.current = formatAbbrev;
  }, [data, result, currency, symbol, rate, formatDisplay, formatAbbrev]);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveDraft = useCallback(() => {
    setIsSaving(true);
    try {
      const draft = { data, savedAt: new Date().toISOString() };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setTimeout(() => {
        setIsSaving(false);
        setToast({ message: 'Draft saved successfully!', type: 'success' });
      }, 500);
    } catch {
      setIsSaving(false);
      setToast({ message: 'Failed to save draft', type: 'error' });
    }
  }, [data]);

  const handleClearAll = useCallback(() => {
    if (showClearConfirm) {
      // Second click - actually clear
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      reset();
      setShowClearConfirm(false);
      setToast({ message: 'All data cleared', type: 'success' });
    } else {
      // First click - show confirmation
      setShowClearConfirm(true);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  }, [reset, showClearConfirm]);

  // Use refs to always get the LATEST data when exporting PDF
  // This fixes the stale closure issue where edits weren't showing
  const handleExportPDF = useCallback(() => {
    try {
      // Read from refs to get the absolute latest data
      generatePDFReport({
        data: dataRef.current,
        result: resultRef.current,
        currency: currencyRef.current,
        symbol: symbolRef.current,
        formatDisplay: formatDisplayRef.current,
        formatAbbrev: formatAbbrevRef.current,
        rate: rateRef.current,
      });
      setToast({ message: 'PDF exported successfully!', type: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      setToast({ message: 'Failed to export PDF', type: 'error' });
    }
  }, []); // No dependencies - refs always have latest values

  const displayPrice = idrToDisplay(data.property.totalPrice);
  const displayExitPrice = idrToDisplay(data.exit.projectedSalesPrice);

  return (
    <div className="bg-[#112217] text-white font-display min-h-screen flex flex-col">
      <Header onSaveDraft={handleSaveDraft} onClearAll={handleClearAll} isSaving={isSaving} showClearConfirm={showClearConfirm} />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="flex-grow w-full px-4 py-8 md:px-10 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              New Investment Calculation
            </h1>
            <p className="text-text-secondary text-lg mt-2">
              Enter the financial details of your Bali villa project to forecast returns and calculate XIRR.
            </p>

            {currency !== 'IDR' && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-text-secondary">
                  Exchange Rate: 1 {currency} = {rate.toLocaleString()} IDR
                </span>
                {ratesLoading ? (
                  <span className="text-yellow-400 text-xs">(loading...)</span>
                ) : ratesError ? (
                  <span className="text-red-400 text-xs" title={ratesError}>⚠️ Using fallback</span>
                ) : (
                  <span className="text-green-400 text-xs" title={`Source: ${ratesSource}`}>
                    ✓ Updated {ratesLastUpdated}
                  </span>
                )}
                <button
                  onClick={refreshRates}
                  className="text-accent hover:text-white text-xs underline ml-2"
                  disabled={ratesLoading}
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <PropertyDetails
                data={data.property}
                symbol={symbol}
                rate={rate}
                displayPrice={displayPrice}
                onUpdate={updateProperty}
                onPriceChange={updatePriceFromDisplay}
              />

              <PaymentTerms
                data={data.payment}
                totalPriceIDR={data.property.totalPrice}
                symbol={symbol}
                formatDisplay={formatDisplay}
                displayToIdr={displayToIdr}
                idrToDisplay={idrToDisplay}
                onUpdate={updatePayment}
                onRegenerateSchedule={regenerateSchedule}
                onUpdateScheduleEntry={updateScheduleEntry}
              />

              <ExitStrategySection
                data={data.exit}
                totalPriceIDR={data.property.totalPrice}
                displayExitPrice={displayExitPrice}
                symbol={symbol}
                handoverDate={data.property.handoverDate}
                formatDisplay={formatDisplay}
                onUpdate={updateExit}
                onExitPriceChange={updateExitPriceFromDisplay}
              />
            </div>

            <div className="lg:col-span-4">
              <ProjectForecast
                result={result}
                currency={currency}
                formatAbbrev={formatAbbrev}
                onExportPDF={handleExportPDF}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
