'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronDown,
  Search,
  Plus,
  Check,
  X,
  FolderKanban,
} from 'lucide-react';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { UserAvatar, StatusPill } from '@/components/ui';

interface ProjectSwitcherProps {
  currentProjectId?: string;
  currentProject?: Project | null;
  onSelectProject?: (project: Project) => void;
  className?: string;
  user?: { name?: string; email?: string; role?: string; projectRole?: string } | null;
}

const getProjectManager = (proj: Project | null | undefined) => {
  if (!proj) return null;
  // 1. Explicit Manager member
  const managerMember = proj.members?.find((m) => (m.role || '').toLowerCase() === 'manager');
  if (managerMember?.name) return { name: managerMember.name, role: 'Manager' };

  // 2. Project Lead member
  const leadMember = proj.members?.find((m) => (m.role || '').toLowerCase().includes('lead'));
  if (leadMember?.name) return { name: leadMember.name, role: 'Lead' };

  // 3. Fall back to proj.lead
  if (proj.lead?.name) return { name: proj.lead.name, role: 'Lead' };

  return null;
};

const isUserMemberOfProject = (
  proj: Project | null | undefined,
  targetUser: { id?: string; _id?: string; email?: string; role?: string } | null | undefined
): boolean => {
  if (!proj || !targetUser) return false;
  const userRole = (targetUser.role || '').toLowerCase();
  const userEmail = (targetUser.email || '').toLowerCase().trim();
  const userId = targetUser.id || targetUser._id;
  if (userRole === 'admin') return true;
  if (!userEmail && !userId) return false;

  // 1. Check if user is the assigned Project Lead
  if (userEmail && proj.lead?.email?.toLowerCase().trim() === userEmail) return true;

  // 2. Check if user is the Project Creator
  const creatorId = typeof proj.createdBy === 'object' ? (proj.createdBy as any)?._id || (proj.createdBy as any)?.id : proj.createdBy;
  const creatorEmail = typeof proj.createdBy === 'object' ? (proj.createdBy as any)?.email?.toLowerCase().trim() : null;
  if (userId && creatorId && String(creatorId) === String(userId)) return true;
  if (userEmail && creatorEmail && creatorEmail === userEmail) return true;

  // 3. Check if user is an assigned team member
  return (proj.members || []).some((m) => (m.email || '').toLowerCase().trim() === userEmail);
};

const STORAGE_ACTIVE_PROJ_ID = 'retroflow_active_project_id';
const STORAGE_CACHED_ACTIVE_PROJ = 'retroflow_cached_active_project';
const STORAGE_CACHED_PROJS_LIST = 'retroflow_cached_projects_list';
const EVENT_ACTIVE_PROJ_CHANGED = 'retroflow_active_project_changed';

const getInitialActiveProject = (): Project | null => {
  if (typeof window === 'undefined') return null;
  try {
    const userRaw = localStorage.getItem('retroflow_user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    // 1. Direct active project cache
    const saved = localStorage.getItem(STORAGE_CACHED_ACTIVE_PROJ);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.id || parsed.name) && isUserMemberOfProject(parsed, user)) {
        return parsed;
      }
    }

    // 2. Check active project ID and match session/local cache
    const storedId = localStorage.getItem(STORAGE_ACTIVE_PROJ_ID);
    if (storedId) {
      const byId =
        sessionStorage.getItem(`retroflow_cached_project_${storedId}`) ||
        localStorage.getItem(`retroflow_cached_project_${storedId}`);
      if (byId) {
        const parsed = JSON.parse(byId);
        if (parsed && (parsed.id || parsed.name) && isUserMemberOfProject(parsed, user)) {
          return parsed;
        }
      }
    }

    // 3. Fallback to first project in cached project list
    const savedList = localStorage.getItem(STORAGE_CACHED_PROJS_LIST);
    if (savedList) {
      const parsedList = JSON.parse(savedList);
      if (Array.isArray(parsedList) && parsedList.length > 0) {
        const accessible = (!user || user.role === 'admin')
          ? parsedList
          : parsedList.filter((p: Project) => isUserMemberOfProject(p, user));
        if (accessible.length > 0) {
          if (storedId) {
            const match = accessible.find(
              (p: Project) => p.id === storedId || p.key?.toLowerCase() === storedId.toLowerCase()
            );
            if (match) return match;
          }
          return accessible[0];
        }
      }
    }
  } catch {}
  return null;
};

const getInitialProjects = (): Project[] => {
  if (typeof window === 'undefined') return [];
  try {
    const userRaw = localStorage.getItem('retroflow_user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const savedList = localStorage.getItem(STORAGE_CACHED_PROJS_LIST);
    if (savedList) {
      const parsedList = JSON.parse(savedList);
      if (Array.isArray(parsedList) && parsedList.length > 0) {
        if (!user || user.role === 'admin') return parsedList;
        return parsedList.filter((p: Project) => isUserMemberOfProject(p, user));
      }
    }
  } catch {}
  return [];
};

const getInitialActiveProjectId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_ACTIVE_PROJ_ID) || null;
  } catch {
    return null;
  }
};

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('retroflow_user');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  currentProjectId,
  currentProject,
  onSelectProject,
  className = '',
  user,
}) => {
  const router = useRouter();
  const params = useParams();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);
  const [cachedActiveProject, setCachedActiveProject] = useState<Project | null>(getInitialActiveProject);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    email?: string;
    name?: string;
    role?: string;
    projectRole?: string;
  } | null>(getInitialUser);
  const [activeStoredProjectId, setActiveStoredProjectId] = useState<string | null>(getInitialActiveProjectId);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync storage & cross-tab events
  useEffect(() => {
    const syncStorage = () => {
      try {
        const storedProj = localStorage.getItem(STORAGE_CACHED_ACTIVE_PROJ);
        if (storedProj) {
          const parsed = JSON.parse(storedProj);
          if (parsed?.id) setCachedActiveProject(parsed);
        }
        const storedId = localStorage.getItem(STORAGE_ACTIVE_PROJ_ID);
        if (storedId) setActiveStoredProjectId(storedId);

        const savedUser = localStorage.getItem('retroflow_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        // Re-sync projects list so newly created projects appear in the dropdown immediately
        ProjectApiService.getProjects(true)
          .then((list) => {
            if (Array.isArray(list)) {
              setProjects(list);
            }
          })
          .catch(() => {});
      } catch {}
    };

    syncStorage();
    window.addEventListener('storage', syncStorage);
    window.addEventListener(EVENT_ACTIVE_PROJ_CHANGED, syncStorage);
    window.addEventListener('focus', syncStorage);

    return () => {
      window.removeEventListener('storage', syncStorage);
      window.removeEventListener(EVENT_ACTIVE_PROJ_CHANGED, syncStorage);
      window.removeEventListener('focus', syncStorage);
    };
  }, [isOpen]);

  // Active project resolution
  const resolvedProjectId =
    currentProjectId ||
    (params?.projectId as string) ||
    activeStoredProjectId ||
    '';

  // Admin + Managers permission check
  const effectiveUser = user || currentUser;
  const userEmail = effectiveUser?.email?.toLowerCase().trim();
  const userRole = (effectiveUser?.role || '').toLowerCase();
  const userProjectRole = (effectiveUser?.projectRole || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isManager =
    isAdmin ||
    userProjectRole === 'manager' ||
    userRole === 'manager' ||
    userRole.includes('manager');
  const canCreateProject = isManager;

  // Strict membership filter: developers only see projects they are assigned to
  const accessibleProjects = React.useMemo(() => {
    if (isAdmin) return projects;
    return projects.filter((p) => isUserMemberOfProject(p, effectiveUser));
  }, [projects, isAdmin, effectiveUser]);

  const validatedCachedProject = React.useMemo(() => {
    if (!cachedActiveProject) return null;
    return isUserMemberOfProject(cachedActiveProject, effectiveUser) ? cachedActiveProject : null;
  }, [cachedActiveProject, effectiveUser]);

  const allProjects = React.useMemo(() => {
    let list = [...accessibleProjects];
    if (
      currentProject &&
      isUserMemberOfProject(currentProject, effectiveUser) &&
      !list.some(
        (p) =>
          p.id === currentProject.id ||
          p.key?.toLowerCase() === currentProject.key?.toLowerCase()
      )
    ) {
      list = [currentProject, ...list];
    }
    if (
      validatedCachedProject &&
      list.length > 0 &&
      !list.some(
        (p) =>
          p.id === validatedCachedProject.id ||
          p.key?.toLowerCase() === validatedCachedProject.key?.toLowerCase()
      )
    ) {
      list = [...list, validatedCachedProject];
    }
    return list;
  }, [accessibleProjects, currentProject, validatedCachedProject, effectiveUser]);

  const activeProject =
    (currentProject &&
      isUserMemberOfProject(currentProject, effectiveUser) &&
      (currentProject.id === resolvedProjectId ||
        currentProject.key?.toLowerCase() === resolvedProjectId.toLowerCase())
      ? currentProject
      : null) ||
    allProjects.find(
      (p) =>
        p.id === resolvedProjectId || p.key?.toLowerCase() === resolvedProjectId.toLowerCase()
    ) ||
    (currentProject && isUserMemberOfProject(currentProject, effectiveUser) ? currentProject : null) ||
    (allProjects.length > 0 ? allProjects[0] : null) ||
    null;

  const activeManager = getProjectManager(activeProject);

  // Background sync with live REST API
  useEffect(() => {
    let isMounted = true;
    ProjectApiService.getProjects(true)
      .then((list) => {
        if (!isMounted) return;
        const validList = Array.isArray(list) ? list : [];
        setProjects(validList);

        if (validList.length === 0) {
          // User has NO assigned projects!
          setCachedActiveProject(null);
          setActiveStoredProjectId(null);
          try {
            localStorage.removeItem(STORAGE_CACHED_ACTIVE_PROJ);
            localStorage.removeItem(STORAGE_ACTIVE_PROJ_ID);
            localStorage.removeItem(STORAGE_CACHED_PROJS_LIST);
          } catch {}
          return;
        }

        try {
          localStorage.setItem(STORAGE_CACHED_PROJS_LIST, JSON.stringify(validList));
        } catch {}

        const targetId = resolvedProjectId || activeStoredProjectId || '';
        const matched =
          (targetId ? validList.find((p) => p.id === targetId || p.key?.toLowerCase() === targetId.toLowerCase()) : null) ||
          validList[0] ||
          null;

        if (matched) {
          setCachedActiveProject(matched);
          setActiveStoredProjectId(matched.id);
          try {
            localStorage.setItem(STORAGE_CACHED_ACTIVE_PROJ, JSON.stringify(matched));
            localStorage.setItem(STORAGE_ACTIVE_PROJ_ID, matched.id);
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [resolvedProjectId]);

  // Cache whenever activeProject updates
  useEffect(() => {
    if (activeProject && typeof window !== 'undefined' && isUserMemberOfProject(activeProject, effectiveUser)) {
      try {
        localStorage.setItem(STORAGE_CACHED_ACTIVE_PROJ, JSON.stringify(activeProject));
        if (activeProject.id) {
          localStorage.setItem(STORAGE_ACTIVE_PROJ_ID, activeProject.id);
          sessionStorage.setItem(`retroflow_cached_project_${activeProject.id}`, JSON.stringify(activeProject));
        }
      } catch {}
    }
  }, [activeProject, effectiveUser]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredProjects = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (project: Project) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_PROJ_ID, project.id);
      localStorage.setItem(STORAGE_CACHED_ACTIVE_PROJ, JSON.stringify(project));
      try {
        sessionStorage.setItem(`retroflow_cached_project_${project.id}`, JSON.stringify(project));
      } catch {}
      window.dispatchEvent(new CustomEvent(EVENT_ACTIVE_PROJ_CHANGED, { detail: project }));
    }
    setActiveStoredProjectId(project.id);
    setCachedActiveProject(project);

    if (onSelectProject) {
      onSelectProject(project);
    } else {
      router.push(`/projects/${project.id}`);
    }
    setIsOpen(false);
  };

  const handleProjectCreated = (newProj: Project) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`retroflow_cached_project_${newProj.id}`, JSON.stringify(newProj));
        localStorage.setItem(STORAGE_CACHED_ACTIVE_PROJ, JSON.stringify(newProj));
        localStorage.setItem(STORAGE_ACTIVE_PROJ_ID, newProj.id);
      } catch {}
      window.dispatchEvent(new CustomEvent(EVENT_ACTIVE_PROJ_CHANGED, { detail: newProj }));
    }
    setActiveStoredProjectId(newProj.id);
    setCachedActiveProject(newProj);
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === newProj.id);
      const next = exists ? prev.map((p) => (p.id === newProj.id ? newProj : p)) : [...prev, newProj];
      try {
        localStorage.setItem(STORAGE_CACHED_PROJS_LIST, JSON.stringify(next));
      } catch {}
      return next;
    });
    ProjectApiService.getProjects()
      .then((list) => {
        if (list && list.length > 0) {
          setProjects(list);
          try {
            localStorage.setItem(STORAGE_CACHED_PROJS_LIST, JSON.stringify(list));
          } catch {}
        }
      })
      .catch(() => {});
    handleSelect(newProj);
  };

  if (!isMounted) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-[#12151c]/80 shadow-2xs select-none">
          <div className="w-7 h-7 rounded-lg bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 flex items-center justify-center shrink-0">
            <FolderKanban className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958] opacity-60 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1 min-w-[100px] sm:min-w-[130px]">
            <div className="h-3 w-20 bg-slate-200/80 dark:bg-white/[0.1] rounded animate-pulse" />
            <div className="h-2 w-14 bg-slate-200/50 dark:bg-white/[0.05] rounded animate-pulse" />
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 opacity-40" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        {/* Switcher Trigger Button */}
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-left cursor-pointer ${
            isOpen
              ? 'bg-white dark:bg-[#12151c] border-[#88c958] ring-2 ring-[#88c958]/20 shadow-xs'
              : 'bg-white/80 dark:bg-[#12151c]/80 hover:bg-white dark:hover:bg-[#12151c] border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.18] shadow-2xs'
          }`}
          title={activeProject ? `Active Project: ${activeProject.name}` : 'Select agile project'}
        >
          {/* Project Avatar or Neutral Agile Icon */}
          <div suppressHydrationWarning className="shrink-0">
            {activeProject ? (
              <UserAvatar
                name={activeProject.name}
                avatar={activeProject.key?.slice(0, 3)}
                size="sm"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#eaf5e3] dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#3d8318] dark:text-[#88c958] flex items-center justify-center shrink-0">
                <FolderKanban className="w-3.5 h-3.5 text-[#5cb028] dark:text-[#88c958]" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 max-w-[160px] sm:max-w-[220px]">
            <div className="flex items-center gap-1.5">
              <span suppressHydrationWarning className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
              {activeProject && (
                <span suppressHydrationWarning className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-[#181b24] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]">
                  {activeProject.key}
                </span>
              )}
            </div>
            {activeProject && activeManager && (
              <div suppressHydrationWarning className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                <span className="text-[#3d8318] dark:text-[#88c958] font-bold">{activeManager.role}:</span>
                <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{activeManager.name}</span>
              </div>
            )}
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-[#88c958]' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl dark:shadow-black/70 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Search */}
            <div className="p-3 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#12151c]/70 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  My Projects ({allProjects.length})
                </span>
                <span className="text-[10px] font-semibold text-[#3d8318] dark:text-[#88c958]">RetroFlow Pro</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#88c958]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Clear filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Projects */}
            <div className="p-1.5 max-h-64 overflow-y-auto space-y-1">
              {filteredProjects.length === 0 ? (
                <div className="py-7 px-4 text-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#12151c] text-slate-400 flex items-center justify-center mx-auto border border-transparent dark:border-white/[0.08]">
                    <FolderKanban className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {searchQuery ? 'No matching projects found' : 'No projects in workspace'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto leading-tight">
                      {searchQuery
                        ? 'Try searching with a different name or key'
                        : canCreateProject
                        ? 'Initialize your first agile initiative below'
                        : 'No agile projects have been assigned yet'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredProjects.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
                  const projManager = getProjectManager(proj);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleSelect(proj)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#eaf5e3]/80 dark:bg-[#88c958]/15 border border-[#cdeac0] dark:border-[#88c958]/30 text-[#1e4809] dark:text-[#88c958]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={proj.name} avatar={proj.key.slice(0, 3)} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold truncate max-w-[130px]">{proj.name}</p>
                            <StatusPill status={proj.healthStatus} pulse />
                            {projManager && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#eaf5e3] dark:bg-[#88c958]/15 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30">
                                {projManager.role}: {projManager.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span className="font-mono font-semibold uppercase text-slate-700 dark:text-slate-300">{proj.key}</span>
                            <span>•</span>
                            <span className="capitalize">{proj.type}</span>
                            <span>•</span>
                            <span>{proj.members.length} members</span>
                            {projManager && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 dark:text-slate-400 font-medium">
                                  {projManager.role}: <strong className="font-semibold text-slate-800 dark:text-slate-200">{projManager.name}</strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-[#5cb028] dark:text-[#88c958] stroke-[2.5] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Action: + New Project CTA (Admin & Managers only) */}
            {canCreateProject && (
              <div className="p-2 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#12151c]/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold transition-all shadow-xs cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#96dc63] dark:text-[#08090a]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create New Project</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
};

export default ProjectSwitcher;
