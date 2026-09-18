'use client';

import React from 'react';
import { Search, ChevronDown, RotateCcw } from 'lucide-react';

interface ActionItemsFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedProject: string;
  onProjectChange: (val: string) => void;
  projectOptions: Array<{ id: string; key: string; name: string }>;
  selectedPriority: string;
  onPriorityChange: (val: string) => void;
  sortBy: 'dueDate' | 'priority' | 'newest';
  onSortChange: (val: 'dueDate' | 'priority' | 'newest') => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  metrics: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export const ActionItemsFilters: React.FC<ActionItemsFiltersProps> = React.memo(({
  searchQuery,
  onSearchChange,
  selectedProject,
  onProjectChange,
  projectOptions,
  selectedPriority,
  onPriorityChange,
  sortBy,
  onSortChange,
  selectedStatus,
  onStatusChange,
  metrics,
  hasActiveFilters,
  onResetFilters,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search action items, retrospectives, projects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.16] focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Projects ({projectOptions.length > 0 ? projectOptions.length : 'All'})</option>
              {projectOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.16] focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.16] focus:outline-hidden cursor-pointer"
            >
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="newest">Sort: Newest First</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141720] transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs Strip */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/[0.08] overflow-x-auto">
        {[
          { id: 'all', label: 'All Items', count: metrics.total },
          { id: 'todo', label: 'To Do', count: metrics.todo },
          { id: 'in_progress', label: 'In Progress', count: metrics.inProgress },
          { id: 'done', label: 'Done', count: metrics.done },
        ].map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#12151c]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-white/25 text-white dark:bg-[#08090a]/20 dark:text-[#08090a]' : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

ActionItemsFilters.displayName = 'ActionItemsFilters';
