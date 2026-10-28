'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, FolderKanban, ChevronDown, RefreshCw, CalendarDays, Check } from 'lucide-react';
import { ProjectOption } from './types';

interface AnalyticsHeaderProps {
  projects: ProjectOption[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  availableYears?: number[];
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isAdmin?: boolean;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  availableYears = [new Date().getFullYear()],
  selectedYear = new Date().getFullYear(),
  onYearChange,
  onRefresh,
  isLoading,
  isRefreshing,
  isAdmin = false,
}) => {
  const hasNoProjects = !isAdmin && (!projects || projects.length === 0);

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setIsYearDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen || isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen, isYearDropdownOpen]);

  const selectedProj = projects?.find((p) => p.id === selectedProjectId);
  const selectedProjectLabel = hasNoProjects
    ? 'No Assigned Projects'
    : selectedProjectId === 'all' || !selectedProj
    ? 'All Projects (Combined)'
    : `${selectedProj.name} (${selectedProj.key})`;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
      {/* Title & Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shadow-2xs">
            <BarChart3 className="w-5 h-5 text-[#5cb028] dark:text-[#88c958]" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Retrospective Analytics
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30 uppercase tracking-wide">
            Manager View
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
          Track team attendance rates, sprint participation quality, and feedback contribution across your agile retrospectives.
        </p>
      </div>

      {/* Project Selector, Year Selector & Refresh Controls */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Multi-Project Filter Dropdown */}
        <div className="relative min-w-[200px] sm:min-w-[240px]" ref={projectDropdownRef}>
          <button
            type="button"
            disabled={isLoading || hasNoProjects}
            onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
            title={hasNoProjects ? 'No projects assigned' : 'Filter analytics by project'}
            className="w-full flex items-center justify-between gap-2 pl-3.5 pr-3 py-2.5 rounded-xl bg-slate-50/90 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderKanban className="w-4 h-4 text-[#5cb028] dark:text-[#88c958] shrink-0" />
              <span className="truncate">{selectedProjectLabel}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isProjectDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Project Dropdown Menu */}
          {isProjectDropdownOpen && !hasNoProjects && (
            <div className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
              <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                Filter by Project
              </div>

              {/* Pinned "All Projects (Combined)" */}
              <div className="border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onProjectChange('all');
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer text-left ${
                    selectedProjectId === 'all'
                      ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {selectedProjectId === 'all' && (
                      <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                    )}
                    <span className={selectedProjectId === 'all' ? '' : 'pl-5.5'}>
                      All Projects (Combined)
                    </span>
                  </span>
                </button>
              </div>

              {/* Scrollable Project Items */}
              <div className="max-h-56 overflow-y-auto overscroll-contain py-0.5 [scrollbar-width:thin] scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                {projects?.map((proj) => {
                  const isSelected = selectedProjectId === proj.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => {
                        onProjectChange(proj.id);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate pr-2">
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                        )}
                        <span className={`truncate ${isSelected ? '' : 'pl-5.5'}`}>
                          {proj.name} ({proj.key})
                        </span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.08] px-2 py-0.5 rounded-full shrink-0">
                        {proj.memberCount} members
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Year Filter Dropdown */}
        <div className="relative min-w-[120px] sm:min-w-[135px]" ref={yearDropdownRef}>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsYearDropdownOpen((prev) => !prev)}
            title="Filter analytics by year"
            className="w-full flex items-center justify-between gap-2 pl-3.5 pr-3 py-2.5 rounded-xl bg-slate-50/90 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarDays className="w-4 h-4 text-[#5cb028] dark:text-[#88c958] shrink-0" />
              <span className="truncate">Year {selectedYear}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isYearDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Year Dropdown Menu */}
          {isYearDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-40 rounded-2xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.12] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
                Filter by Year
              </div>
              <div className="py-0.5">
                {availableYears?.map((yr) => {
                  const isSelected = selectedYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        onYearChange?.(yr);
                        setIsYearDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#5cb028]/10 text-[#3d8318] dark:bg-[#88c958]/15 dark:text-[#88c958] font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] shrink-0" />
                        )}
                        <span className={isSelected ? '' : 'pl-5.5'}>Year {yr}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12151c] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          title="Refresh analytics data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#88c958]' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
