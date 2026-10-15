import { 
  DailyReportRecord, 
  LocalDatabaseSchema, 
  DailyCashFlow, 
  DenominationRow, 
  AuxiliaryBalances, 
  FinacleLedgerInfo 
} from '../types/reconciliation';
import { 
  BLANK_DENOMINATIONS,
  PROMPT_SAMPLE_DENOMINATIONS,
  SAMPLE_CASE_ADJUSTMENTS,
  INITIAL_AUXILIARY, 
  INITIAL_FINACLE, 
  INITIAL_ADJUSTMENTS, 
  INITIAL_SIGNOFFS, 
  DEFAULT_BUNDLE_SIZE, 
  DEFAULT_PACKET_SIZE,
  calculateTotalCashBalance
} from './calculations';

export const STORAGE_KEY = 'nairacash_recon_reports_v2'; // v2 for clean zero-based storage

export const BLANK_CASH_FLOW: DailyCashFlow = {
  reportDate: '2026-10-15',
  reportTitle: 'Daily Till Reconciliation & Cash Movement',
  shiftName: 'Full Day',
  openingBalance: 0.00, // Carried forward from previous day or 0
  vaultOutAmount: 0.00, // Evacuated to vault
  totalDeposit: 0.00, // Customer deposits received today
  totalWithdrawal: 0.00, // Customer withdrawals paid today
  vaultInAmount: 0.00, // Till replenishment
  otherInflows: 0.00,
  otherOutflows: 0.00,
};

/**
 * Creates a clean daily report with every single parameter defaulting to 0,
 * except opening balance which is carried forward from the previous day's closing balance.
 */
export function createBlankReport(
  dateStr: string,
  carriedOpeningBalance: number = 0
): DailyReportRecord {
  return {
    id: `report-${dateStr}`,
    reportDate: dateStr,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cashFlow: {
      ...BLANK_CASH_FLOW,
      reportDate: dateStr,
      openingBalance: carriedOpeningBalance,
    },
    denominations: JSON.parse(JSON.stringify(BLANK_DENOMINATIONS)),
    auxiliary: {
      pcsBalance: 0,
      autoCalculatePcs: false,
      vaultInBalance: 0,
      autoCalculateVaultIn: false,
      vaultOutBalance: 0,
    },
    finacle: {
      ...INITIAL_FINACLE,
      balance: 0, // Real inputted figure
      systemTimestamp: `${dateStr} 16:30:00 EOD`,
    },
    bundleSize: DEFAULT_BUNDLE_SIZE,
    packetSize: DEFAULT_PACKET_SIZE,
    adjustments: [], // No demo adjustments
    signOffs: JSON.parse(JSON.stringify(INITIAL_SIGNOFFS)),
    auditLogs: [
      {
        timestamp: new Date().toLocaleTimeString('en-GB'),
        action: `Report initialized for ${dateStr}. Opening Balance carried forward: ₦${carriedOpeningBalance.toLocaleString()}. All counting fields set to 0.`,
        user: 'SYSTEM',
      },
    ],
    status: 'draft',
  };
}

/**
 * Finds the immediate prior day's closing physical cash balance to carry forward as today's opening balance.
 */
export function getCarriedForwardBalance(targetDateStr: string, db: LocalDatabaseSchema): {
  openingBalance: number;
  sourceDate: string | null;
} {
  const dates = Object.keys(db.reports)
    .filter(d => d < targetDateStr)
    .sort()
    .reverse();

  if (dates.length === 0) {
    return { openingBalance: 0, sourceDate: null };
  }

  const prevDate = dates[0];
  const prevReport = db.reports[prevDate];
  const { totalCashBalance } = calculateTotalCashBalance(
    prevReport.denominations,
    prevReport.auxiliary,
    prevReport.bundleSize || DEFAULT_BUNDLE_SIZE,
    prevReport.packetSize || DEFAULT_PACKET_SIZE
  );

  return { openingBalance: totalCashBalance, sourceDate: prevDate };
}

/**
 * Load local database from localStorage, initializing with a clean 0-default report for today.
 */
export function loadDatabase(): LocalDatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.reports && Object.keys(parsed.reports).length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse local database JSON from localStorage:', err);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const initialDb: LocalDatabaseSchema = {
    version: 2,
    activeReportDate: todayStr,
    reports: {
      [todayStr]: createBlankReport(todayStr, 0),
    },
  };
  saveDatabase(initialDb);
  return initialDb;
}

export function saveDatabase(db: LocalDatabaseSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to save local database JSON to localStorage:', err);
  }
}

export function saveReportToDatabase(report: DailyReportRecord): LocalDatabaseSchema {
  const db = loadDatabase();
  const updatedReport: DailyReportRecord = {
    ...report,
    updatedAt: new Date().toISOString(),
  };
  db.reports[report.reportDate] = updatedReport;
  db.activeReportDate = report.reportDate;
  saveDatabase(db);
  return db;
}

export function createNewDayReport(
  newDateStr: string,
  manualOpeningOverride?: number
): { db: LocalDatabaseSchema; report: DailyReportRecord } {
  const db = loadDatabase();
  const carried = getCarriedForwardBalance(newDateStr, db);
  const openingBalance = manualOpeningOverride !== undefined ? manualOpeningOverride : carried.openingBalance;

  const newReport = createBlankReport(newDateStr, openingBalance);

  if (carried.sourceDate && manualOpeningOverride === undefined) {
    newReport.auditLogs.push({
      timestamp: new Date().toLocaleTimeString('en-GB'),
      action: `Carried forward ₦${openingBalance.toLocaleString()} closing balance from ${carried.sourceDate}`,
      user: 'CARRIED_FORWARD_ENGINE',
    });
  }

  db.reports[newDateStr] = newReport;
  db.activeReportDate = newDateStr;
  saveDatabase(db);
  return { db, report: newReport };
}

export function deleteReportFromDatabase(dateStr: string): LocalDatabaseSchema {
  const db = loadDatabase();
  delete db.reports[dateStr];
  const remainingDates = Object.keys(db.reports).sort().reverse();
  if (remainingDates.length === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    db.reports[todayStr] = createBlankReport(todayStr, 0);
    db.activeReportDate = todayStr;
  } else if (!db.reports[db.activeReportDate]) {
    db.activeReportDate = remainingDates[0];
  }
  saveDatabase(db);
  return db;
}

export function exportDatabaseAsJSON(): void {
  const db = loadDatabase();
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NairaCash_DailyReports_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDatabaseFromJSON(jsonContent: string): LocalDatabaseSchema {
  const parsed = JSON.parse(jsonContent);
  if (!parsed || typeof parsed !== 'object' || !parsed.reports) {
    throw new Error('Invalid JSON schema: Missing reports object');
  }
  saveDatabase(parsed);
  return parsed;
}

/**
 * Creates the historical prompt case study (₦2,764,930 physical vs ₦4,900 Finacle)
 * strictly on demand when user requests to inspect or review that specific scenario.
 */
export function createPromptCaseStudyReport(dateStr: string = '2026-10-15'): DailyReportRecord {
  return {
    id: `report-${dateStr}`,
    reportDate: dateStr,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cashFlow: {
      reportDate: dateStr,
      reportTitle: 'End-of-Day Till Reconciliation & Cash Movement',
      shiftName: 'Full Day',
      openingBalance: 0,
      vaultOutAmount: 0,
      totalDeposit: 0,
      totalWithdrawal: 0,
      vaultInAmount: 0,
    },
    denominations: JSON.parse(JSON.stringify(PROMPT_SAMPLE_DENOMINATIONS)),
    auxiliary: {
      pcsBalance: 0,
      autoCalculatePcs: false,
      vaultInBalance: 0,
      autoCalculateVaultIn: false,
      vaultOutBalance: 0,
    },
    finacle: {
      ...INITIAL_FINACLE,
      balance: 4900,
      systemTimestamp: `${dateStr} 16:30:00 EOD`,
    },
    bundleSize: DEFAULT_BUNDLE_SIZE,
    packetSize: DEFAULT_PACKET_SIZE,
    adjustments: JSON.parse(JSON.stringify(SAMPLE_CASE_ADJUSTMENTS)),
    signOffs: JSON.parse(JSON.stringify(INITIAL_SIGNOFFS)),
    auditLogs: [
      {
        timestamp: '16:30:00',
        action: `Loaded prompt case study dataset for ${dateStr} (Total cash: ₦2,764,930.00 vs Finacle: ₦4,900.00)`,
        user: 'CASE_STUDY_LOADER',
      },
    ],
    status: 'draft',
  };
}
