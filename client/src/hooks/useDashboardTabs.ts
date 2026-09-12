'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export const DASHBOARD_TABS = ['sessions', 'projects', 'members', 'settings'] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

interface UseDashboardTabsOptions {
  defaultTab?: DashboardTab;
  transitionDuration?: number;
}

/**
 * Custom Hook: useDashboardTabs
 * Senior-level abstraction for handling dashboard tab routing, URL query synchronization,
 * browser back/forward popstate events, and smooth skeleton transitions without Next.js RSC overhead.
 */
export function useDashboardTabs({
  defaultTab = 'sessions',
  transitionDuration = 380,
}: UseDashboardTabsOptions = {}) {
  const searchParams = useSearchParams();

  // 1. Derive initial tab from URL query param (?tab=...)
  const initialTabFromUrl = searchParams.get('tab') as DashboardTab | null;
  const initialTab =
    initialTabFromUrl && DASHBOARD_TABS.includes(initialTabFromUrl)
      ? initialTabFromUrl
      : defaultTab;

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 2. Synchronize tab state with browser popstate (back/forward history)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab') as DashboardTab | null;
      const targetTab = urlTab && DASHBOARD_TABS.includes(urlTab) ? urlTab : defaultTab;

      if (targetTab !== activeTab) {
        setIsTransitioning(true);
        setActiveTab(targetTab);
        setTimeout(() => setIsTransitioning(false), transitionDuration);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, defaultTab, transitionDuration]);

  // 3. Switch tab with clean URL pushState (Zero RSC re-render jitter)
  const switchTab = useCallback(
    (targetTab: string) => {
      // If user is already on this tab, do nothing (prevent duplicate API calls & re-renders)
      if (targetTab === activeTab) return;
      if (!DASHBOARD_TABS.includes(targetTab as DashboardTab)) return;

      const validTab = targetTab as DashboardTab;
      setIsTransitioning(true);
      setActiveTab(validTab);

      const targetUrl = `/dashboard?tab=${validTab}`;
      window.history.pushState(null, '', targetUrl);

      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);
    },
    [activeTab, transitionDuration]
  );

  return {
    activeTab,
    switchTab,
    isTransitioning,
  };
}

export default useDashboardTabs;
