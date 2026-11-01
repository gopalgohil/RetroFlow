import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import { WaitingForApprovalView, RejectedView } from '@/components/dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('retroflow_user')?.value;
  const isRejectedCookie = cookieStore.get('retroflow_rejected')?.value === 'true';

  let initialUser: any = null;
  if (userCookie) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userCookie));
    } catch {}
  }

  // 1. If server detects user is rejected
  if (isRejectedCookie || initialUser?.status === 'rejected') {
    return <RejectedView user={initialUser || undefined} />;
  }

  // 2. If server detects user is pending approval
  const isPending = Boolean(
    initialUser?.email &&
    initialUser.role !== 'admin' &&
    initialUser.role !== 'manager' &&
    (initialUser.isApproved === false || initialUser.status === 'pending')
  );

  if (isPending) {
    return <WaitingForApprovalView user={initialUser} />;
  }

  // 3. Render dashboard client for approved users (or initial sync)
  return <DashboardClient initialUser={initialUser} />;
}
