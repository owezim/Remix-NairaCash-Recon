export interface DenominationRow {
  id: string;
  denomination: number; // e.g. 1000, 500, 200, 100, 50, 20, 10, 5
  label: string; // e.g. "₦1,000.00"
  color: string;
  accentBg: string;
  bundles: number; // 500 notes per bundle (or configurable)
  packets: number; // 100 notes per packet
  pieces: number;  // loose individual notes
  unfitPieces?: number; // damaged / mutilated notes
  notes?: string;
}

export interface AuxiliaryBalances {
  pcsBalance: number; // Loose coins / petty cash drawer / loose pieces value
  autoCalculatePcs: boolean; // Whether pcsBalance is auto-calculated from denomination loose pieces
  vaultInBalance: number; // In-transit vault transfer / sealed bundle intake
  autoCalculateVaultIn: boolean; // Auto-calculate from designated vault bundles
  vaultInBundles?: number; // Number of sealed bundles received from vault today
  vaultOutBalance: number; // Transferred to vault not yet debited
}

export interface DailyCashFlow {
  reportDate: string; // YYYY-MM-DD
  reportTitle: string; // e.g. "End-of-Day Till Reconciliation"
  shiftName: 'Morning' | 'Afternoon' | 'Full Day';
  openingBalance: number; // Cash Brought Forward at day opening
  vaultOutAmount: number; // Cash evacuated/transferred out to Main Vault
  totalDeposit: number; // Total cash deposits received over the counter
  totalWithdrawal: number; // Total cash withdrawals paid to customers
  vaultInAmount: number; // Additional cash received from Main Vault
  otherInflows?: number; // Inter-till receipts or fee collections
  otherOutflows?: number; // Sorting fees or ATM replenish
}

export interface FinacleLedgerInfo {
  glAccountCode: string;
  glAccountName: string;
  balance: number; // Current Finacle ledger balance
  tellerId: string;
  branchCode: string;
  branchName: string;
  systemTimestamp: string;
  batchNumber: string;
}

export interface PendingAdjustment {
  id: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  category: 'unposted_deposit' | 'vault_in_transit' | 'atm_replenishment' | 'mispost' | 'other';
  referenceNo?: string;
  verified: boolean;
}

export interface SignOffRecord {
  role: 'teller' | 'head_of_operations' | 'internal_auditor';
  name: string;
  title: string;
  staffId: string;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: string;
  comments?: string;
}

export interface DailyReportRecord {
  id: string;
  reportDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  cashFlow: DailyCashFlow;
  denominations: DenominationRow[];
  auxiliary: AuxiliaryBalances;
  finacle: FinacleLedgerInfo;
  bundleSize: number;
  packetSize: number;
  adjustments: PendingAdjustment[];
  signOffs: SignOffRecord[];
  auditLogs: { timestamp: string; action: string; user: string }[];
  status: 'draft' | 'verified' | 'audited';
}

export interface LocalDatabaseSchema {
  version: number;
  activeReportDate: string;
  reports: Record<string, DailyReportRecord>; // keyed by date YYYY-MM-DD
}
