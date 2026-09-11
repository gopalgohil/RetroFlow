'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderPlus,
  Sparkles,
  Users,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  ProjectType,
  ProjectMemberRole,
  CreateProjectPayload,
  Project,
} from '@/types/project';
import { ProjectDataService } from '@/services/mockProjectData';
import { ProjectApiService } from '@/services/projectApi';
import { api, ENDPOINTS } from '@/lib/api';
import { Modal, StatusPill, UserAvatar } from '@/components/ui';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

interface WorkspaceMemberOption {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

const DEFAULT_WORKSPACE_LEADS: WorkspaceMemberOption[] = [
  { id: 'lead-gopal', name: 'Gopal', email: 'gopalgohel249@gmail.com', role: 'Admin', avatar: 'G' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  // Form State
  // Form State
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const type: ProjectType = 'scrum';
  const [availableLeads, setAvailableLeads] = useState<WorkspaceMemberOption[]>(DEFAULT_WORKSPACE_LEADS);

  // Team Member Dropdown selection state
  const [selectedMemberEmail, setSelectedMemberEmail] = useState<string>('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Workspace Members fetch on Modal Open
  React.useEffect(() => {
    if (!isOpen) {
      setIsMemberDropdownOpen(false);
      setSelectedMemberEmail('');
      setNewMemberRole('');
      setMembers([]);
      setMemberError('');
      return;
    }

    let currentUser: any = null;
    try {
      const savedUser = localStorage.getItem('retroflow_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    api
      .get(ENDPOINTS.MEMBERS, { params: { limit: 50 } })
      .then((res) => {
        const rawMembers = Array.isArray(res.data)
          ? res.data
          : res.data?.members || [];

        const combinedMap = new Map<string, WorkspaceMemberOption>();

        // 1. Current logged-in user (Admin / Creator) always at top
        if (currentUser?.email) {
          const userInitials = (currentUser.name || 'Admin')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          combinedMap.set(currentUser.email.toLowerCase().trim(), {
            id: currentUser.id || 'current-user',
            name: `${currentUser.name} (You)`,
            email: currentUser.email,
            role: currentUser.role === 'admin' ? 'Admin' : 'Manager',
            avatar: userInitials,
          });
        }

        // 2. Add real workspace members from MongoDB roster
        rawMembers.forEach((m: any) => {
          const email = (m.email || '').toLowerCase().trim();
          if (email && !combinedMap.has(email)) {
            const memberInitials = (m.name || email)
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            combinedMap.set(email, {
              id: m.id || m._id || `lead-${email}`,
              name: m.name || email.split('@')[0],
              email: m.email,
              role: m.role || 'Member',
              avatar: memberInitials,
            });
          }
        });

        // 3. Fallback defaults if roster is small
        DEFAULT_WORKSPACE_LEADS.forEach((d) => {
          if (!combinedMap.has(d.email.toLowerCase())) {
            combinedMap.set(d.email.toLowerCase(), d);
          }
        });

        const list = Array.from(combinedMap.values());
        setAvailableLeads(list);
      })
      .catch(() => {
        setAvailableLeads(DEFAULT_WORKSPACE_LEADS);
      });
  }, [isOpen]);

  // Team Members State
  const [members, setMembers] = useState<
    Array<{ name: string; email: string; role: ProjectMemberRole }>
  >([]);

  // Input states for adding new member
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole | ''>('');
  const [memberError, setMemberError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate 3-4 letter project key from project name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isKeyManuallyEdited) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      let derivedKey = '';
      if (words.length >= 3) {
        derivedKey = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
      } else if (words.length === 2) {
        derivedKey = (words[0].slice(0, 2) + words[1][0]).toUpperCase();
      } else if (words.length === 1 && words[0].length >= 3) {
        derivedKey = words[0].slice(0, 3).toUpperCase();
      } else if (words.length === 1) {
        derivedKey = words[0].toUpperCase();
      }
      setKey(derivedKey);
    }
  };

  const handleKeyChange = (val: string) => {
    setIsKeyManuallyEdited(true);
    setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
  };

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedMemberEmail) {
      setMemberError('Please select a team member');
      return;
    }

    if (!newMemberRole) {
      setMemberError('Please select a role');
      return;
    }

    const chosen = availableLeads.find(
      (l) => l.email.toLowerCase() === selectedMemberEmail.toLowerCase()
    );
    if (!chosen) {
      setMemberError('Selected member not found');
      return;
    }

    if (members.some((m) => m.email.toLowerCase() === chosen.email.toLowerCase())) {
      setMemberError('This member is already added to the project');
      return;
    }

    const cleanName = chosen.name.replace(/\s*\(You\)\s*/i, '').trim();

    setMembers((prev) => [
      ...prev,
      {
        name: cleanName,
        email: chosen.email.toLowerCase().trim(),
        role: newMemberRole as ProjectMemberRole,
      },
    ]);
    setSelectedMemberEmail('');
    setNewMemberRole('');
    setMemberError('');
  };

  const handleRemoveMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    // Determine lead: check if any member was assigned Project Lead or Manager, else default to Gopal
    const designatedLead =
      members.find((m) => m.role === 'Project Lead') ||
      members.find((m) => m.role === 'Manager') ||
      availableLeads[0] || {
        id: 'lead-primary',
        name: 'Gopal',
        email: 'gopalgohel249@gmail.com',
        avatar: 'G',
      };

    const cleanLeadName = designatedLead.name.replace(/\s*\(You\)\s*/i, '').trim();

    const payload: CreateProjectPayload = {
      name: name.trim(),
      key: key.trim() || name.slice(0, 3).toUpperCase(),
      description: description.trim(),
      type,
      leadId: (designatedLead as any).id || 'lead-primary',
      lead: {
        id: (designatedLead as any).id || 'lead-primary',
        name: cleanLeadName,
        email: designatedLead.email,
        avatar: (designatedLead as any).avatar || cleanLeadName.slice(0, 2).toUpperCase(),
      },
      members,
      cadence: '2_weeks',
      customCadenceDays: 14,
    };

    try {
      // Live REST API POST request -> visible in browser Network tab!
      const created = await ProjectApiService.createProject(payload);
      setIsSubmitting(false);
      if (typeof window !== 'undefined' && created?.id) {
        localStorage.setItem('retroflow_active_project_id', created.id);
        try {
          sessionStorage.setItem(`retroflow_cached_project_${created.id}`, JSON.stringify(created));
        } catch {}
      }
      onProjectCreated(created);
      onClose();
      // Reset form
      setName('');
      setKey('');
      setIsKeyManuallyEdited(false);
      setDescription('');
      setMembers([]);
      setSelectedMemberEmail('');
      setNewMemberRole('');
    } catch (err) {
      console.warn('[CreateProject] Fallback to local persistence:', err);
      const fallback = ProjectDataService.createProject(payload);
      setIsSubmitting(false);
      if (typeof window !== 'undefined' && fallback?.id) {
        localStorage.setItem('retroflow_active_project_id', fallback.id);
        try {
          sessionStorage.setItem(`retroflow_cached_project_${fallback.id}`, JSON.stringify(fallback));
        } catch {}
      }
      onProjectCreated(fallback);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Create New Project</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
            Pro
          </span>
        </div>
      }
      description="Setup team workspace and agile retro linkage"
      icon={<FolderPlus className="w-5 h-5" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Project Identity & Key */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Payment Gateway Integration"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              A clear, descriptive name for your initiative or product area.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Project Key <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold">Auto-generated</span>
            </div>
            <input
              type="text"
              required
              maxLength={5}
              placeholder="PGI"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-indigo-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all uppercase"
            />
            <p className="text-[11px] text-slate-400">Prefix for issues & sprints (e.g. PGI-12).</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Project Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Primary goals, technical scope, or architecture notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
          />
        </div>

        {/* Team Members with Roles */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Team Members & Initial Roles ({members.length})
            </label>
            <span className="text-[11px] text-slate-400">Can be updated anytime</span>
          </div>

          {/* Add Member Selector Row */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Member Dropdown Picker */}
              <div className="sm:col-span-7 relative" ref={memberDropdownRef}>
                {(() => {
                  const activeChoice = availableLeads.find(
                    (l) => l.email.toLowerCase() === selectedMemberEmail.toLowerCase()
                  );

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsMemberDropdownOpen((prev) => !prev)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl flex items-center justify-between transition-all text-left shadow-2xs cursor-pointer min-h-[42px]"
                      >
                        {activeChoice ? (
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                              {activeChoice.avatar || activeChoice.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                                {activeChoice.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono truncate leading-tight">
                                {activeChoice.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 text-slate-400">
                            <div className="w-7 h-7 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium">Select team member...</span>
                          </div>
                        )}

                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ${
                            isMemberDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isMemberDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xl space-y-1 max-h-56 overflow-y-auto">
                          {availableLeads.map((m) => {
                            const isAdded = members.some(
                              (existing) => existing.email.toLowerCase() === m.email.toLowerCase()
                            );
                            const isSelected =
                              Boolean(selectedMemberEmail) &&
                              m.email.toLowerCase() === selectedMemberEmail.toLowerCase();

                            return (
                              <button
                                key={m.email}
                                type="button"
                                disabled={isAdded}
                                onClick={() => {
                                  setSelectedMemberEmail(m.email);
                                  setIsMemberDropdownOpen(false);
                                  setMemberError('');
                                }}
                                className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                                  isAdded
                                    ? 'opacity-50 bg-slate-50 cursor-not-allowed text-slate-400'
                                    : isSelected
                                    ? 'bg-indigo-50/80 border border-indigo-200/60 text-slate-900 cursor-pointer'
                                    : 'hover:bg-slate-50 border border-transparent text-slate-700 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {m.avatar || m.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 truncate">
                                      {m.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono truncate">
                                      {m.email}
                                    </p>
                                  </div>
                                </div>

                                {isAdded ? (
                                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-100">
                                    Added
                                  </span>
                                ) : isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Role Selector */}
              <div className="sm:col-span-3">
                <select
                  value={newMemberRole}
                  onChange={(e) => {
                    setNewMemberRole(e.target.value as ProjectMemberRole);
                    setMemberError('');
                  }}
                  className={`w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer min-h-[42px] ${
                    !newMemberRole ? 'text-slate-400 font-normal' : 'text-slate-800'
                  }`}
                >
                  <option value="" disabled>Select role...</option>
                  <option value="Developer">Developer</option>
                  <option value="QA">QA</option>
                  <option value="Manager">Manager</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Project Lead">Project Lead</option>
                </select>
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => handleAddMember()}
                  className="w-full py-2 px-3 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[42px]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {memberError && <p className="text-[11px] text-rose-500 font-medium">{memberError}</p>}
          </div>

          {/* List of Current Members */}
          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {members.map((m) => (
                <div
                  key={m.email}
                  className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <UserAvatar name={m.name} size="xs" />
                  <span className="font-semibold text-slate-800">{m.name}</span>
                  <StatusPill status={m.role} />
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.email)}
                    className="p-0.5 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Workspace...' : 'Initialize Project'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
