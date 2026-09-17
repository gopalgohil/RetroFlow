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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Title & Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#eaf5e3] dark:bg-[#5cb028]/20 border border-[#cdeac0] dark:border-[#5cb028]/30 text-[#3d8318] dark:text-[#5cb028] flex items-center justify-center shadow-2xs">
            <BarChart3 className="w-5 h-5 text-[#5cb028]" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Retrospective Analytics
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border border-[#cdeac0] dark:border-[#5cb028]/30 uppercase tracking-wide">
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
            <FolderKanban className="w-4 h-4 text-[#5cb028]" />
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={isLoading}
            title="Filter analytics by project"
            className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5cb028]/20 focus:border-[#5cb028] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🌐 All Projects (Combined)</option>
            {projects?.map((proj) => (
              <option key={proj.id} value={proj.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
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
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          title="Refresh analytics data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#5cb028]' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
