
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { YearlyData, CurrencyConfig } from '../types';
import { formatCurrency } from '../constants';

interface Props {
  data: YearlyData[];
  avg: Partial<YearlyData>;
  currency: CurrencyConfig;
}

interface RowConfig {
  label: string;
  key: keyof YearlyData;
  type: 'curr' | 'pct' | 'num';
  indent?: boolean;
  bold?: boolean;
  color?: string; // Optional text color
}

interface SectionConfig {
  title: string;
  rows: RowConfig[];
  isExpandedByDefault?: boolean;
}

const ProjectionsTable: React.FC<Props> = ({ data, avg, currency }) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const scrollTo = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const sections: SectionConfig[] = [
    {
      title: 'Occupancy Based Performance',
      isExpandedByDefault: true,
      rows: [
        { label: '# of Keys', key: 'keys', type: 'num' },
        { label: 'Occupancy (%)', key: 'occupancy', type: 'pct' },
        { label: 'Average Daily Rate (ADR)', key: 'adr', type: 'curr' },
        { label: 'RevPAR', key: 'revpar', type: 'curr' },
      ]
    },
    {
      title: 'Gross Revenue Breakdown',
      isExpandedByDefault: true,
      rows: [
        { label: 'Rooms Revenue', key: 'revenueRooms', type: 'curr', indent: true },
        { label: 'Food & Beverage', key: 'revenueFB', type: 'curr', indent: true },
        { label: 'Wellness & Spa', key: 'revenueSpa', type: 'curr', indent: true },
        { label: 'Other Departments', key: 'revenueOODs', type: 'curr', indent: true },
        { label: 'Miscellaneous', key: 'revenueMisc', type: 'curr', indent: true },
        { label: 'TOTAL GROSS REVENUE', key: 'totalRevenue', type: 'curr', bold: true },
      ]
    },
    {
      title: 'Operating Expenses',
      rows: [
        { label: 'Direct Rooms Cost', key: 'costRooms', type: 'curr', indent: true },
        { label: 'F&B Operations', key: 'costFB', type: 'curr', indent: true },
        { label: 'Wellness/Spa Cost', key: 'costSpa', type: 'curr', indent: true },
        { label: 'Utilities & General', key: 'costUtilities', type: 'curr', indent: true },
        { label: 'TOTAL DIRECT EXPENSES', key: 'totalOperatingCost', type: 'curr', bold: true, color: 'text-red-500' },
      ]
    },
    {
      title: 'Undistributed Expenses',
      rows: [
        { label: 'Admin & General', key: 'undistributedAdmin', type: 'curr', indent: true },
        { label: 'Sales & Marketing', key: 'undistributedSales', type: 'curr', indent: true },
        { label: 'Property Ops', key: 'undistributedMaintenance', type: 'curr', indent: true },
        { label: 'TOTAL UNDISTRIBUTED', key: 'totalUndistributedCost', type: 'curr', bold: true, color: 'text-red-500' },
      ]
    },
    {
      title: 'Operational Profitability',
      isExpandedByDefault: true,
      rows: [
        { label: 'GROSS OPERATING PROFIT (GOP)', key: 'gop', type: 'curr', bold: true },
        { label: 'GOP Margin (%)', key: 'gopMargin', type: 'pct', indent: true },
      ]
    },
    {
      title: 'Management Fees & Fixed Dues',
      isExpandedByDefault: true,
      rows: [
        { label: 'Common Area Maintenance (CAM)', key: 'feeCAM', type: 'curr', indent: true },
        { label: 'Base Management Fee', key: 'feeBase', type: 'curr', indent: true },
        { label: 'Technology Fee', key: 'feeTech', type: 'curr', indent: true },
        { label: 'Incentive Fee', key: 'feeIncentive', type: 'curr', indent: true },
        { label: 'TOTAL FEES & DEDUCTIONS', key: 'totalManagementFees', type: 'curr', bold: true, color: 'text-red-500' },
      ]
    },
    {
      title: 'Investor Returns & Net Cash Flow',
      isExpandedByDefault: true,
      rows: [
        { label: 'TAKE HOME PROFIT (Owner Cash Flow)', key: 'takeHomeProfit', type: 'curr', bold: true },
        { label: 'Net Profit Margin (%)', key: 'profitMargin', type: 'pct', indent: true },
        { label: 'ROI - Gross Yield (Yield on Cost)', key: 'roiBeforeManagement', type: 'pct', bold: true },
        { label: 'ROI - Net Yield (Cash on Cash)', key: 'roiAfterManagement', type: 'pct', bold: true, color: 'text-blue-600 font-bold' },
      ]
    }
  ];

  const renderCellValue = (val: number, type: string, color?: string) => {
    if (val === undefined || val === null) return <span className="text-slate-300">-</span>;
    const isNegative = val < 0;
    const finalColor = color || (isNegative ? 'text-red-500' : 'text-slate-900');

    if (type === 'curr') {
      return (
        <span className={`tabular-nums font-semibold tracking-tight ${finalColor}`}>
          {formatCurrency(val, currency)}
        </span>
      );
    }
    if (type === 'pct') return <span className={`font-bold tabular-nums tracking-tight ${finalColor}`}>{val.toFixed(2)}%</span>;
    return <span className={`font-semibold tabular-nums tracking-tight ${finalColor}`}>{val.toLocaleString()}</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm relative">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollTo('left')}
          className="absolute left-[340px] top-1/2 -translate-y-1/2 z-50 w-8 h-8 bg-white/95 border border-slate-300 rounded-full shadow-md flex items-center justify-center hover:bg-slate-50 hover:scale-110 transition-all duration-200 group"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4 text-slate-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scrollTo('right')}
          className="absolute right-[180px] top-1/2 -translate-y-1/2 z-50 w-8 h-8 bg-indigo-600 border border-indigo-700 rounded-full shadow-md flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all duration-200 group"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}


      <div ref={scrollContainerRef} className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[13px] border-separate border-spacing-0 min-w-[1900px] table-fixed">
          <colgroup>
            <col className="w-[320px]" />
            {data.map((_, i) => <col key={i} className="w-[130px]" />)}
            <col className="w-[160px]" />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50">
              <th className="p-4 text-sm font-semibold text-slate-800 uppercase tracking-wide sticky left-0 bg-slate-50 z-[30] border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.04)]">
                Line Item Detail
              </th>
              {data.map(y => (
                <th key={y.year} className="p-4 text-sm font-semibold text-center text-slate-700 bg-slate-50">
                  {y.calendarYear}
                </th>
              ))}
              <th className="p-4 text-sm font-semibold text-center text-slate-700 bg-indigo-50 sticky right-0 z-[30] border-l-2 border-indigo-200 shadow-[-4px_0_8px_rgba(0,0,0,0.04)]">
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, sIdx) => {
              const isCollapsed = collapsedSections[section.title] ?? true;
              return (
                <React.Fragment key={sIdx}>
                  <tr
                    className="bg-slate-100 hover:bg-slate-200/70 transition-colors cursor-pointer border-b border-slate-200"
                    onClick={() => toggleSection(section.title)}
                  >
                    <td className="sticky left-0 bg-slate-100 hover:bg-slate-200/70 z-[25] p-4 border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="font-semibold text-slate-700 uppercase tracking-wide text-xs">{section.title}</span>
                      </div>
                    </td>
                    {data.map(y => (
                      <td key={y.year} className="p-4 text-right bg-slate-100"></td>
                    ))}
                    <td className="sticky right-0 bg-slate-100 p-4 border-l-2 border-slate-200 z-[25] shadow-[-4px_0_8px_rgba(0,0,0,0.04)]"></td>
                  </tr>
                  
                  {!isCollapsed && section.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={`group hover:bg-slate-50 transition-colors border-b border-slate-50/50`}
                    >
                      <td className={`sticky left-0 p-3 pl-10 z-[20] bg-white border-r border-slate-200 shadow-[4px_0_8px_rgba(0,0,0,0.04)] group-hover:bg-slate-50
                        ${row.indent ? 'pl-14 text-slate-500' : 'text-slate-700'}
                        ${row.bold ? 'font-bold text-slate-900' : 'font-medium'}`}>
                        <div className="flex items-center gap-2">
                          {row.label}
                        </div>
                      </td>
                      {data.map(y => (
                        <td key={y.year} className="p-3 text-right border-r border-slate-50/30 bg-white group-hover:bg-slate-50">
                          {renderCellValue((y as any)[row.key], row.type, row.color)}
                        </td>
                      ))}
                      <td className={`sticky right-0 p-3 text-right z-[20] bg-white border-l-2 border-slate-200 shadow-[-4px_0_8px_rgba(0,0,0,0.04)] group-hover:bg-slate-50 transition-colors
                        ${row.bold ? 'font-bold' : ''}`}>
                        {avg[row.key as keyof YearlyData] !== undefined ? renderCellValue(avg[row.key as keyof YearlyData] as number, row.type, row.color) : <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default ProjectionsTable;
