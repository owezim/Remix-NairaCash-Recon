import React, { useState } from 'react';
import { SignOffRecord } from '../types/reconciliation';
import { 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  FileCheck2, 
  History, 
  MessageSquare,
  Lock
} from 'lucide-react';

interface AuditTrailAndSignoffProps {
  signOffs: SignOffRecord[];
  onToggleSignOff: (role: SignOffRecord['role'], status: 'signed' | 'pending', comments?: string) => void;
  auditLogs: { timestamp: string; action: string; user: string }[];
}

export const AuditTrailAndSignoff: React.FC<AuditTrailAndSignoffProps> = ({
  signOffs,
  onToggleSignOff,
  auditLogs,
}) => {
  const [activeCommentRole, setActiveCommentRole] = useState<SignOffRecord['role'] | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleSign = (role: SignOffRecord['role']) => {
    const current = signOffs.find(s => s.role === role);
    if (!current) return;

    if (current.status === 'signed') {
      onToggleSignOff(role, 'pending');
    } else {
      onToggleSignOff(
        role, 
        'signed', 
        commentText.trim() || `Authorized at ${new Date().toLocaleTimeString('en-GB')}`
      );
      setActiveCommentRole(null);
      setCommentText('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Sign-off Authorizations (2 cols on large) */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Dual-Control EOD Sign-Off &amp; Certification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Three-party mandatory sign-off for till balance discrepancies exceeding ₦100,000 threshold
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {signOffs.filter(s => s.status === 'signed').length}/3 Authorized
          </span>
        </div>

        <div className="space-y-3">
          {signOffs.map((record) => {
            const isSigned = record.status === 'signed';

            return (
              <div
                key={record.role}
                className={`p-3.5 rounded-lg border transition-all ${
                  isSigned
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isSigned
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isSigned ? <UserCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {record.name}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({record.staffId})
                        </span>
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          isSigned
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                            : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                        }`}>
                          {isSigned ? 'SIGNED' : 'AWAITING APPROVAL'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {record.title} · {record.signedAt || 'Pending physical count clearance'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSign(record.role)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-colors ${
                        isSigned
                          ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isSigned ? 'Revoke Signature' : 'Sign & Certify'}
                    </button>
                  </div>
                </div>

                {record.comments && (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/70 p-2 rounded border border-slate-200/60 dark:border-slate-800 flex items-start gap-1.5 font-mono text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{record.comments}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log / Event Stream */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Reconciliation Audit Trail
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Tamper-Evident</span>
          </div>

          <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {auditLogs.map((log, index) => (
              <div 
                key={index} 
                className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-0.5">
                  <span>{log.timestamp}</span>
                  <span className="text-slate-500 font-semibold">{log.user}</span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                  {log.action}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono">
            <Lock className="w-3 h-3 text-slate-500" /> 256-bit Ledger Hash
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Valid</span>
        </div>
      </div>

    </div>
  );
};
