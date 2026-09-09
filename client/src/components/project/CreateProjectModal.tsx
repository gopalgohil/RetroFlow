'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderPlus,
  Sparkles,
  Users,
  Calendar,
  Layers,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  ProjectType,
  SprintCadence,
  ProjectMemberRole,
  CreateProjectPayload,
  Project,
} from '@/types/project';
import { MOCK_PROJECT_LEADS, ProjectDataService } from '@/services/mockProjectData';
import { ProjectApiService } from '@/services/projectApi';
import { api, ENDPOINTS } from '@/lib/api';
import { Modal, StatusPill, UserAvatar } from '@/components/ui';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const CADENCE_OPTIONS: { id: SprintCadence; label: string; desc: string }[] = [
  { id: '1_week', label: '1 Week', desc: 'Fast turnaround' },
  { id: '2_weeks', label: '2 Weeks', desc: 'Industry standard' },
  { id: '3_weeks', label: '3 Weeks', desc: 'Enterprise cadence' },
  { id: 'custom', label: 'Custom', desc: 'Flexible days' },
];

interface WorkspaceMemberOption {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

const DEFAULT_WORKSPACE_LEADS: WorkspaceMemberOption[] = [
  { id: 'lead-gopal', name: 'Gopal Gohel', email: 'gopalgohel249@gmail.com', role: 'Admin', avatar: 'GG' },
  { id: 'lead-sarah', name: 'Sarah Jenkins', email: 'sarah.j@retroflow.io', role: 'Team Member', avatar: 'SJ' },
  { id: 'lead-marcus', name: 'Marcus Chen', email: 'marcus.c@retroflow.io', role: 'Team Member', avatar: 'MC' },
  { id: 'lead-priya', name: 'Priya Sharma', email: 'priya.s@retroflow.io', role: 'Team Member', avatar: 'PS' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ProjectType>('scrum');
  const [availableLeads, setAvailableLeads] = useState<WorkspaceMemberOption[]>(DEFAULT_WORKSPACE_LEADS);
  const [selectedLeadEmail, setSelectedLeadEmail] = useState<string>('gopalgohel249@gmail.com');
  const [cadence, setCadence] = useState<SprintCadence>('2_weeks');
  const [customDays, setCustomDays] = useState(10);

  // Dynamic Workspace Members fetch on Modal Open
  React.useEffect(() => {
    if (!isOpen) return;

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

        if (currentUser?.email) {
          setSelectedLeadEmail(currentUser.email);
        } else if (list.length > 0) {
          setSelectedLeadEmail(list[0].email);
        }
      })
      .catch(() => {
        if (currentUser?.email) {
          setSelectedLeadEmail(currentUser.email);
        }
      });
  }, [isOpen]);

  // Team Members State
  const [members, setMembers] = useState<
    Array<{ name: string; email: string; role: ProjectMemberRole }>
  >([
    { name: 'Sarah Jenkins', email: 'sarah.j@retroflow.io', role: 'Developer' },
    { name: 'Marcus Chen', email: 'marcus.c@retroflow.io', role: 'QA' },
  ]);

  // Input states for adding new member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole>('Developer');
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
    if (!newMemberName.trim()) {
      setMemberError('Please enter member full name');
      return;
    }
    if (!newMemberEmail.trim() || !newMemberEmail.includes('@')) {
      setMemberError('Please enter a valid work email');
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
      setMemberError('Member with this email is already added');
      return;
    }

    setMembers((prev) => [
      ...prev,
      {
        name: newMemberName.trim(),
        email: newMemberEmail.trim().toLowerCase(),
        role: newMemberRole,
      },
    ]);

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('Developer');
    setMemberError('');
  };

  const handleRemoveMember = (email: string) => {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const chosenLead = availableLeads.find(
      (l) => l.email.toLowerCase() === selectedLeadEmail.toLowerCase()
    ) || {
      id: 'lead-1',
      name: 'Gopal Gohel',
      email: selectedLeadEmail || 'gopalgohel249@gmail.com',
      avatar: 'GG',
    };

    const cleanLeadName = chosenLead.name.replace(/\s*\(You\)\s*/i, '').trim();

    // Automatically ensure the designated Project Lead is registered as Manager
    const otherMembers = members.filter(
      (m) => m.email.toLowerCase().trim() !== chosenLead.email.toLowerCase().trim()
    );

    const finalMembers = [
      {
        name: cleanLeadName,
        email: chosenLead.email.toLowerCase().trim(),
        role: 'Manager' as ProjectMemberRole,
      },
      ...otherMembers,
    ];

    const payload: CreateProjectPayload = {
      name: name.trim(),
      key: key.trim() || name.slice(0, 3).toUpperCase(),
      description: description.trim(),
      type,
      leadId: chosenLead.id,
      lead: {
        id: chosenLead.id,
        name: cleanLeadName,
        email: chosenLead.email,
        avatar: chosenLead.avatar || cleanLeadName.slice(0, 2).toUpperCase(),
      },
      members: finalMembers,
      cadence,
      customCadenceDays: cadence === 'custom' ? customDays : undefined,
    };

    try {
      // Live REST API POST request -> visible in browser Network tab!
      const created = await ProjectApiService.createProject(payload);
      setIsSubmitting(false);
      onProjectCreated(created);
      onClose();
      // Reset form
      setName('');
      setKey('');
      setIsKeyManuallyEdited(false);
      setDescription('');
    } catch (err) {
      console.warn('[CreateProject] Fallback to local persistence:', err);
      const fallback = ProjectDataService.createProject(payload);
      setIsSubmitting(false);
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
      description="Setup team workspace, sprint cadence, and retro linkage"
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

        {/* Section 2: Methodology (Scrum vs Kanban) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Project Framework & Methodology
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('scrum')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                type === 'scrum'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  type === 'scrum' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Scrum Sprints</span>
                  {type === 'scrum' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Time-boxed sprints, velocity tracking, and sprint retrospectives.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('kanban')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                type === 'kanban'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  type === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Continuous Kanban</span>
                  {type === 'kanban' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Continuous flow, WIP limits, on-demand cycle retros.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 3: Project Lead & Cadence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Project Lead / Manager
            </label>
            <div className="relative">
              <select
                value={selectedLeadEmail}
                onChange={(e) => setSelectedLeadEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {availableLeads.map((lead) => (
                  <option key={lead.email} value={lead.email}>
                    {lead.name} ({lead.email}) • {lead.role || 'Member'}
                  </option>
                ))}
              </select>
              <ShieldCheck className="w-4 h-4 text-indigo-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400">Responsible for sprint planning & retros.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Sprint Cadence</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CADENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCadence(opt.id)}
                  className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    cadence === opt.id
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {cadence === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-20 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                />
                <span className="text-xs text-slate-500 font-medium">Days per sprint</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Team Members with Roles */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Team Members & Initial Roles ({members.length})
            </label>
            <span className="text-[11px] text-slate-400">Can be updated anytime</span>
          </div>

          {/* Add Member Row */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newMemberName}
                  onChange={(e) => {
                    setNewMemberName(e.target.value);
                    setMemberError('');
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="email"
                  placeholder="work.email@retroflow.io"
                  value={newMemberEmail}
                  onChange={(e) => {
                    setNewMemberEmail(e.target.value);
                    setMemberError('');
                  }}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as ProjectMemberRole)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Developer">Developer</option>
                  <option value="QA">QA Specialist</option>
                  <option value="Manager">Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={() => handleAddMember()}
                  className="w-full h-full min-h-[30px] flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Add Member"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {memberError && <p className="text-[11px] text-rose-500 font-medium">{memberError}</p>}
          </div>

          {/* List of Current Members */}
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
