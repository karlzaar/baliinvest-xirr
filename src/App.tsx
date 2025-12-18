import { useInvestment } from './hooks/useInvestment';
import {
  Header,
  PropertyDetails,
  PaymentTerms,
  ExitStrategy,
  CashFlows,
  ProjectForecast
} from './components';

function App() {
  const {
    data,
    result,
    updateProperty,
    updatePrice,
    updateExitPrice,
    updatePayment,
    updateExit,
    addCashFlow,
    removeCashFlow,
    updateCashFlow,
    updateCashFlowAmount,
    toDisplayCurrency,
    getCurrencySymbol,
    formatAmount,
    formatAbbreviated,
    exchangeRate
  } = useInvestment();

  const handleCalculate = () => {
    console.log('XIRR Result:', result);
    console.log('Data (all in IDR):', data);
  };

  // Format display values
  const currencySymbol = getCurrencySymbol();
  const displayPrice = formatAmount(data.property.totalPrice);
  const displayExitPrice = formatAmount(data.exit.projectedSalesPrice);

  return (
    <div className="bg-[#112217] text-white font-display overflow-x-hidden antialiased min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full px-4 py-8 md:px-10 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              New Investment Calculation
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl">
              Enter the financial details of your Bali villa project to forecast returns and calculate XIRR.
            </p>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Forms */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <PropertyDetails 
                data={data.property}
                displayPrice={displayPrice}
                currencySymbol={currencySymbol}
                exchangeRate={exchangeRate}
                onUpdate={updateProperty}
                onPriceChange={updatePrice}
              />
              
              <PaymentTerms 
                data={data.payment}
                totalPriceIDR={data.property.totalPrice}
                currencySymbol={currencySymbol}
                formatAmount={formatAmount}
                onUpdate={updatePayment}
              />
              
              <ExitStrategy
                data={data.exit}
                totalPriceIDR={data.property.totalPrice}
                displayExitPrice={displayExitPrice}
                currencySymbol={currencySymbol}
                formatAmount={formatAmount}
                onUpdate={updateExit}
                onExitPriceChange={updateExitPrice}
              />
              
              <CashFlows
                entries={data.additionalCashFlows}
                currencySymbol={currencySymbol}
                formatAmount={formatAmount}
                toDisplayCurrency={toDisplayCurrency}
                onAdd={addCashFlow}
                onRemove={removeCashFlow}
                onUpdate={updateCashFlow}
                onAmountChange={updateCashFlowAmount}
              />
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-4">
              <ProjectForecast
                result={result}
                location={data.property.location}
                currency={data.property.currency}
                formatAbbreviated={formatAbbreviated}
                onCalculate={handleCalculate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
