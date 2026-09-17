'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api, ENDPOINTS } from '@/lib/api';
import {
  AnalyticsData,
  AnalyticsHeader,
  AnalyticsKpiGrid,
  AnalyticsSessionTrends,
  AnalyticsMemberTable,
  AnalyticsSkeleton,
} from './analytics';

export interface AnalyticsTabProps {
  user?: { name: string; email: string; role?: string; projectRole?: string } | null;
  isAdmin?: boolean;
  isManager?: boolean;
}

/**
 * AnalyticsTab Component
 * Senior orchestrator component coordinating data fetching, project filtering,
 * and passing dynamic props down to modular, single-responsibility child components.
 */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (projectId: string, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const endpoint = ENDPOINTS.RETRO_ANALYTICS || '/retros/analytics';
      const res = await api.get(endpoint, {
        params: { projectId: projectId || 'all' },
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
    fetchAnalytics(selectedProjectId);
  }, [selectedProjectId, fetchAnalytics]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Toolbar with Dynamic Multi-Project Selector & Refresh */}
      <AnalyticsHeader
        projects={data?.projects || []}
        selectedProjectId={selectedProjectId}
        onProjectChange={(newProjectId) => setSelectedProjectId(newProjectId)}
        onRefresh={() => fetchAnalytics(selectedProjectId, true)}
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
            onClick={() => fetchAnalytics(selectedProjectId)}
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
          {/* 2. Top 4 High-Level Summary KPI Cards */}
          <AnalyticsKpiGrid
            summary={data.summary}
            selectedProjectName={data.selectedProjectName}
          />

          {/* 3. Retrospective Session Turnout & Trend Cards */}
          <AnalyticsSessionTrends
            trends={data.retroTrends}
            selectedProjectName={data.selectedProjectName}
          />

          {/* 4. Individual Team Member Participation Breakdown Table */}
          <AnalyticsMemberTable members={data.memberAnalytics} />
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
