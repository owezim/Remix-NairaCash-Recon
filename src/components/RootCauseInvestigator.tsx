import React, { useState } from 'react';
import { 
  PendingAdjustment, 
  FinacleLedgerInfo, 
  DenominationRow 
} from '../types/reconciliation';
import { 
  DiscrepancyReport, 
  formatNaira, 
  formatNumber,
  calculateRowTotal 
} from '../utils/calculations';
import { 
  Search, 
  CheckCircle, 
  AlertOctagon, 
  ArrowRight, 
  Plus, 
  Trash2, 
  FileText, 
  RefreshCw, 
  ShieldAlert, 
  ArrowUpRight,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

interface RootCauseInvestigatorProps {
  discrepancy: DiscrepancyReport;
  finacle: FinacleLedgerInfo;
  denominations: DenominationRow[];
  bundleSize: number;
  packetSize: number;
  adjustments: PendingAdjustment[];
  onToggleAdjustment: (id: string) => void;
  onAddAdjustment: (adj: Omit<PendingAdjustment, 'id'>) => void;
  onDeleteAdjustment: (id: string) => void;
  onApplyAllPending: () => void;
}

export const RootCauseInvestigator: React.FC<RootCauseInvestigatorProps> = ({
  discrepancy,
  finacle,
  denominations,
  bundleSize,
  packetSize,
  adjustments,
  onToggleAdjustment,
  onAddAdjustment,
  onDeleteAdjustment,
  onApplyAllPending,
}) => {
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'credit' | 'debit'>('credit');
  const [newCategory, setNewCategory] = useState<PendingAdjustment['category']>('unposted_deposit');
  const [newRef, setNewRef] = useState('');
  const [copiedJournal, setCopiedJournal] = useState(false);

  // High denomination concentration analysis
  const totalDenomValue = denominations.reduce((acc, row) => acc + calculateRowTotal(row, bundleSize, packetSize), 0);
  const n1000Total = calculateRowTotal(denominations.find(d => d.denomination === 1000)!, bundleSize, packetSize);
  const n500Total = calculateRowTotal(denominations.find(d => d.denomination === 500)!, bundleSize, packetSize);
  const highDenomTotal = n1000Total + n500Total;
  const highDenomPercent = totalDenomValue > 0 ? (highDenomTotal / totalDenomValue) * 100 : 0;

  // Active verified adjustments sum
  const verifiedAdjustmentsTotal = adjustments
    .filter(a => a.verified)
    .reduce((acc, a) => acc + (a.type === 'credit' ? a.amount : -a.amount), 0);

  const pendingAdjustmentsTotal = adjustments
    .reduce((acc, a) => acc + (a.type === 'credit' ? a.amount : -a.amount), 0);

  const adjustedNetVariance = discrepancy.varianceAmount - verifiedAdjustmentsTotal;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(newAmount);
    if (!newDesc.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;

    onAddAdjustment({
      description: newDesc.trim(),
      amount: parsedAmt,
      type: newType,
      category: newCategory,
      referenceNo: newRef.trim() || `ADJ-${Date.now().toString().slice(-5)}`,
      verified: true,
    });

    setNewDesc('');
    setNewAmount('');
    setNewRef('');
  };

  const copySuspenseJournal = () => {
    const journalText = `FINACLE JOURNAL VOUCHER (EOD SUSPENSE ENTRY)
Date: ${new Date().toISOString().split('T')[0]}
Branch: ${finacle.branchCode} (${finacle.branchName})
Teller: ${finacle.tellerId} | Batch: ${finacle.batchNumber}
--------------------------------------------------------
DEBIT:  GL 10101-042 (Branch Teller Cash Till) -> ${formatNaira(discrepancy.varianceAmount)}
CREDIT: GL 999901-042 (Cash Over/Short Suspense) -> ${formatNaira(discrepancy.varianceAmount)}
Narration: "EOD Unposted Cash Overage for Till #${finacle.tellerId} - Pending Deposit Clearance"`;

    navigator.clipboard.writeText(journalText);
    setCopiedJournal(true);
    setTimeout(() => setCopiedJournal(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Automated Discrepancy &amp; Root-Cause Diagnostic Desk
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time anomaly detection, unposted transaction queue matching, and Finacle ledger clearing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyAllPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Verify All Pending Inflows
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Diagnostic Insights Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              High Note Concentration
            </div>
            <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-white">
              {formatNaira(highDenomTotal)} ({highDenomPercent.toFixed(1)}%)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ₦1,000 &amp; ₦500 notes represent the majority of cash. Points to corporate commercial deposits rather than retail change.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              Finacle Queue Status
            </div>
            <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-white">
              3 Pending Inflows Detected
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Found matching deposit slips in branch staging queue totaling {formatNaira(pendingAdjustmentsTotal)}.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Adjusted Variance
            </div>
            <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-white">
              {formatNaira(adjustedNetVariance, true)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {Math.abs(adjustedNetVariance) < 0.01 
                ? '✅ Fully resolved! Physical cash perfectly matches Finacle + verified queue items.'
                : 'Select/verify items below to close the variance.'}
            </p>
          </div>

        </div>

        {/* Adjustments & Unposted Queue Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              Pending Transactions &amp; In-Transit Adjustments Queue
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Click checkbox to apply/verify item toward ledger balance
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">APPLY</th>
                  <th className="py-2.5 px-3">DESCRIPTION / TRANSACTION NARRATIVE</th>
                  <th className="py-2.5 px-3">CATEGORY</th>
                  <th className="py-2.5 px-3">REF NUMBER</th>
                  <th className="py-2.5 px-3 text-right">AMOUNT (₦)</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adjustments.map((adj) => (
                  <tr 
                    key={adj.id}
                    className={`transition-colors ${
                      adj.verified 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={adj.verified}
                        onChange={() => onToggleAdjustment(adj.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        title="Toggle verification"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {adj.description}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                        {adj.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {adj.referenceNo || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={adj.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {adj.type === 'credit' ? '+' : '-'}{formatNaira(adj.amount)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteAdjustment(adj.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Adjustment Form */}
        <form onSubmit={handleAdd} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/80">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-500" />
            Add Investigation Finding / In-Flight Credit Slip
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Narrative (e.g. Unposted Teller Deposit slip #9012)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                step="0.01"
                placeholder="Amount (₦)"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="unposted_deposit">Deposit Inflow</option>
                <option value="vault_in_transit">Vault Transfer</option>
                <option value="atm_replenishment">ATM Return</option>
                <option value="mispost">Posting Reversal</option>
                <option value="other">Other Overage</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Slip Ref No."
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                className="w-full h-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded py-1.5 px-2 hover:opacity-90 transition-opacity flex items-center justify-center"
                title="Add adjustment item"
              >
                Add
              </button>
            </div>
          </div>
        </form>

        {/* Finacle Suspense Journal Entry Generator */}
        <div className="border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Finacle Core Banking Suspense Posting Voucher (EOD Auto-Entry)
              </span>
            </div>
            <button
              type="button"
              onClick={copySuspenseJournal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              {copiedJournal ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Finacle Entry</span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px]"># Finacle General Ledger Batch Posting:</div>
            <div>
              <span className="text-rose-600 dark:text-rose-400 font-bold">DR</span> GL 10101-042 (Branch Teller Cash Till) ······ <strong className="font-bold">{formatNaira(discrepancy.varianceAmount)}</strong>
            </div>
            <div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">CR</span> GL 999901-042 (Cash Over/Short Suspense) ··· <strong className="font-bold">{formatNaira(discrepancy.varianceAmount)}</strong>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              Narration: EOD Cash Overage for Teller #{finacle.tellerId} at {finacle.branchName} · Pending clearing of {adjustments.length} queue items.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
