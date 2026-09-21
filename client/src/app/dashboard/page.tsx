'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProjectApiService } from '@/services/projectApi';

const WORKSPACE_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@retroflow.io';
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
  LogoutConfirmModal,
} from '@/components/dashboard';
import { RetroBoard, CreateRetroPayload } from '@/types/retro';
import { useDashboardTabs } from '@/hooks/useDashboardTabs';
import { useDashboardData } from '@/hooks/useDashboardData';
import { api, ENDPOINTS } from '@/lib/api';
import { CheckCircle2, Clock, RefreshCw, LogOut, XCircle, AlertTriangle, UserPlus } from 'lucide-react';

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

  // Check if role is Developer, QA, or DevOps
  const isDevOrQAOrDevOps = Boolean(
    !isAdmin &&
    !isManager &&
    !isProjectLead &&
    ['developer', 'qa', 'tester', 'devops'].some(
      (r) => (userRole !== 'member' && userRole?.includes(r)) || userProjectRole?.toLowerCase()?.includes(r)
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<RetroBoard | null>(null);

  // Auth Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_rejected');
    } catch {}
    router.push('/login');
  };

  const handleClearAndNavigate = (targetPath: string) => {
    try {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_rejected');
    } catch {}
    router.push(targetPath);
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
    (activeTab === 'sessions' && isSessionsLoading && sessions.length === 0 && !searchQuery);

  // Check if unapproved developer account
  const isPendingApproval = Boolean(
    activeUser.email &&
    !isAdmin &&
    !isManager &&
    activeUser.isApproved === false
  );

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [approvalCheckMessage, setApprovalCheckMessage] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('retroflow_rejected') === 'true';
    }
    return false;
  });

  // Auto-check if pending user was approved or rejected when page loads
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
            if (res.data.isApproved) {
              setCurrentUser(res.data);
              try {
                localStorage.setItem('retroflow_user', JSON.stringify(res.data));
                localStorage.removeItem('retroflow_rejected');
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
        if (res.data.isApproved) {
          setCurrentUser(res.data);
          try {
            localStorage.setItem('retroflow_user', JSON.stringify(res.data));
            localStorage.removeItem('retroflow_rejected');
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
      <div className="min-h-screen bg-gradient-to-br from-[#FFF1F2] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex flex-col justify-between selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between relative z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={140}
                height={44}
                className="h-9 sm:h-10 w-auto object-contain"
                priority
                unoptimized
              />
            </Link>
            <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
              Request Rejected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Login</span>
            </button>
          </div>
        </header>

        {/* Center Content Card */}
        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="max-w-xl w-full rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            {/* Red Ambient Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
              <XCircle className="w-8 h-8 text-rose-600" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 tracking-wide uppercase">
                Access Request Rejected
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Request Not Approved
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your workspace access request was not approved by the administrator. Your registration record has been removed from the system.
              </p>
            </div>

            {/* Rejection Details Box */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-left space-y-2 text-xs text-rose-900">
              <div className="flex items-center gap-2 font-bold text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>What should you do?</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                If you believe this was an error, please contact your workspace administrator at <strong className="font-semibold text-rose-950">{WORKSPACE_SUPPORT_EMAIL}</strong>, or you can submit a new registration.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleClearAndNavigate('/signup')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Again</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Back to Login</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-400 relative z-10">
          Need immediate access? Contact workspace owner at{' '}
          <a href={`mailto:${WORKSPACE_SUPPORT_EMAIL}`} className="font-semibold text-[#5cb028] hover:underline">
            {WORKSPACE_SUPPORT_EMAIL}
          </a>
        </footer>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            handleClearAndNavigate('/login');
          }}
          user={activeUser}
        />
      </div>
    );
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-[#5cb028] selection:text-white relative overflow-hidden font-sans">
        {/* Subtle Ambient Background Highlights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between relative z-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={140}
                height={44}
                className="h-9 sm:h-10 w-auto object-contain"
                priority
                unoptimized
              />
            </Link>
            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              Access Review
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{activeUser.email}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Center Content Card */}
        <main className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="max-w-xl w-full rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            {/* Ambient Icon */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 tracking-wide uppercase">
                Account Pending Approval
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                One-Time Workspace Review
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Welcome, <span className="text-slate-900 font-bold">{activeUser.name || 'Developer'}</span>! Your registration is complete and email verified. Workspace Administrator approval is required before accessing Retrospectives and Projects.
              </p>
            </div>

            {/* Checklist / Progress Steps */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 text-left space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">Email Address Verified</p>
                  <p className="text-[11px] text-slate-500 truncate">{activeUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                  ⏳
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">Administrator Review</p>
                  <p className="text-[11px] text-slate-500">Waiting for Workspace Admin to accept your request.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs opacity-60">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700">Permanent Workspace Access</p>
                  <p className="text-[11px] text-slate-400">Once accepted, you will have full access on all future logins.</p>
                </div>
              </div>
            </div>

            {/* Status Message Feedback */}
            {approvalCheckMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold border animate-in fade-in duration-200 ${
                  approvalCheckMessage.includes('approved')
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {approvalCheckMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckApprovalStatus}
                disabled={isCheckingStatus}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-all shadow-md hover:shadow-[#5cb028]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>{isCheckingStatus ? 'Checking Status...' : 'Check Approval Status'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Contact Support info */}
            <p className="text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              Need immediate access? Contact workspace owner at{' '}
              <a href={`mailto:${WORKSPACE_SUPPORT_EMAIL}`} className="text-[#5cb028] underline font-medium hover:text-[#4e9921]">
                {WORKSPACE_SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </main>

        {/* Minimal Footer */}
        <footer className="px-6 py-3 text-center text-[11px] text-slate-400 border-t border-slate-200/80 bg-white/50 backdrop-blur-xs relative z-10">
          RetroFlow &bull; Enterprise Agile Retrospectives
        </footer>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={() => {
            setIsLogoutModalOpen(false);
            handleLogout();
          }}
          user={activeUser}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen dark:bg-[#08090a] bg-[#F8FAFC] text-slate-900 dark:text-white flex selection:bg-[#88c958] selection:text-[#08090a] font-sans transition-colors duration-200"
    >
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
          pendingApprovalsCount={isAdmin ? pendingRequests.length : 0}
          onCreateClick={handleCreateRetro}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          isAdmin={isAdmin}
          user={activeUser}
          onLogout={handleLogout}
          onUserUpdated={(updated) => setCurrentUser((prev) => ({ ...(prev || {}), ...updated }))}
          isSessionsTab={activeTab === 'sessions'}
        />

        {/* Dynamic View Body with Component Skeletons */}
        <main className="flex-1 px-3.5 sm:px-5 lg:px-6 xl:px-6 2xl:px-8 py-5 sm:py-6 lg:py-8 w-full space-y-6 sm:space-y-8">
          {isCurrentTabLoading ? (
            <TabSkeleton tab={activeTab} />
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

function DashboardFallback() {
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string; projectRole?: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('retroflow_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  const activeUser = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'member',
    projectRole: user?.projectRole || 'Developer',
  };

  const isWorkspaceAdmin = Boolean(activeUser.role === 'admin');

  return (
    <div className="min-h-screen dark:bg-[#08090a] bg-[#F8FAFC] text-slate-900 dark:text-white flex selection:bg-[#88c958] selection:text-[#08090a] font-sans transition-colors duration-200">
      {/* Real persistent Sidebar: identical DOM node, logo never moves or disappears */}
      <Sidebar
        activeTab="sessions"
        setActiveTab={() => {}}
        activeSessionsCount={0}
        user={activeUser}
        isAdmin={isWorkspaceAdmin}
        isOpen={false}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <DashboardHeader
          onOpenMobileMenu={() => {}}
          isAdmin={isWorkspaceAdmin}
          user={activeUser}
          isSessionsTab={true}
        />

        {/* Dynamic View Body Skeleton */}
        <main className="flex-1 px-3.5 sm:px-5 lg:px-6 xl:px-6 2xl:px-8 py-5 sm:py-6 lg:py-8 w-full space-y-6 sm:space-y-8">
          <TabSkeleton tab="sessions" />
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
