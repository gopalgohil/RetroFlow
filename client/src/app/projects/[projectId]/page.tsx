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
import {
  ProjectDetailSkeleton,
  OverviewTabSkeleton,
  SprintsTabSkeleton,
  RetrosTabSkeleton,
  TeamTabSkeleton,
} from '@/components/project/ProjectSkeletons';
import { ShareProjectModal } from '@/components/project/ShareProjectModal';
import { ThemeToggle } from '@/components/ui';
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
        if (saved) return JSON.parse(saved);
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
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('retroflow_active_sessions_count');
        if (cached !== null) return parseInt(cached, 10) || 0;
      } catch {}
    }
    return 0;
  });

  // Dynamically sync live active retrospective sessions count for sidebar
  useEffect(() => {
    let isMounted = true;
    api
      .get(ENDPOINTS.RETROS)
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const count = list.filter((s: any) => s.status === 'active').length;
        setActiveSessionsCount(count);
        try {
          sessionStorage.setItem('retroflow_active_sessions_count', String(count));
        } catch {}
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Sync live profile from backend once on initial mount
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
  }, []);

  // Redirect unapproved members to dashboard where pending approval screen is shown
  useEffect(() => {
    if (
      currentUser &&
      currentUser.email &&
      (currentUser as any).isApproved === false &&
      currentUser.role !== 'admin' &&
      currentUser.role !== 'manager' &&
      (currentUser as any).projectRole !== 'Manager' &&
      currentUser.email !== 'gopalgohel249@gmail.com'
    ) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

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
    if (newTab === activeTab) return;
    setIsTabTransitioning(true);
    setActiveTab(newTab);
    const url = `/projects/${projectId}?tab=${newTab}`;
    window.history.pushState(null, '', url);
    setTimeout(() => {
      setIsTabTransitioning(false);
    }, 380);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
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
      })
      .finally(() => {
        if (isMounted) {
          // Smooth 350ms transition so component-matched skeleton renders cleanly
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          }, 350);
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
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const userRole = activeUser.role?.toLowerCase().trim();
  const userProjectRole = (activeUser as any).projectRole;

  const isWorkspaceAdmin = Boolean(
    userRole === 'admin' ||
    (userEmail && userEmail === 'gopalgohel249@gmail.com')
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f17] text-slate-900 dark:text-white flex selection:bg-[#5cb028] selection:text-white font-sans">
      {/* 1. Left Navigation Sidebar - ALWAYS rendered and persistent */}
      <Sidebar
        activeTab="projects"
        setActiveTab={(t) => {
          router.push(`/dashboard?tab=${t}`);
        }}
        activeSessionsCount={activeSessionsCount}
        user={activeUser}
        isAdmin={isWorkspaceAdmin}
        onLogout={() => setIsLogoutModalOpen(true)}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header with Project Switcher - ALWAYS rendered and persistent */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
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
            <ThemeToggle />

            {project && canShare && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                title="Share Project & Invite Team Members"
              >
                <Share2 className="w-3.5 h-3.5 text-[#5cb028]" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {/* User Profile Dropdown Pill */}
            <div className="relative shrink-0" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-2.5 pr-2.5 sm:pr-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50/90 dark:hover:bg-slate-700/90 border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
              >
                {/* User Initials Avatar */}
                <div
                  suppressHydrationWarning
                  className="w-8 h-8 rounded-xl bg-[#5cb028] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                >
                  {initials}
                </div>

                {/* User Name & Role */}
                <div className="text-left hidden sm:block">
                  <p suppressHydrationWarning className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {activeUser.name || 'Gopal'}
                  </p>
                  <p suppressHydrationWarning className="text-[11px] font-medium text-slate-400 dark:text-slate-500 capitalize leading-tight">
                    {displayRole}
                  </p>
                </div>

                {/* Chevron icon toggles up/down on open */}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180 text-[#5cb028]' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/50 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Profile Overview Box */}
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-800 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        suppressHydrationWarning
                        className="w-9 h-9 rounded-xl bg-[#5cb028] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      >
                        {initials}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <p suppressHydrationWarning className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {activeUser.name || 'Gopal'}
                          </p>
                          <span
                            suppressHydrationWarning
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 leading-none ${
                              displayRole.toLowerCase() === 'admin'
                                ? 'bg-[#eaf5e3] dark:bg-[#5cb028]/20 text-[#3d8318] dark:text-[#5cb028] border border-[#cdeac0] dark:border-[#5cb028]/30'
                                : displayRole.toLowerCase() === 'manager'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : displayRole.toLowerCase() === 'project lead'
                                ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : displayRole.toLowerCase().includes('qa') || displayRole.toLowerCase().includes('tester')
                                ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : displayRole.toLowerCase() === 'devops'
                                ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {displayRole}
                          </span>
                        </div>
                        <p
                          suppressHydrationWarning
                          className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#5cb028] dark:hover:text-[#5cb028] hover:bg-[#eaf5e3] dark:hover:bg-[#5cb028]/10 transition-colors cursor-pointer text-left group"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-[#5cb028] transition-colors" />
                      <span>My Profile</span>
                    </button>

                    <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
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
            <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
                🛡️
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Project Access Restricted</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {accessDeniedError}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-left">
                <p>
                  <strong>RBAC Enterprise Policy:</strong> Non-admin users can only view initiatives
                  they are actively assigned to as a Team Member or Project Lead.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : !project || isSwitchingProject || isLoading ? (
          <ProjectDetailSkeleton activeTab={activeTab} />
        ) : (
          <>

            {/* 3. Project Summary Banner */}
            <div className="bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-6">
              <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#5cb028] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-[#5cb028]/25">
                    {project.key}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {project.name}
                      </h1>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">{project.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1 font-medium">
                      <span>
                        Manager:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {project.members?.find((m) => (m.role || '').toLowerCase() === 'manager')?.name || project.lead?.name || 'Gopal'}
                        </strong>
                        {(isManager || isProjectLead) && <span className="text-[#3d8318] dark:text-[#5cb028] font-bold ml-1">(You)</span>}
                      </span>
                      <span>•</span>
                      <span>{project.members.length} team members</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Pill on Banner */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="px-3 py-1.5 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Sprints</span>
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">{project.sprints.length}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="px-3 py-1.5 text-center">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">Retros</span>
                    <span className="text-sm font-extrabold text-[#5cb028]">
                      {project.retrospectives.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Tab Navigation Strip */}
              <div className="w-full mt-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto">
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
                          ? 'bg-[#5cb028] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
              {isTabTransitioning ? (
                <>
                  {activeTab === 'overview' && <OverviewTabSkeleton />}
                  {activeTab === 'sprints' && <SprintsTabSkeleton />}
                  {activeTab === 'retros' && <RetrosTabSkeleton />}
                  {activeTab === 'team' && <TeamTabSkeleton />}
                </>
              ) : (
                <>
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
                </>
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

function ProjectDetailFallback() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role?: string;
    projectRole?: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) setUser(JSON.parse(saved));
      } catch {}
    }
  }, [user]);

  const activeUser = user || {
    name: '',
    email: '',
    role: 'member',
    projectRole: 'Developer',
  };

  const isWorkspaceAdmin = Boolean(
    activeUser.role === 'admin' ||
    activeUser.email?.toLowerCase().trim() === 'gopalgohel249@gmail.com'
  );

  const initials = activeUser.name
    ? activeUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'G';

  const [activeSessionsCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('retroflow_active_sessions_count');
        if (cached !== null) return parseInt(cached, 10) || 0;
      } catch {}
    }
    return 0;
  });

  const displayRole = isWorkspaceAdmin
    ? 'Admin'
    : (activeUser as any).projectRole || 'Manager';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f17] text-slate-900 dark:text-white flex selection:bg-[#5cb028] selection:text-white font-sans">
      {/* 1. Real persistent Sidebar - NO skeleton */}
      <Sidebar
        activeTab="projects"
        setActiveTab={() => {}}
        activeSessionsCount={activeSessionsCount}
        user={activeUser}
        isAdmin={isWorkspaceAdmin}
        isOpen={false}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header - Real stable layout, matching DashboardHeader and Project page */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0b0f17]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProjectSwitcher user={activeUser} />
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs select-none">
              <div className="w-8 h-8 rounded-xl bg-[#5cb028] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {activeUser.name || 'Gopal'}
                </p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 capitalize leading-tight">
                  {displayRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 3. ONLY the redirected page content area renders the ProjectDetailSkeleton */}
        <div className="flex-1 overflow-y-auto">
          <ProjectDetailSkeleton activeTab="overview" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<ProjectDetailFallback />}>
      <ProjectDetailContent />
    </Suspense>
  );
}
