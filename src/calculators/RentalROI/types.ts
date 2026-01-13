
export type CurrencyCode = 'USD' | 'EUR' | 'AUD' | 'INR' | 'IDR' | 'CNY' | 'AED' | 'GBP' | 'RUB';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  rate: number; // Rate relative to IDR (1 unit of currency = X IDR)
}

export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
}

export interface YearlyData {
  year: number;
  calendarYear: number;
  
  // Operational Metrics
  keys: number;
  occupancy: number;
  occupancyIncrease: number;
  adr: number;
  adrGrowth: number;
  revpar: number;
  trevpar: number;

  // Revenue
  revenueRooms: number;
  revenueRoomsPercent: number;
  revenueFB: number;
  revenueFBPercent: number;
  revenueSpa: number;
  revenueSpaPercent: number;
  revenueOODs: number;
  revenueOODsPercent: number;
  revenueMisc: number;
  revenueMiscPercent: number;
  totalRevenue: number;
  revenueGrowth: number;

  // Operating Expenses
  costRooms: number;
  costRoomsPercent: number;
  costFB: number;
  costFBPercent: number;
  costSpa: number;
  costSpaPercent: number;
  costOther: number;
  costOtherPercent: number;
  costMisc: number;
  costMiscPercent: number;
  costUtilities: number;
  costUtilitiesPercent: number;
  totalOperatingCost: number;
  operatingCostPercent: number;

  // Undistributed Expenses
  undistributedAdmin: number;
  undistributedAdminPercent: number;
  undistributedSales: number;
  undistributedSalesPercent: number;
  undistributedMaintenance: number;
  undistributedMaintenancePercent: number;
  totalUndistributedCost: number;
  undistributedCostPercent: number;

  // GOP
  gop: number;
  gopMargin: number;

  // Management Fees
  feeCAM: number;
  feeCAMPercent: number;
  feeBase: number;
  feeBasePercent: number;
  feeTech: number;
  feeTechPercent: number;
  feeIncentive: number;
  feeIncentivePercent: number;
  totalManagementFees: number;
  managementFeesPercent: number;

  // Net Profit
  takeHomeProfit: number;
  profitMargin: number;

  // Summary ROI
  roiBeforeManagement: number;
  roiAfterManagement: number;
}

export interface Assumptions {
  initialInvestment: number;
  baseYear: number;
  keys: number;
  
  // Year 1 Bases
  y1Occupancy: number;
  y1ADR: number;
  y1FB: number;
  y1Spa: number;
  y1OODs: number;
  y1Misc: number;

  // Growth/Increases
  occupancyIncreases: (number | null)[]; // Index 1-9 (Y2 to Y10), null = unset (uses placeholder)
  adrGrowth: number;
  fbGrowth: number;
  spaGrowth: number;
  camGrowth: number;
  baseFeeGrowth: number;
  techFeeGrowth: number;

  // Cost Percentages
  roomsCostPct: number;
  fbCostPct: number;
  spaCostPct: number;
  otherCostPct: number;
  miscCostPct: number;
  utilitiesPct: number;

  // Undistributed Pct of Revenue
  adminPct: number;
  salesPct: number;
  maintPct: number;

  // Management Fee Bases (Y1)
  y1CAM: number;
  y1BaseFee: number;
  y1TechFee: number;
  incentiveFeePct: number; // % of GOP
}
