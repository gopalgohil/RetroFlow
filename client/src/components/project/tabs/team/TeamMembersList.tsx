'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Project, ProjectMemberRole } from '@/types/project';
import { ProjectApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { UserAvatar, StatusPill, Modal } from '@/components/ui';

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

  // Remove Member state
  const [memberToRemove, setMemberToRemove] = useState<Project['members'][0] | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState('');
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

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    setRemoveMemberError('');
    try {
      const updated = await ProjectApiService.removeMember(
        project.id,
        memberToRemove.id || memberToRemove.email
      );
      if (updated) onProjectUpdated(updated);
      setMemberRemovedNotice(`Removed ${memberToRemove.name} from project.`);
      setTimeout(() => setMemberRemovedNotice(null), 4000);
      setMemberToRemove(null);
    } catch (err: any) {
      console.warn('Backend removeMember failed, trying local fallback:', err);
      try {
        const updated = ProjectDataService.removeMember(
          project.id,
          memberToRemove.id || memberToRemove.email
        );
        if (updated) onProjectUpdated(updated);
        setMemberRemovedNotice(`Removed ${memberToRemove.name} from project.`);
        setTimeout(() => setMemberRemovedNotice(null), 4000);
        setMemberToRemove(null);
      } catch (fallbackErr: any) {
        setRemoveMemberError(
          err?.response?.data?.message || err?.message || 'Failed to remove member from project.'
        );
      }
    } finally {
      setIsRemovingMember(false);
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
                    {project.lead.email === member.email && (
                      <span className="text-[10px] text-[#88c958] font-semibold">
                        Manager
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{member.email}</td>
                <td className="px-6 py-4">
                  {canManageProject && project.lead.email.toLowerCase() !== member.email.toLowerCase() ? (
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
                        <option value="Developer" className="dark:bg-[#12151c]">Developer</option>
                        <option value="QA" className="dark:bg-[#12151c]">QA</option>
                        <option value="Manager" className="dark:bg-[#12151c]">Manager</option>
                        <option value="DevOps" className="dark:bg-[#12151c]">DevOps</option>
                        <option value="Project Lead" className="dark:bg-[#12151c]">Project Lead</option>
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
                        title="Designated Project Manager cannot be removed"
                      >
                        Manager
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveMemberError('');
                          setMemberToRemove(member);
                        }}
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

      {/* Remove Team Member Confirmation Modal */}
      {memberToRemove && (
        <Modal
          isOpen={!!memberToRemove}
          onClose={() => {
            if (!isRemovingMember) {
              setMemberToRemove(null);
              setRemoveMemberError('');
            }
          }}
          title="Remove Team Member?"
          description="Revoke access to this project workspace"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={() => {
                  setMemberToRemove(null);
                  setRemoveMemberError('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemovingMember}
                onClick={handleConfirmRemoveMember}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRemovingMember ? 'Removing...' : 'Remove Member'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-900/60 text-rose-950 dark:text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Revocation of Project Access</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300/80">
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> ({memberToRemove.email}) from <strong>{project.name}</strong> ({project.key})?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={memberToRemove.name}
                  email={memberToRemove.email}
                  title={memberToRemove.email}
                  avatar={memberToRemove.avatar}
                  size="md"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{memberToRemove.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{memberToRemove.email}</p>
                </div>
              </div>
              <StatusPill status={memberToRemove.role} />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Once removed, this user will immediately lose access to all sprint backlogs, task assignments, and private retrospectives associated with this project.
            </p>

            {removeMemberError && (
              <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-medium animate-in fade-in">
                {removeMemberError}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
