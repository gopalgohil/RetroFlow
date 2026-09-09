'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Settings,
  Save,
  Check,
  AlertTriangle,
  Archive,
  RotateCcw,
  Trash2,
  AlertOctagon,
} from 'lucide-react';
import { Project, ProjectMemberRole, SprintCadence } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { UserAvatar, StatusPill, Modal } from '@/components/ui';

interface TeamSettingsTabProps {
  project: Project;
  onProjectUpdated: (updated: Project) => void;
}

export const TeamSettingsTab: React.FC<TeamSettingsTabProps> = ({
  project,
  onProjectUpdated,
}) => {
  const router = useRouter();

  // Invite state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>('Developer');
  const [inviteError, setInviteError] = useState('');

  // Settings form state
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [cadence, setCadence] = useState<SprintCadence>(project.cadence);
  const [savedNotice, setSavedNotice] = useState(false);

  // Danger Zone state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Please fill in both name and work email.');
      return;
    }
    if (!inviteEmail.includes('@')) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    try {
      // Live REST API request -> visible in browser Network tab!
      const updated = await ProjectApiService.addMember(project.id, {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      if (updated) onProjectUpdated(updated);
    } catch {
      const updated = ProjectDataService.addMember(project.id, {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      if (updated) onProjectUpdated(updated);
    }

    setInviteName('');
    setInviteEmail('');
    setInviteRole('Developer');
    setInviteError('');
    setIsInviteOpen(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Live REST API request -> visible in browser Network tab!
      const updated = await ProjectApiService.updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        cadence,
      });
      if (updated) onProjectUpdated(updated);
    } catch {
      const projects = ProjectDataService.getProjects();
      const idx = projects.findIndex((p) => p.id === project.id);
      if (idx !== -1) {
        projects[idx].name = name.trim();
        projects[idx].description = description.trim();
        projects[idx].cadence = cadence;
        onProjectUpdated(projects[idx]);
      }
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      // Live REST API request -> visible in browser Network tab!
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
      // Live REST API DELETE request -> visible in browser Network tab!
      const res = await ProjectApiService.deleteProject(project.id);
      setIsDeleteModalOpen(false);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('retroflow_active_project_id');
      }

      if (res && res.nextProjectId) {
        router.push(`/projects/${res.nextProjectId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete project.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Section 1: Team Members Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Header & Invite Trigger */}
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Assigned Team Members ({project.members.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control access permissions and sprint roles for this project
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5">Member Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Project Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {project.members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <UserAvatar name={member.name} avatar={member.avatar} size="md" status="online" />
                    <div>
                      <p className="font-bold text-slate-900">{member.name}</p>
                      {project.lead.email === member.email && (
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          Project Lead
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <StatusPill status={member.role} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-slate-400 text-[11px] font-mono">Synced</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: General Project Settings */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-700" />
              General Project Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update cadence rules, project descriptions, and board attributes
            </p>
          </div>

          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              Settings Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Sprint Cadence</label>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as SprintCadence)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer"
            >
              <option value="1_week">1 Week (Fast iteration)</option>
              <option value="2_weeks">2 Weeks (Industry standard)</option>
              <option value="3_weeks">3 Weeks (Enterprise)</option>
              <option value="custom">Custom Duration</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Enterprise Danger Zone */}
      <div className="bg-rose-50/50 border border-rose-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-rose-200/70 bg-rose-100/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-950 tracking-tight flex items-center gap-2">
                Danger Zone
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-800 uppercase tracking-wider">
                  Admin Only
                </span>
              </h3>
              <p className="text-xs text-rose-700/80 mt-0.5">
                Destructive operations and lifecycle status changes for this agile initiative
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 divide-y divide-rose-100">
          {/* Action A: Archive Initiative (Soft Delete) */}
          <div className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>{project.isArchived ? 'Restore Initiative' : 'Archive Initiative'}</span>
                {project.isArchived && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Archived
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
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
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {isArchiving ? 'Updating...' : project.isArchived ? 'Unarchive Project' : 'Archive Project'}
            </button>
          </div>

          {/* Action B: Delete Initiative Permanently (Hard Delete) */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete this project permanently</span>
              </h4>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Once deleted, all {project.sprints.length} sprints, backlog items, and configuration rules for <strong>{project.name}</strong> will be permanently wiped. This action <strong>cannot</strong> be undone.
              </p>
            </div>

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
          </div>
        </div>
      </div>

      {/* Reusable Modal for Member Invitation */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title={`Invite Member to ${project.key}`}
        description="Grant workspace collaboration permissions"
        icon={<UserPlus className="w-5 h-5" />}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInviteSubmit}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Send Invitation
            </button>
          </>
        }
      >
        <form onSubmit={handleInviteSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Jordan Hayes"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Work Email</label>
            <input
              type="email"
              required
              placeholder="jordan.h@retroflow.io"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs cursor-pointer"
            >
              <option value="Developer">Developer</option>
              <option value="QA">QA Specialist</option>
              <option value="Manager">Manager</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {inviteError && (
            <p className="text-[11px] text-rose-500 font-medium">{inviteError}</p>
          )}
        </form>
      </Modal>

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
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
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
        <div className="space-y-4 text-xs text-slate-600">
          {/* Warning Callout Box */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Unexpected bad things will happen if you don't read this!</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800">
              This will permanently delete the <strong>{project.name}</strong> ({project.key}) agile project, its <strong>{project.sprints.length} sprints</strong>, and backlog items.
            </p>
          </div>

          {/* Type to Confirm Prompt */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-800">
              Please type <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-900 border border-slate-200 select-all">DELETE {project.key}</code> to confirm:
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
            />
          </div>

          {/* Backend Error Alert */}
          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-900 text-xs font-medium animate-in fade-in">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeamSettingsTab;
