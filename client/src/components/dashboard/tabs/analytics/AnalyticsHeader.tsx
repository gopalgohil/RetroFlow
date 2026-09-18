'use client';

import React from 'react';
import { BarChart3, FolderKanban, ChevronDown, RefreshCw } from 'lucide-react';
import { ProjectOption } from './types';

interface AnalyticsHeaderProps {
  projects: ProjectOption[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  onRefresh,
  isLoading,
  isRefreshing,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
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

      {/* Project Selector & Refresh Controls */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Multi-Project Filter Dropdown */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <FolderKanban className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={isLoading}
            title="Filter analytics by project"
            className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-slate-50/90 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#88c958]/20 focus:border-[#88c958] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <option value="all" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">All Projects (Combined)</option>
            {projects?.map((proj) => (
              <option key={proj.id} value={proj.id} className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">
                {proj.name} ({proj.key}) • {proj.memberCount} members
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
