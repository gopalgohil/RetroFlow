'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  CustomizeRetroModal,
  WelcomeToast,
  MyProfileModal,
  LogoutConfirmModal,
} from '@/components/dashboard';
import { ProjectSwitcher } from '@/components/navigation/ProjectSwitcher';
import {
  OverviewTab,
  SprintsTab,
  RetrosTab,
  TeamSettingsTab,
} from '@/components/project/tabs';
import { ProjectDetailSkeleton } from '@/components/project/ProjectSkeletons';
import { ShareProjectModal } from '@/components/project/ShareProjectModal';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { CreateRetroPayload } from '@/types/retro';
import { api, ENDPOINTS } from '@/lib/api';
import { getRetroSocket } from '@/lib/socket';
import {
  FolderKanban,
  Calendar,
  Layers,
  Users,
  Settings,
  Activity,
  Plus,
  ArrowLeft,
  Share2,
  Sparkles,
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

function ProjectDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = (params?.projectId as string) || 'proj-pgi';
  const tabParam = searchParams.get('tab') || 'overview';

  const [project, setProject] = useState<Project | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`retroflow_cached_project_${projectId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id === projectId || parsed?.key?.toLowerCase() === projectId.toLowerCase()) {
            return parsed;
          }
        }
      } catch {}
    }
    return ProjectDataService.getProjectById(projectId) || null;
  });
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role?: string;
    projectRole?: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email || parsed.name)) return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sprints' | 'retros' | 'team'>(
    (tabParam as any) || 'overview'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateRetroOpen, setIsCreateRetroOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSwitchingProject, setIsSwitchingProject] = useState(false);

  // Profile dropdown & logout confirmation modals state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profileDropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle outside click & Escape key to close profile dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync live profile from backend dynamically
  useEffect(() => {
    const syncProfile = () => {
      api
        .get(ENDPOINTS.AUTH.ME)
        .then((res) => {
          if (res?.data && res.data.email) {
            setCurrentUser(res.data);
            try {
              localStorage.setItem('retroflow_user', JSON.stringify(res.data));
            } catch {}
          }
        })
        .catch(() => {});
    };

    syncProfile();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncProfile();
      }
    };
    window.addEventListener('focus', syncProfile);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', syncProfile);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Logout handler
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('retroflow_token');
      localStorage.removeItem('retroflow_user');
      localStorage.removeItem('retroflow_active_project_id');
      sessionStorage.clear();
      router.push('/login');
    }
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`retroflow_cached_project_${projectId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id === projectId || parsed?.key?.toLowerCase() === projectId.toLowerCase()) {
          setProject(parsed);
        }
      }
    } catch { }

    // Check for 1-click project magic invite token in URL
    const inviteParam = searchParams.get('invite');
    if (inviteParam) {
      ProjectApiService.verifyMagicInvite(projectId, inviteParam)
        .then((res: any) => {
          if (res?.token && res?.user) {
            localStorage.setItem('retroflow_token', res.token);
            localStorage.setItem('retroflow_user', JSON.stringify(res.user));
            setCurrentUser(res.user);
            // Clean up the ?invite= parameter from the URL cleanly
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('invite');
            window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
          }
        })
        .catch((err: any) => {
          console.warn('[ProjectDetail] Magic invite verification error:', err.message || err);
        });
    } else if (typeof window !== 'undefined') {
      const token = localStorage.getItem('retroflow_token');
      const saved = localStorage.getItem('retroflow_user');
      if (!token && !saved) {
        // Redirect to login if user is not logged in and has no invite link
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch { }
      }
    }
  }, [projectId, searchParams, router]);

  // Instant seamless project selection with component-matched skeleton
  const handleSelectProject = (selectedProj: Project) => {
    setIsSwitchingProject(true);
    setAccessDeniedError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('retroflow_active_project_id', selectedProj.id);
      try {
        sessionStorage.setItem(`retroflow_cached_project_${selectedProj.id}`, JSON.stringify(selectedProj));
      } catch { }
    }
    router.push(`/projects/${selectedProj.id}?tab=${activeTab}`);

    // Component-matched skeleton smoothly renders while updating project
    setTimeout(() => {
      setProject(selectedProj);
      setIsSwitchingProject(false);
    }, 280);

    // Live background REST API sync
    ProjectApiService.getProjectById(selectedProj.id)
      .then((p) => {
        if (p) {
          setProject(p);
          try {
            sessionStorage.setItem(`retroflow_cached_project_${p.id}`, JSON.stringify(p));
          } catch { }
        }
      })
      .catch((err: any) => {
        if (err?.message?.includes('Access Denied') || err?.status === 403) {
          setAccessDeniedError(
            err.message || 'Access Denied: You are not assigned as a member or lead of this project.'
          );
        }
      });
  };

  // Sync tab with URL without ever altering the active projectId
  const handleTabChange = (newTab: 'overview' | 'sprints' | 'retros' | 'team') => {
    setActiveTab(newTab);
    const url = `/projects/${projectId}?tab=${newTab}`;
    window.history.pushState(null, '', url);
  };

  useEffect(() => {
    let isMounted = true;
    setAccessDeniedError(null);

    // If current project doesn't match URL projectId, check cache or mock first
    if (!project || (project.id !== projectId && project.key?.toLowerCase() !== projectId.toLowerCase())) {
      try {
        const cached = sessionStorage.getItem(`retroflow_cached_project_${projectId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id === projectId || parsed?.key?.toLowerCase() === projectId.toLowerCase()) {
            setProject(parsed);
          }
        } else {
          const fallback = ProjectDataService.getProjectById(projectId);
          if (fallback) setProject(fallback);
        }
      } catch { }
    }

    // Live REST API request -> visible in browser Network tab on initial load
    ProjectApiService.getProjectById(projectId)
      .then((p) => {
        if (isMounted && p) {
          setProject(p);
          try {
            sessionStorage.setItem(`retroflow_cached_project_${p.id}`, JSON.stringify(p));
          } catch { }
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          if (err?.message?.includes('Access Denied') || err?.status === 403) {
            setAccessDeniedError(
              err.message ||
              'Access Denied: You are not assigned as a member or lead of this project.'
            );
            return;
          }
          const fallback = ProjectDataService.getProjectById(projectId);
          if (fallback) setProject(fallback);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Industry-standard event-driven real-time synchronization via WebSockets (Zero HTTP polling)
  useEffect(() => {
    let socket: any = null;
    try {
      socket = getRetroSocket();

      const onMetricsUpdated = (data: {
        shareToken: string;
        cardsCount: number;
        actionItemsCount: number;
        topicsCount?: number;
      }) => {
        if (!data?.shareToken) return;
        setProject((prev) => {
          if (!prev || !prev.retrospectives) return prev;
          let hasMatch = false;
          const updatedRetros = prev.retrospectives.map((r) => {
            if (r.shareToken === data.shareToken || r.id === data.shareToken) {
              hasMatch = true;
              return {
                ...r,
                cardsCount: data.cardsCount,
                actionItemsCount: data.actionItemsCount,
                topicsCount: data.topicsCount ?? r.topicsCount,
              };
            }
            return r;
          });
          if (!hasMatch) return prev;
          const updatedProj = { ...prev, retrospectives: updatedRetros };
          try {
            sessionStorage.setItem(`retroflow_cached_project_${updatedProj.id}`, JSON.stringify(updatedProj));
          } catch { }
          return updatedProj;
        });
      };

      socket.on('retro:metrics_updated', onMetricsUpdated);

      return () => {
        if (socket) {
          socket.off('retro:metrics_updated', onMetricsUpdated);
        }
      };
    } catch (e) {
      console.warn('[ProjectDetail] Live retro socket listener init:', e);
    }
  }, [projectId]);

  const handleRetroSave = async (payload: CreateRetroPayload) => {
    try {
      // Calculate dynamic sprint name for this individual retro
      let detectedSprintName = payload.sprintName;
      if (!detectedSprintName && payload.title) {
        const match = payload.title.match(/sprint\s*(\d+)/i);
        if (match) detectedSprintName = `Sprint ${match[1]}`;
      }
      if (!detectedSprintName) {
        const nextNum = (project?.retrospectives?.length || 0) + 1;
        detectedSprintName = `Sprint ${nextNum}`;
      }

      // Live REST API POST request -> visible in browser Network tab!
      const res = await api.post(ENDPOINTS.RETROS, {
        ...payload,
        projectId: project?.id,
        projectKey: project?.key,
        sprintName: detectedSprintName,
      });

      const createdRetro = res.data;
      setIsCreateRetroOpen(false);

      if (project && createdRetro) {
        const newRetroLink = {
          id: createdRetro._id || `retro-${Date.now()}`,
          shareToken: createdRetro.shareToken,
          title: createdRetro.title,
          scheduledDate: createdRetro.scheduledDate
            ? new Date(createdRetro.scheduledDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          status: (createdRetro.status || 'active') as 'active' | 'completed' | 'draft',
          sprintName: createdRetro.sprintName || detectedSprintName,
          topicsCount: createdRetro.topics?.length || payload.topics.length,
          cardsCount: 0,
          actionItemsCount: 0,
          actionItemsExported: false,
        };

        const updatedRetros = [newRetroLink, ...(project.retrospectives || [])];
        const updatedProject = { ...project, retrospectives: updatedRetros };
        setProject(updatedProject);

        // Sync with live backend Project data so auto-created sprint is loaded immediately
        ProjectApiService.getProjectById(project.id)
          .then((p) => {
            if (p) setProject(p);
          })
          .catch(() => { });
      }

      if (createdRetro?.shareToken) {
        router.push(`/retro/${createdRetro.shareToken}`);
      }
    } catch (err: any) {
      console.error('Failed to create project retrospective:', err);
      if (project) {
        const fallbackToken = `token-${Date.now().toString(36)}`;
        router.push(`/retro/${fallbackToken}`);
      }
    }
  };

  const activeUser = currentUser || {
    name: 'Gopal',
    email: 'gopalgohel249@gmail.com',
    role: 'admin',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = activeUser.role?.toLowerCase().trim();
  const userProjectRole = (activeUser as any).projectRole;

  const isWorkspaceAdmin = Boolean(
    userRole === 'admin' ||
    (userEmail && userEmail === 'gopalgohel249@gmail.com') ||
    (userEmail && userEmail.includes('admin'))
  );

  const isDesignatedLead = Boolean(
    userEmail && project?.lead?.email?.toLowerCase().trim() === userEmail
  );

  const userMemberRecord = project?.members?.find(
    (m) => m.email?.toLowerCase().trim() === userEmail
  );

  // Effective role in this agile project context
  const effectiveRole =
    userMemberRecord?.role ||
    userProjectRole ||
    (isDesignatedLead ? 'Project Lead' : isWorkspaceAdmin ? 'Manager' : 'Developer');

  // Check Manager authority (allowed to create project, create retro, share link, delete project)
  const isManager = Boolean(
    isWorkspaceAdmin ||
    effectiveRole === 'Manager' ||
    userRole === 'manager' ||
    userRole?.includes('manager') ||
    userMemberRecord?.role === 'Manager'
  );

  // Check Project Lead authority (allowed to create retro, share link; STRICTLY CANNOT delete project)
  const isProjectLead = Boolean(
    !isManager && (
      effectiveRole === 'Project Lead' ||
      isDesignatedLead ||
      userRole === 'project lead' ||
      userRole === 'team lead' ||
      userRole?.includes('lead') ||
      userMemberRecord?.role === 'Project Lead'
    )
  );

  // Check Developer / QA / DevOps (STRICTLY CANNOT share links, cannot create retro/projects, cannot delete)
  const isDevOrQAOrDevOps = Boolean(
    !isWorkspaceAdmin &&
    !isManager &&
    !isProjectLead &&
    ['developer', 'qa', 'tester', 'devops'].some((r) =>
      effectiveRole.toLowerCase().includes(r)
    )
  );

  // 1. Link sharing (Project link & Retro links)
  // Admin, Manager, and Project Lead CAN share; Developer, QA, DevOps STRICTLY CANNOT share
  const canShare = Boolean((isWorkspaceAdmin || isManager || isProjectLead) && !isDevOrQAOrDevOps);

  // 2. Project deletion (Danger Zone)
  // Workspace Admin and Manager ONLY; Project Lead STRICTLY CANNOT delete project
  const canDeleteProject = Boolean(isWorkspaceAdmin || isManager);

  // 3. Retro creation
  // Admin, Manager, and Project Lead CAN create retro; Developer, QA, DevOps CANNOT
  const canCreateRetro = Boolean((isWorkspaceAdmin || isManager || isProjectLead) && !isDevOrQAOrDevOps);

  // 4. Project management general (sprints, tabs)
  const canManageProject = Boolean(isWorkspaceAdmin || isManager || isProjectLead);

  const initials = activeUser.name
    ? activeUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'G';

  const displayRole = isWorkspaceAdmin
    ? 'Admin'
    : (activeUser as any).projectRole &&
      (activeUser as any).projectRole !== 'member' &&
      (activeUser as any).projectRole !== 'Unassigned'
    ? (activeUser as any).projectRole
    : effectiveRole || 'Developer';

  const currentUserRole =
    isWorkspaceAdmin ? 'Admin' :
    isManager ? 'Manager' :
    isProjectLead ? 'Project Lead' :
    effectiveRole;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex selection:bg-indigo-500 selection:text-white font-sans">
      {/* 1. Left Navigation Sidebar - ALWAYS rendered and persistent */}
      <Sidebar
        activeTab="projects"
        setActiveTab={(t) => {
          if (t === 'sessions' || t === 'members' || t === 'settings') {
            router.push(`/dashboard?tab=${t}`);
          }
        }}
        activeSessionsCount={1}
        user={activeUser}
        isAdmin={isWorkspaceAdmin}
        onLogout={() => setIsLogoutModalOpen(true)}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header with Project Switcher - ALWAYS rendered and persistent */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Intuitive Project Switcher with instant callback */}
            <ProjectSwitcher
              currentProjectId={projectId}
              currentProject={project}
              onSelectProject={handleSelectProject}
              user={currentUser}
            />
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5">
            {project && canShare && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                title="Share Project & Invite Team Members"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {canCreateRetro && (
              <button
                onClick={() => setIsCreateRetroOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Launch Retro</span>
              </button>
            )}

            {/* User Profile Dropdown Pill */}
            <div className="relative shrink-0" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-2.5 pr-2.5 sm:pr-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
              >
                {/* User Initials Avatar */}
                <div
                  suppressHydrationWarning
                  className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                >
                  {initials}
                </div>

                {/* User Name & Role */}
                <div className="text-left hidden sm:block">
                  <p suppressHydrationWarning className="text-xs font-bold text-slate-900 leading-tight">
                    {activeUser.name || 'Gopal'}
                  </p>
                  <p suppressHydrationWarning className="text-[11px] font-medium text-slate-400 capitalize leading-tight">
                    {displayRole}
                  </p>
                </div>

                {/* Chevron icon toggles up/down on open */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Profile Overview Box */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        suppressHydrationWarning
                        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      >
                        {initials}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <p suppressHydrationWarning className="text-xs font-bold text-slate-900 truncate">
                            {activeUser.name || 'Gopal'}
                          </p>
                          <span
                            suppressHydrationWarning
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 leading-none ${
                              displayRole.toLowerCase() === 'admin'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : displayRole.toLowerCase() === 'manager'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : displayRole.toLowerCase() === 'project lead'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : displayRole.toLowerCase().includes('qa') || displayRole.toLowerCase().includes('tester')
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : displayRole.toLowerCase() === 'devops'
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {displayRole}
                          </span>
                        </div>
                        <p
                          suppressHydrationWarning
                          className="text-[11px] text-slate-500 font-medium truncate mt-0.5"
                          title={activeUser.email}
                        >
                          {activeUser.email || 'gopalgohel249@gmail.com'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action items */}
                  <div className="pt-1 space-y-0.5">
                    {/* My Profile Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 transition-colors cursor-pointer text-left group"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <span>My Profile</span>
                    </button>

                    <div className="my-1 h-px bg-slate-100" />

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body Area */}
        {accessDeniedError ? (
          <div className="flex-1 p-6 sm:p-8 flex items-center justify-center min-h-[50vh]">
            <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
                🛡️
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900">Project Access Restricted</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {accessDeniedError}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 text-left">
                <p>
                  <strong>RBAC Enterprise Policy:</strong> Non-admin users can only view initiatives
                  they are actively assigned to as a Team Member or Project Lead.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : !project || isSwitchingProject ? (
          <ProjectDetailSkeleton activeTab={activeTab} />
        ) : (
          <>

            {/* 3. Project Summary Banner */}
            <div className="bg-white border-b border-slate-200/80 px-6 py-6 sm:px-8">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25">
                    {project.key}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                        {project.name}
                      </h1>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {project.key}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize flex items-center gap-1.5 ${project.healthStatus === 'on_track'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${project.healthStatus === 'on_track' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                        />
                        {project.healthStatus.replace('_', ' ')}
                      </span>

                      {isProjectLead && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                          <span>You are Project Lead</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 max-w-2xl">{project.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 font-medium">
                      <span>
                        Lead:{' '}
                        <strong className="text-slate-800">{project.lead?.name || 'Gopal'}</strong>
                        {isProjectLead && <span className="text-indigo-600 font-bold ml-1">(You)</span>}
                      </span>
                      <span>•</span>
                      <span>
                        Type: <strong className="text-slate-700 uppercase">{project.type}</strong>
                      </span>
                      <span>•</span>
                      <span>{project.members.length} team members</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Pill on Banner */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 shrink-0">
                  <div className="px-3 py-1.5 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sprints</span>
                    <span className="text-sm font-extrabold text-slate-800">{project.sprints.length}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div className="px-3 py-1.5 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Retros</span>
                    <span className="text-sm font-extrabold text-indigo-600">
                      {project.retrospectives.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Tab Navigation Strip */}
              <div className="max-w-7xl mx-auto mt-6 pt-2 border-t border-slate-100 flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'sprints', label: 'Sprints & Backlog', icon: Layers, count: project.sprints.length },
                  { id: 'retros', label: 'Retrospectives', icon: Sparkles, count: project.retrospectives.length },
                  {
                    id: 'team',
                    label: canManageProject ? 'Team & Settings' : 'Team Directory',
                    icon: Users,
                    count: project.members.length,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                            }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Dynamic Tab View Content */}
            <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
              {activeTab === 'overview' && (
                <OverviewTab
                  project={project}
                  onNavigateToTab={(t) => handleTabChange(t as any)}
                  canManageProject={canManageProject}
                  currentUserRole={currentUserRole}
                />
              )}

              {activeTab === 'sprints' && (
                <SprintsTab
                  project={project}
                  onProjectUpdated={(up) => setProject({ ...up })}
                  canManageProject={canManageProject}
                />
              )}

              {activeTab === 'retros' && (
                <RetrosTab
                  project={project}
                  onCreateRetroClick={() => setIsCreateRetroOpen(true)}
                  onProjectUpdated={(up) => setProject({ ...up })}
                  canManageProject={canShare}
                />
              )}

              {activeTab === 'team' && (
                <TeamSettingsTab
                  project={project}
                  onProjectUpdated={(up) => setProject({ ...up })}
                  canManageProject={canManageProject}
                  canDeleteProject={canDeleteProject}
                  currentUserRole={currentUserRole}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Customize Retro Modal with Project Context & Auto-Invite */}
      <CustomizeRetroModal
        isOpen={isCreateRetroOpen}
        onClose={() => setIsCreateRetroOpen(false)}
        onSave={handleRetroSave}
        projectContext={
          project
            ? {
              id: project.id,
              name: project.name,
              key: project.key,
              sprintName: `Sprint ${(project.retrospectives?.length || 0) + 1}`,
              members: project.members,
            }
            : null
        }
      />

      {/* Share Project & Member Invite Modal (Admin, Manager & Project Lead only) */}
      {canManageProject && (
        <ShareProjectModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={project}
          onProjectUpdated={(updatedProject) => {
            setProject(updatedProject);
            try {
              sessionStorage.setItem(`retroflow_cached_project_${updatedProject.id}`, JSON.stringify(updatedProject));
            } catch { }
          }}
        />
      )}

      {/* My Profile Modal */}
      <MyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={activeUser}
        onUserUpdated={(updated) => setCurrentUser((prev) => ({ ...(prev || {}), ...updated }))}
      />

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

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8FAFC] to-[#FFFFFF] text-slate-900 flex font-sans">
          <div className="w-72 hidden lg:block border-r border-slate-200/80 bg-white/90 p-6 animate-pulse space-y-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-200" />
              <div className="h-5 w-28 rounded bg-slate-200" />
            </div>
            <div className="h-10 w-full rounded-xl bg-slate-100" />
            <div className="space-y-2 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-full rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-8 w-24 rounded-xl bg-slate-100 animate-pulse" />
            </header>
            <ProjectDetailSkeleton activeTab="overview" />
          </div>
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
