'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, FolderKanban } from 'lucide-react';
import { api, ENDPOINTS } from '@/lib/api';
import {
  AnalyticsData,
  AnalyticsHeader,
  AnalyticsMonthlyBarChart,
  AnalyticsRetroActionTable,
  AnalyticsSkeleton,
} from './analytics';

export interface AnalyticsTabProps {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
}

/**
 * AnalyticsTab Component
 * Senior orchestrator component coordinating data fetching, project & year filtering,
 * and passing dynamic props down to modular, single-responsibility child components.
 */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  user,
  isAdmin = false,
  isManager = false,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (projectId: string, year: number, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = ENDPOINTS.RETRO_ANALYTICS || '/retros/analytics';
      const res = await api.get(endpoint, {
        params: {
          projectId: projectId || 'all',
          year: year || new Date().getFullYear(),
        },
      });

      if (res?.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      console.error('[AnalyticsTab] Error fetching analytics:', err);
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to load retrospective analytics';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedProjectId, selectedYear);
  }, [selectedProjectId, selectedYear, fetchAnalytics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Toolbar with Dynamic Multi-Project & Year Selector & Refresh */}
      <AnalyticsHeader
        projects={data?.projects || []}
        selectedProjectId={selectedProjectId}
        onProjectChange={(newProjectId) => setSelectedProjectId(newProjectId)}
        availableYears={data?.availableYears || [selectedYear]}
        selectedYear={data?.selectedYear || selectedYear}
        onYearChange={(newYear) => setSelectedYear(newYear)}
        onRefresh={() => fetchAnalytics(selectedProjectId, selectedYear, true)}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        isAdmin={isAdmin}
      />

      {/* Error Alert with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 text-xs font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedProjectId, selectedYear)}
            className="text-xs font-bold underline hover:no-underline text-rose-700 dark:text-rose-400 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && <AnalyticsSkeleton />}

      {/* Loaded Content */}
      {!isLoading && data && !isAdmin && (data.noProjectsAssigned || data.projects?.length === 0) ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shadow-2xs">
            <FolderKanban className="w-7 h-7 text-[#5cb028] dark:text-[#88c958]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Projects Assigned Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You are not assigned to any projects currently. Contact a Workspace Administrator to assign you to a project to view its retrospective analytics.
            </p>
          </div>
        </div>
      ) : !isLoading && data ? (
        <>
          {/* Annual Retrospective & Commitments 12-Month Bar Chart */}
          <AnalyticsMonthlyBarChart
            monthlyTrends={data.monthlyTrends}
            selectedYear={data.selectedYear || selectedYear}
            selectedProjectName={data.selectedProjectName}
            yearSummary={data.yearSummary}
          />

          {/* 4. Retros & Action Items Deliverables Table */}
          <AnalyticsRetroActionTable
            retros={data.retroActionAnalytics || data.retroTrends || []}
            selectedYear={data.selectedYear || selectedYear}
          />
        </>
      ) : null}
    </div>
  );
};

export default AnalyticsTab;
