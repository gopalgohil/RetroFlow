'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, Lock } from 'lucide-react';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';

export interface ProjectGeneralSettingsProps {
  project: Project;
  canManageProject?: boolean;
  currentUserRole?: string;
  onProjectUpdated: (updated: Project) => void;
}

export const ProjectGeneralSettings: React.FC<ProjectGeneralSettingsProps> = ({
  project,
  canManageProject = false,
  currentUserRole = 'Developer',
  onProjectUpdated,
}) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || '');
  }, [project.name, project.description]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await ProjectApiService.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        cadence: project.cadence,
      });
      if (updated) onProjectUpdated(updated);
    } catch {
      const projects = ProjectDataService.getProjects();
      const idx = projects.findIndex((p) => p.id === project.id);
      if (idx !== -1) {
        projects[idx].name = name.trim();
        projects[idx].description = description.trim();
        onProjectUpdated(projects[idx]);
      }
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl p-6 shadow-xs space-y-6">
      <div className="border-b border-slate-200/80 dark:border-white/[0.08] pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#88c958]" />
            <span>General Project Configuration</span>
            {!canManageProject && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-[#141720] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Read-Only
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {canManageProject
              ? 'Update project descriptions, team details, and board attributes'
              : 'Project configurations can only be updated by the Project Lead, Managers, or Workspace Admins'}
          </p>
        </div>

        {savedNotice && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            Settings Saved!
          </span>
        )}
      </div>

      {!canManageProject && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p>
            Your role in this project is <strong>{currentUserRole}</strong>. Project settings and Danger Zone operations are strictly reserved for the <strong>Project Lead & Managers</strong>.
          </p>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
        <fieldset disabled={!canManageProject} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Project Name</label>
            <input
              type="text"
              disabled={!canManageProject}
              readOnly={!canManageProject}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none ${
                canManageProject
                  ? 'bg-slate-50 dark:bg-[#12151c] border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958]'
                  : 'bg-slate-100/70 dark:bg-[#12151c]/50 border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">Description</label>
            <textarea
              rows={3}
              disabled={!canManageProject}
              readOnly={!canManageProject}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none resize-none ${
                canManageProject
                  ? 'bg-slate-50 dark:bg-[#12151c] border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958]'
                  : 'bg-slate-100/70 dark:bg-[#12151c]/50 border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
              }`}
            />
          </div>
        </fieldset>

        {canManageProject && (
          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a]"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
