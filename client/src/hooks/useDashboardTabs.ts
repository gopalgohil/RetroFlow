'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export const DASHBOARD_TABS = ['projects', 'sessions', 'action_items', 'members', 'analytics'] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

export const TAB_TO_PATH: Record<DashboardTab, string> = {
  projects: '/dashboard/projects',
  sessions: '/dashboard/sessions',
  action_items: '/dashboard/action-items',
  members: '/dashboard/members',
  analytics: '/dashboard/analytics',
};

export const PATH_TO_TAB: Record<string, DashboardTab> = {
  projects: 'projects',
  sessions: 'sessions',
  'action-items': 'action_items',
  action_items: 'action_items',
  members: 'members',
  analytics: 'analytics',
};

export function resolveTabFromUrl(pathname?: string, searchParams?: URLSearchParams | null): DashboardTab {
  if (pathname) {
    const cleanPath = pathname.replace(/\/+$/, '');
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments[0] === 'dashboard' && segments[1]) {
      const seg = segments[1].toLowerCase();
      if (PATH_TO_TAB[seg]) return PATH_TO_TAB[seg];
    }
    if (segments[0] === 'projects' && !segments[1]) {
      return 'projects';
    }
  }

  if (searchParams) {
    const urlTab = searchParams.get('tab');
    if (urlTab) {
      const seg = urlTab.toLowerCase();
      if (PATH_TO_TAB[seg]) return PATH_TO_TAB[seg];
    }
  }

  return 'projects';
}

interface UseDashboardTabsOptions {
  defaultTab?: DashboardTab;
  initialTabOverride?: DashboardTab;
  transitionDuration?: number;
}

export function useDashboardTabs({
  defaultTab = 'projects',
  initialTabOverride,
  transitionDuration = 380,
}: UseDashboardTabsOptions = {}) {
  const searchParams = useSearchParams();

  const getActiveTabFromLocation = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialTabOverride || defaultTab;
    }
    const currentPath = window.location.pathname;
    const currentParams = new URLSearchParams(window.location.search);
    return resolveTabFromUrl(currentPath, currentParams);
  }, [defaultTab, initialTabOverride]);

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (initialTabOverride && DASHBOARD_TABS.includes(initialTabOverride)) {
      return initialTabOverride;
    }
    return getActiveTabFromLocation();
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (initialTabOverride && initialTabOverride !== activeTab) {
      setActiveTab(initialTabOverride);
    }
  }, [initialTabOverride, activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
      const targetPath = TAB_TO_PATH[activeTab] || '/dashboard/projects';
      window.history.replaceState(null, '', targetPath);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const targetTab = getActiveTabFromLocation();
      if (targetTab !== activeTab) {
        setIsTransitioning(true);
        setActiveTab(targetTab);
        setTimeout(() => setIsTransitioning(false), transitionDuration);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, getActiveTabFromLocation, transitionDuration]);

  const switchTab = useCallback(
    (targetTab: string) => {
      const raw = targetTab.toLowerCase();
      const validTab = (PATH_TO_TAB[raw] || targetTab) as DashboardTab;
      if (validTab === activeTab) return;
      if (!DASHBOARD_TABS.includes(validTab)) return;

      setIsTransitioning(true);
      setActiveTab(validTab);

      const targetPath = TAB_TO_PATH[validTab] || `/dashboard/${validTab}`;
      window.history.pushState(null, '', targetPath);

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
