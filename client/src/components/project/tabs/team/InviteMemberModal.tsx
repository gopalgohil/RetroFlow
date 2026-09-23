'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Project, ProjectMemberRole } from '@/types/project';
import { ProjectApiService, MembersApiService } from '@/services/projectApi';
import { ProjectDataService } from '@/services/mockProjectData';
import { Modal } from '@/components/ui';
import { validateEmailAddress } from '@/lib/validations/auth';

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectUpdated: (updated: Project) => void;
}

const DEFAULT_WORKSPACE_MEMBERS: Array<{ id: string; name: string; email: string }> = [];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>('Developer');
  const [inviteError, setInviteError] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState(DEFAULT_WORKSPACE_MEMBERS);
  const [selectedWorkspaceMemberEmail, setSelectedWorkspaceMemberEmail] = useState('');
  const [isManualInvite, setIsManualInvite] = useState(false);

  // Load real workspace members when invite modal opens
  useEffect(() => {
    if (!isOpen) return;
    MembersApiService.getWorkspaceMembers()
      .then((raw) => {
        const map = new Map<string, any>();
        raw.forEach((m: any) => {
          if (m.email) {
            map.set(m.email.toLowerCase(), {
              id: m.id || m._id || m.email,
              name: m.name || m.email.split('@')[0],
              email: m.email,
            });
          }
        });
        DEFAULT_WORKSPACE_MEMBERS.forEach((d) => {
          if (!map.has(d.email.toLowerCase())) map.set(d.email.toLowerCase(), d);
        });
        const list = Array.from(map.values());
        setWorkspaceMembers(list);
        const unadded = list.find(
          (m) => !project.members?.some((x) => x.email.toLowerCase() === m.email.toLowerCase())
        );
        if (unadded) {
          setSelectedWorkspaceMemberEmail(unadded.email);
          setInviteName(unadded.name);
          setInviteEmail(unadded.email);
        }
      })
      .catch(() => {
        setWorkspaceMembers(DEFAULT_WORKSPACE_MEMBERS);
        const unadded = DEFAULT_WORKSPACE_MEMBERS.find(
          (m) => !project.members?.some((x) => x.email.toLowerCase() === m.email.toLowerCase())
        );
        if (unadded) {
          setSelectedWorkspaceMemberEmail(unadded.email);
          setInviteName(unadded.name);
          setInviteEmail(unadded.email);
        }
      });
  }, [isOpen, project.members]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Please fill in both name and email.');
      return;
    }
    const emailCheck = validateEmailAddress(inviteEmail.trim());
    if (!emailCheck.isValid) {
      setInviteError(emailCheck.error || 'Please enter a valid email address.');
      return;
    }

    try {
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
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite Member to ${project.key}`}
      description="Grant workspace collaboration permissions"
      icon={<UserPlus className="w-5 h-5" />}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInviteSubmit}
            className="px-4 py-2 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a]"
          >
            Send Invitation
          </button>
        </>
      }
    >
      <form onSubmit={handleInviteSubmit} className="space-y-4">
        {!isManualInvite ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Workspace Member
            </label>
            <select
              value={selectedWorkspaceMemberEmail}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedWorkspaceMemberEmail(val);
                const found = workspaceMembers.find(
                  (m) => m.email.toLowerCase() === val.toLowerCase()
                );
                if (found) {
                  setInviteName(found.name);
                  setInviteEmail(found.email);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer"
            >
              {workspaceMembers.map((m) => {
                const isAlreadyMember = project.members?.some(
                  (p) => p.email.toLowerCase() === m.email.toLowerCase()
                );
                return (
                  <option key={m.email} value={m.email} disabled={isAlreadyMember} className="dark:bg-[#12151c]">
                    {m.name} ({m.email}) {isAlreadyMember ? '— Already Added' : ''}
                  </option>
                );
              })}
            </select>
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsManualInvite(true);
                  setInviteName('');
                  setInviteEmail('');
                }}
                className="text-[11px] text-[#88c958] hover:text-[#76b349] hover:underline font-medium cursor-pointer"
              >
                + Or enter custom name & email
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Hayes"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                required
                placeholder="jordan.h@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsManualInvite(false);
                  const found = workspaceMembers.find(
                    (m) => m.email.toLowerCase() === selectedWorkspaceMemberEmail.toLowerCase()
                  );
                  if (found) {
                    setInviteName(found.name);
                    setInviteEmail(found.email);
                  }
                }}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline cursor-pointer"
              >
                ← Back to workspace members list
              </button>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Project Role</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="Developer" className="dark:bg-[#12151c]">Developer</option>
            <option value="QA" className="dark:bg-[#12151c]">QA</option>
            <option value="Manager" className="dark:bg-[#12151c]">Manager</option>
            <option value="DevOps" className="dark:bg-[#12151c]">DevOps</option>
            <option value="Project Lead" className="dark:bg-[#12151c]">Project Lead</option>
          </select>
        </div>

        {inviteError && (
          <p className="text-[11px] text-rose-500 font-medium">{inviteError}</p>
        )}
      </form>
    </Modal>
  );
};
