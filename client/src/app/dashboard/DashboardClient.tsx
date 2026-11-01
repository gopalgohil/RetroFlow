'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sidebar,
  DashboardHeader,
  CustomizeRetroModal,
  TabSkeleton,
  DashboardLayoutSkeleton,
  SessionsTab,
  ProjectsTab,
  ActionItemsTab,
  MembersTab,
  AnalyticsTab,
  WelcomeToast,
  WaitingForApprovalView,
  RejectedView,
} from '@/components/dashboard';
import { RetroBoard, CreateRetroPayload } from '@/types/retro';
import { useDashboardTabs } from '@/hooks/useDashboardTabs';
import { useDashboardData } from '@/hooks/useDashboardData';
import { api, ENDPOINTS } from '@/lib/api';
import { CheckCircle2 } from 'lucide-react';

interface DashboardClientProps {
  initialUser?: any;
}

function DashboardContent({ initialUser }: DashboardClientProps) {
  const router = useRouter();

  const { activeTab, switchTab, isTransitioning } = useDashboardTabs();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    user,
    toastMessage,
    sessions,
    isSessionsLoading,
    deleteSession,
    toggleSessionStatus,
    saveSession,
    activeSessionsCount,
    members,
    pendingRequests,
    membersPagination,
    membersPage,
    membersLimit,
    membersSearch,
    isMembersLoading,
    fetchMembers,
    onMembersPageChange,
    onMembersLimitChange,
    onMembersSearchChange,
    addWhitelistMember,
    removeWhitelistMember,
    updateMemberRole,
    approveMember,
    rejectMember,
  } = useDashboardData(activeTab, searchQuery);

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role?: string;
    projectRole?: string;
    isApproved?: boolean;
    status?: string;
  } | null>(() => {
    if (initialUser?.email) return initialUser;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (user && user.email) {
      setCurrentUser(user);
      try {
        const uStr = JSON.stringify(user);
        document.cookie = `retroflow_user=${encodeURIComponent(uStr)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    }
  }, [user]);

  const activeUser = currentUser || user || {
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
    isApproved: false,
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = activeUser.role?.toLowerCase().trim();
  const userProjectRole = (activeUser as any).projectRole;

  const isAdmin = Boolean(userRole === 'admin');

  const isManager = Boolean(
    isAdmin ||
    userProjectRole?.toLowerCase() === 'manager' ||
    userRole === 'manager' ||
    userRole?.includes('manager')
  );

  const isProjectLead = Boolean(
    !isManager && (
      userProjectRole === 'Project Lead' ||
      userRole === 'project lead' ||
      userRole === 'team lead' ||
      userRole?.includes('lead')
    )
  );

  const isDevOrQAOrDevOps = Boolean(
    !isAdmin &&
    !isManager &&
    !isProjectLead &&
    ['developer', 'qa', 'tester', 'devops'].some(
      (r) => (userRole !== 'member' && userRole?.includes(r)) || userProjectRole?.toLowerCase()?.includes(r)
    )
  );

  const canCreateProject = isAdmin || isManager;
  const canManageSessions = isAdmin || isManager || isProjectLead;
  const canViewMembers = (isAdmin || isManager) && !isProjectLead && !isDevOrQAOrDevOps;

  const [openActionItemsCount, setOpenActionItemsCount] = useState(0);

  const handleActionItemsCountChange = useCallback((count: number) => {
    setOpenActionItemsCount((prev) => (prev === count ? prev : count));
  }, []);

  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldGreet = sessionStorage.getItem('retroflow_welcome_toast');
      const alreadyGreeted = sessionStorage.getItem('retroflow_toast_dismissed');
      if (shouldGreet === 'true' && alreadyGreeted !== 'true') {
        setShowWelcomeToast(true);
        sessionStorage.removeItem('retroflow_welcome_toast');
      }
    }
  }, []);

  const handleCloseWelcomeToast = React.useCallback(() => {
    setShowWelcomeToast(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('retroflow_toast_dismissed', 'true');
    }
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<RetroBoard | null>(null);

  const handleLogout = () => {
    try {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_rejected');
      localStorage.removeItem('retroflow_cached_active_project');
      localStorage.removeItem('retroflow_active_project_id');
      localStorage.removeItem('retroflow_cached_projects_list');
      sessionStorage.clear();
      document.cookie = 'retroflow_user=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
    } catch {}
    router.push('/login');
  };

  const handleClearAndNavigate = (targetPath: string) => {
    try {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_rejected');
      localStorage.removeItem('retroflow_cached_active_project');
      localStorage.removeItem('retroflow_active_project_id');
      localStorage.removeItem('retroflow_cached_projects_list');
      sessionStorage.clear();
      document.cookie = 'retroflow_user=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
    } catch {}
    router.push(targetPath);
  };

  const handleCreateRetro = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleEditRetro = (session: RetroBoard) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleLaunchRetro = (session: RetroBoard) => {
    router.push(`/retro/${session.shareToken}`);
  };

  const handleModalSave = async (payload: CreateRetroPayload) => {
    const saved = await saveSession(payload, editingSession?._id);
    if (!editingSession) {
      setIsModalOpen(false);
      if (saved?.shareToken) {
        router.push(`/retro/${saved.shareToken}`);
      }
    }
  };

  const isCurrentTabLoading =
    isTransitioning ||
    (activeTab === 'sessions' && isSessionsLoading && sessions.length === 0 && !searchQuery) ||
    (activeTab === 'members' && isMembersLoading && !membersSearch);

  const isPendingApproval = Boolean(
    activeUser.email &&
    !isAdmin &&
    !isManager &&
    (activeUser.isApproved === false || (activeUser as any).status === 'pending')
  );

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [approvalCheckMessage, setApprovalCheckMessage] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('retroflow_rejected') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('retroflow_rejected') === 'true') {
      setIsRejected(true);
      return;
    }

    if (isPendingApproval && !isRejected) {
      api
        .get(ENDPOINTS.AUTH.ME)
        .then((res) => {
          if (res?.data) {
            if (res.data.status === 'rejected') {
              try {
                localStorage.setItem('retroflow_rejected', 'true');
                document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
              } catch {}
              setIsRejected(true);
              return;
            }
            if (res.data.isApproved) {
              setCurrentUser(res.data);
              try {
                const uStr = JSON.stringify(res.data);
                localStorage.setItem('retroflow_user', uStr);
                document.cookie = `retroflow_user=${encodeURIComponent(uStr)}; path=/; max-age=2592000; SameSite=Lax`;
                localStorage.removeItem('retroflow_rejected');
                document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
              } catch {}
            }
          }
        })
        .catch((err: any) => {
          const isNotFoundOrDeleted =
            err?.status === 404 ||
            err?.status === 401 ||
            (err?.message && (
              err.message.toLowerCase().includes('not found') ||
              err.message.toLowerCase().includes('unauthorized') ||
              err.message.toLowerCase().includes('logged in')
            ));
          if (isNotFoundOrDeleted) {
            try {
              localStorage.setItem('retroflow_rejected', 'true');
              document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
            } catch {}
            setIsRejected(true);
          }
        });
    }
  }, [isPendingApproval, isRejected]);

  const handleCheckApprovalStatus = async () => {
    setIsCheckingStatus(true);
    setApprovalCheckMessage(null);
    try {
      const res = await api.get(ENDPOINTS.AUTH.ME);
      if (res?.data) {
        if (res.data.status === 'rejected') {
          try {
            localStorage.setItem('retroflow_rejected', 'true');
            document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
          } catch {}
          setIsRejected(true);
          return;
        }
        if (res.data.isApproved) {
          setCurrentUser(res.data);
          try {
            const uStr = JSON.stringify(res.data);
            localStorage.setItem('retroflow_user', uStr);
            document.cookie = `retroflow_user=${encodeURIComponent(uStr)}; path=/; max-age=2592000; SameSite=Lax`;
            localStorage.removeItem('retroflow_rejected');
            document.cookie = 'retroflow_rejected=; path=/; max-age=0; SameSite=Lax';
          } catch {}
          setApprovalCheckMessage('Congratulations! Your account has been approved.');
        } else {
          setApprovalCheckMessage('Your account is still pending administrator review. Please check back shortly.');
        }
      }
    } catch (err: any) {
      const isNotFoundOrDeleted =
        err?.status === 404 ||
        err?.status === 401 ||
        (err?.message && (
          err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('unauthorized') ||
          err.message.toLowerCase().includes('logged in')
        ));

      if (isNotFoundOrDeleted) {
        try {
          localStorage.setItem('retroflow_rejected', 'true');
          document.cookie = 'retroflow_rejected=true; path=/; max-age=2592000; SameSite=Lax';
        } catch {}
        setIsRejected(true);
      } else {
        setApprovalCheckMessage('Unable to verify approval status at this time. Please try again.');
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (isRejected) {
    return (
      <RejectedView
        user={activeUser}
        onLogout={handleLogout}
        onRegisterAgain={() => handleClearAndNavigate('/signup')}
      />
    );
  }

  if (isPendingApproval) {
    return (
      <WaitingForApprovalView
        user={activeUser}
        onLogout={handleLogout}
        isCheckingStatus={isCheckingStatus}
        onCheckApprovalStatus={handleCheckApprovalStatus}
        approvalCheckMessage={approvalCheckMessage}
      />
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#08090a] bg-[#F8FAFC] text-slate-900 dark:text-white flex selection:bg-[#88c958] selection:text-[#08090a] font-sans transition-colors duration-200">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={switchTab}
        activeSessionsCount={activeSessionsCount}
        openActionItemsCount={openActionItemsCount}
        user={activeUser}
        isAdmin={isAdmin}
        canViewMembers={canViewMembers}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoading={isSessionsLoading}
          pendingApprovalsCount={isAdmin ? pendingRequests.length : 0}
          onCreateClick={handleCreateRetro}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isAdmin={isAdmin}
          user={activeUser}
          onLogout={handleLogout}
          onUserUpdated={(updated) => setCurrentUser((prev) => ({ ...(prev || {}), ...updated }))}
          isSessionsTab={activeTab === 'sessions'}
        />

        <main className="flex-1 px-3.5 sm:px-5 lg:px-6 xl:px-6 2xl:px-8 py-5 sm:py-6 lg:py-8 w-full space-y-6 sm:space-y-8">
          {isCurrentTabLoading ? (
            <TabSkeleton tab={activeTab} isAdmin={isAdmin} />
          ) : (
            <>
              {activeTab === 'sessions' && (
                <SessionsTab
                  sessions={sessions}
                  isLoading={isSessionsLoading}
                  activeSessionsCount={activeSessionsCount}
                  onLaunch={handleLaunchRetro}
                  onEdit={handleEditRetro}
                  onDelete={deleteSession}
                  onToggleStatus={toggleSessionStatus}
                  onCreateNew={handleCreateRetro}
                  isAdmin={canManageSessions}
                  user={activeUser}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsTab isAdmin={canCreateProject} user={activeUser} />
              )}

              {activeTab === 'action_items' && (
                <ActionItemsTab
                  user={activeUser}
                  isAdmin={isAdmin}
                  isManager={isManager}
                  onActionItemsCountChange={handleActionItemsCountChange}
                />
              )}

              {activeTab === 'members' && (
                canViewMembers ? (
                  <MembersTab
                    members={members}
                    pendingRequests={pendingRequests}
                    pagination={membersPagination}
                    currentPage={membersPage}
                    currentLimit={membersLimit}
                    searchQuery={membersSearch}
                    isLoading={isMembersLoading}
                    onRefresh={() => fetchMembers(membersPage, membersLimit, membersSearch)}
                    onPageChange={onMembersPageChange}
                    onLimitChange={onMembersLimitChange}
                    onSearchChange={onMembersSearchChange}
                    onWhitelistAdded={addWhitelistMember}
                    onRemoveMember={removeWhitelistMember}
                    onUpdateMemberRole={updateMemberRole}
                    onApproveMember={approveMember}
                    onRejectMember={rejectMember}
                    currentEmail={activeUser.email}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <div className="p-12 rounded-3xl bg-white border border-slate-200/80 text-center space-y-4 max-w-md mx-auto shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
                      🛡️
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Team Directory and Access Control management is reserved for Workspace Administrators and Managers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab('action_items')}
                      className="py-2.5 px-4 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Go to Action Items
                    </button>
                  </div>
                )
              )}

              {activeTab === 'analytics' && (
                canViewMembers ? (
                  <AnalyticsTab
                    user={activeUser}
                    isAdmin={isAdmin}
                    isManager={isManager}
                  />
                ) : (
                  <div className="p-12 rounded-3xl bg-white border border-slate-200/80 text-center space-y-4 max-w-md mx-auto shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
                      🛡️
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Retrospective Attendance Analytics & Insights are reserved strictly for Workspace Administrators and Managers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab('sessions')}
                      className="py-2.5 px-4 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Back to Sessions
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>

      <CustomizeRetroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        initialData={editingSession}
      />

      <WelcomeToast
        user={activeUser}
        isOpen={showWelcomeToast}
        onClose={handleCloseWelcomeToast}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function DashboardFallback({ initialUser }: DashboardClientProps) {
  const [user] = useState<{
    name?: string;
    email?: string;
    role?: string;
    projectRole?: string;
    isApproved?: boolean;
    status?: string;
  } | null>(() => {
    if (initialUser?.email) return initialUser;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  const [isRejected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('retroflow_rejected') === 'true';
    }
    return false;
  });

  const activeUser = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'member',
    projectRole: user?.projectRole || 'Developer',
    isApproved: user?.isApproved,
    status: user?.status,
  };

  const isWorkspaceAdmin = Boolean(activeUser.role === 'admin');
  const isManager = Boolean(
    isWorkspaceAdmin ||
    activeUser.projectRole?.toLowerCase() === 'manager' ||
    activeUser.role === 'manager' ||
    activeUser.role?.includes('manager')
  );

  const isPending = Boolean(
    activeUser.email &&
    !isWorkspaceAdmin &&
    !isManager &&
    (activeUser.isApproved === false || activeUser.status === 'pending')
  );

  if (isRejected) {
    return <RejectedView user={activeUser} />;
  }

  if (isPending) {
    return <WaitingForApprovalView user={activeUser} />;
  }

  if (user?.email) {
    return (
      <div className="min-h-screen dark:bg-[#08090a] bg-[#F8FAFC] text-slate-900 dark:text-white flex selection:bg-[#88c958] selection:text-[#08090a] font-sans transition-colors duration-200">
        <Sidebar
          activeTab="sessions"
          setActiveTab={() => {}}
          activeSessionsCount={0}
          user={activeUser}
          isAdmin={isWorkspaceAdmin}
          isOpen={false}
        />
        <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
          <DashboardHeader
            onOpenMobileMenu={() => {}}
            isAdmin={isWorkspaceAdmin}
            user={activeUser}
            isSessionsTab={true}
          />
          <main className="flex-1 px-3.5 sm:px-5 lg:px-6 xl:px-6 2xl:px-8 py-5 sm:py-6 lg:py-8 w-full space-y-6 sm:space-y-8">
            <TabSkeleton tab="sessions" />
          </main>
        </div>
      </div>
    );
  }

  return <DashboardLayoutSkeleton />;
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  return (
    <Suspense fallback={<DashboardFallback initialUser={initialUser} />}>
      <DashboardContent initialUser={initialUser} />
    </Suspense>
  );
}
