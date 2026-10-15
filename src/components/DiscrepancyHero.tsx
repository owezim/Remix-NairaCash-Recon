import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  HelpCircle,
  FileQuestion,
  ChevronRight,
  TrendingUp,
  Coins,
  Scale
} from 'lucide-react';
import { DiscrepancyReport, formatNaira, formatNumber } from '../utils/calculations';
import { FinacleLedgerInfo } from '../types/reconciliation';

interface DiscrepancyHeroProps {
  discrepancy: DiscrepancyReport;
  finacle: FinacleLedgerInfo;
  totalPieces: number;
  onOpenInvestigator: () => void;
  onAutoReconcile: () => void;
}

export const DiscrepancyHero: React.FC<DiscrepancyHeroProps> = ({
  discrepancy,
  finacle,
  totalPieces,
  onOpenInvestigator,
  onAutoReconcile,
}) => {
  const isSurplus = discrepancy.type === 'SURPLUS';
  const isDeficit = discrepancy.type === 'DEFICIT';
  const isBalanced = discrepancy.type === 'BALANCED';

  return (
    <div className="relative overflow-hidden rounded-xl border transition-all duration-300 shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      
      {/* Top Status Alert Stripe */}
      <div 
        className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
          isBalanced 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
            : isSurplus 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2.5 font-semibold text-sm">
          {isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className={`w-5 h-5 shrink-0 ${isSurplus ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`} />
          )}
          <span>
            {isBalanced 
              ? 'SYSTEM RECONCILED: Till Balance Matches Finacle Ledger (Zero Variance)' 
              : isSurplus 
                ? 'MATERIAL DISCREPANCY DETECTED: Physical Cash Surplus / Overage in Drawer'
                : 'DISCREPANCY ALERT: Physical Cash Shortage / Deficit in Drawer'}
          </span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
            isBalanced 
              ? 'bg-emerald-200/70 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100' 
              : isSurplus 
                ? 'bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-100' 
                : 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
          }`}>
            {discrepancy.severity}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            CBN Threshold: &gt;₦500,000 Material Escalation
          </span>
          {!isBalanced && (
            <button
              type="button"
              onClick={onOpenInvestigator}
              className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Investigate Root Causes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Total Physical Cash Balance */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total Cash Balance (Physical)
              </span>
              <span className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                Counted
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mt-2">
              {formatNaira(discrepancy.physicalCash)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
              <span>{formatNumber(totalPieces)} banknotes counted</span>
              <span>·</span>
              <span>Vault &amp; Till Total</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 flex justify-between">
            <span>Denominations: ₦1,000 – ₦5</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Verified</span>
          </div>
        </div>

        {/* 2. Total Finacle Balance */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Total Finacle Balance (GL)
              </span>
              <span className="font-mono text-[11px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                Core System
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mt-2">
              {formatNaira(discrepancy.finacleBalance)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono truncate" title={finacle.glAccountName}>
              {finacle.glAccountCode} · Till #{finacle.tellerId.replace('TLR_', '')}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 flex justify-between">
            <span>Batch: {finacle.batchNumber.slice(0, 15)}...</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono">Live Book</span>
          </div>
        </div>

        {/* 3. Discrepancy Highlight Card (Available Balance / Difference) */}
        <div 
          className={`rounded-lg p-4 border flex flex-col justify-between transition-all ${
            isBalanced
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
              : isSurplus
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/20'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                {isSurplus ? (
                  <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                ) : isDeficit ? (
                  <ArrowDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                Available Balance (Difference)
              </span>
              <span 
                className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold uppercase ${
                  isBalanced
                    ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : isSurplus
                      ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                      : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                }`}
              >
                {isBalanced ? 'Matched' : isSurplus ? 'Physical Surplus' : 'Shortage'}
              </span>
            </div>

            {/* Large Prominent Difference Display */}
            <div 
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-2 ${
                isBalanced
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isSurplus
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {/* Show the raw sheet difference: -₦2,760,030.00 */}
              {formatNaira(discrepancy.rawDifference)}
            </div>

            <p className="text-xs mt-1.5 font-medium text-slate-600 dark:text-slate-300">
              {isBalanced ? (
                '0.00% variance. No action required.'
              ) : isSurplus ? (
                <>Physical is <strong className="text-rose-700 dark:text-rose-300 font-bold font-mono">+{formatNaira(discrepancy.varianceAmount)}</strong> higher than Finacle</>
              ) : (
                <>Physical is <strong className="text-amber-700 dark:text-amber-300 font-bold font-mono">{formatNaira(discrepancy.varianceAmount)}</strong> lower than Finacle</>
              )}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Variance Ratio: <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{discrepancy.percentageVariance.toFixed(1)}%</span>
            </span>
            {!isBalanced && (
              <button
                type="button"
                onClick={onAutoReconcile}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 hover:underline"
              >
                Match Pending Deposits →
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Discrepancy Diagnostics Summary Bar */}
      {!isBalanced && (
        <div className="px-4 sm:px-6 py-3 bg-slate-100/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start sm:items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
            <p>
              <strong className="text-slate-800 dark:text-slate-100">Automated Audit Finding:</strong> {discrepancy.explanation}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenInvestigator}
              className="px-3 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium rounded hover:opacity-90 transition-opacity"
            >
              Open Resolution Desk
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
