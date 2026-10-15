/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  DenominationRow, 
  AuxiliaryBalances, 
  FinacleLedgerInfo, 
  PendingAdjustment, 
  SignOffRecord,
  DailyCashFlow,
  DailyReportRecord,
  LocalDatabaseSchema
} from './types/reconciliation';
import { 
  BLANK_DENOMINATIONS,
  INITIAL_AUXILIARY, 
  INITIAL_FINACLE, 
  DEFAULT_BUNDLE_SIZE, 
  DEFAULT_PACKET_SIZE, 
  calculateDiscrepancy, 
  calculateTotalCashBalance, 
  calculateRowPieces, 
  calculateRowTotal, 
  calculateCashFlowClosing,
  formatNaira, 
  formatNumber 
} from './utils/calculations';
import { 
  loadDatabase, 
  saveReportToDatabase, 
  createNewDayReport, 
  deleteReportFromDatabase,
  exportDatabaseAsJSON, 
  importDatabaseFromJSON,
  createBlankReport,
  createPromptCaseStudyReport
} from './utils/storage';
import { Header } from './components/Header';
import { DailyCashFlowPanel } from './components/DailyCashFlowPanel';
import { DiscrepancyHero } from './components/DiscrepancyHero';
import { DenominationTable } from './components/DenominationTable';
import { DailyReportsManager } from './components/DailyReportsManager';
import { RootCauseInvestigator } from './components/RootCauseInvestigator';
import { AnalyticsAndDistribution } from './components/AnalyticsAndDistribution';
import { AuditTrailAndSignoff } from './components/AuditTrailAndSignoff';
import { ReconciliationCertificateModal } from './components/ReconciliationCertificateModal';
import { 
  Coins, 
  Search, 
  PieChart, 
  ShieldCheck, 
  Building,
  Landmark,
  Database,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  // Load local JSON database from localStorage (defaults to zero-based report)
  const [db, setDb] = useState<LocalDatabaseSchema>(() => loadDatabase());
  const activeDate = db.activeReportDate;

  // Active daily report
  const activeReport = useMemo<DailyReportRecord>(() => {
    return db.reports[activeDate] || createBlankReport(activeDate, 0);
  }, [db, activeDate]);

  // Working state derived from active report
  const [cashFlow, setCashFlow] = useState<DailyCashFlow>(activeReport.cashFlow);
  const [denominations, setDenominations] = useState<DenominationRow[]>(activeReport.denominations);
  const [auxiliary, setAuxiliary] = useState<AuxiliaryBalances>(activeReport.auxiliary);
  const [finacle, setFinacle] = useState<FinacleLedgerInfo>(activeReport.finacle);
  const [bundleSize, setBundleSize] = useState<number>(activeReport.bundleSize || DEFAULT_BUNDLE_SIZE);
  const [packetSize] = useState<number>(activeReport.packetSize || DEFAULT_PACKET_SIZE);
  const [adjustments, setAdjustments] = useState<PendingAdjustment[]>(activeReport.adjustments || []);
  const [signOffs, setSignOffs] = useState<SignOffRecord[]>(activeReport.signOffs);
  const [auditLogs, setAuditLogs] = useState<{ timestamp: string; action: string; user: string }[]>(activeReport.auditLogs);

  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [certificateDate, setCertificateDate] = useState<string>(activeDate);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'matrix' | 'cashflow' | 'reports' | 'investigator' | 'analytics' | 'audit'>('matrix');

  // When active report changes (date switch or database restore), sync working state
  useEffect(() => {
    setCashFlow(activeReport.cashFlow);
    setDenominations(activeReport.denominations);
    setAuxiliary(activeReport.auxiliary);
    setFinacle(activeReport.finacle);
    setBundleSize(activeReport.bundleSize || DEFAULT_BUNDLE_SIZE);
    setAdjustments(activeReport.adjustments || []);
    setSignOffs(activeReport.signOffs);
    setAuditLogs(activeReport.auditLogs);
    setCertificateDate(activeReport.reportDate);
  }, [activeReport]);

  // Auto-save to Local JSON Database whenever state changes
  useEffect(() => {
    const updatedRecord: DailyReportRecord = {
      id: `report-${activeDate}`,
      reportDate: activeDate,
      createdAt: activeReport.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cashFlow,
      denominations,
      auxiliary,
      finacle,
      bundleSize,
      packetSize,
      adjustments,
      signOffs,
      auditLogs,
      status: activeReport.status || 'draft',
    };

    saveReportToDatabase(updatedRecord);
  }, [
    activeDate,
    cashFlow,
    denominations,
    auxiliary,
    finacle,
    bundleSize,
    packetSize,
    adjustments,
    signOffs,
    auditLogs,
  ]);

  // Audit log helper
  const addAuditLog = useCallback((action: string, user: string = 'TELLER_OPERATOR') => {
    const timeStr = new Date().toLocaleTimeString('en-GB');
    setAuditLogs(prev => [{ timestamp: timeStr, action, user }, ...prev]);
  }, []);

  // Real-time Calculations
  const { totalCashBalance, totalPiecesCount } = useMemo(() => {
    return calculateTotalCashBalance(denominations, auxiliary, bundleSize, packetSize);
  }, [denominations, auxiliary, bundleSize, packetSize]);

  const discrepancy = useMemo(() => {
    return calculateDiscrepancy(totalCashBalance, finacle, adjustments);
  }, [totalCashBalance, finacle, adjustments]);

  // Denominations Handlers
  const handleDenominationChange = (id: string, field: 'bundles' | 'packets' | 'pieces', value: number) => {
    setDenominations(prev =>
      prev.map(row => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleResetRow = (id: string) => {
    setDenominations(prev =>
      prev.map(row => {
        if (row.id === id) {
          return { ...row, bundles: 0, packets: 0, pieces: 0 };
        }
        return row;
      })
    );
    addAuditLog(`Cleared count for denomination ${id} to 0`);
  };

  const handleClearDayCounts = () => {
    setDenominations(JSON.parse(JSON.stringify(BLANK_DENOMINATIONS)));
    setAuxiliary(prev => ({ ...prev, pcsBalance: 0, vaultInBalance: 0 }));
    addAuditLog(`Reset all denomination counts and auxiliary balances to 0 for date ${activeDate}`);
  };

  const handleAuxiliaryChange = (field: keyof AuxiliaryBalances, value: any) => {
    setAuxiliary(prev => ({ ...prev, [field]: value }));
    addAuditLog(`Updated auxiliary ${String(field)} to ${value}`);
  };

  const handleFinacleBalanceChange = (val: number) => {
    setFinacle(prev => ({ ...prev, balance: val }));
    addAuditLog(`Finacle GL balance updated to ${formatNaira(val)}`);
  };

  // Cash Flow Handlers
  const handleCashFlowChange = (updated: Partial<DailyCashFlow>) => {
    setCashFlow(prev => ({ ...prev, ...updated }));
  };

  const handleSyncFinacleWithExpected = (expectedAmount: number) => {
    setFinacle(prev => ({ ...prev, balance: expectedAmount }));
    addAuditLog(`Synced Finacle GL balance with calculated closing cash: ${formatNaira(expectedAmount)}`);
  };

  // Date switching
  const handleSelectDate = (newDate: string) => {
    if (!newDate) return;
    setDb(prev => {
      const updatedReports = { ...prev.reports };
      if (!updatedReports[newDate]) {
        updatedReports[newDate] = createBlankReport(newDate, 0);
      }
      return {
        ...prev,
        activeReportDate: newDate,
        reports: updatedReports,
      };
    });
    setActiveTab('matrix');
  };

  // Generate New Day Report with automated carry-forward of previous closing
  const handleCreateNewDay = (dateStr: string, manualOpening?: number) => {
    const { db: updatedDb } = createNewDayReport(dateStr, manualOpening);
    setDb(updatedDb);
    setActiveTab('matrix');
  };

  // Delete Report
  const handleDeleteReport = (dateStr: string) => {
    if (Object.keys(db.reports).length <= 1) {
      alert('Cannot delete the only existing daily report.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the daily report for ${dateStr}?`)) {
      return;
    }
    const updatedDb = deleteReportFromDatabase(dateStr);
    setDb(updatedDb);
  };

  // Open Certificate for specific date
  const handleOpenCertificateForDate = (dateStr: string) => {
    setCertificateDate(dateStr);
    setIsCertificateOpen(true);
  };

  // Load Prompt Case Study (for inspection/testing)
  const handleLoadPromptCaseStudy = () => {
    const promptRep = createPromptCaseStudyReport('2026-10-15');
    setDb(prev => ({
      ...prev,
      activeReportDate: '2026-10-15',
      reports: {
        ...prev.reports,
        '2026-10-15': promptRep,
      },
    }));
    setActiveTab('matrix');
  };

  // Local JSON Backup / Restore
  const handleExportJSON = () => {
    exportDatabaseAsJSON();
    addAuditLog('Exported full database to local JSON backup file');
  };

  const handleImportJSON = (jsonStr: string) => {
    try {
      const importedDb = importDatabaseFromJSON(jsonStr);
      setDb(importedDb);
      addAuditLog('Restored local database from JSON file');
    } catch (err: any) {
      alert(`Failed to import JSON file: ${err?.message || 'Invalid format'}`);
    }
  };

  // Adjustments handling
  const handleToggleAdjustment = (id: string) => {
    setAdjustments(prev =>
      prev.map(a => {
        if (a.id === id) {
          const nextState = !a.verified;
          addAuditLog(`${nextState ? 'Verified' : 'Unverified'} adjustment: ${a.description} (${formatNaira(a.amount)})`);
          return { ...a, verified: nextState };
        }
        return a;
      })
    );
  };

  const handleAddAdjustment = (newAdj: Omit<PendingAdjustment, 'id'>) => {
    const id = `adj-${Date.now()}`;
    setAdjustments(prev => [...prev, { ...newAdj, id }]);
    addAuditLog(`Added adjustment: ${newAdj.description} (${formatNaira(newAdj.amount)})`);
  };

  const handleDeleteAdjustment = (id: string) => {
    const found = adjustments.find(a => a.id === id);
    setAdjustments(prev => prev.filter(a => a.id !== id));
    if (found) {
      addAuditLog(`Removed adjustment: ${found.description}`);
    }
  };

  const handleApplyAllPending = () => {
    setAdjustments(prev => prev.map(a => ({ ...a, verified: true })));
    addAuditLog('Verified all pending in-flight transactions');
  };

  // Sign-offs
  const handleToggleSignOff = (role: SignOffRecord['role'], status: 'signed' | 'pending', comments?: string) => {
    setSignOffs(prev =>
      prev.map(s => {
        if (s.role === role) {
          const signedAt = status === 'signed' ? new Date().toLocaleString('en-GB') : undefined;
          addAuditLog(`${s.title} (${s.name}) signed off as ${status.toUpperCase()}`);
          return { ...s, status, signedAt, comments: comments || s.comments };
        }
        return s;
      })
    );
  };

  // Export CSV
  const handleExportCSVForReport = (report: DailyReportRecord) => {
    const { expectedClosingBalance, netMovement } = calculateCashFlowClosing(report.cashFlow);
    const { totalCashBalance: closingCash } = calculateTotalCashBalance(
      report.denominations,
      report.auxiliary,
      report.bundleSize,
      report.packetSize
    );

    const headers = ['DENOMINATION', 'BUNDLE', 'PACKET', 'PIECES', 'TOTAL_PIECES', 'TOTAL_AMOUNT_NGN', 'SHARE_PERCENT'];
    const rows = report.denominations.map(row => {
      const pieces = calculateRowPieces(row, report.bundleSize, report.packetSize);
      const total = calculateRowTotal(row, report.bundleSize, report.packetSize);
      const share = closingCash > 0 ? ((total / closingCash) * 100).toFixed(2) : '0';
      return [
        `"${row.label}"`,
        row.bundles,
        row.packets,
        row.pieces,
        pieces,
        total.toFixed(2),
        `"${share}%"`,
      ].join(',');
    });

    const csvContent = [
      `"DAILY CASH REPORT FOR: ${report.reportDate}"`,
      `"OPENING BALANCE",,,,,,"${report.cashFlow.openingBalance.toFixed(2)}"`,
      `"TOTAL DEPOSITS",,,,,,"${report.cashFlow.totalDeposit.toFixed(2)}"`,
      `"TOTAL WITHDRAWALS",,,,,,"${report.cashFlow.totalWithdrawal.toFixed(2)}"`,
      `"VAULT OUT AMOUNT",,,,,,"${report.cashFlow.vaultOutAmount.toFixed(2)}"`,
      `"NET MOVEMENT",,,,,,"${netMovement.toFixed(2)}"`,
      `"EXPECTED SYSTEM CLOSING",,,,,,"${expectedClosingBalance.toFixed(2)}"`,
      '""',
      headers.join(','),
      ...rows,
      `"pcs balance",,,,,"${report.auxiliary.pcsBalance.toFixed(2)}",`,
      `"vault-in balance",,,,,"${report.auxiliary.vaultInBalance.toFixed(2)}",`,
      `"AVAILABLE BALANCE (Closing Balance for the day)",,,,,"${closingCash.toFixed(2)}","100%"`,
      `"TOTAL FINACLE BALANCE",,,,,"${report.finacle.balance.toFixed(2)}",`,
      `"AVAILABLE BALANCE (Difference)",,,,,"${(report.finacle.balance - closingCash).toFixed(2)}",`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daily_Cash_Reconciliation_${report.reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog(`Exported report for ${report.reportDate} to CSV`);
  };

  // Certificate target report (may be active or from reports archive)
  const certificateReport = db.reports[certificateDate] || activeReport;
  const certificateDiscrepancy = useMemo(() => {
    const { totalCashBalance: cCash } = calculateTotalCashBalance(
      certificateReport.denominations,
      certificateReport.auxiliary,
      certificateReport.bundleSize,
      certificateReport.packetSize
    );
    return calculateDiscrepancy(cCash, certificateReport.finacle, certificateReport.adjustments);
  }, [certificateReport]);

  const savedDates = Object.keys(db.reports).sort().reverse();

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Header with Local JSON Storage controls & Clean Actions */}
      <Header
        finacle={finacle}
        reportDate={activeDate}
        bundleSize={bundleSize}
        onBundleSizeChange={setBundleSize}
        onClearDayCounts={handleClearDayCounts}
        onOpenCertificate={() => handleOpenCertificateForDate(activeDate)}
        onExportCSV={() => handleExportCSVForReport(activeReport)}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onOpenNewDayModal={() => setActiveTab('reports')}
        onLoadPromptCaseStudy={handleLoadPromptCaseStudy}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Discrepancy Spotlight Hero */}
        <DiscrepancyHero
          discrepancy={discrepancy}
          finacle={finacle}
          totalPieces={totalPiecesCount}
          onOpenInvestigator={() => setActiveTab('investigator')}
          onAutoReconcile={handleApplyAllPending}
        />

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2">
          
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Denomination Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cashflow')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'cashflow'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Daily Cash Movements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Reports Hub</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {Object.keys(db.reports).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('investigator')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors relative ${
              activeTab === 'investigator'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Root-Cause Desk</span>
            {discrepancy.type !== 'BALANCED' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 right-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sign-Off &amp; Audit</span>
          </button>

        </div>

        {/* Tab 1: Realtime Denomination Calculator Table */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <DenominationTable
              denominations={denominations}
              auxiliary={auxiliary}
              finacle={finacle}
              bundleSize={bundleSize}
              packetSize={packetSize}
              onDenominationChange={handleDenominationChange}
              onAuxiliaryChange={handleAuxiliaryChange}
              onFinacleBalanceChange={handleFinacleBalanceChange}
              onResetRow={handleResetRow}
            />

            {/* Quick Context Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-500 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <span>Reconciliation Summary</span>
                    <span className="text-[10px] bg-indigo-800 font-mono px-2 py-0.5 rounded font-normal">
                      Date: {activeDate}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Physical Cash Closing: <span className="font-mono text-emerald-400 font-bold">{formatNaira(totalCashBalance)}</span> | 
                    Finacle GL Balance: <span className="font-mono text-slate-300 font-bold">{formatNaira(finacle.balance)}</span> | 
                    Discrepancy: <span className="font-mono text-rose-400 font-bold">{formatNaira(finacle.balance - totalCashBalance)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('cashflow')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Edit Cash Flows
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('investigator')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Resolve Discrepancy
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCertificateForDate(activeDate)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Print Voucher
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Daily Cash Movements Panel */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            <DailyCashFlowPanel
              cashFlow={cashFlow}
              onChange={handleCashFlowChange}
              actualPhysicalClosing={totalCashBalance}
              onSyncFinacleWithExpected={handleSyncFinacleWithExpected}
              onSelectDate={handleSelectDate}
              savedDates={savedDates}
              onCreateNewDay={() => setActiveTab('reports')}
            />
          </div>
        )}

        {/* Tab 3: Daily Reports Hub (Navigation & Filters) */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <DailyReportsManager
              db={db}
              activeReportDate={activeDate}
              onSelectDate={handleSelectDate}
              onCreateNewDay={handleCreateNewDay}
              onDeleteReport={handleDeleteReport}
              onOpenCertificateForDate={handleOpenCertificateForDate}
              onExportDayCSV={handleExportCSVForReport}
            />
          </div>
        )}

        {/* Tab 4: Root-Cause Investigator */}
        {activeTab === 'investigator' && (
          <div className="space-y-6">
            <RootCauseInvestigator
              discrepancy={discrepancy}
              finacle={finacle}
              denominations={denominations}
              bundleSize={bundleSize}
              packetSize={packetSize}
              adjustments={adjustments}
              onToggleAdjustment={handleToggleAdjustment}
              onAddAdjustment={handleAddAdjustment}
              onDeleteAdjustment={handleDeleteAdjustment}
              onApplyAllPending={handleApplyAllPending}
            />
          </div>
        )}

        {/* Tab 5: Analytics & Distribution */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsAndDistribution
              denominations={denominations}
              totalCashBalance={totalCashBalance}
              finacleBalance={finacle.balance}
              bundleSize={bundleSize}
              packetSize={packetSize}
            />
          </div>
        )}

        {/* Tab 6: Sign-off & Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <AuditTrailAndSignoff
              signOffs={signOffs}
              onToggleSignOff={handleToggleSignOff}
              auditLogs={auditLogs}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">NairaCash Recon</span>
            <span>· Daily Financial Reporting Engine</span>
            <span>·</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Local JSON Storage Active ({Object.keys(db.reports).length} reports)
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Central Bank of Nigeria (CBN) Cash Guidelines</span>
            <span>·</span>
            <span>Zero-Default Daily Initialization</span>
          </div>
        </div>
      </footer>

      {/* Official Certificate Modal */}
      <ReconciliationCertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        reportDate={certificateReport.reportDate}
        cashFlow={certificateReport.cashFlow}
        denominations={certificateReport.denominations}
        auxiliary={certificateReport.auxiliary}
        finacle={certificateReport.finacle}
        discrepancy={certificateDiscrepancy}
        bundleSize={certificateReport.bundleSize || bundleSize}
        packetSize={certificateReport.packetSize || packetSize}
        signOffs={certificateReport.signOffs}
      />

    </div>
  );
}
