'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProjectRetroLink } from '@/types/project';
import { UserAvatar } from '@/components/ui';
import { formatDateDMY } from '@/lib/dateUtils';

export interface OverviewRecentRetrosProps {
  retrospectives: ProjectRetroLink[];
  onViewAll: () => void;
}

/**
 * OverviewRecentRetros:
 * Quick sprint retrospectives summary list with link badges.
 */
export const OverviewRecentRetros: React.FC<OverviewRecentRetrosProps> = ({
  retrospectives = [],
  onViewAll,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sprint Retrospectives</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Continuous feedback loops for this team</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-[#88c958] hover:text-[#76b349] flex items-center gap-1 cursor-pointer"
        >
          <span>View All ({retrospectives.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2">
        {retrospectives.slice(0, 3).map((retro) => (
          <div
            key={retro.id}
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors"
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={retro.title} avatar="RF" size="md" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{retro.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>{formatDateDMY(retro.scheduledDate)}</span>
                  <span>•</span>
                  <span>{retro.cardsCount} cards</span>
                  <span>•</span>
                  <span className="text-[#88c958] font-semibold">
                    {retro.actionItemsCount} action items
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={`/retro/${retro.shareToken}`}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#141720] hover:bg-[#88c958]/15 dark:hover:bg-[#88c958]/20 border border-slate-200 dark:border-white/[0.08] hover:border-[#88c958]/40 dark:hover:border-[#88c958]/40 text-[#88c958] text-xs font-bold transition-all shadow-2xs"
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewRecentRetros;
