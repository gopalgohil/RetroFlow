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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
      {/* Title & Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Retrospective Analytics
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
            Manager View
          </span>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          Track team attendance rates, sprint participation quality, and feedback contribution across your agile retrospectives.
        </p>
      </div>

      {/* Project Selector & Refresh Controls */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Multi-Project Filter Dropdown */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={isLoading}
            title="Filter analytics by project"
            className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <option value="all">🌐 All Projects (Combined)</option>
            {projects?.map((proj) => (
              <option key={proj.id} value={proj.id}>
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
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          title="Refresh analytics data"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
