import { useState, useCallback } from 'react';
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
    updateProperty,
    updatePriceFromDisplay,
    updateExitPriceFromDisplay,
    updatePayment,
    updateExit,
    updateExitStrategy,
    reset,
  } = useInvestment();

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      reset();
      setToast({ message: 'All data cleared', type: 'success' });
    }
  }, [reset]);

  const handleExportPDF = useCallback(() => {
    try {
      generatePDFReport({
        data,
        result,
        currency,
        symbol,
        formatDisplay,
        formatAbbrev,
        rate,
      });
      setToast({ message: 'PDF exported successfully!', type: 'success' });
    } catch (error) {
      console.error('PDF export error:', error);
      setToast({ message: 'Failed to export PDF', type: 'error' });
    }
  }, [data, result, currency, symbol, formatDisplay, formatAbbrev, rate]);

  const displayPrice = idrToDisplay(data.property.totalPrice);
  const displayExitPrice = idrToDisplay(data.exit.projectedSalesPrice);

  return (
    <div className="bg-[#112217] text-white font-display min-h-screen flex flex-col">
      <Header onSaveDraft={handleSaveDraft} onClearAll={handleClearAll} isSaving={isSaving} />

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
                onUpdate={updatePayment}
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
                onStrategyChange={updateExitStrategy}
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
