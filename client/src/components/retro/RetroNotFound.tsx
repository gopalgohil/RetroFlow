'use client';

import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';

export interface RetroNotFoundProps {
  error?: string | null;
  isFacilitator?: boolean;
}

export const RetroNotFound: React.FC<RetroNotFoundProps> = memo(function RetroNotFound({
  error,
}) {
  const [hasAccount, setHasAccount] = useState(false);

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
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 max-w-md shadow-xs">
        <h2 className="text-sm font-bold">Retrospective Not Found</h2>
        <p className="text-xs mt-1 text-rose-600 dark:text-rose-400">
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
