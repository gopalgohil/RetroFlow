'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Sparkles,
  Filter,
  RefreshCw,
  Search,
  ArrowUpRight,
  Award,
  MessageSquare,
  ThumbsUp,
  CheckSquare,
  ChevronDown,
  FolderKanban,
  ShieldCheck,
  Flame,
  Info,
} from 'lucide-react';
import { api, ENDPOINTS } from '@/lib/api';
import { UserAvatar } from '@/components/ui';

interface ProjectOption {
  id: string;
  name: string;
  key: string;
  memberCount: number;
}

interface RetroTrendItem {
  id: string;
  shareToken: string;
  title: string;
  sprintName: string;
  date: string;
  attendeesCount: number;
  expectedCount: number;
  attendanceRate: number;
  cardsCount: number;
  actionItemsCount: number;
}

interface MemberAnalyticsItem {
  email: string;
  name: string;
  avatar: string;
  role: string;
  retrosAttended: number;
  totalEligibleRetros: number;
  attendanceRate: number;
  cardsShared: number;
  votesCast: number;
  actionItemsCount: number;
  lastAttendedTitle: string;
  lastAttendedDate: string | null;
  status: 'Sprint Champion' | 'Active Contributor' | 'Needs Nudge';
}

interface AnalyticsData {
  projects: ProjectOption[];
  selectedProjectId: string;
  selectedProjectName: string;
  summary: {
    averageAttendanceRate: number;
    totalRetros: number;
    totalMembers: number;
    lowAttendanceCount: number;
    topContributor: {
      name: string;
      email: string;
      avatar: string;
      role: string;
      retrosAttended: number;
      attendanceRate: number;
      cardsShared: number;
    } | null;
  };
  retroTrends: RetroTrendItem[];
  memberAnalytics: MemberAnalyticsItem[];
}

interface AnalyticsTabProps {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  user,
  isAdmin = false,
  isManager = false,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Table filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CHAMPION' | 'ACTIVE' | 'NUDGE'>('ALL');

  const fetchAnalytics = useCallback(async (projectId: string, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = ENDPOINTS.RETRO_ANALYTICS || '/retros/analytics';
      const res = await api.get(endpoint, {
        params: { projectId: projectId || 'all' },
      });

      if (res?.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      console.error('[AnalyticsTab] Error fetching analytics:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to load retrospective analytics';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedProjectId);
  }, [selectedProjectId, fetchAnalytics]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!data?.memberAnalytics) return [];
    return data.memberAnalytics.filter((m) => {
      // 1. Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter === 'CHAMPION') return m.status === 'Sprint Champion';
      if (statusFilter === 'ACTIVE') return m.status === 'Active Contributor';
      if (statusFilter === 'NUDGE') return m.status === 'Needs Nudge';

      return true;
    });
  }, [data?.memberAnalytics, searchQuery, statusFilter]);

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    const list = data?.memberAnalytics || [];
    return {
      all: list.length,
      champion: list.filter((m) => m.status === 'Sprint Champion').length,
      active: list.filter((m) => m.status === 'Active Contributor').length,
      nudge: list.filter((m) => m.status === 'Needs Nudge').length,
    };
  }, [data?.memberAnalytics]);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Project Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Retrospective Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
              Manager View
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Track team attendance rates, sprint participation quality, and feedback contribution across your agile retrospectives.
          </p>
        </div>

        {/* Project Selector & Refresh Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Multi-Project Filter Dropdown */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isLoading}
              title="Filter analytics by project"
              className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <option value="all">🌐 All Projects (Combined)</option>
              {data?.projects?.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.key}) • {proj.memberCount} members
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedProjectId, true)}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedProjectId)}
            className="text-xs font-bold underline hover:no-underline text-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/60" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/60" />
          <div className="h-96 rounded-3xl bg-slate-100/80 animate-pulse border border-slate-200/60" />
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* 2. Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Team Attendance Rate */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Avg. Attendance Rate
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {data.summary.averageAttendanceRate}%
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      data.summary.averageAttendanceRate >= 80
                        ? 'bg-emerald-100 text-emerald-700'
                        : data.summary.averageAttendanceRate >= 60
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {data.summary.averageAttendanceRate >= 80
                      ? 'Optimal'
                      : data.summary.averageAttendanceRate >= 60
                      ? 'Moderate'
                      : 'Low'}
                  </span>
                </div>
                {/* Visual Mini Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.summary.averageAttendanceRate >= 80
                        ? 'bg-emerald-500'
                        : data.summary.averageAttendanceRate >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, data.summary.averageAttendanceRate)}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Across {data.summary.totalRetros} retrospective sessions
              </p>
            </div>

            {/* Card 2: Total Retros Conducted */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Retros
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {data.summary.totalRetros}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Active in <span className="font-semibold text-slate-700">{data.selectedProjectName}</span>
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                {data.summary.totalMembers} active team members evaluated
              </p>
            </div>

            {/* Card 3: Sprint Champion / Top Contributor */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-white to-white border border-indigo-200/80 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  Sprint Champion
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  🏆 Top Impact
                </span>
              </div>
              {data.summary.topContributor ? (
                <div className="flex items-center gap-3 pt-0.5">
                  <UserAvatar
                    name={data.summary.topContributor.name}
                    email={data.summary.topContributor.email}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {data.summary.topContributor.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{data.summary.topContributor.attendanceRate}% Attendance</span>
                      <span>•</span>
                      <span>{data.summary.topContributor.cardsShared} Cards</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pt-2">No contributions recorded yet</p>
              )}
              <p className="text-[10px] text-indigo-600/80 font-medium">
                Highest feedback and continuous attendance
              </p>
            </div>

            {/* Card 4: Attendance Attention */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Attendance Nudge
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    data.summary.lowAttendanceCount > 0
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {data.summary.lowAttendanceCount > 0 ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {data.summary.lowAttendanceCount}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {data.summary.lowAttendanceCount > 0
                    ? 'Members with <60% attendance rate'
                    : 'All members consistently attending!'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                {data.summary.lowAttendanceCount > 0
                  ? 'Recommend scheduling 1-on-1 check-ins'
                  : 'Team retrospective engagement is strong'}
              </p>
            </div>
          </div>

          {/* 3. Sprint-by-Sprint Attendance Trend (Horizontal Scroll / Visual List) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Retrospective Session Trends
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {data.retroTrends.length} recent sessions
              </span>
            </div>

            {data.retroTrends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-1">
                {data.retroTrends.map((retro) => (
                  <div
                    key={retro.id}
                    className="p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/70 hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {retro.sprintName}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1.5" title={retro.title}>
                          {retro.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(retro.date)}</span>
                        </p>
                      </div>

                      <Link
                        href={`/retro/${retro.shareToken}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 cursor-pointer"
                        title="Open retro board"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Attendance Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">Turnout</span>
                        <span className="font-bold text-slate-800">
                          {retro.attendeesCount} / {retro.expectedCount} ({retro.attendanceRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            retro.attendanceRate >= 80
                              ? 'bg-emerald-500'
                              : retro.attendanceRate >= 60
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, retro.attendanceRate)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Metadata Badges */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{retro.cardsCount} cards</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{retro.actionItemsCount} action items</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 text-center space-y-2 border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  No retrospective sessions found for {data.selectedProjectName}.
                </p>
                <p className="text-[11px] text-slate-400">
                  Create a new retro session to begin capturing real-time attendance trends.
                </p>
              </div>
            )}
          </div>

          {/* 4. Member-by-Member Breakdown Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Team Member Participation Breakdown
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
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
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CHAMPION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'CHAMPION'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  🏆 Champions ({statusCounts.champion})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Active ({statusCounts.active})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('NUDGE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'NUDGE'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  ⚠️ Nudge ({statusCounts.nudge})
                </button>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member by name, email, or role..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Team Member</th>
                    <th className="px-4 py-3.5">Project Role</th>
                    <th className="px-5 py-3.5">Retro Attendance</th>
                    <th className="px-4 py-3.5">Cards Shared</th>
                    <th className="px-4 py-3.5">Votes Cast</th>
                    <th className="px-4 py-3.5">Last Attended</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr key={m.email} className="hover:bg-slate-50/80 transition-colors">
                        {/* Member Identity */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={m.name} email={m.email} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{m.name}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate">{m.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {m.role}
                          </span>
                        </td>

                        {/* Retro Attendance */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-1 min-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">
                                {m.retrosAttended} / {m.totalEligibleRetros}
                              </span>
                              <span
                                className={`font-bold ${
                                  m.attendanceRate >= 85
                                    ? 'text-indigo-600'
                                    : m.attendanceRate >= 60
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {m.attendanceRate}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  m.attendanceRate >= 85
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
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
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                            <MessageSquare className="w-3 h-3 text-indigo-500" />
                            <span>{m.cardsShared}</span>
                          </span>
                        </td>

                        {/* Votes Cast */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                            <ThumbsUp className="w-3 h-3 text-emerald-500" />
                            <span>{m.votesCast}</span>
                          </span>
                        </td>

                        {/* Last Attended */}
                        <td className="px-4 py-3.5">
                          <div className="min-w-0 max-w-[160px]">
                            <p className="text-[11px] font-semibold text-slate-800 truncate" title={m.lastAttendedTitle}>
                              {m.lastAttendedTitle}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {m.lastAttendedDate ? formatDate(m.lastAttendedDate) : 'No session record'}
                            </p>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              m.status === 'Sprint Champion'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : m.status === 'Active Contributor'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {m.status === 'Sprint Champion' && <Award className="w-3 h-3 text-indigo-600" />}
                            {m.status === 'Active Contributor' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {m.status === 'Needs Nudge' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            <span>{m.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                        No team members matched your search or status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
