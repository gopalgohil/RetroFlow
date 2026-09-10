'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronDown,
  Search,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { UserAvatar, StatusPill } from '@/components/ui';

interface ProjectSwitcherProps {
  currentProjectId?: string;
  onSelectProject?: (project: Project) => void;
  className?: string;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  currentProjectId,
  onSelectProject,
  className = '',
}) => {
  const router = useRouter();
  const params = useParams();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('retroflow_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);

  // Active project resolution
  const resolvedProjectId =
    currentProjectId ||
    (params?.projectId as string) ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('retroflow_active_project_id')
      : null) ||
    'proj-pgi';

  useEffect(() => {
    let isMounted = true;
    // Live REST API request -> visible in browser Network tab!
    ProjectApiService.getProjects()
      .then((list) => {
        if (isMounted && list && list.length > 0) {
          setProjects(list);
          list.forEach((p) => {
            try {
              sessionStorage.setItem(`retroflow_cached_project_${p.id}`, JSON.stringify(p));
            } catch {}
          });
        } else if (isMounted) {
          const fallbackList = ProjectDataService.getProjects();
          setProjects(fallbackList);
          fallbackList.forEach((p) => {
            try {
              sessionStorage.setItem(`retroflow_cached_project_${p.id}`, JSON.stringify(p));
            } catch {}
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallbackList = ProjectDataService.getProjects();
          setProjects(fallbackList);
          fallbackList.forEach((p) => {
            try {
              sessionStorage.setItem(`retroflow_cached_project_${p.id}`, JSON.stringify(p));
            } catch {}
          });
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

  const activeProject =
    projects.find(
      (p) =>
        p.id === resolvedProjectId || p.key.toLowerCase() === resolvedProjectId.toLowerCase()
    ) ||
    projects[0] ||
    null;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Option B: Admin + Project Leads / Managers have permission to initialize new projects
  const userEmail = currentUser?.email?.toLowerCase().trim();
  const isAdmin =
    currentUser?.role?.toLowerCase() === 'admin' ||
    userEmail === 'gopalgohel249@gmail.com' ||
    Boolean(userEmail?.includes('admin'));
  const isManagerOrLead =
    isAdmin ||
    currentUser?.role?.toLowerCase() === 'manager' ||
    currentUser?.role?.toLowerCase() === 'lead' ||
    projects.some(
      (p) =>
        p.lead?.email?.toLowerCase().trim() === userEmail ||
        p.members?.some((m) => m.email?.toLowerCase().trim() === userEmail && m.role === 'Manager')
    );

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
          title="Switch active agile project"
        >
          {/* Project Avatar */}
          <UserAvatar
            name={activeProject?.name || 'PGI'}
            avatar={activeProject?.key.slice(0, 3) || 'PGI'}
            size="sm"
          />

          <div className="flex flex-col min-w-0 max-w-[150px] sm:max-w-[200px]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                {activeProject?.name || 'Payment Gateway Integration'}
              </span>
              {activeProject && (
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                  {activeProject.key}
                </span>
              )}
            </div>
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
                  {isAdmin ? 'Agile Projects' : 'My Projects'} ({projects.length})
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
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching projects found
                </div>
              ) : (
                filteredProjects.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate max-w-[150px]">{proj.name}</p>
                            <StatusPill status={proj.healthStatus} pulse />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono font-semibold uppercase">{proj.key}</span>
                            <span>•</span>
                            <span className="capitalize">{proj.type}</span>
                            <span>•</span>
                            <span>{proj.members.length} members</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 stroke-[2.5] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Footer Action: + New Project CTA (Admin & Project Leads only) */}
            {isManagerOrLead && (
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
