import React from 'react';
import { DenominationRow } from '../types/reconciliation';
import { 
  formatNaira, 
  formatNumber, 
  calculateRowPieces, 
  calculateRowTotal 
} from '../utils/calculations';
import { 
  PieChart, 
  Layers, 
  Weight, 
  Boxes, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AnalyticsAndDistributionProps {
  denominations: DenominationRow[];
  totalCashBalance: number;
  finacleBalance: number;
  bundleSize: number;
  packetSize: number;
}

export const AnalyticsAndDistribution: React.FC<AnalyticsAndDistributionProps> = ({
  denominations,
  totalCashBalance,
  finacleBalance,
  bundleSize,
  packetSize,
}) => {
  const rowsWithCalculations = denominations.map((row) => {
    const pieces = calculateRowPieces(row, bundleSize, packetSize);
    const total = calculateRowTotal(row, bundleSize, packetSize);
    const valueShare = totalCashBalance > 0 ? (total / totalCashBalance) * 100 : 0;
    return {
      ...row,
      pieces,
      total,
      valueShare,
    };
  });

  const totalPieces = rowsWithCalculations.reduce((acc, r) => acc + r.pieces, 0);
  const estimatedWeightKg = (totalPieces * 1.0) / 1000; // standard 1g per banknote

  // Sort by highest value share for ranking
  const sortedByValue = [...rowsWithCalculations].sort((a, b) => b.total - a.total);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Cash Portfolio Composition &amp; Vault Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Denomination value distribution, physical banknote piece density, and vault logistics
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Weight className="w-3.5 h-3.5 text-slate-400" />
            Till Weight: <strong className="text-slate-800 dark:text-slate-200">{estimatedWeightKg.toFixed(2)} kg</strong>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-slate-400" />
            Total Notes: <strong className="text-slate-800 dark:text-slate-200">{formatNumber(totalPieces)} pcs</strong>
          </span>
        </div>
      </div>

      {/* Proportional Strip Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600 dark:text-slate-400">
          <span>Value Share by Banknote Denomination</span>
          <span className="font-mono text-[11px]">Total: {formatNaira(totalCashBalance)}</span>
        </div>
        <div className="w-full h-4 rounded-md overflow-hidden flex bg-slate-100 dark:bg-slate-800">
          {rowsWithCalculations.map((row) => (
            <div
              key={row.id}
              className={`h-full transition-all relative group cursor-pointer ${
                row.denomination === 1000 ? 'bg-indigo-600' :
                row.denomination === 500 ? 'bg-sky-500' :
                row.denomination === 200 ? 'bg-teal-500' :
                row.denomination === 100 ? 'bg-purple-500' :
                row.denomination === 50 ? 'bg-blue-500' :
                row.denomination === 20 ? 'bg-emerald-500' :
                row.denomination === 10 ? 'bg-amber-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.max(1, row.valueShare)}%` }}
              title={`${row.label}: ${formatNaira(row.total)} (${row.valueShare.toFixed(1)}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
          {rowsWithCalculations.map((row) => (
            <div key={row.id} className="flex items-center gap-1.5 font-mono">
              <span className={`w-2.5 h-2.5 rounded-sm ${
                row.denomination === 1000 ? 'bg-indigo-600' :
                row.denomination === 500 ? 'bg-sky-500' :
                row.denomination === 200 ? 'bg-teal-500' :
                row.denomination === 100 ? 'bg-purple-500' :
                row.denomination === 50 ? 'bg-blue-500' :
                row.denomination === 20 ? 'bg-emerald-500' :
                row.denomination === 10 ? 'bg-amber-500' : 'bg-orange-500'
              }`} />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{row.label}:</span>
              <span>{row.valueShare.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Top Denomination Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {sortedByValue.slice(0, 4).map((item, idx) => (
          <div 
            key={item.id}
            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold">{item.label}</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">#{idx + 1} Share</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatNaira(item.total)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{formatNumber(item.pieces)} pcs</span>
              <span className="font-bold">{item.valueShare.toFixed(1)}% of till</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
