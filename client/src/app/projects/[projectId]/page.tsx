'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  CustomizeRetroModal,
  WelcomeToast,
} from '@/components/dashboard';
import { ProjectSwitcher } from '@/components/navigation/ProjectSwitcher';
import {
  OverviewTab,
  SprintsTab,
  RetrosTab,
  TeamSettingsTab,
} from '@/components/project/tabs';
import { ProjectDetailSkeleton } from '@/components/project/ProjectSkeletons';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { CreateRetroPayload } from '@/types/retro';
import { api, ENDPOINTS } from '@/lib/api';
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
} from 'lucide-react';

function ProjectDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = (params?.projectId as string) || 'proj-pgi';
  const tabParam = searchParams.get('tab') || 'overview';

  const [project, setProject] = useState<Project | null>(() => {
    return ProjectDataService.getProjectById(projectId) || null;
  });
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email || parsed.name)) return parsed;
        }
      } catch {}
    }
    return {
      name: 'Gopal Gohel',
      email: 'gopalgohel249@gmail.com',
      role: 'admin',
    };
  });
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sprints' | 'retros' | 'team'>(
    (tabParam as any) || 'overview'
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCreateRetroOpen, setIsCreateRetroOpen] = useState(false);
  const [isSwitchingProject, setIsSwitchingProject] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`retroflow_cached_project_${projectId}`);
      if (cached) setProject(JSON.parse(cached));
    } catch { }

    try {
      const saved = localStorage.getItem('retroflow_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch { }
  }, [projectId]);

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
    window.history.pushState(null, '', `/projects/${selectedProj.id}?tab=${activeTab}`);

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

  // Sync tab with URL
  const handleTabChange = (newTab: 'overview' | 'sprints' | 'retros' | 'team') => {
    setActiveTab(newTab);
    const targetId = project?.id || projectId;
    const url = `/projects/${targetId}?tab=${newTab}`;
    window.history.pushState(null, '', url);
  };

  useEffect(() => {
    let isMounted = true;
    setAccessDeniedError(null);

    // If current project doesn't match URL projectId, check cache or mock first
    if (!project || project.id !== projectId) {
      try {
        const cached = sessionStorage.getItem(`retroflow_cached_project_${projectId}`);
        if (cached) {
          setProject(JSON.parse(cached));
        } else {
          const fallback = ProjectDataService.getProjectById(projectId);
          if (fallback) setProject(fallback);
        }
      } catch { }
    }

    // Live REST API request -> visible in browser Network tab!
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
    name: 'Gopal Gohel',
    email: 'gopalgohel249@gmail.com',
    role: 'admin',
  };

  const userEmail = activeUser.email?.toLowerCase().trim();
  const isWorkspaceAdmin = Boolean(
    activeUser.role?.toLowerCase() === 'admin' ||
    userEmail === 'gopalgohel249@gmail.com' ||
    userEmail?.includes('admin')
  );

  const isDesignatedLead = Boolean(
    userEmail && project?.lead?.email?.toLowerCase().trim() === userEmail
  );

  const userMemberRecord = project?.members?.find(
    (m) => m.email?.toLowerCase().trim() === userEmail
  );

  const isProjectManager = Boolean(userMemberRecord && userMemberRecord.role === 'Manager');
  const isUserProjectLead = isDesignatedLead || isProjectManager;

  const canManageProject = isWorkspaceAdmin || isDesignatedLead || isProjectManager;

  const currentUserRole =
    isDesignatedLead ? 'Project Lead' :
      isProjectManager ? 'Manager' :
        userMemberRecord?.role || (isWorkspaceAdmin ? 'Admin' : 'Developer');

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
        onLogout={() => router.push('/login')}
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
              currentProjectId={project?.id || projectId}
              onSelectProject={handleSelectProject}
            />
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5">
            {canManageProject && (
              <button
                onClick={() => setIsCreateRetroOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Launch Retro</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs font-semibold"
              title="Return to Main Workspace"
            >
              <span className="hidden md:inline">Dashboard</span>
              <span className="md:hidden">Back</span>
            </Link>
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

                      {isUserProjectLead && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                          <span>You are Project Lead</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 max-w-2xl">{project.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 font-medium">
                      <span>
                        Lead:{' '}
                        <strong className="text-slate-800">{project.lead?.name || 'Gopal Gohel'}</strong>
                        {isUserProjectLead && <span className="text-indigo-600 font-bold ml-1">(You)</span>}
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
                  canManageProject={canManageProject}
                />
              )}

              {activeTab === 'team' && (
                <TeamSettingsTab
                  project={project}
                  onProjectUpdated={(up) => setProject({ ...up })}
                  canManageProject={canManageProject}
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
