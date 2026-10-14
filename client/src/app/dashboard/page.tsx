import { Suspense } from 'react';
import DashboardClient, { DashboardFallback } from './DashboardClient';
import { DASHBOARD_TABS, DashboardTab } from '@/hooks/useDashboardTabs';

interface DashboardPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

/**
 * Server Component: DashboardPage
 * Resolves searchParams (?tab=...) on the server during initial request / reload.
 * Passes the exact active tab directly into both DashboardFallback and DashboardClient,
 * completely preventing the sidebar active tab indicator from flashing or jumping to 'sessions'.
 */
export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = props.searchParams instanceof Promise
    ? await props.searchParams
    : props.searchParams;

  const tabParam = searchParams?.tab;
  const initialTab: DashboardTab =
    typeof tabParam === 'string' && DASHBOARD_TABS.includes(tabParam as DashboardTab)
      ? (tabParam as DashboardTab)
      : 'sessions';

  return (
    <Suspense fallback={<DashboardFallback initialTab={initialTab} />}>
      <DashboardClient initialTab={initialTab} />
    </Suspense>
  );
}
