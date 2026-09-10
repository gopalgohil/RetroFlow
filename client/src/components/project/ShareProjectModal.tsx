'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  Mail,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

import { Project, ProjectMemberRole } from '@/types/project';
import ProjectApiService from '@/services/projectApi';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onProjectUpdated?: (updatedProject: Project) => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}) => {
  // Clipboard copy state
  const [copied, setCopied] = useState(false);

  // Existing members selection state
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSendingInvites, setIsSendingInvites] = useState(false);

  // External member invite form state
  const [showExternalInvite, setShowExternalInvite] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [externalRole, setExternalRole] = useState<ProjectMemberRole>('Developer');
  const [isAddingExternal, setIsAddingExternal] = useState(false);

  // Feedback notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset selected members when modal opens or project changes
  useEffect(() => {
    if (isOpen && project?.members) {
      // By default, select all existing project members for convenience
      setSelectedEmails(project.members.map((m) => m.email.toLowerCase()));
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const projectShareUrl = `${origin}/projects/${project.id || project.key}`;

  // Copy direct project link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Toggle selection for individual member
  const handleToggleMember = (email: string) => {
    const normalized = email.toLowerCase();
    setSelectedEmails((prev) =>
      prev.includes(normalized) ? prev.filter((e) => e !== normalized) : [...prev, normalized]
    );
  };

  // Toggle select all / deselect all
  const allSelected =
    project.members.length > 0 &&
    project.members.every((m) => selectedEmails.includes(m.email.toLowerCase()));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(project.members.map((m) => m.email.toLowerCase()));
    }
  };

  // Dispatch invitation emails to selected members
  const handleSendBatchInvites = async () => {
    if (selectedEmails.length === 0) {
      setErrorMessage('Please select at least one team member to invite.');
      return;
    }

    setIsSendingInvites(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await ProjectApiService.inviteMembers(
        project.id,
        selectedEmails,
        customMessage.trim() || undefined
      );

      setSuccessMessage(
        res.message || `Invitations sent to ${selectedEmails.length} team member${selectedEmails.length > 1 ? 's' : ''}!`
      );
      setCustomMessage('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send invitation emails. Please try again.');
    } finally {
      setIsSendingInvites(false);
    }
  };

  // Add an external member by email and immediately send invite
  const handleAddAndInviteExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = externalName.trim();
    const email = externalEmail.trim().toLowerCase();

    if (!name || name.length < 2) {
      setErrorMessage('Please enter a valid member name (at least 2 characters).');
      return;
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    // Check if already in project
    const exists = project.members.some((m) => m.email.toLowerCase() === email);
    if (exists) {
      setErrorMessage(`A team member with email ${email} is already in this project.`);
      return;
    }

    setIsAddingExternal(true);

    try {
      // 1. Add member to project
      const updatedProject = await ProjectApiService.addMember(project.id, {
        name,
        email,
        role: externalRole,
      });

      // 2. Dispatch invitation email to the newly added member
      await ProjectApiService.inviteMembers(
        project.id,
        [email],
        customMessage.trim() || undefined
      );

      if (onProjectUpdated) {
        onProjectUpdated(updatedProject);
      }

      // Add to selected list
      setSelectedEmails((prev) => [...prev, email]);

      setSuccessMessage(`Successfully added ${name} (${externalRole}) and sent project invitation email!`);
      setExternalName('');
      setExternalEmail('');
      setExternalRole('Developer');
      setShowExternalInvite(false);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add external member. Please try again.');
    } finally {
      setIsAddingExternal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-indigo-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Share Project & Invite Team</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {project.name} <span className="font-mono font-semibold text-slate-400">({project.key})</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Notification Banners */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Direct Shareable Link Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>Direct Project Link</span>
              </label>
              <span className="text-[11px] text-slate-400">Teammates can view & participate</span>
            </div>

            <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-mono text-slate-600 truncate select-all flex-1">
                {projectShareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 2. Existing Assigned Members Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Project Members ({project.members.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select members to email their project invitation link
                </p>
              </div>

              {project.members.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  {allSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Select All ({project.members.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Members Checklist Box */}
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-52 overflow-y-auto bg-slate-50/40">
              {project.members.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No members added to this project yet.
                </div>
              ) : (
                project.members.map((member) => {
                  const isChecked = selectedEmails.includes(member.email.toLowerCase());
                  const isLead = project.lead?.email?.toLowerCase() === member.email.toLowerCase();

                  return (
                    <label
                      key={member.id || member.email}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMember(member.email)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                      />

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Member Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {member.name}
                          </span>
                          {isLead && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                              Lead
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                      </div>

                      {/* Role Pill */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          member.role === 'Manager'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : member.role === 'QA'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : member.role === 'Viewer'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {member.role}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Optional message input */}
            <div className="pt-1">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Optional personal message (e.g. Please join and review current sprint goals)..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Send Batch Invites Button */}
            <button
              type="button"
              disabled={selectedEmails.length === 0 || isSendingInvites}
              onClick={handleSendBatchInvites}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSendingInvites ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Invitations...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Send Invitations ({selectedEmails.length} selected)
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* 3. Expandable Section: + Or invite external member by email */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowExternalInvite(!showExternalInvite)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>+ Or invite external member by email</span>
              {showExternalInvite ? (
                <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-y-0.5 transition-transform" />
              )}
            </button>

            {/* Expandable Form */}
            {showExternalInvite && (
              <form
                onSubmit={handleAddAndInviteExternal}
                className="p-4 rounded-xl bg-slate-50 border border-indigo-100 space-y-3.5 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add Member to Project & Send Invite</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Project Role
                    </label>
                    <select
                      value={externalRole}
                      onChange={(e) => setExternalRole(e.target.value as ProjectMemberRole)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="Developer">Developer</option>
                      <option value="QA">QA Engineer</option>
                      <option value="Manager">Project Manager</option>
                      <option value="Viewer">Viewer / Stakeholder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                    placeholder="e.g. marcus@company.com"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAddingExternal}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isAddingExternal ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding & Sending Invite...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Add & Send Invite</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Invitations contain secure 1-click project links</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProjectModal;
