# ROI Calculator - Complete Calculation Documentation

This document explains all calculations used in the 10-Year Rental ROI Calculator.

---

## Table of Contents

1. [Input Parameters](#input-parameters)
2. [Timeline & Operational Factor](#timeline--operational-factor)
3. [Operational Metrics](#operational-metrics)
4. [Revenue Calculations](#revenue-calculations)
5. [Operating Costs](#operating-costs)
6. [Undistributed Expenses](#undistributed-expenses)
7. [Gross Operating Profit (GOP)](#gross-operating-profit-gop)
8. [Management Fees](#management-fees)
9. [Net Profit & ROI](#net-profit--roi)
10. [Summary Metrics](#summary-metrics)

---

## Input Parameters

### Core Investment
| Parameter | Description |
|-----------|-------------|
| `initialInvestment` | Total capital expenditure (purchase price + setup costs) |
| `purchaseDate` | Month/Year when investment begins (YYYY-MM) |
| `keys` | Number of rental units/keys in the property |

### Property Readiness
| Parameter | Description |
|-----------|-------------|
| `isPropertyReady` | Whether property is operational at purchase |
| `propertyReadyDate` | If not ready, when it becomes operational (YYYY-MM) |

### First Operational Year Values
| Parameter | Description |
|-----------|-------------|
| `y1Occupancy` | Base occupancy rate (%) for first operational year |
| `y1ADR` | Average Daily Rate for first operational year |
| `y1FB` | Total annual Food & Beverage revenue |
| `y1Spa` | Total annual Wellness/Spa revenue |
| `y1OODs` | Total annual Other Operating Departments revenue |
| `y1Misc` | Total annual Miscellaneous revenue |

### Growth Rates (Annual %)
| Parameter | Description |
|-----------|-------------|
| `occupancyIncreases[]` | Array of occupancy point increases for Years 2-10 |
| `adrGrowth` | Annual ADR growth rate |
| `fbGrowth` | Annual F&B revenue growth rate |
| `spaGrowth` | Annual Wellness revenue growth rate |
| `camGrowth` | Annual CAM fee growth rate |
| `baseFeeGrowth` | Annual base management fee growth rate |
| `techFeeGrowth` | Annual technology fee growth rate |

### Cost Percentages (% of respective revenue)
| Parameter | Description |
|-----------|-------------|
| `roomsCostPct` | Direct room costs as % of room revenue |
| `fbCostPct` | F&B costs as % of F&B revenue |
| `spaCostPct` | Spa costs as % of spa revenue |
| `utilitiesPct` | Utilities as % of total revenue |

### Undistributed Expenses (% of total revenue)
| Parameter | Description |
|-----------|-------------|
| `adminPct` | Admin & General expenses |
| `salesPct` | Sales & Marketing expenses |
| `maintPct` | Property Operations & Maintenance |

### Management Fees
| Parameter | Description |
|-----------|-------------|
| `camFeePerUnit` | Monthly CAM fee per unit |
| `baseFeePercent` | Base fee as % of total revenue (first year) |
| `techFeePerUnit` | Monthly technology fee per unit |
| `incentiveFeePct` | Incentive fee as % of GOP |

---

## Timeline & Operational Factor

### Operational Factor
Determines what portion of a year the property is operational (0 to 1).

```
If property IS ready at purchase:
  - Purchase year: (13 - purchaseMonth) / 12
  - After purchase year: 1

If property is NOT ready:
  - Before ready year: 0
  - Ready year: (13 - readyMonth) / 12
  - After ready year: 1
```

**Example:**
- Purchase: January 2026, Ready: January 2028
- Year 1 (2026): operationalFactor = 0 (not ready)
- Year 2 (2027): operationalFactor = 0 (not ready)
- Year 3 (2028): operationalFactor = 1 (ready from Jan)
- Years 4-10: operationalFactor = 1

---

## Operational Metrics

### Keys (Units)
```
keys = assumptions.keys (constant across all years)
```

### Occupancy

**Development Phase (not operational):**
```
occupancy = 0%
occupancyIncrease = 0%
```

**First Operational Year:**
```
occupancy = y1Occupancy × operationalFactor
occupancyIncrease = y1Occupancy (shown as increase from 0)
```

**Subsequent Operational Years:**
```
operationalYearNumber = currentYearIndex - firstOperationalYearIndex
occupancyIncrease = occupancyIncreases[operationalYearNumber - 1]
occupancy = previousOccupancy + occupancyIncrease
```

**Example (Purchase 2026, Ready 2028):**
| Year | Calendar | Operational Year | Occupancy Increase | Occupancy |
|------|----------|------------------|-------------------|-----------|
| 1 | 2026 | - | 0% | 0% |
| 2 | 2027 | - | 0% | 0% |
| 3 | 2028 | 1st | 70% (base) | 70% |
| 4 | 2029 | 2nd | 5.5% (Y2 input) | 75.5% |
| 5 | 2030 | 3rd | 5.25% (Y3 input) | 80.75% |

### Average Daily Rate (ADR)

**Development Phase:**
```
adr = 0
adrGrowth = 0%
```

**First Operational Year:**
```
adr = y1ADR
adrGrowth = 0%
```

**Subsequent Operational Years:**
```
adrGrowth = assumptions.adrGrowth
adr = previousADR × (1 + adrGrowth / 100)
```

### RevPAR (Revenue Per Available Room)
```
revpar = adr × (occupancy / 100)
```

---

## Revenue Calculations

### Rooms Revenue
```
revenueRooms = keys × 365 × (occupancy / 100) × adr
```

**Breakdown:**
- `keys × 365` = Total room nights available per year
- `× (occupancy / 100)` = Occupied room nights
- `× adr` = Revenue per occupied night

### Food & Beverage Revenue

**Development Phase:**
```
revenueFB = 0 (base value preserved as y1FB)
```

**First Operational Year:**
```
revenueFB = y1FB × operationalFactor
```

**Subsequent Operational Years:**
```
baseFB = previousBaseFB × (1 + fbGrowth / 100)
revenueFB = baseFB × operationalFactor
```

### Wellness/Spa Revenue
Same logic as F&B:
```
revenueSpa = baseSpa × operationalFactor
```
Where `baseSpa` grows annually by `spaGrowth`.

### Total Revenue
```
totalRevenue = revenueRooms + revenueFB + revenueSpa + revenueOODs + revenueMisc
```

### Revenue Growth
```
revenueGrowth = ((totalRevenue / previousTotalRevenue) - 1) × 100
```

### TRevPAR (Total Revenue Per Available Room)
```
trevpar = totalRevenue / (keys × 365)
```

---

## Operating Costs

### Direct Department Costs
```
costRooms = revenueRooms × (roomsCostPct / 100)
costFB = revenueFB × (fbCostPct / 100)
costSpa = revenueSpa × (spaCostPct / 100)
costOther = revenueOODs × (otherCostPct / 100)
costMisc = revenueMisc × (miscCostPct / 100)
```

### Utilities
```
costUtilities = totalRevenue × (utilitiesPct / 100)
```

### Total Operating Cost
```
totalOperatingCost = costRooms + costFB + costSpa + costOther + costMisc + costUtilities
```

---

## Undistributed Expenses

```
undistributedAdmin = totalRevenue × (adminPct / 100)
undistributedSales = totalRevenue × (salesPct / 100)
undistributedMaintenance = totalRevenue × (maintPct / 100)

totalUndistributedCost = undistributedAdmin + undistributedSales + undistributedMaintenance
```

---

## Gross Operating Profit (GOP)

```
GOP = totalRevenue - totalOperatingCost - totalUndistributedCost
```

### GOP Margin
```
gopMargin = (GOP / totalRevenue) × 100
```

---

## Management Fees

### Technology Fee
Charged from Year 1 (even during development), growth starts after first operational year.

```
baseAnnualTechFee = techFeePerUnit × 12 × keys

Year 1:
  feeTech = baseAnnualTechFee × purchaseYearFactor

Development & First Operational Year:
  feeTech = baseAnnualTechFee

After First Operational Year:
  yearsOfGrowth = currentYear - firstOperationalYear
  feeTech = baseAnnualTechFee × (1 + techFeeGrowth / 100)^yearsOfGrowth
```

### CAM Fee (Common Area Maintenance)
Only charged when property is operational.

```
Development Phase:
  feeCAM = 0

First Operational Year:
  feeCAM = camFeePerUnit × 12 × keys × operationalFactor

Subsequent Operational Years:
  feeCAM = previousFeeCAM × (1 + camGrowth / 100)
```

### Base Management Fee
Percentage of revenue in first operational year, then grows independently.

```
Development Phase:
  feeBase = 0

First Operational Year:
  feeBase = totalRevenue × (baseFeePercent / 100)

Subsequent Operational Years:
  feeBase = previousFeeBase × (1 + baseFeeGrowth / 100)
```

### Incentive Fee
Percentage of GOP (only when operational).

```
feeIncentive = GOP × (incentiveFeePct / 100)
```

### Total Management Fees
```
totalManagementFees = feeCAM + feeBase + feeTech + feeIncentive
```

---

## Net Profit & ROI

### Take Home Profit (Net Profit)
```
takeHomeProfit = GOP - totalManagementFees
```

### Net Profit Margin
```
profitMargin = (takeHomeProfit / totalRevenue) × 100
```

### ROI Before Management
```
roiBeforeManagement = (GOP / initialInvestment) × 100
```

### ROI - Net Yield (ROI After Management)
```
roiAfterManagement = (takeHomeProfit / initialInvestment) × 100
```

**This is the key metric** - it shows your annual return on investment after all expenses.

---

## Summary Metrics

### 10-Year Averages
```
avgOccupancy = sum(occupancy) / 10
avgADR = sum(adr) / 10
avgGopMargin = sum(gopMargin) / 10
avgNetYield = sum(roiAfterManagement) / 10
```

### 10-Year Totals
```
totalRevenue10Y = sum(totalRevenue)
totalProfit10Y = sum(takeHomeProfit)
avgAnnualProfit = totalProfit10Y / 10
```

### Payback Period
```
paybackYears = initialInvestment / avgAnnualProfit
```

---

## Example Calculation

**Inputs:**
- Initial Investment: Rp 15,087,472,000
- Keys: 18
- Purchase Date: Jan 2026
- Property Ready: Jan 2028
- Y1 Occupancy: 70%
- Y1 ADR: Rp 1,900,000
- Y1 F&B: Rp 216,000,000
- Y1 Wellness: Rp 64,800,000
- ADR Growth: 5%
- F&B Growth: 3%
- Rooms Cost: 20%
- F&B Cost: 80%
- Wellness Cost: 80%
- Utilities: 7%
- Admin: 1%
- Sales: 2.5%
- Maintenance: 2%
- CAM Fee: Rp 1,250,000/unit/month
- Base Fee: 2%
- Tech Fee: Rp 1,200,000/unit/month

**Year 3 (2028 - First Operational) Calculation:**

1. **Rooms Revenue:**
   ```
   = 18 × 365 × (70/100) × 1,900,000
   = 18 × 365 × 0.70 × 1,900,000
   = 8,738,100,000
   ```

2. **Total Revenue:**
   ```
   = 8,738,100,000 + 216,000,000 + 64,800,000
   = 9,018,900,000
   ```

3. **Operating Costs:**
   ```
   Rooms: 8,738,100,000 × 0.20 = 1,747,620,000
   F&B: 216,000,000 × 0.80 = 172,800,000
   Wellness: 64,800,000 × 0.80 = 51,840,000
   Utilities: 9,018,900,000 × 0.07 = 631,323,000
   Total: 2,603,583,000
   ```

4. **Undistributed:**
   ```
   Admin: 9,018,900,000 × 0.01 = 90,189,000
   Sales: 9,018,900,000 × 0.025 = 225,472,500
   Maint: 9,018,900,000 × 0.02 = 180,378,000
   Total: 496,039,500
   ```

5. **GOP:**
   ```
   = 9,018,900,000 - 2,603,583,000 - 496,039,500
   = 5,919,277,500
   GOP Margin: 65.63%
   ```

6. **Management Fees:**
   ```
   CAM: 1,250,000 × 12 × 18 = 270,000,000
   Base: 9,018,900,000 × 0.02 = 180,378,000
   Tech: 1,200,000 × 12 × 18 = 259,200,000
   Total: 709,578,000
   ```

7. **Net Profit:**
   ```
   = 5,919,277,500 - 709,578,000
   = 5,209,699,500
   ```

8. **ROI - Net Yield:**
   ```
   = (5,209,699,500 / 15,087,472,000) × 100
   = 34.53%
   ```

---

## Notes

1. **Occupancy Increase Mapping:** The UI shows Y2-Y10 inputs, which map to operational years 2-10. If property becomes operational in Year 3, then Y2 input applies to Year 4 (2nd operational year).

2. **Proration:** Partial year operations are prorated by `operationalFactor`. For example, if property opens in July, operationalFactor = 6/12 = 0.5.

3. **Growth Timing:**
   - ADR, F&B, Spa growth starts from 2nd operational year
   - Tech fee growth starts from 2nd operational year
   - CAM and Base fee growth starts from 2nd operational year

4. **Tech Fee During Development:** Unlike other fees, tech fee is charged even during development phase (assumed for booking systems, etc.).
