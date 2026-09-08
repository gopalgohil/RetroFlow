'use client';

import React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';

interface DashboardHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pendingApprovalsCount: number;
  onCreateClick: () => void;
  onOpenMobileMenu: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  pendingApprovalsCount,
  onCreateClick,
  onOpenMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4">
      {/* Mobile Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-900 leading-none">
            Retrospective Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure custom agile topics, process rules, and team access
          </p>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search sprints, topics, or templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Right Actions: Notifications & Primary CTA */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          title="Join Approvals Waiting Room"
          className="relative p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Primary CTA Button */}
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Custom Retro</span>
        </button>
      </div>
    </header>
  );
};
