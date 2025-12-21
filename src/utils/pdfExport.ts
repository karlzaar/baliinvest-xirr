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

  // Property Details Card - matching dashboard exactly
  const propCardHeight = 62;
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
  const propValueY2 = yPos + 30;
  const propValueY3 = yPos + 42;
  const propValueY4 = yPos + 54;
  const propMaxWidth = colWidth - 12;
  const propRightCol = propLabelX + propMaxWidth / 2 + 5;

  // Row 1: Project Name
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Project', propLabelX, propValueY1);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.text(truncateText(doc, data.property.projectName || 'Not specified', propMaxWidth), propLabelX, propValueY1 + 5);

  // Row 2: Location
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.text('Location', propLabelX, propValueY2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.text(truncateText(doc, data.property.location || 'Not specified', propMaxWidth), propLabelX, propValueY2 + 5);

  // Row 3: Total Price + Purchase Date
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.text('Total Price', propLabelX, propValueY3);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol}${formatDisplay(data.property.totalPrice)}`, propLabelX, propValueY3 + 5);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Purchase Date', propRightCol, propValueY3);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  const purchaseDateStr = data.property.purchaseDate
    ? new Date(data.property.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not set';
  doc.text(purchaseDateStr, propRightCol, propValueY3 + 5);

  // Row 4: Handover Date
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Handover Date', propLabelX, propValueY4);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  const handoverDateStr = data.property.handoverDate
    ? new Date(data.property.handoverDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not set';
  doc.text(handoverDateStr, propLabelX, propValueY4 + 5);

  // Exit Strategy Card - matching dashboard exactly
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
  const exitRightCol = rightColX + colWidth / 2;

  // Row 1: Sale Price + Appreciation
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Projected Sale Price', rightColX + 6, propValueY1 + 2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${symbol}${formatDisplay(data.exit.projectedSalesPrice)}`, rightColX + 6, propValueY1 + 7);

  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Appreciation', exitRightCol, propValueY1 + 2);
  doc.setTextColor(...(appreciation >= 0 ? COLORS.green : COLORS.red));
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`${appreciation >= 0 ? '+' : ''}${appreciation.toFixed(1)}%`, exitRightCol, propValueY1 + 7);

  // Row 2: Sale Date (= handover for flip strategy)
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Sale Date', rightColX + 6, propValueY2 + 2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  // Sale date = handover date for flip at completion
  const saleDateStr = data.property.handoverDate
    ? new Date(data.property.handoverDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Set handover date';
  doc.text(saleDateStr, rightColX + 6, propValueY2 + 7);

  // Row 3: Closing Costs
  doc.setTextColor(...COLORS.textSecondary);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Closing Costs (${data.exit.closingCostPercent}%)`, rightColX + 6, propValueY3 + 2);
  doc.setTextColor(...COLORS.textPrimary);
  doc.setFontSize(8);
  doc.text(`${symbol}${formatDisplay(closingCosts)}`, rightColX + 6, propValueY3 + 7);

  yPos += propCardHeight + 6;

  // Payment Schedule Card (with individual rows, multi-page support)
  if (data.payment.type === 'plan') {
    const downPayment = data.property.totalPrice * (data.payment.downPaymentPercent / 100);
    const remaining = data.property.totalPrice - downPayment;

    // Use schedule data if available, otherwise calculate
    const hasSchedule = data.payment.schedule && data.payment.schedule.length > 0;
    const scheduleEntries = hasSchedule ? data.payment.schedule : [];

    // Original row height for readability
    const rowHeight = 8;
    const headerHeight = 22;
    const footerSpace = 25;

    // Helper to convert IDR to display currency
    const idrToDisplayNum = (idr: number): number => Math.round(idr / rate);
    let totalForDisplay = 0;

    // Draw schedule header
    const drawScheduleHeader = (startY: number, isFirstPage: boolean): number => {
      doc.setFillColor(...COLORS.surface);
      doc.setDrawColor(...COLORS.border);

      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(isFirstPage ? 'Payment Schedule' : 'Payment Schedule (continued)', margin + 6, startY + 10);

      if (isFirstPage) {
        // Down payment info only on first page
        doc.setTextColor(...COLORS.textSecondary);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Down Payment: ${data.payment.downPaymentPercent}% (${symbol}${formatDisplay(downPayment)})`, margin + 6, startY + 18);
      }

      // Table header
      const tableHeaderY = startY + headerHeight;
      doc.setFillColor(...COLORS.surfaceDark);
      doc.rect(margin, tableHeaderY, contentWidth, rowHeight, 'F');

      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('#', margin + 6, tableHeaderY + 5.5);
      doc.text('DUE DATE', margin + 25, tableHeaderY + 5.5);
      doc.text('AMOUNT', pageWidth - margin - 6, tableHeaderY + 5.5, { align: 'right' });

      return tableHeaderY + rowHeight;
    };

    // Draw a single payment row
    const drawPaymentRow = (rowY: number, index: number, dateStr: string, displayAmount: number, isAlternate: boolean): void => {
      // Alternate row background
      if (isAlternate) {
        doc.setFillColor(COLORS.surfaceDark[0] * 0.5, COLORS.surfaceDark[1] * 0.5, COLORS.surfaceDark[2] * 0.5);
        doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
      }

      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}`, margin + 6, rowY + 5.5);

      doc.setTextColor(...COLORS.textPrimary);
      doc.setFontSize(8);
      doc.text(dateStr, margin + 25, rowY + 5.5);

      doc.setTextColor(...COLORS.textPrimary);
      doc.setFont('helvetica', 'bold');
      doc.text(`${symbol}${displayAmount.toLocaleString('en-US')}`, pageWidth - margin - 6, rowY + 5.5, { align: 'right' });
    };

    // Draw total row
    const drawTotalRow = (rowY: number, total: number): void => {
      doc.setFillColor(...COLORS.surfaceDark);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');

      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL SCHEDULED', margin + 25, rowY + 5.5);
      doc.setTextColor(...COLORS.primary);
      doc.setFontSize(8);
      doc.text(`${symbol}${total.toLocaleString('en-US')}`, pageWidth - margin - 6, rowY + 5.5, { align: 'right' });
    };

    // Build payment data array
    const payments: { dateStr: string; amount: number }[] = [];

    // Calculate total in IDR first, then convert once (avoids rounding errors)
    const totalIDR = hasSchedule
      ? scheduleEntries.reduce((sum, entry) => sum + entry.amount, 0)
      : remaining;
    totalForDisplay = idrToDisplayNum(totalIDR);

    if (hasSchedule) {
      // Pre-calculate display amounts so they sum correctly to the total
      // Last payment gets adjusted to absorb rounding differences
      let runningSum = 0;

      for (let i = 0; i < scheduleEntries.length; i++) {
        const entry = scheduleEntries[i];
        const isLast = i === scheduleEntries.length - 1;

        // Last payment = total minus sum of previous displayed amounts
        const displayAmount = isLast
          ? totalForDisplay - runningSum
          : idrToDisplayNum(entry.amount);

        if (!isLast) {
          runningSum += displayAmount;
        }

        payments.push({
          dateStr: new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          amount: displayAmount,
        });
      }
    } else {
      // Fallback for legacy data
      const baseDisplayPayment = Math.floor(totalForDisplay / data.payment.installmentMonths);

      for (let i = 0; i < data.payment.installmentMonths; i++) {
        const paymentDate = new Date();
        paymentDate.setMonth(paymentDate.getMonth() + i + 1);

        const isLastPayment = i === data.payment.installmentMonths - 1;
        const previousTotal = baseDisplayPayment * i;
        const displayAmount = isLastPayment ? totalForDisplay - previousTotal : baseDisplayPayment;

        payments.push({
          dateStr: paymentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          amount: displayAmount,
        });
      }
    }

    // Render payments with automatic page breaks
    let isFirstPage = true;
    let rowY = drawScheduleHeader(yPos, isFirstPage);

    for (let i = 0; i < payments.length; i++) {
      // Check if we need a new page (leave room for total row + footer)
      if (rowY + rowHeight * 2 + footerSpace > pageHeight) {
        // Add new page
        doc.addPage();
        doc.setFillColor(...COLORS.background);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        isFirstPage = false;
        yPos = 15;
        rowY = drawScheduleHeader(yPos, isFirstPage);
      }

      drawPaymentRow(rowY, i, payments[i].dateStr, payments[i].amount, i % 2 === 0);
      rowY += rowHeight;
    }

    // Draw total row
    drawTotalRow(rowY, totalForDisplay);
    rowY += rowHeight;

    yPos = rowY + 6;
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

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setDrawColor(...COLORS.border);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by BaliInvest XIRR Calculator', margin, pageHeight - 8);

    if (totalPages > 1) {
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  // Save
  const projectName = data.property.projectName || 'Investment';
  const fileName = `BaliInvest_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
