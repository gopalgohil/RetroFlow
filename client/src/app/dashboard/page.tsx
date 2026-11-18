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

  const projectCookie = cookieStore.get('retroflow_active_project')?.value;
  let initialProject: any = null;
  if (projectCookie) {
    try {
      initialProject = JSON.parse(decodeURIComponent(projectCookie));
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

  return <DashboardClient initialUser={initialUser} initialProject={initialProject} />;
}
