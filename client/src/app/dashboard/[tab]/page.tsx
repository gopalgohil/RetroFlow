import { cookies } from 'next/headers';
import DashboardClient from '../DashboardClient';
import { WaitingForApprovalView, RejectedView } from '@/components/dashboard';
import { PATH_TO_TAB, DashboardTab } from '@/hooks/useDashboardTabs';

export const dynamic = 'force-dynamic';

interface DashboardTabPageProps {
  params: Promise<{ tab: string }> | { tab: string };
}

export default async function DashboardTabPage({ params }: DashboardTabPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawTab = (resolvedParams?.tab || '').toLowerCase();
  const initialTab: DashboardTab = PATH_TO_TAB[rawTab] || 'projects';

  const cookieStore = await cookies();
  const userCookie = cookieStore.get('retroflow_user')?.value;
  const isRejectedCookie = cookieStore.get('retroflow_rejected')?.value === 'true';

  let initialUser: any = null;
  if (userCookie) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userCookie));
    } catch {}
  }

  if (isRejectedCookie || initialUser?.status === 'rejected') {
    return <RejectedView user={initialUser || undefined} />;
  }

  const isPending = Boolean(
    initialUser?.email &&
    initialUser.role !== 'admin' &&
    initialUser.role !== 'manager' &&
    (initialUser.isApproved === false || initialUser.status === 'pending')
  );

  if (isPending) {
    return <WaitingForApprovalView user={initialUser} />;
  }

  return <DashboardClient initialUser={initialUser} initialTab={initialTab} />;
}
