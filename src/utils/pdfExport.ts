import jsPDF from 'jspdf';
import type { InvestmentData, XIRRResult } from '../types/investment';
import { generatePaymentSchedule } from './xirr';

interface PDFExportOptions {
  data: InvestmentData;
  result: XIRRResult;
  currency: string;
  symbol: string;
  formatDisplay: (idr: number) => string;
  formatAbbrev: (idr: number) => string;
  rate: number;
}

// Light theme colors matching the reference design
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

// Helper functions
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

function getDealRating(xirr: number): { rating: string; confidence: number } {
  if (xirr >= 0.25) return { rating: 'Excellent', confidence: 92 };
  if (xirr >= 0.18) return { rating: 'Very Good', confidence: 85 };
  if (xirr >= 0.12) return { rating: 'Good', confidence: 78 };
  if (xirr >= 0.08) return { rating: 'Fair', confidence: 70 };
  return { rating: 'Below Average', confidence: 60 };
}

function getMarketRisk(holdMonths: number, appreciation: number): string {
  if (holdMonths <= 18 && appreciation <= 30) return 'Low';
  if (holdMonths <= 30 && appreciation <= 50) return 'Moderate';
  return 'High';
}

function generateAISummary(
  data: InvestmentData,
  result: XIRRResult,
  symbol: string,
  pricePerSqm: number
): string {
  const xirr = (result.rate * 100).toFixed(1);
  const xirrNum = result.rate * 100;
  const years = (result.holdPeriodMonths / 12).toFixed(1);
  const months = result.holdPeriodMonths;
  const location = data.property.location || 'the selected location';
  const projectName = data.property.projectName || 'This property';
  const appreciation = data.property.totalPrice > 0
    ? ((data.exit.projectedSalesPrice - data.property.totalPrice) / data.property.totalPrice) * 100
    : 0;
  const totalROI = result.totalInvested > 0 ? (result.netProfit / result.totalInvested) * 100 : 0;
  const netProfitDisplay = Math.abs(result.netProfit);

  // Determine investment quality
  let qualityDesc: string;
  if (xirrNum >= 25) qualityDesc = 'exceptional';
  else if (xirrNum >= 18) qualityDesc = 'strong';
  else if (xirrNum >= 12) qualityDesc = 'solid';
  else if (xirrNum >= 5) qualityDesc = 'moderate';
  else if (xirrNum >= 0) qualityDesc = 'marginal';
  else qualityDesc = 'negative';

  // Determine time horizon description
  let timeDesc: string;
  if (months <= 12) timeDesc = 'short-term';
  else if (months <= 24) timeDesc = 'medium-term';
  else timeDesc = 'longer-term';

  // Build summary based on actual data
  const parts: string[] = [];

  // Opening with project and return
  if (result.netProfit >= 0) {
    parts.push(`${projectName} in ${location} shows a ${qualityDesc} investment opportunity with a projected ${xirr}% XIRR over ${years} years.`);
  } else {
    parts.push(`${projectName} in ${location} currently projects a ${xirr}% return over ${years} years, indicating potential losses.`);
  }

  // Appreciation and profit details
  if (appreciation > 0 && result.netProfit > 0) {
    parts.push(`With ${appreciation.toFixed(1)}% appreciation and ${symbol} ${netProfitDisplay.toLocaleString()} net profit, this ${timeDesc} flip strategy yields ${totalROI.toFixed(1)}% total ROI.`);
  } else if (appreciation <= 0) {
    parts.push(`The projected sale price shows ${appreciation.toFixed(1)}% change from purchase, which may not cover costs.`);
  }

  // Price per sqm insight if available
  if (pricePerSqm > 0 && data.property.propertySize > 0) {
    parts.push(`Entry at ${symbol} ${pricePerSqm.toLocaleString()}/m² for ${data.property.propertySize}m².`);
  }

  return parts.join(' ');
}

export function generatePDFReport(options: PDFExportOptions): void {
  const { data, result, currency, symbol, rate } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Derived calculations
  const toDisplay = (idr: number): number => Math.round(idr / rate);
  const pricePerSqm = data.property.propertySize > 0
    ? Math.round(toDisplay(data.property.totalPrice) / data.property.propertySize)
    : 0;
  const totalROI = result.totalInvested > 0 ? (result.netProfit / result.totalInvested) * 100 : 0;
  const appreciation = data.property.totalPrice > 0
    ? ((data.exit.projectedSalesPrice - data.property.totalPrice) / data.property.totalPrice) * 100
    : 0;
  const closingCosts = data.exit.projectedSalesPrice * (data.exit.closingCostPercent / 100);
  const netProceeds = data.exit.projectedSalesPrice - closingCosts;
  const salePricePerSqm = data.property.propertySize > 0
    ? Math.round(toDisplay(data.exit.projectedSalesPrice) / data.property.propertySize)
    : 0;
  const dealRating = getDealRating(result.rate);
  const marketRisk = getMarketRisk(result.holdPeriodMonths, appreciation);
  const downPayment = data.property.totalPrice * (data.payment.downPaymentPercent / 100);
  const remaining = data.property.totalPrice - downPayment;
  const monthlyPayment = data.payment.installmentMonths > 0 ? remaining / data.payment.installmentMonths : 0;

  // Page background
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ========================================
  // HEADER SECTION
  // ========================================

  // CONFIDENTIAL badge
  doc.setFillColor(...COLORS.orangeLight);
  doc.roundedRect(margin, yPos, 24, 5, 1, 1, 'F');
  doc.setTextColor(...COLORS.orange);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENTIAL', margin + 12, yPos + 3.5, { align: 'center' });

  // INVESTMENT REPORT text
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'normal');
  doc.text('INVESTMENT REPORT', margin + 28, yPos + 3.5);

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
  doc.text(`Base Currency: ${currency}`, pageWidth - margin, yPos + 10, { align: 'right' });

  yPos += 12;

  // Project name (large)
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.xxl);
  doc.setFont('helvetica', 'bold');
  doc.text(truncateText(doc, data.property.projectName || 'Untitled Project', contentWidth * 0.6), margin, yPos);
  yPos += 5;

  // Location and property size
  doc.setTextColor(...COLORS.textMedium);
  doc.setFontSize(FONT.base);
  doc.setFont('helvetica', 'normal');
  const locationStr = data.property.location || 'Location not set';
  const sizeStr = data.property.propertySize > 0 ? `${data.property.propertySize} m² Property` : '';
  doc.text(`${locationStr}${sizeStr ? '  |  ' + sizeStr : ''}`, margin, yPos);
  yPos += 8;

  // ========================================
  // KEY METRICS ROW (5 boxes)
  // ========================================
  const metricBoxWidth = (contentWidth - 8) / 5;
  const metricBoxHeight = 26;

  // Draw container
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, metricBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, metricBoxHeight, 2, 2, 'S');

  const metrics = [
    { label: 'PROJECTED XIRR', value: `${(result.rate * 100).toFixed(1)}%`, subtitle: 'Internal Rate of Return', isHighlight: true },
    { label: 'NET PROFIT', value: `${result.netProfit >= 0 ? '+' : ''}${symbol} ${toDisplay(result.netProfit).toLocaleString()}`, subtitle: 'Total Gain on Exit', isHighlight: false },
    { label: 'TOTAL ROI', value: `${totalROI.toFixed(1)}%`, subtitle: 'Return on Investment', isHighlight: false },
    { label: 'TOTAL INVESTMENT', value: `${symbol} ${toDisplay(result.totalInvested).toLocaleString()}`, subtitle: 'Including Fees', isHighlight: false },
    { label: 'INV. PERIOD', value: `${(result.holdPeriodMonths / 12).toFixed(1)} Yrs`, subtitle: `${Math.floor(result.holdPeriodMonths / 12)} Year${Math.floor(result.holdPeriodMonths / 12) !== 1 ? 's' : ''} ${result.holdPeriodMonths % 12} Months`, isHighlight: false },
  ];

  metrics.forEach((metric, i) => {
    const boxX = margin + i * (metricBoxWidth + 2);

    // Vertical divider
    if (i > 0) {
      doc.setDrawColor(...COLORS.borderLight);
      doc.line(boxX - 1, yPos + 4, boxX - 1, yPos + metricBoxHeight - 4);
    }

    // Label
    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, boxX + 3, yPos + 6);

    // Value
    doc.setTextColor(...(metric.isHighlight ? COLORS.primary : COLORS.textDark));
    doc.setFontSize(metric.isHighlight ? FONT.xl : FONT.lg);
    doc.setFont('helvetica', 'bold');
    doc.text(truncateText(doc, metric.value, metricBoxWidth - 6), boxX + 3, yPos + 14);

    // Subtitle
    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text(truncateText(doc, metric.subtitle, metricBoxWidth - 6), boxX + 3, yPos + 20);
  });

  yPos += metricBoxHeight + 6;

  // ========================================
  // AI DEAL ANALYZER SUMMARY
  // ========================================
  const aiCardHeight = 38;
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, yPos, contentWidth, aiCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, aiCardHeight, 2, 2, 'S');

  // Left section - Deal Rating
  const ratingBoxWidth = 36;
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(margin + 4, yPos + 4, ratingBoxWidth, aiCardHeight - 8, 2, 2, 'F');

  // Rating circle icon
  doc.setFillColor(...COLORS.primary);
  doc.circle(margin + 4 + ratingBoxWidth / 2, yPos + 12, 5, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(FONT.base);
  doc.setFont('helvetica', 'bold');
  doc.text('OK', margin + 4 + ratingBoxWidth / 2, yPos + 13.5, { align: 'center' });

  // Deal rating text
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('DEAL RATING', margin + 4 + ratingBoxWidth / 2, yPos + 21, { align: 'center' });

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text(dealRating.rating, margin + 4 + ratingBoxWidth / 2, yPos + 27, { align: 'center' });

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

  // BETA badge - position after title with proper spacing
  const betaBadgeX = summaryX + aiTitleWidth + 4;
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(betaBadgeX, yPos + 4, 14, 5, 1, 1, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'bold');
  doc.text('BETA', betaBadgeX + 7, yPos + 7.5, { align: 'center' });

  // Summary text
  doc.setTextColor(...COLORS.textMedium);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'normal');
  const summaryText = generateAISummary(data, result, symbol, pricePerSqm);
  const splitSummary = doc.splitTextToSize(summaryText, summaryWidth);
  doc.text(splitSummary.slice(0, 3), summaryX, yPos + 14);

  // Tags row
  const tagY = yPos + aiCardHeight - 7;
  const holdYears = Math.floor(result.holdPeriodMonths / 12);
  const holdMonthsRemainder = result.holdPeriodMonths % 12;
  const periodText = holdYears > 0
    ? `${holdYears} Year${holdYears !== 1 ? 's' : ''}${holdMonthsRemainder > 0 ? ` ${holdMonthsRemainder} Mo` : ''}`
    : `${holdMonthsRemainder} Months`;
  const tags = [
    { text: `${appreciation >= 20 ? 'High' : 'Moderate'} Appreciation` },
    { text: `Period: ${periodText}` },
    { text: `Risk: ${marketRisk}` },
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
  // TWO COLUMN LAYOUT
  // ========================================
  const colWidth = (contentWidth - 6) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 6;

  // ========================================
  // ACQUISITION DETAILS (Left)
  // ========================================
  const acqCardHeight = 50;
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(leftColX, yPos, colWidth, acqCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(leftColX, yPos, colWidth, acqCardHeight, 2, 2, 'S');

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Acquisition Details', leftColX + 6, yPos + 8);

  const acqDetails = [
    { label: 'Purchase Price', value: `${symbol} ${toDisplay(data.property.totalPrice).toLocaleString()}` },
    { label: 'Price per sqm', value: pricePerSqm > 0 ? `${symbol} ${pricePerSqm.toLocaleString()} / m²` : 'N/A' },
    { label: 'Purchase Date', value: data.property.purchaseDate || 'Not set' },
    { label: 'Completion Date', value: data.property.handoverDate || 'Not set' },
    { label: 'Booking Fee', value: `${symbol} ${toDisplay(data.payment.bookingFee).toLocaleString()}` },
  ];

  acqDetails.forEach((item, i) => {
    const rowY = yPos + 14 + i * 7;
    doc.setTextColor(...COLORS.textMedium);
    doc.setFontSize(FONT.sm);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, leftColX + 6, rowY);
    doc.setTextColor(...COLORS.textDark);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, leftColX + colWidth - 6, rowY, { align: 'right' });
  });

  // ========================================
  // EXIT STRATEGY (Right)
  // ========================================
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(rightColX, yPos, colWidth, acqCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(rightColX, yPos, colWidth, acqCardHeight, 2, 2, 'S');

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Exit Strategy', rightColX + 6, yPos + 8);

  // Three boxes row
  const boxWidth = (colWidth - 20) / 3;

  // Gross Sale Price box
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(rightColX + 6, yPos + 12, boxWidth, 14, 1, 1, 'F');
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('Gross Sale', rightColX + 8, yPos + 16);
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol} ${toDisplay(data.exit.projectedSalesPrice).toLocaleString()}`, rightColX + 8, yPos + 22);

  // Closing Costs box
  const box2X = rightColX + 6 + boxWidth + 3;
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(box2X, yPos + 12, boxWidth, 14, 1, 1, 'F');
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('Closing Costs', box2X + 2, yPos + 16);
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol} ${toDisplay(closingCosts).toLocaleString()}`, box2X + 2, yPos + 22);

  // New Price per sqm box
  const box3X = rightColX + 6 + (boxWidth + 3) * 2;
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(box3X, yPos + 12, boxWidth, 14, 1, 1, 'F');
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text('New Price/m²', box3X + 2, yPos + 16);
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');
  doc.text(salePricePerSqm > 0 ? `${symbol} ${salePricePerSqm.toLocaleString()}` : 'N/A', box3X + 2, yPos + 22);

  // Net Proceeds row
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(rightColX + 6, yPos + 30, colWidth - 12, 12, 1, 1, 'F');
  doc.setTextColor(...COLORS.primaryDark);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Proceeds from Sale', rightColX + 10, yPos + 38);
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.text(`${symbol} ${toDisplay(netProceeds).toLocaleString()}`, rightColX + colWidth - 10, yPos + 38, { align: 'right' });

  yPos += acqCardHeight + 6;

  // ========================================
  // PAYMENT STRUCTURE (Left) + CASH FLOW CHART (Right)
  // ========================================
  const paymentCardHeight = 42;

  // Payment Structure
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(leftColX, yPos, colWidth, paymentCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(leftColX, yPos, colWidth, paymentCardHeight, 2, 2, 'S');

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Structure', leftColX + 6, yPos + 8);

  // Down Payment
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.base);
  doc.setFont('helvetica', 'bold');
  doc.text('Down Payment', leftColX + 6, yPos + 16);
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.payment.downPaymentPercent}% upfront`, leftColX + 6, yPos + 20);
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol} ${toDisplay(downPayment).toLocaleString()}`, leftColX + colWidth - 6, yPos + 18, { align: 'right' });

  // Progress bar
  const barY = yPos + 23;
  const barWidth = colWidth - 12;
  doc.setFillColor(...COLORS.borderLight);
  doc.roundedRect(leftColX + 6, barY, barWidth, 2, 0.5, 0.5, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(leftColX + 6, barY, barWidth * (data.payment.downPaymentPercent / 100), 2, 0.5, 0.5, 'F');

  // Monthly Installments
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.base);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Installments', leftColX + 6, yPos + 32);
  doc.setTextColor(...COLORS.textLight);
  doc.setFontSize(FONT.xs);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.payment.installmentMonths} Months x ${symbol} ${toDisplay(monthlyPayment).toLocaleString()}`, leftColX + 6, yPos + 36);
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol} ${toDisplay(remaining).toLocaleString()}`, leftColX + colWidth - 6, yPos + 34, { align: 'right' });

  // Cash Flow Summary (Right)
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(rightColX, yPos, colWidth, paymentCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(rightColX, yPos, colWidth, paymentCardHeight, 2, 2, 'S');

  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash Flow Summary', rightColX + 6, yPos + 7);

  // Row 1: Total Invested
  const summaryRowHeight = 8;
  const summaryGap = 1.5;
  let summaryY = yPos + 11;

  doc.setFillColor(...COLORS.redLight);
  doc.roundedRect(rightColX + 6, summaryY, colWidth - 12, summaryRowHeight, 1, 1, 'F');
  doc.setTextColor(...COLORS.red);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Invested (Out)', rightColX + 10, summaryY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`-${symbol} ${toDisplay(result.totalInvested).toLocaleString()}`, rightColX + colWidth - 10, summaryY + 5.5, { align: 'right' });

  // Row 2: Sale Proceeds
  summaryY += summaryRowHeight + summaryGap;
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(rightColX + 6, summaryY, colWidth - 12, summaryRowHeight, 1, 1, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'normal');
  doc.text('Sale Proceeds (In)', rightColX + 10, summaryY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`+${symbol} ${toDisplay(netProceeds).toLocaleString()}`, rightColX + colWidth - 10, summaryY + 5.5, { align: 'right' });

  // Row 3: Net Profit
  summaryY += summaryRowHeight + summaryGap;
  const profitColor = result.netProfit >= 0 ? COLORS.primary : COLORS.red;
  doc.setFillColor(...(result.netProfit >= 0 ? COLORS.primaryLight : COLORS.redLight));
  doc.roundedRect(rightColX + 6, summaryY, colWidth - 12, summaryRowHeight, 1, 1, 'F');
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.sm);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Profit', rightColX + 10, summaryY + 5.5);
  doc.setTextColor(...profitColor);
  doc.text(`${result.netProfit >= 0 ? '+' : ''}${symbol} ${toDisplay(result.netProfit).toLocaleString()}`, rightColX + colWidth - 10, summaryY + 5.5, { align: 'right' });

  yPos += paymentCardHeight + 6;

  // ========================================
  // CASH FLOW TIMELINE
  // ========================================
  doc.setTextColor(...COLORS.textDark);
  doc.setFontSize(FONT.md);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash Flow Timeline', margin, yPos + 4);
  yPos += 8;

  // Generate cash flow data
  const cashFlows = generatePaymentSchedule(data);
  const outflows = cashFlows.filter(cf => cf.amount < 0);
  const inflows = cashFlows.filter(cf => cf.amount > 0);

  // Pre-calculate display amounts with rounding adjustment
  interface DisplayRow {
    date: string;
    event: string;
    inflow: string;
    outflow: string;
    netFlow: number;
  }

  const rows: DisplayRow[] = [];
  const totalOutflowsIDR = outflows.reduce((sum, cf) => sum + Math.abs(cf.amount), 0);
  const totalOutflowsDisplay = toDisplay(totalOutflowsIDR);

  let outflowRunningSum = 0;
  let runningNetFlow = 0;
  let installmentNum = 0;
  let downPaymentFound = false;

  // Identify booking fee amount for matching
  const bookingFeeIDR = data.payment.bookingFee;
  const bookingFeeDate = data.payment.bookingFeeDate
    ? new Date(data.payment.bookingFeeDate)
    : null;

  outflows.forEach((cf, i) => {
    const isLast = i === outflows.length - 1;
    const displayAmount = isLast
      ? totalOutflowsDisplay - outflowRunningSum
      : toDisplay(Math.abs(cf.amount));

    if (!isLast) outflowRunningSum += displayAmount;

    // Determine event type based on amount and date matching
    let event: string;
    const cfAmount = Math.abs(cf.amount);
    const isBookingFee = bookingFeeIDR > 0 &&
      Math.abs(cfAmount - bookingFeeIDR) < 1 &&
      (!bookingFeeDate || cf.date.getTime() === bookingFeeDate.getTime() ||
       (bookingFeeDate && cf.date.toDateString() === bookingFeeDate.toDateString()));

    if (isBookingFee && !downPaymentFound) {
      event = 'Booking Fee';
    } else if (!downPaymentFound) {
      event = 'Down Payment';
      downPaymentFound = true;
    } else {
      installmentNum++;
      event = `Installment ${installmentNum}`;
    }

    runningNetFlow -= displayAmount;

    rows.push({
      date: cf.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      event,
      inflow: '-',
      outflow: `${symbol} ${displayAmount.toLocaleString()}`,
      netFlow: runningNetFlow,
    });
  });

  inflows.forEach(cf => {
    const displayAmount = toDisplay(cf.amount);
    runningNetFlow += displayAmount;

    rows.push({
      date: cf.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      event: 'Exit/Sale',
      inflow: `${symbol} ${displayAmount.toLocaleString()}`,
      outflow: '-',
      netFlow: runningNetFlow,
    });
  });

  // Table
  const rowHeight = 6;
  const tableHeaderHeight = 7;
  const colWidths = [30, 40, 35, 35, 40];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  // Calculate available space and rows per page
  const footerSpace = 15;
  const availableOnFirstPage = pageHeight - yPos - footerSpace - tableHeaderHeight;
  const rowsOnFirstPage = Math.max(1, Math.floor(availableOnFirstPage / rowHeight));
  const availableOnNextPage = pageHeight - margin - footerSpace - tableHeaderHeight - 10;
  const rowsPerNextPage = Math.floor(availableOnNextPage / rowHeight);

  // Calculate total pages
  const rowsAfterFirst = Math.max(0, rows.length - rowsOnFirstPage);
  const additionalPages = rowsAfterFirst > 0 ? Math.ceil(rowsAfterFirst / rowsPerNextPage) : 0;
  const totalPages = 1 + additionalPages;

  const drawTableHeader = (startY: number) => {
    doc.setFillColor(...COLORS.background);
    doc.rect(margin, startY, tableWidth, tableHeaderHeight, 'F');

    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'bold');

    const headers = ['DATE', 'EVENT', 'INFLOW', 'OUTFLOW', 'NET FLOW'];
    let x = margin + 4;
    headers.forEach((header, i) => {
      doc.text(header, x, startY + 5);
      x += colWidths[i];
    });

    return startY + tableHeaderHeight;
  };

  const drawTableRow = (row: DisplayRow, rowY: number) => {
    let x = margin + 4;

    doc.setTextColor(...COLORS.textMedium);
    doc.setFontSize(FONT.sm);
    doc.setFont('helvetica', 'normal');
    doc.text(row.date, x, rowY + 4);
    x += colWidths[0];

    doc.setTextColor(...COLORS.textDark);
    doc.text(row.event, x, rowY + 4);
    x += colWidths[1];

    doc.setTextColor(...(row.inflow !== '-' ? COLORS.primary : COLORS.textLight));
    doc.text(row.inflow, x, rowY + 4);
    x += colWidths[2];

    doc.setTextColor(...(row.outflow !== '-' ? COLORS.red : COLORS.textLight));
    doc.text(row.outflow, x, rowY + 4);
    x += colWidths[3];

    doc.setTextColor(...(row.netFlow >= 0 ? COLORS.primary : COLORS.red));
    doc.setFont('helvetica', 'bold');
    doc.text(`${symbol} ${row.netFlow.toLocaleString()}`, x, rowY + 4);
  };

  const drawFooter = (pageNum: number, total: number) => {
    const footerY = pageHeight - 10;
    doc.setDrawColor(...COLORS.border);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setTextColor(...COLORS.textLight);
    doc.setFontSize(FONT.xs);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by BaliInvest XIRR Calculator', margin, footerY);
    doc.text(`Page ${pageNum} of ${total}`, pageWidth / 2, footerY, { align: 'center' });

    if (currency !== 'IDR') {
      doc.text(`Rate: 1 ${currency} = ${rate.toLocaleString()} IDR`, pageWidth - margin, footerY, { align: 'right' });
    }
  };

  // Draw table
  let tableY = drawTableHeader(yPos);
  let rowIndex = 0;

  // First page rows
  const rowsThisPage = Math.min(rows.length, rowsOnFirstPage);
  rows.slice(0, rowsThisPage).forEach((row, i) => {
    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.cardBg);
      doc.rect(margin, tableY, tableWidth, rowHeight, 'F');
    }
    drawTableRow(row, tableY);
    tableY += rowHeight;
    rowIndex++;
  });

  drawFooter(1, totalPages);

  // Additional pages
  while (rowIndex < rows.length) {
    doc.addPage();
    doc.setFillColor(...COLORS.background);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = margin;
    doc.setTextColor(...COLORS.textDark);
    doc.setFontSize(FONT.md);
    doc.setFont('helvetica', 'bold');
    doc.text('Cash Flow Timeline (continued)', margin, yPos + 4);
    yPos += 10;

    tableY = drawTableHeader(yPos);
    const rowsThisPage = Math.min(rows.length - rowIndex, rowsPerNextPage);

    for (let i = 0; i < rowsThisPage; i++) {
      const row = rows[rowIndex];
      if (i % 2 === 0) {
        doc.setFillColor(...COLORS.cardBg);
        doc.rect(margin, tableY, tableWidth, rowHeight, 'F');
      }
      drawTableRow(row, tableY);
      tableY += rowHeight;
      rowIndex++;
    }

    drawFooter(doc.getNumberOfPages(), totalPages);
  }

  // Save
  const projectName = data.property.projectName || 'Investment';
  const fileName = `BaliInvest_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
