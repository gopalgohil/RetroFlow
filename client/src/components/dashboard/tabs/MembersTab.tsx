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
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TeamMember, PaginationMeta } from '@/types/retro';

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
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local search when external prop changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search query changes to trigger backend request
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery && onSearchChange) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

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
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Members List */}
        {isLoading && members.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading members from workspace...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {localSearch
              ? `No contributors found matching "${localSearch}". Try clearing search.`
              : 'No team members found. Whitelist developers using the input above.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 px-5 sm:px-6">
            {members.map((m) => (
              <div key={m.id || m.email} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                    {m.name ? m.name.charAt(0) : m.email.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {m.name || m.email}
                      {m.email === currentEmail && (
                        <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-lg">
                    {m.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      m.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {m.status}
                  </span>

                  {isAdmin && onRemoveMember && m.email !== currentEmail && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(m.email)}
                      title="Remove from Whitelist"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
    </div>
  );
};

export default MembersTab;
