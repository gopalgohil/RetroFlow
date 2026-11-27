'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  Share2,
  Edit3,
  Trash2,
  Users,
  Clock,
  MoreHorizontal,
  MessageSquare,
  Link2,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  X,
  FolderKanban,
} from 'lucide-react';
import { RetroBoard } from '@/types/retro';
import { formatRetroDateRange } from '@/lib/dateUtils';
import { useDebounce } from '@/hooks/useDebounce';
import { ShareInviteModal } from './ShareInviteModal';
import { SessionCardsSkeleton } from './DashboardSkeletons';

interface SessionListProps {
  sessions: RetroBoard[];
  onLaunch: (session: RetroBoard) => void;
  onEdit: (session: RetroBoard) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onToggleStatus?: (session: RetroBoard) => Promise<void>;
  onCreateNew: () => void;
  isLoading: boolean;
  isAdmin?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const ITEMS_PER_PAGE = 9;
const DAY_MS = 86400000;

// Auto-filled description that carries no information; hidden on cards.
const DEFAULT_DESCRIPTION_RE = /^continuous alignment session for engineering & product team/i;

const PROJECT_AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
];

const getProjectAvatarColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return PROJECT_AVATAR_COLORS[Math.abs(hash) % PROJECT_AVATAR_COLORS.length];
};

type TimeStatus = { label: string; className: string; dotClassName: string; rank: number };

// Time-based status shown on each card instead of a plain "ACTIVE" badge.
const getTimeStatus = (session: RetroBoard, now: number): TimeStatus => {
  if (session.status === 'completed') {
    return {
      label: 'Completed',
      className: 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]',
      dotClassName: 'bg-slate-400',
      rank: 4,
    };
  }
  if (session.status === 'draft') {
    return {
      label: 'Draft',
      className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      dotClassName: 'bg-amber-500',
      rank: 3,
    };
  }
  const start = session.startDate ? new Date(session.startDate).getTime() : NaN;
  if (!isNaN(start) && start > now) {
    const startLabel = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      label: `Upcoming · starts ${startLabel}`,
      className: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30',
      dotClassName: 'bg-sky-500',
      rank: 2,
    };
  }
  const end = session.endDate ? new Date(session.endDate).getTime() : NaN;
  if (!isNaN(end)) {
    const days = Math.ceil((end - now) / DAY_MS);
    if (days < 0) {
      return {
        label: 'Overdue',
        className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
        dotClassName: 'bg-rose-500',
        rank: 0,
      };
    }
    if (days === 0) {
      return {
        label: 'Ends today',
        className: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
        dotClassName: 'bg-rose-500 animate-pulse',
        rank: 0,
      };
    }
    if (days <= 3) {
      return {
        label: `Ends in ${days} ${days === 1 ? 'day' : 'days'}`,
        className: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        dotClassName: 'bg-amber-500 animate-pulse',
        rank: 1,
      };
    }
    return {
      label: `Live · ends in ${days} days`,
      className: 'bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border-[#cdeac0] dark:border-[#88c958]/30',
      dotClassName: 'bg-[#88c958] animate-pulse',
      rank: 1,
    };
  }
  return {
    label: 'Live',
    className: 'bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border-[#cdeac0] dark:border-[#88c958]/30',
    dotClassName: 'bg-[#88c958] animate-pulse',
    rank: 1,
  };
};

const formatRelativeTime = (dateStr: string | undefined, now: number) => {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return null;
  const mins = Math.max(0, Math.round((now - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onLaunch,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreateNew,
  isLoading,
  isAdmin = true,
  searchQuery = '',
  onSearchChange,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingSession, setInvitingSession] = useState<RetroBoard | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  // Close the card "more" menu on outside click or Escape.
  useEffect(() => {
    if (!openMenuId) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-session-menu]')) setOpenMenuId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);
  const prevPropSearchRef = useRef(searchQuery);

  useEffect(() => {
    if (prevPropSearchRef.current !== searchQuery) {
      prevPropSearchRef.current = searchQuery;
      if (searchQuery !== localSearch) {
        setLocalSearch(searchQuery);
      }
    }
  }, [searchQuery, localSearch]);

  useEffect(() => {
    if (!onSearchChange) return;
    const trimmed = debouncedSearch.trim();
    if (trimmed !== searchQuery) {
      prevPropSearchRef.current = trimmed;
      onSearchChange(trimmed);
      setCurrentPage(1);
    }
  }, [debouncedSearch, searchQuery, onSearchChange]);

  const handleClearSearch = () => {
    setLocalSearch('');
    prevPropSearchRef.current = '';
    if (onSearchChange && searchQuery !== '') {
      onSearchChange('');
      setCurrentPage(1);
    }
  };

  const keyToNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    sessions.forEach((s) => {
      if (s.description) {
        const match = s.description.match(
          /retrospective for\s+([^()]+?)(?:\s+\(([A-Za-z0-9_-]+)\))?(?:\.|$)/i
        );
        if (match && match[1] && match[2]) {
          map[match[2].toUpperCase()] = match[1].trim();
        }
      }
      if (typeof s.projectId === 'object' && (s.projectId as any)?.key && (s.projectId as any)?.name) {
        map[(s.projectId as any).key.toUpperCase()] = (s.projectId as any).name;
      }
      if (s.project?.key && s.project?.name) {
        map[s.project.key.toUpperCase()] = s.project.name;
      }
    });
    return map;
  }, [sessions]);

  const getSessionProjectName = React.useCallback(
    (s: RetroBoard): string => {
      if (typeof s.projectId === 'object' && (s.projectId as any)?.name) {
        return (s.projectId as any).name;
      }
      if (s.project?.name) {
        return s.project.name;
      }
      if (s.description) {
        const match = s.description.match(
          /retrospective for\s+([^()]+?)(?:\s+\(([A-Za-z0-9_-]+)\))?(?:\.|$)/i
        );
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      if (s.title && s.title.includes(' - ')) {
        const prefix = s.title.split(' - ')[0].trim();
        if (prefix && !prefix.toLowerCase().startsWith('sprint') && !prefix.toLowerCase().startsWith('retro')) {
          return prefix;
        }
      }
      if (s.projectKey && keyToNameMap[s.projectKey.toUpperCase()]) {
        return keyToNameMap[s.projectKey.toUpperCase()];
      }
      if (s.projectKey) {
        return s.projectKey;
      }
      return 'General';
    },
    [keyToNameMap]
  );

  const projectList = React.useMemo(() => {
    const countsMap = new Map<string, number>();
    sessions.forEach((s) => {
      const projName = getSessionProjectName(s);
      countsMap.set(projName, (countsMap.get(projName) || 0) + 1);
    });

    return Array.from(countsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions, getSessionProjectName]);

  const projectScopedSessions = React.useMemo(() => {
    if (selectedProject === 'all') return sessions;
    return sessions.filter((s) => {
      const projName = getSessionProjectName(s);
      return projName.toLowerCase() === selectedProject.toLowerCase();
    });
  }, [sessions, selectedProject, getSessionProjectName]);

  const filteredSessions = React.useMemo(() => {
    const endTime = (s: RetroBoard) => {
      const t = s.endDate ? new Date(s.endDate).getTime() : NaN;
      return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
    };
    return projectScopedSessions
      .filter((s) => {
        if (activeFilter === 'active' && s.status !== 'active') return false;
        if (activeFilter === 'completed' && s.status !== 'completed') return false;
        return true;
      })
      .sort((a, b) => {
        // Most urgent first: overdue / ending soon, then upcoming, then completed (latest first).
        const rankDiff = getTimeStatus(a, now).rank - getTimeStatus(b, now).rank;
        if (rankDiff !== 0) return rankDiff;
        if (a.status === 'completed') return endTime(b) - endTime(a);
        return endTime(a) - endTime(b);
      });
  }, [projectScopedSessions, activeFilter, now]);

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handleTabClick = (tabId: 'all' | 'active' | 'completed') => {
    if (tabId === activeFilter) return;
    setIsFilterLoading(true);
    setActiveFilter(tabId);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 280);
  };

  const handleProjectSelect = (projectName: string) => {
    setIsProjectDropdownOpen(false);
    if (projectName.toLowerCase() === selectedProject.toLowerCase()) return;
    setIsFilterLoading(true);
    setSelectedProject(projectName);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 280);
  };

  const handlePageChange = (newPage: number) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    if (target === safeCurrentPage || isPageLoading) return;
    setIsPageLoading(true);
    setCurrentPage(target);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 250);
  };

  const handleCopyLink = (shareToken: string) => {
    const inviteUrl = `${window.location.origin}/retro/${shareToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await onDelete(deletingId);
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isInitialLoading = isLoading && sessions.length === 0;
  const isSearchDebouncing = localSearch.trim() !== (searchQuery || '').trim();
  const isSearching = isSearchDebouncing || isLoading;
  const isCardsLoading = isInitialLoading || isFilterLoading || isPageLoading || isSearchDebouncing;

  const activeCount = React.useMemo(
    () => projectScopedSessions.filter((s) => s.status === 'active').length,
    [projectScopedSessions]
  );
  const completedCount = React.useMemo(
    () => projectScopedSessions.filter((s) => s.status === 'completed').length,
    [projectScopedSessions]
  );
  const allCount = projectScopedSessions.length;

  const tabs = [
    { id: 'active', label: 'Active Sessions', count: activeCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'all', label: 'All Sessions', count: allCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_12px_rgba(136,201,88,0.25)]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-extrabold transition-colors ${
                    isActive
                      ? 'bg-white/25 text-white dark:bg-[#08090a]/20 dark:text-[#08090a]'
                      : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0">
          <div className="relative w-full sm:w-56 md:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              )}
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by title, project, topic..."
              className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all shadow-2xs"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/[0.1] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {projectList.length > 0 && (
            <div className="relative shrink-0" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  selectedProject !== 'all'
                    ? 'bg-[#5cb028]/10 border-[#5cb028]/40 text-[#3d8318] dark:bg-[#88c958]/15 dark:border-[#88c958]/40 dark:text-[#88c958]'
                    : 'bg-slate-50 dark:bg-[#0e1015] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.16]'
                } shadow-2xs`}
              >
                <FolderKanban className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                <span className="max-w-[120px] truncate">
                  {selectedProject === 'all' ? 'All Projects' : selectedProject}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                    isProjectDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                    Filter by Project
                  </div>

                  <div className="border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                    <button
                      type="button"
                      onClick={() => handleProjectSelect('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        selectedProject === 'all'
                          ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {selectedProject === 'all' && (
                          <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                        )}
                        <span className={selectedProject === 'all' ? '' : 'pl-5.5'}>All Projects</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 rounded-full">
                        {sessions.length}
                      </span>
                    </button>
                  </div>

                  <div className="max-h-52 overflow-y-auto overscroll-contain py-0.5 [scrollbar-width:thin] scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    {projectList.map((proj) => {
                      const isSelected = selectedProject.toLowerCase() === proj.name.toLowerCase();
                      return (
                        <button
                          key={proj.name}
                          type="button"
                          onClick={() => handleProjectSelect(proj.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate pr-2">
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                            )}
                            <span className={`truncate ${isSelected ? '' : 'pl-5.5'}`}>{proj.name}</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 rounded-full shrink-0">
                            {proj.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {isInitialLoading ? (
        <div className="h-4 w-40 rounded bg-slate-200/80 dark:bg-white/[0.06] animate-pulse -mt-2" />
      ) : (
        <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
          {totalItems > ITEMS_PER_PAGE
            ? `Showing ${startIndex + 1}–${endIndex} of ${totalItems} retros`
            : `Showing ${totalItems} of ${projectScopedSessions.length} retros`}
          {activeFilter !== 'completed' && totalItems > 1 && (
            <span className="text-slate-400 dark:text-slate-500"> · sorted by ending soonest</span>
          )}
        </p>
      )}

      {isCardsLoading && (
        <SessionCardsSkeleton count={filteredSessions.length > 0 ? Math.min(filteredSessions.length, 6) : 6} />
      )}

      {!isCardsLoading && filteredSessions.length === 0 && (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0e1015] border border-dashed border-slate-300 dark:border-white/[0.08] text-center space-y-4 max-w-lg mx-auto shadow-xl animate-in fade-in duration-150">
          <div className="w-12 h-12 rounded-2xl bg-[#88c958]/15 border border-[#88c958]/30 text-[#88c958] mx-auto flex items-center justify-center font-black text-lg">
            {localSearch ? <Search className="w-5 h-5 text-[#5cb028] dark:text-[#88c958]" /> : 'RF'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {localSearch
                ? `No retrospectives match "${localSearch}"`
                : selectedProject !== 'all'
                ? `No ${activeFilter !== 'all' ? activeFilter : ''} retros found for project "${selectedProject}"`
                : isAdmin
                ? `No ${activeFilter} sessions found`
                : 'No retrospective sessions available'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {localSearch
                ? 'Try searching by a different sprint title, project key (e.g. DEM), description, or topic name.'
                : selectedProject !== 'all'
                ? 'Try switching to "All Projects" or selecting a different project above.'
                : isAdmin
                ? 'To create a sprint retrospective session, open your Project and navigate to the Retrospectives tab.'
                : 'You will see live sprint retrospectives here as soon as your Scrum Master or Admin invites you.'}
            </p>
          </div>
          {localSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Clear Search Query
            </button>
          ) : selectedProject !== 'all' ? (
            <button
              type="button"
              onClick={() => handleProjectSelect('all')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Show All Projects
            </button>
          ) : isAdmin ? (
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-sm transition-all cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black dark:shadow-md dark:shadow-[#88c958]/20"
            >
              <span>View Projects</span>
            </Link>
          ) : null}
        </div>
      )}

      {!isCardsLoading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5 2xl:gap-5">
          {paginatedSessions.map((session) => {
            const projectName = getSessionProjectName(session);
            const projectKey = (
              session.projectKey ||
              session.project?.key ||
              projectName ||
              'RF'
            )
              .slice(0, 3)
              .toUpperCase();
            const timeStatus = getTimeStatus(session, now);
            const cards = Array.isArray(session.cards) ? session.cards : [];
            const participantCount = new Set(
              cards.map((c) => (c.authorEmail || c.author || '').toLowerCase()).filter(Boolean)
            ).size;
            const lastActivity = formatRelativeTime(session.updatedAt, now);
            const showDescription = Boolean(
              session.description && !DEFAULT_DESCRIPTION_RE.test(session.description.trim())
            );
            const topicsList =
              session.topics && session.topics.length > 0
                ? session.topics
                : [
                    { title: 'What went well?', color: '#88c958' },
                    { title: 'What could be improved?', color: '#F43F5E' },
                    { title: 'Action Items', color: '#0EA5E9' },
                  ];
            const dotColorMap: Record<string, string> = {
              '#5cb028': 'bg-[#5cb028]',
              '#88c958': 'bg-[#88c958]',
              '#10B981': 'bg-emerald-500',
              '#F43F5E': 'bg-rose-500',
              '#0EA5E9': 'bg-sky-500',
              '#F59E0B': 'bg-amber-500',
              '#4F46E5': 'bg-indigo-500',
              '#8B5CF6': 'bg-purple-500',
              '#EC4899': 'bg-pink-500',
              '#06B6D4': 'bg-teal-500',
            };
            const isMenuOpen = openMenuId === session._id;

            return (
              <div
                key={session._id}
                className="group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] hover:border-[#88c958]/50 dark:hover:border-[#88c958]/60 hover:shadow-lg dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.8)] transition-all flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0" title={projectName}>
                    <span
                      className={`w-7 h-7 rounded-lg ${getProjectAvatarColor(projectName)} text-white text-[11px] font-black tracking-wide flex items-center justify-center shrink-0`}
                      aria-hidden="true"
                    >
                      {projectKey.slice(0, 2)}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {projectName}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 ${timeStatus.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${timeStatus.dotClassName}`} />
                    {timeStatus.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                    {session.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatRetroDateRange(
                        session.startDate,
                        session.endDate,
                        session.scheduledDate || session.createdAt
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
                    </span>
                    {lastActivity && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {lastActivity}
                      </span>
                    )}
                  </div>
                  {showDescription && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words leading-relaxed pt-1">
                      {session.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                  </span>
                  {topicsList.map((t: any, idx: number) => {
                    let dotColor = dotColorMap[t.color];
                    if (!dotColor) {
                      const titleLower = (t.title || '').toLowerCase();
                      if (/good|well|win|smile/.test(titleLower)) dotColor = 'bg-emerald-500';
                      else if (/improve|bad|frown|problem/.test(titleLower)) dotColor = 'bg-rose-500';
                      else if (/action|item|task|target/.test(titleLower)) dotColor = 'bg-sky-500';
                      else dotColor = ['bg-emerald-500', 'bg-rose-500', 'bg-sky-500', 'bg-purple-500'][idx % 4];
                    }
                    const cardCount = cards.filter(
                      (c) =>
                        (t.topicId && c.topicId === t.topicId) ||
                        (t.id && c.topicId === t.id) ||
                        (t.title && c.topicId?.toLowerCase() === t.title.toLowerCase())
                    ).length;

                    return (
                      <span
                        key={t.topicId || idx}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200"
                        title={`${t.title}: ${cardCount} ${cardCount === 1 ? 'card' : 'cards'}`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                        <span className="truncate max-w-[150px]">{t.title}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            cardCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {cardCount}
                        </span>
                      </span>
                    );
                  })}
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLaunch(session)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black"
                    >
                      <span>
                        {session.status === 'completed'
                          ? 'View Results'
                          : isAdmin
                          ? 'Open Board'
                          : 'Join Live Board'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Completed retros are read-only, so new invites are not offered. */}
                    {isAdmin && session.status !== 'completed' && (
                      <button
                        onClick={() => setInvitingSession(session)}
                        title="Invite teammates"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white dark:border-white/[0.08]"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Invite</span>
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="relative" data-session-menu>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(isMenuOpen ? null : session._id)}
                        aria-label="More actions"
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 bottom-full mb-1.5 w-52 rounded-xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                        >
                          {/* Completed (ended) retros are locked: editing is not allowed. */}
                          <button
                            type="button"
                            role="menuitem"
                            disabled={session.status === 'completed'}
                            aria-disabled={session.status === 'completed'}
                            title={
                              session.status === 'completed'
                                ? 'Completed retros cannot be edited'
                                : undefined
                            }
                            onClick={() => {
                              if (session.status === 'completed') return;
                              setOpenMenuId(null);
                              onEdit(session);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer disabled:cursor-not-allowed disabled:text-slate-400 dark:disabled:text-slate-500 disabled:hover:bg-transparent"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span className="flex-1 text-left">Edit topics & rules</span>
                            {session.status === 'completed' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500">
                                Disabled
                              </span>
                            )}
                          </button>
                          {session.status === 'completed' && session.shareToken && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleCopyLink(session.shareToken)}
                              title="Copy a link to view this retro's results"
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer"
                            >
                              {copiedToken === session.shareToken ? (
                                <>
                                  <Check className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
                                  <span className="text-[#3d8318] dark:text-[#88c958]">Link copied</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4" />
                                  Copy results link
                                </>
                              )}
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-100 dark:border-white/[0.06]" />
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeletingId(session._id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete retro
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="p-4 sm:px-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-white">{startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-white">{endIndex}</strong> of{' '}
            <strong className="text-slate-800 dark:text-white">{totalItems}</strong> Retros
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  p === safeCurrentPage
                    ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_10px_rgba(136,201,88,0.25)]'
                    : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <ShareInviteModal
        isOpen={Boolean(invitingSession)}
        onClose={() => setInvitingSession(null)}
        session={invitingSession}
      />

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Retrospective Session?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure? All sticky notes, votes, and discussion takeaways in this sprint will be permanently deleted.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
