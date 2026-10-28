'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, RotateCcw, Check } from 'lucide-react';

interface ActionItemsFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedProject: string;
  onProjectChange: (val: string) => void;
  projectOptions: Array<{ id: string; key: string; name: string }>;
  selectedPriority: string;
  onPriorityChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  metrics: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  statusCounts?: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
  };
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const ActionItemsFilters: React.FC<ActionItemsFiltersProps> = React.memo(({
  searchQuery,
  onSearchChange,
  selectedProject,
  onProjectChange,
  projectOptions,
  selectedPriority,
  onPriorityChange,
  selectedStatus,
  onStatusChange,
  metrics,
  statusCounts,
  hasActiveFilters,
  onResetFilters,
}) => {
  const counts = statusCounts || metrics;

  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setIsPriorityOpen(false);
      }
    };
    if (isProjectOpen || isPriorityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectOpen, isPriorityOpen]);

  const selectedProjObj = projectOptions.find((p) => p.key === selectedProject);
  const projectLabel =
    selectedProject === 'all' || !selectedProjObj
      ? `All Projects (${projectOptions.length > 0 ? projectOptions.length : 'All'})`
      : `[${selectedProjObj.key}] ${selectedProjObj.name}`;

  const priorityLabel =
    PRIORITY_OPTIONS.find((p) => p.value === selectedPriority)?.label || 'All Priorities';

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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <div className="relative" ref={projectRef}>
            <button
              type="button"
              onClick={() => setIsProjectOpen((prev) => !prev)}
              className="inline-flex items-center justify-between gap-2 pl-3.5 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.16] focus:outline-hidden cursor-pointer"
            >
              <span className="max-w-[180px] truncate">{projectLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isProjectOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isProjectOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                  Filter by Project
                </div>
                <div className="max-h-56 overflow-y-auto py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onProjectChange('all');
                      setIsProjectOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                      selectedProject === 'all'
                        ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>All Projects</span>
                    {selectedProject === 'all' && (
                      <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                    )}
                  </button>
                  {projectOptions.map((p) => {
                    const isSelected = selectedProject === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          onProjectChange(p.key);
                          setIsProjectOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className="truncate pr-2">[{p.key}] {p.name}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Priority Filter */}
          <div className="relative" ref={priorityRef}>
            <button
              type="button"
              onClick={() => setIsPriorityOpen((prev) => !prev)}
              className="inline-flex items-center justify-between gap-2 pl-3.5 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.16] focus:outline-hidden cursor-pointer"
            >
              <span>{priorityLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isPriorityOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isPriorityOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                  Filter by Priority
                </div>
                <div className="py-0.5">
                  {PRIORITY_OPTIONS.map((item) => {
                    const isSelected = selectedPriority === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          onPriorityChange(item.value);
                          setIsPriorityOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#141720] transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs Strip */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.08] overflow-x-auto">
        {[
          { id: 'all', label: 'All Items', count: counts.total },
          { id: 'todo', label: 'To Do', count: counts.todo },
          { id: 'in_progress', label: 'In Progress', count: counts.inProgress },
          { id: 'done', label: 'Done', count: counts.done },
        ].map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#12151c]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-black ${
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
