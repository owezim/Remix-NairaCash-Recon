import React, { useState, useMemo } from 'react';
import { 
  LocalDatabaseSchema, 
  DailyReportRecord 
} from '../types/reconciliation';
import { 
  formatNaira, 
  calculateTotalCashBalance, 
  calculateCashFlowClosing 
} from '../utils/calculations';
import { getCarriedForwardBalance } from '../utils/storage';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  RotateCcw,
  SlidersHorizontal,
  Landmark,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface DailyReportsManagerProps {
  db: LocalDatabaseSchema;
  activeReportDate: string;
  onSelectDate: (date: string) => void;
  onCreateNewDay: (dateStr: string, manualOpening?: number) => void;
  onDeleteReport: (dateStr: string) => void;
  onOpenCertificateForDate: (dateStr: string) => void;
  onExportDayCSV: (report: DailyReportRecord) => void;
}

export const DailyReportsManager: React.FC<DailyReportsManagerProps> = ({
  db,
  activeReportDate,
  onSelectDate,
  onCreateNewDay,
  onDeleteReport,
  onOpenCertificateForDate,
  onExportDayCSV,
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'balanced' | 'discrepancy' | 'surplus' | 'deficit'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'cash_desc' | 'variance_desc'>('date_desc');

  // New Day Modal State
  const [isNewDayModalOpen, setIsNewDayModalOpen] = useState(false);
  const [newDateInput, setNewDateInput] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [manualOpeningInput, setManualOpeningInput] = useState<string>('');
  const [useManualOpening, setUseManualOpening] = useState(false);

  // Calculate detected carried forward balance when newDateInput changes
  const detectedCarryForward = useMemo(() => {
    return getCarriedForwardBalance(newDateInput, db);
  }, [newDateInput, db]);

  // Transform reports into structured list with computed values
  const allReportsList = useMemo(() => {
    return Object.values(db.reports).map((report) => {
      const { totalCashBalance } = calculateTotalCashBalance(
        report.denominations,
        report.auxiliary,
        report.bundleSize,
        report.packetSize
      );

      const finacleBalance = Number(report.finacle.balance) || 0;
      const rawDifference = finacleBalance - totalCashBalance;
      const varianceAmount = totalCashBalance - finacleBalance;
      const absVariance = Math.abs(varianceAmount);
      const isBalanced = absVariance < 0.01;
      const isSurplus = varianceAmount > 0.01;
      const isDeficit = varianceAmount < -0.01;

      const { netMovement, expectedClosingBalance } = calculateCashFlowClosing(report.cashFlow);

      return {
        ...report,
        physicalClosing: totalCashBalance,
        finacleBalance,
        rawDifference,
        varianceAmount,
        absVariance,
        isBalanced,
        isSurplus,
        isDeficit,
        netMovement,
        expectedClosingBalance,
        signedCount: report.signOffs.filter(s => s.status === 'signed').length,
      };
    });
  }, [db]);

  // Filtered and Sorted Reports
  const filteredReports = useMemo(() => {
    return allReportsList
      .filter((rep) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesDate = rep.reportDate.toLowerCase().includes(q);
          const matchesTeller = rep.finacle.tellerId.toLowerCase().includes(q);
          const matchesBatch = rep.finacle.batchNumber.toLowerCase().includes(q);
          const matchesBranch = rep.finacle.branchName.toLowerCase().includes(q);
          if (!matchesDate && !matchesTeller && !matchesBatch && !matchesBranch) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter === 'balanced' && !rep.isBalanced) return false;
        if (statusFilter === 'discrepancy' && rep.isBalanced) return false;
        if (statusFilter === 'surplus' && !rep.isSurplus) return false;
        if (statusFilter === 'deficit' && !rep.isDeficit) return false;

        // Date Range
        if (fromDate && rep.reportDate < fromDate) return false;
        if (toDate && rep.reportDate > toDate) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.reportDate.localeCompare(a.reportDate);
        if (sortBy === 'date_asc') return a.reportDate.localeCompare(b.reportDate);
        if (sortBy === 'cash_desc') return b.physicalClosing - a.physicalClosing;
        if (sortBy === 'variance_desc') return b.absVariance - a.absVariance;
        return 0;
      });
  }, [allReportsList, searchQuery, statusFilter, fromDate, toDate, sortBy]);

  // Aggregate KPI metrics across filtered reports
  const summaryKpi = useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalVaultOut = 0;
    let totalPhysicalCash = 0;
    let totalVariance = 0;

    for (const r of filteredReports) {
      totalDeposits += Number(r.cashFlow.totalDeposit) || 0;
      totalWithdrawals += Number(r.cashFlow.totalWithdrawal) || 0;
      totalVaultOut += Number(r.cashFlow.vaultOutAmount) || 0;
      totalPhysicalCash += r.physicalClosing;
      totalVariance += r.varianceAmount;
    }

    return {
      totalReports: filteredReports.length,
      totalDeposits,
      totalWithdrawals,
      totalVaultOut,
      totalPhysicalCash,
      totalVariance,
    };
  }, [filteredReports]);

  // Handle Generate Report form submit
  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput) return;

    let manualOpening: number | undefined = undefined;
    if (useManualOpening) {
      const parsed = parseFloat(manualOpeningInput);
      manualOpening = isNaN(parsed) ? 0 : parsed;
    }

    onCreateNewDay(newDateInput, manualOpening);
    setIsNewDayModalOpen(false);
    setUseManualOpening(false);
    setManualOpeningInput('');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setSortBy('date_desc');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Action Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Daily Financial Reconciliation Reports Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, audit, and generate official daily EOD reports. Opening balances automatically carry forward from the prior day&apos;s physical closing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewDayModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Daily Report</span>
          </button>
        </div>
      </div>

      {/* KPI Aggregate Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">FILTERED DAYS</span>
          <span className="text-lg font-mono font-black text-slate-900 dark:text-white">{summaryKpi.totalReports} Days</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">TOTAL DEPOSITS</span>
          <span className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-300">{formatNaira(summaryKpi.totalDeposits)}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 block">TOTAL WITHDRAWALS</span>
          <span className="text-base font-mono font-bold text-rose-700 dark:text-rose-300">{formatNaira(summaryKpi.totalWithdrawals)}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 block">TOTAL VAULT EVACUATION</span>
          <span className="text-base font-mono font-bold text-amber-700 dark:text-amber-300">{formatNaira(summaryKpi.totalVaultOut)}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">NET VARIANCE</span>
          <span className={`text-base font-mono font-bold ${
            Math.abs(summaryKpi.totalVariance) < 0.01 
              ? 'text-emerald-600' 
              : summaryKpi.totalVariance > 0 
                ? 'text-rose-600' 
                : 'text-amber-600'
          }`}>
            {formatNaira(summaryKpi.totalVariance, true)}
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by date (e.g. 2026-10-15), teller ID, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({allReportsList.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('balanced')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusFilter === 'balanced'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700'
              }`}
            >
              Reconciled
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('discrepancy')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusFilter === 'discrepancy'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700'
              }`}
            >
              With Discrepancy
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('surplus')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusFilter === 'surplus'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700'
              }`}
            >
              Surplus Only
            </button>
          </div>

        </div>

        {/* Secondary Filter Row: Date Range & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Date Range:
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
              placeholder="From"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs"
              placeholder="To"
            />
            {(fromDate || toDate || searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-slate-500 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1 ml-2 underline"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="date_desc">Date (Newest first)</option>
              <option value="date_asc">Date (Oldest first)</option>
              <option value="cash_desc">Physical Cash Volume</option>
              <option value="variance_desc">Variance Magnitude</option>
            </select>
          </div>

        </div>

      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4">REPORT DATE</th>
                <th className="py-3 px-3 text-right">OPENING (B/F)</th>
                <th className="py-3 px-3 text-right">DEPOSITS</th>
                <th className="py-3 px-3 text-right">WITHDRAWALS</th>
                <th className="py-3 px-3 text-right">VAULT OUT</th>
                <th className="py-3 px-4 text-right">PHYSICAL CLOSING</th>
                <th className="py-3 px-3 text-right">FINACLE GL</th>
                <th className="py-3 px-4 text-center">VARIANCE</th>
                <th className="py-3 px-3 text-center">APPROVAL</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    <p className="font-medium text-sm">No daily reports found matching your filters.</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:underline"
                    >
                      Reset all filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isActive = report.reportDate === activeReportDate;

                  return (
                    <tr
                      key={report.id}
                      className={`transition-colors ${
                        isActive
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-inset ring-indigo-500/20'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                            {report.reportDate}
                          </span>
                          {isActive && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">
                              Active Till
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {report.finacle.tellerId} · {report.finacle.batchNumber.slice(0, 16)}
                        </div>
                      </td>

                      {/* Opening */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatNaira(report.cashFlow.openingBalance)}
                      </td>

                      {/* Deposits */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        +{formatNaira(report.cashFlow.totalDeposit)}
                      </td>

                      {/* Withdrawals */}
                      <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        -{formatNaira(report.cashFlow.totalWithdrawal)}
                      </td>

                      {/* Vault Out */}
                      <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        -{formatNaira(report.cashFlow.vaultOutAmount)}
                      </td>

                      {/* Physical Closing Available Balance */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatNaira(report.physicalClosing)}
                      </td>

                      {/* Finacle GL */}
                      <td className="py-3 px-3 text-right font-mono text-indigo-700 dark:text-indigo-300">
                        {formatNaira(report.finacleBalance)}
                      </td>

                      {/* Discrepancy / Variance */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded font-bold ${
                            report.isBalanced
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : report.isSurplus
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {report.isBalanced ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          <span>{formatNaira(report.rawDifference)}</span>
                        </span>
                      </td>

                      {/* Sign-offs */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-[11px] text-slate-500">
                          {report.signedCount}/3 Signed
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectDate(report.reportDate)}
                            className="px-2.5 py-1 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-[11px] hover:opacity-90 transition-opacity flex items-center gap-1"
                            title="Load report into counting matrix"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenCertificateForDate(report.reportDate)}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Print Form EOD-104 Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onExportDayCSV(report)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                            title="Export Day CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReport(report.reportDate)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                            title="Delete this daily report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guided "Generate Daily Report" Modal */}
      {isNewDayModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Generate Daily Reconciliation Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Creates a clean daily worksheet. All cash flow and physical counting parameters default strictly to 0.
            </p>

            <form onSubmit={handleGenerateSubmit} className="mt-4 space-y-4 text-xs">
              
              {/* Date Input */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Report Date (YYYY-MM-DD):
                </label>
                <input
                  type="date"
                  required
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Detected Carry Forward Card */}
              <div className="p-3.5 rounded-lg border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 uppercase">
                  <span>Carried Forward Opening Cash</span>
                  {detectedCarryForward.sourceDate ? (
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      from {detectedCarryForward.sourceDate}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-500">First Day (₦0.00)</span>
                  )}
                </div>
                <div className="text-xl font-mono font-black text-slate-900 dark:text-white">
                  {formatNaira(detectedCarryForward.openingBalance)}
                </div>
                <p className="text-[11px] text-slate-500">
                  {detectedCarryForward.sourceDate
                    ? `Automatically carries forward the actual physical closing balance from ${detectedCarryForward.sourceDate}.`
                    : 'No earlier reports found in database; opening balance starts at ₦0.00.'}
                </p>
              </div>

              {/* Manual Override checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={useManualOpening}
                    onChange={(e) => setUseManualOpening(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Override opening balance with custom amount</span>
                </label>

                {useManualOpening && (
                  <div className="mt-2 pl-6">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter custom opening cash (₦)"
                      value={manualOpeningInput}
                      onChange={(e) => setManualOpeningInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewDayModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
                >
                  Create &amp; Open Report
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
