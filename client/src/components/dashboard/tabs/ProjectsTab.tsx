'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { CreateProjectModal } from '@/components/project/CreateProjectModal';
import { UserAvatar, StatusPill, ProgressBar } from '@/components/ui';

interface ProjectsTabProps {
  isAdmin?: boolean;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ isAdmin = true }) => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'managed'>('all');

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('retroflow_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {}
  }, []);

  const fetchProjects = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Live REST API request -> visible in browser Network tab!
      const list = await ProjectApiService.getProjects();
      setProjects(list || []);
    } catch (err) {
      console.warn('[ProjectsTab] Live API request fallback:', err);
      const fallback = ProjectDataService.getProjects();
      setProjects(fallback || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, isCreateModalOpen]);

  const myManagedProjects = projects.filter((p) => {
    const userEmail = currentUser?.email?.toLowerCase().trim();
    if (!userEmail) return false;
    const isDirectLead = p.lead?.email?.toLowerCase().trim() === userEmail;
    const isManagerMember = p.members?.some(
      (m) => m.email?.toLowerCase().trim() === userEmail && m.role === 'Manager'
    );
    return isDirectLead || isManagerMember;
  });

  const displayedProjects = filterMode === 'managed' ? myManagedProjects : projects;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {isAdmin ? 'Admin Supervision' : 'My Initiatives'}
            </span>
            <span className="text-xs text-slate-300">
              • {projects.length} {isAdmin ? 'Workspace Projects' : 'Assigned Projects'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {isAdmin ? 'Enterprise Project & Sprint Delivery' : 'Assigned Agile Projects'}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {isAdmin
              ? 'Complete organization supervisory view across all Scrum sprint cadences, velocity metrics, and retrospectives.'
              : `Showing initiatives where your account (${currentUser?.email || 'logged in user'}) is registered as Project Lead or member.`}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* View Filter Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Projects ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('managed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'managed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👑 Managed by Me</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                myManagedProjects.length > 0
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {myManagedProjects.length}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Showing <strong className="text-slate-700">{displayedProjects.length}</strong> active initiatives
        </p>
      </div>

      {/* Loading Skeleton during real Network API request */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-slate-200 rounded" />
                    <div className="w-16 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
              <div className="h-10 bg-slate-50 rounded-xl" />
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded" />
                <div className="w-2/3 h-3 bg-slate-100 rounded" />
              </div>
              <div className="h-16 bg-slate-50 rounded-xl" />
              <div className="h-9 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs">
                {filterMode === 'managed' ? '👑' : '🔒'}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {filterMode === 'managed'
                    ? 'No Projects Managed by You'
                    : isAdmin
                    ? 'No Projects in Workspace'
                    : 'No Assigned Projects'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filterMode === 'managed'
                    ? 'You are not assigned as Project Lead for any project yet.'
                    : isAdmin
                    ? 'Initialize your first Scrum or Kanban agile delivery project above.'
                    : `You haven't been assigned to any project yet. Only projects where your email (${
                        currentUser?.email || 'your account'
                      }) is added will appear here.`}
                </p>
              </div>
              {!isAdmin && filterMode !== 'managed' && (
                <p className="text-[11px] text-slate-400">
                  Contact your workspace Administrator to get invited to active projects.
                </p>
              )}
            </div>
          ) : (
          displayedProjects.map((project) => {
            const activeSprint =
              project.activeSprint ||
              project.sprints.find((s) => s.status === 'active') ||
              project.sprints[0];

            const userEmail = currentUser?.email?.toLowerCase().trim();
            const isCurrentLead = Boolean(
              userEmail &&
                (project.lead?.email?.toLowerCase().trim() === userEmail ||
                  project.members?.some(
                    (m) => m.email?.toLowerCase().trim() === userEmail && m.role === 'Manager'
                  ))
            );

            return (
              <div
                key={project.id}
                className={`p-6 rounded-2xl bg-white border shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5 group ${
                  isCurrentLead
                    ? 'border-indigo-300/80 ring-1 ring-indigo-500/20'
                    : 'border-slate-200/90 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Top: Key, Name & Health */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={project.name} avatar={project.key} size="lg" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{project.key}</span>
                          <span>•</span>
                          <span className="capitalize">{project.type}</span>
                        </div>
                      </div>
                    </div>

                    <StatusPill status={project.healthStatus} pulse />
                  </div>

                  {/* Dedicated Project Lead Identity Row */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        {project.lead?.avatar || 'PL'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                          Project Lead
                        </p>
                        <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                          {project.lead?.name || 'Gopal Gohel'}
                        </p>
                      </div>
                    </div>

                    {isCurrentLead ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0 shadow-2xs">
                        <span>👑</span>
                        <span>You are Lead</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                        {project.lead?.email}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                {/* Active Sprint Highlights */}
                {activeSprint && (
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {activeSprint.name.split(' - ')[0]}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600">
                        {activeSprint.daysLeft} days left
                      </span>
                    </div>

                    <ProgressBar
                      value={activeSprint.completedStoryPoints}
                      max={activeSprint.totalStoryPoints || 1}
                      variant="indigo"
                      size="sm"
                    />

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Sprint Progress</span>
                      <span className="font-semibold text-indigo-600">
                        {Math.round(
                          (activeSprint.completedStoryPoints / (activeSprint.totalStoryPoints || 1)) *
                            100
                        )}
                        % complete
                      </span>
                    </div>
                  </div>
                )}

                {/* Project Stats Footer */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-medium">Sprints</span>
                    <span className="text-xs font-bold text-slate-800">
                      {project.sprints.length}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-medium">Retros</span>
                    <span className="text-xs font-bold text-indigo-600">
                      {project.retrospectives.length}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-medium">Members</span>
                    <span className="text-xs font-bold text-slate-800">
                      {project.members.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/projects/${project.id}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-2xs group-hover:shadow-xs cursor-pointer"
              >
                <span>Open Project Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })
      )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newProj) => {
          fetchProjects();
          router.push(`/projects/${newProj.id}`);
        }}
      />
    </div>
  );
};

export default ProjectsTab;
