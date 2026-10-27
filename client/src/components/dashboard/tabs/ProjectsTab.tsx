'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowRight,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Project } from '@/types/project';
import { PaginationMeta } from '@/types/retro';
import { ProjectApiService } from '@/services/projectApi';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { UserAvatar, StatusPill, ProgressBar, Modal } from '@/components/ui';
import { ProjectsTabSkeleton, ProjectCardsSkeleton } from '@/components/dashboard/DashboardSkeletons';

interface ProjectsTabProps {
  isAdmin?: boolean;
  user?: { name?: string; email?: string; role?: string; projectRole?: string } | null;
}


const formatProjectCreatedDate = (dateStr?: string | Date) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ isAdmin = false, user = null }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    projectRole?: string;
  } | null>(user || null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);

  // Enterprise Pagination & Counts state (6 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 6,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [tabCounts, setTabCounts] = useState<{ all: number; managed: number; archived?: number }>({
    all: 0,
    managed: 0,
    archived: 0,
  });

  const projectsGridRef = useRef<HTMLDivElement>(null);

  // Manager and Admin deletion access
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState<string | null>(null);

  const isManagerOrAdmin = Boolean(
    isAdmin ||
    currentUser?.role === 'admin' ||
    currentUser?.projectRole === 'Manager' ||
    currentUser?.role?.toLowerCase().includes('manager')
  );

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'archived'>('all');
  const [restoringProjectId, setRestoringProjectId] = useState<string | null>(null);
  const isInitialMountRef = useRef(true);

  const fetchProjects = useCallback(
    async (page: number, isSubsequent = false, filterOverride?: 'all' | 'archived') => {
      const activeFilter = filterOverride || selectedFilter;
      if (isSubsequent || !isInitialMountRef.current) {
        setIsFilterLoading(true);
      } else {
        setIsLoading(true);
      }
      try {
        const res = await ProjectApiService.getPaginatedProjects({
          page,
          limit: 6,
          filter: activeFilter,
        });
        setProjects(res.projects);
        setPagination(res.pagination);
        setTabCounts(res.counts);
      } catch (err) {
        console.warn('[ProjectsTab] Live API request error:', err);
      } finally {
        setIsLoading(false);
        setIsFilterLoading(false);
        isInitialMountRef.current = false;
      }
    },
    [selectedFilter]
  );

  const handleRestoreProject = async (projectId: string) => {
    setRestoringProjectId(projectId);
    try {
      await ProjectApiService.archiveProject(projectId, false);
      ProjectApiService.clearProjectsCache();
      fetchProjects(currentPage, true, selectedFilter);
    } catch (err: any) {
      console.error('[ProjectsTab] Failed to restore project:', err);
    } finally {
      setRestoringProjectId(null);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage, !isInitialMountRef.current);
  }, [fetchProjects, currentPage]);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    setDeleteProjectError(null);
    try {
      await ProjectApiService.deleteProject(projectToDelete.id);
      ProjectApiService.clearProjectsCache();
      setProjectToDelete(null);
      const targetPage = projects.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      } else {
        fetchProjects(targetPage, true);
      }
    } catch (err: any) {
      setDeleteProjectError(err.message || 'Failed to delete project.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > pagination.totalPages) return;
    setCurrentPage(newPage);
    if (projectsGridRef.current) {
      projectsGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    const total = pagination.totalPages;
    const current = pagination.page;
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      try {
        const savedUser = localStorage.getItem('retroflow_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));
      } catch {}
    }
  }, [user]);

  const displayedProjects = projects;

  if (isLoading) {
    return <ProjectsTabSkeleton />;
  }

  // Only Workspace Admins and Managers have project initialization permission
  const activeUser = user || currentUser;
  const userRole = (activeUser?.role || '').toLowerCase();
  const userEmail = activeUser?.email?.toLowerCase().trim();
  const userProjectRole = ((activeUser as any)?.projectRole || '').toLowerCase();

  const isWorkspaceAdmin = Boolean(
    isAdmin ||
    userRole === 'admin'
  );

  const isManager = Boolean(
    isWorkspaceAdmin ||
    userProjectRole === 'manager' ||
    userRole === 'manager' ||
    userRole.includes('manager')
  );

  const canCreateProject = isWorkspaceAdmin || isManager;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#5cb028] via-[#52a622] to-[#458b1b] text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:from-[#0e1015] dark:via-[#0e1015] dark:to-[#0e1015] dark:border dark:border-white/[0.08] dark:shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-white/10 dark:bg-[#88c958]/10 rounded-full blur-2xl dark:blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 dark:bg-[#88c958]/10 dark:text-[#88c958] dark:border-[#88c958]/25 shadow-2xs">
              {isAdmin ? 'Admin Supervision' : canCreateProject ? 'Lead / Management' : 'My Projects'}
            </span>
            <span className="text-xs text-white/90 dark:text-slate-400">
              • {tabCounts.all || pagination.totalItems} {isAdmin || canCreateProject ? 'Workspace Projects' : 'Assigned Projects'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:font-black">
            {isAdmin
              ? 'Enterprise Project & Sprint Delivery'
              : canCreateProject
              ? 'Agile Projects & Sprints'
              : 'My Projects & Sprints'}
          </h2>
          <p className="text-xs text-white/90 dark:text-slate-400 max-w-xl leading-relaxed">
            {isAdmin
              ? 'Complete organization supervisory view across all Scrum sprints, velocity metrics, and retrospectives.'
              : canCreateProject
              ? 'Manage your agile initiatives, initialize new projects, and track sprint execution.'
              : `Showing initiatives where your account (${currentUser?.email || 'logged in user'}) is registered as Manager or member.`}
          </p>
        </div>

        {canCreateProject && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="relative z-10 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#3d8318] text-xs font-bold shadow-md transition-all hover:scale-[1.02] cursor-pointer shrink-0 dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_16px_rgba(136,201,88,0.25)] dark:hover:shadow-[0_0_24px_rgba(136,201,88,0.4)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5] text-[#5cb028] dark:text-[#08090a]" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* View Filter Switcher Bar */}
      <div ref={projectsGridRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] rounded-xl w-fit">
          <button
            type="button"
            onClick={() => {
              if (selectedFilter !== 'all') {
                setSelectedFilter('all');
                setCurrentPage(1);
                fetchProjects(1, true, 'all');
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-[#141720] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Projects ({tabCounts.all || 0})
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedFilter !== 'archived') {
                setSelectedFilter('archived');
                setCurrentPage(1);
                fetchProjects(1, true, 'archived');
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'archived'
                ? 'bg-white dark:bg-[#141720] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived ({tabCounts.archived || 0})</span>
          </button>
        </div>

        {isFilterLoading ? (
          <div className="h-4 w-36 rounded bg-slate-200/80 dark:bg-slate-700/80 animate-pulse" />
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Showing <strong className="text-slate-700 dark:text-slate-300">{projects.length}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-300">{pagination.totalItems}</strong>{' '}
            {selectedFilter === 'archived' ? 'archived initiatives' : 'active initiatives'}
          </p>
        )}
      </div>

      {/* Projects Grid */}
      {isFilterLoading ? (
        <ProjectCardsSkeleton count={displayedProjects.length > 0 ? Math.min(displayedProjects.length, 3) : 3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {displayedProjects.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#eaf5e3] dark:bg-[#5cb028]/15 text-[#3d8318] dark:text-[#5cb028] flex items-center justify-center font-bold mx-auto shadow-2xs">
                <Lock className="w-6 h-6 text-[#5cb028]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {canCreateProject
                    ? 'No Projects in Workspace'
                    : 'No Assigned Projects'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {canCreateProject
                    ? 'Initialize your first Scrum or Kanban agile delivery project above.'
                    : `You haven't been assigned to any project yet. Only projects where your email (${
                        currentUser?.email || 'your account'
                      }) is added will appear here.`}
                </p>
              </div>
              {!canCreateProject && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Contact your workspace Administrator or Manager to get invited to active projects.
                </p>
              )}
            </div>
          ) : (
          displayedProjects.map((project) => {
            const activeSprint =
              project.activeSprint ||
              (project.sprints || []).find((s) => s.status === 'active') ||
              (project.sprints || [])[0];

            const userEmail = currentUser?.email?.toLowerCase().trim();
            // Resolve designated project manager
            const managerMember = project.members?.find(
              (m) => (m.role || '').toLowerCase() === 'manager'
            );
            const managerName = managerMember?.name || project.lead?.name || 'Gopal';
            const managerEmail = (managerMember?.email || project.lead?.email || '').toLowerCase().trim();
            const managerAvatar = managerMember?.avatar || project.lead?.avatar || 'M';

            const isCurrentLead = Boolean(
              userEmail &&
                (managerEmail === userEmail ||
                  project.lead?.email?.toLowerCase().trim() === userEmail ||
                  project.members?.some(
                    (m) => m.email?.toLowerCase().trim() === userEmail && (m.role || '').toLowerCase() === 'manager'
                  ))
            );

            return (
              <div
                key={project.id}
                className={`p-6 rounded-2xl bg-white dark:bg-[#0e1015] border shadow-xs hover:shadow-xl dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.8)] transition-all flex flex-col justify-between space-y-5 group ${
                  isCurrentLead
                    ? 'border-[#88c958]/60 ring-1 ring-[#88c958]/20'
                    : 'border-slate-200/90 dark:border-white/[0.08] hover:border-[#88c958]/40 dark:hover:border-[#88c958]/40'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Top: Key, Name & Health */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar name={project.name} avatar={project.key} size="lg" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#88c958] transition-colors truncate">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          <span>{project.key}</span>
                          {project.isArchived && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {project.createdAt && formatProjectCreatedDate(project.createdAt) && (
                      <div className="shrink-0">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-tight"
                          title={`Project created on ${formatProjectCreatedDate(project.createdAt)}`}
                        >
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{formatProjectCreatedDate(project.createdAt)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dedicated Manager Identity Row */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/90 dark:bg-[#12151c] border border-slate-200/60 dark:border-white/[0.08]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#5cb028] via-[#52a622] to-[#6ec437] text-white dark:from-[#88c958] dark:to-[#6ea347] dark:text-[#08090a] font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        {managerAvatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                          Manager
                        </p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {managerName}
                        </p>
                      </div>
                    </div>

                    {managerEmail && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[140px]">
                        {managerEmail}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                {/* Active Sprint Highlights */}
                {activeSprint ? (
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#12151c] border border-slate-200/70 dark:border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {activeSprint.name.split(' - ')[0]}
                      </span>
                      <span className="text-[10px] font-bold text-[#88c958]">
                        {activeSprint.daysLeft} days left
                      </span>
                    </div>

                    <ProgressBar
                      value={activeSprint.completedStoryPoints}
                      max={activeSprint.totalStoryPoints || 1}
                      variant="emerald"
                      size="sm"
                    />

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                      <span>Sprint Progress</span>
                      <span className="font-semibold text-[#88c958]">
                        {Math.round(
                          (activeSprint.completedStoryPoints / (activeSprint.totalStoryPoints || 1)) *
                            100
                        )}
                        % complete
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#12151c] border border-dashed border-slate-200 dark:border-white/[0.08] text-center">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">No active sprint</span>
                  </div>
                )}

                {/* Project Stats Footer */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.08] text-center">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#12151c]">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Sprints</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {project.sprints.length}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#12151c]">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Retros</span>
                    <span className="text-xs font-bold text-[#88c958]">
                      {project.retrospectives.length}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#12151c]">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">Members</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {project.members.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full">
                {project.isArchived ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRestoreProject(project.id);
                      }}
                      disabled={restoringProjectId === project.id}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {restoringProjectId === project.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>{restoringProjectId === project.id ? 'Restoring...' : 'Restore Project'}</span>
                    </button>
                    <Link
                      href={`/projects/${project.id}`}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 shrink-0"
                      title="View Read-Only Project Dashboard"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/projects/${project.id}`}
                    onClick={() => {
                      setOpeningProjectId(project.id);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('retroflow_active_project_id', project.id);
                        localStorage.setItem('retroflow_cached_active_project', JSON.stringify(project));
                        try {
                          sessionStorage.setItem(`retroflow_cached_project_${project.id}`, JSON.stringify(project));
                        } catch {}
                        window.dispatchEvent(new CustomEvent('retroflow_active_project_changed', { detail: project }));
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-all shadow-xs hover:scale-[1.01] cursor-pointer disabled:opacity-75 dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a] dark:font-black dark:shadow-md dark:shadow-[#88c958]/20"
                  >
                    {openingProjectId === project.id ? (
                      <span className="inline-flex items-center gap-2 animate-pulse">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white dark:border-[#08090a]/30 dark:border-t-[#08090a] rounded-full animate-spin" />
                        <span>Opening Dashboard...</span>
                      </span>
                    ) : (
                      <>
                        <span>Open Project Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Link>
                )}
              </div>
            </div>
          );
        })
      )}
      </div>
      )}

      {/* Enterprise-grade 6-Item Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 border-t border-slate-200/90 dark:border-white/[0.08]">
          {/* Pagination Counter Info */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.totalItems)}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
            </span>{' '}
            of <span className="font-bold text-slate-900 dark:text-white">{pagination.totalItems}</span> initiatives
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* Previous Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage || isFilterLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Numeric Page Buttons */}
            {getPageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 dark:text-slate-500 font-bold select-none">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => handlePageChange(Number(p))}
                  disabled={isFilterLoading}
                  className={`min-w-[34px] h-[34px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    p === pagination.page
                      ? 'bg-[#5cb028] text-white shadow-xs dark:bg-[#88c958] dark:text-[#08090a] dark:font-black dark:shadow-[0_0_10px_rgba(136,201,88,0.25)]'
                      : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage || isFilterLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newProj) => {
          ProjectApiService.clearProjectsCache();
          fetchProjects(1);
          if (typeof window !== 'undefined' && newProj) {
            localStorage.setItem('retroflow_active_project_id', newProj.id);
            localStorage.setItem('retroflow_cached_active_project', JSON.stringify(newProj));
            try {
              sessionStorage.setItem(`retroflow_cached_project_${newProj.id}`, JSON.stringify(newProj));
            } catch {}
            window.dispatchEvent(new CustomEvent('retroflow_active_project_changed', { detail: newProj }));
          }
          router.push(`/projects/${newProj.id}`);
        }}
      />

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <Modal
          isOpen={!!projectToDelete}
          onClose={() => {
            if (!isDeletingProject) setProjectToDelete(null);
          }}
          title="Delete Project?"
          description="Permanently delete project and all associated sprint boards"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProject}
                onClick={handleDeleteProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingProject ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingProject ? 'Deleting...' : 'Delete Project'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/90 dark:border-rose-900/50 text-rose-950 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                Are you sure you want to delete <strong>{projectToDelete.name}</strong> ({projectToDelete.key})?
              </p>
            </div>

            {deleteProjectError && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium">
                {deleteProjectError}
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Once deleted, all {projectToDelete.sprints.length} sprints, backlog action items, and retrospectives in this project will be permanently wiped. This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsTab;
