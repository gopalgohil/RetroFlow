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
  SettingsTab,
  WelcomeToast,
} from '@/components/dashboard';
import { RetroBoard, CreateRetroPayload } from '@/types/retro';
import { useDashboardTabs } from '@/hooks/useDashboardTabs';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CheckCircle2 } from 'lucide-react';

/**
 * DashboardContent Component
 * Senior-level orchestrator component delegating feature state, URL sync,
 * and view rendering to modular hooks and tab components.
 */
function DashboardContent() {
  const router = useRouter();

  // Tab routing & history synchronization hook
  const { activeTab, switchTab, isTransitioning } = useDashboardTabs();

  // Search & Mobile UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Business logic & REST API data hook
  const {
    user,
    toastMessage,
    sessions,
    isSessionsLoading,
    deleteSession,
    saveSession,
    activeSessionsCount,
    members,
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
    settings,
    isSettingsLoading,
    isSavingSettings,
    saveSettings,
  } = useDashboardData(activeTab, searchQuery);

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role?: string;
    projectRole?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  const activeUser = currentUser || user || {
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = activeUser.role?.toLowerCase().trim();
  const userProjectRole = (activeUser as any).projectRole;

  const isAdmin = Boolean(
    userRole === 'admin' ||
    (userEmail && userEmail === 'gopalgohel249@gmail.com')
  );

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

  // Check if role is Developer, QA, or DevOps
  const isDevOrQAOrDevOps = Boolean(
    ['developer', 'qa', 'tester', 'devops', 'member'].some(
      (r) => userRole?.includes(r) || userProjectRole?.toLowerCase()?.includes(r)
    )
  );

  // Admin and Manager can initialize projects; Project Leads & Developers cannot
  const canCreateProject = isAdmin || isManager;

  // Admin, Manager, and Project Lead can manage retros and share links
  // Developer, QA, DevOps cannot create retros or share links
  const canManageSessions = isAdmin || isManager || isProjectLead;

  // Strictly Workspace Admin and Manager only!
  // Project Lead, Developer, QA Engineer, and DevOps are explicitly excluded from Team Directory
  const canViewMembers = (isAdmin || isManager) && !isProjectLead && !isDevOrQAOrDevOps;

  // Live open action items count badge (updated when Action Items tab is active or item statuses change)
  const [openActionItemsCount, setOpenActionItemsCount] = useState(0);

  const handleActionItemsCountChange = useCallback((count: number) => {
    setOpenActionItemsCount((prev) => (prev === count ? prev : count));
  }, []);

  // Welcome Toast Notification (triggered only once on fresh login)
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

  // Modal dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<RetroBoard | null>(null);

  // Auth Logout
  const handleLogout = () => {
    localStorage.removeItem('retroflow_token');
    localStorage.removeItem('retroflow_user');
    router.push('/login');
  };

  // Session Actions
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

  // Derived loading state for skeleton loader (tab switching and full tab hydration)
  const isCurrentTabLoading =
    isTransitioning ||
    (activeTab === 'sessions' && isSessionsLoading) ||
    (activeTab === 'members' && isMembersLoading) ||
    (activeTab === 'settings' && isSettingsLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex selection:bg-indigo-500 selection:text-white font-sans">
      {/* Left Navigation Sidebar */}
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

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isLoading={isSessionsLoading}
          pendingApprovalsCount={0}
          onCreateClick={handleCreateRetro}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isAdmin={isAdmin}
          user={activeUser}
          onLogout={handleLogout}
          onUserUpdated={(updated) => setCurrentUser((prev) => ({ ...(prev || {}), ...updated }))}
        />

        {/* Dynamic View Body with Component Skeletons */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {isCurrentTabLoading ? (
            <TabSkeleton tab={activeTab} />
          ) : (
            <>
              {activeTab === 'sessions' && (
                <SessionsTab
                  sessions={sessions}
                  isLoading={false}
                  activeSessionsCount={activeSessionsCount}
                  onLaunch={handleLaunchRetro}
                  onEdit={handleEditRetro}
                  onDelete={deleteSession}
                  onCreateNew={handleCreateRetro}
                  isAdmin={canManageSessions}
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
                      className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Go to Action Items
                    </button>
                  </div>
                )
              )}

              {activeTab === 'settings' && (
                isAdmin ? (
                  <SettingsTab
                    settings={settings}
                    isLoading={isSettingsLoading}
                    isSaving={isSavingSettings}
                    onSave={saveSettings}
                  />
                ) : (
                  <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3 max-w-md mx-auto">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black mx-auto">
                      🛡️
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Admin Privileges Required</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Workspace configuration, Slack integrations, and agile retro defaults can only be managed by workspace administrators.
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* Customize Retrospective Builder Modal */}
      <CustomizeRetroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        initialData={editingSession}
      />

      {/* Role-Specific Welcome Toast Notification */}
      <WelcomeToast
        user={user}
        isOpen={showWelcomeToast}
        onClose={handleCloseWelcomeToast}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
