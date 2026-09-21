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
  AlertCircle,
} from 'lucide-react';
import {
  ProjectType,
  ProjectMemberRole,
  CreateProjectPayload,
  Project,
} from '@/types/project';
import { ProjectDataService } from '@/services/mockProjectData';
import { ProjectApiService, MembersApiService } from '@/services/projectApi';
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

const DEFAULT_WORKSPACE_LEADS: WorkspaceMemberOption[] = [];

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

  // Team Member Dropdown selection state (Multi-Select)
  const [selectedMemberEmails, setSelectedMemberEmails] = useState<string[]>([]);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = React.useRef<HTMLDivElement>(null);

  const toggleMemberSelection = (email: string) => {
    const lower = email.toLowerCase().trim();
    setSelectedMemberEmails((prev) =>
      prev.includes(lower) ? prev.filter((e) => e !== lower) : [...prev, lower]
    );
    setMemberError('');
  };

  const handleSelectAll = (unaddedEmails: string[]) => {
    const normalized = unaddedEmails.map((e) => e.toLowerCase().trim());
    const allSelected =
      normalized.length > 0 &&
      normalized.every((e) => selectedMemberEmails.includes(e));

    if (allSelected) {
      setSelectedMemberEmails([]);
    } else {
      setSelectedMemberEmails(normalized);
    }
    setMemberError('');
  };

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
      setSelectedMemberEmails([]);
      setNewMemberRole('Developer');
      setMembers([]);
      setMemberError('');
      setErrors({});
      setTouched({});
      return;
    }

    let currentUser: any = null;
    try {
      const savedUser = localStorage.getItem('retroflow_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    } catch {}

    MembersApiService.getWorkspaceMembers()
      .then((rawMembers) => {
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
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole>('Developer');
  const [memberError, setMemberError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation State
  const [errors, setErrors] = useState<{
    name?: string;
    key?: string;
    description?: string;
    members?: string;
    general?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    key?: boolean;
    description?: boolean;
    members?: boolean;
  }>({});

  const validateForm = (currentMembers = members): boolean => {
    const errs: {
      name?: string;
      key?: string;
      description?: string;
      members?: string;
    } = {};

    if (!name.trim()) {
      errs.name = 'Project name is required and cannot be blank';
    } else if (name.trim().length < 2) {
      errs.name = 'Project name must be at least 2 characters';
    }

    if (!key.trim()) {
      errs.key = 'Project key is required and cannot be blank';
    } else if (key.trim().length < 2) {
      errs.key = 'Project key must be at least 2 characters';
    } else if (!/^[A-Z0-9]+$/i.test(key.trim())) {
      errs.key = 'Project key must contain only letters and numbers';
    }

    if (!description.trim()) {
      errs.description = 'Project description is required and cannot be blank';
    } else if (description.trim().length < 5) {
      errs.description = 'Project description must be at least 5 characters';
    }

    if (currentMembers.length === 0) {
      errs.members = 'Please add at least one team member to this project';
    }

    setErrors((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  // Auto-generate 3-4 letter project key from project name
  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined, general: undefined }));
    }
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
      if (derivedKey && errors.key) {
        setErrors((prev) => ({ ...prev, key: undefined }));
      }
    }
  };

  const handleKeyChange = (val: string) => {
    setIsKeyManuallyEdited(true);
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setKey(cleaned);
    if (cleaned && errors.key) {
      setErrors((prev) => ({ ...prev, key: undefined, general: undefined }));
    }
  };

  const handleAddMember = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedMemberEmails.length === 0) {
      setMemberError('Please select at least one team member');
      return;
    }

    if (!newMemberRole) {
      setMemberError('Please select a role for the chosen member(s)');
      return;
    }

    const newAdditions: Array<{ name: string; email: string; role: ProjectMemberRole }> = [];

    for (const email of selectedMemberEmails) {
      const chosen = availableLeads.find(
        (l) => l.email.toLowerCase() === email.toLowerCase()
      );
      if (!chosen) continue;
      if (members.some((m) => m.email.toLowerCase() === chosen.email.toLowerCase())) continue;
      if (newAdditions.some((m) => m.email.toLowerCase() === chosen.email.toLowerCase())) continue;

      const cleanName = chosen.name.replace(/\s*\(You\)\s*/i, '').trim();
      newAdditions.push({
        name: cleanName,
        email: chosen.email.toLowerCase().trim(),
        role: newMemberRole as ProjectMemberRole,
      });
    }

    if (newAdditions.length === 0) {
      setMemberError('All selected members are already added to the project');
      return;
    }

    setMembers((prev) => [...prev, ...newAdditions]);
    setSelectedMemberEmails([]);
    setNewMemberRole('Developer');
    setMemberError('');
    setIsMemberDropdownOpen(false);
    if (errors.members) {
      setErrors((prev) => ({ ...prev, members: undefined, general: undefined }));
    }
  };

  const handleRemoveMember = (email: string) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.email !== email);
      if (updated.length === 0 && touched.members) {
        setErrors((errs) => ({
          ...errs,
          members: 'Please add at least one team member to this project',
        }));
      }
      return updated;
    });
  };

  const handleUpdateMemberRole = (email: string, newRole: ProjectMemberRole) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.email.toLowerCase() === email.toLowerCase() ? { ...m, role: newRole } : m
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      name: true,
      key: true,
      description: true,
      members: true,
    });

    let currentMembers = [...members];

    // If user has selected members and a role in the dropdown row, auto-add them before validation
    if (selectedMemberEmails.length > 0 && newMemberRole) {
      for (const email of selectedMemberEmails) {
        const chosen = availableLeads.find(
          (l) => l.email.toLowerCase() === email.toLowerCase()
        );
        if (chosen && !currentMembers.some((m) => m.email.toLowerCase() === chosen.email.toLowerCase())) {
          const cleanName = chosen.name.replace(/\s*\(You\)\s*/i, '').trim();
          currentMembers.push({
            name: cleanName,
            email: chosen.email.toLowerCase().trim(),
            role: newMemberRole as ProjectMemberRole,
          });
        }
      }
      setMembers(currentMembers);
      setSelectedMemberEmails([]);
      setNewMemberRole('Developer');
      setMemberError('');
      setIsMemberDropdownOpen(false);
    }

    if (!validateForm(currentMembers)) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Determine lead: check if any member was assigned Project Lead or Manager, else default to Gopal
    const designatedLead =
      currentMembers.find((m) => m.role === 'Project Lead') ||
      currentMembers.find((m) => m.role === 'Manager') ||
      availableLeads[0] || {
        id: 'lead-primary',
        name: 'Project Lead',
        email: '',
        avatar: 'PL',
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
      members: currentMembers,
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
      setSelectedMemberEmails([]);
      setNewMemberRole('Developer');
      setErrors({});
      setTouched({});
    } catch (err: any) {
      console.error('[CreateProject] API error:', err);
      const apiMsg = err?.response?.data?.message || err?.message || 'Failed to initialize project in database';
      setErrors((prev) => ({ ...prev, general: apiMsg }));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Setup team workspace and agile retro linkage"
      icon={<FolderPlus className="w-5 h-5" />}
      maxWidth="2xl"
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
            form="create-project-form"
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/25 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a] dark:shadow-[#88c958]/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Workspace...' : 'Initialize Project'}</span>
          </button>
        </>
      }
    >
      <form id="create-project-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* General Error Alert if Server / Network Fails */}
        {errors.general && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Section 1: Project Identity & Key */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Payment Gateway Integration"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, name: true }));
                if (!name.trim()) {
                  setErrors((prev) => ({ ...prev, name: 'Project name is required and cannot be blank' }));
                } else if (name.trim().length < 2) {
                  setErrors((prev) => ({ ...prev, name: 'Project name must be at least 2 characters' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12151c] border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all ${
                touched.name && errors.name
                  ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/30 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-white/[0.08] focus:ring-[#88c958]/30 focus:border-[#88c958]'
              }`}
            />
            {touched.name && errors.name ? (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.name}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                A clear, descriptive name for your initiative or product area.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Project Key <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-[#88c958] font-semibold">Auto-generated</span>
            </div>
            <input
              type="text"
              required
              maxLength={5}
              placeholder="PGI"
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, key: true }));
                if (!key.trim()) {
                  setErrors((prev) => ({ ...prev, key: 'Project key is required and cannot be blank' }));
                } else if (key.trim().length < 2) {
                  setErrors((prev) => ({ ...prev, key: 'Project key must be at least 2 characters' }));
                }
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12151c] border rounded-xl text-xs sm:text-sm font-mono font-bold tracking-wider text-[#88c958] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all uppercase ${
                touched.key && errors.key
                  ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/30 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-white/[0.08] focus:ring-[#88c958]/30 focus:border-[#88c958]'
              }`}
            />
            {touched.key && errors.key ? (
              <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.key}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Prefix for issues & sprints (e.g. PGI).</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Project Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="Primary goals, technical scope, or architecture notes..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined, general: undefined }));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, description: true }));
              if (!description.trim()) {
                setErrors((prev) => ({ ...prev, description: 'Project description is required and cannot be blank' }));
              } else if (description.trim().length < 5) {
                setErrors((prev) => ({ ...prev, description: 'Project description must be at least 5 characters' }));
              }
            }}
            className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#12151c] border rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all resize-none ${
              touched.description && errors.description
                ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500/30 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-white/[0.08] focus:ring-[#88c958]/30 focus:border-[#88c958]'
            }`}
          />
          {touched.description && errors.description ? (
            <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 animate-in fade-in">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errors.description}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Briefly describe the initiative scope, objectives, and deliverables.
            </p>
          )}
        </div>

        {/* Team Members with Roles */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#88c958]" />
              <span>
                Team Members & Initial Roles <span className="text-rose-500">*</span>
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#141720] text-slate-600 dark:text-slate-300">
                {members.length} added
              </span>
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">At least 1 member required</span>
          </div>

          {touched.members && errors.members && members.length === 0 && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errors.members}</span>
            </div>
          )}

          {/* Add Member Selector Row */}
          <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#12151c]/60 border border-slate-200/90 dark:border-white/[0.08] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Member Dropdown Picker */}
              <div className="sm:col-span-7 relative" ref={memberDropdownRef}>
                {(() => {
                  const unaddedMembers = availableLeads.filter(
                    (m) => !members.some((existing) => existing.email.toLowerCase() === m.email.toLowerCase())
                  );
                  const selectedCount = selectedMemberEmails.length;
                  const firstSelected =
                    selectedCount === 1
                      ? availableLeads.find(
                          (l) => l.email.toLowerCase() === selectedMemberEmails[0]
                        )
                      : null;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsMemberDropdownOpen((prev) => !prev)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] hover:border-[#88c958] dark:hover:border-[#88c958] rounded-xl flex items-center justify-between transition-all text-left shadow-2xs cursor-pointer min-h-[42px]"
                      >
                        {selectedCount > 1 ? (
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-[#88c958]/15 text-[#88c958] font-bold text-xs shrink-0">
                              {selectedCount} Selected
                            </span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                              {selectedMemberEmails
                                .map((e) => {
                                  const lead = availableLeads.find(
                                    (l) => l.email.toLowerCase() === e
                                  );
                                  return lead ? lead.name.split(' ')[0] : e;
                                })
                                .join(', ')}
                            </span>
                          </div>
                        ) : firstSelected ? (
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-7 h-7 rounded-lg bg-[#5cb028] text-white dark:bg-[#88c958] dark:text-[#08090a] font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                              {firstSelected.avatar || firstSelected.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                                {firstSelected.name}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate leading-tight">
                                {firstSelected.email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 text-slate-400 dark:text-slate-500">
                            <div className="w-7 h-7 rounded-lg border border-dashed border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-[#141720] flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium">Select team member(s)...</span>
                          </div>
                        )}

                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-150 shrink-0 ${
                            isMemberDropdownOpen ? 'rotate-180 text-[#88c958]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isMemberDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-white dark:bg-[#0e1015] border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-xl space-y-1 max-h-60 overflow-y-auto">
                          {/* Quick Select All Header */}
                          {unaddedMembers.length > 0 && (
                            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-white/[0.08] mb-1">
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {selectedCount > 0
                                  ? `${selectedCount} of ${unaddedMembers.length} selected`
                                  : 'Select team members'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSelectAll(unaddedMembers.map((m) => m.email));
                                }}
                                className="text-[11px] font-bold text-[#88c958] hover:text-[#76b349] transition-colors cursor-pointer"
                              >
                                {unaddedMembers.length > 0 &&
                                unaddedMembers.every((m) =>
                                  selectedMemberEmails.includes(m.email.toLowerCase())
                                )
                                  ? 'Deselect All'
                                  : 'Select All'}
                              </button>
                            </div>
                          )}

                          {availableLeads.map((m) => {
                            const isAdded = members.some(
                              (existing) => existing.email.toLowerCase() === m.email.toLowerCase()
                            );
                            const isSelected = selectedMemberEmails.includes(m.email.toLowerCase());

                            return (
                              <div
                                key={m.email}
                                onClick={() => {
                                  if (!isAdded) {
                                    toggleMemberSelection(m.email);
                                  }
                                }}
                                className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors select-none ${
                                  isAdded
                                    ? 'opacity-50 bg-slate-50 dark:bg-[#12151c]/40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                                    : isSelected
                                    ? 'bg-[#88c958]/15 dark:bg-[#88c958]/20 border border-[#88c958]/40 text-slate-900 dark:text-white cursor-pointer'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-transparent text-slate-700 dark:text-slate-300 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  {/* Left Checkbox */}
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                      isAdded
                                        ? 'border-slate-300 dark:border-white/[0.08] bg-slate-100 dark:bg-[#141720] text-slate-400 dark:text-slate-500'
                                        : isSelected
                                        ? 'bg-[#5cb028] border-[#5cb028] text-white dark:bg-[#88c958] dark:border-[#88c958] dark:text-[#08090a] shadow-xs'
                                        : 'border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#141720] hover:border-[#88c958]'
                                    }`}
                                  >
                                    {(isSelected || isAdded) && (
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    )}
                                  </div>

                                  {/* Member Avatar */}
                                  <div className="w-6 h-6 rounded-md bg-[#88c958]/15 text-[#88c958] font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {m.avatar || m.name.slice(0, 2).toUpperCase()}
                                  </div>

                                  {/* Name and Email */}
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                      {m.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                      {m.email}
                                    </p>
                                  </div>
                                </div>

                                {isAdded ? (
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#141720] shrink-0">
                                    Added
                                  </span>
                                ) : isSelected ? (
                                  <span className="text-[10px] font-bold text-[#88c958] shrink-0">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
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
                  className="w-full px-2.5 py-2 bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] hover:border-[#88c958]/60 dark:hover:border-[#88c958]/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer min-h-[42px] shadow-2xs transition-colors"
                >
                  <option value="Developer" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">Developer</option>
                  <option value="QA" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">QA</option>
                  <option value="Manager" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">Manager</option>
                  <option value="DevOps" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">DevOps</option>
                  <option value="Project Lead" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white">Project Lead</option>
                </select>
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => handleAddMember()}
                  className="w-full py-2 px-3 flex items-center justify-center gap-1.5 bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[42px] dark:bg-[#88c958] dark:hover:bg-[#76b349] dark:text-[#08090a]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {selectedMemberEmails.length > 1
                      ? `Add (${selectedMemberEmails.length})`
                      : 'Add'}
                  </span>
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
                  className="inline-flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-white dark:bg-[#12151c] border border-slate-200 dark:border-white/[0.08] text-xs shadow-2xs hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors"
                >
                  <UserAvatar name={m.name} email={m.email} title={m.email} size="xs" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>

                  {/* Editable Role Dropdown */}
                  <div className="relative inline-flex items-center">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleUpdateMemberRole(m.email, e.target.value as ProjectMemberRole)
                      }
                      title={`Change role for ${m.name}`}
                      className="appearance-none text-[11px] font-semibold tracking-tight pl-2 pr-5 py-0.5 rounded-md bg-[#88c958]/15 text-[#88c958] border border-[#88c958]/30 hover:bg-[#88c958]/25 focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer transition-colors"
                    >
                      <option value="Developer" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white font-medium">Developer</option>
                      <option value="QA" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white font-medium">QA</option>
                      <option value="Manager" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white font-medium">Manager</option>
                      <option value="DevOps" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white font-medium">DevOps</option>
                      <option value="Project Lead" className="bg-white dark:bg-[#12151c] text-slate-900 dark:text-white font-medium">Project Lead</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#88c958] absolute right-1 pointer-events-none" />
                  </div>
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
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
