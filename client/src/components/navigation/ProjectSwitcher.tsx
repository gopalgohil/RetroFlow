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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    email?: string;
    name?: string;
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        const saved = localStorage.getItem('retroflow_user');
        if (saved) setCurrentUser(JSON.parse(saved));
      } catch {}
    };
    syncUser();
    window.addEventListener('focus', syncUser);
    return () => window.removeEventListener('focus', syncUser);
  }, [isOpen]);

  // Active project resolution
  const resolvedProjectId =
    currentProjectId ||
    (params?.projectId as string) ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('retroflow_active_project_id')
      : null) ||
    '';

  useEffect(() => {
    let isMounted = true;
    // Live REST API request -> visible in browser Network tab!
    ProjectApiService.getProjects(true)
      .then((list) => {
        if (isMounted) {
          setProjects(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProjects([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isCreateModalOpen]);

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

  const allProjects = React.useMemo(() => {
    if (currentProject && !projects.some((p) => p.id === currentProject.id || p.key.toLowerCase() === currentProject.key.toLowerCase())) {
      return [currentProject, ...projects];
    }
    return projects;
  }, [projects, currentProject]);

  const activeProject =
    (currentProject &&
      (currentProject.id === resolvedProjectId ||
        currentProject.key.toLowerCase() === resolvedProjectId.toLowerCase())
      ? currentProject
      : null) ||
    allProjects.find(
      (p) =>
        p.id === resolvedProjectId || p.key.toLowerCase() === resolvedProjectId.toLowerCase()
    ) ||
    currentProject ||
    allProjects[0] ||
    null;

  const filteredProjects = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Admin + Managers have permission to initialize new projects
  const effectiveUser = user || currentUser;
  const userEmail = effectiveUser?.email?.toLowerCase().trim();
  const userRole = (effectiveUser?.role || '').toLowerCase();
  const userProjectRole = (effectiveUser?.projectRole || '').toLowerCase();
  const isAdmin =
    userRole === 'admin' ||
    (userEmail && userEmail === 'gopalgohel249@gmail.com');
  const isManager =
    isAdmin ||
    userProjectRole === 'manager' ||
    userRole === 'manager' ||
    userRole.includes('manager');
  const canCreateProject = isManager;
  const activeManager = getProjectManager(activeProject);

  const handleSelect = (project: Project) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('retroflow_active_project_id', project.id);
      try {
        sessionStorage.setItem(`retroflow_cached_project_${project.id}`, JSON.stringify(project));
      } catch {}
    }
    if (onSelectProject) {
      onSelectProject(project);
    } else {
      router.push(`/projects/${project.id}`);
    }
    setIsOpen(false);
  };

  const handleProjectCreated = (newProj: Project) => {
    try {
      sessionStorage.setItem(`retroflow_cached_project_${newProj.id}`, JSON.stringify(newProj));
    } catch {}
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === newProj.id);
      return exists ? prev.map((p) => (p.id === newProj.id ? newProj : p)) : [...prev, newProj];
    });
    ProjectApiService.getProjects()
      .then((list) => {
        if (list && list.length > 0) setProjects(list);
      })
      .catch(() => {});
    handleSelect(newProj);
  };

  return (
    <>
      <div className={`relative ${className}`} ref={containerRef}>
        {/* Switcher Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all text-left cursor-pointer ${
            isOpen
              ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white/80 hover:bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
          }`}
          title={activeProject ? `Active Project: ${activeProject.name}` : 'Select agile project'}
        >
          {/* Project Avatar or Neutral Agile Icon */}
          {activeProject ? (
            <UserAvatar
              name={activeProject.name}
              avatar={activeProject.key.slice(0, 3)}
              size="sm"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex flex-col min-w-0 max-w-[160px] sm:max-w-[220px]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
              {activeProject && (
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                  {activeProject.key}
                </span>
              )}
            </div>
            {activeProject && activeManager && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate mt-0.5">
                <span className="text-indigo-600 font-bold">{activeManager.role}:</span>
                <span className="truncate text-slate-700 font-medium">{activeManager.name}</span>
              </div>
            )}
          </div>

          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Search */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  My Projects ({allProjects.length})
                </span>
                <span className="text-[10px] font-semibold text-indigo-600">RetroFlow Pro</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or key..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FolderKanban className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">
                      {searchQuery ? 'No matching projects found' : 'No projects in workspace'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-tight">
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
                          ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-950'
                          : 'hover:bg-slate-50 border border-transparent text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={proj.name} avatar={proj.key.slice(0, 3)} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold truncate max-w-[130px]">{proj.name}</p>
                            <StatusPill status={proj.healthStatus} pulse />
                            {projManager && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                {projManager.role}: {projManager.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono font-semibold uppercase text-slate-700">{proj.key}</span>
                            <span>•</span>
                            <span className="capitalize">{proj.type}</span>
                            <span>•</span>
                            <span>{proj.members.length} members</span>
                            {projManager && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-medium">
                                  {projManager.role}: <strong className="font-semibold text-slate-800">{projManager.name}</strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 stroke-[2.5] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Action: + New Project CTA (Admin & Managers only) */}
            {canCreateProject && (
              <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
