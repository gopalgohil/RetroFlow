'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  ThumbsUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui';
import { MemberAnalyticsItem, MemberStatusFilter } from './types';

interface AnalyticsMemberTableProps {
  members: MemberAnalyticsItem[];
}

export const AnalyticsMemberTable: React.FC<AnalyticsMemberTableProps> = ({ members }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentLimit, setCurrentLimit] = useState<number>(10);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Search query matching name, email, role
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Status pill filtering
      if (statusFilter === 'CONSISTENT') return m.status === 'Consistent' || m.status === ('Sprint Champion' as any);
      if (statusFilter === 'ACTIVE') return m.status === 'Active' || m.status === ('Active Contributor' as any);
      if (statusFilter === 'LOW') return m.status === 'Low Attendance' || m.status === ('Needs Nudge' as any);

      return true;
    });
  }, [members, searchQuery, statusFilter]);

  // Reset to page 1 whenever filters, search, or limit change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, currentLimit]);

  // Pagination calculations
  const totalItems = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
  const activePage = Math.min(currentPage, totalPages);
  const hasPrev = activePage > 1;
  const hasNext = activePage < totalPages;

  const startRange = totalItems === 0 ? 0 : (activePage - 1) * currentLimit + 1;
  const endRange = Math.min(activePage * currentLimit, totalItems);

  // Paginated members slice
  const paginatedMembers = useMemo(() => {
    const startIndex = (activePage - 1) * currentLimit;
    return filteredMembers.slice(startIndex, startIndex + currentLimit);
  }, [filteredMembers, activePage, currentLimit]);

  // Page numbers with ellipsis windowing
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (activePage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages];
  }, [totalPages, activePage]);

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    return {
      all: members.length,
      consistent: members.filter((m) => m.status === 'Consistent' || m.status === ('Sprint Champion' as any)).length,
      active: members.filter((m) => m.status === 'Active' || m.status === ('Active Contributor' as any)).length,
      low: members.filter((m) => m.status === 'Low Attendance' || m.status === ('Needs Nudge' as any)).length,
    };
  }, [members]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Team Member Participation Breakdown
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Individual attendance rates, card contributions, votes cast, and action item ownership.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white/[0.12] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-[#12151c] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.06]'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONSISTENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'CONSISTENT'
                ? 'bg-[#5cb028] text-white shadow-2xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black'
                : 'bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] hover:bg-[#def0d4] dark:hover:bg-[#88c958]/25 border border-transparent dark:border-[#88c958]/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Consistent ({statusCounts.consistent})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active ({statusCounts.active})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'LOW'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Attendance ({statusCounts.low})</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search member by name, email, or role..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#0e1015]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#12151c]/70 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-4 py-3.5">Project Role</th>
                <th className="px-5 py-3.5">Retro Attendance</th>
                <th className="px-4 py-3.5">Cards Shared</th>
                <th className="px-4 py-3.5">Votes Cast</th>
                <th className="px-4 py-3.5">Last Attended</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs font-medium">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((m) => (
                  <tr key={m.email} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Member Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={m.name} email={m.email} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{m.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-[#12151c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                        {m.role}
                      </span>
                    </td>

                    {/* Retro Attendance */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {m.retrosAttended} / {m.totalEligibleRetros}
                          </span>
                          <span
                            className={`font-bold ${
                              m.attendanceRate >= 85
                                ? 'text-[#3d8318] dark:text-[#88c958]'
                                : m.attendanceRate >= 60
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {m.attendanceRate}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              m.attendanceRate >= 85
                                ? 'bg-gradient-to-r from-[#88c958] to-[#6ea347]'
                                : m.attendanceRate >= 60
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, m.attendanceRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Cards Shared */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                        <MessageSquare className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                        <span>{m.cardsShared}</span>
                      </span>
                    </td>

                    {/* Votes Cast */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{m.votesCast}</span>
                      </span>
                    </td>

                    {/* Last Attended */}
                    <td className="px-4 py-3.5">
                      <div className="min-w-0 max-w-[160px]">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate" title={m.lastAttendedTitle}>
                          {m.lastAttendedTitle}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          {m.lastAttendedDate ? formatDate(m.lastAttendedDate) : 'No session record'}
                        </p>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          m.status === 'Consistent' || m.status === ('Sprint Champion' as any)
                            ? 'bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30'
                            : m.status === 'Active' || m.status === ('Active Contributor' as any)
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                        }`}
                      >
                        {(m.status === 'Consistent' || m.status === ('Sprint Champion' as any)) && (
                          <CheckCircle2 className="w-3 h-3 text-[#5cb028] dark:text-[#88c958]" />
                        )}
                        {(m.status === 'Active' || m.status === ('Active Contributor' as any)) && (
                          <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {(m.status === 'Low Attendance' || m.status === ('Needs Nudge' as any)) && (
                          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        )}
                        <span>
                          {m.status === ('Sprint Champion' as any)
                            ? 'Consistent'
                            : m.status === ('Active Contributor' as any)
                            ? 'Active'
                            : m.status === ('Needs Nudge' as any)
                            ? 'Low Attendance'
                            : m.status}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No team members matched your search or status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Enterprise Pagination Footer */}
        {totalItems > 0 && (
          <div className="p-4 sm:px-6 bg-slate-50/80 dark:bg-[#12151c]/70 border-t border-slate-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Left: Range & Limit Selector */}
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <span>
                Showing <strong className="text-slate-800 dark:text-slate-200">{startRange}</strong> to{' '}
                <strong className="text-slate-800 dark:text-slate-200">{endRange}</strong> of{' '}
                <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> contributors
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Rows:</span>
                <select
                  value={currentLimit}
                  onChange={(e) => setCurrentLimit(Number(e.target.value))}
                  className="px-2 py-1 bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12151c] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Page Number Pills */}
                {pageNumbers.map((p, idx) =>
                  typeof p === 'number' ? (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        p === activePage
                          ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black'
                          : 'bg-white dark:bg-[#12151c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-slate-400 dark:text-slate-500 font-bold"
                    >
                      ...
                    </span>
                  )
                )}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12151c] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsMemberTable;
