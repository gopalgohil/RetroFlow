'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Calendar,
  User,
  ArrowUpDown,
  Sparkles,
  Check,
  AlertCircle,
  Tag,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';
import { RetroTrendItem } from './types';

interface AnalyticsRetroActionTableProps {
  retros: RetroTrendItem[];
  selectedYear?: number;
}

type RetroActionFilter = 'ALL' | 'COMPLETED' | 'PENDING' | 'NO_ITEMS';
type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'ITEMS_DESC' | 'RATE_DESC';

export const AnalyticsRetroActionTable: React.FC<AnalyticsRetroActionTableProps> = ({
  retros = [],
  selectedYear,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<RetroActionFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DATE_DESC');
  const [expandedRetroIds, setExpandedRetroIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentLimit, setCurrentLimit] = useState<number>(10);

  // Toggle accordion expansion for a retro row
  const toggleRowExpansion = (id: string) => {
    setExpandedRetroIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand / Collapse all
  const toggleExpandAll = () => {
    if (expandedRetroIds.size === filteredRetros.length) {
      setExpandedRetroIds(new Set());
    } else {
      setExpandedRetroIds(new Set(filteredRetros.map((r) => r.id)));
    }
  };

  // Filtered & Sorted retros list
  const filteredRetros = useMemo(() => {
    let result = retros.filter((r) => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        r.title.toLowerCase().includes(query) ||
        (r.sprintName && r.sprintName.toLowerCase().includes(query)) ||
        (r.projectKey && r.projectKey.toLowerCase().includes(query)) ||
        (r.projectName && r.projectName.toLowerCase().includes(query)) ||
        (r.actionItems &&
          r.actionItems.some(
            (item) =>
              item.text.toLowerCase().includes(query) ||
              (item.assignedToName && item.assignedToName.toLowerCase().includes(query))
          ));

      if (!matchesSearch) return false;

      // 2. Status Filter
      const total = r.totalTasks ?? r.actionItemsCount ?? 0;
      const completed = r.completedTasks ?? 0;
      const pending = r.pendingTasks ?? total - completed;

      if (statusFilter === 'COMPLETED') return total > 0 && completed === total;
      if (statusFilter === 'PENDING') return pending > 0;
      if (statusFilter === 'NO_ITEMS') return total === 0;

      return true;
    });

    // Sort result
    return result.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      const itemsA = a.totalTasks ?? a.actionItemsCount ?? 0;
      const itemsB = b.totalTasks ?? b.actionItemsCount ?? 0;
      const rateA = a.completionRate ?? 0;
      const rateB = b.completionRate ?? 0;

      switch (sortBy) {
        case 'DATE_ASC':
          return dateA - dateB;
        case 'ITEMS_DESC':
          return itemsB - itemsA || dateB - dateA;
        case 'RATE_DESC':
          return rateB - rateA || dateB - dateA;
        case 'DATE_DESC':
        default:
          return dateB - dateA;
      }
    });
  }, [retros, searchQuery, statusFilter, sortBy]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy, currentLimit]);

  // Pagination metrics
  const totalItems = filteredRetros.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / currentLimit));
  const activePage = Math.min(currentPage, totalPages);
  const hasPrev = activePage > 1;
  const hasNext = activePage < totalPages;

  const startRange = totalItems === 0 ? 0 : (activePage - 1) * currentLimit + 1;
  const endRange = Math.min(activePage * currentLimit, totalItems);

  const paginatedRetros = useMemo(() => {
    const startIdx = (activePage - 1) * currentLimit;
    return filteredRetros.slice(startIdx, startIdx + currentLimit);
  }, [filteredRetros, activePage, currentLimit]);

  // Status counts for filter pills
  const counts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    let noItems = 0;

    retros.forEach((r) => {
      const total = r.totalTasks ?? r.actionItemsCount ?? 0;
      const comp = r.completedTasks ?? 0;
      const pend = r.pendingTasks ?? total - comp;

      if (total === 0) noItems++;
      else if (comp === total) completed++;
      else if (pend > 0) pending++;
    });

    return {
      all: retros.length,
      completed,
      pending,
      noItems,
    };
  }, [retros]);

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

  const formatDateRange = (retro: RetroTrendItem) => {
    const startStr = retro.startDate || retro.date;
    const endStr = retro.endDate;

    if (startStr && endStr) {
      try {
        const d1 = new Date(startStr);
        const d2 = new Date(endStr);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
          const s1 = d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const s2 = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return `${s1} – ${s2}`;
        }
      } catch {}
    }
    return formatDate(startStr || retro.date);
  };

  return (
    <div className="bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl shadow-xs overflow-hidden">
      {/* 1. Table Header Bar & Filter Controls */}
      <div className="p-6 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Retrospectives & Action Item Deliverables
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
              {filteredRetros.length} Sessions
            </span>
          </div>

          {/* Search Box & Expand All */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search retro, action item, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5cb028]/30 focus:border-[#5cb028]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {filteredRetros.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="px-3 py-2 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-xs font-bold text-[#3d8318] dark:text-[#88c958] hover:bg-[#eaf5e3]/50 dark:hover:bg-[#88c958]/10 transition-colors cursor-pointer"
              >
                {expandedRetroIds.size === filteredRetros.length ? 'Collapse All' : 'Expand All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Retros & Action Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02] text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="py-3.5 pl-6 pr-4">Retrospective Session</th>
              <th className="py-3.5 px-4 text-center">Total Action Items</th>
              <th className="py-3.5 px-4 text-center">Completed (Done)</th>
              <th className="py-3.5 px-4 text-center">In Progress</th>
              <th className="py-3.5 px-4 text-center">Pending Items</th>
              <th className="py-3.5 px-4">Assignees</th>
              <th className="py-3.5 pl-4 pr-6 text-right">Drill-Down</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
            {paginatedRetros.length > 0 ? (
              paginatedRetros.map((retro) => {
                const actionItems = retro.actionItems || [];
                const completed = retro.completedTasks ?? actionItems.filter((i) => i.status === 'done').length;
                const inProgress = retro.inProgressTasks ?? actionItems.filter((i) => i.status === 'in_progress').length;
                const todo = retro.todoTasks ?? actionItems.filter((i) => i.status !== 'done' && i.status !== 'in_progress').length;
                const total = retro.totalTasks ?? retro.actionItemsCount ?? (completed + inProgress + todo);
                const isExpanded = expandedRetroIds.has(retro.id);
                const assignees = retro.assignees || [];

                return (
                  <React.Fragment key={retro.id}>
                    <tr
                      onClick={() => toggleRowExpansion(retro.id)}
                      className={`group hover:bg-[#eaf5e3]/30 dark:hover:bg-[#88c958]/5 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/70 dark:bg-white/[0.03]' : ''
                        }`}
                    >
                      {/* Column 1: Retro Title & Meta ("side retro ka name ayaga") */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-[#3d8318] dark:group-hover:text-[#88c958] transition-colors">
                              {retro.title}
                            </span>
                            {retro.projectKey && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
                                {retro.projectKey}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDateRange(retro)}
                            </span>
                            <span>•</span>
                            <span>{retro.sprintName || 'Sprint Cycle'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Total Action Items (Clean number badge, icon removed) */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200">
                          {total}
                        </span>
                      </td>

                      {/* Column 3: Completed (Done) Items */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black ${completed > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400'
                            }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{completed} Done</span>
                        </span>
                      </td>

                      {/* Column 4: In Progress Items */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black ${inProgress > 0
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400'
                            }`}
                        >
                          <CircleDot className="w-3.5 h-3.5 text-blue-500" />
                          <span>{inProgress} In Progress</span>
                        </span>
                      </td>

                      {/* Column 5: Pending (To Do) Items */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black ${todo > 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400'
                            }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{todo} Pending</span>
                        </span>
                      </td>

                      {/* Column 5: Assignees Stack */}
                      <td className="py-4 px-4">
                        {assignees.length > 0 ? (
                          <div className="flex items-center -space-x-2">
                            {assignees.slice(0, 4).map((user, uIdx) => (
                              <div
                                key={uIdx}
                                title={user.name}
                                className="w-6 h-6 rounded-full bg-[#5cb028] text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0e1015] shadow-xs cursor-default"
                              >
                                {user.avatar || user.name.slice(0, 2).toUpperCase()}
                              </div>
                            ))}
                            {assignees.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-[#0e1015]">
                                +{assignees.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Column 7: Expand Drill-down Button */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(retro.id);
                          }}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${isExpanded
                            ? 'bg-[#eaf5e3] dark:bg-[#88c958]/20 border-[#cdeac0] dark:border-[#88c958]/40 text-[#3d8318] dark:text-[#88c958]'
                            : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          title={isExpanded ? 'Collapse action items' : 'Expand action items'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Accordion: Detailed Action Items List for this Retro */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-white/[0.02]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
                                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                  Action Items Committed in {retro.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  ({actionItems.length} total)
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-slate-500">
                                {completed} Completed • {inProgress} In Progress • {todo} Pending
                              </span>
                            </div>

                            {actionItems.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                                {actionItems.map((item) => {
                                  const isDone = item.status === 'done';
                                  const isInProgress = item.status === 'in_progress';

                                  return (
                                    <div
                                      key={item.id}
                                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.12] transition-colors"
                                    >
                                      <div className="space-y-2 min-w-0 flex-1">
                                        <div className="flex items-start gap-2">
                                          {isDone ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                          ) : isInProgress ? (
                                            <CircleDot className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                          ) : (
                                            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                          )}
                                          <p
                                            className={`text-xs font-semibold leading-relaxed ${isDone
                                              ? 'text-slate-500 dark:text-slate-400 line-through'
                                              : 'text-slate-800 dark:text-slate-200'
                                              }`}
                                          >
                                            {item.text}
                                          </p>
                                        </div>

                                        {/* Dynamic Task Attribution: Given by (Manager) -> Assigned to (Member) */}
                                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pl-6 text-[10px]">
                                          {/* Given by (Dynamic Project Manager) */}
                                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/[0.08]">
                                            <ShieldCheck className="w-3 h-3 text-[#3d8318] dark:text-[#88c958]" />
                                            <span className="text-slate-400 font-normal">Given by:</span>
                                            <span>{item.managerName || retro.managerName || 'Project Manager'}</span>
                                          </span>

                                          <span className="text-slate-300 dark:text-white/20">→</span>

                                          {/* Assigned to (Team Member) */}
                                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.06]">
                                            <User className="w-3 h-3 text-blue-500" />
                                            <span className="text-slate-400 font-normal">Assigned to:</span>
                                            {item.assignedToName ? (
                                              <span className="text-slate-800 dark:text-slate-200">{item.assignedToName}</span>
                                            ) : (
                                              <span className="text-slate-400 italic font-normal">Unassigned</span>
                                            )}
                                          </span>

                                          {item.assignedDate && (
                                            <span className="text-slate-400">
                                              Assigned: {formatDate(item.assignedDate)}
                                            </span>
                                          )}

                                          {item.dueDate && (
                                            <>
                                              <span className="text-slate-300 dark:text-white/20">•</span>
                                              <span
                                                className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border text-[10px] ${
                                                  isDone
                                                    ? 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/[0.06]'
                                                    : new Date(item.dueDate).getTime() < new Date().setHours(0, 0, 0, 0)
                                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                                                }`}
                                              >
                                                <Calendar className="w-3 h-3 shrink-0" />
                                                <span>
                                                  Due: {formatDate(item.dueDate)}
                                                  {!isDone && new Date(item.dueDate).getTime() < new Date().setHours(0, 0, 0, 0)
                                                    ? ' (Overdue)'
                                                    : ''}
                                                </span>
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${isDone
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                          : isInProgress
                                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                          }`}
                                      >
                                        {isDone ? 'Done' : isInProgress ? 'In Progress' : 'To Do'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-4 text-center text-xs text-slate-400 italic">
                                No action items were created during this retrospective session.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No retrospective sessions found
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {searchQuery
                        ? `No results match your search "${searchQuery}". Try clearing filters.`
                        : 'No retrospectives available for the selected project and year.'}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                        }}
                        className="mt-2 text-xs font-bold text-[#3d8318] dark:text-[#88c958] underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-800 dark:text-white">{startRange}</strong> to{' '}
            <strong className="text-slate-800 dark:text-white">{endRange}</strong> of{' '}
            <strong className="text-slate-800 dark:text-white">{totalItems}</strong> retrospective sessions
          </span>
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/[0.08]">
            <span>Rows:</span>
            <select
              value={currentLimit}
              onChange={(e) => setCurrentLimit(Number(e.target.value))}
              aria-label="Rows per page"
              className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={5} className="dark:bg-[#12151c]">5 per page</option>
              <option value={10} className="dark:bg-[#12151c]">10 per page</option>
              <option value={20} className="dark:bg-[#12151c]">20 per page</option>
              <option value={50} className="dark:bg-[#12151c]">50 per page</option>
            </select>
          </div>
        </div>

        {/* Prev / Next controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              Page {activePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsRetroActionTable;
