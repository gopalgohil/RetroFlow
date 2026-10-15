'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
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
export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
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
      )}
    </div>
  );
};

export default AnalyticsTab;
