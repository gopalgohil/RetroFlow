'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  ThumbsUp,
  Award,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui';
import { MemberAnalyticsItem, MemberStatusFilter } from './types';

interface AnalyticsMemberTableProps {
  members: MemberAnalyticsItem[];
}

export const AnalyticsMemberTable: React.FC<AnalyticsMemberTableProps> = ({ members }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>('ALL');

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
      if (statusFilter === 'CHAMPION') return m.status === 'Sprint Champion';
      if (statusFilter === 'ACTIVE') return m.status === 'Active Contributor';
      if (statusFilter === 'NUDGE') return m.status === 'Needs Nudge';

      return true;
    });
  }, [members, searchQuery, statusFilter]);

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    return {
      all: members.length,
      champion: members.filter((m) => m.status === 'Sprint Champion').length,
      active: members.filter((m) => m.status === 'Active Contributor').length,
      nudge: members.filter((m) => m.status === 'Needs Nudge').length,
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
    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#5cb028]" />
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
                ? 'bg-[#5cb028] text-white shadow-2xs'
                : 'bg-[#eaf5e3] text-[#3d8318] hover:bg-[#def0d4]'
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
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5cb028]/20 focus:border-[#5cb028] transition-all placeholder:text-slate-400"
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
                              ? 'text-[#3d8318]'
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
                              ? 'bg-gradient-to-r from-[#5cb028] to-[#4e9921]'
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
                      <MessageSquare className="w-3.5 h-3.5 text-[#5cb028]" />
                      <span>{m.cardsShared}</span>
                    </span>
                  </td>

                  {/* Votes Cast */}
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
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
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        m.status === 'Sprint Champion'
                          ? 'bg-[#eaf5e3] text-[#3d8318] border border-[#cdeac0]'
                          : m.status === 'Active Contributor'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {m.status === 'Sprint Champion' && <Award className="w-3 h-3 text-[#5cb028]" />}
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
  );
};

export default AnalyticsMemberTable;
