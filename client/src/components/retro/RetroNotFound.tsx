'use client';

import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export interface RetroNotFoundProps {
  error?: string | null;
  isFacilitator?: boolean;
}

export const RetroNotFound: React.FC<RetroNotFoundProps> = memo(function RetroNotFound({
  error,
}) {
  const [hasAccount, setHasAccount] = useState(false);
  const isAccessDenied = Boolean(error && error.toLowerCase().includes('access denied'));

  useEffect(() => {
    try {
      const token = localStorage.getItem('retroflow_token');
      setHasAccount(Boolean(token && !token.startsWith('guest-token-')));
    } catch {
      setHasAccount(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090a] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-rose-200 dark:border-rose-900/60 text-slate-800 dark:text-slate-200 max-w-md shadow-lg space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-2xs">
          {isAccessDenied ? <ShieldAlert className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {isAccessDenied ? 'Access Denied (Invite Only)' : 'Retrospective Not Found'}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {error || 'Session does not exist or has expired.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasAccount ? (
          <>
            <Link
              href="/projects"
              className="px-4 py-2 rounded-xl bg-[#5cb028] text-white text-xs font-bold shadow-xs hover:bg-[#4e9921] transition-colors cursor-pointer dark:bg-[#88c958] dark:text-[#08090a] dark:hover:bg-[#76b846]"
            >
              ← Back to Projects
            </Link>
            <Link
              href="/dashboard?tab=sessions"
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-[#0e1015] text-white text-xs font-bold shadow-xs hover:bg-slate-800 dark:hover:bg-[#12151c] dark:border dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              ← Workspace Dashboard
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[#5cb028] text-white text-xs font-bold shadow-xs hover:bg-[#4e9921] transition-colors cursor-pointer dark:bg-[#88c958] dark:text-[#08090a] dark:hover:bg-[#76b846]"
          >
            ← Sign In to RetroFlow
          </Link>
        )}
      </div>
    </div>
  );
});

export default RetroNotFound;
