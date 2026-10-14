'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { DASHBOARD_TABS, DashboardTab, isValidDashboardTab } from '@/types/dashboard';
export { DASHBOARD_TABS, isValidDashboardTab };
export type { DashboardTab };

interface UseDashboardTabsOptions {
  defaultTab?: DashboardTab;
  initialTab?: DashboardTab;
  transitionDuration?: number;
}

/**
 * Custom Hook: useDashboardTabs
 * Senior-level abstraction for handling dashboard tab routing, URL query synchronization,
 * browser back/forward popstate events, and smooth skeleton transitions without Next.js RSC overhead.
 */
export function useDashboardTabs({
  defaultTab = 'sessions',
  initialTab: propInitialTab,
  transitionDuration = 380,
}: UseDashboardTabsOptions = {}) {
  const searchParams = useSearchParams();

  // 1. Derive initial tab from prop, URL searchParams, or browser window search
  const initialTabFromUrl = searchParams.get('tab') as DashboardTab | null;

  const resolvedInitialTab: DashboardTab = (() => {
    if (propInitialTab && DASHBOARD_TABS.includes(propInitialTab)) {
      return propInitialTab;
    }
    if (initialTabFromUrl && DASHBOARD_TABS.includes(initialTabFromUrl)) {
      return initialTabFromUrl;
    }
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab') as DashboardTab;
        if (t && DASHBOARD_TABS.includes(t)) {
          return t;
        }
      } catch {}
      try {
        const saved = sessionStorage.getItem('retroflow_active_dashboard_tab') as DashboardTab;
        if (saved && DASHBOARD_TABS.includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return defaultTab;
  })();

  const [activeTab, setActiveTab] = useState<DashboardTab>(resolvedInitialTab);
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
        try {
          sessionStorage.setItem('retroflow_active_dashboard_tab', targetTab);
        } catch {}
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

      try {
        sessionStorage.setItem('retroflow_active_dashboard_tab', validTab);
      } catch {}

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
