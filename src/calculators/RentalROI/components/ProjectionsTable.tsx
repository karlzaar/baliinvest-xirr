
import React, { useState } from 'react';
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[13px] border-separate border-spacing-0 min-w-[1900px] table-fixed">
          <colgroup>
            <col className="w-[320px]" />
            {data.map((_, i) => <col key={i} className="w-[130px]" />)}
            <col className="w-[160px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200">
              <th className="p-4 font-bold text-slate-700 uppercase tracking-widest sticky left-0 bg-white z-[20] border-r border-slate-100">
                Line Item Detail
              </th>
              {data.map(y => (
                <th key={y.year} className="p-4 font-bold text-center text-slate-600 border-b border-slate-100">
                  {y.calendarYear}
                </th>
              ))}
              <th className="p-4 font-bold text-center text-slate-600 bg-slate-50/50 border-b border-slate-100 sticky right-0 z-[10] border-l border-slate-200">
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
                    className="bg-slate-50/30 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100"
                    onClick={() => toggleSection(section.title)}
                  >
                    <td className="sticky left-0 bg-white z-[15] p-4 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)] group-hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <svg 
                          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">{section.title}</span>
                      </div>
                    </td>
                    {data.map(y => (
                      <td key={y.year} className="p-4 text-right border-b border-slate-50"></td>
                    ))}
                    <td className="sticky right-0 bg-slate-50/50 p-4 border-l border-slate-200"></td>
                  </tr>
                  
                  {!isCollapsed && section.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className={`group hover:bg-slate-50/20 transition-colors border-b border-slate-50/50`}
                    >
                      <td className={`sticky left-0 p-3 pl-10 z-[10] bg-white border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)] group-hover:bg-slate-50/20
                        ${row.indent ? 'pl-14 text-slate-500' : 'text-slate-700'} 
                        ${row.bold ? 'font-bold text-slate-900' : 'font-medium'}`}>
                        <div className="flex items-center gap-2">
                          {row.label}
                        </div>
                      </td>
                      {data.map(y => (
                        <td key={y.year} className="p-3 text-right border-r border-slate-50/30">
                          {renderCellValue((y as any)[row.key], row.type, row.color)}
                        </td>
                      ))}
                      <td className={`sticky right-0 p-3 text-right z-[10] bg-slate-50/80 border-l border-slate-200 group-hover:bg-slate-100 transition-colors
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
