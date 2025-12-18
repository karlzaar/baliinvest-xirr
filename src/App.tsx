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
    currency,
    symbol,
    rate,
    formatDisplay,
    formatAbbrev,
    idrToDisplay,
    updateProperty,
    updatePriceFromDisplay,
    updateExitPriceFromDisplay,
    updatePayment,
    updateExit,
    addCashFlow,
    removeCashFlow,
    updateCashFlow,
  } = useInvestment();

  // Pre-calculate display values
  const displayPrice = idrToDisplay(data.property.totalPrice);
  const displayExitPrice = idrToDisplay(data.exit.projectedSalesPrice);

  return (
    <div className="bg-[#112217] text-white font-display min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full px-4 py-8 md:px-10 lg:px-20">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              New Investment Calculation
            </h1>
            <p className="text-text-secondary text-lg mt-2">
              Enter the financial details of your Bali villa project to forecast returns and calculate XIRR.
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Forms */}
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
              
              <ExitStrategy
                data={data.exit}
                totalPriceIDR={data.property.totalPrice}
                displayExitPrice={displayExitPrice}
                symbol={symbol}
                formatDisplay={formatDisplay}
                onUpdate={updateExit}
                onExitPriceChange={updateExitPriceFromDisplay}
              />
              
              <CashFlows
                entries={data.additionalCashFlows}
                symbol={symbol}
                formatDisplay={formatDisplay}
                onAdd={addCashFlow}
                onRemove={removeCashFlow}
                onUpdate={updateCashFlow}
              />
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-4">
              <ProjectForecast
                result={result}
                location={data.property.location}
                currency={currency}
                formatAbbrev={formatAbbrev}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
