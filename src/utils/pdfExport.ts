import jsPDF from 'jspdf';
import type { InvestmentData, XIRRResult } from '../types/investment';

interface PDFExportOptions {
  data: InvestmentData;
  result: XIRRResult;
  currency: string;
  symbol: string;
  formatDisplay: (idr: number) => string;
  formatAbbrev: (idr: number) => string;
  rate: number;
}

// Color palette matching the website
const COLORS = {
  background: [17, 34, 23] as [number, number, number],
  surface: [16, 34, 22] as [number, number, number],
  surfaceDark: [25, 51, 34] as [number, number, number],
  border: [50, 103, 68] as [number, number, number],
  primary: [19, 236, 91] as [number, number, number],
  textPrimary: [255, 255, 255] as [number, number, number],
  textSecondary: [146, 201, 164] as [number, number, number],
  cyan: [34, 211, 238] as [number, number, number],
  red: [248, 113, 113] as [number, number, number],
  green: [74, 222, 128] as [number, number, number],
};

// Helper to truncate text to fit width
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

export function generatePDFReport(options: PDFExportOptions): void {
  const { data, result, currency, symbol, formatDisplay, formatAbbrev, rate } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 0;

  // Fill entire page with dark background
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header bar
  doc.setFillColor(...COLORS.surface);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.line(0, 22, pageWidth, 22);

  // Logo
  doc.setFillColor(COLORS.primary[0] * 0.3, COLORS.primary[1] * 0.3, COLORS.primary[2] * 0.3);
  doc.roundedRect(margin, 5, 12, 12, 2, 2, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('XIRR', margin + 6, 12.5, { align: 'center' });

  // Title
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(12);
  doc.text('BaliInvest XIRR', margin + 16, 12);

  // Date
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    pageWidth - margin,
    12,
    { align: 'right' }
  );

  yPos = 30;

  // Main title
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Investment Report', margin, yPos);
  yPos += 6;

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(truncateText(doc, data.property.projectName || 'Untitled Project', contentWidth), margin, yPos);
  yPos += 8;

  // XIRR Result Card
  const xirrCardHeight = 32;
  doc.setFillColor(...COLORS.surface);
  doc.roundedRect(margin, yPos, contentWidth, xirrCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, yPos, contentWidth, xirrCardHeight, 2, 2, 'S');

  const xirrPercent = (result.rate * 100).toFixed(1);
  const isPositive = result.rate >= 0;

  // Left section - XIRR
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Estimated XIRR', margin + 8, yPos + 10);

  doc.setTextColor(...(isPositive ? COLORS.primary : COLORS.red));
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${xirrPercent}%`, margin + 8, yPos + 22);

  doc.setTextColor(...(isPositive ? COLORS.primary : COLORS.red));
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Annualized', margin + 8, yPos + 27);

  // Right section - metrics in row
  const metricWidth = 42;
  const metricStartX = margin + 70;

  // Total Invested
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.text('Total Invested', metricStartX, yPos + 10);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatAbbrev(result.totalInvested)} ${currency}`, metricStartX, yPos + 18);

  // Net Profit
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Net Profit', metricStartX + metricWidth, yPos + 10);
  doc.setTextColor(...(result.netProfit >= 0 ? COLORS.primary : COLORS.red));
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.netProfit >= 0 ? '+' : ''}${formatAbbrev(result.netProfit)} ${currency}`, metricStartX + metricWidth, yPos + 18);

  // Investment Period
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Investment Period', metricStartX + metricWidth * 2, yPos + 10);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.holdPeriodMonths} Months`, metricStartX + metricWidth * 2, yPos + 18);

  yPos += xirrCardHeight + 6;

  // Two column layout
  const colWidth = (contentWidth - 6) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 6;

  // Property Details Card
  const propCardHeight = 52;
  doc.setFillColor(...COLORS.surface);
  doc.roundedRect(leftColX, yPos, colWidth, propCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(leftColX, yPos, colWidth, propCardHeight, 2, 2, 'S');

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details', leftColX + 6, yPos + 10);

  const propLabelX = leftColX + 6;
  const propValueY1 = yPos + 18;
  const propValueY2 = yPos + 32;
  const propValueY3 = yPos + 46;
  const propMaxWidth = colWidth - 12;

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Project', propLabelX, propValueY1);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.text(truncateText(doc, data.property.projectName || 'Not specified', propMaxWidth), propLabelX, propValueY1 + 5);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.text('Location', propLabelX, propValueY2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.text(truncateText(doc, data.property.location || 'Not specified', propMaxWidth), propLabelX, propValueY2 + 5);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.text('Total Price', propLabelX, propValueY3);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol}${formatDisplay(data.property.totalPrice)}`, propLabelX, propValueY3 + 5);

  // Handover on right side of property card
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Handover', propLabelX + propMaxWidth / 2 + 10, propValueY3);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  const handoverDateStr = data.property.handoverDate
    ? new Date(data.property.handoverDate).toLocaleDateString()
    : 'Not set';
  doc.text(handoverDateStr, propLabelX + propMaxWidth / 2 + 10, propValueY3 + 5);

  // Exit Strategy Card (simplified - only Flip at Completion)
  doc.setFillColor(...COLORS.surface);
  doc.roundedRect(rightColX, yPos, colWidth, propCardHeight, 2, 2, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(rightColX, yPos, colWidth, propCardHeight, 2, 2, 'S');

  // Flip at Completion badge
  doc.setFillColor(COLORS.cyan[0] * 0.3, COLORS.cyan[1] * 0.3, COLORS.cyan[2] * 0.3);
  doc.setFontSize(7);
  const badgeText = 'Flip at Completion';
  const badgeWidth = doc.getTextWidth(badgeText) + 6;
  doc.roundedRect(rightColX + 6, yPos + 5, badgeWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, rightColX + 9, yPos + 10.5);

  const appreciation = data.property.totalPrice > 0
    ? ((data.exit.projectedSalesPrice - data.property.totalPrice) / data.property.totalPrice) * 100
    : 0;
  const closingCosts = data.exit.projectedSalesPrice * (data.exit.closingCostPercent / 100);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Sale Price', rightColX + 6, propValueY1 + 2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol}${formatDisplay(data.exit.projectedSalesPrice)}`, rightColX + 6, propValueY1 + 7);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Appreciation', rightColX + colWidth / 2, propValueY1 + 2);
  doc.setTextColor(...(appreciation >= 0 ? COLORS.green : COLORS.red));
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${appreciation >= 0 ? '+' : ''}${appreciation.toFixed(1)}%`, rightColX + colWidth / 2, propValueY1 + 7);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Closing Costs (${data.exit.closingCostPercent}%)`, rightColX + 6, propValueY2 + 2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.text(`${symbol}${formatDisplay(closingCosts)}`, rightColX + 6, propValueY2 + 7);

  yPos += propCardHeight + 6;

  // Payment Schedule Card (with individual rows)
  if (data.payment.type === 'plan') {
    const downPayment = data.property.totalPrice * (data.payment.downPaymentPercent / 100);
    const remaining = data.property.totalPrice - downPayment;

    // Use schedule data if available, otherwise calculate
    const hasSchedule = data.payment.schedule && data.payment.schedule.length > 0;
    const scheduleEntries = hasSchedule ? data.payment.schedule : [];
    const numRows = hasSchedule ? scheduleEntries.length : data.payment.installmentMonths;

    const rowHeight = 8;
    const headerHeight = 20;
    const scheduleCardHeight = headerHeight + (numRows + 2) * rowHeight + 6;

    doc.setFillColor(...COLORS.surface);
    doc.roundedRect(margin, yPos, contentWidth, scheduleCardHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, yPos, contentWidth, scheduleCardHeight, 2, 2, 'S');

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Schedule', margin + 6, yPos + 10);

    // Down payment info
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Down Payment: ${data.payment.downPaymentPercent}% (${symbol}${formatDisplay(downPayment)})`, margin + 6, yPos + 17);

    // Table header
    const tableY = yPos + headerHeight;
    doc.setFillColor(...COLORS.surfaceDark);
    doc.rect(margin + 4, tableY, contentWidth - 8, rowHeight, 'F');

    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('#', margin + 8, tableY + 5.5);
    doc.text('DUE DATE', margin + 20, tableY + 5.5);
    doc.text('AMOUNT', pageWidth - margin - 8, tableY + 5.5, { align: 'right' });

    // Payment rows
    let rowY = tableY + rowHeight;

    // Helper to convert IDR to display currency
    const idrToDisplayNum = (idr: number): number => Math.round(idr / rate);
    const remainingDisplay = idrToDisplayNum(remaining);

    if (hasSchedule) {
      // Calculate display amounts with last payment adjustment for exact total
      const displayAmounts = scheduleEntries.map(entry => idrToDisplayNum(entry.amount));
      const sumExceptLast = displayAmounts.slice(0, -1).reduce((sum, amt) => sum + amt, 0);
      const lastDisplayAmount = remainingDisplay - sumExceptLast;

      // Use stored schedule data
      for (let i = 0; i < scheduleEntries.length; i++) {
        const entry = scheduleEntries[i];
        const isLast = i === scheduleEntries.length - 1;
        const displayAmount = isLast ? lastDisplayAmount : displayAmounts[i];
        const dateStr = new Date(entry.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // Alternate row background
        if (i % 2 === 0) {
          doc.setFillColor(COLORS.surfaceDark[0] * 0.5, COLORS.surfaceDark[1] * 0.5, COLORS.surfaceDark[2] * 0.5);
          doc.rect(margin + 4, rowY, contentWidth - 8, rowHeight, 'F');
        }

        doc.setTextColor(...COLORS.textSecondary);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${i + 1}`, margin + 8, rowY + 5.5);

        doc.setTextColor(...COLORS.textPrimary);
        doc.text(dateStr, margin + 20, rowY + 5.5);

        doc.setTextColor(...COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.text(`${symbol}${displayAmount.toLocaleString('en-US')}`, pageWidth - margin - 8, rowY + 5.5, { align: 'right' });

        rowY += rowHeight;
      }
    } else {
      // Calculate payments (fallback for legacy data)
      // Use display currency for calculations to avoid rounding issues
      const baseDisplayPayment = Math.floor(remainingDisplay / data.payment.installmentMonths);

      for (let i = 0; i < data.payment.installmentMonths; i++) {
        const paymentDate = new Date();
        paymentDate.setMonth(paymentDate.getMonth() + i + 1);
        const dateStr = paymentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // Last payment gets remainder to ensure exact total
        const isLastPayment = i === data.payment.installmentMonths - 1;
        const previousTotal = baseDisplayPayment * i;
        const displayAmount = isLastPayment
          ? remainingDisplay - previousTotal
          : baseDisplayPayment;

        // Alternate row background
        if (i % 2 === 0) {
          doc.setFillColor(COLORS.surfaceDark[0] * 0.5, COLORS.surfaceDark[1] * 0.5, COLORS.surfaceDark[2] * 0.5);
          doc.rect(margin + 4, rowY, contentWidth - 8, rowHeight, 'F');
        }

        doc.setTextColor(...COLORS.textSecondary);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${i + 1}`, margin + 8, rowY + 5.5);

        doc.setTextColor(...COLORS.textPrimary);
        doc.text(dateStr, margin + 20, rowY + 5.5);

        doc.setTextColor(...COLORS.textPrimary);
        doc.setFont('helvetica', 'bold');
        doc.text(`${symbol}${displayAmount.toLocaleString('en-US')}`, pageWidth - margin - 8, rowY + 5.5, { align: 'right' });

        rowY += rowHeight;
      }
    }

    // Total row
    doc.setFillColor(...COLORS.surfaceDark);
    doc.rect(margin + 4, rowY, contentWidth - 8, rowHeight, 'F');

    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL SCHEDULED', margin + 20, rowY + 5.5);
    doc.setTextColor(...COLORS.primary);
    doc.text(`${symbol}${remainingDisplay.toLocaleString('en-US')}`, pageWidth - margin - 8, rowY + 5.5, { align: 'right' });

    yPos += scheduleCardHeight + 6;
  } else {
    // Full payment - simple display
    const fullPayCardHeight = 24;
    doc.setFillColor(...COLORS.surface);
    doc.roundedRect(margin, yPos, contentWidth, fullPayCardHeight, 2, 2, 'F');
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, yPos, contentWidth, fullPayCardHeight, 2, 2, 'S');

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment', margin + 6, yPos + 10);

    doc.setTextColor(...COLORS.textPrimary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Full Payment: ${symbol}${formatDisplay(data.property.totalPrice)}`, margin + 6, yPos + 18);

    yPos += fullPayCardHeight + 6;
  }

  // Exchange rate note if not IDR
  if (currency !== 'IDR') {
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exchange Rate: 1 ${currency} = ${rate.toLocaleString()} IDR`, margin, yPos);
    yPos += 8;
  }

  // Footer
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by BaliInvest XIRR Calculator', margin, pageHeight - 8);
  doc.text('XIRR uses irregular cash flow intervals for accurate annualized returns', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Save
  const projectName = data.property.projectName || 'Investment';
  const fileName = `BaliInvest_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
