/**
 * Shared Dashboard Navigation & Tab Definitions
 * Can be safely imported across both React Server Components (RSC) and Client Components
 * without RSC proxy boundary serialization issues.
 */
export const DASHBOARD_TABS = [
  'sessions',
  'projects',
  'action_items',
  'members',
  'analytics',
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number];

export function isValidDashboardTab(tab: unknown): tab is DashboardTab {
  return typeof tab === 'string' && (DASHBOARD_TABS as readonly string[]).includes(tab);
}
