import jsPDF from 'jspdf';
import type { YearlyData, Assumptions, CurrencyConfig } from '../types';
import { formatCurrency } from '../constants';

interface PDFExportOptions {
  data: YearlyData[];
  assumptions: Assumptions;
  currency: CurrencyConfig;
  projectName?: string;
}

// Light theme colors matching XIRR design
const COLORS = {
  white: [255, 255, 255] as [number, number, number],
  background: [250, 251, 252] as [number, number, number],
  cardBg: [255, 255, 255] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  borderLight: [243, 244, 246] as [number, number, number],

  textDark: [17, 24, 39] as [number, number, number],
  textMedium: [75, 85, 99] as [number, number, number],
  textLight: [156, 163, 175] as [number, number, number],

  primary: [34, 197, 94] as [number, number, number],
  primaryDark: [22, 163, 74] as [number, number, number],
  primaryLight: [220, 252, 231] as [number, number, number],

  brandPurple: [99, 102, 241] as [number, number, number],

  orange: [249, 115, 22] as [number, number, number],
  orangeLight: [255, 237, 213] as [number, number, number],

  red: [239, 68, 68] as [number, number, number],
  redLight: [254, 226, 226] as [number, number, number],
};

// Font sizes
const FONT = {
  xs: 6,
  sm: 7,
  base: 8,
  md: 9,
  lg: 11,
  xl: 14,
  xxl: 18,
};

// Helper to cap percentages to reasonable bounds
function capPercent(value: number, max: number = 999): string {
  if (!isFinite(value) || isNaN(value)) return '0.0';
  const capped = Math.max(-max, Math.min(max, value));
  return capped.toFixed(1);
}

// Helper to calculate growth with bounds
function calcGrowth(y1: number, y10: number): number {
  if (y1 === 0 || !isFinite(y1) || !isFinite(y10)) return 0;
  const growth = ((y10 - y1) / Math.abs(y1)) * 100;
  // Cap at +/- 999%
  return Math.max(-999, Math.min(999, growth));
}

export function generateRentalROIPDF(options: PDFExportOptions): void {
  const { data, assumptions, currency, projectName } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Calculate metrics with bounds checking
  const totalRevenue = data.reduce((s, i) => s + i.totalRevenue, 0);
  const totalProfit = data.reduce((s, i) => s + i.takeHomeProfit, 0);
  const avgProfit = totalProfit / data.length;
  const avgNetYield = data.reduce((s, i) => s + i.roiAfterManagement, 0) / data.length;
  const avgGopMargin = data.reduce((s, i) => s + i.gopMargin, 0) / data.length;
  const paybackYears = totalProfit > 0 ? assumptions.initialInvestment / (totalProfit / 10) : 99;
  const y1Data = data[0];
  const y10Data = data[9];

  // Page background
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ========================================
  // HEADER SECTION
  // ========================================
  const logoBoxSize = 12;
  doc.setFillColor(...COLORS.brandPurple);
  doc.roundedRect(margin, yPos, logoBoxSize, logoBoxSize, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');
  doc.text('ROI', margin + logoBoxSize / 2, yPos + 7.5, { align: 'center' });

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.xl);
  doc.setFont('helvetica', 'bold');
  doc.text('ROI Calculate', margin + logoBoxSize + 4, yPos + 5);

  doc.setTextColor(...COLORS.brandPurple);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('Property Investment Tools', margin + logoBoxSize + 4, yPos + 10);

  // Right side - Generated date
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.text('GENERATED ON', pageWidth - margin, yPos + 2, { align: 'right' });
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.text(dateStr, pageWidth - margin, yPos + 6, { align: 'right' });
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text(`Currency: ${currency.code}`, pageWidth - margin, yPos + 10, { align: 'right' });

  yPos += 20;

  // Project name with more spacing
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.xxl);
  doc.setFont('helvetica', 'bold');
  doc.text(projectName || '10-Year Rental Analysis', margin, yPos);
  yPos += 6;

  // Property details
  doc.setTextColor(...COLORS.textMedium);
  doc.setFontSize(FONT.base);
  doc.setFont('helvetica', 'normal');
  doc.text(`${assumptions.keys}-Key Property  |  ${formatCurrency(assumptions.initialInvestment, currency)} Investment  |  10-Year Projections`, margin, yPos);
  yPos += 10;

  // ========================================
  // AI DEAL ANALYZER SECTION (XIRR style)
  // ========================================
  const aiCardHeight = 38;

  // Compute deal rating based on avg net yield
  const getDealRating = () => {
    if (avgNetYield >= 15) return { grade: 'A+', label: 'Excellent', color: COLORS.primary, confidence: 92 };
    if (avgNetYield >= 12) return { grade: 'A', label: 'Very Good', color: COLORS.primary, confidence: 85 };
    if (avgNetYield >= 9) return { grade: 'OK', label: 'Good', color: COLORS.primary, confidence: 78 };
    if (avgNetYield >= 6) return { grade: 'OK', label: 'Fair', color: COLORS.orange, confidence: 70 };
    if (avgNetYield >= 3) return { grade: 'C', label: 'Below Average', color: COLORS.orange, confidence: 60 };
    return { grade: 'D', label: 'Poor', color: COLORS.red, confidence: 50 };
  };

  const dealRating = getDealRating();

  // Risk assessment
  const riskLevel = paybackYears <= 5 ? 'Low' : paybackYears <= 8 ? 'Moderate' : 'High';

  // Appreciation assessment
  const totalGrowthPct = calcGrowth(y1Data.takeHomeProfit, y10Data.takeHomeProfit);
  const appreciationType = totalGrowthPct >= 100 ? 'High' : totalGrowthPct >= 50 ? 'Moderate' : 'Low';

  // Main card background
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, aiCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, aiCardHeight, 2, 2, 'S');

  // Left section - Deal Rating box (XIRR style)
  const ratingBoxWidth = 36;
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(margin + 4, yPos + 4, ratingBoxWidth, aiCardHeight - 8, 2, 2, 'F');

  // Rating circle icon
  doc.setFillColor(...COLORS.primary);
  doc.circle(margin + 4 + ratingBoxWidth / 2, yPos + 12, 5, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.base);
  doc.setFont('helvetica', 'bold');
  doc.text(dealRating.grade.length > 2 ? 'OK' : dealRating.grade, margin + 4 + ratingBoxWidth / 2, yPos + 13.5, { align: 'center' });

  // Deal rating text
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('DEAL RATING', margin + 4 + ratingBoxWidth / 2, yPos + 21, { align: 'center' });

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text(dealRating.label, margin + 4 + ratingBoxWidth / 2, yPos + 27, { align: 'center' });

  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text(`AI Confidence: ${dealRating.confidence}%`, margin + 4 + ratingBoxWidth / 2, yPos + 32, { align: 'center' });

  // Right section - Summary text
  const summaryX = margin + ratingBoxWidth + 10;
  const summaryWidth = contentWidth - ratingBoxWidth - 14;

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  const aiTitle = 'AI Deal Analyzer Summary';
  doc.text(aiTitle, summaryX, yPos + 8);
  const aiTitleWidth = doc.getTextWidth(aiTitle);

  // BETA badge - position after title (XIRR style - light green background)
  const betaBadgeX = summaryX + aiTitleWidth + 4;
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(betaBadgeX, yPos + 4, 14, 5, 1, 1, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'bold');
  doc.text('BETA', betaBadgeX + 7, yPos + 7.5, { align: 'center' });

  // AI-generated summary text
  doc.setTextColor(...COLORS.textMedium);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'normal');
  const aiSummary = `This ${assumptions.keys}-key property shows ${dealRating.label.toLowerCase()} investment potential with projected ${capPercent(avgNetYield)}% avg net yield over 10 years. With ${formatCurrency(totalProfit, currency)} total profit and ${paybackYears < 99 ? paybackYears.toFixed(1) : '10+'} year payback, this rental strategy offers ${appreciationType.toLowerCase()} appreciation potential.`;
  const splitSummary = doc.splitTextToSize(aiSummary, summaryWidth);
  doc.text(splitSummary.slice(0, 3), summaryX, yPos + 14);

  // Tags row (XIRR style - dynamic width)
  const tagY = yPos + aiCardHeight - 7;
  const tags = [
    { text: `${appreciationType} Appreciation` },
    { text: 'Period: 10 Years' },
    { text: `Risk: ${riskLevel}` },
  ];

  let tagX = summaryX;
  tags.forEach(tag => {
    const tagWidth = doc.getTextWidth(tag.text) + 6;
    doc.setFillColor(...COLORS.background);
    doc.roundedRect(tagX, tagY, tagWidth, 5, 1, 1, 'F');
    doc.setTextColor(...COLORS.textMedium);
    doc.setFontSize(FONT.xs);
    doc.text(tag.text, tagX + 3, tagY + 3.5);
    tagX += tagWidth + 3;
  });

  yPos += aiCardHeight + 6;

  // ========================================
  // KEY METRICS ROW (5 boxes)
  // ========================================
  const metricBoxWidth = (contentWidth - 8) / 5;
  const metricBoxHeight = 26;

  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, metricBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, metricBoxHeight, 2, 2, 'S');

  const metrics = [
    { label: 'AVG NET YIELD', value: `${capPercent(avgNetYield)}%`, subtitle: 'Annual Return', isHighlight: true },
    { label: '10Y NET PROFIT', value: formatCurrency(totalProfit, currency), subtitle: 'Total Earnings', isHighlight: false },
    { label: 'AVG CASH FLOW', value: formatCurrency(avgProfit, currency), subtitle: 'Per Year', isHighlight: false },
    { label: 'GOP MARGIN', value: `${capPercent(avgGopMargin)}%`, subtitle: 'Avg Margin', isHighlight: false },
    { label: 'PAYBACK', value: paybackYears < 99 ? `${paybackYears.toFixed(1)} Yrs` : 'N/A', subtitle: 'Recovery', isHighlight: false },
  ];

  metrics.forEach((metric, i) => {
    const boxX = margin + i * (metricBoxWidth + 2);

    if (i > 0) {
      doc.setDrawColor(...COLORS.borderLight);
      doc.line(boxX - 1, yPos + 4, boxX - 1, yPos + metricBoxHeight - 4);
    }

    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, boxX + 3, yPos + 7);

    if (metric.isHighlight) {
      doc.setTextColor(...COLORS.primary);
    } else {
      doc.setTextColor(...COLORS.textDark);
    }
    doc.setFontSize(FONT.lg);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, boxX + 3, yPos + 15);

    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.subtitle, boxX + 3, yPos + 21);
  });

  yPos += metricBoxHeight + 8;

  // ========================================
  // INVESTMENT PARAMETERS
  // ========================================
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment Parameters', margin, yPos);
  yPos += 5;

  const paramBoxHeight = 22;
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, paramBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, paramBoxHeight, 2, 2, 'S');

  const params = [
    { label: 'Initial Investment', value: formatCurrency(assumptions.initialInvestment, currency) },
    { label: 'Property Keys', value: assumptions.keys.toString() },
    { label: 'Y1 Occupancy', value: `${assumptions.y1Occupancy}%` },
    { label: 'Y1 ADR', value: formatCurrency(assumptions.y1ADR, currency) },
    { label: 'ADR Growth', value: `${assumptions.adrGrowth}%` },
    { label: 'Base Year', value: assumptions.baseYear.toString() },
  ];

  const paramWidth = contentWidth / 6;
  params.forEach((param, i) => {
    const px = margin + 4 + i * paramWidth;
    if (i > 0) {
      doc.setDrawColor(...COLORS.borderLight);
      doc.line(px - 2, yPos + 3, px - 2, yPos + paramBoxHeight - 3);
    }
    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text(param.label, px, yPos + 7);
    doc.setTextColor(...COLORS.textDark);
    doc.setFontSize(FONT.sm);
    doc.setFont('helvetica', 'bold');
    doc.text(param.value, px, yPos + 14);
  });

  yPos += paramBoxHeight + 8;

  // ========================================
  // 10-YEAR PROJECTIONS TABLE
  // ========================================
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('10-Year Financial Projections', margin, yPos);
  yPos += 5;

  const tableHeaders = ['Year', 'Revenue', 'Expenses', 'GOP', 'Mgmt Fees', 'Net Profit', 'ROI %'];
  const colWidths = [14, 28, 28, 26, 26, 28, 18];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const rowHeight = 6.5;

  doc.setFillColor(...COLORS.textDark);
  doc.rect(margin, yPos, tableWidth, rowHeight + 1, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'bold');

  let headerX = margin + 2;
  tableHeaders.forEach((header, i) => {
    doc.text(header, headerX, yPos + 4.5);
    headerX += colWidths[i];
  });
  yPos += rowHeight + 1;

  data.forEach((row, i) => {
    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, yPos, tableWidth, rowHeight, 'F');

    let cellX = margin + 2;
    doc.setFontSize(FONT.sm);
    doc.setFont('helvetica', 'normal');

    doc.setTextColor(...COLORS.textDark);
    doc.text(`Y${row.year}`, cellX, yPos + 4.5);
    cellX += colWidths[0];

    doc.text(formatCurrency(row.totalRevenue, currency), cellX, yPos + 4.5);
    cellX += colWidths[1];

    const totalExpenses = row.totalOperatingCost + row.totalUndistributedCost;
    doc.text(formatCurrency(totalExpenses, currency), cellX, yPos + 4.5);
    cellX += colWidths[2];

    doc.setTextColor(...COLORS.primary);
    doc.text(formatCurrency(row.gop, currency), cellX, yPos + 4.5);
    cellX += colWidths[3];

    doc.setTextColor(...COLORS.orange);
    doc.text(formatCurrency(row.totalManagementFees, currency), cellX, yPos + 4.5);
    cellX += colWidths[4];

    doc.setTextColor(row.takeHomeProfit >= 0 ? COLORS.primary[0] : COLORS.red[0], row.takeHomeProfit >= 0 ? COLORS.primary[1] : COLORS.red[1], row.takeHomeProfit >= 0 ? COLORS.primary[2] : COLORS.red[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(row.takeHomeProfit, currency), cellX, yPos + 4.5);
    cellX += colWidths[5];

    doc.setTextColor(...COLORS.textDark);
    doc.setFont('helvetica', 'normal');
    doc.text(`${capPercent(row.roiAfterManagement)}%`, cellX, yPos + 4.5);

    yPos += rowHeight;
  });

  // Totals row
  doc.setFillColor(...COLORS.primaryLight);
  doc.rect(margin, yPos, tableWidth, rowHeight + 1, 'F');
  doc.setTextColor(...COLORS.primaryDark);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');

  let totalX = margin + 2;
  doc.text('TOTAL', totalX, yPos + 5);
  totalX += colWidths[0];
  doc.text(formatCurrency(totalRevenue, currency), totalX, yPos + 5);
  totalX += colWidths[1];
  const totalExpenses = data.reduce((s, d) => s + d.totalOperatingCost + d.totalUndistributedCost, 0);
  doc.text(formatCurrency(totalExpenses, currency), totalX, yPos + 5);
  totalX += colWidths[2];
  const totalGOP = data.reduce((s, d) => s + d.gop, 0);
  doc.text(formatCurrency(totalGOP, currency), totalX, yPos + 5);
  totalX += colWidths[3];
  const totalMgmt = data.reduce((s, d) => s + d.totalManagementFees, 0);
  doc.text(formatCurrency(totalMgmt, currency), totalX, yPos + 5);
  totalX += colWidths[4];
  doc.text(formatCurrency(totalProfit, currency), totalX, yPos + 5);
  totalX += colWidths[5];
  doc.text(`${capPercent(avgNetYield)}%`, totalX, yPos + 5);

  yPos += rowHeight + 10;

  // ========================================
  // Y1 vs Y10 COMPARISON (Fixed layout)
  // ========================================
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Year 1 vs Year 10 Growth', margin, yPos);
  yPos += 5;

  const compBoxHeight = 24;
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, compBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, compBoxHeight, 2, 2, 'S');

  const comparisons = [
    { label: 'REVENUE', y1: y1Data.totalRevenue, y10: y10Data.totalRevenue },
    { label: 'GOP', y1: y1Data.gop, y10: y10Data.gop },
    { label: 'NET PROFIT', y1: y1Data.takeHomeProfit, y10: y10Data.takeHomeProfit },
    { label: 'OCCUPANCY', y1: y1Data.occupancy, y10: y10Data.occupancy, isPercent: true },
    { label: 'ADR', y1: y1Data.adr, y10: y10Data.adr },
  ];

  const compWidth = contentWidth / 5;
  comparisons.forEach((comp, i) => {
    const cx = margin + 4 + i * compWidth;
    if (i > 0) {
      doc.setDrawColor(...COLORS.borderLight);
      doc.line(cx - 2, yPos + 3, cx - 2, yPos + compBoxHeight - 3);
    }

    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'bold');
    doc.text(comp.label, cx, yPos + 6);

    // Y1 value
    doc.setTextColor(...COLORS.textMedium);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    if (comp.isPercent) {
      doc.text(`Y1: ${comp.y1.toFixed(0)}%`, cx, yPos + 11);
      doc.text(`Y10: ${comp.y10.toFixed(0)}%`, cx, yPos + 16);
    } else {
      doc.text(`Y1: ${formatCurrency(comp.y1, currency)}`, cx, yPos + 11);
      doc.text(`Y10: ${formatCurrency(comp.y10, currency)}`, cx, yPos + 16);
    }

    // Growth percentage (capped)
    const growth = calcGrowth(comp.y1, comp.y10);
    doc.setTextColor(growth >= 0 ? COLORS.primary[0] : COLORS.red[0], growth >= 0 ? COLORS.primary[1] : COLORS.red[1], growth >= 0 ? COLORS.primary[2] : COLORS.red[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${growth >= 0 ? '+' : ''}${growth.toFixed(0)}%`, cx + compWidth - 18, yPos + 13);
  });

  yPos += compBoxHeight + 6;

  // ========================================
  // FOOTER - PAGE 1
  // ========================================
  const footerY = pageHeight - 10;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by ROI Calculate - Property Investment Tools', margin, footerY);
  doc.text('Page 1 of 2', pageWidth / 2, footerY, { align: 'center' });
  doc.text(new Date().toLocaleDateString(), pageWidth - margin, footerY, { align: 'right' });

  // ========================================
  // PAGE 2 - Detailed Breakdown
  // ========================================
  doc.addPage();
  yPos = margin;

  // Page 2 background
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Page 2 header
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.lg);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary by Year', margin, yPos + 6);
  yPos += 14;

  // Performance grid - 2x5 layout
  const perfBoxWidth = (contentWidth - 4) / 5;
  const perfBoxHeight = 22;

  data.forEach((row, i) => {
    const colIndex = i % 5;
    const rowIndex = Math.floor(i / 5);
    const px = margin + colIndex * (perfBoxWidth + 1);
    const py = yPos + rowIndex * (perfBoxHeight + 2);

    // Box background
    doc.setFillColor(...COLORS.cardBg);
    doc.roundedRect(px, py, perfBoxWidth, perfBoxHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(px, py, perfBoxWidth, perfBoxHeight, 2, 2, 'S');

    // Year label
    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'bold');
    doc.text(`YEAR ${row.year}`, px + 3, py + 5);

    // Net Profit
    doc.setTextColor(row.takeHomeProfit >= 0 ? COLORS.primary[0] : COLORS.red[0], row.takeHomeProfit >= 0 ? COLORS.primary[1] : COLORS.red[1], row.takeHomeProfit >= 0 ? COLORS.primary[2] : COLORS.red[2]);
    doc.setFontSize(FONT.sm);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(row.takeHomeProfit, currency), px + 3, py + 12);

    // ROI
    doc.setTextColor(...COLORS.textMedium);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text(`ROI: ${capPercent(row.roiAfterManagement)}%`, px + 3, py + 18);
  });

  // ========================================
  // FOOTER - PAGE 2
  // ========================================
  const footer2Y = pageHeight - 10;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, footer2Y - 3, pageWidth - margin, footer2Y - 3);

  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by ROI Calculate - Property Investment Tools', margin, footer2Y);
  doc.text('Page 2 of 2', pageWidth / 2, footer2Y, { align: 'center' });
  doc.text(new Date().toLocaleDateString(), pageWidth - margin, footer2Y, { align: 'right' });

  // Save PDF
  const fileName = `ROI_Calculate_${(projectName || 'Analysis').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
