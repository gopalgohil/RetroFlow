'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  Lock,
  CalendarClock,
  Info,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
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
  const [autoMonthlyRetro, setAutoMonthlyRetro] = useState<boolean>(
    project.autoMonthlyRetro !== false
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || '');
    setAutoMonthlyRetro(project.autoMonthlyRetro !== false);
  }, [project.name, project.description, project.autoMonthlyRetro]);

  // Compute 1st day of next month (e.g., "November 1, 2026")
  const getNextMonthFirstDay = (): string => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await ProjectApiService.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        cadence: project.cadence,
        autoMonthlyRetro,
      });
      if (updated) onProjectUpdated(updated);
      setSavedNotice(true);
      setShowToast(true);
      setTimeout(() => setSavedNotice(false), 3000);
      setTimeout(() => setShowToast(false), 4000);
    } catch {
      try {
        const projects = ProjectDataService.getProjects();
        const idx = projects.findIndex((p) => p.id === project.id);
        if (idx !== -1) {
          projects[idx].name = name.trim();
          projects[idx].description = description.trim();
          projects[idx].autoMonthlyRetro = autoMonthlyRetro;
          onProjectUpdated(projects[idx]);
        }
        setSavedNotice(true);
        setShowToast(true);
        setTimeout(() => setSavedNotice(false), 3000);
        setTimeout(() => setShowToast(false), 4000);
      } catch {
        setErrorMessage('Failed to save project configuration. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
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

      <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl">
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

          {/* Automated Monthly Retrospective Configuration Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#12151c]/70 p-4 space-y-3 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="auto-monthly-retro-toggle"
                  className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer select-none flex items-center gap-2"
                >
                  <CalendarClock className="w-4 h-4 text-[#5cb028] dark:text-[#88c958]" />
                  <span>Enable Monthly Automated Retrospective</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically opens on 1st of every month and closes at month-end.
                </p>
              </div>

              <input
                id="auto-monthly-retro-toggle"
                type="checkbox"
                disabled={!canManageProject}
                checked={autoMonthlyRetro}
                onChange={(e) => setAutoMonthlyRetro(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#5cb028] dark:accent-[#88c958] rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Information preview */}
            {autoMonthlyRetro ? (
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 text-blue-900 dark:text-blue-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-xs">
                    Next automated session will be created on: <strong>{getNextMonthFirstDay()}</strong>
                  </p>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                    (For current month, you can create a Custom Retro anytime)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Automated monthly generation is disabled. Retrospectives must be created manually.</span>
              </div>
            )}
          </div>
        </fieldset>

        {canManageProject && (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer ${
                savedNotice
                  ? 'bg-emerald-600 hover:bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                  : 'bg-[#5cb028] hover:bg-[#4e9921] text-white dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a]'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : savedNotice ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Configuration Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>

            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-left-2 duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Changes saved successfully!
              </span>
            )}

            {errorMessage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </span>
            )}
          </div>
        )}
      </form>

      {/* Industry Standard Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 bg-white dark:bg-[#12151c] text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/30 dark:border-emerald-500/40 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="pr-2 space-y-0.5">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              Configuration Saved
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Project configuration has been updated successfully.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
