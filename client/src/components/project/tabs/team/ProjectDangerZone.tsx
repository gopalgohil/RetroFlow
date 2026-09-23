'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Archive, Trash2, AlertOctagon, Lock } from 'lucide-react';
import { Project } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { Modal } from '@/components/ui';

export interface ProjectDangerZoneProps {
  project: Project;
  canManageProject?: boolean;
  canDeleteProject?: boolean;
  onProjectUpdated: (updated: Project) => void;
}

export const ProjectDangerZone: React.FC<ProjectDangerZoneProps> = ({
  project,
  canManageProject = false,
  canDeleteProject = false,
  onProjectUpdated,
}) => {
  const router = useRouter();

  // Danger Zone state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      const updated = await ProjectApiService.archiveProject(project.id, !project.isArchived);
      if (updated) onProjectUpdated(updated);
    } catch (err: any) {
      console.warn('[TeamSettings] Archive error:', err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmInput.trim().toUpperCase() !== `DELETE ${project.key}`) {
      setDeleteError(`Please type exactly "DELETE ${project.key}" to confirm.`);
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      let res: any = null;
      try {
        res = await ProjectApiService.deleteProject(project.id);
      } catch (apiErr: any) {
        // If project was not found in MongoDB (e.g. stale mock data), treat as deleted cleanly
        if (
          apiErr?.status === 404 ||
          apiErr?.message?.toLowerCase().includes('not found')
        ) {
          console.warn('[TeamSettingsTab] Project already deleted or not found on server:', apiErr);
          res = { nextProjectId: null };
        } else {
          throw apiErr;
        }
      }

      setIsDeleteModalOpen(false);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('retroflow_active_project_id');
        try {
          sessionStorage.removeItem(`retroflow_cached_project_${project.id}`);
          if (project.key) {
            sessionStorage.removeItem(`retroflow_cached_project_${project.key}`);
          }
        } catch {}
      }

      ProjectApiService.clearProjectsCache();

      if (res && res.nextProjectId) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('retroflow_active_project_id', res.nextProjectId);
        }
        router.push(`/projects/${res.nextProjectId}`);
      } else {
        router.push('/dashboard?tab=projects');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete project.');
      setIsDeleting(false);
    }
  };

  if (!canManageProject) {
    return (
      <div className="bg-slate-50 dark:bg-[#0e1015] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#141720] text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Enterprise Danger Zone</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-[#141720] text-slate-600 dark:text-slate-400 uppercase">
                Restricted
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently deleting or archiving <strong>{project.name}</strong> is strictly restricted to the <strong>Project Lead, Managers, and Workspace Admins</strong>.
            </p>
          </div>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0 select-none">
          🔒 Operations Locked
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/90 dark:border-rose-900/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-rose-200/70 dark:border-rose-900/60 bg-rose-100/30 dark:bg-rose-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-950 dark:text-rose-200 tracking-tight flex items-center gap-2">
                Danger Zone
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Managers & Lead Only
                </span>
              </h3>
              <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
                Destructive operations and lifecycle status changes for this agile initiative
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 divide-y divide-rose-100 dark:divide-rose-950/40">
          {/* Action A: Archive Initiative (Soft Delete) */}
          <div className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{project.isArchived ? 'Restore Initiative' : 'Archive Initiative'}</span>
                {project.isArchived && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                    Archived
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                Mark this project as {project.isArchived ? 'active again' : 'archived'}. Historical velocity data and retrospective action items remain preserved in read-only state.
              </p>
            </div>

            <button
              type="button"
              onClick={handleArchiveToggle}
              disabled={isArchiving}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 ${
                project.isArchived
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isArchiving ? 'Updating...' : project.isArchived ? 'Unarchive Project' : 'Archive Project'}
            </button>
          </div>

          {/* Action B: Delete Initiative Permanently (Hard Delete) */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Delete this project permanently</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
                Once deleted, all {project.sprints.length} sprints, backlog items, and configuration rules for <strong>{project.name}</strong> will be permanently wiped. This action <strong>cannot</strong> be undone.
              </p>
            </div>

            {canDeleteProject ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmInput('');
                  setDeleteError('');
                  setIsDeleteModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Delete Project...
              </button>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold shrink-0 cursor-not-allowed select-none"
                title="Project deletion is restricted to Admins and Managers. Project Leads cannot delete projects."
              >
                <Lock className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span>Restricted to Admin & Manager</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub-Style Strict Confirmation Modal for Deletion */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false);
        }}
        title="Delete Project Permanently?"
        description="This action is irreversible and requires verification"
        icon={<AlertOctagon className="w-5 h-5 text-white" />}
        variant="danger"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                isDeleting ||
                deleteConfirmInput.trim().toUpperCase() !== `DELETE ${project.key}`
              }
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDeleting ? 'Deleting Initiative...' : 'I understand, delete this project'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/60 text-rose-950 dark:text-rose-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Unexpected bad things will happen if you don't read this!</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300/80">
              This will permanently delete the <strong>{project.name}</strong> ({project.key}) agile project, its <strong>{project.sprints.length} sprints</strong>, and backlog items.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Please type <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 select-all">DELETE {project.key}</code> to confirm:
            </label>
            <input
              type="text"
              autoFocus
              value={deleteConfirmInput}
              onChange={(e) => {
                setDeleteConfirmInput(e.target.value);
                setDeleteError('');
              }}
              placeholder={`DELETE ${project.key}`}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-medium animate-in fade-in">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
