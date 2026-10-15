import { DenominationRow, AuxiliaryBalances, FinacleLedgerInfo, PendingAdjustment } from '../types/reconciliation';

export const DEFAULT_BUNDLE_SIZE = 500; // 500 pieces = 5 packets (CBN standard)
export const DEFAULT_PACKET_SIZE = 100; // 100 pieces = 1 packet

export function formatNaira(amount: number, showSign: boolean = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  // en-NG often formats as 'NGN 1,234.56' or '₦1,234.56'. Standardize to '₦1,234.56'
  const cleanStr = formatted.replace('NGN', '₦').trim();

  if (isNegative) {
    return `-₦${cleanStr.replace('₦', '')}`;
  }
  if (showSign && amount > 0) {
    return `+₦${cleanStr.replace('₦', '')}`;
  }
  return cleanStr;
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-NG').format(val);
}

export function calculateRowPieces(
  row: DenominationRow,
  bundleSize: number = DEFAULT_BUNDLE_SIZE,
  packetSize: number = DEFAULT_PACKET_SIZE
): number {
  const bundles = Math.max(0, Number(row.bundles) || 0);
  const packets = Math.max(0, Number(row.packets) || 0);
  const pieces = Math.max(0, Number(row.pieces) || 0);
  return bundles * bundleSize + packets * packetSize + pieces;
}

export function calculateRowTotal(
  row: DenominationRow,
  bundleSize: number = DEFAULT_BUNDLE_SIZE,
  packetSize: number = DEFAULT_PACKET_SIZE
): number {
  const totalPieces = calculateRowPieces(row, bundleSize, packetSize);
  return totalPieces * row.denomination;
}

export function calculateTotalCashBalance(
  denominations: DenominationRow[],
  auxiliary: AuxiliaryBalances,
  bundleSize: number = DEFAULT_BUNDLE_SIZE,
  packetSize: number = DEFAULT_PACKET_SIZE
): {
  denominationsTotal: number;
  totalPiecesCount: number;
  totalCashBalance: number;
  pcsBalance: number;
  vaultInBalance: number;
} {
  let denominationsTotal = 0;
  let totalPiecesCount = 0;

  for (const row of denominations) {
    const pieces = calculateRowPieces(row, bundleSize, packetSize);
    totalPiecesCount += pieces;
    denominationsTotal += pieces * row.denomination;
  }

  const pcsBalance = Math.max(0, Number(auxiliary.pcsBalance) || 0);
  const vaultInBalance = Math.max(0, Number(auxiliary.vaultInBalance) || 0);
  const totalCashBalance = denominationsTotal + pcsBalance + vaultInBalance;

  return {
    denominationsTotal,
    totalPiecesCount,
    totalCashBalance,
    pcsBalance,
    vaultInBalance,
  };
}

export function calculateRealtimeLoosePieces(
  denominations: DenominationRow[]
): { totalLoosePieces: number; totalLooseValue: number } {
  let totalLoosePieces = 0;
  let totalLooseValue = 0;

  for (const row of denominations) {
    const pieces = Math.max(0, Number(row.pieces) || 0);
    totalLoosePieces += pieces;
    totalLooseValue += pieces * row.denomination;
  }

  return { totalLoosePieces, totalLooseValue };
}

export function calculateRealtimeBundles(
  denominations: DenominationRow[],
  bundleSize: number = DEFAULT_BUNDLE_SIZE
): { totalBundles: number; totalBundlesValue: number } {
  let totalBundles = 0;
  let totalBundlesValue = 0;

  for (const row of denominations) {
    const bundles = Math.max(0, Number(row.bundles) || 0);
    totalBundles += bundles;
    totalBundlesValue += bundles * bundleSize * row.denomination;
  }

  return { totalBundles, totalBundlesValue };
}

export function calculateCashFlowClosing(cashFlow: {
  openingBalance: number;
  totalDeposit: number;
  totalWithdrawal: number;
  vaultOutAmount: number;
  vaultInAmount: number;
  otherInflows?: number;
  otherOutflows?: number;
}): {
  totalInflows: number;
  totalOutflows: number;
  netMovement: number;
  expectedClosingBalance: number;
} {
  const opening = Number(cashFlow.openingBalance) || 0;
  const deposits = Number(cashFlow.totalDeposit) || 0;
  const vaultIn = Number(cashFlow.vaultInAmount) || 0;
  const otherIn = Number(cashFlow.otherInflows) || 0;

  const withdrawals = Number(cashFlow.totalWithdrawal) || 0;
  const vaultOut = Number(cashFlow.vaultOutAmount) || 0;
  const otherOut = Number(cashFlow.otherOutflows) || 0;

  const totalInflows = deposits + vaultIn + otherIn;
  const totalOutflows = withdrawals + vaultOut + otherOut;
  const netMovement = totalInflows - totalOutflows;
  const expectedClosingBalance = opening + netMovement;

  return {
    totalInflows,
    totalOutflows,
    netMovement,
    expectedClosingBalance,
  };
}

export interface DiscrepancyReport {
  physicalCash: number;
  finacleBalance: number;
  rawDifference: number; // Finacle - Physical: -2,760,030.00
  varianceAmount: number; // Physical - Finacle: +2,760,030.00
  type: 'SURPLUS' | 'DEFICIT' | 'BALANCED';
  severity: 'CRITICAL' | 'WARNING' | 'BALANCED';
  severityColor: string;
  headline: string;
  explanation: string;
  percentageVariance: number;
  adjustedVariance: number;
  isAdjustedBalanced: boolean;
}

export function calculateDiscrepancy(
  physicalCash: number,
  finacle: FinacleLedgerInfo,
  adjustments: PendingAdjustment[] = []
): DiscrepancyReport {
  const finacleBalance = Number(finacle.balance) || 0;
  // Raw difference according to user's sheet: Finacle - Physical = -₦2,760,030.00
  const rawDifference = finacleBalance - physicalCash;
  // Physical vs Finacle
  const varianceAmount = physicalCash - finacleBalance;

  let type: 'SURPLUS' | 'DEFICIT' | 'BALANCED' = 'BALANCED';
  let severity: 'CRITICAL' | 'WARNING' | 'BALANCED' = 'BALANCED';
  let severityColor = 'emerald';
  let headline = 'Cash Till is Fully Reconciled';
  let explanation = 'Physical cash drawer precisely matches the Finacle core banking general ledger balance.';

  const absDiff = Math.abs(varianceAmount);

  if (absDiff < 0.01) {
    type = 'BALANCED';
    severity = 'BALANCED';
    severityColor = 'emerald';
  } else if (varianceAmount > 0) {
    type = 'SURPLUS';
    if (absDiff > 100000) {
      severity = 'CRITICAL';
      severityColor = 'rose';
      headline = 'Critical Cash Surplus (Overage Detected)';
      explanation = `Physical cash drawer contains ${formatNaira(absDiff)} MORE than recorded in Finacle GL. Indicates massive unposted customer deposits, unconfirmed vault receipts, or wrong till assignment.`;
    } else {
      severity = 'WARNING';
      severityColor = 'amber';
      headline = 'Cash Overage (Surplus)';
      explanation = `Physical cash exceeds Finacle ledger by ${formatNaira(absDiff)}. Minor teller overage or loose coin difference.`;
    }
  } else {
    type = 'DEFICIT';
    if (absDiff > 100000) {
      severity = 'CRITICAL';
      severityColor = 'rose';
      headline = 'Critical Cash Shortage (Deficit Alert)';
      explanation = `Physical cash drawer is SHORT by ${formatNaira(absDiff)} against Finacle GL. Immediate supervisor and internal control escalation required.`;
    } else {
      severity = 'WARNING';
      severityColor = 'amber';
      headline = 'Cash Shortage (Deficit)';
      explanation = `Physical cash is less than Finacle ledger by ${formatNaira(absDiff)}. Check for unposted withdrawal slips or sorting deductions.`;
    }
  }

  // Calculate percentage variance relative to Finacle or Physical
  const baseForPercentage = finacleBalance > 0 ? finacleBalance : physicalCash;
  const percentageVariance = baseForPercentage > 0 ? (absDiff / baseForPercentage) * 100 : 0;

  // Compute adjustments effect
  let adjustmentNet = 0;
  for (const adj of adjustments) {
    if (adj.type === 'credit') {
      adjustmentNet += adj.amount;
    } else {
      adjustmentNet -= adj.amount;
    }
  }

  // If Finacle has unposted credits added, adjusted variance shrinks
  const adjustedVariance = physicalCash - (finacleBalance + adjustmentNet);
  const isAdjustedBalanced = Math.abs(adjustedVariance) < 0.01;

  return {
    physicalCash,
    finacleBalance,
    rawDifference,
    varianceAmount,
    type,
    severity,
    severityColor,
    headline,
    explanation,
    percentageVariance,
    adjustedVariance,
    isAdjustedBalanced,
  };
}

// Blank denominations template for real user counting - all parameters default to 0
export const BLANK_DENOMINATIONS: DenominationRow[] = [
  {
    id: 'n1000',
    denomination: 1000,
    label: '₦1,000.00',
    color: 'text-indigo-700 dark:text-indigo-300',
    accentBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n500',
    denomination: 500,
    label: '₦500.00',
    color: 'text-sky-700 dark:text-sky-300',
    accentBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n200',
    denomination: 200,
    label: '₦200.00',
    color: 'text-teal-700 dark:text-teal-300',
    accentBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n100',
    denomination: 100,
    label: '₦100.00',
    color: 'text-purple-700 dark:text-purple-300',
    accentBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n50',
    denomination: 50,
    label: '₦50.00',
    color: 'text-blue-700 dark:text-blue-300',
    accentBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n20',
    denomination: 20,
    label: '₦20.00',
    color: 'text-emerald-700 dark:text-emerald-300',
    accentBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n10',
    denomination: 10,
    label: '₦10.00',
    color: 'text-amber-700 dark:text-amber-300',
    accentBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
  {
    id: 'n5',
    denomination: 5,
    label: '₦5.00',
    color: 'text-orange-700 dark:text-orange-300',
    accentBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    bundles: 0,
    packets: 0,
    pieces: 0,
  },
];

// Historical prompt case study dataset (available on-demand via Case Study button)
export const PROMPT_SAMPLE_DENOMINATIONS: DenominationRow[] = [
  { ...BLANK_DENOMINATIONS[0], bundles: 1, packets: 4, pieces: 1 },
  { ...BLANK_DENOMINATIONS[1], bundles: 4, packets: 2, pieces: 1 },
  { ...BLANK_DENOMINATIONS[2], bundles: 5, packets: 3, pieces: 5 },
  { ...BLANK_DENOMINATIONS[3], bundles: 1, packets: 2, pieces: 23 },
  { ...BLANK_DENOMINATIONS[4], bundles: 2, packets: 1, pieces: 2 },
  { ...BLANK_DENOMINATIONS[5], bundles: 5, packets: 4, pieces: 45 },
  { ...BLANK_DENOMINATIONS[6], bundles: 2, packets: 2, pieces: 12 },
  { ...BLANK_DENOMINATIONS[7], bundles: 1, packets: 3, pieces: 2 },
];

export const INITIAL_DENOMINATIONS: DenominationRow[] = BLANK_DENOMINATIONS;

export const INITIAL_AUXILIARY: AuxiliaryBalances = {
  pcsBalance: 0,
  autoCalculatePcs: false,
  vaultInBalance: 0,
  autoCalculateVaultIn: false,
  vaultOutBalance: 0,
};

export const INITIAL_FINACLE: FinacleLedgerInfo = {
  glAccountCode: 'GL-10101-042',
  glAccountName: 'BRANCH TELLER CASH TILL #04 - PRIMARY',
  balance: 0,
  tellerId: 'TLR_042',
  branchCode: '042-VI',
  branchName: 'Victoria Island Commercial Hub, Lagos',
  systemTimestamp: '2026-10-15 16:30:00 EOD',
  batchNumber: 'FIN-BCH-20261015-8841',
};

export const INITIAL_ADJUSTMENTS: PendingAdjustment[] = [];

export const SAMPLE_CASE_ADJUSTMENTS: PendingAdjustment[] = [
  {
    id: 'adj-1',
    description: 'Unposted Corporate Bulk Deposit (Dangote Dist. Cash Inflow slip #TX892)',
    type: 'credit',
    amount: 2750000,
    category: 'unposted_deposit',
    referenceNo: 'DEP-2026-99218',
    verified: false,
  },
  {
    id: 'adj-2',
    description: 'Vault Replenishment Batch #112 Pending Finacle CTM Approval',
    type: 'credit',
    amount: 10000,
    category: 'vault_in_transit',
    referenceNo: 'VLT-AUTH-4410',
    verified: false,
  },
  {
    id: 'adj-3',
    description: 'Teller Over-the-counter rounding excess from ₦20 & ₦10 note bundles',
    type: 'credit',
    amount: 30,
    category: 'other',
    referenceNo: 'OVR-TILL-042',
    verified: false,
  },
];

export const INITIAL_SIGNOFFS = [
  {
    role: 'teller' as const,
    name: '',
    title: 'Cash Teller',
    staffId: '',
    status: 'pending' as const,
    comments: '',
  },
  {
    role: 'head_of_operations' as const,
    name: '',
    title: 'Head of Cash Operations (HOP)',
    staffId: '',
    status: 'pending' as const,
    comments: '',
  },
  {
    role: 'internal_auditor' as const,
    name: '',
    title: 'Resident Internal Auditor',
    staffId: '',
    status: 'pending' as const,
    comments: '',
  },
];
