interface FooterProps {
  onSelectCalculator?: (id: string) => void;
}

export function Footer({ onSelectCalculator }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleToolClick = (calculatorId: string) => {
    if (onSelectCalculator) {
      onSelectCalculator(calculatorId);
      // Scroll to top to show the calculator
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-surface text-text-secondary">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="ROI Calculate Logo"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-white font-bold text-lg">ROI Calculate</h3>
                <p className="text-xs text-text-muted">Property Investment Tools</p>
              </div>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Analyze property investments with comprehensive XIRR calculations and 10-year cash flow projections for informed investment decisions.
            </p>
          </div>

          {/* Tools Section */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Tools</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleToolClick('xirr')}
                  className="text-sm flex items-center gap-2 text-text-secondary hover:text-primary transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-base text-primary group-hover:scale-110 transition-transform">trending_up</span>
                  XIRR Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleToolClick('rental-roi')}
                  className="text-sm flex items-center gap-2 text-text-secondary hover:text-primary transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-base text-primary group-hover:scale-110 transition-transform">home_work</span>
                  Annualized ROI
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base text-primary">mail</span>
                <a href="mailto:hello@investlandgroup.com" className="hover:text-primary transition-colors">
                  hello@investlandgroup.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-base text-primary">location_on</span>
                <span>Bali, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-6">
          <p className="text-sm text-text-muted text-center">
            © {currentYear} ROI Calculate. All rights reserved.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-20 py-4">
          <p className="text-xs text-text-muted text-center leading-relaxed">
            <strong className="text-text-secondary">Disclaimer:</strong> The calculations and projections provided by ROI Calculate tools are for informational purposes only and should not be considered as financial advice.
            Investment returns are not guaranteed and past performance does not indicate future results. Always consult with a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
