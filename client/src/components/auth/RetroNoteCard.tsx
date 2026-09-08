'use client';

import React from 'react';

export interface RetroNoteCardProps {
  categoryTitle: string;
  categoryVariant?: 'success' | 'danger' | 'warning';
  content: string;
  author: string;
  upvotes?: number;
  className?: string;
}

export const RetroNoteCard: React.FC<RetroNoteCardProps> = ({
  categoryTitle,
  categoryVariant = 'success',
  content,
  author,
  upvotes,
  className = '',
}) => {
  const dotColor = {
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
  }[categoryVariant];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Title with indicator dot */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span>{categoryTitle}</span>
      </div>

      {/* Note Body */}
      <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3.5 space-y-2 hover:border-slate-300 hover:shadow-sm transition-all">
        <p className="text-xs leading-relaxed text-slate-700 font-normal">
          {content}
        </p>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-medium">
            — {author}
          </span>
          {typeof upvotes === 'number' && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-semibold text-indigo-600 select-none">
              <span>👍</span>
              <span>{upvotes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
