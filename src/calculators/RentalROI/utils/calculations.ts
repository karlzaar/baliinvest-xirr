
import type { Assumptions, YearlyData } from '../types';

// Helper to parse purchase date
function getPurchaseDate(assumptions: Assumptions): { year: number; month: number } {
  if (assumptions.purchaseDate) {
    const [year, month] = assumptions.purchaseDate.split('-').map(Number);
    return { year, month };
  }
  return { year: new Date().getFullYear(), month: 1 };
}

// Helper to derive baseYear from purchaseDate
function getBaseYear(assumptions: Assumptions): number {
  return getPurchaseDate(assumptions).year;
}

// Calculate the factor for partial year operations based on purchase date
// This is used when property IS ready at purchase
function getPurchaseYearFactor(calendarYear: number, assumptions: Assumptions): number {
  const { year: purchaseYear, month: purchaseMonth } = getPurchaseDate(assumptions);

  // Before purchase year: no operations
  if (calendarYear < purchaseYear) return 0;

  // Purchase year: prorate from purchase month
  if (calendarYear === purchaseYear) {
    const monthsOperational = 13 - purchaseMonth; // e.g., July (7) = 6 months
    return monthsOperational / 12;
  }

  // After purchase year: full year
  return 1;
}

// Calculate operational months factor for a year based on property ready date AND purchase date
function getOperationalFactor(calendarYear: number, assumptions: Assumptions): number {
  const { year: purchaseYear } = getPurchaseDate(assumptions);

  // Before purchase year: no operations possible
  if (calendarYear < purchaseYear) return 0;

  // If property is ready at purchase, use purchase date for proration
  if (assumptions.isPropertyReady) {
    return getPurchaseYearFactor(calendarYear, assumptions);
  }

  // Property is NOT ready - use property ready date
  if (!assumptions.propertyReadyDate) {
    // No ready date set but property not ready - use purchase date factor as fallback
    return getPurchaseYearFactor(calendarYear, assumptions);
  }

  const [readyYear, readyMonth] = assumptions.propertyReadyDate.split('-').map(Number);

  // If ready date is before this calendar year, full year operational
  // (but still consider purchase year for Y1)
  if (readyYear < calendarYear) {
    return getPurchaseYearFactor(calendarYear, assumptions);
  }

  // If ready date is after this calendar year, no operations
  if (readyYear > calendarYear) return 0;

  // Ready date is within this calendar year
  // Calculate months operational (from ready month to December)
  const monthsOperational = 13 - readyMonth;
  return monthsOperational / 12;
}

export function calculateProjections(assumptions: Assumptions): YearlyData[] {
  const data: YearlyData[] = [];
  const baseYear = getBaseYear(assumptions);

  // Track unprorated base values for growth calculations (not affected by operational factor)
  let prevUnproratedFB = 0;
  let prevUnproratedSpa = 0;
  let prevUnproratedOODs = 0;
  let prevUnproratedMisc = 0;

  for (let i = 0; i < 10; i++) {
    const calendarYear = baseYear + i;
    const prevYear: YearlyData | null = i > 0 ? data[i - 1] : null;

    // Get operational factor for this year (affects occupancy due to property readiness)
    const operationalFactor = getOperationalFactor(calendarYear, assumptions);

    // Operational Metrics
    const keys = assumptions.keys;
    const occupancyIncrease = i === 0 ? 0 : (assumptions.occupancyIncreases[i - 1] ?? 0);

    // Base occupancy calculation
    const baseOccupancy = i === 0 ? assumptions.y1Occupancy : (prevYear?.occupancy || 0) + occupancyIncrease;
    // Apply operational factor (prorates occupancy if property not ready full year)
    const occupancy = baseOccupancy * operationalFactor;

    // ADR only shows and grows from operational years
    // For pre-operational years, ADR is 0 (empty)
    const isOperational = operationalFactor > 0;
    const wasOperationalLastYear = prevYear ? getOperationalFactor(calendarYear - 1, assumptions) > 0 : false;

    let adr: number;
    let adrGrowth: number;

    if (!isOperational) {
      // Pre-operational years: ADR is 0
      adr = 0;
      adrGrowth = 0;
    } else if (!wasOperationalLastYear) {
      // First operational year: use base ADR, no growth yet
      adr = assumptions.y1ADR;
      adrGrowth = 0;
    } else {
      // Subsequent operational years: apply growth
      adrGrowth = assumptions.adrGrowth;
      adr = (prevYear?.adr || assumptions.y1ADR) * (1 + adrGrowth / 100);
    }
    
    // Key Performance Indicators
    const revpar = adr * (occupancy / 100);
    
    // Revenue Categories (prorated by operational factor when property not ready)
    const revenueRooms = keys * 365 * (occupancy / 100) * adr;

    // Calculate unprorated base values for this year (used for growth and display)
    const unproratedFB = i === 0 ? assumptions.y1FB : prevUnproratedFB * (1 + assumptions.fbGrowth / 100);
    const unproratedSpa = i === 0 ? assumptions.y1Spa : prevUnproratedSpa * (1 + assumptions.spaGrowth / 100);
    const unproratedOODs = i === 0 ? assumptions.y1OODs : prevUnproratedOODs;
    const unproratedMisc = i === 0 ? assumptions.y1Misc : prevUnproratedMisc;

    // Apply operational factor to non-room revenues (only for the year property becomes ready)
    const revenueFB = unproratedFB * operationalFactor;
    const revenueSpa = unproratedSpa * operationalFactor;
    const revenueOODs = unproratedOODs * operationalFactor;
    const revenueMisc = unproratedMisc * operationalFactor;

    // Store unprorated values for next year's growth calculation
    prevUnproratedFB = unproratedFB;
    prevUnproratedSpa = unproratedSpa;
    prevUnproratedOODs = unproratedOODs;
    prevUnproratedMisc = unproratedMisc;
    
    const totalRevenue = revenueRooms + revenueFB + revenueSpa + revenueOODs + revenueMisc;
    const trevpar = totalRevenue / (keys * 365);
    const revenueGrowth = prevYear ? ((totalRevenue / prevYear.totalRevenue) - 1) * 100 : 0;

    // Percentages of Revenue
    const revenueRoomsPercent = totalRevenue ? (revenueRooms / totalRevenue) * 100 : 0;
    const revenueFBPercent = totalRevenue ? (revenueFB / totalRevenue) * 100 : 0;
    const revenueSpaPercent = totalRevenue ? (revenueSpa / totalRevenue) * 100 : 0;
    const revenueOODsPercent = totalRevenue ? (revenueOODs / totalRevenue) * 100 : 0;
    const revenueMiscPercent = totalRevenue ? (revenueMisc / totalRevenue) * 100 : 0;

    // Direct Operating Costs
    const costRooms = revenueRooms * (assumptions.roomsCostPct / 100);
    const costFB = revenueFB * (assumptions.fbCostPct / 100);
    const costSpa = revenueSpa * (assumptions.spaCostPct / 100);
    const costOther = revenueOODs * (assumptions.otherCostPct / 100);
    const costMisc = revenueMisc * (assumptions.miscCostPct / 100);
    const costUtilities = totalRevenue * (assumptions.utilitiesPct / 100);
    
    const totalOperatingCost = costRooms + costFB + costSpa + costOther + costMisc + costUtilities;
    const operatingCostPercent = totalRevenue ? (totalOperatingCost / totalRevenue) * 100 : 0;

    // Undistributed Expenses
    const undistributedAdmin = totalRevenue * (assumptions.adminPct / 100);
    const undistributedSales = totalRevenue * (assumptions.salesPct / 100);
    const undistributedMaintenance = totalRevenue * (assumptions.maintPct / 100);
    
    const totalUndistributedCost = undistributedAdmin + undistributedSales + undistributedMaintenance;
    const undistributedCostPercent = totalRevenue ? (totalUndistributedCost / totalRevenue) * 100 : 0;

    // GOP Calculation
    const gop = totalRevenue - totalOperatingCost - totalUndistributedCost;
    const gopMargin = totalRevenue ? (gop / totalRevenue) * 100 : 0;

    // Management & Ownership Fees (prorated for partial years based on purchase date)
    const purchaseYearFactor = getPurchaseYearFactor(calendarYear, assumptions);
    const baseCAM = i === 0 ? assumptions.y1CAM : (prevYear?.feeCAM || 0) / (getPurchaseYearFactor(calendarYear - 1, assumptions) || 1) * (1 + assumptions.camGrowth / 100);
    const baseBaseFee = i === 0 ? assumptions.y1BaseFee : (prevYear?.feeBase || 0) / (getPurchaseYearFactor(calendarYear - 1, assumptions) || 1) * (1 + assumptions.baseFeeGrowth / 100);
    const baseTechFee = i === 0 ? assumptions.y1TechFee : (prevYear?.feeTech || 0) / (getPurchaseYearFactor(calendarYear - 1, assumptions) || 1) * (1 + assumptions.techFeeGrowth / 100);

    // Apply purchase year factor to prorate fees for partial years
    const feeCAM = baseCAM * purchaseYearFactor;
    const feeBase = baseBaseFee * purchaseYearFactor;
    const feeTech = baseTechFee * purchaseYearFactor;
    const feeIncentive = gop * (assumptions.incentiveFeePct / 100);
    
    const totalManagementFees = feeCAM + feeBase + feeTech + feeIncentive;
    const managementFeesPercent = totalRevenue ? (totalManagementFees / totalRevenue) * 100 : 0;

    // Final Profit & ROI
    const takeHomeProfit = gop - totalManagementFees;
    const profitMargin = totalRevenue ? (takeHomeProfit / totalRevenue) * 100 : 0;

    const roiBeforeManagement = assumptions.initialInvestment ? (gop / assumptions.initialInvestment) * 100 : 0;
    const roiAfterManagement = assumptions.initialInvestment ? (takeHomeProfit / assumptions.initialInvestment) * 100 : 0;

    data.push({
      year: i + 1,
      calendarYear,
      keys,
      occupancy,
      occupancyIncrease,
      adr,
      adrGrowth,
      revpar,
      trevpar,
      revenueRooms, revenueRoomsPercent,
      revenueFB, revenueFBPercent,
      revenueSpa, revenueSpaPercent,
      revenueOODs, revenueOODsPercent,
      revenueMisc, revenueMiscPercent,
      totalRevenue, revenueGrowth,
      costRooms, costRoomsPercent: assumptions.roomsCostPct,
      costFB, costFBPercent: assumptions.fbCostPct,
      costSpa, costSpaPercent: assumptions.spaCostPct,
      costOther, costOtherPercent: assumptions.otherCostPct,
      costMisc, costMiscPercent: assumptions.miscCostPct,
      costUtilities, costUtilitiesPercent: assumptions.utilitiesPct,
      totalOperatingCost, operatingCostPercent,
      undistributedAdmin, undistributedAdminPercent: assumptions.adminPct,
      undistributedSales, undistributedSalesPercent: assumptions.salesPct,
      undistributedMaintenance, undistributedMaintenancePercent: assumptions.maintPct,
      totalUndistributedCost, undistributedCostPercent,
      gop, gopMargin,
      feeCAM, feeCAMPercent: totalRevenue ? (feeCAM / totalRevenue) * 100 : 0,
      feeBase, feeBasePercent: totalRevenue ? (feeBase / totalRevenue) * 100 : 0,
      feeTech, feeTechPercent: totalRevenue ? (feeTech / totalRevenue) * 100 : 0,
      feeIncentive, feeIncentivePercent: assumptions.incentiveFeePct,
      totalManagementFees, managementFeesPercent,
      takeHomeProfit, profitMargin,
      roiBeforeManagement, roiAfterManagement
    });
  }

  return data;
}

export function calculateAverage(data: YearlyData[]): Partial<YearlyData> {
  const avg: any = {};
  const count = data.length;
  if (count === 0) return avg;

  const numericKeys = [
    'occupancy', 'adr', 'revpar', 'trevpar', 
    'totalRevenue', 'totalOperatingCost', 'totalUndistributedCost', 
    'gop', 'gopMargin', 'totalManagementFees', 'takeHomeProfit', 
    'profitMargin', 'roiBeforeManagement', 'roiAfterManagement'
  ];
  
  numericKeys.forEach(k => {
    avg[k] = data.reduce((sum, item) => sum + ((item as any)[k] || 0), 0) / count;
  });

  return avg;
}
