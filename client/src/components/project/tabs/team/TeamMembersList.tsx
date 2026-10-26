'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Check, Trash2, X } from 'lucide-react';
import { Project, ProjectMemberRole } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { UserAvatar, StatusPill } from '@/components/ui';

export interface TeamMembersListProps {
  project: Project;
  canManageProject?: boolean;
  onInviteClick: () => void;
  onProjectUpdated: (updated: Project) => void;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  project,
  canManageProject = false,
  onInviteClick,
  onProjectUpdated,
}) => {
  // Role Update state
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  // Clean inline member remove state (matching retro delete card)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [memberRemovedNotice, setMemberRemovedNotice] = useState<string | null>(null);

  const handleRoleChange = async (member: Project['members'][0], newRole: ProjectMemberRole) => {
    if (member.role === newRole) return;
    setUpdatingMemberId(member.id);
    try {
      const updated = await ProjectApiService.updateMemberRole(
        project.id,
        member.id || member.email,
        newRole
      );
      if (updated) onProjectUpdated(updated);
    } catch (err: any) {
      console.warn('Backend updateMemberRole failed, trying local fallback:', err);
      try {
        const updated = ProjectDataService.updateMemberRole(
          project.id,
          member.id || member.email,
          newRole
        );
        if (updated) onProjectUpdated(updated);
      } catch (fallbackErr) {}
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleConfirmRemoveMember = async (member: Project['members'][0]) => {
    setRemovingMemberId(member.id);
    try {
      const updated = await ProjectApiService.removeMember(
        project.id,
        member.id || member.email
      );
      if (updated) onProjectUpdated(updated);
      setMemberRemovedNotice(`Removed ${member.name} from project.`);
      setTimeout(() => setMemberRemovedNotice(null), 3500);
      setConfirmRemoveId(null);
    } catch (err: any) {
      console.warn('Backend removeMember failed, trying local fallback:', err);
      try {
        const updated = ProjectDataService.removeMember(
          project.id,
          member.id || member.email
        );
        if (updated) onProjectUpdated(updated);
        setMemberRemovedNotice(`Removed ${member.name} from project.`);
        setTimeout(() => setMemberRemovedNotice(null), 3500);
        setConfirmRemoveId(null);
      } catch (fallbackErr: any) {
        alert(err?.response?.data?.message || err?.message || 'Failed to remove member from project.');
      }
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0e1015] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl shadow-xs overflow-hidden">
      {/* Table Header & Invite Trigger */}
      <div className="p-6 border-b border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-[#88c958]" />
            Assigned Team Members ({project.members.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control access permissions and sprint roles for this project
          </p>
        </div>

        {canManageProject ? (
          <button
            type="button"
            onClick={onInviteClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#12151c] text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Directory View</span>
          </div>
        )}
      </div>

      {memberRemovedNotice && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {memberRemovedNotice}
          </span>
          <button
            type="button"
            onClick={() => setMemberRemovedNotice(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/80 dark:bg-[#12151c] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-white/[0.08]">
            <tr>
              <th className="px-6 py-3.5">Member Name</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Project Role</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Activity</th>
              {canManageProject && (
                <th className="px-6 py-3.5 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {project.members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <UserAvatar
                    name={member.name}
                    email={member.email}
                    title={member.email}
                    avatar={member.avatar}
                    size="md"
                    status="online"
                  />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                    {project.lead.email.toLowerCase() === member.email.toLowerCase() && (
                      <span className="text-[10px] text-[#88c958] font-semibold">
                        {member.role === 'Project Lead' ? 'Project Lead' : 'Manager'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{member.email}</td>
                <td className="px-6 py-4">
                  {canManageProject ? (
                    <div className="relative inline-block">
                      <select
                        value={member.role}
                        disabled={updatingMemberId === member.id}
                        onChange={(e) => handleRoleChange(member, e.target.value as ProjectMemberRole)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 pr-6 border cursor-pointer appearance-none transition-all focus:outline-none focus:ring-1 focus:ring-[#88c958] ${
                          member.role === 'Manager'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                            : member.role === 'Project Lead'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            : member.role === 'QA'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                            : member.role === 'DevOps'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                            : 'bg-slate-100 dark:bg-[#141720] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                        } ${updatingMemberId === member.id ? 'opacity-50 cursor-wait' : ''}`}
                        title="Change project member role dynamically"
                      >
                        {project.lead.email.toLowerCase() === member.email.toLowerCase() ? (
                          <>
                            <option value="Manager" className="dark:bg-[#12151c]">Manager</option>
                            <option value="Project Lead" className="dark:bg-[#12151c]">Project Lead</option>
                          </>
                        ) : (
                          <>
                            <option value="Developer" className="dark:bg-[#12151c]">Developer</option>
                            <option value="QA" className="dark:bg-[#12151c]">QA</option>
                            <option value="Manager" className="dark:bg-[#12151c]">Manager</option>
                            <option value="DevOps" className="dark:bg-[#12151c]">DevOps</option>
                            <option value="Project Lead" className="dark:bg-[#12151c]">Project Lead</option>
                          </>
                        )}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400 text-[10px]">
                        ▾
                      </span>
                    </div>
                  ) : (
                    <StatusPill status={member.role} />
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">Synced</span>
                </td>
                {canManageProject && (
                  <td className="px-6 py-4 text-right">
                    {project.lead.email.toLowerCase() === member.email.toLowerCase() ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 select-none"
                        title="Designated Project Manager / Lead cannot be removed"
                      >
                        {member.role === 'Project Lead' ? 'Lead' : 'Manager'}
                      </span>
                    ) : confirmRemoveId === member.id ? (
                      <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/60 rounded-xl px-2.5 py-1 animate-in fade-in zoom-in-95 duration-100 shadow-xs">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">
                          Remove {member.name.split(' ')[0]}?
                        </span>
                        <button
                          type="button"
                          disabled={removingMemberId === member.id}
                          onClick={() => handleConfirmRemoveMember(member)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {removingMemberId === member.id ? 'Removing...' : 'Yes, Remove'}
                        </button>
                        <button
                          type="button"
                          disabled={removingMemberId === member.id}
                          onClick={() => setConfirmRemoveId(null)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(member.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-rose-300 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
                        title={`Remove ${member.name} from project`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                        <span>Remove</span>
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Floating Toast Notification */}
      {memberRemovedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white dark:bg-[#12151c] text-slate-900 dark:text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 dark:border-emerald-500/40 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-xs font-bold">{memberRemovedNotice}</p>
          <button
            type="button"
            onClick={() => setMemberRemovedNotice(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
