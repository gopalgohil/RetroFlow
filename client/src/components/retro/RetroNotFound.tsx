'use client';

import React, { memo } from 'react';
import Link from 'next/link';

export interface RetroNotFoundProps {
  error?: string | null;
  isFacilitator?: boolean;
}

export const RetroNotFound: React.FC<RetroNotFoundProps> = memo(function RetroNotFound({
  error,
  isFacilitator,
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 max-w-md shadow-xs">
        <h2 className="text-sm font-bold">Retrospective Not Found</h2>
        <p className="text-xs mt-1 text-rose-600">
          {error || 'Session does not exist or has expired.'}
        </p>
      </div>
      {isFacilitator && (
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          ← Back to Admin Dashboard
        </Link>
      )}
    </div>
  );
});

export default RetroNotFound;
