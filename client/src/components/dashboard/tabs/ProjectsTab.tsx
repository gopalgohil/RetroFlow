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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Live REST API request -> visible in browser Network tab!
    ProjectApiService.getProjects()
      .then((list) => {
        if (isMounted && list && list.length > 0) {
          setProjects(list);
        } else if (isMounted) {
          setProjects(ProjectDataService.getProjects());
        }
      })
      .catch(() => {
        if (isMounted) setProjects(ProjectDataService.getProjects());
      });

    return () => {
      isMounted = false;
    };
  }, [isCreateModalOpen]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Manager Module
            </span>
            <span className="text-xs text-slate-300">• {projects.length} Initiative Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Agile Project & Sprint Delivery
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Payment Gateway Integration module with live Scrum sprint cadences, velocity metrics,
            and automated retro action item backlogs.
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const activeSprint =
            project.activeSprint ||
            project.sprints.find((s) => s.status === 'active') ||
            project.sprints[0];

          return (
            <div
              key={project.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
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
                      <span>
                        {activeSprint.completedStoryPoints}/{activeSprint.totalStoryPoints} SP
                      </span>
                      <span>
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
        })}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={(newProj) => {
          setProjects(ProjectDataService.getProjects());
          router.push(`/projects/${newProj.id}`);
        }}
      />
    </div>
  );
};

export default ProjectsTab;
