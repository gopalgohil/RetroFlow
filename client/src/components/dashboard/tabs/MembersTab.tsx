'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Mail,
  Plus,
  UserCheck,
  RefreshCw,
  Trash2,
  Search,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  AlertTriangle,
} from 'lucide-react';
import { TeamMember, PaginationMeta } from '@/types/retro';
import { useDebounce } from '@/hooks/useDebounce';
import { UserAvatar, StatusPill } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';

interface MembersTabProps {
  members: TeamMember[];
  pagination?: PaginationMeta;
  currentPage?: number;
  currentLimit?: number;
  searchQuery?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onPageChange?: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  onSearchChange?: (newQuery: string) => void;
  onWhitelistAdded: (email: string) => Promise<void>;
  onRemoveMember?: (email: string) => Promise<void>;
  currentEmail?: string;
  isAdmin?: boolean;
}

/**
 * Enterprise-Grade MembersTab Component
 * Features:
 * - Server-side / Backend pagination with limit, page numbers, and item ranges
 * - Live server-side member search by name or email
 * - Per-page selector (5, 10, 20 items per page)
 * - Quick developer whitelisting and contributor status tags
 */
export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  pagination,
  currentPage = 1,
  currentLimit = 5,
  searchQuery = '',
  isLoading,
  onRefresh,
  onPageChange,
  onLimitChange,
  onSearchChange,
  onWhitelistAdded,
  onRemoveMember,
  currentEmail,
  isAdmin = true,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 350);

  // Sync local search when external prop changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search query changes to trigger backend request
  useEffect(() => {
    if (debouncedSearch !== searchQuery && onSearchChange) {
      onSearchChange(debouncedSearch.trim());
    }
  }, [debouncedSearch, searchQuery, onSearchChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    setIsSubmitting(true);
    try {
      await onWhitelistAdded(cleanEmail);
      setEmailInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  // Pagination calculations
  const totalItems = pagination?.totalItems ?? members.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / currentLimit));
  const activePage = pagination?.page ?? currentPage;
  const hasPrev = pagination?.hasPrevPage ?? activePage > 1;
  const hasNext = pagination?.hasNextPage ?? activePage < totalPages;

  const startRange = totalItems === 0 ? 0 : (activePage - 1) * currentLimit + 1;
  const endRange = Math.min(activePage * currentLimit, totalItems);

  // Generate page numbers for navigation (e.g. 1, 2, 3...)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {isAdmin ? 'Team Members & Whitelist Roster' : 'Team Directory'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Developer permissions, automatic whitelist bypass, and workspace collaborators'
              : 'Workspace teammates, collaborators, and active retrospective contributors'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Whitelist Quick Add Form Card (Admin Only) */}
      {isAdmin && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-white to-indigo-50/40 border border-emerald-100/80 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Instant Whitelist Access</h3>
              <p className="text-xs text-slate-500">
                Developers on this whitelist bypass facilitator waiting room approvals.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. developer@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !emailInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Whitelist Developer</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Members Roster List Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header with Counter and Search */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Registered & Whitelisted Members</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalItems} Total Contributor{totalItems !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Live Search Bar */}
          <div className="relative w-full sm:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              {isLoading || localSearch !== debouncedSearch ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5">Member Name</th>
                <th className="px-6 py-3.5">Assigned Projects</th>
                <th className="px-6 py-3.5">Project Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Activity</th>
                {isAdmin && (
                  <th className="px-6 py-3.5 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: currentLimit || 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200/80 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 bg-slate-200/80 rounded-md" />
                        <div className="h-2.5 w-16 bg-slate-100 rounded-md" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 bg-slate-100 rounded-lg" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 bg-slate-100 rounded-lg" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-14 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 w-12 bg-slate-100 rounded ml-auto" />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="h-7 w-16 bg-slate-100 rounded-xl ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="py-12 text-center text-slate-400 text-xs"
                  >
                    {localSearch
                      ? `No contributors found matching "${localSearch}". Try clearing search.`
                      : 'No team members found. Whitelist developers using the input above.'}
                  </td>
                </tr>
              ) : (
                members.map((m, index) => {
                  const isLeadOrAdmin =
                    m.isPrimaryLead ||
                    m.role?.toLowerCase().includes('admin') ||
                    m.projectRole?.toLowerCase().includes('lead');

                  return (
                    <tr key={m.id || m.email} className="hover:bg-slate-50/50 transition-colors">
                      {/* 1. Member Name (with avatar & online status) */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <UserAvatar
                          name={m.name || m.email}
                          avatar={m.avatar}
                          size="md"
                          status="online"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{m.name || m.email}</p>
                            {m.email === currentEmail && (
                              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                          {isLeadOrAdmin ? (
                            <span className="text-[10px] text-indigo-600 font-semibold">
                              Project Lead
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Team Member
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Assigned Projects (NO EMAIL COLUMN - Replaced with Project Count & Themed Hover Popover) */}
                      <td className="px-6 py-4">
                        {typeof m.projectsCount === 'number' && m.projectsCount > 0 ? (
                          <div className="relative group inline-block hover:z-50">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs group-hover:bg-indigo-100/90 group-hover:border-indigo-300 group-hover:shadow-xs transition-all cursor-pointer select-none">
                              <FolderKanban className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{m.projectsCount} {m.projectsCount === 1 ? 'Project' : 'Projects'}</span>
                            </span>

                            {/* RetroFlow Themed Floating Popover */}
                            <div
                              className={`absolute left-0 ${
                                index >= 2 ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
                              } z-50 w-64 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl shadow-indigo-950/15 p-3.5 pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out`}
                            >
                              {/* Popover Header */}
                              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                    <FolderKanban className="w-3 h-3" />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-900 tracking-tight">
                                    Assigned Projects
                                  </span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                  {m.projectsCount}
                                </span>
                              </div>

                              {/* Project List */}
                              <div className="pt-2 space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                                {m.projectNames && m.projectNames.length > 0 ? (
                                  m.projectNames.map((pName, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50/90 hover:bg-indigo-50/50 border border-slate-200/70 transition-colors"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                      <span className="text-xs font-semibold text-slate-800 truncate">
                                        {pName}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic py-1">
                                    No assigned projects
                                  </p>
                                )}
                              </div>

                              {/* Caret Arrow */}
                              {index >= 2 ? (
                                <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
                              ) : (
                                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-slate-200/90 rotate-45" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                            0 Projects
                          </span>
                        )}
                      </td>

                      {/* 3. Project Role */}
                      <td className="px-6 py-4">
                        <StatusPill status={m.projectRole || m.role || 'Developer'} />
                      </td>

                      {/* 4. Status */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      {/* 5. Activity */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-400 text-[11px] font-mono">Synced</span>
                      </td>

                      {/* 6. Actions */}
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          {isLeadOrAdmin || m.email === currentEmail ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 select-none"
                              title="Designated Project Lead cannot be removed"
                            >
                              Primary Lead
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setMemberToRemove(m)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                              title={`Remove ${m.name || m.email} from whitelist`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
                              <span>Remove</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Enterprise Backend Pagination Footer */}
        {totalItems > 0 && (
          <div className="p-4 sm:px-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Left: Range & Limit Selector */}
            <div className="flex items-center gap-3 text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{startRange}</strong> to{' '}
                <strong className="text-slate-800">{endRange}</strong> of{' '}
                <strong className="text-slate-800">{totalItems}</strong> contributors
              </span>

              {onLimitChange && (
                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                  <span className="text-[11px] text-slate-400">Rows:</span>
                  <select
                    value={currentLimit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                  </select>
                </div>
              )}
            </div>

            {/* Right: Page Navigation Controls */}
            {totalPages > 1 && onPageChange && (
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => onPageChange(activePage - 1)}
                  disabled={!hasPrev || isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Page Number Pills */}
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    disabled={isLoading}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      p === activePage
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => onPageChange(activePage + 1)}
                  disabled={!hasNext || isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <Modal
          isOpen={!!memberToRemove}
          onClose={() => {
            if (!isRemoving) setMemberToRemove(null);
          }}
          title="Remove Contributor?"
          description="Revoke workspace access and project assignments"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={async () => {
                  if (!memberToRemove || !onRemoveMember) return;
                  try {
                    setIsRemoving(true);
                    await onRemoveMember(memberToRemove.email);
                    setMemberToRemove(null);
                  } finally {
                    setIsRemoving(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isRemoving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isRemoving ? 'Removing...' : 'Remove Member'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Workspace Removal</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800">
                Are you sure you want to remove <strong>{memberToRemove.name || memberToRemove.email}</strong> ({memberToRemove.email})?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar name={memberToRemove.name || memberToRemove.email} avatar={memberToRemove.avatar} size="md" />
                <div>
                  <p className="font-bold text-slate-900">{memberToRemove.name || memberToRemove.email}</p>
                  <p className="text-[11px] text-slate-500">{memberToRemove.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {typeof memberToRemove.projectsCount === 'number' && memberToRemove.projectsCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    <FolderKanban className="w-3 h-3 text-indigo-600" />
                    <span>{memberToRemove.projectsCount} {memberToRemove.projectsCount === 1 ? 'Project' : 'Projects'}</span>
                  </span>
                )}
                <StatusPill status={memberToRemove.projectRole || memberToRemove.role || 'Developer'} />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Once removed, this contributor will immediately lose access to all assigned projects, retrospective sessions, and workspace whitelist privileges.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MembersTab;
