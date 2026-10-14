'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Layers, Users } from 'lucide-react';
import { api, ENDPOINTS } from '@/lib/api';
import {
  AnalyticsData,
  AnalyticsHeader,
  AnalyticsKpiGrid,
  AnalyticsMonthlyBarChart,
  AnalyticsMemberTable,
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
export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [tableMode, setTableMode] = useState<'retros' | 'members'>('retros');
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
      {!isLoading && data && (
        <>
          {/* Top-Level High-Impact KPI Metric Cards */}
          {data.summary && (
            <AnalyticsKpiGrid
              summary={data.summary}
              selectedProjectName={data.selectedProjectName}
            />
          )}

          {/* Annual Retrospective & Commitments 12-Month Bar Chart */}
          <AnalyticsMonthlyBarChart
            monthlyTrends={data.monthlyTrends}
            selectedYear={data.selectedYear || selectedYear}
            selectedProjectName={data.selectedProjectName}
            yearSummary={data.yearSummary}
          />

          {/* 4. Table Section with View Mode Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setTableMode('retros')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tableMode === 'retros'
                      ? 'bg-white dark:bg-[#181c24] text-[#3d8318] dark:text-[#88c958] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Retros & Action Items ({data.retroTrends?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableMode('members')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tableMode === 'members'
                      ? 'bg-white dark:bg-[#181c24] text-[#3d8318] dark:text-[#88c958] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Member Attendance ({data.memberAnalytics?.length || 0})</span>
                </button>
              </div>
            </div>

            {tableMode === 'retros' ? (
              <AnalyticsRetroActionTable
                retros={data.retroActionAnalytics || data.retroTrends || []}
                selectedYear={data.selectedYear || selectedYear}
              />
            ) : (
              <AnalyticsMemberTable members={data.memberAnalytics} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
