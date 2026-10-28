'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ExternalLink,
  Share2,
  Edit3,
  Trash2,
  Users,
  Clock,
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('active');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invitingSession, setInvitingSession] = useState<RetroBoard | null>(null);

  // Close project dropdown on outside click
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

  // Debounced Search state (300ms industry standard)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);
  const prevPropSearchRef = useRef(searchQuery);

  // Sync if external prop updates independently (e.g. cleared from outside)
  useEffect(() => {
    if (prevPropSearchRef.current !== searchQuery) {
      prevPropSearchRef.current = searchQuery;
      if (searchQuery !== localSearch) {
        setLocalSearch(searchQuery);
      }
    }
  }, [searchQuery, localSearch]);

  // Trigger backend search query on debounced value
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

  // Map project keys to full names when available
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

  // Helper to extract clean project name for a session
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

  // Distinct projects list with retro count
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

  // Status & Project Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    // 1. Status Filter
    if (activeFilter === 'active' && s.status !== 'active') return false;
    if (activeFilter === 'completed' && s.status !== 'completed') return false;
    if (activeFilter === 'upcoming') {
      const isUpcoming = new Date(s.scheduledDate) > new Date();
      if (!isUpcoming) return false;
    }

    // 2. Project Filter
    if (selectedProject !== 'all') {
      const projName = getSessionProjectName(s);
      if (projName.toLowerCase() !== selectedProject.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredSessions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handleTabClick = (tabId: 'all' | 'active' | 'upcoming' | 'completed') => {
    if (tabId === activeFilter) return;
    setIsFilterLoading(true);
    setActiveFilter(tabId);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 320);
  };

  const handleProjectSelect = (projectName: string) => {
    setIsProjectDropdownOpen(false);
    if (projectName.toLowerCase() === selectedProject.toLowerCase()) return;
    setIsFilterLoading(true);
    setSelectedProject(projectName);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 320);
  };

  const handlePageChange = (newPage: number) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    if (target === safeCurrentPage || isPageLoading) return;
    setIsPageLoading(true);
    setCurrentPage(target);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 300);
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

  const isSearchDebouncing = localSearch.trim() !== searchQuery.trim();
  const isSearching = isSearchDebouncing || isLoading;
  const isCardsLoading = (isLoading && sessions.length === 0) || isFilterLoading || isPageLoading || isSearchDebouncing;

  // Tab counts
  const activeCount = sessions.filter((s) => s.status === 'active').length;
  const upcomingCount = sessions.filter(
    (s) => new Date(s.scheduledDate) > new Date() && s.status !== 'completed'
  ).length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const allCount = sessions.length;

  const tabs = [
    { id: 'active', label: 'Active Sessions', count: activeCount },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'all', label: 'All Sessions', count: allCount },
  ];

  return (
    <div className="space-y-6">
      {/* Session Filter Tabs Bar with Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-3.5">
        {/* Left: Filter Pills with Dynamic Count Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_12px_rgba(136,201,88,0.25)]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold transition-colors ${
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

        {/* Right: Debounced Search Bar + Project Dropdown Filter + Total Counter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0">
          {/* 300ms Debounced Search Input */}
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
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all shadow-2xs"
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

          {/* Project Dropdown Filter (Right Side) */}
          {projectList.length > 0 && (
            <div className="relative shrink-0" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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

              {/* Dropdown Menu */}
              {isProjectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
                  {/* Fixed Header */}
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                    Filter by Project
                  </div>

                  {/* Pinned "All Projects" Option */}
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

                  {/* Scrollable Project Items List */}
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

          {isCardsLoading ? (
            <div className="h-4 w-24 rounded bg-slate-200/80 dark:bg-white/[0.06] animate-pulse hidden sm:block shrink-0" />
          ) : (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline-block shrink-0">
              {totalItems > ITEMS_PER_PAGE
                ? `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} Retros`
                : `Showing ${totalItems} of ${sessions.length} Retros`}
            </span>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isCardsLoading && (
        <SessionCardsSkeleton count={filteredSessions.length > 0 ? Math.min(filteredSessions.length, 6) : 6} />
      )}

      {/* Empty State */}
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

      {/* Sessions Grid */}
      {!isCardsLoading && filteredSessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-4.5 2xl:gap-5">
          {paginatedSessions.map((session) => (
            <div
              key={session._id}
              className="group relative p-3.5 sm:p-4.5 2xl:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] hover:border-[#88c958]/40 dark:hover:border-[#88c958]/60 hover:shadow-xl dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.8)] transition-all flex flex-col justify-between"
            >
              {/* Card Top Row: Status badge & Scheduled Date */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      session.status === 'active'
                        ? 'bg-[#88c958]/10 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30'
                        : session.status === 'completed'
                        ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        session.status === 'active' ? 'bg-[#88c958] animate-pulse shadow-[0_0_6px_rgba(136,201,88,0.8)]' : 'bg-slate-400'
                      }`}
                    />
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {formatDate(session.startDate || session.scheduledDate || session.createdAt)}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#88c958] transition-colors line-clamp-1">
                  {session.title}
                </h3>
                {session.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>
                )}
              </div>

              {/* Agenda Topics / Questions (Image Matching with Dynamic Card Counts) */}
              {(() => {
                const topicsList =
                  session.topics && session.topics.length > 0
                    ? session.topics
                    : [
                        { title: 'What went well?', color: '#88c958' },
                        { title: 'What could be improved?', color: '#F43F5E' },
                        { title: 'Action Items', color: '#0EA5E9' },
                      ];

                const colorMap: Record<string, { bg: string; text: string; border: string; badgeBg: string; badgeText: string }> = {
                  '#5cb028': { bg: 'bg-[#eaf5e3] dark:bg-[#88c958]/10', text: 'text-[#3d8318] dark:text-[#88c958]', border: 'border-[#cdeac0] dark:border-[#88c958]/30', badgeBg: 'bg-[#5cb028] dark:bg-[#88c958]', badgeText: 'text-white dark:text-[#08090a]' },
                  '#88c958': { bg: 'bg-[#eaf5e3] dark:bg-[#88c958]/10', text: 'text-[#3d8318] dark:text-[#88c958]', border: 'border-[#cdeac0] dark:border-[#88c958]/30', badgeBg: 'bg-[#5cb028] dark:bg-[#88c958]', badgeText: 'text-white dark:text-[#08090a]' },
                  '#10B981': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', badgeBg: 'bg-emerald-600 dark:bg-emerald-500', badgeText: 'text-white dark:text-[#08090a]' },
                  '#F43F5E': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-500/30', badgeBg: 'bg-rose-500', badgeText: 'text-white' },
                  '#0EA5E9': { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-500/30', badgeBg: 'bg-sky-500', badgeText: 'text-white' },
                  '#F59E0B': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', badgeBg: 'bg-amber-500', badgeText: 'text-white' },
                  '#4F46E5': { bg: 'bg-indigo-50 dark:bg-[#88c958]/10', text: 'text-indigo-700 dark:text-[#88c958]', border: 'border-indigo-200 dark:border-[#88c958]/30', badgeBg: 'bg-indigo-600 dark:bg-[#88c958]', badgeText: 'text-white dark:text-[#08090a]' },
                  '#8B5CF6': { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-500/30', badgeBg: 'bg-purple-500', badgeText: 'text-white' },
                  '#EC4899': { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-500/30', badgeBg: 'bg-pink-500', badgeText: 'text-white' },
                  '#06B6D4': { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-500/30', badgeBg: 'bg-teal-600 dark:bg-teal-500', badgeText: 'text-white dark:text-[#08090a]' },
                };

                return (
                  <div className="space-y-1.5 mb-3.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                      AGENDA TOPICS:
                    </p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                      {topicsList.map((t: any, idx: number) => {
                        let theme = colorMap[t.color];
                        if (!theme) {
                          const titleLower = (t.title || '').toLowerCase();
                          if (
                            titleLower.includes('good') ||
                            titleLower.includes('well') ||
                            titleLower.includes('win') ||
                            titleLower.includes('smile')
                          ) {
                            theme = colorMap['#10B981'];
                          } else if (
                            titleLower.includes('improve') ||
                            titleLower.includes('bad') ||
                            titleLower.includes('frown') ||
                            titleLower.includes('problem')
                          ) {
                            theme = colorMap['#F43F5E'];
                          } else if (
                            titleLower.includes('action') ||
                            titleLower.includes('item') ||
                            titleLower.includes('task') ||
                            titleLower.includes('target')
                          ) {
                            theme = colorMap['#0EA5E9'];
                          } else {
                            const fallbackColors = [
                              colorMap['#10B981'],
                              colorMap['#F43F5E'],
                              colorMap['#0EA5E9'],
                              colorMap['#8B5CF6'],
                            ];
                            theme = fallbackColors[idx % fallbackColors.length];
                          }
                        }

                        // Calculate dynamic card count for this topic
                        const cardCount = Array.isArray(session.cards)
                          ? session.cards.filter(
                              (c) =>
                                (t.topicId && c.topicId === t.topicId) ||
                                (t.id && c.topicId === t.id) ||
                                (t.title && c.topicId?.toLowerCase() === t.title.toLowerCase())
                            ).length
                          : 0;

                        return (
                          <span
                            key={t.topicId || idx}
                            className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[10.5px] 2xl:text-xs font-bold border transition-all inline-flex items-center gap-1 tracking-tight ${theme.bg} ${theme.text} ${theme.border}`}
                          >
                            <span>{t.title}</span>
                            <span
                              className={`inline-flex items-center justify-center min-w-[15px] h-[15px] px-0.5 rounded-full text-[8.5px] sm:text-[9px] 2xl:text-[10px] font-extrabold ${theme.badgeBg} ${theme.badgeText}`}
                            >
                              {cardCount}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}


              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-2">
                {/* Left: Launch / Join + Share */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLaunch(session)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_12px_rgba(136,201,88,0.25)]"
                  >
                    <span>{isAdmin ? 'Open Board' : 'Join Live Board'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => setInvitingSession(session)}
                      title="Invite Teammates & Developers"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer bg-[#eaf5e3] hover:bg-[#def0d4] text-[#3d8318] border-[#cdeac0] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white dark:border-white/[0.08]"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
                      <span>Share / Invite</span>
                    </button>
                  )}
                </div>

                {/* Right: Quick Action Buttons (Admin Only) */}
                {isAdmin && (
                  <div className="flex items-center gap-1">

                    <button
                      onClick={() => onEdit(session)}
                      title="Edit Topics & Rules"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingId(session._id)}
                      title="Delete Retrospective"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enterprise Pagination Controls Footer (Active when > 9 retros) */}
      {totalPages > 1 && (
        <div className="p-4 sm:px-6 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Range Info */}
          <div className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-white">{startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-white">{endIndex}</strong> of{' '}
            <strong className="text-slate-800 dark:text-white">{totalItems}</strong> Retros
          </div>

          {/* Right: Page Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Page Number Buttons */}
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

            {/* Next Button */}
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

      {/* Share / Invite Teammates Modal */}
      <ShareInviteModal
        isOpen={Boolean(invitingSession)}
        onClose={() => setInvitingSession(null)}
        session={invitingSession}
      />

      {/* Delete Confirmation Modal */}
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
