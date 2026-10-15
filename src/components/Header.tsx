import React, { useRef } from 'react';
import { 
  Building2, 
  FileSpreadsheet, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Download,
  Upload,
  Database,
  Plus,
  BookOpen
} from 'lucide-react';
import { FinacleLedgerInfo } from '../types/reconciliation';

interface HeaderProps {
  finacle: FinacleLedgerInfo;
  reportDate: string;
  bundleSize: number;
  onBundleSizeChange: (size: number) => void;
  onClearDayCounts: () => void;
  onOpenCertificate: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onOpenNewDayModal: () => void;
  onLoadPromptCaseStudy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  finacle,
  reportDate,
  bundleSize,
  onBundleSizeChange,
  onClearDayCounts,
  onOpenCertificate,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onOpenNewDayModal,
  onLoadPromptCaseStudy,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Logo & System Meta */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  NairaCash Recon
                </h1>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
                  Daily Engine
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                  {reportDate}
                </span>
                <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {finacle.branchCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Daily Financial Reporting &amp; Automated Reconciliation Engine · Local JSON Storage
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Generate Report Primary */}
            <button
              type="button"
              onClick={onOpenNewDayModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md font-semibold shadow-xs transition-colors"
              title="Generate a new daily report with carried forward closing balance"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Day</span>
            </button>

            {/* Bundle size switcher (500 notes vs 1000 notes) */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Bundle:</span>
              <button
                type="button"
                onClick={() => onBundleSizeChange(500)}
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  bundleSize === 500 ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-700'
                }`}
                title="500 pieces per bundle (5 Packets) - CBN standard"
              >
                500
              </button>
              <button
                type="button"
                onClick={() => onBundleSizeChange(1000)}
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  bundleSize === 1000 ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-700'
                }`}
                title="1000 pieces per bundle (10 Packets)"
              >
                1000
              </button>
            </div>

            {/* Local JSON Storage Actions */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-md border border-slate-700">
              <span className="text-[10px] uppercase font-mono text-slate-400 px-1 flex items-center gap-1">
                <Database className="w-3 h-3 text-indigo-400" /> JSON:
              </span>
              <button
                type="button"
                onClick={onExportJSON}
                className="px-2 py-1 rounded hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 font-medium text-[11px]"
                title="Download local JSON database backup"
              >
                <Download className="w-3 h-3 text-indigo-400" />
                <span>Backup</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 font-medium text-[11px]"
                title="Restore from JSON database file"
              >
                <Upload className="w-3 h-3 text-emerald-400" />
                <span>Restore</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Print certificate */}
            <button
              type="button"
              onClick={onOpenCertificate}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md border border-slate-700 transition-colors font-medium"
              title="Print Bank Cash Balancing Certificate"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Voucher</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md border border-slate-700 transition-colors font-medium"
              title="Export daily report to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Clear Counts */}
            <button
              type="button"
              onClick={onClearDayCounts}
              className="flex items-center gap-1 bg-slate-800 hover:bg-rose-900/50 hover:border-rose-700 text-slate-300 hover:text-rose-200 px-2.5 py-1.5 rounded-md border border-slate-700 transition-colors"
              title="Reset all counting fields for this day to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zero Till</span>
            </button>

            {/* Optional Case Study Loader */}
            <button
              type="button"
              onClick={onLoadPromptCaseStudy}
              className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
              title="Load prompt case study dataset (₦2,764,930 physical vs ₦4,900 Finacle)"
            >
              <BookOpen className="w-3 h-3 text-indigo-400" />
              <span>Case Study</span>
            </button>
          </div>

        </div>

        {/* Sub-bar with Live Teller & Finacle Batch info */}
        <div className="py-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Finacle Core Live: <span className="text-slate-200 font-mono font-medium">{finacle.glAccountCode}</span>
            </span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">
              Teller: <span className="text-slate-200 font-medium">{finacle.tellerId}</span>
            </span>
            <span className="hidden lg:inline">·</span>
            <span className="hidden lg:inline">
              Batch: <span className="font-mono text-slate-300">{finacle.batchNumber}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real Calculated Figures · Local JSON Persistent Storage</span>
          </div>
        </div>

      </div>
    </header>
  );
};
