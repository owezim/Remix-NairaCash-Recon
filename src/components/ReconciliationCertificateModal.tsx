import React from 'react';
import { 
  DenominationRow, 
  AuxiliaryBalances, 
  FinacleLedgerInfo, 
  SignOffRecord,
  DailyCashFlow
} from '../types/reconciliation';
import { 
  formatNaira, 
  formatNumber, 
  calculateRowPieces, 
  calculateRowTotal, 
  calculateCashFlowClosing,
  DiscrepancyReport 
} from '../utils/calculations';
import { 
  X, 
  Printer, 
  Building2, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle,
  Landmark 
} from 'lucide-react';

interface ReconciliationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportDate: string;
  cashFlow: DailyCashFlow;
  denominations: DenominationRow[];
  auxiliary: AuxiliaryBalances;
  finacle: FinacleLedgerInfo;
  discrepancy: DiscrepancyReport;
  bundleSize: number;
  packetSize: number;
  signOffs: SignOffRecord[];
}

export const ReconciliationCertificateModal: React.FC<ReconciliationCertificateModalProps> = ({
  isOpen,
  onClose,
  reportDate,
  cashFlow,
  denominations,
  auxiliary,
  finacle,
  discrepancy,
  bundleSize,
  packetSize,
  signOffs,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPiecesCount = denominations.reduce((acc, row) => {
    return acc + calculateRowPieces(row, bundleSize, packetSize);
  }, 0);

  const { netMovement, expectedClosingBalance } = calculateCashFlowClosing(cashFlow);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white text-slate-900 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden my-8">
        
        {/* Modal Top Bar (Hidden when printing) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              Daily Bank Cash Reconciliation Certificate · {reportDate}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Sheet */}
        <div className="p-8 sm:p-10 font-sans print:p-6" id="printable-certificate">
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-slate-800" />
                  Commercial Bank PLC · Nigeria
                </h1>
                <p className="text-xs text-slate-600 font-semibold tracking-wide mt-0.5">
                  FINACLE CASHIER TILL &amp; VAULT BALANCING CERTIFICATE (FORM EOD-104)
                </p>
              </div>
              <div className="text-right text-xs font-mono">
                <div className="font-bold text-slate-900">DATE: {reportDate}</div>
                <div className="text-slate-500">BATCH: {finacle.batchNumber}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">BRANCH:</span>
                <span className="font-bold">{finacle.branchName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">BRANCH CODE:</span>
                <span className="font-bold">{finacle.branchCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">GL ACCOUNT:</span>
                <span className="font-bold">{finacle.glAccountCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TELLER ID:</span>
                <span className="font-bold">{finacle.tellerId}</span>
              </div>
            </div>
          </div>

          {/* Daily Cash Movement Schedule */}
          <div className="mb-5 p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
              I. Daily Cash Movement &amp; Flow Ledger
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">OPENING BALANCE (B/F):</span>
                <span className="font-bold text-slate-900">{formatNaira(cashFlow.openingBalance)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 block">+ TOTAL DEPOSITS:</span>
                <span className="font-bold text-emerald-700">{formatNaira(cashFlow.totalDeposit)}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 block">- TOTAL WITHDRAWALS:</span>
                <span className="font-bold text-rose-700">{formatNaira(cashFlow.totalWithdrawal)}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-600 block">- VAULT OUT AMOUNT:</span>
                <span className="font-bold text-amber-700">{formatNaira(cashFlow.vaultOutAmount)}</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-500">Calculated Expected System Closing: <strong>{formatNaira(expectedClosingBalance)}</strong></span>
              <span className="text-slate-600">Net Daily Movement: <strong>{formatNaira(netMovement, true)}</strong></span>
            </div>
          </div>

          {/* Physical Cash Denomination Breakdown */}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
              II. Physical Banknote Count &amp; Denomination Schedule
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[11px] font-bold text-slate-600 bg-slate-50">
                  <th className="py-1.5 px-2 text-left">DENOMINATION</th>
                  <th className="py-1.5 px-2 text-center">BUNDLE ({bundleSize} pcs)</th>
                  <th className="py-1.5 px-2 text-center">PACKET ({packetSize} pcs)</th>
                  <th className="py-1.5 px-2 text-center">PIECES</th>
                  <th className="py-1.5 px-2 text-right">TOTAL PCS</th>
                  <th className="py-1.5 px-2 text-right">TOTAL AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {denominations.map((row) => {
                  const pieces = calculateRowPieces(row, bundleSize, packetSize);
                  const total = calculateRowTotal(row, bundleSize, packetSize);
                  return (
                    <tr key={row.id}>
                      <td className="py-1 px-2 font-mono font-bold">{row.label}</td>
                      <td className="py-1 px-2 text-center font-mono">{row.bundles}</td>
                      <td className="py-1 px-2 text-center font-mono">{row.packets}</td>
                      <td className="py-1 px-2 text-center font-mono">{row.pieces}</td>
                      <td className="py-1 px-2 text-right font-mono">{formatNumber(pieces)}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold">{formatNaira(total)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50">
                  <td colSpan={4} className="py-1 px-2 italic text-slate-600">pcs balance</td>
                  <td colSpan={2} className="py-1 px-2 text-right font-mono">{formatNaira(auxiliary.pcsBalance)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td colSpan={4} className="py-1 px-2 italic text-slate-600">vault-in balance</td>
                  <td colSpan={2} className="py-1 px-2 text-right font-mono">{formatNaira(auxiliary.vaultInBalance)}</td>
                </tr>
                <tr className="border-t-2 border-slate-900 font-bold bg-slate-100">
                  <td colSpan={4} className="py-1.5 px-2 uppercase">AVAILABLE BALANCE (Closing Balance for the day)</td>
                  <td className="py-1.5 px-2 text-right font-mono">{formatNumber(totalPiecesCount)} pcs</td>
                  <td className="py-1.5 px-2 text-right font-mono text-sm font-black">{formatNaira(discrepancy.physicalCash)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Finacle Ledger & Discrepancy Statement */}
          <div className="mb-5 p-3.5 rounded-lg border border-slate-300 bg-slate-50 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
              III. Core Banking Reconciliation &amp; Discrepancy Audit
            </h2>
            <div className="grid grid-cols-3 gap-4 font-mono text-center my-2">
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase">PHYSICAL CASH CLOSING</div>
                <div className="font-bold text-sm text-slate-900">{formatNaira(discrepancy.physicalCash)}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase">FINACLE SYSTEM GL</div>
                <div className="font-bold text-sm text-slate-900">{formatNaira(discrepancy.finacleBalance)}</div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase">AVAILABLE DIFFERENCE</div>
                <div className={`font-bold text-sm ${discrepancy.rawDifference < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {formatNaira(discrepancy.rawDifference)}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 font-sans mt-2">
              <strong>Audit Evaluation:</strong> {discrepancy.explanation}
            </div>
          </div>

          {/* Signatures */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
              IV. Dual-Control Attestation &amp; Signatures
            </h2>
            <div className="grid grid-cols-3 gap-4 text-xs font-sans">
              {signOffs.map((sign) => (
                <div key={sign.role} className="border border-slate-200 p-2.5 rounded bg-white flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{sign.title}</div>
                    <div className="text-[11px] text-slate-600">{sign.name} ({sign.staffId})</div>
                  </div>
                  <div className="mt-4 pt-1.5 border-t border-slate-300 flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold uppercase text-emerald-700">
                      {sign.status === 'signed' ? 'AUTHORIZED' : 'PENDING'}
                    </span>
                    <span className="text-slate-400">{sign.signedAt?.split(' ')[1] || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
            Generated via NairaCash Recon · Daily Reporting Engine · Stored in Local JSON
          </div>

        </div>

      </div>
    </div>
  );
};
