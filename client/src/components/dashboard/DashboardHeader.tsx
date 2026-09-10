'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, Menu, Loader2, X } from 'lucide-react';
import { ProjectSwitcher } from '@/components/navigation/ProjectSwitcher';
import { useDebounce } from '@/hooks/useDebounce';

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pendingApprovalsCount: number;
  onCreateClick: () => void;
  onOpenMobileMenu: () => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  pendingApprovalsCount,
  onCreateClick,
  onOpenMobileMenu,
  isAdmin = true,
  isLoading = false,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 350);

  // Sync if external searchQuery changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // When debounced value changes, pass to parent
  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      setSearchQuery(debouncedSearch.trim());
    }
  }, [debouncedSearch, searchQuery, setSearchQuery]);

  const handleClear = () => {
    setLocalSearch('');
    setSearchQuery('');
  };

  const isSearching = localSearch !== debouncedSearch || (Boolean(searchQuery) && isLoading);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Mobile Hamburger + Project Switcher + Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Intuitive Project Switcher */}
        <ProjectSwitcher />

        <div className="hidden xl:block h-6 w-px bg-slate-200" />

        <div className="hidden xl:block">
          <h1 suppressHydrationWarning className="text-sm font-bold text-slate-900 leading-none">
            {isAdmin ? 'Retrospective Management' : 'Developer Workspace'}
          </h1>
          <p suppressHydrationWarning className="text-[11px] text-slate-500 mt-1">
            {isAdmin
              ? 'Configure custom agile topics, process rules, and team access'
              : 'Participate in agile sprint retrospectives and contribute live feedback'}
          </p>
        </div>
      </div>

      {/* Center Search Bar with 350ms Debounce & Status Spinner */}
      <div className="flex-1 max-w-md relative">
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
        ) : (
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        )}
        <input
          type="text"
          placeholder="Search sprints, topics, or templates..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
        {localSearch && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Actions: Notifications & Primary CTA */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          title={isAdmin ? 'Join Approvals Waiting Room' : 'Notifications'}
          className="relative p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {isAdmin && pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Primary CTA Button for Admin vs Live Indicator for Developer */}
        {isAdmin ? (
          <button
            suppressHydrationWarning
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Custom Retro</span>
          </button>
        ) : (
          <div suppressHydrationWarning className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Developer Space</span>
          </div>
        )}
      </div>
    </header>
  );
};
