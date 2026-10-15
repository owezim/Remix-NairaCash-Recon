import React, { useState } from 'react';
import { 
  DenominationRow, 
  AuxiliaryBalances, 
  FinacleLedgerInfo 
} from '../types/reconciliation';
import { 
  formatNaira, 
  formatNumber, 
  calculateRowPieces, 
  calculateRowTotal,
  calculateRealtimeLoosePieces,
  DEFAULT_BUNDLE_SIZE,
  DEFAULT_PACKET_SIZE
} from '../utils/calculations';
import { 
  Plus, 
  Minus, 
  Info, 
  Calculator, 
  Layers, 
  Coins, 
  AlertCircle,
  Sparkles,
  Check,
  Vault,
  Scale,
  ArrowRight
} from 'lucide-react';

interface DenominationTableProps {
  denominations: DenominationRow[];
  auxiliary: AuxiliaryBalances;
  finacle: FinacleLedgerInfo;
  bundleSize: number;
  packetSize: number;
  onDenominationChange: (id: string, field: 'bundles' | 'packets' | 'pieces', value: number) => void;
  onAuxiliaryChange: (field: keyof AuxiliaryBalances, value: any) => void;
  onFinacleBalanceChange: (val: number) => void;
  onResetRow: (id: string) => void;
}

export const DenominationTable: React.FC<DenominationTableProps> = ({
  denominations,
  auxiliary,
  finacle,
  bundleSize,
  packetSize,
  onDenominationChange,
  onAuxiliaryChange,
  onFinacleBalanceChange,
  onResetRow,
}) => {
  // Real-time calculation of loose pieces
  const { totalLoosePieces, totalLooseValue } = calculateRealtimeLoosePieces(denominations);

  // Calculate total denomination sum
  const totalDenomValue = denominations.reduce((acc, row) => {
    return acc + calculateRowTotal(row, bundleSize, packetSize);
  }, 0);

  const totalPiecesCount = denominations.reduce((acc, row) => {
    return acc + calculateRowPieces(row, bundleSize, packetSize);
  }, 0);

  // Physical Available Balance (Closing Balance for the day)
  const currentPcsBalance = Number(auxiliary.pcsBalance) || 0;
  const currentVaultInBalance = Number(auxiliary.vaultInBalance) || 0;
  
  const totalCashBalance = totalDenomValue + currentPcsBalance + currentVaultInBalance;
  const finacleBalance = Number(finacle.balance) || 0;
  
  // Available Balance Difference (Finacle - Cash)
  const difference = finacleBalance - totalCashBalance;

  // Real-time calculator helper: sync pcs balance to loose notes
  const handleApplyRealtimePcs = () => {
    onAuxiliaryChange('pcsBalance', totalLooseValue);
  };

  const handleClearPcs = () => {
    onAuxiliaryChange('pcsBalance', 0);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Table Header Section */}
      <div className="p-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Physical Cash Denomination Count Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time counting calculator: 1 Bundle = {bundleSize} notes · 1 Packet = {packetSize} notes · Live Loose Pieces
          </p>
        </div>

        {/* Real-time Calculator Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs font-mono">
            <Calculator className="w-3.5 h-3.5 text-indigo-500" />
            <span>Loose Notes: <strong>{totalLoosePieces} pcs ({formatNaira(totalLooseValue)})</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Total Notes: <strong>{formatNumber(totalPiecesCount)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono font-bold">
            <span>Till Cash: {formatNaira(totalDenomValue)}</span>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-4 w-36">DENOMINATION</th>
              <th className="py-3 px-3 text-center w-36">
                <span className="flex items-center justify-center gap-1">
                  BUNDLE
                  <span className="text-[10px] lowercase text-slate-400 font-normal">({bundleSize} pcs)</span>
                </span>
              </th>
              <th className="py-3 px-3 text-center w-36">
                <span className="flex items-center justify-center gap-1">
                  PACKET
                  <span className="text-[10px] lowercase text-slate-400 font-normal">({packetSize} pcs)</span>
                </span>
              </th>
              <th className="py-3 px-3 text-center w-36">
                <span className="flex items-center justify-center gap-1">
                  PIECES
                  <span className="text-[10px] lowercase text-slate-400 font-normal">(loose)</span>
                </span>
              </th>
              <th className="py-3 px-3 text-right w-24">TOTAL PCS</th>
              <th className="py-3 px-4 text-right w-44">TOTAL (₦)</th>
              <th className="py-3 px-4 text-right w-32">SHARE %</th>
              <th className="py-3 px-2 text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {denominations.map((row) => {
              const rowPieces = calculateRowPieces(row, bundleSize, packetSize);
              const rowTotal = calculateRowTotal(row, bundleSize, packetSize);
              const sharePercent = totalDenomValue > 0 ? (rowTotal / totalDenomValue) * 100 : 0;

              return (
                <tr 
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Denomination badge */}
                  <td className="py-3 px-4 font-mono font-bold text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-8 rounded-sm shrink-0 border ${row.accentBg}`} />
                      <div>
                        <div className={`font-mono font-bold text-slate-900 dark:text-white ${row.color}`}>
                          {row.label}
                        </div>
                        <div className="text-[10px] font-sans text-slate-400 font-normal">
                          CBN Legal Tender
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* BUNDLE Input */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onDenominationChange(row.id, 'bundles', Math.max(0, row.bundles - 1))}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                        title="Minus 1 bundle"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={row.bundles}
                        onChange={(e) => onDenominationChange(row.id, 'bundles', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-12 text-center font-mono font-semibold py-1 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:bg-indigo-50/50 dark:focus:bg-indigo-950/30"
                      />
                      <button
                        type="button"
                        onClick={() => onDenominationChange(row.id, 'bundles', row.bundles + 1)}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                        title="Plus 1 bundle"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* PACKET Input */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onDenominationChange(row.id, 'packets', Math.max(0, row.packets - 1))}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                        title="Minus 1 packet"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={row.packets}
                        onChange={(e) => onDenominationChange(row.id, 'packets', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-12 text-center font-mono font-semibold py-1 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:bg-indigo-50/50 dark:focus:bg-indigo-950/30"
                      />
                      <button
                        type="button"
                        onClick={() => onDenominationChange(row.id, 'packets', row.packets + 1)}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                        title="Plus 1 packet"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* PIECES Input */}
                  <td className="py-2.5 px-2 text-center">
                    <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onDenominationChange(row.id, 'pieces', Math.max(0, row.pieces - 1))}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                        title="Minus 1 piece"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={row.pieces}
                        onChange={(e) => onDenominationChange(row.id, 'pieces', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 text-center font-mono font-semibold py-1 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:bg-indigo-50/50 dark:focus:bg-indigo-950/30"
                      />
                      <button
                        type="button"
                        onClick={() => onDenominationChange(row.id, 'pieces', row.pieces + 1)}
                        className="px-2 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                        title="Plus 1 piece"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* TOTAL PIECES */}
                  <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatNumber(rowPieces)}
                  </td>

                  {/* ROW TOTAL (₦) */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {formatNaira(rowTotal)}
                  </td>

                  {/* SHARE % Progress Bar */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, sharePercent)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 w-10 text-right">
                        {sharePercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Quick Reset */}
                  <td className="py-3 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onResetRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-rose-500 transition-opacity px-1"
                      title="Clear this denomination count"
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* REAL-TIME CALCULATOR ROW: pcs balance */}
            <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
              <td colSpan={4} className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="italic font-bold text-slate-800 dark:text-slate-200">pcs balance</span>
                    <span className="text-slate-500 text-[11px] ml-1">(Loose Coins &amp; Change Tray / Auxiliary Drawer)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Loose notes in matrix:</span>
                    <strong className="font-mono text-indigo-600 dark:text-indigo-400">{formatNaira(totalLooseValue)}</strong>
                    <button
                      type="button"
                      onClick={handleApplyRealtimePcs}
                      className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold hover:bg-indigo-100 transition-colors"
                      title="Set pcs balance to match current loose pieces total"
                    >
                      Use ₦{totalLooseValue.toLocaleString()}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPcs}
                      className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                      title="Set pcs balance to ₦0.00"
                    >
                      ₦0.00
                    </button>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-400">
                {totalLoosePieces} pcs
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <span className="font-mono text-xs text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={auxiliary.pcsBalance}
                    onChange={(e) => onAuxiliaryChange('pcsBalance', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-32 text-right font-mono font-bold py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </td>
              <td colSpan={2} className="py-3 px-4 text-[11px] text-slate-400">
                Real-time calculated
              </td>
            </tr>

            {/* REAL-TIME CALCULATOR ROW: vault-in balance */}
            <tr className="bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
              <td colSpan={4} className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="italic font-bold text-slate-800 dark:text-slate-200">vault-in balance</span>
                    <span className="text-slate-500 text-[11px] ml-1">(In-Transit Cash from Central Vault / Replenishment)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Vault status:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Active Transit</span>
                    <button
                      type="button"
                      onClick={() => onAuxiliaryChange('vaultInBalance', 0)}
                      className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                    >
                      ₦0.00
                    </button>
                  </div>
                </div>
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-400">
                —
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <span className="font-mono text-xs text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={auxiliary.vaultInBalance}
                    onChange={(e) => onAuxiliaryChange('vaultInBalance', Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-32 text-right font-mono font-bold py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </td>
              <td colSpan={2} className="py-3 px-4 text-[11px] text-slate-400">
                Transit / Pre-auth
              </td>
            </tr>

            {/* REAL-TIME CALCULATOR: TOTAL CASH BALANCE */}
            <tr className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700">
              <td colSpan={4} className="py-3 px-4 text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                TOTAL CASH BALANCE (Counted Physical)
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                {formatNumber(totalPiecesCount)} pcs
              </td>
              <td className="py-3 px-4 text-right font-mono font-extrabold text-base text-emerald-700 dark:text-emerald-400">
                {formatNaira(totalCashBalance)}
              </td>
              <td colSpan={2} className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                100.0%
              </td>
            </tr>

            {/* REAL-TIME CALCULATOR: TOTAL FINACLE BALANCE */}
            <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
              <td colSpan={5} className="py-3 px-4 text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center justify-between">
                <span>TOTAL FINACLE BALANCE (General Ledger Book)</span>
                <span className="text-[11px] font-mono font-normal text-slate-500 lowercase">
                  (live core GL)
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="inline-flex items-center justify-end gap-1">
                  <span className="font-mono text-sm text-slate-500">₦</span>
                  <input
                    type="number"
                    step="0.01"
                    value={finacle.balance}
                    onChange={(e) => onFinacleBalanceChange(parseFloat(e.target.value) || 0)}
                    className="w-36 text-right font-mono font-extrabold text-sm py-1 px-2 rounded border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </td>
              <td colSpan={2} className="py-3 px-4 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                {finacle.glAccountCode}
              </td>
            </tr>

            {/* REAL-TIME CALCULATOR: AVAILABLE BALANCE (Closing Balance for the day) */}
            <tr className="bg-indigo-900 text-white font-extrabold border-t-2 border-indigo-950">
              <td colSpan={4} className="py-3.5 px-4 uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2">
                <Vault className="w-4 h-4 text-indigo-300" />
                <span>AVAILABLE BALANCE (Closing Balance for the day)</span>
                <span className="text-[11px] font-normal text-indigo-200 lowercase tracking-normal">
                  [Total Counted Physical Cash]
                </span>
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-indigo-200">
                {formatNumber(totalPiecesCount)} pcs
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-black text-lg text-emerald-300">
                {formatNaira(totalCashBalance)}
              </td>
              <td colSpan={2} className="py-3.5 px-4 text-right font-mono text-xs text-indigo-200">
                Actual Cash In Hand
              </td>
            </tr>

            {/* REAL-TIME CALCULATOR: AVAILABLE BALANCE (Difference / Discrepancy) */}
            <tr className={`font-extrabold border-t-2 ${
              Math.abs(difference) < 0.01 
                ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300' 
                : difference < 0 
                  ? 'bg-rose-100/80 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-300' 
                  : 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300'
            }`}>
              <td colSpan={5} className="py-4 px-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>AVAILABLE BALANCE (Difference)</span>
                <span className="text-xs font-normal lowercase tracking-normal">
                  [Finacle Balance − Total Cash Balance]
                </span>
              </td>
              <td className="py-4 px-4 text-right font-mono font-black text-lg">
                {formatNaira(difference)}
              </td>
              <td colSpan={2} className="py-4 px-4 font-mono text-xs text-right">
                {difference < 0 ? 'SURPLUS (+CASH)' : difference > 0 ? 'DEFICIT (-CASH)' : 'BALANCED'}
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* Quick Footnote / CBN Guide */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          Realtime Equation: Available Closing Balance = (Bundles × {bundleSize} + Packets × {packetSize} + Pieces) × Denom + pcs balance + vault-in balance
        </span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
          Live Recalculation Active
        </span>
      </div>

    </div>
  );
};
