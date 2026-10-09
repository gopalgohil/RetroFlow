'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Check,
  User,
  ListFilter,
  CheckSquare,
  Square,
  ShieldAlert,
  Star,
  Trophy,
  Users,
  MessageSquare,
  Award,
} from 'lucide-react';
import { RetroTopic, StickyCard } from '@/types/retro';
import { useRetroProjectIntegration } from '@/hooks/useRetroProjectIntegration';
import { ScorecardApiService, MemberRatingInput } from '@/services/scorecardApi';
import { Modal, UserAvatar } from '@/components/ui';

export interface EndSessionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  retroId: string;
  retroTitle: string;
  cards: StickyCard[];
  topics?: RetroTopic[];
  projectId?: string | null;
  projectKey?: string | null;
  sprintId?: string | null;
  sprintName?: string | null;
  onSessionEnded?: () => void;
  mode?: 'export_only' | 'end_and_export';
  canExport?: boolean;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    projectRole?: string;
  } | null;
}

interface ItemConfig {
  assigneeName: string;
  storyPoints: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MemberEvaluationState {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  avatar?: string;
  enabled: boolean;
  quality: number; // 1-5 (35%)
  timeliness: number; // 1-5 (25%)
  communication: number; // 1-5 (25%)
  collaboration: number; // 1-5 (15%)
  feedback: string;
}

// 1 to 5 Star Rating Row Component
const StarCriteriaRow = ({
  label,
  weight,
  value,
  onChange,
}: {
  label: string;
  weight: string;
  value: number;
  onChange: (val: number) => void;
}) => {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({weight})</span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 rounded hover:scale-125 transition-transform cursor-pointer focus:outline-none"
            title={`${star} Star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                star <= value
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.4)]'
                  : 'text-slate-300 dark:text-slate-700 hover:text-amber-200'
              }`}
            />
          </button>
        ))}
        <span className="w-5 text-right text-xs font-bold text-slate-700 dark:text-slate-200 ml-1 font-mono">
          {value}
        </span>
      </div>
    </div>
  );
};

export const EndSessionExportModal: React.FC<EndSessionExportModalProps> = ({
  isOpen,
  onClose,
  retroId,
  retroTitle,
  cards,
  topics,
  projectId,
  projectKey,
  sprintId,
  sprintName,
  onSessionEnded,
  mode = 'end_and_export',
  canExport = true,
  currentUser,
}) => {
  const {
    projects,
    isExporting,
    exportSuccess,
    exportedCount,
    lastExportedSprint,
    getSuggestedSprint,
    exportActionItems,
    resetExportState,
  } = useRetroProjectIntegration();

  // Active Tab: 'actions' | 'ratings'
  const [activeTab, setActiveTab] = useState<'actions' | 'ratings'>('actions');

  // Filter cards strictly belonging to Action Items topic(s)
  const actionCards = useMemo(() => {
    const actionTopicIds = new Set<string>();
    (topics || []).forEach((t) => {
      const titleLower = (t.title || '').toLowerCase();
      if (
        titleLower.includes('action') ||
        t.icon === 'target' ||
        (t.topicId && t.topicId.toLowerCase().includes('action'))
      ) {
        actionTopicIds.add(t.topicId);
      }
    });

    return cards.filter((c) => {
      if (c.topicId && actionTopicIds.has(c.topicId)) return true;
      const textLower = (c.text || '').toLowerCase().trim();
      if (
        textLower.startsWith('action:') ||
        textLower.startsWith('[action]') ||
        textLower.startsWith('todo:')
      ) {
        return true;
      }
      if (c.topicId && c.topicId.toLowerCase().includes('action')) return true;
      return false;
    });
  }, [cards, topics]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [itemConfigs, setItemConfigs] = useState<Record<string, ItemConfig>>({});

  // Team Star Ratings State
  const [memberEvaluations, setMemberEvaluations] = useState<Record<string, MemberEvaluationState>>({});
  const [isSubmittingRatings, setIsSubmittingRatings] = useState(false);
  const [submittedRatingsCount, setSubmittedRatingsCount] = useState<number>(0);
  const [ratingsSubmittedSuccess, setRatingsSubmittedSuccess] = useState(false);

  // Auto-select linked project & linked individual sprint
  useEffect(() => {
    if (projects.length === 0) return;

    let targetProj = projects[0];
    if (projectId || projectKey) {
      const matched = projects.find(
        (p) =>
          (projectId && (p.id === projectId || (p as any)._id === projectId)) ||
          (projectKey && p.key?.toUpperCase() === projectKey.toUpperCase())
      );
      if (matched) targetProj = matched;
    }
    setSelectedProjectId(targetProj.id);

    let targetSprint = null;
    if (sprintId) {
      targetSprint = targetProj.sprints?.find((s) => s.id === sprintId);
    }
    if (!targetSprint && sprintName) {
      const match = sprintName.match(/\d+/);
      const sprintNum = match ? parseInt(match[0], 10) : null;
      targetSprint = targetProj.sprints?.find(
        (s) =>
          (sprintNum !== null && s.number === sprintNum) ||
          s.name.toLowerCase().includes(sprintName.toLowerCase())
      );
    }
    if (!targetSprint && retroTitle) {
      const match = retroTitle.match(/sprint\s*(\d+)/i);
      if (match) {
        const sprintNum = parseInt(match[1], 10);
        targetSprint = targetProj.sprints?.find(
          (s) =>
            s.number === sprintNum ||
            s.name.toLowerCase().includes(`sprint ${sprintNum}`)
        );
      }
    }
    if (!targetSprint) {
      targetSprint = getSuggestedSprint(targetProj.id) || targetProj.sprints?.[0] || null;
    }
    if (targetSprint) {
      setSelectedSprintId(targetSprint.id);
    }
  }, [projects, projectId, projectKey, sprintId, sprintName, retroTitle, getSuggestedSprint, isOpen]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const suggestedSprint = useMemo(() => {
    return selectedProject ? getSuggestedSprint(selectedProject.id) : null;
  }, [selectedProject, getSuggestedSprint]);

  // Aggregate Ratable Team Members (From Project Members + Retro Card Authors)
  const ratableMembersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; role: string; avatar?: string }>();

    // 1. Members from the selected project
    if (selectedProject?.members && selectedProject.members.length > 0) {
      for (const m of selectedProject.members) {
        const email = (m.email || '').toLowerCase().trim();
        if (email) {
          map.set(email, {
            id: m.id || `pm-${email.split('@')[0]}`,
            name: m.name,
            email: email,
            role: m.role || 'Developer',
            avatar: m.avatar,
          });
        }
      }
    }

    // 2. Add any retro card authors who might not be in the project member list
    for (const c of cards) {
      if (c.author && c.author.trim()) {
        const name = c.author.trim();
        const email = (c.authorEmail || `${name.toLowerCase().replace(/\s+/g, '.')}@retroflow.local`).toLowerCase().trim();
        if (!map.has(email)) {
          map.set(email, {
            id: `author-${email.split('@')[0]}`,
            name: name,
            email: email,
            role: 'Participant',
            avatar: undefined,
          });
        }
      }
    }

    // 3. Fallback: if project list was empty, pull from any other available projects
    if (map.size === 0) {
      for (const p of projects) {
        if (p.members) {
          for (const m of p.members) {
            const email = (m.email || '').toLowerCase().trim();
            if (email && !map.has(email)) {
              map.set(email, {
                id: m.id,
                name: m.name,
                email: email,
                role: m.role || 'Developer',
                avatar: m.avatar,
              });
            }
          }
        }
      }
    }

    return Array.from(map.values());
  }, [selectedProject, cards, projects]);

  // Initialize selected card IDs and evaluations when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default tab: if action cards exist, start on actions; otherwise start on ratings
      if (actionCards.length > 0) {
        setActiveTab('actions');
        const ids = actionCards.map((c) => c.id);
        setSelectedCardIds(ids);

        const initialConfigs: Record<string, ItemConfig> = {};
        actionCards.forEach((c) => {
          initialConfigs[c.id] = {
            assigneeName: '',
            storyPoints: 3,
            priority: 'high',
          };
        });
        setItemConfigs(initialConfigs);
      } else {
        setActiveTab('ratings');
      }

      // Initialize team members evaluations
      const initialEvals: Record<string, MemberEvaluationState> = {};
      ratableMembersList.forEach((m) => {
        initialEvals[m.email] = {
          memberId: m.id,
          memberName: m.name,
          memberEmail: m.email,
          memberRole: m.role,
          avatar: m.avatar,
          enabled: true, // evaluated by default
          quality: 4,
          timeliness: 4,
          communication: 4,
          collaboration: 4,
          feedback: '',
        };
      });
      setMemberEvaluations(initialEvals);
      setRatingsSubmittedSuccess(false);
      setSubmittedRatingsCount(0);
    }
  }, [isOpen, actionCards, ratableMembersList]);

  // Toggle single card selection
  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  const isAllSelected = actionCards.length > 0 && selectedCardIds.length === actionCards.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(actionCards.map((c) => c.id));
    }
  };

  const handleUpdateItemConfig = (cardId: string, updates: Partial<ItemConfig>) => {
    setItemConfigs((prev) => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || { assigneeName: '', storyPoints: 3, priority: 'high' }),
        ...updates,
      },
    }));
  };

  // Update member evaluation state
  const handleUpdateMemberEvaluation = (email: string, updates: Partial<MemberEvaluationState>) => {
    setMemberEvaluations((prev) => ({
      ...prev,
      [email]: {
        ...prev[email],
        ...updates,
      },
    }));
  };

  // Calculate live weighted score for a member
  const getMemberLiveScore = (m: MemberEvaluationState) => {
    const q = m.quality * 0.35;
    const t = m.timeliness * 0.25;
    const c = m.communication * 0.25;
    const col = m.collaboration * 0.15;
    return Number((q + t + c + col).toFixed(2));
  };

  const enabledMembersCount = useMemo(() => {
    return Object.values(memberEvaluations).filter((m) => m.enabled).length;
  }, [memberEvaluations]);

  // Main Commit & End Session Handler
  const handleExportAndCommit = async () => {
    if (!canExport) {
      alert('Access Denied: Only Workspace Admins and Project Managers can export action items and evaluate team members.');
      return;
    }

    const sprintIdToUse = selectedSprintId || suggestedSprint?.id || selectedProject?.sprints?.[0]?.id;

    // 1. Export Action Items if selected
    if (selectedProject && selectedCardIds.length > 0) {
      const itemsToExport = actionCards
        .filter((c) => selectedCardIds.includes(c.id))
        .map((c) => {
          const cfg = itemConfigs[c.id] || { assigneeName: '', storyPoints: 3, priority: 'high' };
          const matchedMember = selectedProject.members?.find(
            (m) => m.name.toLowerCase() === cfg.assigneeName.toLowerCase()
          );

          return {
            id: c.id,
            text: c.text,
            storyPoints: cfg.storyPoints,
            priority: cfg.priority,
            assignee: matchedMember
              ? { name: matchedMember.name, avatar: matchedMember.avatar }
              : cfg.assigneeName
              ? { name: cfg.assigneeName, avatar: cfg.assigneeName.slice(0, 2).toUpperCase() }
              : undefined,
          };
        });

      await exportActionItems({
        projectId: selectedProject.id,
        sprintId: sprintIdToUse,
        retroId,
        retroTitle,
        actionCards: itemsToExport,
      });
    }

    // 2. Submit Star Ratings if any members enabled
    const enabledEvals = Object.values(memberEvaluations).filter((m) => m.enabled);
    if (enabledEvals.length > 0) {
      setIsSubmittingRatings(true);
      try {
        const payload: MemberRatingInput[] = enabledEvals.map((m) => ({
          memberId: m.memberId,
          memberName: m.memberName,
          memberEmail: m.memberEmail,
          memberRole: m.memberRole,
          ratings: {
            quality: m.quality,
            timeliness: m.timeliness,
            communication: m.communication,
            collaboration: m.collaboration,
          },
          feedback: m.feedback,
        }));

        await ScorecardApiService.submitScorecards(payload, {
          projectId: selectedProject?.id || projectId || null,
          projectKey: selectedProject?.key || projectKey || null,
          retroId,
          retroTitle,
          sprintId: sprintIdToUse || null,
          sprintName: selectedProject?.sprints?.find((s) => s.id === sprintIdToUse)?.name || sprintName || null,
        });

        setSubmittedRatingsCount(enabledEvals.length);
        setRatingsSubmittedSuccess(true);
      } catch (err: any) {
        console.error('Failed to submit star ratings:', err);
      } finally {
        setIsSubmittingRatings(false);
      }
    }

    if (onSessionEnded && mode === 'end_and_export') {
      onSessionEnded();
    }
  };

  const handleClose = () => {
    resetExportState();
    setRatingsSubmittedSuccess(false);
    onClose();
  };

  const isFinalSuccess = exportSuccess || ratingsSubmittedSuccess;
  const isUserAdmin = currentUser?.role?.toLowerCase() === 'admin' || (currentUser?.email || '').toLowerCase().includes('admin');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isFinalSuccess ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>Retrospective Session Completed!</span>
          </div>
        ) : mode === 'export_only' ? (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#88c958]" />
            <span>Select & Export Action Items</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>End Session & Evaluate Team</span>
          </div>
        )
      }
      description={
        isFinalSuccess
          ? 'Retrospective deliverables committed to sprint backlog and team performance scorecard recorded.'
          : 'Export deliverables into the sprint backlog and rate team performance with Mehul Bhai’s weighted formula.'
      }
      maxWidth="4xl"
      footer={
        !isFinalSuccess ? (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 pt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {selectedCardIds.length} Action Items
              </span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {enabledMembersCount} Members to Rate
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExportAndCommit}
                disabled={
                  isExporting ||
                  isSubmittingRatings ||
                  !canExport ||
                  (selectedCardIds.length === 0 && enabledMembersCount === 0)
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5cb028] hover:bg-[#4e9921] text-white text-xs font-bold shadow-md shadow-[#5cb028]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:bg-[#88c958] dark:hover:bg-[#76b846] dark:text-[#08090a]"
              >
                {isExporting || isSubmittingRatings ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Committing Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      End Session & Save ({selectedCardIds.length} Items, {enabledMembersCount} Rated)
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Permission Denied Warning */}
        {!isFinalSuccess && !canExport && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Restricted Access (Workspace Admin & Manager Only)</p>
              <p className="text-amber-700 dark:text-amber-300/80 text-[11px] mt-0.5">
                Only Workspace Administrators and Project Managers can export retrospective action items to sprints and evaluate team members.
              </p>
            </div>
          </div>
        )}

        {isFinalSuccess ? (
          /* ========================================================================= */
          /* SUCCESS STATE                                                             */
          /* ========================================================================= */
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-95 duration-200">
              <Check className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Retrospective Session Successfully Finalized!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                All deliverables and team evaluations have been recorded into the workspace database.
              </p>
            </div>

            {/* Metric Summary Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-1">
              {exportedCount > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2 text-xs">
                  <Layers className="w-4 h-4 text-[#88c958]" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{exportedCount}</span>
                  <span className="text-slate-500">Action Items Exported</span>
                </div>
              )}

              {submittedRatingsCount > 0 && (
                <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2 text-xs">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{submittedRatingsCount}</span>
                  <span className="text-slate-500">Team Members Rated</span>
                </div>
              )}
            </div>

            {/* Next Steps Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              {selectedProject && (
                <Link
                  href={`/projects/${selectedProject.id}?tab=sprints`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5cb028] text-white text-xs font-bold hover:bg-[#4e9921] transition-all shadow-xs hover:scale-[1.02] dark:bg-[#88c958] dark:text-[#08090a] dark:hover:bg-[#76b846]"
                >
                  <Layers className="w-4 h-4" />
                  <span>Open Sprint Backlog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Strict Admin Check: Scoreboard link only shown to Admin */}
              {isUserAdmin && (
                <Link
                  href="/dashboard?tab=team_scoreboard"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>View Team Scoreboard (Admin Only)</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* ACTIVE CONFIGURATION & RATING STATE                                       */
          /* ========================================================================= */
          <>
            {/* Segmented Top Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-2">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#12151c] rounded-xl border border-slate-200/70 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveTab('actions')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'actions'
                      ? 'bg-white dark:bg-[#1a1f2b] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 text-[#88c958]" />
                  <span>1. Action Items Export</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-white/10 font-mono">
                    {selectedCardIds.length}/{actionCards.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ratings')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'ratings'
                      ? 'bg-white dark:bg-[#1a1f2b] text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>2. Rate Team Members</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-mono">
                    {enabledMembersCount} Rated
                  </span>
                </button>
              </div>

              {/* Quick Status Info */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Formula:</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200/60 dark:border-amber-800/40">
                  Q (35%) + T (25%) + C (25%) + Col (15%)
                </span>
              </div>
            </div>

            {/* TAB 1: ACTION ITEMS EXPORT */}
            {activeTab === 'actions' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                {/* Destination Project & Sprint Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#12151c] border border-slate-200/90 dark:border-white/[0.08]">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Target Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        const newProjId = e.target.value;
                        setSelectedProjectId(newProjId);
                        const p = projects.find((proj) => proj.id === newProjId);
                        if (p) {
                          const sugg = getSuggestedSprint(p.id);
                          setSelectedSprintId(sugg?.id || p.sprints[0]?.id || '');
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#141720] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958] cursor-pointer"
                    >
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id} className="dark:bg-[#141720]">
                          {proj.name} ({proj.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Target Sprint
                      </label>
                      <span className="text-[10px] text-[#3d8318] dark:text-[#88c958] font-bold bg-[#eaf5e3] dark:bg-[#88c958]/20 px-2 py-0.5 rounded border border-[#cdeac0] dark:border-[#88c958]/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#88c958]" />
                        Dedicated Sprint
                      </span>
                    </div>
                    <select
                      value={selectedSprintId || suggestedSprint?.id || ''}
                      onChange={(e) => setSelectedSprintId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#141720] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#88c958]/30 focus:border-[#88c958] cursor-pointer"
                    >
                      {selectedProject?.sprints.map((sp) => (
                        <option key={sp.id} value={sp.id} className="dark:bg-[#141720]">
                          {sp.name} [{sp.status.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Items List Header & Select All */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ListFilter className="w-3.5 h-3.5 text-[#88c958]" />
                      Select Action Items to Export ({selectedCardIds.length}/{actionCards.length})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eaf5e3] dark:bg-[#88c958]/20 text-[#3d8318] dark:text-[#88c958] border border-[#cdeac0] dark:border-[#88c958]/30">
                      {selectedCardIds.length} Selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-bold text-[#88c958] hover:text-[#96dc63] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isAllSelected ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-[#88c958]" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select All</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Scrollable list of items */}
                <div className="max-h-60 overflow-y-auto space-y-2 p-1.5 border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0e1015]">
                  {actionCards.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No action items found on board.</p>
                      <p>Switch to Tab 2 to evaluate team members with Star Ratings.</p>
                    </div>
                  ) : (
                    actionCards.map((card) => {
                      const isSelected = selectedCardIds.includes(card.id);
                      const cfg = itemConfigs[card.id] || {
                        assigneeName: '',
                        storyPoints: 3,
                        priority: 'high',
                      };

                      return (
                        <div
                          key={card.id}
                          className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                            isSelected
                              ? 'bg-[#eaf5e3]/40 dark:bg-[#88c958]/10 border-[#cdeac0]/90 dark:border-[#88c958]/30 shadow-2xs'
                              : 'bg-slate-50/50 dark:bg-[#12151c]/40 border-slate-200/70 dark:border-white/[0.05] opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCard(card.id)}
                              className="mt-1 w-4 h-4 rounded text-[#88c958] border-slate-300 dark:border-white/20 dark:bg-[#141720] focus:ring-[#88c958] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                {card.text}
                              </p>
                              {card.author && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                  Raised by: <span className="font-semibold text-slate-600 dark:text-slate-300">{card.author}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex flex-wrap items-center gap-2 pl-7 pt-1 border-t border-[#cdeac0]/80 dark:border-white/[0.08]">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                <select
                                  value={cfg.assigneeName}
                                  onChange={(e) =>
                                    handleUpdateItemConfig(card.id, {
                                      assigneeName: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1 bg-white dark:bg-[#141720] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer"
                                >
                                  <option value="" className="dark:bg-[#141720]">Unassigned</option>
                                  {selectedProject?.members?.map((m) => (
                                    <option key={m.id || m.name} value={m.name} className="dark:bg-[#141720]">
                                      {m.name} ({m.role})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <select
                                  value={cfg.priority}
                                  onChange={(e) =>
                                    handleUpdateItemConfig(card.id, {
                                      priority: e.target.value as any,
                                    })
                                  }
                                  className="px-2 py-1 bg-white dark:bg-[#141720] border border-slate-200 dark:border-white/[0.08] rounded-lg text-[11px] text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-[#88c958] cursor-pointer capitalize"
                                >
                                  {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                                    <option key={p} value={p} className="dark:bg-[#141720]">
                                      {p} Priority
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TEAM MEMBER STAR RATINGS */}
            {activeTab === 'ratings' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                {/* Weighted Formula Description Banner */}
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-amber-900 dark:text-amber-300">
                      Mehul Bhai&apos;s Business Weighted Evaluation Model
                    </p>
                    <p className="text-amber-700/90 dark:text-amber-300/80 text-[11px] mt-0.5">
                      Rate team members across 4 key dimensions: <strong>Quality (35%)</strong>,{' '}
                      <strong>Timeliness (25%)</strong>, <strong>Communication (25%)</strong>, and{' '}
                      <strong>Collaboration (15%)</strong>. Calculated live out of 5.0 stars.
                    </p>
                  </div>
                </div>

                {/* Team Members List */}
                <div className="max-h-72 overflow-y-auto space-y-3 p-1 border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#0e1015]">
                  {ratableMembersList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                      No team members found for this retrospective.
                    </div>
                  ) : (
                    ratableMembersList.map((member) => {
                      const ev = memberEvaluations[member.email] || {
                        memberId: member.id,
                        memberName: member.name,
                        memberEmail: member.email,
                        memberRole: member.role,
                        avatar: member.avatar,
                        enabled: true,
                        quality: 4,
                        timeliness: 4,
                        communication: 4,
                        collaboration: 4,
                        feedback: '',
                      };

                      const score = getMemberLiveScore(ev);

                      return (
                        <div
                          key={member.email}
                          className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                            ev.enabled
                              ? 'bg-slate-50/70 dark:bg-[#141720]/80 border-slate-200/90 dark:border-white/[0.08] shadow-2xs'
                              : 'bg-slate-50/20 dark:bg-[#141720]/20 border-slate-200/40 opacity-50'
                          }`}
                        >
                          {/* Member Header: Checkbox + Avatar + Name + Live Score Badge */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={ev.enabled}
                                onChange={(e) =>
                                  handleUpdateMemberEvaluation(member.email, {
                                    enabled: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded text-amber-500 border-slate-300 dark:border-white/20 dark:bg-[#141720] focus:ring-amber-400 cursor-pointer"
                              />

                              <UserAvatar name={member.name} email={member.email} avatar={member.avatar} size="sm" />

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {member.name}
                                  </p>
                                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                    {member.role}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                              </div>
                            </div>

                            {/* Live Weighted Score Badge */}
                            {ev.enabled && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/40 shrink-0">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-black text-amber-900 dark:text-amber-200 font-mono">
                                  {score.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-bold">
                                  / 5.0
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 4 Criteria Star Rows */}
                          {ev.enabled && (
                            <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] space-y-1">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                <StarCriteriaRow
                                  label="🛠️ Quality"
                                  weight="35%"
                                  value={ev.quality}
                                  onChange={(v) => handleUpdateMemberEvaluation(member.email, { quality: v })}
                                />
                                <StarCriteriaRow
                                  label="⏱️ Timeliness"
                                  weight="25%"
                                  value={ev.timeliness}
                                  onChange={(v) => handleUpdateMemberEvaluation(member.email, { timeliness: v })}
                                />
                                <StarCriteriaRow
                                  label="💬 Communication"
                                  weight="25%"
                                  value={ev.communication}
                                  onChange={(v) => handleUpdateMemberEvaluation(member.email, { communication: v })}
                                />
                                <StarCriteriaRow
                                  label="🤝 Collaboration"
                                  weight="15%"
                                  value={ev.collaboration}
                                  onChange={(v) => handleUpdateMemberEvaluation(member.email, { collaboration: v })}
                                />
                              </div>

                              {/* Member Specific Feedback / Notes */}
                              <div className="pt-2">
                                <input
                                  type="text"
                                  value={ev.feedback}
                                  onChange={(e) =>
                                    handleUpdateMemberEvaluation(member.email, {
                                      feedback: e.target.value,
                                    })
                                  }
                                  placeholder="Optional feedback: e.g. Superb sprint delivery, great mentoring."
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#10131a] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default EndSessionExportModal;
