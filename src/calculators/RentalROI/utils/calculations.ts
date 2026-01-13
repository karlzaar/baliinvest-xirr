
import type { Assumptions, YearlyData } from '../types';

export function calculateProjections(assumptions: Assumptions): YearlyData[] {
  const data: YearlyData[] = [];

  for (let i = 0; i < 10; i++) {
    const calendarYear = assumptions.baseYear + i;
    const prevYear: YearlyData | null = i > 0 ? data[i - 1] : null;

    // Operational Metrics
    const keys = assumptions.keys;
    const occupancyIncrease = i === 0 ? 0 : (assumptions.occupancyIncreases[i - 1] ?? 0);
    const occupancy = i === 0 ? assumptions.y1Occupancy : (prevYear?.occupancy || 0) + occupancyIncrease;
    const adrGrowth = i === 0 ? 0 : assumptions.adrGrowth;
    const adr = i === 0 ? assumptions.y1ADR : (prevYear?.adr || 0) * (1 + adrGrowth / 100);
    
    // Key Performance Indicators
    const revpar = adr * (occupancy / 100);
    
    // Revenue Categories
    const revenueRooms = keys * 365 * (occupancy / 100) * adr;
    const revenueFB = i === 0 ? assumptions.y1FB : (prevYear?.revenueFB || 0) * (1 + assumptions.fbGrowth / 100);
    const revenueSpa = i === 0 ? assumptions.y1Spa : (prevYear?.revenueSpa || 0) * (1 + assumptions.spaGrowth / 100);
    const revenueOODs = i === 0 ? assumptions.y1OODs : (prevYear?.revenueOODs || 0);
    const revenueMisc = i === 0 ? assumptions.y1Misc : (prevYear?.revenueMisc || 0);
    
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

    // Management & Ownership Fees
    const feeCAM = i === 0 ? assumptions.y1CAM : (prevYear?.feeCAM || 0) * (1 + assumptions.camGrowth / 100);
    const feeBase = i === 0 ? assumptions.y1BaseFee : (prevYear?.feeBase || 0) * (1 + assumptions.baseFeeGrowth / 100);
    const feeTech = i === 0 ? assumptions.y1TechFee : (prevYear?.feeTech || 0) * (1 + assumptions.techFeeGrowth / 100);
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
