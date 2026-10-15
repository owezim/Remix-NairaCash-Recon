import React from 'react';
import { DailyCashFlow } from '../types/reconciliation';
import { formatNaira, calculateCashFlowClosing } from '../utils/calculations';
import { 
  Calendar, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Vault, 
  Landmark, 
  Layers, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface DailyCashFlowPanelProps {
  cashFlow: DailyCashFlow;
  onChange: (updated: Partial<DailyCashFlow>) => void;
  actualPhysicalClosing: number;
  onSyncFinacleWithExpected: (expectedAmount: number) => void;
  onSelectDate: (date: string) => void;
  savedDates: string[];
  onCreateNewDay: () => void;
}

export const DailyCashFlowPanel: React.FC<DailyCashFlowPanelProps> = ({
  cashFlow,
  onChange,
  actualPhysicalClosing,
  onSyncFinacleWithExpected,
  onSelectDate,
  savedDates,
  onCreateNewDay,
}) => {
  const { totalInflows, totalOutflows, netMovement, expectedClosingBalance } = calculateCashFlowClosing(cashFlow);
  const varianceFromPhysical = actualPhysicalClosing - expectedClosingBalance;
  const isBalanced = Math.abs(varianceFromPhysical) < 0.01;

  // Simple date navigation
  const currentDate = new Date(cashFlow.reportDate);
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split('T')[0];

  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Top Banner & Date Selector */}
      <div className="p-4 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase">Report Date:</span>
            <input
              type="date"
              value={cashFlow.reportDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelectDate(prevDateStr)}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(nextDateStr)}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Saved Date Pills */}
          {savedDates.length > 1 && (
            <div className="hidden lg:flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px]">Saved:</span>
              {savedDates.slice(0, 4).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onSelectDate(d)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                    d === cashFlow.reportDate
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreateNewDay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            title="Start new daily report with yesterday's closing balance"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Day Report</span>
          </button>
        </div>
      </div>

      {/* Daily Movements Input Grid */}
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-indigo-500" />
            Daily Cash Movement &amp; Flow Engine
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the day&apos;s cash flows: Opening brought forward, counter receipts, customer payouts, and vault transfers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Opening Balance */}
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Vault className="w-4 h-4 text-indigo-500" />
                Opening Balance
              </span>
              <span className="text-[10px] text-slate-400 font-mono">B/F</span>
            </div>
            <div className="mt-2 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashFlow.openingBalance}
                onChange={(e) => onChange({ openingBalance: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full pl-7 pr-2.5 py-1.5 text-sm font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Cash in drawer at start of business
            </p>
          </div>

          {/* 2. Total Deposit */}
          <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Total Deposit
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">+INFLOW</span>
            </div>
            <div className="mt-2 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashFlow.totalDeposit}
                onChange={(e) => onChange({ totalDeposit: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full pl-7 pr-2.5 py-1.5 text-sm font-mono font-bold rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Customer over-the-counter deposits
            </p>
          </div>

          {/* 3. Total Withdrawal */}
          <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-800/80 bg-rose-50/30 dark:bg-rose-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Total Withdrawal
              </span>
              <span className="text-[10px] text-rose-700 dark:text-rose-400 font-mono font-bold">-OUTFLOW</span>
            </div>
            <div className="mt-2 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashFlow.totalWithdrawal}
                onChange={(e) => onChange({ totalWithdrawal: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full pl-7 pr-2.5 py-1.5 text-sm font-mono font-bold rounded border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Customer counter payouts &amp; cheques
            </p>
          </div>

          {/* 4. Vault Out Amount */}
          <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1.5">
                <Vault className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Vault Out Amount
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">-VAULT</span>
            </div>
            <div className="mt-2 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">₦</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashFlow.vaultOutAmount}
                onChange={(e) => onChange({ vaultOutAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full pl-7 pr-2.5 py-1.5 text-sm font-mono font-bold rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Cash evacuated / transferred to vault
            </p>
          </div>

        </div>

        {/* Secondary movement row (Vault In & Inflow/Outflows) + Summary Equation */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Equation breakdown */}
          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Daily Cash Book Reconciliation Formula:</span>
            </div>
            <div className="text-xs sm:text-sm font-mono flex flex-wrap items-center gap-1.5 text-slate-200">
              <span>Opening ({formatNaira(cashFlow.openingBalance)})</span>
              <span className="text-emerald-400">+ Deposits ({formatNaira(cashFlow.totalDeposit)})</span>
              <span className="text-rose-400">- Withdrawals ({formatNaira(cashFlow.totalWithdrawal)})</span>
              <span className="text-amber-400">- Vault Out ({formatNaira(cashFlow.vaultOutAmount)})</span>
              <span>=</span>
              <strong className="text-base text-indigo-300 font-black">{formatNaira(expectedClosingBalance)}</strong>
            </div>
            <div className="text-[11px] text-slate-400">
              Net Day Movement: <span className={netMovement >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{formatNaira(netMovement, true)}</span>
            </div>
          </div>

          {/* Expected vs Actual Physical Closing Card */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/90 p-3 rounded-lg border border-slate-700">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">
                Calculated System Closing
              </div>
              <div className="text-lg font-mono font-black text-white">
                {formatNaira(expectedClosingBalance)}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">
                Physical Cash Closing
              </div>
              <div className="text-lg font-mono font-black text-emerald-400">
                {formatNaira(actualPhysicalClosing)}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => onSyncFinacleWithExpected(expectedClosingBalance)}
              className="px-2.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
              title="Update Finacle General Ledger balance to match this calculated closing balance"
            >
              <Sparkles className="w-3 h-3" />
              Sync GL
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
